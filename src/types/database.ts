export type UserRole = 'admin' | 'member'
export type ScheduleType = 'daily' | 'weekly' | 'monthly'
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  created_at: string
}

export interface Schedule {
  id: string
  title: string
  description: string | null
  recurrence_type: ScheduleType
  config: any // Record<string, any>
  trigger_time: string
  priority: AssignmentPriority
  default_assignee_id: string | null
  is_paused: boolean
  created_by: string
  created_at: string
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  priority: AssignmentPriority
  status: AssignmentStatus
  due_date: string | null
  assignee_id: string | null
  schedule_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
    id: string
    name: string
    color: string
}

export interface Template {
    id: string
    title: string
    description: string | null
    priority: AssignmentPriority
    created_by: string
    created_at: string
}
