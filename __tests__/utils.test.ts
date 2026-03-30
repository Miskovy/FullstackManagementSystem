import { expect, test, describe } from 'vitest'
import { Assignment } from '@/types/database'
import { exportAssignmentsToCSV } from '@/utils/export'

describe('CSV Export Utility', () => {
  test('It should not throw when exporting assignments', () => {
    // Mock URL.createObjectURL since it's not present in JSDOM out of the box
    global.URL.createObjectURL = () => 'blob:test';
    
    const mockAssignments: Assignment[] = [
        {
            id: '123',
            title: 'Test Assignment',
            description: 'Test Desc',
            priority: 'medium',
            status: 'pending',
            due_date: '2026-12-31T00:00:00Z',
            assignee_id: 'abc',
            schedule_id: null,
            created_by: 'xyz',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z'
        }
    ];
    
    // We expect it to not throw any errors when executing the mapping logic
    expect(() => exportAssignmentsToCSV(mockAssignments)).not.toThrow();
  })
})
