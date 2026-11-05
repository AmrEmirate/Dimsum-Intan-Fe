import { describe, it, expect } from 'vitest';
import { parseCsv } from '../../utils/exportUtils';

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

  describe('CSV Parser (parseCsv)', () => {
    it('should parse standard CSV with commas and newlines', () => {
      const csv = 'Nama Menu,Kategori,Harga Jual\nSiomay Ayam,Kukus,20000\nHakau Udang,Kukus,25000';
      const parsed = parseCsv(csv);
      expect(parsed).toEqual([
        ['Nama Menu', 'Kategori', 'Harga Jual'],
        ['Siomay Ayam', 'Kukus', '20000'],
        ['Hakau Udang', 'Kukus', '25000'],
      ]);
    });

    it('should strip UTF-8 BOM properly when parsing', () => {
      const csv = '\uFEFF"Nama Menu","Harga"\n"Siomay",20000';
      const parsed = parseCsv(csv);
      expect(parsed[0][0]).toBe('Nama Menu');
      expect(parsed[1][0]).toBe('Siomay');
      expect(parsed[1][1]).toBe('20000');
    });

    it('should handle commas inside quoted fields safely', () => {
      const csv = '"Dimsum, Ayam Spesial",Kukus,20000\n"Bandung, Dago",Cabang,5000000';
      const parsed = parseCsv(csv);
      expect(parsed[0][0]).toBe('Dimsum, Ayam Spesial');
      expect(parsed[0][1]).toBe('Kukus');
      expect(parsed[1][0]).toBe('Bandung, Dago');
    });

    it('should handle escaped double quotes ("") inside quotes', () => {
      const csv = '"Dimsum ""Super"" Mentai",Mentai Series,28000';
      const parsed = parseCsv(csv);
      expect(parsed[0][0]).toBe('Dimsum "Super" Mentai');
      expect(parsed[0][1]).toBe('Mentai Series');
      expect(parsed[0][2]).toBe('28000');
    });

    it('should ignore empty lines and CRLF line breaks', () => {
      const csv = 'Nama,Harga\r\n\r\nSiomay,15000\r\n\r\n';
      const parsed = parseCsv(csv);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toEqual(['Nama', 'Harga']);
      expect(parsed[1]).toEqual(['Siomay', '15000']);
    });

    it('should return empty array for empty or whitespace-only input', () => {
      expect(parseCsv('')).toEqual([]);
      expect(parseCsv('   \n  \r\n ')).toEqual([]);
    });
  });
});
