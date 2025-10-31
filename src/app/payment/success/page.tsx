'use client';

import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border border-gray-700">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />

        <h1 className="text-2xl font-bold text-green-400 mt-6 mb-3">¡Pago exitoso!</h1>

        <p className="text-gray-300 mb-6 leading-relaxed">
          Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las
          funcionalidades de tu plan.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full bg-gradient-to-r from-fourth-base to-fourth-500 text-white py-3 px-6 rounded-lg hover:from-fourth-600 hover:to-fourth-700 transition font-medium"
          >
            Ir al Dashboard
          </Link>

          <Link
            href="/dashboard/plans"
            className="flex items-center justify-center gap-2 w-full border border-gray-600 text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-700/50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}
