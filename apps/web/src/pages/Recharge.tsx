import { Check, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'base',
    name: 'Plan Base',
    price: '49',
    color: 'bg-[#6B21A8]',
    priceColor: 'text-[#C9A84C]',
    badge: null,
    features: [
      'CIs ilimitados',
      'Historia clínica',
      'Galería fotográfica',
      'Portal paciente',
      'Magic Link + biometría',
      'Canal Mesoestetic integrado',
      'Módulo de pedidos',
      'Programa de referidos activo',
      'Soporte incluido',
    ],
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    price: '79',
    color: 'bg-[#0D1B2E]',
    priceColor: 'text-[#C9A84C]',
    badge: 'Más popular',
    features: [
      'Todo el Plan Base +',
      'Agenda de citas',
      'CRM pacientes',
      'Control de toxina',
      'Inventario',
      'Facturación y presupuestos',
    ],
  },
  {
    id: 'ia',
    name: 'Plan IA',
    price: '119',
    color: 'bg-[#14532D]',
    priceColor: 'text-[#C9A84C]',
    badge: null,
    features: [
      'Todo el Plan Pro +',
      'Agente de voz IA 24/7 — captación de citas',
      'Agente WhatsApp IA 24/7 — captación de citas',
      'Confirmación de citas automatizada',
      'Recordatorios de citas automatizados',
      'Panel de gestión de WhatsApp',
      'Comunicación con pacientes por WhatsApp',
      'Envío por WhatsApp de CIs, historia clínica, fotos, presupuestos y facturas',
    ],
  },
]

export default function Recharge() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planes de suscripción</h1>
          <p className="text-sm text-slate-500 mt-0.5">Elige el plan que mejor se adapte a tu clínica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col"
          >
            {plan.badge && (
              <div className="absolute top-4 right-4 text-[10px] font-bold bg-[#C9A84C] text-[#0D1B2E] px-2.5 py-1 rounded-full uppercase tracking-wide">
                {plan.badge}
              </div>
            )}

            {/* Header */}
            <div className={`${plan.color} px-6 pt-6 pb-7`}>
              <p className="text-white font-bold text-lg">{plan.name}</p>
              <div className="flex items-end gap-1 mt-3">
                <span className={`text-4xl font-black ${plan.priceColor}`}>{plan.price} €</span>
                <span className="text-white/60 text-sm mb-1">/mes</span>
              </div>
              <p className="text-white/50 text-xs mt-0.5">IVA no incluido</p>
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
        ))}
      </div>

      {/* Plan IA note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Nota Plan IA:</strong> La configuración inicial de los agentes IA (servicios, tratamientos y personalización) y la implantación se presupuestan aparte según la complejidad de cada clínica. Los costes de agente de voz y WhatsApp API no están incluidos en la cuota mensual.
        </p>
      </div>
    </div>
  )
}
