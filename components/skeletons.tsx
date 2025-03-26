import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-orange to-yellow shadow-lg dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="ml-4 h-4 w-32 bg-white/20" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-32 bg-white/20" />
              <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-full max-w-md mb-8 bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-5 w-20 bg-gray-200 dark:bg-gray-700" />
                </div>
                <Skeleton className="h-4 w-40 mt-1 bg-gray-200 dark:bg-gray-700" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700" />

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full bg-gray-200 dark:bg-gray-700" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

export function TaskDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
        </div>
        <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-6 w-40 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-40 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-8 w-full bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-8 w-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-24 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-10 w-24 bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}

export function UserListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-10 w-32 bg-gray-200 dark:bg-gray-700" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-64 bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

