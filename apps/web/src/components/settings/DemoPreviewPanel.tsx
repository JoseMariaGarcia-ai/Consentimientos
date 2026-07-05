import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Users, Building2, FlaskConical, Check, Sparkles, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { usePreview } from '@/context/PreviewContext'
import { ALL_MODULES, DEFAULT_CLINICA_MODULES } from '@/lib/modules'

const DEMO_PATIENT_NAME = 'Paciente Demo (Prueba)'
const DEMO_BRANCH_NAME  = 'Sede Demo (Prueba)'
const DEMO_LAB_NAME     = 'Laboratorio Demo (Prueba)'

interface DemoState {
  patientId: string | null
  branchId: string | null
  labId: string | null
}

export function DemoPreviewPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { enterPreview } = usePreview()
  const [demo, setDemo] = useState<DemoState>({ patientId: null, branchId: null, labId: null })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [patients, clinic, labs] = await Promise.all([
        api.get('/patients').catch(() => []),
        api.get('/clinic').catch(() => ({})),
        api.get('/lab-partners').catch(() => []),
      ])
      const patient = Array.isArray(patients) ? patients.find((p: any) => (p.full_name ?? p.fullName) === DEMO_PATIENT_NAME) : null
      const branch = Array.isArray(clinic?.branches) ? clinic.branches.find((b: any) => b.name === DEMO_BRANCH_NAME) : null
      const lab = Array.isArray(labs) ? labs.find((l: any) => l.name === DEMO_LAB_NAME) : null
      setDemo({ patientId: patient?.id ?? null, branchId: branch?.id ?? null, labId: lab?.id ?? null })
    } catch (e: any) {
      setError(e.message ?? t('demoPreviewPanel.errors.checkFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createPatient = async () => {
    setCreating('patient')
    setError('')
    try {
      const created = await api.post('/patients', {
        first_name: 'Paciente',
        last_name: 'Demo (Prueba)',
        full_name: DEMO_PATIENT_NAME,
        date_of_birth: '1990-05-15',
        id_document: '00000000T',
        id_doc_type: 'DNI',
        phone: '+34 600 000 000',
        address: 'Calle de Prueba 1|Madrid|Madrid|España',
        allergies: 'Ninguna conocida (dato de prueba)',
        medications: 'Ninguna (dato de prueba)',
        blood_type: 'O+',
      })
      setDemo(d => ({ ...d, patientId: created.id }))
    } catch (e: any) {
      setError(e.message ?? t('demoPreviewPanel.errors.createPatientFailed'))
    } finally {
      setCreating(null)
    }
  }

  const createBranch = async () => {
    setCreating('branch')
    setError('')
    try {
      const clinic = await api.get('/clinic')
      const branches = Array.isArray(clinic?.branches) ? clinic.branches : []
      const newBranch = {
        id: crypto.randomUUID(),
        name: DEMO_BRANCH_NAME,
        address: 'Avenida de Prueba 22, 28002 Madrid',
        phone: '+34 900 000 000',
      }
      await api.put('/clinic', { ...clinic, branches: [...branches, newBranch] })
      setDemo(d => ({ ...d, branchId: newBranch.id }))
    } catch (e: any) {
      setError(e.message ?? t('demoPreviewPanel.errors.createBranchFailed'))
    } finally {
      setCreating(null)
    }
  }

  const createLab = async () => {
    setCreating('lab')
    setError('')
    try {
      const created = await api.post('/lab-partners', {
        name: DEMO_LAB_NAME,
        email: 'laboratorio.demo@consentspro.test',
        phone: '+34 900 111 222',
        contact_person: 'Contacto de Prueba',
        website: 'https://laboratorio-demo.example.com',
        notes: 'Laboratorio de prueba creado desde Configuración para comprobar esta vista.',
      })
      setDemo(d => ({ ...d, labId: created.id }))
    } catch (e: any) {
      setError(e.message ?? t('demoPreviewPanel.errors.createLabFailed'))
    } finally {
      setCreating(null)
    }
  }

  const createAll = async () => {
    if (!demo.patientId) await createPatient()
    if (!demo.branchId) await createBranch()
    if (!demo.labId) await createLab()
  }

  const viewAsPatient = () => {
    if (!demo.patientId) return
    enterPreview({ role: 'patient', patientId: demo.patientId })
    navigate('/')
  }

  const viewAsClinica = async () => {
    try {
      const users = await api.get('/users')
      const clinicaUser = Array.isArray(users) ? users.find((u: any) => u.role === 'clinica') : null
      const perms = Object.fromEntries((clinicaUser?.user_permissions ?? []).map((p: any) => [p.module, p.can_access]))
      const modules = ALL_MODULES
        .filter(m => (m.key in perms ? perms[m.key] !== false : m.defaultOn))
        .map(m => m.key)
      enterPreview({ role: 'clinica', clinicaModules: modules.length ? modules : DEFAULT_CLINICA_MODULES })
    } catch {
      enterPreview({ role: 'clinica', clinicaModules: DEFAULT_CLINICA_MODULES })
    }
    navigate('/')
  }

  const viewAsLab = () => {
    if (!demo.labId) return
    enterPreview({ role: 'lab_partner', labId: demo.labId })
    navigate('/')
  }

  const cards = [
    {
      key: 'patient',
      icon: Users,
      color: 'blue',
      title: t('demoPreviewPanel.cards.patient.title'),
      description: t('demoPreviewPanel.cards.patient.description'),
      exists: !!demo.patientId,
      onCreate: createPatient,
      onView: viewAsPatient,
    },
    {
      key: 'branch',
      icon: Building2,
      color: 'emerald',
      title: t('demoPreviewPanel.cards.branch.title'),
      description: t('demoPreviewPanel.cards.branch.description'),
      exists: !!demo.branchId,
      onCreate: createBranch,
      onView: viewAsClinica,
    },
    {
      key: 'lab',
      icon: FlaskConical,
      color: 'amber',
      title: t('demoPreviewPanel.cards.lab.title'),
      description: t('demoPreviewPanel.cards.lab.description'),
      exists: !!demo.labId,
      onCreate: createLab,
      onView: viewAsLab,
    },
  ] as const

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-700">{t('demoPreviewPanel.heading')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('demoPreviewPanel.subheading')}
            </p>
          </div>
        </div>
        <button
          onClick={createAll}
          disabled={loading || creating !== null || (!!demo.patientId && !!demo.branchId && !!demo.labId)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t('demoPreviewPanel.createAllButton')}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map(card => {
          const Icon = card.icon
          const c = colorClasses[card.color]
          const busy = creating === card.key
          return (
            <div key={card.key} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{card.title}</p>
              </div>
              <p className="text-xs text-slate-500 flex-1">{card.description}</p>
              {loading ? (
                <div className="h-8 rounded-lg bg-slate-100 animate-pulse" />
              ) : card.exists ? (
                <div className="flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-1 w-fit">
                    <Check className="w-3 h-3" />{t('demoPreviewPanel.testDataCreated')}
                  </span>
                  <button
                    onClick={card.onView}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('demoPreviewPanel.viewAs', { role: t(`demoPreviewPanel.roleNames.${card.key}`) })}
                  </button>
                </div>
              ) : (
                <button
                  onClick={card.onCreate}
                  disabled={busy}
                  className="px-3 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  {busy ? t('demoPreviewPanel.creating') : t('demoPreviewPanel.createTestData')}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
