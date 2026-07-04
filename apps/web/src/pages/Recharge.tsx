import { useState } from 'react'
import { Check, Zap } from 'lucide-react'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  color: string
  priceColor: string
  badge: string | null
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'base',
    name: 'Plan Base',
    monthlyPrice: 49,
    color: 'bg-[#6B21A8]',
    priceColor: 'text-[#C9A84C]',
    badge: null,
    features: [
      'CIs ilimitados',
      'Historia clínica',
      'Galería fotográfica',
      'Portal paciente',
      'Magic Link + biometría',
      'Soporte incluido',
    ],
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    monthlyPrice: 79,
    color: 'bg-[#0D1B2E]',
    priceColor: 'text-[#C9A84C]',
    badge: 'Más popular',
    features: [
      'Todo el Plan Base +',
      'Agenda de citas',
      'CRM pacientes',
      'Control de toxina',
      'Presupuestos a Pacientes',
    ],
  },
  {
    id: 'ia',
    name: 'Plan IA',
    monthlyPrice: 119,
    color: 'bg-[#14532D]',
    priceColor: 'text-[#C9A84C]',
    badge: null,
    features: [
      'Todo el Plan Pro +',
      'Agente WhatsApp IA 24/7 — captación de citas',
      'Confirmación de citas automatizada',
      'Recordatorios de citas automatizados',
      'Panel de gestión de WhatsApp',
      'Comunicación con pacientes por WhatsApp',
      'Envío por WhatsApp de CIs, historia clínica, fotos, presupuestos y facturas',
    ],
  },
  {
    id: 'ia-plus',
    name: 'Plan IA Premium',
    monthlyPrice: 159,
    color: 'bg-[#1C1408]',
    priceColor: 'text-[#C9A84C]',
    badge: 'Nuevo',
    features: [
      'Todo el Plan IA +',
      'Agente de voz IA 24/7: contesta llamadas',
      'Agenda citas por teléfono automáticamente',
      'Clona la voz de su recepcionista al 100 %',
    ],
  },
]

const ANNUAL_DISCOUNT = 0.2

function PlanCard({ plan }: { plan: Plan }) {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('annual')
  const isAnnual = cycle === 'annual'
  const displayPrice = isAnnual
    ? Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT))
    : plan.monthlyPrice

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
      {plan.badge && (
        <div className="absolute top-4 right-4 text-[10px] font-bold bg-[#C9A84C] text-[#0D1B2E] px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className={`${plan.color} px-6 pt-6 pb-6`}>
        <p className="text-white font-bold text-lg">{plan.name}</p>

        {/* Anual / Mensual toggle */}
        <div className="flex items-center gap-1 mt-3 bg-white/10 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setCycle('annual')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              isAnnual ? 'bg-white text-slate-800' : 'text-white/60 hover:text-white'
            }`}
          >
            Anual
          </button>
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              !isAnnual ? 'bg-white text-slate-800' : 'text-white/60 hover:text-white'
            }`}
          >
            Mensual
          </button>
        </div>

        <div className="flex items-end gap-1 mt-3">
          <span className={`text-4xl font-black ${plan.priceColor}`}>{displayPrice} €</span>
          <span className="text-white/60 text-sm mb-1">/mes</span>
        </div>

        {isAnnual ? (
          <p className="text-emerald-400 text-xs font-semibold mt-1">Ahorras un 20 % pagando al año</p>
        ) : (
          <p className="text-white/40 text-xs mt-1">Cambia a anual y ahorra un 20 %</p>
        )}
      </div>

      {/* Features */}
      <div className="px-6 py-5 flex flex-col gap-2.5 flex-1">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-700">{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
          Contratar plan
        </button>
      </div>
    </div>
  )
}

export default function Recharge() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planes de suscripción</h1>
          <p className="text-sm text-slate-500 mt-0.5">Elige el plan que mejor se adapte a tu clínica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
      </div>

      {/* Plan IA / IA Premium note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Nota Plan IA y Plan IA Premium:</strong> La configuración inicial de los agentes IA (servicios, tratamientos y personalización) y la implantación se presupuestan aparte según la complejidad de cada clínica. Los costes de agente de voz y WhatsApp API no están incluidos en la cuota mensual.
        </p>
      </div>
    </div>
  )
}
