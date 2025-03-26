"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import type { Task, User, TaskComment, TaskFeedback } from "@/lib/types"
import { formatDate, getStatusText, getPriorityText } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Filter,
  Users,
  MessageSquare,
  Link2,
  Star,
  ThumbsUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TaskListProps {
  tasks: Task[]
  users: User[]
  onUpdateTask: (task: Task) => void
}

export default function TaskList({ tasks, users, onUpdateTask }: TaskListProps) {
  const [filter, setFilter] = useState<string>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [openAssigneesDialog, setOpenAssigneesDialog] = useState(false)
  const [openCommentsDialog, setOpenCommentsDialog] = useState(false)
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState("")
  // Thay đổi để hiển thị chi tiết công việc khi nhấp vào
  // Thêm state và dialog mới
  const [openTaskDetailDialog, setOpenTaskDetailDialog] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle2 className="h-5 w-5 text-green" />
      case "In Progress":
        return <PlayCircle className="h-5 w-5 text-orange" />
      case "Overdue":
        return <AlertCircle className="h-5 w-5 text-orange-light" />
      default:
        return <Clock className="h-5 w-5 text-purple" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green text-white"
      case "In Progress":
        return "bg-orange text-white"
      case "Overdue":
        return "bg-orange-light text-white"
      default:
        return "bg-purple text-white"
    }
  }

  const getUserById = (id: string) => {
    return users.find((user) => user.id === id)
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      onUpdateTask({ ...task, status: newStatus })
    }
  }

  const handleCheckboxChange = (taskId: string, isChecked: boolean) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!taskId) {
      console.log("Error: taskId is undefined or null");
      return;
    } else {
      console.log("ID:"+ taskId);
    }

    if (task) {
      onUpdateTask({ ...task, status: isChecked ? "Done" : "To Do" })
    }
  }

  const handleApproveTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      onUpdateTask({
        ...task,
        isApproved: true,
        approvedBy: "user2", // Current user ID
        approvedAt: new Date().toISOString(),
      })
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter !== "all" && task.status !== filter) return false
    if (deptFilter !== "all" && task.dept !== deptFilter) return false
    return true
  })

  // Get unique departments from tasks
  const departments = [...new Set(tasks.map((task) => task.dept))]

  const openAssignees = (task: Task) => {
    setSelectedTask(task)
    setOpenAssigneesDialog(true)
  }

  const openComments = (task: Task) => {
    setSelectedTask(task)
    setNewComment("")
    setOpenCommentsDialog(true)
  }

  const openFeedback = (task: Task) => {
    setSelectedTask(task)
    setFeedbackRating(5)
    setFeedbackComment("")
    setOpenFeedbackDialog(true)
  }

  const getSequentialProgress = (task: Task): number => {
    if (!task.isSequential || !task.assignees || task.assignees.length === 0) {
      return 0
    }

    const completedCount = task.assignees.filter((a) => a.isCompleted).length
    return Math.round((completedCount / task.assignees.length) * 100)
  }

  const handleAddComment = () => {
    if (!selectedTask || !newComment.trim()) return

    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      userId: "user2", // Current user ID
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedTask = {
      ...selectedTask,
      comments: selectedTask.comments ? [...selectedTask.comments, comment] : [comment],
    }

    onUpdateTask(updatedTask)
    setNewComment("")
    setSelectedTask(updatedTask)
  }

  const handleSubmitFeedback = () => {
    if (!selectedTask) return

    const feedback: TaskFeedback = {
      id: `feedback-${Date.now()}`,
      userId: "user2", // Current user ID
      rating: feedbackRating,
      comment: feedbackComment.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedTask = {
      ...selectedTask,
      feedback,
    }

    onUpdateTask(updatedTask)
    setOpenFeedbackDialog(false)
  }

  // Thêm hàm mở dialog chi tiết công việc
  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setOpenTaskDetailDialog(true)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-orange">Tất cả công việc</h2>

      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-orange" />
          <span className="text-sm font-medium">Trạng thái:</span>
          <Select defaultValue={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-2 border-orange">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="To Do" className="text-purple">
                Cần làm
              </SelectItem>
              <SelectItem value="In Progress" className="text-orange">
                Đang làm
              </SelectItem>
              <SelectItem value="Done" className="text-green">
                Hoàn thành
              </SelectItem>
              <SelectItem value="Overdue" className="text-orange-light">
                Quá hạn
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-green" />
          <span className="text-sm font-medium">Phòng ban:</span>
          <Select defaultValue={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px] border-2 border-green">
              <SelectValue placeholder="Lọc theo phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const responsible = getUserById(task.responsible)
            const accountable = getUserById(task.accountable)

            return (
              <Card
                key={task.id}
                className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange cursor-pointer"
                onClick={() => openTaskDetail(task)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.status === "Done"}
                        onCheckedChange={(checked) => handleCheckboxChange(task.id, checked as boolean)}
                        className="h-5 w-5 border-2 border-orange data-[state=checked]:bg-green data-[state=checked]:border-green"
                      />
                      <CardTitle
                        className={`text-lg ${task.status === "Done" ? "line-through text-gray-500" : "text-orange"}`}
                      >
                        {task.title}
                      </CardTitle>
                    </div>
                    <Badge className={getStatusColor(task.status)}>{getStatusText(task.status)}</Badge>
                  </div>
                  <CardDescription className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1 text-orange-light" />
                    Hạn: {formatDate(task.due)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Phòng ban:</span> {task.dept}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Mức ưu tiên:</span> {getPriorityText(task.priority)}
                    </div>

                    {task.isSequential ? (
                      <div>
                        <div className="text-sm flex items-center justify-between">
                          <span className="font-medium">Công việc tuần tự</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAssignees(task)
                            }}
                            className="h-7 text-xs bg-yellow-light text-orange border-orange hover:bg-yellow"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Xem người thực hiện
                          </Button>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Tiến độ:</span>
                            <span className="text-sm">{getSequentialProgress(task)}%</span>
                          </div>
                          <Progress
                            value={getSequentialProgress(task)}
                            className="h-2 bg-gray-200"
                            indicatorClassName="bg-orange"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm">
                          <span className="font-medium">Người thực hiện:</span> {responsible?.dept} -{" "}
                          {responsible?.name} ({responsible?.role})
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Người phê duyệt:</span> {accountable?.dept} -{" "}
                          {accountable?.name} ({accountable?.role})
                        </div>
                      </>
                    )}

                    <div className="text-sm">
                      <span className="font-medium">Mô tả:</span> {task.description}
                    </div>

                    {task.isRecurring && task.recurringConfig && (
                      <div className="text-sm bg-yellow-light/20 p-2 rounded-md flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-orange" />
                        <span>
                          Công việc lặp lại mỗi {task.recurringConfig.interval}{" "}
                          {task.recurringConfig.frequency === "daily" && "ngày"}
                          {task.recurringConfig.frequency === "weekly" && "tuần"}
                          {task.recurringConfig.frequency === "monthly" && "tháng"}
                          {task.recurringConfig.frequency === "custom" && "ngày"}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {task.checklistItems && task.checklistItems.length > 0 && (
                        <Badge variant="outline" className="bg-yellow-light/10 text-orange border-orange">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {task.checklistItems.length} mục kiểm tra
                        </Badge>
                      )}

                      {task.comments && task.comments.length > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-purple/10 text-purple border-purple cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            openComments(task)
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {task.comments.length} bình luận
                        </Badge>
                      )}

                      {task.driveUrl && (
                        <Badge
                          variant="outline"
                          className="bg-green/10 text-green border-green cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(task.driveUrl, "_blank")
                          }}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Tài liệu
                        </Badge>
                      )}

                      {task.isApproved && (
                        <Badge className="bg-green text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Đã phê duyệt
                        </Badge>
                      )}

                      {task.feedback && (
                        <Badge
                          variant="outline"
                          className="bg-yellow/10 text-orange border-orange cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            openFeedback(task)
                          }}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Đánh giá: {task.feedback.rating}/5
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Select
                    defaultValue={task.status}
                    onValueChange={(value) => handleStatusChange(task.id, value)}
                    onOpenChange={(open) => {
                      if (open) {
                        // Prevent the card click event when opening the select
                        event?.stopPropagation()
                      }
                    }}
                  >
                    <SelectTrigger
                      className="w-full border-2 border-gray-300 focus:border-orange"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className="ml-2">Cập nhật trạng thái</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do" className="text-purple">
                        Cần làm
                      </SelectItem>
                      <SelectItem value="In Progress" className="text-orange">
                        Đang làm
                      </SelectItem>
                      <SelectItem value="Done" className="text-green">
                        Hoàn thành
                      </SelectItem>
                      <SelectItem value="Overdue" className="text-orange-light">
                        Quá hạn
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-purple text-purple hover:bg-purple/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        openComments(task)
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Bình luận
                    </Button>

                    {task.status === "Done" && !task.isApproved && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green text-white hover:bg-green/80"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApproveTask(task.id)
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Phê duyệt
                      </Button>
                    )}

                    {task.status === "Done" && !task.feedback && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-yellow text-orange hover:bg-yellow/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          openFeedback(task)
                        }}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Đánh giá
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">Không có công việc nào phù hợp với bộ lọc</p>
            <Button
              variant="outline"
              className="mt-4 border-orange text-orange hover:bg-orange/10"
              onClick={() => {
                setFilter("all")
                setDeptFilter("all")
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Dialog cho danh sách người thực hiện */}
      <Dialog open={openAssigneesDialog} onOpenChange={setOpenAssigneesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange text-xl">Người thực hiện theo thứ tự</DialogTitle>
            <DialogDescription>{selectedTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.assignees?.map((assignee, index) => {
              const user = getUserById(assignee.userId)
              return (
                <div key={index} className="flex items-start space-x-2 border-b pb-2">
                  <div className={`flex-1 ${assignee.isCompleted ? "text-green" : ""}`}>
                    <div className="font-medium">
                      {index + 1}. {user?.dept} - {user?.name} ({user?.role})
                    </div>
                    <div className="text-sm text-gray-500">
                      Thời gian: {assignee.timeAllocation} giờ
                      {assignee.startTime && <span> | Bắt đầu: {formatDate(assignee.startTime)}</span>}
                      {assignee.endTime && <span> | Kết thúc: {formatDate(assignee.endTime)}</span>}
                    </div>
                  </div>
                  <Badge className={assignee.isCompleted ? "bg-green text-white" : "bg-gray-100 text-gray-800"}>
                    {assignee.isCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                  </Badge>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOpenAssigneesDialog(false)}
              className="bg-orange text-white hover:bg-orange-light"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog cho bình luận */}
      <Dialog open={openCommentsDialog} onOpenChange={setOpenCommentsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple text-xl">Bình luận</DialogTitle>
            <DialogDescription>{selectedTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.comments && selectedTask.comments.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedTask.comments.map((comment) => {
                  const commentUser = getUserById(comment.userId)
                  return (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm text-purple">
                          {commentUser?.name} ({commentUser?.role})
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Chưa có bình luận nào.</p>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Thêm bình luận mới..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] border-2 border-gray-300 focus-visible:border-purple"
              />
              <Button
                onClick={handleAddComment}
                className="bg-purple text-white hover:bg-purple/80"
                disabled={!newComment.trim()}
              >
                Thêm bình luận
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOpenCommentsDialog(false)}
              variant="outline"
              className="border-purple text-purple hover:bg-purple/10"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog cho đánh giá */}
      <Dialog open={openFeedbackDialog} onOpenChange={setOpenFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-yellow text-xl">Đánh giá công việc</DialogTitle>
            <DialogDescription>{selectedTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.feedback ? (
              <div className="bg-yellow/10 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-orange">Đánh giá hiện tại</div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= selectedTask.feedback!.rating ? "text-yellow fill-yellow" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm mt-2">{selectedTask.feedback.comment}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Đánh giá bởi: {getUserById(selectedTask.feedback.userId)?.name} -{" "}
                  {new Date(selectedTask.feedback.timestamp).toLocaleString("vi-VN")}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">Đánh giá sao</label>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${star <= feedbackRating ? "text-yellow fill-yellow" : "text-gray-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Nhận xét</label>
                  <Textarea
                    placeholder="Nhập nhận xét của bạn về công việc này..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="mt-1 min-h-[100px] border-2 border-gray-300 focus-visible:border-yellow"
                  />
                </div>

                <Button onClick={handleSubmitFeedback} className="w-full bg-yellow text-orange hover:bg-yellow/80">
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  Gửi đánh giá
                </Button>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenFeedbackDialog(false)} variant="outline" className="border-gray-300">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chi tiết công việc */}
      <Dialog open={openTaskDetailDialog} onOpenChange={setOpenTaskDetailDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange text-2xl flex items-center">
              {selectedTask?.title}
              <Badge className={`ml-3 ${getStatusColor(selectedTask?.status || "To Do")}`}>
                {getStatusText(selectedTask?.status || "To Do")}
              </Badge>
            </DialogTitle>
            <DialogDescription>Chi tiết công việc</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-orange">Thông tin cơ bản</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-medium">Mô tả:</span> {selectedTask.description}
                    </div>
                    <div>
                      <span className="font-medium">Phòng ban:</span> {selectedTask.dept}
                    </div>
                    <div>
                      <span className="font-medium">Mức ưu tiên:</span> {getPriorityText(selectedTask.priority)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-orange" />
                      <span className="font-medium">Hạn hoàn thành:</span> {formatDate(selectedTask.due)}
                    </div>
                    <div>
                      <span className="font-medium">Ngày tạo:</span> {formatDate(selectedTask.created)}
                    </div>

                    {selectedTask.isRecurring && selectedTask.recurringConfig && (
                      <div className="bg-yellow-light/20 p-2 rounded-md flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-orange" />
                        <span>
                          Công việc lặp lại mỗi {selectedTask.recurringConfig.interval}{" "}
                          {selectedTask.recurringConfig.frequency === "daily" ? "ngày" : ""}
                          {selectedTask.recurringConfig.frequency === "weekly" ? "tuần" : ""}
                          {selectedTask.recurringConfig.frequency === "monthly" ? "tháng" : ""}
                          {selectedTask.recurringConfig.frequency === "custom" ? "ngày" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2 text-orange">Người thực hiện</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    {selectedTask.isSequential && selectedTask.assignees ? (
                      <div>
                        <div className="mb-2">
                          <span className="font-medium">Công việc tuần tự</span>{" "}
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm">Tiến độ:</span>
                            <span className="text-sm">{getSequentialProgress(selectedTask)}%</span>
                          </div>
                          <Progress
                            value={getSequentialProgress(selectedTask)}
                            className="h-2 bg-gray-200 mt-1"
                            indicatorClassName="bg-orange"
                          />
                        </div>

                        <div className="space-y-2 mt-4">
                          {selectedTask.assignees.map((assignee, index) => {
                            const user = getUserById(assignee.userId)
                            return (
                              <div key={index} className="flex items-start justify-between border-b pb-2">
                                <div>
                                  <div className="font-medium">
                                    {index + 1}. {user?.dept} - {user?.name} ({user?.role})
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Deadline: {assignee.endTime ? formatDate(assignee.endTime) : "Chưa xác định"}
                                  </div>
                                </div>
                                <Badge
                                  className={assignee.isCompleted ? "bg-green text-white" : "bg-gray-100 text-gray-800"}
                                >
                                  {assignee.isCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium">Người thực hiện (R):</span>{" "}
                          {getUserById(selectedTask.responsible)?.dept} - {getUserById(selectedTask.responsible)?.name}{" "}
                          ({getUserById(selectedTask.responsible)?.role})
                        </div>
                        <div>
                          <span className="font-medium">Người phê duyệt (A):</span>{" "}
                          {getUserById(selectedTask.accountable)?.dept} - {getUserById(selectedTask.accountable)?.name}{" "}
                          ({getUserById(selectedTask.accountable)?.role})
                        </div>
                        {selectedTask.consulted &&
                          selectedTask.consulted !== "" &&
                          selectedTask.consulted !== "none" && (
                            <div>
                              <span className="font-medium">Người tư vấn (C):</span>{" "}
                              {getUserById(selectedTask.consulted)?.dept} - {getUserById(selectedTask.consulted)?.name}{" "}
                              ({getUserById(selectedTask.consulted)?.role})
                            </div>
                          )}
                        {selectedTask.informed && selectedTask.informed !== "" && selectedTask.informed !== "none" && (
                          <div>
                            <span className="font-medium">Người được thông báo (I):</span>{" "}
                            {getUserById(selectedTask.informed)?.dept} - {getUserById(selectedTask.informed)?.name} (
                            {getUserById(selectedTask.informed)?.role})
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedTask.checklistItems && selectedTask.checklistItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2 text-orange">Checklist công việc</h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {selectedTask.checklistItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`detail-checklist-${index}`}
                          className="h-5 w-5 border-2 border-orange data-[state=checked]:bg-orange"
                        />
                        <label htmlFor={`detail-checklist-${index}`} className="text-sm">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2 text-purple">Bình luận</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg max-h-[200px] overflow-y-auto">
                    {selectedTask.comments.map((comment) => {
                      const commentUser = getUserById(comment.userId)
                      return (
                        <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-sm text-purple">
                              {commentUser?.name} ({commentUser?.role})
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString("vi-VN")}
                            </div>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedTask.driveUrl && (
                <div>
                  <h3 className="text-lg font-medium mb-2 text-green">Tài liệu</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <a
                      href={selectedTask.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <Link2 className="h-5 w-5 mr-2" />
                      Xem tài liệu trên Google Drive
                    </a>
                  </div>
                </div>
              )}

              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2 text-orange">Tệp đính kèm</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedTask.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={attachment.url || "/placeholder.svg"}
                            alt={attachment.name}
                            className="h-16 w-16 object-cover rounded-md mr-3"
                          />
                          <div>
                            <div className="font-medium">{attachment.name}</div>
                            <div className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(2)} KB - Tải lên bởi{" "}
                              {getUserById(attachment.uploadedBy)?.name}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange text-orange hover:bg-orange/10"
                          onClick={() => window.open(attachment.url, "_blank")}
                        >
                          Xem
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.feedback && (
                <div>
                  <h3 className="text-lg font-medium mb-2 text-yellow">Đánh giá</h3>
                  <div className="bg-yellow/10 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-orange">
                        Đánh giá từ {getUserById(selectedTask.feedback.userId)?.name}
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= selectedTask.feedback.rating ? "text-yellow fill-yellow" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm mt-2">{selectedTask.feedback.comment}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedTask.feedback.timestamp).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple text-purple hover:bg-purple/10"
                    onClick={() => {
                      setOpenTaskDetailDialog(false)
                      openComments(selectedTask)
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Thêm bình luận
                  </Button>

                  {selectedTask.status === "Done" && !selectedTask.isApproved && (
                    <Button
                      size="sm"
                      className="bg-green text-white hover:bg-green/80"
                      onClick={() => {
                        handleApproveTask(selectedTask.id)
                        setOpenTaskDetailDialog(false)
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Phê duyệt
                    </Button>
                  )}

                  {selectedTask.status === "Done" && !selectedTask.feedback && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-yellow text-orange hover:bg-yellow/10"
                      onClick={() => {
                        setOpenTaskDetailDialog(false)
                        openFeedback(selectedTask)
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Đánh giá
                    </Button>
                  )}
                </div>

                <Button onClick={() => setOpenTaskDetailDialog(false)} variant="outline" className="border-gray-300">
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

