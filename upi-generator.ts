/**
 * UPI URI & QR Generator Utility
 * Generates standard NPCI compliant UPI deep-links:
 * upi://pay?pa={upiId}&pn={payeeName}&am={amount}&cu=INR&tr={transactionRef}
 */

export interface UpiPaymentIntent {
  upiId: string;
  payeeName: string;
  amount?: number;
  transactionRef?: string;
  note?: string;
}

export function generateUpiUri(intent: UpiPaymentIntent): string {
  const params = new URLSearchParams();
  params.append('pa', intent.upiId);
  params.append('pn', intent.payeeName);
  params.append('cu', 'INR');

  if (intent.amount && intent.amount > 0) {
    params.append('am', intent.amount.toFixed(2));
  }
  if (intent.transactionRef) {
    params.append('tr', intent.transactionRef);
  }
  if (intent.note) {
    params.append('tn', intent.note);
  }

  return `upi://pay?${params.toString()}`;
}

export function generateUpiQrUrl(intent: UpiPaymentIntent, size = 250): string {
  const upiUri = generateUpiUri(intent);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUri)}`;
}
