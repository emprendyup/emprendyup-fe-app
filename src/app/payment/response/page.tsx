'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEPaycoPayment } from '@/lib/hooks/useEPaycoPayment';
import { LoaderIcon } from 'react-hot-toast';

function PaymentResponsePage() {
  const searchParams = useSearchParams();
  const { processResponse, loading } = useEPaycoPayment();
  const [paymentStatus, setPaymentStatus] = useState<
    'processing' | 'success' | 'error' | 'pending'
  >('processing');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const processPaymentResponse = async () => {
      try {
        // Obtener parámetros de la URL
        const responseData = {
          ref_payco: searchParams.get('ref_payco'),
          x_id_invoice: searchParams.get('x_id_invoice'),
          x_transaction_id: searchParams.get('x_transaction_id'),
          x_ref_payco: searchParams.get('x_ref_payco'),
          x_cod_response: searchParams.get('x_cod_response'),
          x_response: searchParams.get('x_response'),
          x_approval_code: searchParams.get('x_approval_code'),
          x_amount: searchParams.get('x_amount'),
          x_franchise: searchParams.get('x_franchise'),
          x_customer_email: searchParams.get('x_customer_email'),
        };

        // Procesar la respuesta
        const result = await processResponse(responseData);
        setPaymentData(result);

        // Determinar el estado basado en el código de respuesta
        const responseCode = responseData.x_cod_response;
        if (responseCode === '1') {
          setPaymentStatus('success');
        } else if (responseCode === '2') {
          setPaymentStatus('error');
        } else if (responseCode === '3') {
          setPaymentStatus('pending');
        } else {
          setPaymentStatus('error');
        }
      } catch (error) {
        console.error('Error procesando respuesta de pago:', error);
        setPaymentStatus('error');
      }
    };

    if (searchParams.get('x_id_invoice')) {
      processPaymentResponse();
    }
  }, [searchParams, processResponse]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500 mx-auto" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500 mx-auto" />;
      default:
        return (
          <div className="w-16 h-16 border-4 border-fourth-base border-t-transparent rounded-full animate-spin mx-auto" />
        );
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: '¡Pago exitoso!',
          message: 'Tu suscripción ha sido activada correctamente.',
          color: 'text-green-400',
        };
      case 'error':
        return {
          title: 'Pago rechazado',
          message: 'Hubo un problema procesando tu pago. Intenta nuevamente.',
          color: 'text-red-400',
        };
      case 'pending':
        return {
          title: 'Pago pendiente',
          message: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
          color: 'text-yellow-400',
        };
      default:
        return {
          title: 'Procesando pago...',
          message: 'Estamos verificando tu pago, por favor espera.',
          color: 'text-gray-400',
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border border-gray-700">
        {getStatusIcon()}

        <h1 className={`text-2xl font-bold mt-6 mb-3 ${statusInfo.color}`}>{statusInfo.title}</h1>

        <p className="text-gray-300 mb-6 leading-relaxed">{statusInfo.message}</p>

        {paymentData && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Detalles del pago:</h3>
            <div className="space-y-1 text-sm text-gray-400">
              {paymentData.transactionId && (
                <div>
                  ID Transacción: <span className="text-white">{paymentData.transactionId}</span>
                </div>
              )}
              {paymentData.referenceCode && (
                <div>
                  Referencia: <span className="text-white">{paymentData.referenceCode}</span>
                </div>
              )}
              {paymentData.order?.total && (
                <div>
                  Monto:{' '}
                  <span className="text-white">
                    ${paymentData.order.total.toLocaleString()} COP
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {paymentStatus === 'success' && (
            <Link
              href="/dashboard"
              className="w-full bg-gradient-to-r from-fourth-base to-fourth-500 text-white py-3 px-6 rounded-lg hover:from-fourth-600 hover:to-fourth-700 transition font-medium"
            >
              Ir al Dashboard
            </Link>
          )}

          {paymentStatus === 'error' && (
            <Link
              href="/dashboard/plans"
              className="w-full bg-gradient-to-r from-fourth-base to-fourth-500 text-white py-3 px-6 rounded-lg hover:from-fourth-600 hover:to-fourth-700 transition font-medium"
            >
              Intentar nuevamente
            </Link>
          )}

          <Link
            href="/dashboard/plans"
            className="flex items-center justify-center gap-2 w-full border border-gray-600 text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-700/50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a planes
          </Link>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-gray-400">Procesando información del pago...</div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoaderIcon />}>
      <PaymentResponsePage />
    </Suspense>
  );
}
