export interface User {
  id: string
  name: string
  email?: string
  role: string
  dept: string
  avatar?: string
  badges?: Badge[]
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
  lastLogin?: string
  status?: "active" | "inactive" | "pending"
}

export interface Department {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  managerId?: string
  color?: string
}

export interface TaskAssignee {
  userId: string
  timeAllocation: number // in hours
  isCompleted: boolean
  startTime?: string
  endTime?: string
  notes?: string
}

export interface TaskComment {
  id: string
  userId: string
  content: string
  timestamp: string
  attachments?: string[]
  mentions?: string[] // User IDs that were mentioned
}

export interface TaskFeedback {
  id: string
  userId: string
  rating: number // 1-5
  comment: string
  timestamp: string
}

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  thumbnailUrl?: string
}

export interface RecurringConfig {
  frequency: "daily" | "weekly" | "monthly" | "custom"
  interval: number
  endDate?: string
  endAfterOccurrences?: number
  daysOfWeek?: number[] // 0-6, where 0 is Sunday
}

export interface Task {
  taskId: string,
  id: string
  title: string
  description: string
  responsible: string
  accountable: string
  consulted?: string
  informed?: string
  dept: string
  priority: string
  status: string
  due: string
  created: string
  // New fields for sequential tasks
  isSequential?: boolean
  assignees?: TaskAssignee[]
  checklistItems?: string[]
  // New fields for enhanced features
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  driveUrl?: string
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  isApproved?: boolean
  approvedBy?: string
  approvedAt?: string
  feedback?: TaskFeedback
  reminderSent?: boolean
  lastNotificationTime?: string
  tags?: string[]
  parentTaskId?: string
  subtasks?: string[] // IDs of subtasks
  estimatedTime?: number // in hours
  actualTime?: number // in hours
  progress?: number // 0-100
}

export interface TaskTemplate {
  id: string
  name: string
  title: string
  description: string
  dept: string
  priority: string
  checklistItems?: string[]
  isSequential?: boolean
  defaultAssignees?: {
    role: string
    timeAllocation: number
  }[]
  driveUrl?: string
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  tags?: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  type: "task" | "meeting" | "reminder"
  taskId?: string
  color?: string
  status?: string
  location?: string
  description?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria: {
    type: "taskCount" | "performance" | "streak" | "custom"
    threshold: number
  }
  createdAt?: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "reminder" | "approval" | "completion" | "assignment" | "feedback" | "mention" | "system"
  taskId?: string
  isRead: boolean
  createdAt: string
  readAt?: string
  priority?: "low" | "medium" | "high"
  actionUrl?: string
}

export interface Permission {
  id: string
  name: string
  description: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
}

export interface PaginatedResult<T> {
  data: T[]
  lastDoc?: any
  hasMore: boolean
}

export interface TaskFilter {
  status?: string[]
  priority?: string[]
  department?: string[]
  assignee?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  tags?: string[]
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  upcomingTasks: number
  completionRate: number
  departmentPerformance: {
    department: string
    completionRate: number
    taskCount: number
  }[]
  userPerformance: {
    userId: string
    userName: string
    completionRate: number
    taskCount: number
  }[]
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  resourceType: "task" | "user" | "department" | "template"
  resourceId: string
  timestamp: string
  details?: any
}

