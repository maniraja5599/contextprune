import { PaymentIntent, WebhookEvent } from '../models/payment.ts';
import { DatabaseClient } from '../utils/database.ts';
import { Logger } from '../utils/logger.ts';

export class StripeService {
  private db: DatabaseClient;
  private logger: Logger;

  constructor(db: DatabaseClient, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Processes incoming Stripe webhook events
   */
  async handleWebhook(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    this.logger.info(`Handling webhook event: ${event.type} [${event.id}]`);

    try {
      if (event.type === 'payment_intent.succeeded') {
        const intent = event.data as unknown as PaymentIntent;
        await this.db.update('payments', intent.id, { status: 'succeeded' });
        this.logger.info(`Payment succeeded for customer: ${intent.customerId}`);
        return { success: true };
      }

      if (event.type === 'invoice.payment_failed') {
        this.logger.warn(`Invoice payment failed for event ${event.id}`);
        return { success: false, error: 'Payment failed' };
      }

      return { success: true };
    } catch (err) {
      this.logger.error('Webhook error occurred', err);
      return { success: false, error: (err as Error).message };
    }
  }

  async createCustomer(email: string, name: string): Promise<string> {
    this.logger.info(`Creating Stripe customer for ${email}`);
    // Simulate 30 lines of API calls and token generation
    const customerId = `cus_${Math.random().toString(36).substring(7)}`;
    await this.db.insert('customers', { id: customerId, email, name });
    return customerId;
  }
}
