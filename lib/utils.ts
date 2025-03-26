import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { addHours } from "date-fns"
import type { Task, TaskAssignee, User } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date)
}

export function calculateDeadline(priority: string): Date {
  const now = new Date()

  switch (priority) {
    case "Urgent":
      return addHours(now, 4)
    case "High":
      return addHours(now, 12)
    case "Medium":
      return addHours(now, 24)
    case "Low":
      return addHours(now, 72)
    default:
      return addHours(now, 24)
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case "To Do":
      return "Cần làm"
    case "In Progress":
      return "Đang làm"
    case "Done":
      return "Hoàn thành"
    case "Overdue":
      return "Quá hạn"
    case "Blocked":
      return "Bị chặn"
    default:
      return status
  }
}

export function getPriorityText(priority: string): string {
  switch (priority) {
    case "Low":
      return "Thấp"
    case "Medium":
      return "Trung bình"
    case "High":
      return "Cao"
    case "Urgent":
      return "Khẩn cấp"
    default:
      return priority
  }
}

// Cập nhật hàm calculateSequentialDeadlines để đảm bảo deadline của từng người không vượt quá deadline chung
export function calculateSequentialDeadlines(finalDeadline: Date, assignees: TaskAssignee[]): TaskAssignee[] {
  const totalHours = assignees.reduce((sum, assignee) => sum + assignee.timeAllocation, 0)
  let remainingTime = finalDeadline.getTime()

  // Work backwards from the final deadline
  return [...assignees]
    .reverse()
    .map((assignee, index, array) => {
      const endTime = new Date(remainingTime)

      // Đảm bảo endTime không vượt quá finalDeadline
      const safeEndTime = endTime.getTime() > finalDeadline.getTime() ? finalDeadline : endTime

      const startTime = new Date(remainingTime - assignee.timeAllocation * 60 * 60 * 1000)
      remainingTime = startTime.getTime()

      return {
        ...assignee,
        startTime: startTime.toISOString(),
        endTime: safeEndTime.toISOString(),
      }
    })
    .reverse() // Reverse back to original order
}

// Check if a user's task is blocked by previous assignees
export function isTaskBlocked(task: Task, userId: string, users: User[]): { blocked: boolean; blockedBy?: string } {
  if (!task.isSequential || !task.assignees) {
    return { blocked: false }
  }

  const userIndex = task.assignees.findIndex((a) => a.userId === userId)
  if (userIndex <= 0) {
    return { blocked: false } // First person or not found
  }

  // Check if any previous assignee hasn't completed their part
  for (let i = 0; i < userIndex; i++) {
    if (!task.assignees[i].isCompleted) {
      const blockedByUser = users.find((u) => u.id === task.assignees![i].userId)
      return {
        blocked: true,
        blockedBy: blockedByUser ? blockedByUser.name : "Người dùng trước",
      }
    }
  }

  return { blocked: false }
}

// Get the current assignee for a sequential task
export function getCurrentAssignee(task: Task): string | null {
  if (!task.isSequential || !task.assignees) {
    return null
  }

  for (const assignee of task.assignees) {
    if (!assignee.isCompleted) {
      return assignee.userId
    }
  }

  return null // All completed
}

// Check if a user can start their part of a sequential task
export function canStartTask(task: Task, userId: string): boolean {
  if (!task.isSequential || !task.assignees) {
    return true
  }

  const userIndex = task.assignees.findIndex((a) => a.userId === userId)
  if (userIndex < 0) {
    return false // User not found in assignees
  }

  // First person can always start
  if (userIndex === 0) {
    return true
  }

  // Check if all previous assignees have completed their parts
  for (let i = 0; i < userIndex; i++) {
    if (!task.assignees[i].isCompleted) {
      return false
    }
  }

  return true
}

