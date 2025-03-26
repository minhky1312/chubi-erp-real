"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, User, Department, Badge as BadgeType } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Award, Plus, Star, Trophy, Target, Zap, Clock, CheckCircle2 } from "lucide-react"

interface ReportsProps {
  tasks: Task[]
  users: User[]
  departments: Department[]
}

export default function Reports({ tasks, users, departments }: ReportsProps) {
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [badgeName, setBadgeName] = useState("")
  const [badgeDescription, setBadgeDescription] = useState("")
  const [badgeIcon, setBadgeIcon] = useState("award")
  const [badgeColor, setBadgeColor] = useState("orange")
  const [badgeCriteriaType, setBadgeCriteriaType] = useState<"taskCount" | "performance">("taskCount")
  const [badgeCriteriaThreshold, setBadgeCriteriaThreshold] = useState(5)

  // Calculate position reports
  const positionReports = users
    .map((user) => {
      const userTasks = tasks.filter((task) => task.responsible === user.id)
      const completed = userTasks.filter((task) => task.status === "Done").length
      const total = userTasks.length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      const onTime = userTasks.filter((task) => {
        const isDone = task.status === "Done"
        const dueDate = new Date(task.due)
        return isDone && dueDate >= new Date()
      }).length
      const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        dept: user.dept,
        completed,
        total,
        completionRate,
        onTime,
        onTimeRate,
      }
    })
    .filter((report) => report.total > 0)

  // Calculate department reports
  const departmentNames = [...new Set(users.map((user) => user.dept))]
  const departmentReports = departmentNames
    .map((dept) => {
      const deptTasks = tasks.filter((task) => task.dept === dept)
      const completed = deptTasks.filter((task) => task.status === "Done").length
      const total = deptTasks.length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      const overdue = deptTasks.filter((task) => task.status === "Overdue").length

      return {
        dept,
        completed,
        total,
        completionRate,
        overdue,
      }
    })
    .filter((report) => report.total > 0)

  // Calculate overall status distribution
  const statusCounts = tasks.reduce(
    (acc, task) => {
      const statusText =
        task.status === "Done"
          ? "Hoàn thành"
          : task.status === "In Progress"
            ? "Đang làm"
            : task.status === "Overdue"
              ? "Quá hạn"
              : "Cần làm"
      acc[statusText] = (acc[statusText] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }))

  // Calculate overall department completion
  const overallDeptCompletion = departmentReports.map((dept) => ({
    name: dept.dept,
    value: dept.completionRate,
  }))

  const COLORS = ["#63b842", "#fd6f28", "#f9e840", "#f37021", "#b36dae", "#fedf8b"]

  const handleCreateBadge = () => {
    if (!selectedUser || !badgeName) return

    const newBadge: BadgeType = {
      id: `badge-${Date.now()}`,
      name: badgeName,
      description: badgeDescription,
      icon: badgeIcon,
      color: badgeColor,
      criteria: {
        type: badgeCriteriaType,
        threshold: badgeCriteriaThreshold,
      },
    }

    // Trong thực tế, bạn sẽ cập nhật dữ liệu người dùng thông qua API
    console.log("Created badge:", newBadge, "for user:", selectedUser.name)

    // Reset form
    setBadgeName("")
    setBadgeDescription("")
    setBadgeIcon("award")
    setBadgeColor("orange")
    setBadgeCriteriaType("taskCount")
    setBadgeCriteriaThreshold(5)
    setSelectedUser(null)
    setShowBadgeDialog(false)
  }

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "award":
        return <Award className="h-5 w-5" />
      case "star":
        return <Star className="h-5 w-5" />
      case "trophy":
        return <Trophy className="h-5 w-5" />
      case "target":
        return <Target className="h-5 w-5" />
      case "zap":
        return <Zap className="h-5 w-5" />
      case "clock":
        return <Clock className="h-5 w-5" />
      case "check":
        return <CheckCircle2 className="h-5 w-5" />
      default:
        return <Award className="h-5 w-5" />
    }
  }

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case "orange":
        return "bg-orange text-white"
      case "green":
        return "bg-green text-white"
      case "yellow":
        return "bg-yellow text-orange"
      case "purple":
        return "bg-purple text-white"
      case "orange-light":
        return "bg-orange-light text-white"
      case "yellow-light":
        return "bg-yellow-light text-orange"
      default:
        return "bg-orange text-white"
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-6 text-orange">Báo cáo hiệu suất</h2>
        <Button onClick={() => setShowBadgeDialog(true)} className="bg-purple text-white hover:bg-purple/80">
          <Award className="mr-2 h-5 w-5" />
          Tạo huy hiệu
        </Button>
      </div>

      <Tabs defaultValue="overall">
        <TabsList className="bg-white p-1 rounded-full shadow-md border-2 border-orange/20">
          <TabsTrigger
            value="overall"
            className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="position"
            className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
          >
            Theo nhân viên
          </TabsTrigger>
          <TabsTrigger
            value="department"
            className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
          >
            Theo phòng ban
          </TabsTrigger>
          <TabsTrigger
            value="badges"
            className="rounded-full px-6 py-3 data-[state=active]:bg-orange data-[state=active]:text-white"
          >
            Huy hiệu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-t-4 border-t-orange">
              <CardHeader className="bg-gradient-to-r from-yellow-light to-orange-light pb-2">
                <CardTitle className="text-white">Phân bố trạng thái công việc</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-t-green">
              <CardHeader className="bg-gradient-to-r from-yellow to-green pb-2">
                <CardTitle className="text-white">Tỷ lệ hoàn thành theo phòng ban</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentReports}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dept" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completionRate" name="Tỷ lệ hoàn thành (%)" fill="#b36dae" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="position" className="pt-6">
          <Card className="shadow-lg border-t-4 border-t-purple">
            <CardHeader className="bg-gradient-to-r from-purple to-orange-light pb-2">
              <CardTitle className="text-white">Hiệu suất theo nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={positionReports}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => {
                        return [`${value}%`, name]
                      }}
                      labelFormatter={(label) => {
                        const user = positionReports.find((r) => r.name === label)
                        return `${user?.dept} - ${user?.name} (${user?.role})`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completionRate" name="Tỷ lệ hoàn thành (%)" fill="#fd6f28" />
                    <Bar dataKey="onTimeRate" name="Tỷ lệ đúng hạn (%)" fill="#63b842" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-purple">Báo cáo chi tiết theo nhân viên</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chức vụ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phòng ban
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hoàn thành
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tổng số
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tỷ lệ hoàn thành
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tỷ lệ đúng hạn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {positionReports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {report.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.dept}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.completionRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.onTimeRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              size="sm"
                              className="bg-purple text-white hover:bg-purple/80"
                              onClick={() => {
                                const user = users.find((u) => u.id === report.id)
                                if (user) {
                                  setSelectedUser(user)
                                  setShowBadgeDialog(true)
                                }
                              }}
                            >
                              <Award className="h-4 w-4 mr-1" />
                              Tạo huy hiệu
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="pt-6">
          <Card className="shadow-lg border-t-4 border-t-yellow">
            <CardHeader className="bg-gradient-to-r from-yellow to-yellow-light pb-2">
              <CardTitle className="text-orange">Hiệu suất theo phòng ban</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentReports}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dept" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" name="Tỷ lệ hoàn thành (%)" fill="#b36dae" />
                    <Bar dataKey="overdue" name="Số công việc quá hạn" fill="#f37021" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-yellow">Báo cáo chi tiết theo phòng ban</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phòng ban
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hoàn thành
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tổng số
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tỷ lệ hoàn thành
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số công việc quá hạn
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departmentReports.map((report) => (
                        <tr key={report.dept}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {report.dept}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.completionRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.overdue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="pt-6">
          <Card className="shadow-lg border-t-4 border-t-purple">
            <CardHeader className="bg-gradient-to-r from-purple to-yellow pb-2">
              <CardTitle className="text-white">Huy hiệu thành tích</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-orange to-orange-light pb-2">
                    <CardTitle className="text-white text-lg flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Siêu sao hoàn thành
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm mb-4">Hoàn thành 10 công việc đúng hạn liên tiếp</p>
                    <div className="flex flex-wrap gap-2">
                      {users.slice(0, 3).map((user) => (
                        <Badge key={user.id} className="bg-orange text-white">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-green to-yellow-light pb-2">
                    <CardTitle className="text-white text-lg flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Tia chớp nhanh nhẹn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm mb-4">Hoàn thành công việc sớm hơn hạn 24 giờ</p>
                    <div className="flex flex-wrap gap-2">
                      {users.slice(1, 4).map((user) => (
                        <Badge key={user.id} className="bg-green text-white">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple to-orange pb-2">
                    <CardTitle className="text-white text-lg flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Chuyên gia hiệu suất
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm mb-4">Đạt tỷ lệ hoàn thành trên 90%</p>
                    <div className="flex flex-wrap gap-2">
                      {users.slice(2, 5).map((user) => (
                        <Badge key={user.id} className="bg-purple text-white">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-yellow to-orange-light pb-2">
                    <CardTitle className="text-white text-lg flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Người hỗ trợ tích cực
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm mb-4">Tham gia hỗ trợ trên 5 công việc của người khác</p>
                    <div className="flex flex-wrap gap-2">
                      {users.slice(3, 6).map((user) => (
                        <Badge key={user.id} className="bg-yellow text-orange">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-orange-light to-yellow-light pb-2">
                    <CardTitle className="text-white text-lg flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Người quản lý thời gian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm mb-4">Không có công việc quá hạn trong 30 ngày</p>
                    <div className="flex flex-wrap gap-2">
                      {users.slice(4, 7).map((user) => (
                        <Badge key={user.id} className="bg-orange-light text-white">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-2 border-dashed border-purple/50 bg-purple/5 flex flex-col items-center justify-center p-6">
                  <Plus className="h-12 w-12 text-purple/50 mb-2" />
                  <p className="text-center text-purple/70 mb-4">Tạo huy hiệu mới</p>
                  <Button onClick={() => setShowBadgeDialog(true)} className="bg-purple text-white hover:bg-purple/80">
                    <Award
                      className="mr-2 h-
5 w-5"
                    />
                    Tạo huy hiệu
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog tạo huy hiệu */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple text-xl">Tạo huy hiệu mới</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Tạo huy hiệu cho ${selectedUser.name} (${selectedUser.role})`
                : "Tạo huy hiệu mới cho nhân viên"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedUser && (
              <div>
                <label className="text-sm font-medium">Chọn nhân viên</label>
                <Select
                  onValueChange={(value) => {
                    const user = users.find((u) => u.id === value)
                    if (user) setSelectedUser(user)
                  }}
                >
                  <SelectTrigger className="h-10 border-2 border-gray-300 focus-visible:border-purple">
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Tên huy hiệu</label>
              <Input
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="Ví dụ: Siêu sao hoàn thành"
                className="h-10 border-2 border-gray-300 focus-visible:border-purple"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={badgeDescription}
                onChange={(e) => setBadgeDescription(e.target.value)}
                placeholder="Mô tả về huy hiệu này"
                className="border-2 border-gray-300 focus-visible:border-purple"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Biểu tượng</label>
                <Select value={badgeIcon} onValueChange={setBadgeIcon}>
                  <SelectTrigger className="h-10 border-2 border-gray-300 focus-visible:border-purple">
                    <SelectValue>
                      <div className="flex items-center">
                        {getBadgeIcon(badgeIcon)}
                        <span className="ml-2">{badgeIcon}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="award">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        <span>award</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="star">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        <span>star</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="trophy">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2" />
                        <span>trophy</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="target">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        <span>target</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="zap">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        <span>zap</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="clock">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>clock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="check">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span>check</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Màu sắc</label>
                <Select value={badgeColor} onValueChange={setBadgeColor}>
                  <SelectTrigger className="h-10 border-2 border-gray-300 focus-visible:border-purple">
                    <SelectValue>
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full ${getBadgeColorClass(badgeColor)}`}></div>
                        <span className="ml-2">{badgeColor}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-orange"></div>
                        <span className="ml-2">orange</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="green">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-green"></div>
                        <span className="ml-2">green</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="yellow">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-yellow"></div>
                        <span className="ml-2">yellow</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="purple">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-purple"></div>
                        <span className="ml-2">purple</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="orange-light">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-orange-light"></div>
                        <span className="ml-2">orange-light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="yellow-light">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-yellow-light"></div>
                        <span className="ml-2">yellow-light</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Loại tiêu chí</label>
              <Select
                value={badgeCriteriaType}
                onValueChange={(value: "taskCount" | "performance") => setBadgeCriteriaType(value)}
              >
                <SelectTrigger className="h-10 border-2 border-gray-300 focus-visible:border-purple">
                  <SelectValue>{badgeCriteriaType === "taskCount" ? "Số lượng công việc" : "Hiệu suất"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="taskCount">Số lượng công việc</SelectItem>
                  <SelectItem value="performance">Hiệu suất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Ngưỡng đạt được</label>
              <Input
                type="number"
                value={badgeCriteriaThreshold}
                onChange={(e) => setBadgeCriteriaThreshold(Number(e.target.value))}
                placeholder={badgeCriteriaType === "taskCount" ? "Số công việc" : "Tỷ lệ phần trăm"}
                className="h-10 border-2 border-gray-300 focus-visible:border-purple"
              />
              <p className="text-xs text-gray-500 mt-1">
                {badgeCriteriaType === "taskCount"
                  ? "Số lượng công việc cần hoàn thành để đạt huy hiệu"
                  : "Tỷ lệ phần trăm hiệu suất cần đạt được (%)"}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Xem trước huy hiệu:</p>
              <div className="flex items-center space-x-2">
                <Badge className={`${getBadgeColorClass(badgeColor)} px-3 py-1`}>
                  <div className="flex items-center">
                    {getBadgeIcon(badgeIcon)}
                    <span className="ml-2">{badgeName || "Tên huy hiệu"}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBadgeDialog(false)} className="border-gray-300">
              Hủy
            </Button>
            <Button
              onClick={handleCreateBadge}
              className="bg-purple text-white hover:bg-purple/80"
              disabled={!selectedUser || !badgeName}
            >
              <Award className="mr-2 h-5 w-5" />
              Tạo huy hiệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

