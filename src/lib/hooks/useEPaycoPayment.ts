// lib/hooks/useEPaycoPayment.ts
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_PAYMENT_REQUEST, PROCESS_PAYMENT_RESPONSE } from '../graphql/payments';
import { EPaycoService, PaymentRequest, EPaycoPaymentData } from '../payments/epayco';
import { toast } from 'sonner';

export const useEPaycoPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createPaymentRequest] = useMutation(CREATE_PAYMENT_REQUEST);
  const [processPaymentResponse] = useMutation(PROCESS_PAYMENT_RESPONSE);

  const initiatePayment = async (paymentRequest: PaymentRequest) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Crear el payment request en el backend
      const { data } = await createPaymentRequest({
        variables: {
          input: {
            planId: paymentRequest.planId,
            customerName: paymentRequest.customerData.name,
            customerEmail: paymentRequest.customerData.email,
            customerPhone: paymentRequest.customerData.phone,
            customerAddress: paymentRequest.customerData.address,
            customerCity: paymentRequest.customerData.city,
            customerDocument: paymentRequest.customerData.document,
            customerDocumentType: paymentRequest.customerData.documentType || 'CC',
            successUrl: paymentRequest.successUrl || `${window.location.origin}/payment/success`,
            cancelUrl: paymentRequest.cancelUrl || `${window.location.origin}/payment/cancel`,
          },
        },
      });

      const paymentData = data.createPaymentRequest;

      // 2. Si el backend devuelve una URL de pago (caso simple)
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
        return paymentData;
      }

      // 3. Si no, construir la URL de ePayco manualmente
      const taxCalculation = EPaycoService.calculateTax(paymentData.amount);

      const epaycoData: EPaycoPaymentData = {
        p_cust_id_cliente: process.env.NEXT_PUBLIC_EPAYCO_CUSTOMER_ID || '',
        p_key: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY || '',
        p_id_invoice: paymentData.invoiceId,
        p_description: `Suscripción ${paymentData.plan.name}`,
        p_amount: paymentData.amount.toString(),
        p_amount_base: taxCalculation.baseAmount.toString(),
        p_tax: taxCalculation.taxAmount.toString(),
        p_currency_code: 'COP',
        p_url_response: paymentRequest.successUrl || `${window.location.origin}/payment/response`,
        p_url_confirmation: `${window.location.origin}/api/payments/epayco/confirmation`,
        p_cust_name_billing: paymentRequest.customerData.name,
        p_cust_email_billing: paymentRequest.customerData.email,
        p_cust_phone_billing: paymentRequest.customerData.phone,
        p_cust_address_billing: paymentRequest.customerData.address || '',
        p_cust_city_billing: paymentRequest.customerData.city || 'Bogotá',
        p_cust_country_billing: 'CO',
        p_test_request: process.env.NEXT_PUBLIC_EPAYCO_TEST === 'true' ? '1' : '0',
        p_method_confirmation: 'POST',
      };

      // 4. Redirigir a ePayco
      const paymentUrl = EPaycoService.createPaymentUrl(epaycoData);
      window.location.href = paymentUrl;

      return paymentData;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processResponse = async (responseData: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await processPaymentResponse({
        variables: {
          input: {
            invoiceId: responseData.ref_payco || responseData.x_id_invoice,
            transactionId: responseData.x_transaction_id,
            referenceCode: responseData.x_ref_payco,
            responseCode: responseData.x_cod_response,
            responseMessage: responseData.x_response,
            approvalCode: responseData.x_approval_code,
            amount: parseFloat(responseData.x_amount),
            paymentMethod: responseData.x_franchise,
            customerEmail: responseData.x_customer_email,
          },
        },
      });

      return data.processPaymentResponse;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar la respuesta del pago';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    initiatePayment,
    processResponse,
    loading,
    error,
  };
};
