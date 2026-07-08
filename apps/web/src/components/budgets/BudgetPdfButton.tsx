import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BudgetPdf } from '@/lib/pdf/budgetPdf'

interface Props {
  budget: any
  clinic: any
  variant?: 'icon' | 'button'
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function budgetPdfBlobBase64(budget: any, clinic: any): Promise<string> {
  const blob = await pdf(
    <BudgetPdf
      clinic={clinic}
      patient={budget.patient}
      items={budget.items ?? []}
      budgetNumber={budget.budget_number}
      createdAt={budget.created_at}
      validUntil={budget.valid_until}
      notes={budget.notes}
    />
  ).toBlob()
  const buffer = await blob.arrayBuffer()
  return arrayBufferToBase64(buffer)
}

export function BudgetPdfButton({ budget, clinic, variant = 'icon' }: Props) {
  const { t } = useTranslation()
  const filename = `presupuesto_${budget.budget_number}.pdf`

  return (
    <PDFDownloadLink
      document={
        <BudgetPdf
          clinic={clinic}
          patient={budget.patient}
          items={budget.items ?? []}
          budgetNumber={budget.budget_number}
          createdAt={budget.created_at}
          validUntil={budget.valid_until}
          notes={budget.notes}
        />
      }
      fileName={filename}
    >
      {({ loading }) =>
        variant === 'button' ? (
          <button
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {t('budgetPdfButton.export')}
          </button>
        ) : (
          <button
            disabled={loading}
            title={t('budgetPdfButton.export')}
            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          </button>
        )
      }
    </PDFDownloadLink>
  )
}
