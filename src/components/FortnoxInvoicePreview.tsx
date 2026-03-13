import { useState } from 'react'
import { getAPI } from '@/api'
import type { FortnoxPreviewProject } from '@/utils/fortnox'
import { buildFortnoxPayload } from '@/utils/fortnox'

interface FortnoxInvoicePreviewProps {
  previews: FortnoxPreviewProject[]
  defaultAccount: string
  onClose: () => void
  onSent: () => void
}

export function FortnoxInvoicePreview({ previews, defaultAccount, onClose, onSent }: FortnoxInvoicePreviewProps) {
  const [descriptions, setDescriptions] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>()
    for (const preview of previews) {
      for (const row of preview.rows) {
        map.set(`${preview.project.id}|${row.date}`, row.description)
      }
    }
    return map
  })
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<{ projectName: string; invoiceNumber: string; total: number }[]>([])
  const [error, setError] = useState<string | null>(null)

  const updateDescription = (projectId: string, date: string, value: string) => {
    setDescriptions(prev => new Map(prev).set(`${projectId}|${date}`, value))
  }

  const handleSend = async () => {
    setSending(true)
    setError(null)
    const api = getAPI()
    const sent: typeof results = []

    try {
      for (const preview of previews) {
        // Apply edited descriptions
        const editedPreview = {
          ...preview,
          rows: preview.rows.map(row => ({
            ...row,
            description: descriptions.get(`${preview.project.id}|${row.date}`) || row.description,
          })),
        }

        const payload = buildFortnoxPayload(editedPreview, parseInt(defaultAccount) || 3010)
        const response = await api.fortnox.createInvoice(payload)

        sent.push({
          projectName: preview.project.name,
          invoiceNumber: response.Invoice.DocumentNumber,
          total: response.Invoice.Total,
        })
      }
      setResults(sent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel vid sändning till Fortnox')
    }
    setSending(false)
  }

  // Success view
  if (results.length > 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Fakturor skapade i Fortnox</h3>
          {results.map((r, i) => (
            <div key={i} className="text-sm text-green-700">
              {r.projectName}: Faktura #{r.invoiceNumber} ({r.total.toLocaleString('sv-SE')} kr)
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => { onSent(); onClose() }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Klar
          </button>
        </div>
      </div>
    )
  }

  const grandTotal = previews.reduce((sum, p) => sum + p.totalAmount, 0)
  const grandHours = previews.reduce((sum, p) => sum + p.totalHours, 0)

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <p className="text-sm text-gray-600">
        Granska fakturaunderlaget nedan. Du kan redigera beskrivningar innan du skickar.
      </p>

      {previews.map(preview => (
        <div key={preview.project.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preview.project.color }} />
              <span className="font-medium text-gray-900">{preview.project.name}</span>
            </div>
            <span className="text-sm text-gray-500">Kund: {preview.customerNumber}</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-2 font-medium">Datum</th>
                <th className="px-4 py-2 font-medium">Beskrivning</th>
                <th className="px-4 py-2 font-medium text-right">Timmar</th>
                <th className="px-4 py-2 font-medium text-right">Pris</th>
                <th className="px-4 py-2 font-medium text-right">Belopp</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map(row => (
                <tr key={row.date} className="border-b border-gray-50">
                  <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-1">
                    <input
                      type="text"
                      value={descriptions.get(`${preview.project.id}|${row.date}`) || ''}
                      onChange={e => updateDescription(preview.project.id, row.date, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 focus:border-primary-500 rounded focus:ring-1 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">{row.hours.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{row.rate} kr</td>
                  <td className="px-4 py-2 text-right font-medium">{row.amount.toLocaleString('sv-SE')} kr</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td className="px-4 py-2" colSpan={2}>Summa {preview.project.name}</td>
                <td className="px-4 py-2 text-right">{preview.totalHours.toFixed(2)}</td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2 text-right">{preview.totalAmount.toLocaleString('sv-SE')} kr</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {/* Grand total */}
      {previews.length > 1 && (
        <div className="bg-primary-50 rounded-lg px-4 py-3 flex justify-between font-medium text-primary-900">
          <span>Totalt alla projekt</span>
          <span>{grandHours.toFixed(2)} tim / {grandTotal.toLocaleString('sv-SE')} kr</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {previews.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          Inga fakturerbara poster med Fortnox-kundnummer hittades för vald period.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Avbryt
        </button>
        {previews.length > 0 && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Skickar...' : 'Skicka till Fortnox'}
          </button>
        )}
      </div>
    </div>
  )
}
