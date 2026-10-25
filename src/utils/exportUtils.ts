/**
 * Utility untuk Ekspor Data Laporan ke CSV / Microsoft Excel
 * Dilengkapi UTF-8 BOM (\uFEFF) agar terbaca sempurna di Microsoft Excel
 */

export const exportToCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
) => {
  // 1. Format baris CSV dengan escaping kutip & koma
  const formatCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(formatCell).join(',');
  const dataRows = rows.map((row) => row.map(formatCell).join(',')).join('\r\n');

  // 2. Tambahkan UTF-8 Byte Order Mark (\uFEFF) agar Excel mengenali encoding
  const csvContent = `\uFEFF${headerRow}\r\n${dataRows}`;

  // 3. Trigger download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
