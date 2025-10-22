'use client';
import React, { useState } from 'react';
import { FiCheck, FiStar, FiLoader } from 'react-icons/fi';

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  color: string;
  stripeMonthlyPriceId?: string;
  stripeAnnualPriceId?: string;
  wompiProductId?: string;
  mercadoPagoPreferenceId?: string;
}

interface PricingPlansProps {
  mode?: 'landing' | 'dashboard';
  currentPlan?: string | null;
  onPlanSelect?: (planId: string, billingCycle: 'monthly' | 'annual') => Promise<void>;
  onUpgrade?: (planId: string, billingCycle: 'monthly' | 'annual') => Promise<void>;
  isAuthenticated?: boolean;
  customPlans?: Plan[];
  className?: string;
  selectedCycle?: 'monthly' | 'annual';
  onCycleChange?: (cycle: 'monthly' | 'annual') => void;
}

const defaultPlans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '19.900',
    period: 'mes',
    description: 'Perfecto para emprender y testear tu idea de negocio',
    features: [
      'Tienda básica con subdominio .emprendy',
      'CRM básico para gestionar clientes',
      'Plantillas básicas personalizables',
      'Soporte por email',
      'Analytics básicos',
    ],
    popular: false,
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '129.000',
    period: 'mes',
    description: 'El plan más popular para emprendedores que quieren escalar',
    features: [
      'Todo lo incluido en Basic',
      'Chatbot integrado WhatsApp',
      'Automatizaciones de WhatsApp a la medida',
      'Agente IA conversacional de ventas',
      'Asesoría para mejora de plantilla y dominio propio',
      'Integración con comunidad colaborativa',
      'Acceso anticipado a ferias presenciales',
      'CRM avanzado con automatizaciones',
      'Asesoría para integración de pagos',
      'Integración con Shopify y Tienda Nube',
      'Integración de productos en marketplace (5% fee)',
      'Marketing automation y alcance de marca',
    ],
    popular: true,
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'partner',
    name: 'Emprendy Partner',
    price: '189.000',
    period: 'mes',
    description: 'Para emprendedores serios que buscan el máximo crecimiento',
    features: [
      'Todo lo incluido en Pro',
      'Acceso directo y prioritario a ferias anticipadas',
      'Prioridad en asesorías personalizadas',
      'Automatizaciones de WhatsApp a la medida',
      'Automatización a la medida de procesos',
      'Capacitación continua personalizada',
      'Networking en ferias y capacitaciones físicas exclusivas',
      'Gestor de cuenta dedicado',
      'Integración APIs personalizadas',
    ],
    popular: false,
    color: 'from-emerald-400 to-teal-600',
  },
];

export default function PricingPlans({
  mode = 'landing',
  currentPlan = null,
  onPlanSelect,
  onUpgrade,
  isAuthenticated = false,
  customPlans,
  className = '',
}: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = customPlans || defaultPlans;

  const getBase = (price: string) => parseFloat(price.replace(/\./g, ''));

  const getDisplayPrice = (price: string) => {
    const base = getBase(price);
    if (billingCycle === 'annual') {
      const discounted = Math.round(base * 12 * 0.7);
      return discounted.toLocaleString('es-CO');
    }
    return Math.round(base).toLocaleString('es-CO');
  };

  const handlePlanAction = async (plan: Plan) => {
    if (!isAuthenticated && mode === 'dashboard') {
      window.location.href = `/login?redirect=/dashboard/planes&plan=${plan.id}`;
      return;
    }
    setLoadingPlan(plan.id);

    try {
      if (mode === 'dashboard' && currentPlan && onUpgrade) {
        await onUpgrade(plan.id, billingCycle);
      } else if (onPlanSelect) {
        await onPlanSelect(plan.id, billingCycle);
      }
    } catch (err) {
      console.error('handlePlanAction error', err);
    } finally {
      setLoadingPlan(null);
    }
  };

  const isCurrent = (id: string) => mode === 'dashboard' && currentPlan === id;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}
    >
      <section className="pt-16 pb-8 px-6 text-center">
        {mode === 'landing' ? (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Elige el plan que impulsa tu emprendimiento 🚀
            </h1>
            <p className="text-lg text-slate-400 mb-6">
              Prueba cualquiera de nuestros planes por{' '}
              <strong className="text-white">14 días gratis</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-white mb-4">Gestiona tu Plan</h2>
            <p className="text-lg text-slate-400 mb-6">
              {currentPlan
                ? 'Actualiza o cambia tu plan actual'
                : 'Selecciona el plan perfecto para ti'}
            </p>
          </>
        )}

        <div className="flex justify-center items-center gap-4 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Mensual
          </button>
          <div className="relative">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-fourth-base to-fourth-400 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Anual
            </button>
            {billingCycle === 'annual' && (
              <span className="absolute -top-2 -right-2 rounded-full px-2.5 py-1 text-xs font-bold bg-green-500 text-white shadow-lg">
                -30%
              </span>
            )}
          </div>
        </div>
      </section>

      <section id="pricing-cards" className="pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border transition-all hover:-translate-y-2 ${
                isCurrent(plan.id)
                  ? 'ring-2 ring-green-500 border-green-500/50'
                  : plan.popular
                    ? 'border-fourth-500/50 shadow-xl shadow-fourth-500/10'
                    : 'border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fourth-base text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                  <FiStar className="w-4 h-4" /> Más Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-3">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-1 text-white">
                    <span className="text-lg">$</span>
                    <span className="text-4xl font-bold">{getDisplayPrice(plan.price)}</span>
                    <span className="text-sm text-slate-400">
                      {billingCycle === 'annual' ? '/año' : '/mes'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-400 mt-2 font-medium">
                      ✓ Ahorrando 30% vs plan mensual
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handlePlanAction(plan)}
                  disabled={isCurrent(plan.id) || loadingPlan === plan.id}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                    isCurrent(plan.id)
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-gradient-to-r from-fourth-base to-fourth-300 text-white hover:shadow-lg hover:shadow-fourth-500/30'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <FiLoader className="inline-block animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : isCurrent(plan.id) ? (
                    'Plan Actual'
                  ) : mode === 'dashboard' && currentPlan ? (
                    'Cambiar Plan'
                  ) : (
                    'Empieza gratis'
                  )}
                </button>
              </div>

              <div className="space-y-3 text-sm">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
