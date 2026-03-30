import { Assignment } from "@/types/database";

export function exportAssignmentsToCSV(assignments: Assignment[]) {
  if (!assignments || assignments.length === 0) return;

  const headers = ["ID", "Title", "Description", "Priority", "Status", "Due Date", "Created At"];
  
  const csvRows = assignments.map(a => {
      // Escape strings containing quotes or commas
      const escape = (str: string | null) => {
          if (!str) return '""';
          const clean = str.replace(/"/g, '""');
          return `"${clean}"`;
      };

      return [
          escape(a.id),
          escape(a.title),
          escape(a.description),
          escape(a.priority),
          escape(a.status),
          escape(a.due_date ? new Date(a.due_date).toLocaleDateString() : ''),
          escape(new Date(a.created_at).toLocaleDateString())
      ].join(",");
  });

  const csvString = [headers.join(","), ...csvRows].join("\n");
  
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `assignments_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
