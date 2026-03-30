import { expect, test, describe } from 'vitest'
import { Assignment, Schedule } from '@/types/database'

// ==========================================
// Overdue Logic Tests (mirrors client-side)
// ==========================================
function isOverdue(assignment: Assignment): boolean {
    return assignment.status !== 'completed'
        && assignment.due_date !== null
        && new Date(assignment.due_date) < new Date()
}

function getDisplayStatus(assignment: Assignment): string {
    return isOverdue(assignment) ? 'overdue' : assignment.status
}

describe('Overdue Detection Logic', () => {
    test('assignment is overdue when due date is in the past and not completed', () => {
        const a: Assignment = {
            id: '1', title: 'Old task', description: null,
            priority: 'medium', status: 'pending',
            due_date: '2020-01-01T00:00:00Z',
            schedule_id: null, created_by: 'u1',
            created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z'
        }
        expect(isOverdue(a)).toBe(true)
        expect(getDisplayStatus(a)).toBe('overdue')
    })

    test('completed assignment is NOT overdue even with past due date', () => {
        const a: Assignment = {
            id: '2', title: 'Done task', description: null,
            priority: 'medium', status: 'completed',
            due_date: '2020-01-01T00:00:00Z',
            schedule_id: null, created_by: 'u1',
            created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z'
        }
        expect(isOverdue(a)).toBe(false)
        expect(getDisplayStatus(a)).toBe('completed')
    })

    test('assignment with no due date is NOT overdue', () => {
        const a: Assignment = {
            id: '3', title: 'No deadline', description: null,
            priority: 'medium', status: 'in_progress',
            due_date: null,
            schedule_id: null, created_by: 'u1',
            created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z'
        }
        expect(isOverdue(a)).toBe(false)
        expect(getDisplayStatus(a)).toBe('in_progress')
    })

    test('assignment with future due date is NOT overdue', () => {
        const a: Assignment = {
            id: '4', title: 'Future task', description: null,
            priority: 'medium', status: 'pending',
            due_date: '2099-12-31T00:00:00Z',
            schedule_id: null, created_by: 'u1',
            created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z'
        }
        expect(isOverdue(a)).toBe(false)
        expect(getDisplayStatus(a)).toBe('pending')
    })
})

// ==========================================
// Dashboard Stats Calculation Tests
// ==========================================
function calculateStats(assignments: Assignment[]) {
    const total = assignments.length
    const completedCount = assignments.filter(a => a.status === 'completed').length
    const overdueCount = assignments.filter(a =>
        a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()
    ).length
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0
    return { total, completedCount, overdueCount, completionRate }
}

describe('Dashboard Stats Calculation', () => {
    test('calculates correct stats with mixed assignments', () => {
        const assignments: Assignment[] = [
            { id: '1', title: 'A', description: null, priority: 'medium', status: 'completed', due_date: '2020-01-01T00:00:00Z', schedule_id: null, created_by: 'u1', created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z' },
            { id: '2', title: 'B', description: null, priority: 'medium', status: 'pending', due_date: '2020-01-01T00:00:00Z', schedule_id: null, created_by: 'u1', created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z' },
            { id: '3', title: 'C', description: null, priority: 'medium', status: 'in_progress', due_date: '2099-01-01T00:00:00Z', schedule_id: null, created_by: 'u1', created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z' },
            { id: '4', title: 'D', description: null, priority: 'medium', status: 'completed', due_date: null, schedule_id: null, created_by: 'u1', created_at: '2020-01-01T00:00:00Z', updated_at: '2020-01-01T00:00:00Z' },
        ]
        const stats = calculateStats(assignments)
        expect(stats.total).toBe(4)
        expect(stats.completedCount).toBe(2)
        expect(stats.overdueCount).toBe(1) // only B is overdue
        expect(stats.completionRate).toBe(50)
    })

    test('returns zero rate with empty array', () => {
        const stats = calculateStats([])
        expect(stats.total).toBe(0)
        expect(stats.completedCount).toBe(0)
        expect(stats.overdueCount).toBe(0)
        expect(stats.completionRate).toBe(0)
    })

    test('returns 100% with all completed', () => {
        const assignments: Assignment[] = [
            { id: '1', title: 'A', description: null, priority: 'medium', status: 'completed', due_date: null, schedule_id: null, created_by: 'u1', created_at: '', updated_at: '' },
            { id: '2', title: 'B', description: null, priority: 'medium', status: 'completed', due_date: null, schedule_id: null, created_by: 'u1', created_at: '', updated_at: '' },
        ]
        expect(calculateStats(assignments).completionRate).toBe(100)
    })
})

// ==========================================
// Schedule Recurrence Matching Tests
// ==========================================
function shouldScheduleFire(schedule: Schedule, date: Date): boolean {
    if (schedule.is_paused) return false
    const config: any = schedule.config || {}

    if (schedule.recurrence_type === 'daily') return true
    if (schedule.recurrence_type === 'weekly') {
        return Array.isArray(config.days) && config.days.includes(date.getDay())
    }
    if (schedule.recurrence_type === 'monthly') {
        return Array.isArray(config.dates) && config.dates.includes(date.getDate())
    }
    return false
}

describe('Schedule Recurrence Matching', () => {
    const baseSchedule: Schedule = {
        id: 's1', title: 'Test', description: null,
        recurrence_type: 'daily', config: {},
        trigger_time: '09:00:00', priority: 'medium',
        default_assignee_id: null, is_paused: false,
        created_by: 'u1', created_at: ''
    }

    test('daily schedule fires on any day', () => {
        expect(shouldScheduleFire({ ...baseSchedule, recurrence_type: 'daily' }, new Date('2026-03-31'))).toBe(true)
        expect(shouldScheduleFire({ ...baseSchedule, recurrence_type: 'daily' }, new Date('2026-04-01'))).toBe(true)
    })

    test('paused schedule never fires', () => {
        expect(shouldScheduleFire({ ...baseSchedule, is_paused: true }, new Date())).toBe(false)
    })

    test('weekly schedule fires only on matching days', () => {
        const weekly: Schedule = { ...baseSchedule, recurrence_type: 'weekly', config: { days: [1, 3, 5] } } // Mon,Wed,Fri
        const monday = new Date('2026-03-30') // Monday
        const tuesday = new Date('2026-03-31') // Tuesday
        expect(shouldScheduleFire(weekly, monday)).toBe(true)
        expect(shouldScheduleFire(weekly, tuesday)).toBe(false)
    })

    test('monthly schedule fires on matching date', () => {
        const monthly: Schedule = { ...baseSchedule, recurrence_type: 'monthly', config: { dates: [1, 15] } }
        const first = new Date('2026-04-01')
        const fifteenth = new Date('2026-04-15')
        const second = new Date('2026-04-02')
        expect(shouldScheduleFire(monthly, first)).toBe(true)
        expect(shouldScheduleFire(monthly, fifteenth)).toBe(true)
        expect(shouldScheduleFire(monthly, second)).toBe(false)
    })

    test('weekly with empty days array never fires', () => {
        const weekly: Schedule = { ...baseSchedule, recurrence_type: 'weekly', config: { days: [] } }
        expect(shouldScheduleFire(weekly, new Date())).toBe(false)
    })

    test('monthly with missing config never fires', () => {
        const monthly: Schedule = { ...baseSchedule, recurrence_type: 'monthly', config: {} }
        expect(shouldScheduleFire(monthly, new Date())).toBe(false)
    })
})
