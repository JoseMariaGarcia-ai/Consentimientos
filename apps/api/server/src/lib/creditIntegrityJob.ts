import { query } from './db'

// Punto 6 del documento de requisitos: recorre cada clínica, recalcula el
// saldo sumando credit_transactions desde el origen, y lo compara con
// clinic_credit_accounts.balance_cents. Si no coincide, se registra una
// alarma para revisión humana — NUNCA se corrige el saldo automáticamente.
export async function runCreditIntegrityCheck(): Promise<{ checked: number; mismatches: number }> {
  const accounts = await query<{ clinic_id: string; balance_cents: string }>(
    'SELECT clinic_id, balance_cents FROM clinic_credit_accounts'
  )
  let mismatches = 0
  for (const account of accounts) {
    try {
      const sumRow = await query<{ total: string | null }>(
        'SELECT SUM(amount_cents) AS total FROM credit_transactions WHERE clinic_id = $1', [account.clinic_id]
      )
      const expected = BigInt(sumRow[0]?.total ?? '0')
      const actual = BigInt(account.balance_cents)
      if (expected !== actual) {
        mismatches++
        // Evita duplicar la misma alarma sin resolver si el barrido corre
        // más de una vez antes de que alguien la revise.
        const existing = await query(
          `SELECT id FROM credit_integrity_alarms
           WHERE clinic_id = $1 AND resolved_at IS NULL AND expected_balance_cents = $2 AND actual_balance_cents = $3`,
          [account.clinic_id, expected.toString(), actual.toString()]
        )
        if (existing.length === 0) {
          await query(
            `INSERT INTO credit_integrity_alarms (clinic_id, expected_balance_cents, actual_balance_cents)
             VALUES ($1, $2, $3)`,
            [account.clinic_id, expected.toString(), actual.toString()]
          )
          console.error(`[creditIntegrityJob] DISCREPANCIA de saldo en clínica ${account.clinic_id}: esperado ${expected}, real ${actual}`)
        }
      }
    } catch (err: any) {
      console.error(`[creditIntegrityJob] fallo comprobando clínica ${account.clinic_id}:`, err.message)
    }
  }
  return { checked: accounts.length, mismatches }
}
