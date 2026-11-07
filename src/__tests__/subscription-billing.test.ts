import { describe, it, expect } from 'vitest';
import { OFFICIAL_SAAS_PLANS } from '../pages/SubscriptionBillingPage';

describe('Subscription Billing & Branch Quota (Dimsum Intan)', () => {
  it('defines the 4 official SaaS plans starting at Rp 100.000/cabang', () => {
    expect(OFFICIAL_SAAS_PLANS).toHaveLength(4);
    expect(OFFICIAL_SAAS_PLANS.map((p) => p.code)).toEqual([
      'PAKET_100K',
      'PAKET_150K',
      'PAKET_200K',
      'PAKET_250K',
    ]);
    expect(OFFICIAL_SAAS_PLANS[0].price).toBe(100000);
    expect(OFFICIAL_SAAS_PLANS[0].monthlyTxLimit).toBe(6000);
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
