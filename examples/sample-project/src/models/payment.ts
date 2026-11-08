export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export interface WebhookEvent {
  id: string;
  type: 'payment_intent.succeeded' | 'invoice.payment_failed';
  data: Record<string, unknown>;
}
