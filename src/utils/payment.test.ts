import { describe, expect, it } from 'vitest';
import { calculatePaymentBreakdown, calculateRequiredDownpayment, DOWNPAYMENT_RATE } from './payment';

describe('payment calculation', () => {
    it('defines downpayment as 50% of the total amount', () => {
        expect(DOWNPAYMENT_RATE).toBe(0.5);
        expect(calculateRequiredDownpayment(1000)).toBe(500);
    });

    it('rounds required downpayment up for odd totals', () => {
        expect(calculateRequiredDownpayment(299)).toBe(150);
    });

    it('returns a complete booking payment breakdown', () => {
        expect(calculatePaymentBreakdown(299)).toEqual({
            totalAmount: 299,
            requiredDownpayment: 150,
            amountToPayNow: 150,
            remainingBalance: 149
        });
    });

    it('guards against invalid or negative totals', () => {
        expect(calculatePaymentBreakdown(-100)).toEqual({
            totalAmount: 0,
            requiredDownpayment: 0,
            amountToPayNow: 0,
            remainingBalance: 0
        });
    });
});
