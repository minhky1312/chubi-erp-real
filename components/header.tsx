"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import Notifications from "@/components/notifications"
import { LogOut, Sun, Moon, Bell, UserIcon, Settings, HelpCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import type { User, Notification } from "@/lib/types"
import { subscribeToNotifications, markAllNotificationsAsRead } from "@/lib/api"

interface HeaderProps {
  user: User
  onMarkAsRead: (notificationId: string) => void
  onApproveTask: (taskId: string) => void
}

export default function Header({ user, onMarkAsRead, onApproveTask }: HeaderProps) {
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    // Subscribe to notifications for real-time updates
    const unsubscribe = subscribeToNotifications(user.id, (updatedNotifications) => {
      setNotifications(updatedNotifications)
      setUnreadCount(updatedNotifications.filter((n) => !n.isRead).length)
    })

    return () => unsubscribe()
  }, [user.id])

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect happens automatically via middleware
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id)
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  return (
    <header className="bg-gradient-to-r from-orange to-yellow shadow-lg dark:from-gray-800 dark:to-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.h1
              className="text-2xl font-bold text-white dark:text-yellow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Chú Bi béo BWM
            </motion.h1>
            <motion.p
              className="ml-4 text-sm text-white/80 dark:text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Hệ thống Quản lý Công việc
            </motion.p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-sm text-white dark:text-gray-200">
              Xin chào, {user.dept} - {user.name} ({user.role})
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 dark:text-gray-200">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-7">
                      Đánh dấu tất cả đã đọc
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  <Notifications
                    notifications={notifications}
                    currentUser={user}
                    tasks={[]} // This will be populated from props in a real implementation
                    onMarkAsRead={onMarkAsRead}
                    onApproveTask={onApproveTask}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white hover:bg-white/10 dark:text-gray-200"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center space-x-2 text-white hover:bg-white/10 dark:text-gray-200"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-yellow text-orange dark:bg-orange dark:text-yellow">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Trợ giúp</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

