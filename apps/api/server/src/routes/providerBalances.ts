import { Router } from 'express'
import { getProviderBalances } from '../lib/providerBalances'

const router = Router()

// GET /api/admin/provider-balances?refresh=1 — saldo real de ConsentsPro en
// cada proveedor externo (Parte B, solo lectura). Cacheado 20 min salvo que
// se pida refresco explícito (botón "Actualizar" del panel).
router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1'
    const balances = await getProviderBalances(forceRefresh)
    return res.json(balances)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
