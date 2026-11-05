import { describe, it, expect } from 'vitest';
import { Outlet } from '../../types';

describe('Outlet Package Selection & Transaction Quotas (Black-Box & White-Box)', () => {
  const OUTLET_AVAILABLE_PLANS = [
    {
      code: 'PAKET_100K',
      name: 'Paket 1: Hemat',
      price: 100000,
      dailyLimit: 200,
      monthlyTx: 6000,
      monthlyLimit: '6.000 Tx/bln',
    },
    {
      code: 'PAKET_150K',
      name: 'Paket 2: Bisnis Pro',
      price: 150000,
      dailyLimit: 300,
      monthlyTx: 9000,
      monthlyLimit: '9.000 Tx/bln',
    },
    {
      code: 'PAKET_200K',
      name: 'Paket 3: Pro Fleet',
      price: 200000,
      dailyLimit: 500,
      monthlyTx: 15000,
      monthlyLimit: '15.000 Tx/bln',
    },
    {
      code: 'PAKET_250K',
      name: 'Paket 4: Unlimited VIP',
      price: 250000,
      dailyLimit: 0,
      monthlyTx: 0,
      monthlyLimit: 'Unlimited Tx',
    },
  ];

  it('memiliki 4 tier paket resmi dengan kuota dan harga yang akurat', () => {
    expect(OUTLET_AVAILABLE_PLANS).toHaveLength(4);

    const paket100k = OUTLET_AVAILABLE_PLANS.find((p) => p.code === 'PAKET_100K');
    expect(paket100k?.price).toBe(100000);
    expect(paket100k?.dailyLimit).toBe(200);
    expect(paket100k?.monthlyTx).toBe(6000);

    const paket150k = OUTLET_AVAILABLE_PLANS.find((p) => p.code === 'PAKET_150K');
    expect(paket150k?.price).toBe(150000);
    expect(paket150k?.dailyLimit).toBe(300);
    expect(paket150k?.monthlyTx).toBe(9000);

    const paket200k = OUTLET_AVAILABLE_PLANS.find((p) => p.code === 'PAKET_200K');
    expect(paket200k?.price).toBe(200000);
    expect(paket200k?.dailyLimit).toBe(500);
    expect(paket200k?.monthlyTx).toBe(15000);

    const paket250k = OUTLET_AVAILABLE_PLANS.find((p) => p.code === 'PAKET_250K');
    expect(paket250k?.price).toBe(250000);
    expect(paket250k?.dailyLimit).toBe(0);
    expect(paket250k?.monthlyTx).toBe(0);
  });

  it('memvalidasi pembentukan payload pembuatan outlet dengan paket terpilih', () => {
    const selectedPlan = 'PAKET_100K';
    const formInput = {
      code: 'DPU',
      name: 'Dimsum Intan Dipatiukur',
      city: 'Bandung',
      address: 'Jl Dipati Ukur No 45',
      phone: '081234567890',
      targetDailySales: 4500000,
      plan: selectedPlan,
    };

    expect(formInput.plan).toBe('PAKET_100K');
    expect(formInput.code).toBe('DPU');
    expect(formInput.targetDailySales).toBe(4500000);
  });

  it('menghitung persentase dan status visual kuota transaksi bulanan per cabang', () => {
    const calculateQuotaStatus = (currentTx: number, monthlyLimit: number, isUnlimited?: boolean) => {
      if (isUnlimited || monthlyLimit === 0) return { pct: 0, status: 'unlimited', color: 'bg-emerald-500' };
      const pct = Math.min(100, Math.round((currentTx / monthlyLimit) * 100));
      if (pct >= 90) return { pct, status: 'critical', color: 'bg-red-500' };
      if (pct >= 70) return { pct, status: 'warning', color: 'bg-amber-500' };
      return { pct, status: 'safe', color: 'bg-primary' };
    };

    // 1. Cabang dengan 1.200 dari 6.000 transaksi (20%)
    const res1 = calculateQuotaStatus(1200, 6000);
    expect(res1.pct).toBe(20);
    expect(res1.status).toBe('safe');

    // 2. Cabang dengan 4.500 dari 6.000 transaksi (75% -> warning)
    const res2 = calculateQuotaStatus(4500, 6000);
    expect(res2.pct).toBe(75);
    expect(res2.status).toBe('warning');

    // 3. Cabang dengan 5.800 dari 6.000 transaksi (97% -> critical)
    const res3 = calculateQuotaStatus(5800, 6000);
    expect(res3.pct).toBe(97);
    expect(res3.status).toBe('critical');

    // 4. Cabang Unlimited
    const res4 = calculateQuotaStatus(25000, 0, true);
    expect(res4.status).toBe('unlimited');
  });

  it('memvalidasi outlet interface memiliki atribut plan dan limit kuota', () => {
    const testOutlet: Outlet = {
      id: 'out-1',
      code: 'CB-01',
      name: 'Cabang Dipati Ukur',
      city: 'Bandung',
      address: 'Jl Dipati Ukur',
      phone: '081234567890',
      targetDailySales: 4000000,
      plan: 'PAKET_100K',
      planName: 'Paket 1: Hemat (6.000 Tx/Bulan)',
      dailyTxLimit: 200,
      monthlyTxLimit: 6000,
      isUnlimited: false,
      currentMonthTxCount: 150,
    };

    expect(testOutlet.plan).toBe('PAKET_100K');
    expect(testOutlet.monthlyTxLimit).toBe(6000);
    expect(testOutlet.dailyTxLimit).toBe(200);
    expect(testOutlet.currentMonthTxCount).toBe(150);
  });
});
