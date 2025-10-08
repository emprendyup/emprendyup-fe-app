'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  customerEmail: string;
  customerPhone?: string;
}

export default function CheckoutModal({
  open,
  onClose,
  planName,
  planId,
  billingCycle,
  price,
  customerEmail,
}: CheckoutModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCheckout = async () => {
    setLoading(true);

    // 🔹 Simula el proceso de pago
    const mockPaymentId = `mock_${Date.now()}`;
    // const checkoutUrl = `/plans/checkout?paymentId=${mockPaymentId}&plan=${planName}&amount=${price}&cycle=${billingCycle}`;
    const checkoutUrl = `/dashboard/plans/checkout`;

    router.push(checkoutUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-8 shadow-2xl relative border border-gray-700/50">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-3">Confirmar suscripción</h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Vas a suscribirte al plan <strong className="text-white">{planName}</strong>
          <span className="text-gray-400">
            {' '}
            ({billingCycle === 'monthly' ? 'Mensual' : 'Anual'})
          </span>{' '}
          por <strong className="text-emerald-400">${price.toLocaleString()} COP</strong>.
        </p>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-fourth-base to-fourth-500 text-white hover:from-fourth-300 hover:to-fourth-200 transition disabled:opacity-50 font-medium"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {loading ? 'Procesando...' : 'Ir al pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
