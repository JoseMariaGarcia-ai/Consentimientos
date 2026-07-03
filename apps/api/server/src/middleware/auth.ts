import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'

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
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req as any).user?.role
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo un administrador puede acceder a Configuración' })
  }
  next()
}
