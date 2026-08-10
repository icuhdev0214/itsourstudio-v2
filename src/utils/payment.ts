export const DOWNPAYMENT_RATE = 0.5;

export interface PaymentBreakdown {
    totalAmount: number;
    requiredDownpayment: number;
    amountToPayNow: number;
    remainingBalance: number;
}

export const calculateRequiredDownpayment = (totalAmount: number): number => {
    const safeTotal = Math.max(0, Number(totalAmount) || 0);
    return Math.ceil(safeTotal * DOWNPAYMENT_RATE);
};

export const calculatePaymentBreakdown = (totalAmount: number): PaymentBreakdown => {
    const safeTotal = Math.max(0, Number(totalAmount) || 0);
    const requiredDownpayment = calculateRequiredDownpayment(safeTotal);

    return {
        totalAmount: safeTotal,
        requiredDownpayment,
        amountToPayNow: requiredDownpayment,
        remainingBalance: Math.max(0, safeTotal - requiredDownpayment)
    };
};
