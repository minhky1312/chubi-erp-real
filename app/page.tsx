import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import Dashboard from "@/components/dashboard"
import { DashboardSkeleton } from "@/components/skeletons"

export default async function Home() {
    // const session = await getServerSession()
    //
    // if (!session) {
    //     redirect("/login") // Chuyển hướng nếu chưa đăng nhập
    // }

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
        </Suspense>
    )
}
