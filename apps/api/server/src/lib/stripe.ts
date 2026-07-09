import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY no está configurada — los endpoints de facturación fallarán')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
