import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  Fingerprint, Globe, FileText, Calendar, Syringe, Images,
  Smartphone, MessageCircle, Mic, ShieldCheck, ArrowRight,
  Menu, X, Check, Receipt, ImageOff, Tablet,
  Clock, MonitorSmartphone, Hash, ListChecks, UserCheck,
  ChevronDown, Instagram, CheckCircle2, XCircle,
} from 'lucide-react'
import { LanguageSelector } from '@/components/language/LanguageSelector'
import { PLANS, PLAN_KEY } from './Recharge'
import { api } from '@/lib/api'

const FEATURE_ICONS = [Fingerprint, Globe, FileText, Calendar, Syringe, Images, Smartphone, MessageCircle, Mic, Receipt, ImageOff, Tablet, Instagram]
const FEATURE_KEYS = ['signature', 'multilang', 'records', 'agenda', 'toxin', 'gallery', 'portal', 'whatsapp', 'voice', 'budget', 'image_auth', 'tablet_handoff', 'social_media']

const COMPLIANCE_ICONS = [Fingerprint, Clock, MonitorSmartphone, Hash, ListChecks, UserCheck]
const COMPLIANCE_KEYS = ['biometric', 'timestamp', 'device', 'hash', 'audit', 'doctor']

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11']

const ANNUAL_DISCOUNT = 0.2

function goToLogin() {
  window.location.href = '/login'
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-[#0a2342] flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">CP</span>
      </div>
      <span className="text-lg font-bold text-slate-800">
        Consents<span className="text-brand-gold">Pro</span>
      </span>
    </div>
  )
}

function Nav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector variant="light" />
          <button
            onClick={goToLogin}
            className="flex items-center gap-1.5 bg-[#0a2342] hover:bg-[#1a4a7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {t('landing.nav.access')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <button className="md:hidden text-slate-700" onClick={() => setOpen(v => !v)} aria-label="menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 px-5 py-4 flex flex-col gap-3">
          <LanguageSelector variant="light" />
          <button
            onClick={goToLogin}
            className="flex items-center justify-center gap-1.5 bg-[#0a2342] text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            {t('landing.nav.access')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  )
}

function Hero() {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden bg-[#0a2342]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,162,39,0.15),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(26,74,122,0.5),transparent_50%)]" />
      <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <span className="inline-block bg-white/10 text-brand-gold text-xs font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full border border-white/10">
          {t('landing.hero.badge')}
        </span>
        <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl mx-auto">
          {t('landing.hero.title_line1')}{' '}
          <span className="text-brand-gold">{t('landing.hero.title_highlight')}</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
          {t('landing.hero.subtitle')}
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={goToLogin}
            className="flex items-center gap-2 bg-brand-gold hover:brightness-110 text-[#1C1408] font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-black/20 w-full sm:w-auto justify-center"
          >
            {t('landing.hero.cta_primary')} <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#pricing"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors border border-white/15 w-full sm:w-auto justify-center"
          >
            {t('landing.hero.cta_secondary')}
          </a>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-white/50 text-xs font-medium">
          {['trust_1', 'trust_2', 'trust_3'].map(k => (
            <span key={k} className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> {t(`landing.hero.${k}`)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const { t } = useTranslation()
  const items = ['s1', 's2', 's3', 's4']
  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {items.map(k => (
          <div key={k}>
            <p className="text-3xl md:text-4xl font-black text-[#0a2342]">{t(`landing.stats.${k}_value`)}</p>
            <p className="text-xs md:text-sm text-slate-500 mt-1">{t(`landing.stats.${k}_label`)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  const { t } = useTranslation()
  return (
    <section className="max-w-6xl mx-auto px-5 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{t('landing.features.title')}</h2>
        <p className="text-slate-500 mt-3">{t('landing.features.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURE_KEYS.map((key, i) => {
          const Icon = FEATURE_ICONS[i]
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-gold" />
              </div>
              <h3 className="font-bold text-slate-800">{t(`landing.features.items.${key}.title`)}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t(`landing.features.items.${key}.desc`)}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HowItWorks() {
  const { t } = useTranslation()
  const steps = ['step1', 'step2', 'step3']
  return (
    <section className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{t('landing.how.title')}</h2>
          <p className="text-slate-500 mt-3">{t('landing.how.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s} className="relative bg-white rounded-2xl p-7 border border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#0a2342] text-white font-bold flex items-center justify-center text-sm mb-4">
                {i + 1}
              </div>
              <h3 className="font-bold text-slate-800">{t(`landing.how.${s}_title`)}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t(`landing.how.${s}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Compliance() {
  const { t } = useTranslation()
  return (
    <section className="bg-[#0a2342] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(201,162,39,0.1),transparent_45%)]" />
      <div className="relative max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block bg-white/10 text-brand-gold text-xs font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full border border-white/10 mb-4">
            eIDAS
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{t('landing.compliance.title')}</h2>
          <p className="text-white/70 mt-3">{t('landing.compliance.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPLIANCE_KEYS.map((key, i) => {
            const Icon = COMPLIANCE_ICONS[i]
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-gold" />
                </div>
                <h3 className="font-bold text-white">{t(`landing.compliance.items.${key}.title`)}</h3>
                <p className="text-sm text-white/60 mt-2 leading-relaxed">{t(`landing.compliance.items.${key}.desc`)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ plan, promo }: { plan: (typeof PLANS)[number]; promo?: { code: string; trialDays: number } | null }) {
  const { t } = useTranslation()
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAnnual = cycle === 'annual'
  const displayPrice = isAnnual ? Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT)) : plan.monthlyPrice
  const key = PLAN_KEY[plan.id]
  const name = t(`recharge.plans.${key}.name`)
  const badge = plan.hasBadge ? t(`recharge.plans.${key}.badge`) : null
  const features = t(`recharge.plans.${key}.features`, { returnObjects: true }) as string[]

  async function handleHire() {
    setLoading(true)
    setError(null)
    try {
      const body: { planId: string; cycle: string; promoCode?: string } = { planId: plan.id, cycle }
      if (promo) body.promoCode = promo.code
      const { url } = await api.post('/billing/checkout-signup', body)
      window.location.href = url
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : t('recharge.checkout_error'))
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative flex flex-col">
      {promo ? (
        <div className="absolute top-4 right-4 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
          {t('recharge.promoTrialBadge', { days: promo.trialDays })}
        </div>
      ) : badge && (
        <div className="absolute top-4 right-4 text-[10px] font-bold bg-[#C9A84C] text-[#0D1B2E] px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
          {badge}
        </div>
      )}
      <div className={`${plan.color} px-6 pt-6 pb-6`}>
        <p className="text-white font-bold text-lg">{name}</p>
        <div className="flex items-center gap-1 mt-3 bg-white/10 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${!isAnnual ? 'bg-white text-slate-800' : 'text-white/60 hover:text-white'}`}
          >
            {t('recharge.monthly')}
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${isAnnual ? 'bg-white text-slate-800' : 'text-white/60 hover:text-white'}`}
          >
            {t('recharge.annual')}
          </button>
        </div>
        <div className="flex items-end gap-1 mt-3">
          <span className={`text-4xl font-black ${plan.priceColor}`}>{displayPrice} €</span>
          <span className="text-white/60 text-sm mb-1">{t('recharge.per_month')}</span>
        </div>
        {isAnnual ? (
          <p className="text-emerald-400 text-xs font-semibold mt-1">{t('recharge.save_20_annual')}</p>
        ) : (
          <p className="text-white/40 text-xs mt-1">{t('recharge.switch_annual_save')}</p>
        )}
      </div>
      <div className="px-6 py-5 flex flex-col gap-2.5 flex-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-700">{f}</span>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={handleHire}
          disabled={loading}
          className={`w-full py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${promo ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-700'}`}
        >
          {loading ? t('recharge.redirecting') : promo ? t('recharge.promoTrialButton') : t('recharge.hire_plan')}
        </button>
        {promo && !error && (
          <p className="text-[11px] text-slate-400 text-center mt-2">
            {t('recharge.promoTrialHint', { days: promo.trialDays, price: displayPrice })}
          </p>
        )}
        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Pricing() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const signupResult = searchParams.get('signup')
  const promoParam = searchParams.get('promo')
  const [promo, setPromo] = useState<{ code: string; planId: string; trialDays: number } | null>(null)
  const [cancelInfoOpen, setCancelInfoOpen] = useState(false)

  useEffect(() => {
    if (!promoParam) { setPromo(null); return }
    api.get(`/billing/promo-preview?code=${encodeURIComponent(promoParam)}`)
      .then((data: any) => setPromo({ code: promoParam, planId: data.planId, trialDays: data.trialDays }))
      .catch(() => setPromo(null))
  }, [promoParam])

  function dismissSignupBanner() {
    searchParams.delete('signup')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <section id="pricing" className="max-w-7xl mx-auto px-5 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{t('landing.pricing.title')}</h2>
        <p className="text-slate-500 mt-3">{t('landing.pricing.subtitle')}</p>
      </div>
      {signupResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 flex-1">{t('recharge.checkout_success')}</p>
          <button type="button" onClick={dismissSignupBanner} className="text-xs text-emerald-700 underline">
            {t('recharge.dismiss')}
          </button>
        </div>
      )}
      {signupResult === 'cancelled' && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8">
          <XCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <p className="text-sm text-slate-600 flex-1">{t('recharge.checkout_cancelled')}</p>
          <button type="button" onClick={dismissSignupBanner} className="text-xs text-slate-500 underline">
            {t('recharge.dismiss')}
          </button>
        </div>
      )}
      {promo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 flex-1">
              {t('recharge.promoBanner', {
                days: promo.trialDays,
                plan: t(`recharge.plans.${PLAN_KEY[promo.planId] ?? promo.planId}.name`),
              })}
            </p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              {t('recharge.promoTrustStripe')}
            </div>
            <button
              type="button"
              onClick={() => setCancelInfoOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-full px-3 py-1.5 hover:bg-emerald-100 transition-colors"
            >
              {cancelInfoOpen ? t('recharge.promoCancelHide') : t('recharge.promoCancelButton')}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${cancelInfoOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {cancelInfoOpen && (
            <div className="mt-3 bg-white border border-emerald-200 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
              <p>{t('recharge.promoCancelSteps')}</p>
              <ol className="list-decimal list-inside mt-1.5 space-y-1">
                <li>{t('recharge.promoCancelStep1')}</li>
                <li>{t('recharge.promoCancelStep2')}</li>
              </ol>
              <p className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 text-slate-500">
                {t('recharge.promoCancelNote', { days: promo.trialDays })}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {PLANS.map(plan => (
          <PricingCard key={plan.id} plan={plan} promo={promo?.planId === plan.id ? promo : null} />
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-8">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>{t('recharge.note_title')}</strong> {t('recharge.note_text')}
        </p>
      </div>
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mt-4">
        <p className="text-sm text-rose-800 leading-relaxed">
          <strong>{t('recharge.note_redes_title')}</strong> {t('recharge.note_redes_text')}
        </p>
      </div>
    </section>
  )
}

function FaqItem({ itemKey }: { itemKey: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200 py-5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="font-semibold text-slate-800">{t(`landing.faq.items.${itemKey}.q`)}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-sm text-slate-500 mt-3 leading-relaxed whitespace-pre-line">{t(`landing.faq.items.${itemKey}.a`)}</p>
      )}
    </div>
  )
}

function Faq() {
  const { t } = useTranslation()
  return (
    <section className="max-w-3xl mx-auto px-5 py-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{t('landing.faq.title')}</h2>
        <p className="text-slate-500 mt-3">{t('landing.faq.subtitle')}</p>
      </div>
      <div>
        {FAQ_KEYS.map(key => <FaqItem key={key} itemKey={key} />)}
      </div>
    </section>
  )
}

function FinalCta() {
  const { t } = useTranslation()
  return (
    <section className="bg-[#0a2342] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(201,162,39,0.15),transparent_50%)]" />
      <div className="relative max-w-3xl mx-auto px-5 py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{t('landing.final_cta.title')}</h2>
        <p className="text-white/70 mt-3">{t('landing.final_cta.subtitle')}</p>
        <button
          onClick={goToLogin}
          className="mt-8 inline-flex items-center gap-2 bg-brand-gold hover:brightness-110 text-[#1C1408] font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-black/20"
        >
          {t('landing.final_cta.button')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo />
        <p className="text-xs text-slate-400 text-center">{t('landing.footer.tagline')}</p>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} ConsentsPro. {t('landing.footer.rights')}</p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Compliance />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}
