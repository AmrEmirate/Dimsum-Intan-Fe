import { describe, it, expect, vi } from 'vitest';
import { formatRupiahInput, parseRupiahInput, parseRupiahNumber, formatRupiah } from '../../utils/currencyUtils';

describe('White Box Testing: Rupiah Input Formatting & Keystroke Utilities', () => {
  describe('1. Thousands Dot Formatting Algorithms', () => {
    it('handles incremental typing from 1 to thousands to millions', () => {
      expect(formatRupiahInput('1')).toBe('1');
      expect(formatRupiahInput('10')).toBe('10');
      expect(formatRupiahInput('100')).toBe('100');
      expect(formatRupiahInput('1000')).toBe('1.000');
      expect(formatRupiahInput('10000')).toBe('10.000');
      expect(formatRupiahInput('100000')).toBe('100.000');
      expect(formatRupiahInput('1000000')).toBe('1.000.000');
      expect(formatRupiahInput('15000000')).toBe('15.000.000');
    });

    it('strips random non-numeric keystrokes while maintaining dots', () => {
      expect(formatRupiahInput('Rp 12.500')).toBe('12.500');
      expect(formatRupiahInput('12a500b')).toBe('12.500');
      expect(formatRupiahInput('150...000')).toBe('150.000');
      expect(formatRupiahInput('abc')).toBe('');
      expect(formatRupiahInput('   ')).toBe('');
    });

    it('handles numeric input types directly', () => {
      expect(formatRupiahInput(50000)).toBe('50.000');
      expect(formatRupiahInput(0)).toBe('0');
      expect(formatRupiahInput(999)).toBe('999');
      expect(formatRupiahInput(1001)).toBe('1.001');
    });

    it('safely handles nullish and edge values', () => {
      expect(formatRupiahInput(null)).toBe('');
      expect(formatRupiahInput(undefined)).toBe('');
      expect(formatRupiahInput('')).toBe('');
    });
  });

  describe('2. Parsing Formatted Rupiah Strings to Clean Data', () => {
    it('converts formatted dotted string to raw string for backend payloads', () => {
      expect(parseRupiahInput('10.000')).toBe('10000');
      expect(parseRupiahInput('1.500.000')).toBe('1500000');
      expect(parseRupiahInput('Rp 250.000,-')).toBe('250000');
    });

    it('parses formatted string directly into integer number', () => {
      expect(parseRupiahNumber('10.000')).toBe(10000);
      expect(parseRupiahNumber('1.250.000')).toBe(1250000);
      expect(parseRupiahNumber('')).toBe(0);
      expect(parseRupiahNumber(null)).toBe(0);
      expect(parseRupiahNumber(undefined)).toBe(0);
      expect(parseRupiahNumber('0')).toBe(0);
    });

    it('formats standard Rupiah display with Rp prefix', () => {
      expect(formatRupiah(10000)).toBe('Rp 10.000');
      expect(formatRupiah('10000')).toBe('Rp 10.000');
      expect(formatRupiah(0)).toBe('Rp 0');
      expect(formatRupiah(null)).toBe('Rp 0');
    });
  });

  describe('3. Synthetic Event Transformation & Handler Integration', () => {
    it('simulates synthetic event transformation where target.value contains clean digits', () => {
      const onChangeMock = vi.fn();
      const onNumericMock = vi.fn();

      const simulateInputChange = (rawTypedText: string) => {
        const cleanDigits = parseRupiahInput(rawTypedText);
        const numericValue = cleanDigits ? parseInt(cleanDigits, 10) : 0;

        onNumericMock(numericValue, cleanDigits);

        const syntheticEvent = {
          target: { value: cleanDigits },
        };
        onChangeMock(syntheticEvent);
      };

      simulateInputChange('15.000');
      expect(onNumericMock).toHaveBeenCalledWith(15000, '15000');
      expect(onChangeMock).toHaveBeenCalledWith({
        target: { value: '15000' },
      });

      simulateInputChange('1.250.000');
      expect(onNumericMock).toHaveBeenCalledWith(1250000, '1250000');
      expect(onChangeMock).toHaveBeenCalledWith({
        target: { value: '1250000' },
      });
    });
  });
});
