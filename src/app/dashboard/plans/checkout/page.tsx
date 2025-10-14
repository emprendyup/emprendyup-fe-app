'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { FiCreditCard, FiLock, FiCheck, FiShield, FiArrowLeft } from 'react-icons/fi';

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pse' | 'nequi'>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    email: '',
    documentType: 'CC',
    documentNumber: '',
  });

  // Datos mockeados del plan seleccionado
  const mockPlan = {
    name: 'Pro',
    price: '90.300',
    originalPrice: '129.000',
    billingCycle: 'annual',
    discount: '30%',
    features: [
      'Todo lo incluido en Basic',
      'Chatbot WhatsApp',
      'CRM avanzado',
      'Soporte prioritario',
    ],
  };
  const router = useRouter();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Processing payment...', formData);
    const checkoutUrl = `/dashboard/plans/payment-confirmation`;

    router.push(checkoutUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
          <FiArrowLeft className="w-5 h-5" />
          <span>Volver a planes</span>
        </button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Formulario de Pago - Columna Principal */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-fourth-base to-fourth-200 flex items-center justify-center">
                  <FiLock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Pago Seguro</h1>
                  <p className="text-sm text-slate-400">Todos tus datos están protegidos</p>
                </div>
              </div>

              {/* Métodos de Pago */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-white mb-4">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-fourth-base bg-fourth-base/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <FiCreditCard className="w-6 h-6 mx-auto mb-2 text-white" />
                    <span className="text-sm text-white font-medium">Tarjeta</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pse')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'pse'
                        ? 'border-fourth-base bg-fourth-base/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">🏦</div>
                    <span className="text-sm text-white font-medium">PSE</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('nequi')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'nequi'
                        ? 'border-fourth-base bg-fourth-base/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">📱</div>
                    <span className="text-sm text-white font-medium">Nequi</span>
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {paymentMethod === 'card' && (
                  <>
                    {/* Número de Tarjeta */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Número de Tarjeta
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <FiCreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                      </div>
                    </div>

                    {/* Nombre en la Tarjeta */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Nombre en la Tarjeta
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        placeholder="JUAN PÉREZ"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Fecha de Expiración y CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Fecha de Expiración
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Información de Facturación */}
                <div className="pt-4 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Información de Facturación
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Tipo de Documento
                      </label>
                      <select
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="CC">Cédula</option>
                        <option value="NIT">NIT</option>
                        <option value="CE">Cédula Extranjería</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Número de Documento
                      </label>
                      <input
                        type="text"
                        name="documentNumber"
                        value={formData.documentNumber}
                        onChange={handleInputChange}
                        placeholder="1234567890"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de Pago */}
                <button
                  onClick={handleSubmit}
                  className="w-full py-4 bg-fourth-base text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <FiLock className="w-5 h-5" />
                  Pagar ${mockPlan.price}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Al completar tu compra, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>

            {/* Badges de Seguridad */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-400">Pago 100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <FiLock className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-400">Encriptación SSL</span>
              </div>
            </div>
          </div>

          {/* Resumen del Pedido - Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-6">Resumen del Pedido</h2>

              {/* Plan Seleccionado */}
              <div className="bg-gradient-to-r from-fourth-base/10 to-fourth-base/10 border border-fourth-base/30 rounded-xl p-4 mb-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{mockPlan.name}</h3>
                    <p className="text-sm text-slate-400">
                      Facturación {mockPlan.billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    -{mockPlan.discount}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {mockPlan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FiCheck className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-400 line-through">${mockPlan.originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400 font-medium">
                      Descuento ({mockPlan.discount})
                    </span>
                    <span className="text-green-400 font-medium">-$38.700</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                    <span className="text-white">Total</span>
                    <span className="text-white">${mockPlan.price}</span>
                  </div>
                </div>
              </div>

              {/* Garantía */}
              <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <FiCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Garantía de 14 días</h4>
                    <p className="text-xs text-slate-400">
                      Prueba sin riesgo. Si no estás satisfecho, te devolvemos tu dinero.
                    </p>
                  </div>
                </div>
              </div>

              {/* Beneficios */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Activación inmediata</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Soporte 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Sin costos ocultos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
