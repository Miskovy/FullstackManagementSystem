"use client"

import { Download, FileText } from "lucide-react"
import { Assignment } from "@/types/database"
import { exportAssignmentsToCSV, exportAssignmentsToPDF } from "@/utils/export"

export default function ExportButton({ assignments }: { assignments: Assignment[] }) {
    return (
        <div className="flex gap-2">
            <button 
                onClick={() => exportAssignmentsToCSV(assignments)}
                className="flex items-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors"
            >
                <Download className="w-4 h-4 text-zinc-400" />
                CSV
            </button>
            <button 
                onClick={() => exportAssignmentsToPDF(assignments)}
                className="flex items-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors"
            >
                <FileText className="w-4 h-4 text-zinc-400" />
                PDF
            </button>
        </div>
    )
}
