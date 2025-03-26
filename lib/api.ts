import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
  writeBatch,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { httpsCallable } from "firebase/functions"
import { db, storage, functions } from "@/lib/firebase"
import type { User, Task, Department, TaskTemplate, TaskAttachment, Notification, PaginatedResult } from "@/lib/types"

// User API
export async function getUsers(): Promise<User[]> {
  const usersSnapshot = await getDocs(collection(db, "users"))
  return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
}

export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
    callback(users)
  })

  return unsubscribe
}

export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", userId))
  if (!userDoc.exists()) return null
  return { id: userDoc.id, ...userDoc.data() } as User
}

export async function updateUser(userId: string, userData: Partial<User>): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    ...userData,
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    permissions,
    updatedAt: serverTimestamp(),
  })
}

// Department API
export async function getDepartments(): Promise<Department[]> {
  const deptsSnapshot = await getDocs(collection(db, "departments"))
  return deptsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Department)
}

export function subscribeToDepartments(callback: (departments: Department[]) => void): () => void {
  const unsubscribe = onSnapshot(collection(db, "departments"), (snapshot) => {
    const departments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Department)
    callback(departments)
  })

  return unsubscribe
}

export async function addDepartment(department: Omit<Department, "id">): Promise<Department> {
  const docRef = await addDoc(collection(db, "departments"), {
    ...department,
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...department,
  }
}

export async function updateDepartment(departmentId: string, departmentData: Partial<Department>): Promise<void> {
  await updateDoc(doc(db, "departments", departmentId), {
    ...departmentData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  await deleteDoc(doc(db, "departments", departmentId))
}

// Task API
export async function getTasks(): Promise<Task[]> {
  const tasksSnapshot = await getDocs(collection(db, "tasks"))
  return tasksSnapshot.docs.map((doc) => {
    const data = doc.data()

    // Convert Firestore timestamps to ISO strings
    const task: Task = {
      taskId: doc.id,
      ...data,
      created: data.created instanceof Date
          ? data.created.toISOString()
          : new Date().toISOString(),

      due: data.due instanceof Date
          ? data.due.toISOString()
          : new Date().toISOString(),
    } as Task


    // Convert other date fields if they exist
    if (data.approvedAt) {
      task.approvedAt = data.approvedAt.toDate().toISOString()
    }

    if (task.assignees) {
      task.assignees = task.assignees.map((assignee) => ({
        ...assignee,
        startTime: assignee.startTime ? new Date(assignee.startTime).toISOString() : undefined,
        endTime: assignee.endTime ? new Date(assignee.endTime).toISOString() : undefined,
      }))
    }

    return task
  })
}

export function subscribeToTasks(callback: (tasks: Task[]) => void): () => void {
  const unsubscribe = onSnapshot(collection(db, "tasks"), (snapshot) => {
    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data()

      // Convert Firestore timestamps to ISO strings
      const task: Task = {
        id: doc.id,
        ...data,
        created: data.created?.toDate().toISOString() || new Date().toISOString(),
        due: data.due?.toDate().toISOString() || new Date().toISOString(),
      } as Task

      // Convert other date fields if they exist
      if (data.approvedAt) {
        task.approvedAt = data.approvedAt.toDate().toISOString()
      }

      if (task.assignees) {
        task.assignees = task.assignees.map((assignee) => ({
          ...assignee,
          startTime: assignee.startTime ? new Date(assignee.startTime).toISOString() : undefined,
          endTime: assignee.endTime ? new Date(assignee.endTime).toISOString() : undefined,
        }))
      }

      return task
    })

    callback(tasks)
  })

  return unsubscribe
}

export async function getPaginatedTasks(
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<PaginatedResult<Task>> {
  let tasksQuery = query(collection(db, "tasks"), orderBy("created", "desc"), limit(pageSize))

  if (lastDoc) {
    tasksQuery = query(collection(db, "tasks"), orderBy("created", "desc"), startAfter(lastDoc), limit(pageSize))
  }

  const tasksSnapshot = await getDocs(tasksQuery)
  const lastVisible = tasksSnapshot.docs[tasksSnapshot.docs.length - 1]

  const tasks = tasksSnapshot.docs.map((doc) => {
    const data = doc.data()

    // Convert Firestore timestamps to ISO strings
    const task: Task = {
      id: doc.id,
      ...data,
      created: data.created?.toDate().toISOString() || new Date().toISOString(),
      due: data.due?.toDate().toISOString() || new Date().toISOString(),
    } as Task

    // Convert other date fields if they exist
    if (data.approvedAt) {
      task.approvedAt = data.approvedAt.toDate().toISOString()
    }

    if (task.assignees) {
      task.assignees = task.assignees.map((assignee) => ({
        ...assignee,
        startTime: assignee.startTime ? new Date(assignee.startTime).toISOString() : undefined,
        endTime: assignee.endTime ? new Date(assignee.endTime).toISOString() : undefined,
      }))
    }

    return task
  })

  return {
    data: tasks,
    lastDoc: lastVisible,
    hasMore: tasksSnapshot.docs.length === pageSize,
  }
}

export async function getTasksByDepartment(departmentId: string): Promise<Task[]> {
  const q = query(collection(db, "tasks"), where("dept", "==", departmentId))
  const tasksSnapshot = await getDocs(q)

  return tasksSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      created: data.created?.toDate().toISOString() || new Date().toISOString(),
      due: data.due?.toDate().toISOString() || new Date().toISOString(),
    } as Task
  })
}

export async function getTasksByUser(userId: string): Promise<Task[]> {
  const q = query(collection(db, "tasks"), where("responsible", "==", userId))
  const tasksSnapshot = await getDocs(q)

  return tasksSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      created: data.created?.toDate().toISOString() || new Date().toISOString(),
      due: data.due?.toDate().toISOString() || new Date().toISOString(),
    } as Task
  })
}

export async function addTask(task: Omit<Task, "id">): Promise<Task> {
  // Convert ISO date strings to Firestore timestamps
  const firestoreTask = {
    ...task,
    created: Timestamp.fromDate(new Date()),
    due: task.due ? Timestamp.fromDate(new Date(task.due)) : Timestamp.fromDate(new Date()),
  }

  const docRef = await addDoc(collection(db, "tasks"), firestoreTask)

  return {
    id: docRef.id,
    ...task,
  }
}

export async function updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
  const updateData: any = { ...taskData }

  // Convert ISO date strings to Firestore timestamps
  if (taskData.due) {
    updateData.due = Timestamp.fromDate(new Date(taskData.due))
  }

  if (taskData.approvedAt) {
    updateData.approvedAt = Timestamp.fromDate(new Date(taskData.approvedAt))
  }

  await updateDoc(doc(db, "tasks", taskId), updateData)
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", taskId))
}

// Batch operations
export async function batchUpdateTasks(tasks: { id: string; data: Partial<Task> }[]): Promise<void> {
  const batch = writeBatch(db)

  tasks.forEach(({ id, data }) => {
    const taskRef = doc(db, "tasks", id)
    batch.update(taskRef, data)
  })

  await batch.commit()
}

// Task Templates API
export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  const templatesSnapshot = await getDocs(collection(db, "taskTemplates"))
  return templatesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaskTemplate)
}

export function subscribeToTaskTemplates(callback: (templates: TaskTemplate[]) => void): () => void {
  const unsubscribe = onSnapshot(collection(db, "taskTemplates"), (snapshot) => {
    const templates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaskTemplate)
    callback(templates)
  })

  return unsubscribe
}

export async function addTaskTemplate(template: Omit<TaskTemplate, "id">): Promise<TaskTemplate> {
  const docRef = await addDoc(collection(db, "taskTemplates"), {
    ...template,
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...template,
  }
}

export async function updateTaskTemplate(templateId: string, templateData: Partial<TaskTemplate>): Promise<void> {
  await updateDoc(doc(db, "taskTemplates", templateId), {
    ...templateData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTaskTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, "taskTemplates", templateId))
}

// Notifications API
export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"))
  const notificationsSnapshot = await getDocs(q)

  return notificationsSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      readAt: data.readAt?.toDate().toISOString(),
    } as Notification
  })
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
): () => void {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        readAt: data.readAt?.toDate().toISOString(),
      } as Notification
    })

    callback(notifications)
  })

  return unsubscribe
}

export async function addNotification(notification: Omit<Notification, "id">): Promise<Notification> {
  const notificationWithTimestamp = {
    ...notification,
    createdAt: serverTimestamp(),
    isRead: false,
  }

  const docRef = await addDoc(collection(db, "notifications"), notificationWithTimestamp)

  return {
    id: docRef.id,
    ...notification,
    createdAt: new Date().toISOString(),
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
    readAt: serverTimestamp(),
  })
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const batch = writeBatch(db)

  const q = query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false))

  const notificationsSnapshot = await getDocs(q)

  notificationsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isRead: true,
      readAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

// File Upload API
export async function uploadTaskAttachment(taskId: string, file: File, uploadedBy: string): Promise<TaskAttachment> {
  // Create a reference to the file in Firebase Storage
  const storageRef = ref(storage, `tasks/${taskId}/${file.name}`)

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file)

  // Get the download URL
  const url = await getDownloadURL(snapshot.ref)

  // Create the attachment object
  const attachment: TaskAttachment = {
    id: `attachment-${Date.now()}`,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  }

  // Update the task with the new attachment
  const taskDoc = await getDoc(doc(db, "tasks", taskId))

  if (taskDoc.exists()) {
    const taskData = taskDoc.data() as Task
    const attachments = taskData.attachments || []

    await updateDoc(doc(db, "tasks", taskId), {
      attachments: [...attachments, attachment],
    })
  }

  return attachment
}

export async function deleteTaskAttachment(taskId: string, attachmentId: string, fileName: string): Promise<void> {
  // Delete the file from Firebase Storage
  const storageRef = ref(storage, `tasks/${taskId}/${fileName}`)
  await deleteObject(storageRef)

  // Update the task to remove the attachment
  const taskDoc = await getDoc(doc(db, "tasks", taskId))

  if (taskDoc.exists()) {
    const taskData = taskDoc.data() as Task
    const attachments = taskData.attachments || []

    await updateDoc(doc(db, "tasks", taskId), {
      attachments: attachments.filter((attachment) => attachment.id !== attachmentId),
    })
  }
}

// Cloud Functions
export async function generateTaskReport(departmentId?: string): Promise<string> {
  const generateReport = httpsCallable(functions, "generateTaskReport")
  const result = await generateReport({ departmentId })
  return result.data as string
}

// Initialize database with sample data
export async function initializeDatabase(): Promise<void> {
  // Check if departments collection exists and has data
  const deptsSnapshot = await getDocs(collection(db, "departments"))

  if (deptsSnapshot.empty) {
    // Add sample departments
    const departments = [
      { name: "BOH", description: "Back of House - Khu vực bếp và chế biến" },
      { name: "FOH", description: "Front of House - Khu vực phục vụ khách hàng" },
      { name: "Quản lý", description: "Quản lý và điều hành nhà hàng" },
      { name: "Hành chính", description: "Hành chính, kế toán và nhân sự" },
    ]

    for (const dept of departments) {
      await addDepartment(dept)
    }
  }

  // Check if users collection exists and has data
  const usersSnapshot = await getDocs(collection(db, "users"))

  if (usersSnapshot.empty) {
    // Add sample users with their permissions
    const users = [
      {
        email: "admin@chubbi.com",
        name: "Admin",
        role: "Admin",
        dept: "Quản lý",
        permissions: ["admin", "manage_users", "manage_departments", "manage_tasks", "view_reports"],
      },
      {
        email: "manager@chubbi.com",
        name: "Linh",
        role: "Quản lý chi nhánh",
        dept: "Quản lý",
        permissions: ["manage_tasks", "approve_tasks", "view_reports", "manage_departments"],
      },
      {
        email: "chef@chubbi.com",
        name: "Tuấn",
        role: "Đầu bếp trưởng",
        dept: "BOH",
        permissions: ["manage_tasks", "view_tasks", "create_tasks"],
      },
      {
        email: "staff@chubbi.com",
        name: "Mai",
        role: "Thu ngân",
        dept: "FOH",
        permissions: ["view_tasks", "update_tasks"],
      },
    ]

    // Create users with Firebase Auth and Firestore
    for (const user of users) {
      try {
        // In a real app, you would use a more secure method to set initial passwords
        // or implement a password reset flow for new users
        const createUserFunction = httpsCallable(functions, "createUser")
        await createUserFunction({
          email: user.email,
          password: "password123",
          userData: user,
        })
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error)
      }
    }
  }
}

// Analytics and Statistics
export async function getTaskStatistics(departmentId?: string): Promise<any> {
  let q = collection(db, "tasks")

  if (departmentId) {
    q = query(q, where("dept", "==", departmentId))
  }

  const tasksSnapshot = await getDocs(q)
  const tasks = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task)

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "Done").length
  const overdueTasks = tasks.filter((task) => task.status === "Overdue").length
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length
  const todoTasks = tasks.filter((task) => task.status === "To Do").length

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Group by department
  const tasksByDepartment = tasks.reduce(
    (acc, task) => {
      if (!acc[task.dept]) {
        acc[task.dept] = []
      }
      acc[task.dept].push(task)
      return acc
    },
    {} as Record<string, Task[]>,
  )

  const departmentStats = Object.entries(tasksByDepartment).map(([dept, deptTasks]) => {
    const deptCompletedTasks = deptTasks.filter((task) => task.status === "Done").length
    const deptCompletionRate = deptTasks.length > 0 ? (deptCompletedTasks / deptTasks.length) * 100 : 0

    return {
      department: dept,
      totalTasks: deptTasks.length,
      completedTasks: deptCompletedTasks,
      completionRate: deptCompletionRate,
    }
  })

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    inProgressTasks,
    todoTasks,
    completionRate,
    departmentStats,
  }
}

