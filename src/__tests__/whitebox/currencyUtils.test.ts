import { describe, it, expect } from 'vitest';
import {
  formatRupiahInput,
  parseRupiahInput,
  parseRupiahNumber,
  formatRupiah,
} from '../../utils/currencyUtils';

describe('currencyUtils - Indonesian Rupiah Thousand Dots Formatting', () => {
  describe('formatRupiahInput', () => {
    it('formats numbers into thousands dot format without Rp prefix', () => {
      expect(formatRupiahInput(10000)).toBe('10.000');
      expect(formatRupiahInput(150000)).toBe('150.000');
      expect(formatRupiahInput(4500000)).toBe('4.500.000');
      expect(formatRupiahInput(125000000)).toBe('125.000.000');
    });

    it('formats string numbers into thousands dot format', () => {
      expect(formatRupiahInput('10000')).toBe('10.000');
      expect(formatRupiahInput('25000')).toBe('25.000');
      expect(formatRupiahInput('500000')).toBe('500.000');
    });

    it('handles small numbers below 1000 without dots', () => {
      expect(formatRupiahInput(500)).toBe('500');
      expect(formatRupiahInput('50')).toBe('50');
      expect(formatRupiahInput(0)).toBe('0');
      expect(formatRupiahInput('0')).toBe('0');
    });

    it('handles already dotted or prefixed strings cleanly', () => {
      expect(formatRupiahInput('10.000')).toBe('10.000');
      expect(formatRupiahInput('Rp 150.000')).toBe('150.000');
      expect(formatRupiahInput('Rp. 4.500.000')).toBe('4.500.000');
    });

    it('returns empty string for null, undefined, or empty inputs', () => {
      expect(formatRupiahInput(null)).toBe('');
      expect(formatRupiahInput(undefined)).toBe('');
      expect(formatRupiahInput('')).toBe('');
      expect(formatRupiahInput('abc')).toBe('');
    });
  });

  describe('parseRupiahInput', () => {
    it('strips non-digits leaving clean numeric string', () => {
      expect(parseRupiahInput('10.000')).toBe('10000');
      expect(parseRupiahInput('Rp 150.000')).toBe('150000');
      expect(parseRupiahInput('Rp 4.500.000,-')).toBe('4500000');
    });

    it('handles clean numeric strings directly', () => {
      expect(parseRupiahInput('50000')).toBe('50000');
    });

    it('returns empty string for invalid inputs', () => {
      expect(parseRupiahInput('')).toBe('');
      expect(parseRupiahInput(null)).toBe('');
      expect(parseRupiahInput(undefined)).toBe('');
    });
  });

  describe('parseRupiahNumber', () => {
    it('parses formatted strings into integers for calculations', () => {
      expect(parseRupiahNumber('10.000')).toBe(10000);
      expect(parseRupiahNumber('Rp 150.000')).toBe(150000);
      expect(parseRupiahNumber('4.500.000')).toBe(4500000);
    });

    it('returns 0 for empty or null strings', () => {
      expect(parseRupiahNumber('')).toBe(0);
      expect(parseRupiahNumber(null)).toBe(0);
      expect(parseRupiahNumber(undefined)).toBe(0);
    });
  });

  describe('formatRupiah', () => {
    it('formats values with Rp prefix and dots', () => {
      expect(formatRupiah(10000)).toBe('Rp 10.000');
      expect(formatRupiah('150000')).toBe('Rp 150.000');
      expect(formatRupiah(0)).toBe('Rp 0');
      expect(formatRupiah('')).toBe('Rp 0');
      expect(formatRupiah(null)).toBe('Rp 0');
    });
  });
});
