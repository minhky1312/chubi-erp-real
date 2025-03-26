"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import type { Task, User, TaskComment } from "@/lib/types"
import { formatDate, getStatusText, isTaskBlocked, canStartTask } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Lock,
  ListChecks,
  MessageSquare,
  Link2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface MyTasksProps {
  tasks: Task[]
  users: User[]
  onUpdateTask: (task: Task) => void
}

export default function MyTasks({ tasks, users, onUpdateTask }: MyTasksProps) {
  const [columns, setColumns] = useState({
    todo: {
      name: "Cần làm",
      items: tasks.filter((task) => task.status === "To Do"),
    },
    inProgress: {
      name: "Đang làm",
      items: tasks.filter((task) => task.status === "In Progress"),
    },
    done: {
      name: "Hoàn thành",
      items: tasks.filter((task) => task.status === "Done"),
    },
    overdue: {
      name: "Quá hạn",
      items: tasks.filter((task) => task.status === "Overdue"),
    },
  })

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [openChecklistDialog, setOpenChecklistDialog] = useState(false)
  const [openCommentsDialog, setOpenCommentsDialog] = useState(false)
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({})
  const [newComment, setNewComment] = useState("")
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [swipingTaskId, setSwipingTaskId] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null)

  // Cập nhật columns khi tasks thay đổi
  useEffect(() => {
    setColumns({
      todo: {
        name: "Cần làm",
        items: tasks.filter((task) => task.status === "To Do"),
      },
      inProgress: {
        name: "Đang làm",
        items: tasks.filter((task) => task.status === "In Progress"),
      },
      done: {
        name: "Hoàn thành",
        items: tasks.filter((task) => task.status === "Done"),
      },
      overdue: {
        name: "Quá hạn",
        items: tasks.filter((task) => task.status === "Overdue"),
      },
    })
  }, [tasks])

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

  const handleCheckboxChange = (taskId: string, isChecked: boolean) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      let updatedTask = { ...task }

      if (task.isSequential && task.assignees) {
        // For sequential tasks, mark the current assignee's part as completed
        const currentAssigneeIndex = task.assignees.findIndex((a) => !a.isCompleted)
        if (currentAssigneeIndex >= 0) {
          const updatedAssignees = [...task.assignees]
          updatedAssignees[currentAssigneeIndex] = {
            ...updatedAssignees[currentAssigneeIndex],
            isCompleted: isChecked,
            endTime: isChecked ? new Date().toISOString() : undefined,
          }

          // If all assignees have completed their parts, mark the task as done
          const allCompleted = updatedAssignees.every((a) => a.isCompleted)
          updatedTask = {
            ...task,
            status: isChecked ? (allCompleted ? "Done" : "In Progress") : "To Do",
            assignees: updatedAssignees,
          }
        }
      } else {
        // For regular tasks
        updatedTask = { ...task, status: isChecked ? "Done" : "To Do" }
      }

      onUpdateTask(updatedTask)
    }
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      const updatedTask = { ...task, status: newStatus }
      onUpdateTask(updatedTask)
    }
  }

  const onDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination } = result

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = columns[source.droppableId]
      const copiedItems = [...column.items]
      const [removed] = copiedItems.splice(source.index, 1)
      copiedItems.splice(destination.index, 0, removed)

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      })
    } else {
      // Moving from one column to another
      const sourceColumn = columns[source.droppableId]
      const destColumn = columns[destination.droppableId]
      const sourceItems = [...sourceColumn.items]
      const destItems = [...destColumn.items]
      const [removed] = sourceItems.splice(source.index, 1)

      // Check if this is a sequential task and if the user can move it
      if (removed.isSequential && removed.assignees) {
        const currentUserId = "user2" // This should be the current user's ID
        const blockInfo = isTaskBlocked(removed, currentUserId, users)

        if (blockInfo.blocked) {
          // Can't move a blocked task
          return
        }
      }

      // Update the task status based on the destination column
      let newStatus = "To Do"
      switch (destination.droppableId) {
        case "todo":
          newStatus = "To Do"
          break
        case "inProgress":
          newStatus = "In Progress"
          break
        case "done":
          newStatus = "Done"
          break
        case "overdue":
          newStatus = "Overdue"
          break
      }

      const updatedTask = { ...removed, status: newStatus }
      destItems.splice(destination.index, 0, updatedTask)

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      })

      // Update the task in the parent component
      onUpdateTask(updatedTask)
    }
  }

  const openChecklist = (task: Task) => {
    setSelectedTask(task)

    // Initialize checklist state
    if (task.checklistItems) {
      const initialState: Record<string, boolean> = {}
      task.checklistItems.forEach((item, index) => {
        initialState[`${task.id}-${index}`] = false
      })
      setChecklistState(initialState)
    }

    setOpenChecklistDialog(true)
  }

  const openComments = (task: Task) => {
    setSelectedTask(task)
    setNewComment("")
    setOpenCommentsDialog(true)
  }

  const handleChecklistItemChange = (taskId: string, itemIndex: number, checked: boolean) => {
    setChecklistState((prev) => ({
      ...prev,
      [`${taskId}-${itemIndex}`]: checked,
    }))
  }

  const getChecklistProgress = (task: Task): number => {
    if (!task.checklistItems || task.checklistItems.length === 0) {
      return 0
    }

    const checkedCount = Object.entries(checklistState).filter(
      ([key, value]) => key.startsWith(`${task.id}-`) && value,
    ).length

    return Math.round((checkedCount / task.checklistItems.length) * 100)
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

  // Xử lý vuốt trái/phải trên điện thoại
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    setTouchStart(e.targetTouches[0].clientX)
    setSwipingTaskId(taskId)
    setSwipeDirection(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return

    const currentTouch = e.targetTouches[0].clientX
    const diff = touchStart - currentTouch

    // Xác định hướng vuốt
    if (diff > 50) {
      setSwipeDirection("left")
    } else if (diff < -50) {
      setSwipeDirection("right")
    } else {
      setSwipeDirection(null)
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || !swipingTaskId || !swipeDirection) {
      setTouchStart(null)
      setSwipingTaskId(null)
      setSwipeDirection(null)
      return
    }

    const task = tasks.find((t) => t.id === swipingTaskId)
    if (!task) return

    // Vuốt trái -> In Progress, vuốt phải -> Done
    if (swipeDirection === "left") {
      handleStatusChange(swipingTaskId, "In Progress")
    } else if (swipeDirection === "right") {
      handleStatusChange(swipingTaskId, "Done")
    }

    setTouchStart(null)
    setSwipingTaskId(null)
    setSwipeDirection(null)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-orange">Công việc của tôi</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="flex flex-col">
              <h3 className="font-medium text-lg mb-3 flex items-center">
                {getStatusIcon(column.name)}
                <span className="ml-2">{column.name}</span>
                <Badge className="ml-2 bg-yellow text-orange">{column.items.length}</Badge>
              </h3>

              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 bg-gray-50 p-2 rounded-lg min-h-[300px]"
                  >
                    {column.items.map((task, index) => {
                      const responsible = getUserById(task.responsible)
                      const accountable = getUserById(task.accountable)

                      // Check if this task is blocked (for sequential tasks)
                      const currentUserId = "user2" // This should be the current user's ID
                      const blockInfo = isTaskBlocked(task, currentUserId, users)
                      const canStart = canStartTask(task, currentUserId)

                      // Determine swipe animation class
                      const swipeClass =
                        swipingTaskId === task.id && swipeDirection
                          ? swipeDirection === "left"
                            ? "animate-slide-out-left"
                            : "animate-slide-out-right"
                          : ""

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={blockInfo.blocked}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 shadow-md hover:shadow-lg transition-shadow border-l-4 ${
                                task.status === "Done"
                                  ? "border-l-green"
                                  : task.status === "In Progress"
                                    ? "border-l-orange"
                                    : task.status === "Overdue"
                                      ? "border-l-orange-light"
                                      : "border-l-purple"
                              } ${swipeClass}`}
                              onTouchStart={(e) => handleTouchStart(e, task.id)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            >
                              {swipeDirection && swipingTaskId === task.id && (
                                <div
                                  className={`absolute inset-0 flex items-center justify-center bg-black/10 rounded-md z-10 ${
                                    swipeDirection === "left" ? "pl-4" : "pr-4"
                                  }`}
                                >
                                  {swipeDirection === "left" ? (
                                    <div className="flex items-center text-orange">
                                      <PlayCircle className="h-6 w-6 mr-2" />
                                      <span>Đang làm</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-green">
                                      <CheckCircle2 className="h-6 w-6 mr-2" />
                                      <span>Hoàn thành</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center space-x-2">
                                    {blockInfo.blocked ? (
                                      <Lock className="h-6 w-6 text-orange-light" />
                                    ) : (
                                      <Checkbox
                                        id={`task-${task.id}`}
                                        checked={task.status === "Done"}
                                        onCheckedChange={(checked) => handleCheckboxChange(task.id, checked as boolean)}
                                        disabled={blockInfo.blocked}
                                        className="h-6 w-6 border-2 border-orange data-[state=checked]:bg-green data-[state=checked]:border-green"
                                      />
                                    )}
                                    <CardTitle
                                      className={`text-base ${task.status === "Done" ? "line-through text-gray-500" : "text-orange"}`}
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
                                  {blockInfo.blocked && (
                                    <div className="text-sm bg-red-50 text-red-700 p-2 rounded-md flex items-center">
                                      <Lock className="h-4 w-4 mr-1" />
                                      Bị chặn bởi: {blockInfo.blockedBy}
                                    </div>
                                  )}

                                  <div className="text-sm">
                                    <span className="font-medium">Phòng ban:</span> {task.dept}
                                  </div>

                                  {task.isSequential && task.assignees && (
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
                                  )}

                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {task.checklistItems && task.checklistItems.length > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs bg-yellow-light text-orange border-orange hover:bg-yellow"
                                        onClick={() => openChecklist(task)}
                                      >
                                        <ListChecks className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Checklist công việc</span>
                                        <span className="sm:hidden">Checklist</span>
                                      </Button>
                                    )}

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 text-xs bg-purple/10 text-purple border-purple hover:bg-purple/20"
                                      onClick={() => openComments(task)}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      <span className="hidden sm:inline">Bình luận</span>
                                      <span className="sm:hidden">Bình luận</span>
                                      {task.comments && task.comments.length > 0 && (
                                        <Badge className="ml-1 bg-purple text-white">{task.comments.length}</Badge>
                                      )}
                                    </Button>

                                    {task.driveUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs bg-green/10 text-green border-green hover:bg-green/20"
                                        onClick={() => window.open(task.driveUrl, "_blank")}
                                      >
                                        <Link2 className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Tài liệu</span>
                                        <span className="sm:hidden">Tài liệu</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter>
                                <div className="w-full">
                                  <Select
                                    defaultValue={task.status}
                                    onValueChange={(value) => handleStatusChange(task.id, value)}
                                    disabled={blockInfo.blocked}
                                  >
                                    <SelectTrigger className="w-full h-10 border-2 border-gray-300 focus:border-orange">
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
                                </div>
                              </CardFooter>

                              <div className="absolute top-1/2 -translate-y-1/2 -left-3 text-white">
                                <ChevronLeft className="h-6 w-6 bg-orange rounded-full p-1" />
                              </div>
                              <div className="absolute top-1/2 -translate-y-1/2 -right-3 text-white">
                                <ChevronRight className="h-6 w-6 bg-green rounded-full p-1" />
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Dialog cho danh sách kiểm tra */}
      <Dialog open={openChecklistDialog} onOpenChange={setOpenChecklistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange text-xl">Checklist công việc</DialogTitle>
            <DialogDescription>{selectedTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.checklistItems?.map((item, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Checkbox
                  id={`checklist-dialog-${selectedTask.id}-${index}`}
                  checked={checklistState[`${selectedTask.id}-${index}`]}
                  onCheckedChange={(checked) => handleChecklistItemChange(selectedTask.id, index, checked as boolean)}
                  className="h-5 w-5 border-2 border-orange data-[state=checked]:bg-orange"
                />
                <label
                  htmlFor={`checklist-dialog-${selectedTask.id}-${index}`}
                  className={`text-sm ${checklistState[`${selectedTask.id}-${index}`] ? "line-through text-gray-500" : ""}`}
                >
                  {item}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Tiến độ:</span>
                <span className="text-sm">{selectedTask ? getChecklistProgress(selectedTask) : 0}%</span>
              </div>
              <Progress
                value={selectedTask ? getChecklistProgress(selectedTask) : 0}
                className="h-2 mb-4 bg-gray-200"
                indicatorClassName="bg-orange"
              />
              <Button
                onClick={() => setOpenChecklistDialog(false)}
                className="bg-orange text-white hover:bg-orange-light"
              >
                Đóng
              </Button>
            </div>
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
    </div>
  )
}

