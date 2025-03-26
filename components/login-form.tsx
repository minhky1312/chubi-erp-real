"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const loginSchema = z.object({
  email: z.string().email({
    message: "Vui lòng nhập email hợp lệ.",
  }),
  password: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
})

export default function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    try {
      await signIn(values.email, values.password)
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      })
      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Đăng nhập thất bại",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function getErrorMessage(error: any): string {
    const errorCode = error.code
    switch (errorCode) {
      case "auth/invalid-credential":
        return "Email hoặc mật khẩu không chính xác."
      case "auth/user-not-found":
        return "Không tìm thấy tài khoản với email này."
      case "auth/wrong-password":
        return "Mật khẩu không chính xác."
      case "auth/too-many-requests":
        return "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau."
      default:
        return "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-orange dark:border-t-yellow dark:bg-gray-950">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                className="relative w-24 h-24"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2,
                }}
              >
                <Image
                  src="/placeholder.svg?height=96&width=96"
                  alt="Chú Bi BWM Logo"
                  fill
                  className="rounded-full border-4 border-orange dark:border-yellow p-1"
                />
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange dark:text-yellow">Chú Bi BWM</CardTitle>
            <CardDescription className="dark:text-gray-400">Hệ thống Quản lý Công việc</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="login" className="text-base">
                  Đăng nhập
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your.email@example.com"
                              {...field}
                              className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-bold bg-orange text-white hover:bg-orange-light dark:bg-yellow dark:text-orange dark:hover:bg-yellow/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang đăng nhập...
                        </>
                      ) : (
                        "Đăng nhập"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500 dark:text-gray-400">
              <p>Tài khoản demo:</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="font-bold">Admin</p>
                  <p>admin@chubbi.com</p>
                  <p>password123</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="font-bold">Quản lý</p>
                  <p>manager@chubbi.com</p>
                  <p>password123</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="font-bold">Đầu bếp</p>
                  <p>chef@chubbi.com</p>
                  <p>password123</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="font-bold">Nhân viên</p>
                  <p>staff@chubbi.com</p>
                  <p>password123</p>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

