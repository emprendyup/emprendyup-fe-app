'use client';

import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border border-gray-700">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />

        <h1 className="text-2xl font-bold text-red-400 mt-6 mb-3">Pago cancelado</h1>

        <p className="text-gray-300 mb-6 leading-relaxed">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu cuenta.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/plans"
            className="w-full bg-gradient-to-r from-fourth-base to-fourth-500 text-white py-3 px-6 rounded-lg hover:from-fourth-600 hover:to-fourth-700 transition font-medium"
          >
            Intentar nuevamente
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full border border-gray-600 text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-700/50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
