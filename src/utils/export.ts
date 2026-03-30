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

export function exportAssignmentsToPDF(assignments: Assignment[]) {
    if (!assignments || assignments.length === 0) return;

    const rows = assignments.map(a => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #333">${a.title}</td>
            <td style="padding:8px;border-bottom:1px solid #333">${a.priority}</td>
            <td style="padding:8px;border-bottom:1px solid #333">${a.status}</td>
            <td style="padding:8px;border-bottom:1px solid #333">${a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</td>
        </tr>
    `).join('')

    const html = `
    <html>
    <head><title>AssignmentHub Report</title></head>
    <body style="font-family:system-ui,sans-serif;color:#e4e4e7;background:#09090b;padding:40px">
        <h1 style="font-size:24px;margin-bottom:4px">AssignmentHub — Assignment Report</h1>
        <p style="color:#71717a;font-size:13px;margin-bottom:24px">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
                <tr style="text-align:left;color:#a1a1aa;border-bottom:2px solid #3f3f46">
                    <th style="padding:8px">Title</th>
                    <th style="padding:8px">Priority</th>
                    <th style="padding:8px">Status</th>
                    <th style="padding:8px">Due Date</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p style="color:#52525b;font-size:11px;margin-top:32px">Total: ${assignments.length} assignments | Completed: ${assignments.filter(a => a.status === 'completed').length}</p>
    </body>
    </html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => { printWindow.print() }, 300)
    }
}
