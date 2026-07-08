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
