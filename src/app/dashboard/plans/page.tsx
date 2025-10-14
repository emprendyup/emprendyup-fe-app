'use client';

import { useState } from 'react';
import PricingPlans, { Plan } from '../components/PricingPlans';
import CheckoutModal from '../components/CheckoutModal';

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('annual');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlanSelect = async (planId: string, billingCycle: 'monthly' | 'annual') => {
    // Encuentra el plan seleccionado de la lista
    const plan = [
      { id: 'basic', name: 'Basic', price: '19.900' },
      { id: 'pro', name: 'Pro', price: '129.000' },
      { id: 'partner', name: 'Emprendy Partner', price: '189.000' },
    ].find((p) => p.id === planId);

    if (plan) {
      setSelectedPlan(plan as Plan);
      setSelectedCycle(billingCycle);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <PricingPlans
        mode="landing"
        onPlanSelect={handlePlanSelect}
        selectedCycle={selectedCycle}
        onCycleChange={setSelectedCycle}
      />

      {selectedPlan && (
        <CheckoutModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          planName={selectedPlan.name}
          planId={selectedPlan.id}
          billingCycle={selectedCycle}
          price={
            selectedCycle === 'annual'
              ? parseInt(selectedPlan.price.replace('.', '')) * 12 * 0.7
              : parseInt(selectedPlan.price.replace('.', ''))
          }
          customerEmail="cliente@ejemplo.com"
        />
      )}
    </div>
  );
}
