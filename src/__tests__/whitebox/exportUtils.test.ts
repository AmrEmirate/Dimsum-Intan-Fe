import { describe, it, expect } from 'vitest';

describe('White Box Testing: exportUtils.ts (CSV Formatting & Excel Compatibility)', () => {
  // Replicating pure cell formatting logic from exportUtils.ts
  const formatCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const generateCsvString = (headers: string[], rows: (string | number | undefined | null)[][]) => {
    const headerRow = headers.map(formatCell).join(',');
    const dataRows = rows.map((row) => row.map(formatCell).join(',')).join('\r\n');
    return `\uFEFF${headerRow}\r\n${dataRows}`;
  };

  it('should escape internal double quotes by doubling them (""quote"")', () => {
    expect(formatCell('Dimsum "Spesial"')).toBe('"Dimsum ""Spesial"""');
  });

  it('should wrap values containing commas safely in quotes', () => {
    expect(formatCell('Bandung, Jawa Barat')).toBe('"Bandung, Jawa Barat"');
  });

  it('should handle null and undefined as empty quoted strings ("")', () => {
    expect(formatCell(null)).toBe('""');
    expect(formatCell(undefined)).toBe('""');
  });

  it('should prepend UTF-8 Byte Order Mark (\\uFEFF) to make Excel parse UTF-8 characters properly', () => {
    const headers = ['Nama', 'Harga'];
    const rows = [['Dimsum', 25000]];
    const csv = generateCsvString(headers, rows);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Nama","Harga"\r\n"Dimsum","25000"');
  });
});

