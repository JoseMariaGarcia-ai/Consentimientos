import { query, queryOne } from './db'

// payment_status es siempre derivado, nunca editable a mano — se recalcula
// aquí tras cada alta o baja de un pago, comparando la suma de
// invoice_payments contra el total de la factura.
export async function recalculatePaymentStatus(invoiceId: string): Promise<string> {
  const invoice = await queryOne<{ total_amount: string }>('SELECT total_amount FROM invoices WHERE id = $1', [invoiceId])
  if (!invoice) throw new Error('Factura no encontrada')
  const sumRow = await queryOne<{ sum: string | null }>(
    'SELECT SUM(amount) AS sum FROM invoice_payments WHERE invoice_id = $1', [invoiceId]
  )
  const paid = Number(sumRow?.sum ?? 0)
  const total = Number(invoice.total_amount)
  const status = paid <= 0 ? 'pendiente' : paid < total ? 'parcial' : 'cobrada'
  await query('UPDATE invoices SET payment_status = $1 WHERE id = $2', [status, invoiceId])
  return status
}
