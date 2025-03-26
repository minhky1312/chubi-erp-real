"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import TaskList from "@/components/task-list"
import TaskForm from "@/components/task-form"
import Reports from "@/components/reports"
import MyTasks from "@/components/my-tasks"
import TaskCalendar from "@/components/task-calendar"
import DepartmentManager from "@/components/department-manager"
import Notifications from "@/components/notifications"
import UserManager from "@/components/user-manager"
import Header from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { 
  getTasks, 
  getUsers, 
  getDepartments, 
  getNotifications,
  addTask,
  updateTask,
  addNotification,
  markNotificationAsRead,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  updateUser
} from "@/lib/api"
import type { Task, User, Department, Notification } from "@/lib/types"

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch data from Firestore
        const [tasksData, usersData, departmentsData] = await Promise.all([
          getTasks(),
          getUsers(),
          getDepartments()
        ])

        setTasks(tasksData)
        setUsers(usersData)
        setDepartments(departmentsData)
        
        // Fetch notifications for current user
        if (user) {
          const notificationsData = await getNotifications(user.id)
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, toast])

  // Kiểm tra các công việc sắp đến hạn và tạo thông báo
  useEffect(() => {
    const checkDueTasks = () => {
      if (!user) return
      
      const now = new Date()
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000)

      tasks.forEach(async (task) => {
        // Chỉ xem xét các công việc chưa hoàn thành và chưa gửi nhắc nhở
        if (task.status === "Done" || task.reminderSent) return

        const dueDate = new Date(task.due)
        if (dueDate > now && dueDate <= thirtyMinutesLater) {
          // Tạo thông báo cho người thực hiện
          const newNotification: Omit<Notification, "id"> = {
            userId: task.responsible,
            title: "Công việc sắp đến hạn",
            message: `Công việc "${task.title}" sẽ đến hạn trong vòng 30 phút.`,
            type: "reminder",
            taskId: task.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          }

          try {
            // Add notification to Firestore
            const addedNotification = await addNotification(newNotification)
            setNotifications((prev) => [...prev, addedNotification])

            // Update task to mark reminder as sent
            await updateTask(task.id, { reminderSent: true })
            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, reminderSent: true } : t)))
          } catch (error) {
            console.error("Error creating notification:", error)
          }
        }
      })
    }

    // Kiểm tra mỗi phút
    const interval = setInterval(checkDueTasks, 60000)

    // Kiểm tra ngay khi component mount
    checkDueTasks()

    return () => clearInterval(interval)
  }, [tasks, user])

  const handleAddTask = async (task: Omit<Task, "id">) => {
    try {
      // Add task to Firestore
      const newTask = await addTask(task)
      setTasks((prev) => [...prev, newTask])

      // Create notification for assignee
      const notificationData: Omit<Notification, "id"> = {
        userId: task.responsible,
        title: "Công việc mới được giao",
        message: `Bạn đã được giao công việc "${task.title}".`,
        type: "assignment",
        taskId: newTask.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      }

      const newNotification = await addNotification(notificationData)
      setNotifications((prev) => [...prev, newNotification])

      toast({
        title: "Tạo task thành công",
        description: `Task "${task.title}" đã được tạo.`,
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo công việc. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const oldTask = tasks.find((t) => t.id === updatedTask.id)
      console.log("update task: "+ JSON.stringify(updatedTask))
      if (!oldTask) return
      const { taskId, ...taskData } = updatedTask;
      // Update task in Firestore
      await updateTask(updatedTask.taskId, taskData)
      
      setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))

      // Check if status changed from not Done to Done
      if (oldTask.status !== "Done" && updatedTask.status === "Done") {
        // Create notification for approver
        const notificationData: Omit<Notification, "id"> = {
          userId: oldTask.accountable,
          title: "Yêu cầu phê duyệt công việc",
          message: `Công việc "${oldTask.title}" đã được hoàn thành và đang chờ phê duyệt.`,
          type: "approval",
          taskId: oldTask.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        }

        const newNotification = await addNotification(notificationData)
        setNotifications((prev) => [...prev, newNotification])
      }

      // Handle sequential task notifications
      if (oldTask.isSequential && oldTask.assignees && updatedTask.assignees) {
        // Check if any assignee status changed from incomplete to complete
        const completedIndex = oldTask.assignees.findIndex(
          (a, i) => !a.isCompleted && updatedTask.assignees![i].isCompleted,
        )

        if (completedIndex >= 0 && completedIndex < oldTask.assignees.length - 1) {
          // Notify the next assignee
          const nextAssignee = users.find((u) => u.id === oldTask.assignees![completedIndex + 1].userId)
          if (nextAssignee) {
            // Create notification for next assignee
            const notificationData: Omit<Notification, "id"> = {
              userId: nextAssignee.id,
              title: "Công việc mới",
              message: `Bạn có thể bắt đầu công việc "${oldTask.title}" bây giờ.`,
              type: "assignment",
              taskId: oldTask.id,
              isRead: false,
              createdAt: new Date().toISOString(),
            }

            const newNotification = await addNotification(notificationData)
            setNotifications((prev) => [...prev, newNotification])

            toast({
              title: "Công việc mới",
              description: `${nextAssignee.name} có thể bắt đầu công việc "${oldTask.title}" bây giờ.`,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật công việc. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleApproveTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task || !user) return

      const approvedTask = {
        ...task,
        isApproved: true,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      }

      // Update task in Firestore
      await updateTask(taskId, {
        isApproved: true,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      })

      setTasks((prev) => prev.map((t) => (t.id === taskId ? approvedTask : t)))

      // Create notification for assignee
      const notificationData: Omit<Notification, "id"> = {
        userId: task.responsible,
        title: "Công việc đã được phê duyệt",
        message: `Công việc "${task.title}" đã được phê duyệt bởi ${user.name}.`,
        type: "completion",
        taskId: task.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      }

      const newNotification = await addNotification(notificationData)
      setNotifications((prev) => [...prev, newNotification])

      toast({
        title: "Phê duyệt thành công",
        description: `Công việc "${task.title}" đã được phê duyệt.`,
      })
    } catch (error) {
      console.error("Error approving task:", error)
      toast({
        title: "Lỗi",
        description: "Không thể phê duyệt công việc. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleAddDepartment = async (department: Omit<Department, "id">) => {
    try {
      // Add department to Firestore
      const newDepartment = await addDepartment(department)
      setDepartments((prev) => [...prev, newDepartment])
      
      toast({
        title: "Tạo phòng ban thành công",
        description: `Phòng ban "${department.name}" đã được tạo.`,
      })
    } catch (error) {
      console.error("Error adding department:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo phòng ban. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDepartment = async (updatedDepartment: Department) => {
    try {
      // Update department in Firestore
      await updateDepartment(updatedDepartment.id, updatedDepartment)
      setDepartments((prev) => prev.map((dept) => (dept.id === updatedDepartment.id ? updatedDepartment : dept)))
      
      toast({
        title: "Cập nhật phòng ban thành công",
        description: `Phòng ban "${updatedDepartment.name}" đã được cập nhật.`,
      })
    } catch (error) {
      console.error("Error updating department:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phòng ban. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      // Delete department from Firestore
      await deleteDepartment(departmentId)
      setDepartments((prev) => prev.filter((dept) => dept.id !== departmentId))
      
      toast({
        title: "Xóa phòng ban thành công",
        description: "Phòng ban đã được xóa.",
      })
    } catch (error) {
      console.error("Error deleting department:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa phòng ban. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUserDepartment = async (userId: string, departmentName: string) => {
    try {
      // Update user in Firestore
      await updateUser(userId, { dept: departmentName })
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, dept: departmentName } : user)))
      
      toast({
        title: "Cập nhật nhân viên thành công",
        description: `Nhân viên đã được chuyển đến phòng ban "${departmentName}".`,
      })
    } catch (error) {
      console.error("Error updating user department:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phòng ban cho nhân viên. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      // Mark notification as read in Firestore
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-orange text-xl">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        notifications={notifications.filter(n => n.userId === user.id)}
        onMarkAsRead={handleMarkNotificationAsRead}
        onApproveTask={handleApproveTask}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="tasks">
          <TabsList className="mb-8 bg-white p-1 rounded-full shadow-md border-2 border-orange/20">
            {hasPermission("create_tasks") && (
            <TabsTrigger
              value="tasks"
              className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
            >
              Tất cả công việc
            </TabsTrigger>
            )}
            <TabsTrigger
              value="my-tasks"
              className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
            >
              Công việc của tôi
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
            >
              Lịch
            </TabsTrigger>
            {hasPermission("create_tasks") && (
              <TabsTrigger
                value="create"
                className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
              >
                Tạo công việc
              </TabsTrigger>
            )}
            {hasPermission("view_reports") && (
              <TabsTrigger
                value="reports"
                className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
              >
                Báo cáo
              </TabsTrigger>
            )}
            {hasPermission("manage_departments") && (
              <TabsTrigger
                value="departments"
                className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
              >
                Quản lý phòng ban
              </TabsTrigger>
            )}
            {hasPermission("echo \"# chubi-erp-real\" >> README.md") && (
              <TabsTrigger
                value="users"
                className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
              >
                Quản lý người dùng
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tasks">
            <TaskList tasks={tasks} users={users} onUpdateTask={handleUpdateTask} />
          </TabsContent>

          <TabsContent value="my-tasks">
            <MyTasks
              tasks={tasks.filter((task) => {
                // Include tasks where user is directly responsible
                if (task.responsible === user.id) return true

                // Include sequential tasks where user is an assignee
                if (task.isSequential && task.assignees) {
                  return task.assignees.some((a) => a.userId === user.id)
                }

                return false
              })}
              users={users}
              onUpdateTask={handleUpdateTask}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <TaskCalendar tasks={tasks} users={users} />
          </TabsContent>

          {hasPermission("create_tasks") && (
            <TabsContent value="create">
              <TaskForm users={users} departments={departments} onAddTask={handleAddTask} />
            </TabsContent>
          )}

          {hasPermission("view_reports") && (
            <TabsContent value="reports">
              <Reports tasks={tasks} users={users} departments={departments} />
            </TabsContent>
          )}

          {hasPermission("manage_departments") && (
            <TabsContent value="departments">
              <DepartmentManager
                departments={departments}
                users={users}
                onAddDepartment={handleAddDepartment}
                onUpdateDepartment={handleUpdateDepartment}
                onDeleteDepartment={handleDeleteDepartment}
                onUpdateUserDepartment={handleUpdateUserDepartment}
              />
            </TabsContent>
          )}

          {hasPermission("manage_users") && (
            <TabsContent value="users">
              <UserManager users={users} departments={departments} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}

