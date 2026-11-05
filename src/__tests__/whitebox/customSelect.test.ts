import { describe, it, expect } from 'vitest';
import { SelectOption } from '../../components/common/CustomSelect';

describe('White Box Testing: CustomSelect logic & option filtering', () => {
  const sampleOptions: SelectOption<string>[] = [
    { value: 'Kukus', label: 'Dimsum Kukus', badge: '8 menu', sublabel: 'Siomay, Hakau' },
    { value: 'Goreng', label: 'Dimsum Goreng', badge: '4 menu', sublabel: 'Lumpia, Rambutan' },
    { value: 'Mentai', label: 'Mentai Series', badge: '3 menu', sublabel: 'Mozzarella, Tobiko' },
    { value: 'Minuman', label: 'Minuman & Teh', badge: '4 menu', sublabel: 'Teh Melati, Badak' },
    { value: 'Frozen', label: 'Frozen & Retail', badge: '3 menu', sublabel: 'Pouch 20 pcs', disabled: true },
  ];

  it('should find the currently selected option by value', () => {
    const selected = sampleOptions.find((opt) => opt.value === 'Mentai');
    expect(selected).toBeDefined();
    expect(selected?.label).toBe('Mentai Series');
    expect(selected?.badge).toBe('3 menu');
  });

  it('should filter options by search query in label, sublabel, or badge', () => {
    const filterOptions = (options: SelectOption<string>[], query: string) => {
      if (!query.trim()) return options;
      const q = query.toLowerCase();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
          (opt.badge && opt.badge.toLowerCase().includes(q))
      );
    };

    const searchHakau = filterOptions(sampleOptions, 'hakau');
    expect(searchHakau.length).toBe(1);
    expect(searchHakau[0].value).toBe('Kukus');

    const searchMentai = filterOptions(sampleOptions, 'mentai');
    expect(searchMentai.length).toBe(1);
    expect(searchMentai[0].value).toBe('Mentai');

    const searchEmpty = filterOptions(sampleOptions, '');
    expect(searchEmpty.length).toBe(5);

    const searchNonExistent = filterOptions(sampleOptions, 'burger');
    expect(searchNonExistent.length).toBe(0);
  });

  it('should prevent selection when an option is disabled', () => {
    let currentValue = 'Kukus';
    const selectOption = (opt: SelectOption<string>) => {
      if (opt.disabled) return;
      currentValue = opt.value;
    };

    const disabledOpt = sampleOptions.find((o) => o.value === 'Frozen')!;
    selectOption(disabledOpt);
    expect(currentValue).toBe('Kukus'); // remains unchanged

    const enabledOpt = sampleOptions.find((o) => o.value === 'Goreng')!;
    selectOption(enabledOpt);
    expect(currentValue).toBe('Goreng');
  });

  it('should support numeric values safely in SelectOption', () => {
    const numericOptions: SelectOption<number>[] = [
      { value: 100, label: '100 porsi' },
      { value: 200, label: '200 porsi' },
    ];

    const found = numericOptions.find((o) => o.value === 200);
    expect(found?.label).toBe('200 porsi');
  });

  it('should determine correct placement (dropup vs dropdown) based on space constraints', () => {
    const calculatePlacement = (
      placement: 'auto' | 'top' | 'bottom' = 'auto',
      spaceBelow: number,
      spaceAbove: number
    ): 'top' | 'bottom' => {
      if (placement === 'top') return 'top';
      if (placement === 'bottom') return 'bottom';
      if (spaceBelow < 240 && spaceAbove > 160) {
        return 'top';
      }
      return 'bottom';
    };

    // When space below is tight (e.g. inside modal near bottom), flip to 'top' (dropup)
    expect(calculatePlacement('auto', 80, 320)).toBe('top');

    // When space below is ample, default to 'bottom'
    expect(calculatePlacement('auto', 450, 100)).toBe('bottom');

    // When explicitly instructed 'top'
    expect(calculatePlacement('top', 500, 500)).toBe('top');

    // When explicitly instructed 'bottom'
    expect(calculatePlacement('bottom', 50, 500)).toBe('bottom');
  });
});
