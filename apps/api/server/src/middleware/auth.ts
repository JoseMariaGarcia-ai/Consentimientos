import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import { queryOne } from '../lib/db'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyToken(token)
    ;(req as any).user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Configuración (usuarios, publicidad) es exclusivo de admin/superadmin —
// las clínicas, laboratorios y pacientes nunca deben poder gestionarlo,
// aunque manipulen el frontend o llamen a la API directamente.
//
// El rol se re-lee de la BD en cada request en lugar de confiar en el claim
// del JWT: los tokens duran 30 días, así que si el rol de un usuario cambia
// (p.ej. se le asciende a superadmin) su sesión ya abierta seguiría llevando
// el rol antiguo y quedaría bloqueada hasta que expirase el token.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(403).json({ error: 'Solo un administrador puede acceder a Configuración' })
  try {
    const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
    if (me?.role !== 'admin' && me?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo un administrador puede acceder a Configuración' })
    }
    next()
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

// Workflows (automatizaciones globales) son exclusivos de superadmin —
// a diferencia de requireAdmin, un "admin" normal no debe poder verlos ni
// activarlos/desactivarlos.
export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(403).json({ error: 'Solo un superadministrador puede acceder' })
  try {
    const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
    if (me?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo un superadministrador puede acceder' })
    }
    next()
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

// El certificado digital de una clínica (Facturación > Certificado Digital)
// solo debe poder gestionarlo el propio titular de la clínica (role
// 'clinica'), nunca doctor/receptionist/lab_partner de esa misma clínica —
// a diferencia de requireAdmin/requireSuperAdmin (que son para el personal
// de ConsentsPro), aquí "admin" significa "dueño de la cuenta de la
// clínica". superadmin conserva acceso, igual que en el resto de la app.
export async function requireClinicaAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(403).json({ error: 'Solo el administrador de la clínica puede acceder' })
  try {
    const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
    if (me?.role !== 'clinica' && me?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el administrador de la clínica puede gestionar el certificado digital' })
    }
    next()
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

// Endpoints de gestión de la clínica (pacientes, doctores, consentimientos,
// historia clínica, fotos, citas, presupuestos, facturas...) solo debían
// depender de authMiddleware + el clinic_id derivado del token — pero un
// paciente (rol 'patient') o un laboratorio (rol 'lab_partner') también
// tienen su propio clinic_id/relación con esa clínica, así que con solo eso
// un paciente podía llamar directamente a estas rutas (sin pasar por la UI,
// que nunca se las ofrece) y ver o borrar los datos de CUALQUIER paciente de
// su misma clínica, no solo los suyos. Los pacientes tienen sus propias
// rutas de solo lectura bajo /api/patient/*; los laboratorios, bajo
// /api/lab-partners/* y /api/media.
const STAFF_ROLES = new Set(['admin', 'superadmin', 'clinica', 'doctor', 'receptionist'])
export async function requireStaffRole(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
    if (!me || !STAFF_ROLES.has(me.role)) return res.status(403).json({ error: 'Sin acceso' })
    next()
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

// Los módulos de pago (facturación, control horario, etc.) hasta ahora solo
// se ocultaban en el frontend según el plan de la clínica (App.tsx guard()),
// pero la API no comprobaba nada — una clínica sin el módulo contratado
// podía seguir llamando a estos endpoints directamente. Igual que
// requireAdmin/requireSuperAdmin, aplica a usuarios "clinica" (permisos
// derivados del plan) y "doctor" (permisos asignados a mano por la clínica
// en Clínica > Doctores y permisos) — ambos consultan la misma tabla
// user_permissions. admin/superadmin/receptionist/lab_partner no están
// sujetos a esto, así que pasan sin comprobar.
export function requireModuleAccess(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    try {
      const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
      if (me?.role !== 'clinica' && me?.role !== 'doctor') return next()
      const perm = await queryOne<{ can_access: boolean }>(
        'SELECT can_access FROM user_permissions WHERE user_id = $1 AND module = $2', [userId, moduleKey]
      )
      if (!perm?.can_access) {
        return res.status(403).json({ error: me.role === 'doctor' ? 'No tienes permiso para acceder a esta sección' : 'Este módulo no está incluido en tu plan actual' })
      }
      next()
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }
}
