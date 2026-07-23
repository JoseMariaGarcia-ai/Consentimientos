const RECORD_LABEL_ES: Record<string, string> = {
  entrada: 'Entrada', salida: 'Salida', inicio_pausa: 'Inicio de pausa', fin_pausa: 'Fin de pausa',
}
const METHOD_LABEL_ES: Record<string, string> = { web: 'App/Web', qr: 'Código QR', pin: 'PIN en terminal' }

function csvEscape(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`
}

export function downloadTimeTrackingCsv(data: any) {
  const rows = [
    ['Empleado', 'DNI/NIE', 'Fecha', 'Hora', 'Tipo', 'Método'],
    ...((data.records ?? []) as any[]).map(r => {
      const d = new Date(r.timestamp_utc)
      return [
        data.employee?.full_name ?? '',
        data.employee?.dni_nie ?? '',
        d.toLocaleDateString('es-ES'),
        d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        RECORD_LABEL_ES[r.record_type] ?? r.record_type,
        METHOD_LABEL_ES[r.method] ?? r.method,
      ]
    }),
    [],
    ['Total horas', String(data.totalHours ?? 0)],
    ['Hash de integridad', data.exportHash ?? ''],
  ]
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fichajes_${data.employee?.full_name ?? 'informe'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Igual que downloadTimeTrackingCsv, pero de TODOS los empleados de la
// clínica a la vez — pensado para entregar el registro de jornada completo
// ante un requerimiento de la Inspección de Trabajo (art. 34.9 ET).
export function downloadTimeTrackingAllCsv(data: any) {
  const rows: string[][] = [['Empleado', 'DNI/NIE', 'Fecha', 'Hora', 'Tipo', 'Método']]
  for (const e of (data.employees ?? []) as any[]) {
    for (const r of (e.records ?? []) as any[]) {
      const d = new Date(r.timestamp_utc)
      rows.push([
        e.employee?.full_name ?? '',
        e.employee?.dni_nie ?? '',
        d.toLocaleDateString('es-ES'),
        d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        RECORD_LABEL_ES[r.record_type] ?? r.record_type,
        METHOD_LABEL_ES[r.method] ?? r.method,
      ])
    }
  }
  rows.push([])
  rows.push(['Resumen por empleado'])
  for (const e of (data.employees ?? []) as any[]) {
    rows.push([e.employee?.full_name ?? '', e.employee?.dni_nie ?? '', 'Total horas', String(e.totalHours ?? 0)])
  }
  rows.push([])
  rows.push(['Total horas (todos los empleados)', String(data.totalHoursAll ?? 0)])
  rows.push(['Hash de integridad', data.exportHash ?? ''])

  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fichajes_todos_los_empleados.csv`
  a.click()
  URL.revokeObjectURL(url)
}
