/**
 * BizzCount ERP - Shared Utility Library
 * Centralized logic for exports, formatting, and simulations.
 */

/**
 * Generates and triggers a browser download for a CSV file.
 * @param filename - Name of the file, e.g., 'invoices.csv'
 * @param headers - Column headers array
 * @param data - Array of objects representing rows
 */
export function exportToCSV(filename: string, headers: string[], data: any[]) {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header.toLowerCase()] || '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Triggers a generic file input click for importing data.
 */
export function triggerImport(callback: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xls,.xlsx';
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    if (file) callback(file);
  };
  input.click();
}
