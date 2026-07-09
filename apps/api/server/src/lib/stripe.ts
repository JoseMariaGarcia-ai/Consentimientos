import Stripe from 'stripe'

// Construido de forma perezosa: instanciar Stripe con una clave vacía lanza
// una excepción de inmediato (no un error normal de uso), lo que tumbaría
// todo el proceso al arrancar si STRIPE_SECRET_KEY no está configurada
// todavía. Al construirlo solo cuando se usa, la falta de clave se convierte
// en un 500 controlado en la petición concreta (ver catch en routes/billing.ts)
// en lugar de derribar el servidor entero.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY no está configurada')
  _stripe = new Stripe(key)
  return _stripe
}
