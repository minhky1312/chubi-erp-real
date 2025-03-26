"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/lib/types"
import { setCookie, deleteCookie } from "cookies-next"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  createUser: (email: string, password: string, userData: Partial<User>) => Promise<User>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          const fullUser = {
            ...userData,
            id: firebaseUser.uid,
          }
          setUser(fullUser)

          // Set auth cookie for server-side auth check
          setCookie("auth", "true", {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })
        } else {
          // If user document doesn't exist in Firestore, create a basic one
          const basicUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            role: "Nhân viên",
            dept: "Chưa phân công",
            permissions: ["view_tasks"],
          }

          await setDoc(doc(db, "users", firebaseUser.uid), basicUser)
          setUser(basicUser)

          // Set auth cookie for server-side auth check
          setCookie("auth", "true", {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })
        }
      } else {
        setUser(null)
        // Remove auth cookie
        deleteCookie("auth")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (!userDoc.exists()) {
        throw new Error("User data not found")
      }

      const userData = userDoc.data() as User
      return { ...userData, id: userCredential.user.uid }
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth)
      deleteCookie("auth")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const createUser = async (email: string, password: string, userData: Partial<User>): Promise<User> => {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Update the user's display name if provided
      if (userData.name) {
        await updateProfile(firebaseUser, {
          displayName: userData.name,
        })
      }

      // Create a user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name || "User",
        email: firebaseUser.email || email,
        role: userData.role || "Nhân viên",
        dept: userData.dept || "Chưa phân công",
        permissions: userData.permissions || ["view_tasks"],
      }

      await setDoc(doc(db, "users", firebaseUser.uid), newUser)
      return newUser
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.permissions?.includes("admin")) return true
    return user.permissions?.includes(permission) || false
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    createUser,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

