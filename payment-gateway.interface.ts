/**
 * Universal Payment Gateway Interface
 * Supports both Manual UPI (UTR verification) and Automated Gateways (Cashfree / Razorpay / UPI Gateways)
 */

export interface CreateOrderRequest {
  orderId: string;
  userId: string;
  amount: number;
  customerPhone: string;
  returnUrl?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  paymentSessionId?: string;
  upiUri?: string;
  qrCodeUrl?: string;
  status: 'created' | 'pending' | 'active';
}

export interface WebhookEventPayload {
  orderId: string;
  referenceId: string; // UTR or Bank ref
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'USER_DROPPED';
  timestamp: string;
}

export interface PayoutRequest {
  payoutId: string;
  userId: string;
  amount: number;
  upiId: string;
}

export interface PayoutResponse {
  payoutId: string;
  status: 'PENDING' | 'SUCCESS' | 'REJECTED';
  referenceId?: string;
}

export interface IPaymentGateway {
  name: string;
  createDepositOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;
  processPayout(req: PayoutRequest): Promise<PayoutResponse>;
  verifyWebhook(signature: string, payload: any): boolean;
}
