import { expect, test, describe, beforeEach } from 'vitest'
import { Assignment } from '@/types/database'
import { exportAssignmentsToCSV, exportAssignmentsToPDF } from '@/utils/export'

const mockAssignments: Assignment[] = [
    {
        id: '1', title: 'Fix login bug', description: 'Auth flow broken',
        priority: 'high', status: 'pending', due_date: '2026-04-01T00:00:00Z',
        schedule_id: null, created_by: 'user1', created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z'
    },
    {
        id: '2', title: 'Write docs', description: 'API documentation',
        priority: 'low', status: 'completed', due_date: '2026-03-15T00:00:00Z',
        schedule_id: null, created_by: 'user1', created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-14T00:00:00Z'
    },
    {
        id: '3', title: 'Deploy v2', description: null,
        priority: 'urgent', status: 'in_progress', due_date: null,
        schedule_id: 'sched-1', created_by: 'user2', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z'
    }
]

describe('CSV Export', () => {
    beforeEach(() => {
        // Mock browser APIs not available in jsdom
        global.URL.createObjectURL = () => 'blob:test'
        global.URL.revokeObjectURL = () => {}
        document.body.appendChild = (() => document.body) as any
        document.body.removeChild = (() => document.body) as any
    })

    test('does not throw with valid assignments', () => {
        expect(() => exportAssignmentsToCSV(mockAssignments)).not.toThrow()
    })

    test('does not throw with empty array', () => {
        expect(() => exportAssignmentsToCSV([])).not.toThrow()
    })

    test('does not throw with null-like input', () => {
        expect(() => exportAssignmentsToCSV(null as any)).not.toThrow()
    })

    test('handles assignments with null descriptions', () => {
        const withNulls = [mockAssignments[2]] // description is null
        expect(() => exportAssignmentsToCSV(withNulls)).not.toThrow()
    })

    test('handles assignments with null due dates', () => {
        const withNullDates = [mockAssignments[2]] // due_date is null
        expect(() => exportAssignmentsToCSV(withNullDates)).not.toThrow()
    })
})

describe('PDF Export', () => {
    test('does not throw with valid assignments', () => {
        // Mock window.open
        global.window.open = () => ({
            document: { write: () => {}, close: () => {} },
            print: () => {}
        } as any)
        expect(() => exportAssignmentsToPDF(mockAssignments)).not.toThrow()
    })

    test('handles null window.open gracefully', () => {
        global.window.open = () => null
        expect(() => exportAssignmentsToPDF(mockAssignments)).not.toThrow()
    })

    test('does not throw with empty array', () => {
        expect(() => exportAssignmentsToPDF([])).not.toThrow()
    })
})
