// Precios autoritativos de los planes de suscripción. El frontend nunca debe
// poder dictar el importe a cobrar — debe coincidir con
// apps/web/src/pages/Recharge.tsx (PLANS / ANNUAL_DISCOUNT). Si se cambia un
// precio ahí, hay que replicarlo aquí.

export const PLAN_NAMES: Record<string, string> = {
  base: 'Plan Base',
  pro: 'Plan Pro',
  ia: 'Plan IA',
  'ia-plus': 'Plan IA Premium',
  redes: 'Plan Redes',
}

export const PLAN_MONTHLY_PRICE: Record<string, number> = {
  base: 49,
  pro: 79,
  ia: 119,
  'ia-plus': 159,
  redes: 599,
}

export const ANNUAL_DISCOUNT = 0.2

export type BillingCycle = 'monthly' | 'annual'

export function isValidPlan(planId: string): boolean {
  return Object.prototype.hasOwnProperty.call(PLAN_MONTHLY_PRICE, planId)
}

export function isValidCycle(cycle: string): cycle is BillingCycle {
  return cycle === 'monthly' || cycle === 'annual'
}

// Importe a cobrar, en euros, con dos decimales.
export function priceFor(planId: string, cycle: BillingCycle): number {
  const monthly = PLAN_MONTHLY_PRICE[planId]
  if (cycle === 'annual') return Math.round(monthly * (1 - ANNUAL_DISCOUNT))
  return monthly
}
