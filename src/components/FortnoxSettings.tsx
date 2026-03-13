import { useState } from 'react'
import { useFortnoxSettings } from '@/hooks/useFortnoxSettings'
import { isElectron } from '@/api'

interface FortnoxSettingsProps {
  show: boolean
  onClose: () => void
}

export function FortnoxSettings({ show, onClose }: FortnoxSettingsProps) {
  const {
    isConnected, hasCredentials, defaultAccount,
    saveCredentials, startAuth, disconnect, saveDefaultAccount,
  } = useFortnoxSettings()

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [account, setAccount] = useState(defaultAccount)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!show || !isElectron()) return null

  const handleSaveCredentials = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setStatus('Fyll i både Client ID och Client Secret')
      return
    }
    setLoading(true)
    try {
      await saveCredentials(clientId.trim(), clientSecret.trim())
      setStatus('Uppgifterna sparade')
      setClientId('')
      setClientSecret('')
    } catch (error) {
      setStatus(`Fel: ${error instanceof Error ? error.message : String(error)}`)
    }
    setLoading(false)
  }

  const handleAuth = async () => {
    setLoading(true)
    setStatus('Öppnar Fortnox-inloggning...')
    try {
      const result = await startAuth()
      setStatus(result.success ? 'Ansluten till Fortnox!' : result.error || 'Inloggningen misslyckades')
    } catch (error) {
      setStatus(`Fel: ${error instanceof Error ? error.message : String(error)}`)
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true)
    await disconnect()
    setStatus('Frånkopplad från Fortnox')
    setLoading(false)
  }

  const handleSaveAccount = async () => {
    await saveDefaultAccount(account)
    setStatus('Kontonummer sparat')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Fortnox-inställningar</h2>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {isConnected ? 'Ansluten' : 'Ej ansluten'}
          </div>
        </div>

        <div className="space-y-4">
          {/* Credentials */}
          {!hasCredentials && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Ange dina API-uppgifter från Fortnox Developer Portal.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Klistra in Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Klistra in Client Secret"
                />
              </div>
              <button
                onClick={handleSaveCredentials}
                disabled={loading}
                className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Spara uppgifter
              </button>
            </div>
          )}

          {/* Auth button */}
          {hasCredentials && !isConnected && (
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Väntar på inloggning...' : 'Anslut till Fortnox'}
            </button>
          )}

          {/* Account number */}
          {hasCredentials && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Kontonummer (intäkt)</label>
                <input
                  type="text"
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="3010"
                />
              </div>
              <button
                onClick={handleSaveAccount}
                className="py-2 px-3 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Spara
              </button>
            </div>
          )}

          {/* Disconnect */}
          {isConnected && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full py-2 px-4 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Koppla bort Fortnox
            </button>
          )}

          {/* Reset credentials */}
          {hasCredentials && !isConnected && (
            <button
              onClick={handleDisconnect}
              className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Ändra API-uppgifter
            </button>
          )}

          {/* Status */}
          {status && (
            <p className={`text-sm ${status.startsWith('Fel') ? 'text-red-600' : 'text-green-600'}`}>
              {status}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  )
}
