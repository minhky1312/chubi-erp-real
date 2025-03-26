import type { Metadata } from "next"
import LoginForm from "@/components/login-form"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào hệ thống quản lý công việc Chú Bi BWM",
}

export default function LoginPage() {
  return <LoginForm />
}

