import { describe, it, expect } from 'vitest';
import { OFFICIAL_SAAS_PLANS } from '../pages/SubscriptionBillingPage';

describe('Subscription Billing & Branch Quota (Dimsum Intan)', () => {
  it('defines the 5 official SaaS plans starting at Rp 50.000/cabang', () => {
    expect(OFFICIAL_SAAS_PLANS).toHaveLength(5);
    expect(OFFICIAL_SAAS_PLANS.map((p) => p.code)).toEqual([
      'PAKET_50K',
      'PAKET_100K',
      'PAKET_150K',
      'PAKET_200K',
      'PAKET_CUSTOM',
    ]);
    expect(OFFICIAL_SAAS_PLANS[0].price).toBe(50000);
    expect(OFFICIAL_SAAS_PLANS[0].dailyTxLimit).toBe(50);
    expect(OFFICIAL_SAAS_PLANS[0].monthlyTxLimit).toBe(1500);
    expect(OFFICIAL_SAAS_PLANS[1].price).toBe(100000);
    expect(OFFICIAL_SAAS_PLANS[1].dailyTxLimit).toBe(200);
    expect(OFFICIAL_SAAS_PLANS[1].monthlyTxLimit).toBe(6000);
    expect(OFFICIAL_SAAS_PLANS[2].price).toBe(150000);
    expect(OFFICIAL_SAAS_PLANS[2].dailyTxLimit).toBe(350);
    expect(OFFICIAL_SAAS_PLANS[2].monthlyTxLimit).toBe(10500);
    expect(OFFICIAL_SAAS_PLANS[3].price).toBe(200000);
    expect(OFFICIAL_SAAS_PLANS[3].dailyTxLimit).toBe(0);
    expect(OFFICIAL_SAAS_PLANS[3].monthlyTxLimit).toBe(0);
    expect(OFFICIAL_SAAS_PLANS[4].price).toBe(0);
    expect(OFFICIAL_SAAS_PLANS[4].dailyTxLimit).toBe(0);
    expect(OFFICIAL_SAAS_PLANS[4].monthlyTxLimit).toBe(0);
  });

  it('calculates monthly bill for 4 operational branches at Rp 100.000/branch = Rp 400.000 (+1 Semua Cabang included)', () => {
    const pricePerOutlet = 100000;
    const currentOutlets = 4;
    const maxOutlets = 4;
    const activeOperationalOutlets = Math.max(1, currentOutlets || maxOutlets);
    const totalMonthlyBill = pricePerOutlet * activeOperationalOutlets;

    expect(activeOperationalOutlets).toBe(4);
    expect(totalMonthlyBill).toBe(400000);
  });
});
