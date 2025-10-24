'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useEPaycoPayment } from '@/lib/hooks/useEPaycoPayment';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  customerEmail?: string;
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
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    email: customerEmail || '',
    phone: '',
    address: '',
    city: 'Bogotá',
    document: '',
    documentType: 'CC' as 'CC' | 'CE' | 'NIT',
  });

  const { initiatePayment } = useEPaycoPayment();
  const user = getUserFromLocalStorage();

  // Inicializar datos del usuario automáticamente
  useEffect(() => {
    if (user) {
      setCustomerData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || customerEmail || prev.email,
        phone: (user as any).phone || prev.phone,
        address: (user as any).address || prev.address,
        city: (user as any).city || prev.city,
        document: (user as any).document || prev.document,
        documentType: (user as any).documentType || prev.documentType,
      }));
    }
  }, [user, customerEmail]);

  // Identificar qué campos son requeridos pero están vacíos
  const missingFields = {
    name: !customerData.name?.trim(),
    email: !customerData.email?.trim(),
    phone: !customerData.phone?.trim(),
  };

  const hasMissingFields = Object.values(missingFields).some(Boolean);

  if (!open) return null;

  const handleCheckout = async () => {
    setLoading(true);

    try {
      await initiatePayment({
        planId,
        customerData: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          document: customerData.document,
          documentType: customerData.documentType,
        },
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      });
    } catch (err) {
      console.error('Error al iniciar pago:', err);
    } finally {
      setLoading(false);
    }
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
        <p className="text-gray-300 mb-4 leading-relaxed">
          Vas a suscribirte al plan <strong className="text-white">{planName}</strong>
          <span className="text-gray-400">
            {' '}
            ({billingCycle === 'monthly' ? 'Mensual' : 'Anual'})
          </span>{' '}
          por <strong className="text-emerald-400">${price.toLocaleString()} COP</strong>.
        </p>

        {/* Mostrar datos del usuario */}
        {!hasMissingFields && (
          <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Datos de facturación:</h3>
            <div className="space-y-1 text-sm text-gray-400">
              <div>
                <span className="text-gray-300">Nombre:</span> {customerData.name}
              </div>
              <div>
                <span className="text-gray-300">Email:</span> {customerData.email}
              </div>
              <div>
                <span className="text-gray-300">Teléfono:</span> {customerData.phone}
              </div>
            </div>
          </div>
        )}

        {/* Solo mostrar formulario si faltan datos requeridos */}
        {hasMissingFields && (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-gray-400 mb-3">
              Completa los siguientes datos requeridos para continuar:
            </p>

            <div className="grid grid-cols-1 gap-4">
              {missingFields.name && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
              )}

              {missingFields.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) =>
                      setCustomerData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              )}

              {missingFields.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) =>
                      setCustomerData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                    placeholder="3001234567"
                    required
                  />
                </div>
              )}

              {/* Campos opcionales siempre visibles pero colapsados */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition">
                  + Información adicional (opcional)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tipo doc.
                      </label>
                      <select
                        value={customerData.documentType}
                        onChange={(e) =>
                          setCustomerData((prev) => ({
                            ...prev,
                            documentType: e.target.value as 'CC' | 'CE' | 'NIT',
                          }))
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                      >
                        <option value="CC">CC</option>
                        <option value="CE">CE</option>
                        <option value="NIT">NIT</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Número de documento
                      </label>
                      <input
                        type="text"
                        value={customerData.document}
                        onChange={(e) =>
                          setCustomerData((prev) => ({ ...prev, document: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                        placeholder="12345678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={customerData.address}
                        onChange={(e) =>
                          setCustomerData((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                        placeholder="Calle 123 #45-67"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={customerData.city}
                        onChange={(e) =>
                          setCustomerData((prev) => ({ ...prev, city: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                        placeholder="Bogotá"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

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
            disabled={loading || hasMissingFields}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-fourth-base to-fourth-500 text-white hover:from-fourth-300 hover:to-fourth-200 transition disabled:opacity-50 font-medium"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {loading ? 'Procesando...' : hasMissingFields ? 'Completa los datos' : 'Ir al pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
