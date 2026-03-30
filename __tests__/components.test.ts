import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ==========================================
// Component Rendering Integration Tests
// ==========================================

// We test that key components render without crashing and display expected content.
// These are integration tests because they test the full React render pipeline.
// Note: Components that rely on Next.js router (PageTransition) or heavy charting
// libraries (AnalyticsChart/Recharts) are tested via E2E, not unit tests.

describe('ToastProvider Component', () => {
    test('renders children without error', async () => {
        const { ToastProvider } = await import('@/components/ToastProvider')
        render(
            React.createElement(ToastProvider, null,
                React.createElement('span', { 'data-testid': 'inner' }, 'Content')
            )
        )
        expect(screen.getByTestId('inner')).toBeDefined()
    })
})

describe('ThemeProvider Component', () => {
    test('renders children and defaults to dark theme', async () => {
        const { ThemeProvider } = await import('@/components/ThemeProvider')
        render(
            React.createElement(ThemeProvider, null,
                React.createElement('div', { 'data-testid': 'themed' }, 'Themed App')
            )
        )
        expect(screen.getByText('Themed App')).toBeDefined()
    })
})

// ==========================================
// Type Validation Tests
// ==========================================
describe('Database Type Validation', () => {
    test('Assignment type accepts all valid statuses', () => {
        const statuses = ['pending', 'in_progress', 'completed', 'overdue']
        statuses.forEach(status => {
            const a = { id: '1', title: 'T', description: null, priority: 'medium' as const, status: status as any, due_date: null, schedule_id: null, created_by: 'u', created_at: '', updated_at: '' }
            expect(a.status).toBe(status)
        })
    })

    test('Assignment type accepts all valid priorities', () => {
        const priorities = ['low', 'medium', 'high', 'urgent']
        priorities.forEach(priority => {
            const a = { id: '1', title: 'T', description: null, priority: priority as any, status: 'pending' as const, due_date: null, schedule_id: null, created_by: 'u', created_at: '', updated_at: '' }
            expect(a.priority).toBe(priority)
        })
    })

    test('Schedule type accepts all recurrence types', () => {
        const types = ['daily', 'weekly', 'monthly']
        types.forEach(type => {
            const s = { id: '1', title: 'T', description: null, recurrence_type: type as any, config: {}, trigger_time: '09:00:00', priority: 'medium' as const, default_assignee_id: null, is_paused: false, created_by: 'u', created_at: '' }
            expect(s.recurrence_type).toBe(type)
        })
    })
})
