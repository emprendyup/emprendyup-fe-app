'use client';
import React from 'react';
import {
  FiCheck,
  FiDownload,
  FiMail,
  FiCalendar,
  FiCreditCard,
  FiHome,
  FiArrowRight,
} from 'react-icons/fi';

export default function PaymentConfirmationPage() {
  // Datos mockeados de la transacción
  const mockTransaction = {
    id: 'TXN-2025-10-08-9847',
    date: '8 de Octubre, 2025',
    time: '14:32:15',
    status: 'approved',
    plan: {
      name: 'Pro',
      price: '90.300',
      billingCycle: 'Anual',
      nextBilling: '8 de Octubre, 2026',
    },
    customer: {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      document: 'CC 1234567890',
    },
    payment: {
      method: 'Tarjeta de Crédito',
      last4: '4242',
      brand: 'Visa',
    },
  };

  const handleDownloadReceipt = () => {
    console.log('Descargando recibo...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Animación de Éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 mb-6 animate-bounce">
            <FiCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">¡Pago Exitoso! 🎉</h1>
          <p className="text-lg text-slate-400 mb-2">
            Tu suscripción al plan{' '}
            <span className="text-white font-semibold">{mockTransaction.plan.name}</span> está
            activa
          </p>
          <p className="text-sm text-slate-500">Transacción ID: {mockTransaction.id}</p>
        </div>

        {/* Tarjeta Principal de Confirmación */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-6">
          {/* Información del Plan */}
          <div className="bg-gradient-to-r from-fourth-base/10 to-fourth-base/10 border border-fourth-base/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Plan {mockTransaction.plan.name}
                </h2>
                <p className="text-slate-400">Facturación {mockTransaction.plan.billingCycle}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">${mockTransaction.plan.price}</div>
                <div className="text-sm text-slate-400">COP / año</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-2">
              <FiCalendar className="w-4 h-4" />
              <span>Próxima facturación: {mockTransaction.plan.nextBilling}</span>
            </div>
          </div>

          {/* Detalles de la Transacción */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Cliente */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Información del Cliente
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{mockTransaction.customer.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <FiMail className="w-4 h-4" />
                  <span className="text-sm">{mockTransaction.customer.email}</span>
                </div>
                <div className="text-sm text-slate-400">{mockTransaction.customer.document}</div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Método de Pago
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">{mockTransaction.payment.method}</span>
                </div>
                <div className="text-sm text-slate-400">
                  {mockTransaction.payment.brand} •••• {mockTransaction.payment.last4}
                </div>
                <div className="text-sm text-slate-400">
                  {mockTransaction.date} a las {mockTransaction.time}
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Descarga */}
          <button
            onClick={handleDownloadReceipt}
            className="w-full md:w-auto px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <FiDownload className="w-5 h-5" />
            Descargar Recibo
          </button>
        </div>

        {/* Próximos Pasos */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-6">Próximos Pasos</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-fourth-base flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Revisa tu correo</h3>
                <p className="text-sm text-slate-400">
                  Te hemos enviado un correo de confirmación a{' '}
                  <span className="text-white">{mockTransaction.customer.email}</span> con todos los
                  detalles de tu suscripción.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-fourth-base flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Accede a tu dashboard</h3>
                <p className="text-sm text-slate-400">
                  Tu cuenta ya está activa. Puedes comenzar a configurar tu tienda y explorar todas
                  las funcionalidades.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-fourth-base flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Configura tu tienda</h3>
                <p className="text-sm text-slate-400">
                  Sigue nuestra guía paso a paso para poner en marcha tu emprendimiento en minutos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios Incluidos */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-6">✨ Esto es lo que tienes incluido</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <FiCheck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium mb-1">Tienda completa</h4>
                <p className="text-sm text-slate-400">
                  Con subdominio personalizado y catálogo ilimitado
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiCheck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium mb-1">Chatbot WhatsApp</h4>
                <p className="text-sm text-slate-400">Automatiza tus ventas 24/7</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiCheck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium mb-1">CRM Avanzado</h4>
                <p className="text-sm text-slate-400">Gestiona clientes y ventas fácilmente</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiCheck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium mb-1">Soporte Prioritario</h4>
                <p className="text-sm text-slate-400">Atención rápida cuando lo necesites</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
            <FiMail className="w-5 h-5" />
            Contactar Soporte
          </button>
        </div>

        {/* Mensaje de Ayuda */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            ¿Necesitas ayuda? Contáctanos en{' '}
            <a
              href="mailto:soporte@emprendy.com"
              className="text-white hover:text-fourth-300 transition-colors"
            >
              soporte@emprendy.com
            </a>{' '}
            o visita nuestro{' '}
            <a href="#" className="text-fourth-base hover:text-fourth-300 transition-colors">
              centro de ayuda
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
