// lib/payments/epayco.ts
export interface EPaycoPaymentData {
  // Información del comercio
  p_cust_id_cliente: string;
  p_key: string;

  // Información de la transacción
  p_id_invoice: string;
  p_description: string;
  p_amount: string;
  p_amount_base: string;
  p_tax: string;
  p_currency_code: string;

  // URLs de respuesta
  p_url_response: string;
  p_url_confirmation: string;

  // Información del cliente
  p_cust_name_billing: string;
  p_cust_email_billing: string;
  p_cust_phone_billing: string;
  p_cust_address_billing?: string;
  p_cust_city_billing?: string;
  p_cust_country_billing: string;

  // Configuración adicional
  p_test_request: string;
  p_method_confirmation: string;
}

export class EPaycoService {
  private static readonly EPAYCO_CHECKOUT_URL = 'https://checkout.epayco.co/checkout.php';

  static createPaymentUrl(data: EPaycoPaymentData): string {
    const params = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return `${this.EPAYCO_CHECKOUT_URL}?${params.toString()}`;
  }

  static calculateTax(
    amount: number,
    taxRate: number = 0.19
  ): {
    baseAmount: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const baseAmount = Math.round(amount / (1 + taxRate));
    const taxAmount = amount - baseAmount;

    return {
      baseAmount,
      taxAmount,
      totalAmount: amount,
    };
  }

  static generateInvoiceId(prefix: string = 'INV'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
  }
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  duration: number; // en días
}

export interface PaymentRequest {
  planId: string;
  customerData: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    document?: string;
    documentType?: string;
  };
  successUrl?: string;
  cancelUrl?: string;
}
