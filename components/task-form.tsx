"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Clock, Link2, MessageSquare, Upload, RefreshCw, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Task, User, Department, TaskAssignee, RecurringConfig, TaskTemplate } from "@/lib/types"
import { calculateDeadline, calculateSequentialDeadlines } from "@/lib/utils"
import { mockTaskTemplates } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Tiêu đề phải có ít nhất 2 ký tự.",
  }),
  description: z.string().min(5, {
    message: "Mô tả phải có ít nhất 5 ký tự.",
  }),
  responsible: z.string({
    required_error: "Vui lòng chọn người thực hiện.",
  }),
  accountable: z.string({
    required_error: "Vui lòng chọn người phê duyệt.",
  }),
  consulted: z.string().optional(),
  informed: z.string().optional(),
  dept: z.string({
    required_error: "Vui lòng chọn phòng ban.",
  }),
  priority: z.string({
    required_error: "Vui lòng chọn mức độ ưu tiên.",
  }),
  dueDate: z.date({
    required_error: "Vui lòng chọn hạn hoàn thành.",
  }),
  isSequential: z.boolean().default(false),
  checklistItems: z.array(z.string()).optional(),
  assignees: z
    .array(
      z.object({
        userId: z.string(),
        timeAllocation: z.number().min(0.5, "Thời gian tối thiểu là 0.5 giờ"),
      }),
    )
    .optional(),
  driveUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  comment: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  recurringInterval: z.number().min(1).optional(),
  recurringEndDate: z.date().optional(),
  recurringEndAfter: z.number().min(1).optional(),
  recurringDays: z.array(z.number()).optional(),
})

interface TaskFormProps {
  users: User[]
  departments: Department[]
  onAddTask: (task: Task) => void
}

export default function TaskForm({ users, departments, onAddTask }: TaskFormProps) {
  // Thêm state và hàm để quản lý preset task
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<TaskTemplate | null>(null)
  const [presetName, setPresetName] = useState("")
  const [presetTemplates, setPresetTemplates] = useState(mockTaskTemplates)

  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState<string>("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      isSequential: false,
      checklistItems: [],
      assignees: [],
      driveUrl: "",
      comment: "",
      isRecurring: false,
      recurringFrequency: "weekly",
      recurringInterval: 1,
      recurringDays: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assignees",
  })

  // Watch for priority changes to update due date automatically
  const priority = form.watch("priority")
  const isSequential = form.watch("isSequential")
  const dueDate = form.watch("dueDate")
  const isRecurring = form.watch("isRecurring")
  const recurringFrequency = form.watch("recurringFrequency")

  useEffect(() => {
    if (priority) {
      const deadline = calculateDeadline(priority)
      form.setValue("dueDate", deadline)
    }
  }, [priority, form])

  // Thêm hàm để mở dialog chỉnh sửa preset
  const openEditPreset = (template: TaskTemplate | null = null) => {
    setEditingPreset(template)
    if (template) {
      setPresetName(template.name)
    } else {
      setPresetName("")
    }
    setShowPresetDialog(true)
  }

  // Thêm hàm để lưu preset
  const savePreset = () => {
    if (!presetName.trim()) return

    if (editingPreset) {
      // Cập nhật preset hiện có
      const updatedPresets = presetTemplates.map((t) =>
        t.id === editingPreset.id ? { ...editingPreset, name: presetName } : t,
      )
      setPresetTemplates(updatedPresets)
    } else {
      // Tạo preset mới từ form hiện tại
      const formValues = form.getValues()
      const newPreset: TaskTemplate = {
        id: `template${Date.now()}`,
        name: presetName,
        title: formValues.title || "",
        description: formValues.description || "",
        dept: formValues.dept || "",
        priority: formValues.priority || "Medium",
        checklistItems: checklistItems,
        isSequential: formValues.isSequential || false,
        defaultAssignees: formValues.assignees?.map((a) => ({
          role: users.find((u) => u.id === a.userId)?.role || "",
          timeAllocation: a.timeAllocation,
        })),
        driveUrl: formValues.driveUrl || "",
        isRecurring: formValues.isRecurring || false,
        recurringConfig: formValues.isRecurring
          ? {
              frequency: formValues.recurringFrequency || "weekly",
              interval: formValues.recurringInterval || 1,
              endDate: formValues.recurringEndDate?.toISOString(),
              endAfterOccurrences: formValues.recurringEndAfter,
              daysOfWeek: formValues.recurringDays,
            }
          : undefined,
      }

      setPresetTemplates([...presetTemplates, newPreset])
    }

    setShowPresetDialog(false)
  }

  // Thêm hàm để xóa preset
  const deletePreset = (templateId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mẫu công việc này không?")) {
      setPresetTemplates(presetTemplates.filter((t) => t.id !== templateId))
    }
  }

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)

    if (templateId === "none" || !templateId) {
      // Reset form if no template is selected
      form.reset({
        title: "",
        description: "",
        priority: "Medium",
        isSequential: false,
        checklistItems: [],
        assignees: [],
        driveUrl: "",
        comment: "",
        isRecurring: false,
        recurringFrequency: "weekly",
        recurringInterval: 1,
        recurringDays: [],
      })
      setChecklistItems([])
      return
    }

    const template = mockTaskTemplates.find((t) => t.id === templateId)
    if (template) {
      form.setValue("title", template.title)
      form.setValue("description", template.description)
      form.setValue("dept", template.dept)
      form.setValue("priority", template.priority)
      form.setValue("isSequential", template.isSequential || false)
      form.setValue("driveUrl", template.driveUrl || "")
      form.setValue("isRecurring", template.isRecurring || false)

      if (template.recurringConfig) {
        form.setValue("recurringFrequency", template.recurringConfig.frequency)
        form.setValue("recurringInterval", template.recurringConfig.interval)
        if (template.recurringConfig.endDate) {
          form.setValue("recurringEndDate", new Date(template.recurringConfig.endDate))
        }
        if (template.recurringConfig.endAfterOccurrences) {
          form.setValue("recurringEndAfter", template.recurringConfig.endAfterOccurrences)
        }
        if (template.recurringConfig.daysOfWeek) {
          form.setValue("recurringDays", template.recurringConfig.daysOfWeek)
        }
      }

      // Set checklist items
      if (template.checklistItems) {
        setChecklistItems(template.checklistItems)
        form.setValue("checklistItems", template.checklistItems)
      } else {
        setChecklistItems([])
        form.setValue("checklistItems", [])
      }

      // Set default assignees if sequential
      if (template.isSequential && template.defaultAssignees) {
        // Clear existing assignees
        while (fields.length > 0) {
          remove(0)
        }

        // Add default assignees
        template.defaultAssignees.forEach((defaultAssignee) => {
          // Find users with matching role
          const matchingUsers = users.filter((user) => user.role === defaultAssignee.role)
          if (matchingUsers.length > 0) {
            append({
              userId: matchingUsers[0].id,
              timeAllocation: defaultAssignee.timeAllocation,
            })
          }
        })
      }
    }
  }

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const updatedItems = [...checklistItems, newChecklistItem.trim()]
      setChecklistItems(updatedItems)
      form.setValue("checklistItems", updatedItems)
      setNewChecklistItem("")
    }
  }

  const handleRemoveChecklistItem = (index: number) => {
    const updatedItems = checklistItems.filter((_, i) => i !== index)
    setChecklistItems(updatedItems)
    form.setValue("checklistItems", updatedItems)
  }

  const handleAddAssignee = () => {
    append({ userId: "", timeAllocation: 1 })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Kiểm tra kích thước file (giới hạn 5MB trước khi resize)
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.")
        return
      }

      setSelectedImage(file)

      // Tạo preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Resize image nếu cần
      if (file.size > 1 * 1024 * 1024) {
        resizeImage(file)
      }
    }
  }

  const resizeImage = (file: File) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Tính toán tỷ lệ để giảm kích thước
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        // Chuyển đổi canvas thành blob với chất lượng giảm
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              setSelectedImage(resizedFile)
            }
          },
          "image/jpeg",
          0.7, // Chất lượng 70%
        )
      }
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    let assignees: TaskAssignee[] | null = null;
    let recurringConfig: RecurringConfig | null = null; // Thay undefined bằng null để tránh lỗi


    if (values.isSequential && values.assignees && values.assignees.length > 0) {
      // Calculate deadlines for sequential tasks
      const finalDeadline = values.dueDate

      assignees = values.assignees.map((a) => ({
        userId: a.userId,
        timeAllocation: a.timeAllocation,
        isCompleted: false,
      }))

      assignees = calculateSequentialDeadlines(finalDeadline, assignees)

      // Set the responsible person to the first assignee
      values.responsible = assignees[0].userId
    }

    // Xử lý cấu hình lặp lại
    if (values.isRecurring && values.recurringFrequency) {
      recurringConfig = {
        frequency: values.recurringFrequency,
        interval: values.recurringInterval || 1,
      }

      if (values.recurringEndDate) {
        recurringConfig.endDate = values.recurringEndDate.toISOString()
      }

      if (values.recurringEndAfter) {
        recurringConfig.endAfterOccurrences = values.recurringEndAfter
      }

      if (values.recurringFrequency === "weekly" && values.recurringDays && values.recurringDays.length > 0) {
        recurringConfig.daysOfWeek = values.recurringDays
      }
    }

    const newTask: Task = {
      id: `task${Math.floor(Math.random() * 10000)}`,
      title: values.title,
      description: values.description,
      responsible: values.responsible,
      accountable: values.accountable,
      consulted: values.consulted || "",
      informed: values.informed || "",
      dept: values.dept,
      priority: values.priority,
      status: "To Do",
      due: values.dueDate.toISOString(),
      created: new Date().toISOString(),
      isSequential: values.isSequential,
      assignees: assignees,
      checklistItems: values.checklistItems,
      // driveUrl: values.driveUrl || undefined,
      isRecurring: values.isRecurring,
      recurringConfig: recurringConfig,
      // comments: values.comment
      //   ? [
      //       {
      //         id: `comment${Date.now()}`,
      //         userId: values.responsible, // Người tạo comment là người thực hiện
      //         content: values.comment,
      //         timestamp: new Date().toISOString(),
      //       },
      //     ]
      //   : undefined,
      // attachments: selectedImage
      //   ? [
      //       {
      //         id: `attachment${Date.now()}`,
      //         name: selectedImage.name,
      //         url: imagePreview || "",
      //         type: selectedImage.type,
      //         size: selectedImage.size,
      //         uploadedBy: values.responsible,
      //         uploadedAt: new Date().toISOString(),
      //       },
      //     ]
      //   : undefined,
    }

    onAddTask(newTask)

    // Hiển thị thông báo xác nhận
    toast({
      title: "Tạo công việc thành công",
      description: `Công việc "${newTask.title}" đã được tạo và phân công cho ${getUserById(newTask.responsible)?.name}.`,
      variant: "success",
    })

    form.reset()
    setChecklistItems([])
    setSelectedTemplate("")
    setSelectedImage(null)
    setImagePreview(null)
  }

  const priorities = [
    { value: "Low", label: "Thấp (72 giờ)", color: "bg-green text-white" },
    { value: "Medium", label: "Trung bình (24 giờ)", color: "bg-yellow text-white" },
    { value: "High", label: "Cao (12 giờ)", color: "bg-orange text-white" },
    { value: "Urgent", label: "Khẩn cấp (4 giờ)", color: "bg-red-500 text-white" },
  ]

  return (
    <Card className="shadow-lg border-t-4 border-t-orange">
      <CardHeader className="bg-gradient-to-r from-yellow-light to-orange-light pb-2">
        <CardTitle className="text-white text-center text-2xl">Tạo công việc mới</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <FormLabel className="text-lg font-bold text-orange">Mẫu công việc</FormLabel>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEditPreset()}
                className="border-orange text-orange hover:bg-orange/10"
              >
                <Plus className="h-4 w-4 mr-1" /> Tạo mẫu mới
              </Button>
              {selectedTemplate && selectedTemplate !== "none" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditPreset(presetTemplates.find((t) => t.id === selectedTemplate) || null)}
                  className="border-yellow text-orange hover:bg-yellow/10"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Sửa mẫu
                </Button>
              )}
            </div>
          </div>
          <div className="relative mt-2">
            <select
              className="w-full h-12 rounded-md border-2 border-orange bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">Chọn mẫu công việc (không bắt buộc)</option>
              <option value="none">Không sử dụng mẫu</option>
              {presetTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="basic" className="text-base font-medium">
                  Thông tin cơ bản
                </TabsTrigger>
                <TabsTrigger value="people" className="text-base font-medium">
                  Người thực hiện
                </TabsTrigger>
                <TabsTrigger value="checklist" className="text-base font-medium">
                  Checklist công việc
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-base font-medium">
                  Tùy chọn nâng cao
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">Tiêu đề công việc</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bổ sung thịt bò USDA"
                            {...field}
                            className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dept"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">Phòng ban</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                              <SelectValue placeholder="Chọn phòng ban" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cung cấp chi tiết về công việc"
                          className="min-h-[120px] text-base border-2 border-gray-300 focus-visible:border-orange"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">Mức độ ưu tiên</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                              <SelectValue placeholder="Chọn mức độ ưu tiên" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value} className={priority.color}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base font-bold">Hạn hoàn thành</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full h-12 pl-3 text-left font-normal text-base border-2 border-gray-300 focus-visible:border-orange ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? format(field.value, "dd/MM/yyyy HH:mm") : <span>Chọn ngày</span>}
                                <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            <div className="p-3 border-t border-gray-200">
                              <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-1 font-medium">Giờ:</div>
                                <div className="col-span-3">
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":").map(Number)
                                      const newDate = new Date(field.value)
                                      newDate.setHours(hours, minutes)
                                      field.onChange(newDate)
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Thời hạn được tự động tính dựa trên mức độ ưu tiên</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="driveUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold flex items-center">
                        <Link2 className="mr-2 h-5 w-5 text-orange" />
                        Liên kết Google Drive
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://drive.google.com/..."
                          {...field}
                          className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange"
                        />
                      </FormControl>
                      <FormDescription>Thêm liên kết đến tài liệu liên quan</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/*<div className="border-2 border-gray-200 rounded-lg p-4">*/}
                {/*  <FormLabel className="text-base font-bold flex items-center mb-3">*/}
                {/*    <Upload className="mr-2 h-5 w-5 text-orange" />*/}
                {/*    Tải lên hình ảnh*/}
                {/*  </FormLabel>*/}

                {/*  <div className="space-y-4">*/}
                {/*    <Input*/}
                {/*      ref={fileInputRef}*/}
                {/*      type="file"*/}
                {/*      accept="image/*"*/}
                {/*      onChange={handleImageChange}*/}
                {/*      className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange"*/}
                {/*    />*/}

                {/*    <FormDescription>Hình ảnh sẽ tự động được resize xuống dưới 1MB</FormDescription>*/}

                {/*    {imagePreview && (*/}
                {/*      <div className="relative">*/}
                {/*        <img*/}
                {/*          src={imagePreview || "/placeholder.svg"}*/}
                {/*          alt="Preview"*/}
                {/*          className="max-h-[200px] rounded-md border border-gray-300"*/}
                {/*        />*/}
                {/*        <Button*/}
                {/*          type="button"*/}
                {/*          variant="destructive"*/}
                {/*          size="sm"*/}
                {/*          onClick={handleRemoveImage}*/}
                {/*          className="absolute top-2 right-2"*/}
                {/*        >*/}
                {/*          <Trash2 className="h-4 w-4" />*/}
                {/*        </Button>*/}
                {/*        <div className="mt-2 text-sm text-gray-500">*/}
                {/*          {selectedImage && `${selectedImage.name} (${(selectedImage.size / 1024).toFixed(2)} KB)`}*/}
                {/*        </div>*/}
                {/*      </div>*/}
                {/*    )}*/}
                {/*  </div>*/}
                {/*</div>*/}

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5 text-orange" />
                        Bình luận
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Thêm bình luận hoặc ghi chú cho công việc này"
                          className="min-h-[100px] text-base border-gray-300 focus-visible:border-orange"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Thêm ghi chú hoặc hướng dẫn cho người thực hiện</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="people" className="space-y-6">
                <FormField
                  control={form.control}
                  name="isSequential"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-200 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold">Công việc tuần tự</FormLabel>
                        <FormDescription>
                          Bật tùy chọn này nếu công việc cần được thực hiện bởi nhiều người theo thứ tự
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-orange"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isSequential ? (
                  <div className="space-y-4 border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-orange">Danh sách người thực hiện theo thứ tự</h3>
                      <Button
                        type="button"
                        onClick={handleAddAssignee}
                        className="bg-orange text-white hover:bg-orange-light"
                      >
                        <Plus className="h-5 w-5 mr-2" /> Thêm người thực hiện
                      </Button>
                    </div>

                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b-2 border-gray-200 pb-4"
                      >
                        <FormField
                          control={form.control}
                          name={`assignees.${index}.userId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">Người thực hiện #{index + 1}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                                    <SelectValue placeholder="Chọn người thực hiện" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.dept} - {user.name} ({user.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`assignees.${index}.timeAllocation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">Deadline (giờ)</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <Input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                  />
                                  <Clock className="ml-2 h-5 w-5 text-orange" />
                                </div>
                              </FormControl>
                              <FormDescription>Deadline không thể muộn hơn hạn hoàn thành chung</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mb-2 h-12 w-12"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}

                    {fields.length === 0 && (
                      <p className="text-base text-gray-500 italic">
                        Chưa có người thực hiện nào. Vui lòng thêm ít nhất một người.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="responsible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">Người thực hiện (R)</FormLabel>
                          <FormDescription>Người sẽ làm công việc này</FormDescription>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                                <SelectValue placeholder="Chọn người thực hiện" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.dept} - {user.name} ({user.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">Người phê duyệt (A)</FormLabel>
                          <FormDescription>Người phê duyệt công việc</FormDescription>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                                <SelectValue placeholder="Chọn người phê duyệt" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.dept} - {user.name} ({user.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="consulted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">Người tư vấn (C) - Không bắt buộc</FormLabel>
                        <FormDescription>Người cung cấp ý kiến</FormDescription>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                              <SelectValue placeholder="Chọn người tư vấn (không bắt buộc)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Không có</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.dept} - {user.name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="informed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">Người được thông báo (I) - Không bắt buộc</FormLabel>
                        <FormDescription>Người được cập nhật thông tin</FormDescription>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange">
                              <SelectValue placeholder="Chọn người được thông báo (không bắt buộc)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Không có</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.dept} - {user.name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="space-y-6">
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-orange mb-4">Checklist công việc</h3>

                  <div className="space-y-2 mb-4">
                    {checklistItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`checklist-${index}`}
                            className="h-5 w-5 border-2 border-orange data-[state=checked]:bg-orange"
                          />
                          <label htmlFor={`checklist-${index}`} className="text-base">
                            {item}
                          </label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChecklistItem(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}

                    {checklistItems.length === 0 && (
                      <p className="text-base text-gray-500 italic">
                        Chưa có mục kiểm tra nào. Thêm các mục cần thực hiện.
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Thêm mục kiểm tra mới"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddChecklistItem()
                        }
                      }}
                      className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange"
                    />
                    <Button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="h-12 bg-orange text-white hover:bg-orange-light"
                    >
                      Thêm
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-200 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold flex items-center">
                          <RefreshCw className="mr-2 h-5 w-5 text-orange" />
                          Công việc lặp lại
                        </FormLabel>
                        <FormDescription>Bật tùy chọn này nếu công việc cần được lặp lại theo định kỳ</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-orange"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <div className="space-y-4 border-2 border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-orange">Cấu hình lặp lại</h3>

                    <FormField
                      control={form.control}
                      name="recurringFrequency"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base">Tần suất lặp lại</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="daily"
                                  id="daily"
                                  className="border-2 border-orange text-orange"
                                />
                                <label htmlFor="daily" className="text-base">
                                  Hàng ngày
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="weekly"
                                  id="weekly"
                                  className="border-2 border-orange text-orange"
                                />
                                <label htmlFor="weekly" className="text-base">
                                  Hàng tuần
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="monthly"
                                  id="monthly"
                                  className="border-2 border-orange text-orange"
                                />
                                <label htmlFor="monthly" className="text-base">
                                  Hàng tháng
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="custom"
                                  id="custom"
                                  className="border-2 border-orange text-orange"
                                />
                                <label htmlFor="custom" className="text-base">
                                  Tùy chỉnh
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurringInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Khoảng thời gian</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="1"
                                className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange w-20"
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                              />
                              <span className="text-base">
                                {recurringFrequency === "daily" && "ngày"}
                                {recurringFrequency === "weekly" && "tuần"}
                                {recurringFrequency === "monthly" && "tháng"}
                                {recurringFrequency === "custom" && "ngày"}
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Lặp lại mỗi {field.value || 1} {recurringFrequency === "daily" && "ngày"}
                            {recurringFrequency === "weekly" && "tuần"}
                            {recurringFrequency === "monthly" && "tháng"}
                            {recurringFrequency === "custom" && "ngày"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {recurringFrequency === "weekly" && (
                      <FormField
                        control={form.control}
                        name="recurringDays"
                        render={({ field }) => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel className="text-base">Các ngày trong tuần</FormLabel>
                              <FormDescription>Chọn các ngày trong tuần mà công việc sẽ lặp lại</FormDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, index) => (
                                <FormItem key={index} className="flex flex-row items-start space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(index)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || []
                                        if (checked) {
                                          field.onChange([...currentValue, index])
                                        } else {
                                          field.onChange(currentValue.filter((day) => day !== index))
                                        }
                                      }}
                                      className="h-5 w-5 border-2 border-orange data-[state=checked]:bg-orange"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-base font-normal">{day}</FormLabel>
                                </FormItem>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <FormField
                        control={form.control}
                        name="recurringEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-base">Kết thúc vào ngày</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full h-12 pl-3 text-left font-normal text-base border-2 border-gray-300 focus-visible:border-orange ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Chọn ngày kết thúc</span>}
                                    <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Để trống nếu không có ngày kết thúc cụ thể</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurringEndAfter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Kết thúc sau số lần</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Số lần lặp lại"
                                className="h-12 text-base border-2 border-gray-300 focus-visible:border-orange"
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormDescription>Để trống nếu không giới hạn số lần lặp lại</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button type="submit" className="w-full h-14 text-lg font-bold bg-orange text-white hover:bg-orange-light">
              Tạo công việc
            </Button>
          </form>
        </Form>
        {/* Dialog quản lý preset */}
        <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-orange text-xl">
                {editingPreset ? "Chỉnh sửa mẫu công việc" : "Tạo mẫu công việc mới"}
              </DialogTitle>
              <DialogDescription>
                {editingPreset
                  ? "Cập nhật thông tin cho mẫu công việc"
                  : "Lưu các thông tin hiện tại thành mẫu công việc để sử dụng sau"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tên mẫu công việc</label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nhập tên mẫu công việc"
                  className="mt-1 h-10 border-2 border-gray-300 focus-visible:border-orange"
                />
              </div>

              {editingPreset && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Thông tin mẫu</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Tiêu đề:</span> {editingPreset.title}
                    </p>
                    <p>
                      <span className="font-medium">Phòng ban:</span> {editingPreset.dept}
                    </p>
                    <p>
                      <span className="font-medium">Mức ưu tiên:</span> {editingPreset.priority}
                    </p>
                    {editingPreset.isSequential && <p className="text-orange">Công việc tuần tự</p>}
                    {editingPreset.isRecurring && <p className="text-yellow">Công việc lặp lại</p>}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              {editingPreset && (
                <Button variant="destructive" onClick={() => deletePreset(editingPreset.id)} className="mr-auto">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa mẫu
                </Button>
              )}
              <div>
                <Button variant="outline" onClick={() => setShowPresetDialog(false)} className="mr-2">
                  Hủy
                </Button>
                <Button onClick={savePreset} className="bg-orange text-white hover:bg-orange-light">
                  {editingPreset ? "Cập nhật" : "Lưu mẫu"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

