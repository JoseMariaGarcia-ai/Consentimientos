import { query } from './db'

export const ALL_MODULES = ['dashboard', 'agenda', 'patients', 'doctors', 'consents', 'clinical-records', 'photos', 'clinic', 'settings', 'templates', 'lab-partners', 'toxin', 'whatsapp', 'invoicing', 'time-tracking']
export const PLANS = ['base', 'pro', 'ia', 'ia-plus', 'redes']

// Reads plan_permissions for a plan, defaulting any module without an
// explicit row to false, so a "clinica" user's access always matches
// exactly what's configured in Configuración > Planes Suscripción.
export async function getPlanPermissions(plan: string): Promise<Record<string, boolean>> {
  const perms = Object.fromEntries(ALL_MODULES.map(m => [m, false]))
  if (!PLANS.includes(plan)) return perms
  const rows = await query<{ module: string; can_access: boolean }>(
    'SELECT module, can_access FROM plan_permissions WHERE plan = $1', [plan]
  )
  for (const r of rows) perms[r.module] = r.can_access
  return perms
}

export async function applyUserPermissions(userId: string, permissions: Record<string, boolean>) {
  for (const module of ALL_MODULES) {
    await query(
      `INSERT INTO user_permissions (user_id, module, can_access) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, module) DO UPDATE SET can_access=$3`,
      [userId, module, permissions[module] ?? false]
    )
  }
}

// Permisos por defecto de un doctor recién invitado: acceso a las secciones
// clínicas del día a día (agenda, pacientes, consentimientos, historia
// clínica, fotos, toxina, whatsapp, tickets...), sin gestión de la propia
// clínica ni de otros doctores — el titular de la clínica ajusta esto
// después desde Clínica > Doctores y permisos.
const DOCTOR_DEFAULT_EXCLUDED = new Set(['clinic', 'doctors', 'settings', 'templates', 'lab-partners', 'invoicing', 'time-tracking', 'budgets'])
export function defaultDoctorPermissions(): Record<string, boolean> {
  return Object.fromEntries(ALL_MODULES.map(m => [m, !DOCTOR_DEFAULT_EXCLUDED.has(m)]))
}

// Sets clinics.plan and re-applies the new plan's permissions to every
// "clinica"-role user of that clinic — used both by the admin UI
// (routes/users.ts) and by the Stripe webhook when a subscription becomes
// active (routes/billing.ts).
export async function applyPlanToClinic(clinicId: string, plan: string) {
  if (!PLANS.includes(plan)) return
  await query('UPDATE clinics SET plan = $1 WHERE id = $2', [plan, clinicId])
  const permissions = await getPlanPermissions(plan)
  const users = await query<{ id: string }>(
    `SELECT id FROM app_users WHERE clinic_id = $1 AND role = 'clinica'`, [clinicId]
  )
  for (const u of users) await applyUserPermissions(u.id, permissions)
}

// Revoca el acceso de una clínica (impago no regularizado en 5 días):
// clinics.plan a NULL y todos los módulos a false para sus usuarios
// "clinica". No borra nada — reactivar (applyPlanToClinic) lo restaura.
export async function deactivateClinic(clinicId: string) {
  await query('UPDATE clinics SET plan = NULL WHERE id = $1', [clinicId])
  const noAccess = Object.fromEntries(ALL_MODULES.map(m => [m, false]))
  const users = await query<{ id: string }>(
    `SELECT id FROM app_users WHERE clinic_id = $1 AND role = 'clinica'`, [clinicId]
  )
  for (const u of users) await applyUserPermissions(u.id, noAccess)
}
