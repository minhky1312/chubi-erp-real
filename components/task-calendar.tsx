"use client"

import { useState, useEffect } from "react"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "moment/locale/vi"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Task, User, CalendarEvent } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { ChevronLeft, ChevronRight, CalendarIcon, Users, Clock } from "lucide-react"

moment.locale("vi")
const localizer = momentLocalizer(moment)

interface TaskCalendarProps {
  tasks: Task[]
  users: User[]
}

export default function TaskCalendar({ tasks, users }: TaskCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [view, setView] = useState("month")
  const [date, setDate] = useState(new Date())
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [filterUser, setFilterUser] = useState<string>("all")
  const [filterDept, setFilterDept] = useState<string>("all")
  // Cập nhật hiển thị lịch để hiển thị tối đa 10 công việc mỗi ngày với tên và người phụ trách
  // Thêm state để sắp xếp theo người
  const [sortByPerson, setSortByPerson] = useState(false)

  // Cập nhật hàm tạo events để hiển thị tên người phụ trách và giới hạn số lượng
  useEffect(() => {
    // Lọc và sắp xếp tasks
    let filteredTasks = tasks.filter((task) => {
      if (filterUser !== "all" && task.responsible !== filterUser) return false
      if (filterDept !== "all" && task.dept !== filterDept) return false
      return true
    })

    // Sắp xếp theo người nếu cần
    if (sortByPerson) {
      filteredTasks = [...filteredTasks].sort((a, b) => {
        const personA = users.find((u) => u.id === a.responsible)?.name || ""
        const personB = users.find((u) => u.id === b.responsible)?.name || ""
        return personA.localeCompare(personB)
      })
    }

    // Nhóm các task theo ngày
    const tasksByDate: Record<string, Task[]> = {}

    filteredTasks.forEach((task) => {
      const dateKey = new Date(task.due).toDateString()
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = []
      }

      // Chỉ thêm vào nếu chưa đạt tối đa 10 task mỗi ngày
      if (tasksByDate[dateKey].length < 10) {
        tasksByDate[dateKey].push(task)
      }
    })

    // Tạo events từ tasks đã lọc và giới hạn
    const taskEvents: CalendarEvent[] = []

    Object.entries(tasksByDate).forEach(([dateKey, dateTasks]) => {
      dateTasks.forEach((task) => {
        // Xác định màu sắc dựa trên trạng thái
        let color = "#63b842" // green
        switch (task.status) {
          case "To Do":
            color = "#b36dae" // purple
            break
          case "In Progress":
            color = "#fd6f28" // orange
            break
          case "Done":
            color = "#63b842" // green
            break
          case "Overdue":
            color = "#f37021" // orange light
            break
        }

        // Tính thời gian kết thúc (mặc định là 1 giờ sau deadline)
        const start = new Date(task.due)
        const end = new Date(start.getTime() + 60 * 60 * 1000)

        // Lấy thông tin người phụ trách
        const responsible = users.find((u) => u.id === task.responsible)

        taskEvents.push({
          id: task.id,
          title: `${task.title} - ${responsible?.name || ""}`,
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: false,
          type: "task",
          taskId: task.id,
          color,
          status: task.status,
        })
      })
    })

    // Thêm các cuộc họp mẫu (trong thực tế, bạn sẽ lấy từ API)
    const meetingEvents: CalendarEvent[] = [
      {
        id: "meeting1",
        title: "Họp giao ban tuần",
        start: moment().startOf("week").add(1, "day").set({ hour: 9, minute: 0 }).toISOString(),
        end: moment().startOf("week").add(1, "day").set({ hour: 10, minute: 0 }).toISOString(),
        type: "meeting",
        color: "#f9e840", // yellow
      },
      {
        id: "meeting2",
        title: "Đánh giá hiệu suất tháng",
        start: moment().endOf("month").subtract(2, "day").set({ hour: 14, minute: 0 }).toISOString(),
        end: moment().endOf("month").subtract(2, "day").set({ hour: 16, minute: 0 }).toISOString(),
        type: "meeting",
        color: "#fedf8b", // yellow light
      },
    ]

    setEvents([...taskEvents, ...meetingEvents])
  }, [tasks, filterUser, filterDept, users, sortByPerson])

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    if (event.type === "task" && event.taskId) {
      const task = tasks.find((t) => t.id === event.taskId)
      if (task) {
        setSelectedTask(task)
      }
    }
    setShowEventDialog(true)
  }

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setDate((prevDate) => {
        if (view === "month") {
          return moment(prevDate).subtract(1, "month").toDate()
        } else if (view === "week") {
          return moment(prevDate).subtract(1, "week").toDate()
        } else {
          return moment(prevDate).subtract(1, "day").toDate()
        }
      })
    } else if (action === "NEXT") {
      setDate((prevDate) => {
        if (view === "month") {
          return moment(prevDate).add(1, "month").toDate()
        } else if (view === "week") {
          return moment(prevDate).add(1, "week").toDate()
        } else {
          return moment(prevDate).add(1, "day").toDate()
        }
      })
    } else {
      setDate(new Date())
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: "4px",
        opacity: 0.9,
        color: "#fff",
        border: "0px",
        display: "block",
        fontWeight: "bold",
      },
    }
  }

  // Lấy danh sách phòng ban duy nhất
  const departments = [...new Set(tasks.map((task) => task.dept))]

  const getUserById = (id: string) => {
    return users.find((user) => user.id === id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate("PREV")}
            className="h-10 w-10 rounded-full bg-yellow-light text-orange hover:bg-yellow"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleNavigate("TODAY")}
            className="h-10 px-4 bg-orange text-white hover:bg-orange-light"
          >
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate("NEXT")}
            className="h-10 w-10 rounded-full bg-yellow-light text-orange hover:bg-yellow"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold">
            {view === "month"
              ? moment(date).format("MMMM YYYY")
              : view === "week"
                ? `Tuần ${moment(date).week()} - ${moment(date).format("YYYY")}`
                : moment(date).format("DD/MM/YYYY")}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select defaultValue={view} onValueChange={setView}>
            <SelectTrigger className="w-[120px] bg-purple text-white">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Chế độ xem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Tháng</SelectItem>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="day">Ngày</SelectItem>
              <SelectItem value="agenda">Lịch trình</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[150px] bg-green text-white">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Lọc theo người" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả người dùng</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[150px] bg-orange text-white">
              <Users className="mr-2 h-4 w-4" />
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortByPerson(!sortByPerson)}
            className={`h-10 ${sortByPerson ? "bg-purple text-white" : "border-purple text-purple"}`}
          >
            <Users className="mr-2 h-4 w-4" />
            {sortByPerson ? "Đang sắp xếp theo người" : "Sắp xếp theo người"}
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-orange">
        <CardHeader className="bg-gradient-to-r from-yellow-light to-orange-light pb-2">
          <CardTitle className="text-white text-center text-2xl">Lịch công việc & cuộc họp</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[700px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              view={view as any}
              date={date}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              formats={{
                dayHeaderFormat: (date: Date) => moment(date).format("dddd DD/MM"),
                dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${moment(start).format("DD/MM")} - ${moment(end).format("DD/MM")}`,
                agendaDateFormat: (date: Date) => moment(date).format("DD/MM/YYYY"),
                agendaTimeFormat: (date: Date) => moment(date).format("HH:mm"),
                agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
              }}
              messages={{
                today: "Hôm nay",
                previous: "Trước",
                next: "Sau",
                month: "Tháng",
                week: "Tuần",
                day: "Ngày",
                agenda: "Lịch trình",
                date: "Ngày",
                time: "Thời gian",
                event: "Sự kiện",
                noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này",
                showMore: (total: number) => `+ ${total} sự kiện khác`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-xl ${selectedEvent?.type === "task" ? "text-orange" : "text-yellow"}`}>
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.type === "task" ? "Chi tiết công việc" : "Chi tiết cuộc họp"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent?.type === "task" && selectedTask ? (
              <>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange" />
                  <span className="font-medium">Hạn hoàn thành:</span> {formatDate(selectedTask.due)}
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green" />
                  <span className="font-medium">Người thực hiện:</span> {getUserById(selectedTask.responsible)?.name}
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">{selectedTask.description}</p>
                </div>
                {selectedTask.driveUrl && (
                  <div>
                    <span className="font-medium">Tài liệu:</span>
                    <a
                      href={selectedTask.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Xem tài liệu
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow" />
                  <span className="font-medium">Thời gian:</span>
                  {selectedEvent &&
                    `${moment(selectedEvent.start).format("HH:mm")} - ${moment(selectedEvent.end).format("HH:mm")}`}
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">Chi tiết cuộc họp sẽ được cập nhật sau.</p>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowEventDialog(false)} className="bg-orange text-white hover:bg-orange-light">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

