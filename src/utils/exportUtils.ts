/**
 * Utility untuk Ekspor & Impor Data Laporan / Master ke CSV & Microsoft Excel
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

export const exportToJson = (filename: string, data: any) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Robust CSV parser that handles quotes, escaped quotes (""), commas inside quotes,
 * and different line endings (\r\n and \n).
 */
export const parseCsv = (csvText: string): string[][] => {
  // Strip UTF-8 BOM if present
  let text = csvText.replace(/^\uFEFF/, '').trim();
  if (!text) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      currentRow.push(currentField.trim());
      // Only push non-empty rows
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push last field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Downloads official CSV template for Bulk Menu & HPP Import
 */
export const downloadMenuCsvTemplate = () => {
  const headers = [
    'Nama Menu',
    'Kategori',
    'Harga Jual',
    'Modal HPP',
    'Stok Awal',
    'Deskripsi',
  ];

  const sampleRows = [
    [
      'Siomay Ayam Jamur',
      'Kukus',
      20000,
      9000,
      100,
      'Siomay olahan daging ayam segar dan jamur kuping gurih',
    ],
    [
      'Dimsum Mentai Mozzarella',
      'Mentai Series',
      25000,
      11500,
      80,
      'Dimsum kukus lembut dengan saus mentai bakar dan lelehan keju',
    ],
    [
      'Dimsum Udang Keju Crispy',
      'Goreng',
      28000,
      13000,
      60,
      'Dimsum goreng renyah isi udang utuh dan keju meleleh',
    ],
    [
      'Hakau Udang Special',
      'Kukus',
      26000,
      12000,
      75,
      'Hakau kulit transparan dengan isian udang utuh premium',
    ],
    [
      'Pangsit Goreng Mayonaise',
      'Goreng',
      18000,
      8000,
      50,
      'Pangsit goreng isi olahan ayam udang disajikan dengan saus mayo',
    ],
    [
      'Es Teh Manis Melati',
      'Minuman',
      6000,
      1500,
      200,
      'Teh melati seduh segar manis dingin',
    ],
  ];

  exportToCsv('Template_Impor_Menu_Dimsum_Intan', headers, sampleRows);
};

/**
 * Downloads official CSV template for Branch / Outlet Import
 */
export const downloadBranchCsvTemplate = () => {
  const headers = [
    'Kode Cabang',
    'Nama Cabang',
    'Kota',
    'Alamat Lengkap',
    'No Telepon',
    'Target Omset Harian',
  ];

  const sampleRows = [
    [
      'DPU',
      'Outlet Dipatiukur',
      'Bandung',
      'Jl. Dipati Ukur No. 45, Lebakgede, Coblong, Kota Bandung',
      '081234567890',
      4500000,
    ],
    [
      'RIU',
      'Outlet Riau Heritage',
      'Bandung',
      'Jl. R.E. Martadinata No. 112, Cihapit, Bandung Wetan',
      '081234567891',
      5000000,
    ],
  ];

  exportToCsv('Template_Impor_Cabang_Dimsum_Intan', headers, sampleRows);
};
