'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import PricingPlans, { Plan } from '../components/PricingPlans';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';

// Configuración de planes con ePayco
const EPAYCO_PLANS = {
  basic: {
    monthly: {
      planId: 'basic-monthly',
      amount: 19900,
      description: 'Plan Basic - Mensual',
    },
    annual: {
      planId: 'basic-annual',
      amount: Math.round(19900 * 12 * 0.7), // 30% descuento anual
      description: 'Plan Basic - Anual',
    },
  },
  pro: {
    monthly: {
      planId: 'pro-monthly',
      amount: 129000,
      description: 'Plan Pro - Mensual',
    },
    annual: {
      planId: 'pro-annual',
      amount: Math.round(129000 * 12 * 0.7), // 30% descuento anual
      description: 'Plan Pro - Anual',
    },
  },
  partner: {
    monthly: {
      planId: 'partner-monthly',
      amount: 189000,
      description: 'Plan Emprendy Partner - Mensual',
    },
    annual: {
      planId: 'partner-annual',
      amount: Math.round(189000 * 12 * 0.7), // 30% descuento anual
      description: 'Plan Emprendy Partner - Anual',
    },
  },
};

declare global {
  interface Window {
    ePayco: {
      checkout: {
        configure: (options: any) => void;
        open: (data: any) => void;
      };
    };
  }
}

export default function PlansPage() {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('annual');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const user = getUserFromLocalStorage();

  // Verificar periódicamente si ePayco está disponible
  useEffect(() => {
    const checkEpayco = () => {
      if (window.ePayco && window.ePayco.checkout) {
        console.log('ePayco está disponible');
        setScriptLoaded(true);
        return true;
      }
      return false;
    };

    // Verificar inmediatamente
    if (checkEpayco()) return;

    // Si no está disponible, verificar cada 500ms hasta 10 segundos
    const interval = setInterval(() => {
      if (checkEpayco()) {
        clearInterval(interval);
      }
    }, 500);

    // Limpiar después de 10 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.ePayco) {
        console.error('ePayco script failed to load after 10 seconds');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handlePlanSelect = async (planId: string, billingCycle: 'monthly' | 'annual') => {
    console.log('Script loaded:', scriptLoaded);
    console.log('window.ePayco exists:', !!window.ePayco);

    if (!scriptLoaded || !window.ePayco) {
      console.error('ePayco script not loaded yet');
      alert(
        'El sistema de pagos aún se está cargando. Por favor espera un momento e intenta nuevamente.'
      );
      return;
    }

    try {
      // Obtener configuración del plan
      const planConfig = EPAYCO_PLANS[planId as keyof typeof EPAYCO_PLANS]?.[billingCycle];

      if (!planConfig) {
        throw new Error('Plan no encontrado');
      }

      // Calcular impuestos (IVA 19%)
      const taxBase = Math.round(planConfig.amount / 1.19);
      const tax = planConfig.amount - taxBase;

      // Configurar ePayco
      window.ePayco.checkout.configure({
        key: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY || '57eed8088d6cc4cca90e0b9e6c439124',
        test: process.env.NEXT_PUBLIC_EPAYCO_TEST === 'true',
      });

      // Generar referencia única
      const reference = `plan_${planConfig.planId}_${Date.now()}`;

      // Obtener datos del usuario o usar valores por defecto
      const customerData = {
        name: user?.name || 'Cliente',
        email: user?.email || 'cliente@example.com',
        phone: (user as any)?.phone || '3000000000',
        document: (user as any)?.document || '12345678',
        documentType: (user as any)?.documentType || 'CC',
      };

      // Datos del checkout
      const checkoutData = {
        // Información del comercio
        name: 'EmprendyUp',
        description: planConfig.description,
        invoice: reference,
        currency: 'cop',
        amount: planConfig.amount,
        tax_base: taxBase,
        tax: tax,
        country: 'CO',
        lang: 'es',

        // Información del cliente
        external: false,
        name_billing: customerData.name,
        address_billing: 'Calle 1 # 1-1',
        type_doc_billing: customerData.documentType,
        mobilephone_billing: customerData.phone,
        number_doc_billing: customerData.document,
        email_billing: customerData.email,

        // URLs de respuesta
        response: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/payment/response`,
        confirmation: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/payments/epayco/confirmation`,

        // Configuración adicional
        method_confirmation: 'POST',

        // Callbacks
        onCancel: () => {
          console.log('Pago cancelado');
        },
        onError: (error: any) => {
          console.error('Error en el pago:', error);
          alert('Error al procesar el pago');
        },
        onSuccess: (data: any) => {
          console.log('Pago exitoso:', data);
        },
      };

      // Abrir el checkout de ePayco directamente
      window.ePayco.checkout.open(checkoutData);
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    }
  };

  return (
    <>
      {/* Script de ePayco */}
      <Script
        src="https://checkout.epayco.co/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Script de ePayco cargado exitosamente');
          setScriptLoaded(true);
        }}
        onError={(error) => {
          console.error('Error cargando el script de ePayco:', error);
          alert('Error cargando el sistema de pagos. Por favor recarga la página.');
        }}
      />

      <div className="min-h-screen bg-slate-900">
        <PricingPlans
          mode="landing"
          onPlanSelect={handlePlanSelect}
          selectedCycle={selectedCycle}
          onCycleChange={setSelectedCycle}
        />
      </div>
    </>
  );
}
