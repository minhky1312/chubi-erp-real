"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Notification, Task, User } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NotificationsProps {
  notifications: Notification[]
  currentUser: User
  tasks: Task[]
  onMarkAsRead: (notificationId: string) => void
  onApproveTask: (taskId: string) => void
}

export default function Notifications({
  notifications,
  currentUser,
  tasks,
  onMarkAsRead,
  onApproveTask,
}: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [dueSoonTasks, setDueSoonTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState("all")

  // Lọc thông báo cho người dùng hiện tại
  const userNotifications = notifications
    .filter((notification) => notification.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Áp dụng bộ lọc
  const filteredNotifications = userNotifications.filter((notification) => {
    if (filter === "all") return true
    if (filter === "unread") return !notification.isRead
    return notification.type === filter
  })

  // Đếm số thông báo chưa đọc
  useEffect(() => {
    setUnreadCount(userNotifications.filter((notification) => !notification.isRead).length)
  }, [userNotifications])

  // Kiểm tra các công việc sắp đến hạn
  useEffect(() => {
    const now = new Date()
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000)

    const dueTasksForUser = tasks.filter((task) => {
      // Chỉ xem xét các công việc của người dùng hiện tại
      if (task.responsible !== currentUser.id) return false

      // Chỉ xem xét các công việc chưa hoàn thành
      if (task.status === "Done") return false

      // Kiểm tra xem công việc có đến hạn trong vòng 30 phút không
      const dueDate = new Date(task.due)
      return dueDate > now && dueDate <= thirtyMinutesLater && !task.reminderSent
    })

    if (dueTasksForUser.length > 0) {
      setDueSoonTasks(dueTasksForUser)
      setShowReminder(true)
    }
  }, [tasks, currentUser.id])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-5 w-5 text-yellow" />
      case "approval":
        return <Check className="h-5 w-5 text-green" />
      case "completion":
        return <Check className="h-5 w-5 text-green" />
      case "assignment":
        return <AlertTriangle className="h-5 w-5 text-orange" />
      case "feedback":
        return <AlertTriangle className="h-5 w-5 text-purple" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "bg-yellow text-white"
      case "approval":
        return "bg-green text-white"
      case "completion":
        return "bg-green text-white"
      case "assignment":
        return "bg-orange text-white"
      case "feedback":
        return "bg-purple text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const handleDismissReminder = () => {
    setShowReminder(false)
  }

  return (
    <div className="relative">
      {/* Nút thông báo */}
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white animate-pulse-notification">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Popup thông báo */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 sm:w-96 z-50 shadow-lg border-t-4 border-t-orange">
          <CardHeader className="bg-gradient-to-r from-yellow-light to-orange-light py-2">
            <CardTitle className="text-white text-lg flex justify-between items-center">
              <span>Thông báo</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 text-white hover:bg-orange/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-3">
              <Select defaultValue={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Lọc thông báo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unread">Chưa đọc</SelectItem>
                  <SelectItem value="assignment">Công việc mới</SelectItem>
                  <SelectItem value="reminder">Nhắc nhở</SelectItem>
                  <SelectItem value="approval">Phê duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 ${!notification.isRead ? "bg-yellow-light/10" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMarkAsRead(notification.id)}
                                className="h-6 text-xs text-orange hover:text-orange-light"
                              >
                                Đánh dấu đã đọc
                              </Button>
                            )}
                          </div>
                          {notification.type === "approval" && notification.taskId && (
                            <Button
                              size="sm"
                              onClick={() => onApproveTask(notification.taskId!)}
                              className="mt-2 h-8 w-full bg-green text-white hover:bg-green/80"
                            >
                              Phê duyệt công việc
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Bell className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">Không có thông báo nào</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Thông báo nhắc nhở công việc sắp đến hạn */}
      {showReminder && dueSoonTasks.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Card className="shadow-lg border-l-4 border-l-orange animate-slide-in-right">
            <CardHeader className="bg-gradient-to-r from-yellow-light to-orange-light py-2">
              <CardTitle className="text-white text-lg flex justify-between items-center">
                <span>Nhắc nhở công việc</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismissReminder}
                  className="h-6 w-6 text-white hover:bg-orange/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Bạn có {dueSoonTasks.length} công việc sắp đến hạn trong 30 phút tới:
                </p>
                {dueSoonTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-yellow-light/10 rounded-md">
                    <Clock className="h-5 w-5 text-orange flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600">Hạn: {new Date(task.due).toLocaleTimeString("vi-VN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

