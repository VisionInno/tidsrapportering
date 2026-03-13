import { useState, useEffect, useCallback } from 'react'
import { isElectron, getAPI } from '@/api'
import type { FortnoxConfig } from '@/api'

export function useFortnoxSettings() {
  const [config, setConfig] = useState<FortnoxConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [defaultAccount, setDefaultAccount] = useState('3010')

  const loadConfig = useCallback(async () => {
    if (!isElectron()) {
      setLoading(false)
      return
    }
    try {
      const api = getAPI()
      const cfg = await api.fortnox.getConfig()
      setConfig(cfg)
      const account = await api.fortnox.getSetting('fortnox_default_account')
      if (account) setDefaultAccount(account)
    } catch (error) {
      console.error('Kunde inte ladda Fortnox-inställningar:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const saveCredentials = useCallback(async (clientId: string, clientSecret: string) => {
    const api = getAPI()
    await api.fortnox.saveCredentials(clientId, clientSecret)
    await loadConfig()
  }, [loadConfig])

  const startAuth = useCallback(async () => {
    const api = getAPI()
    const result = await api.fortnox.startAuth()
    if (result.success) {
      await loadConfig()
    }
    return result
  }, [loadConfig])

  const disconnect = useCallback(async () => {
    const api = getAPI()
    await api.fortnox.disconnect()
    setConfig(null)
    await loadConfig()
  }, [loadConfig])

  const saveDefaultAccount = useCallback(async (account: string) => {
    const api = getAPI()
    await api.fortnox.setSetting('fortnox_default_account', account)
    setDefaultAccount(account)
  }, [])

  return {
    config,
    loading,
    isConnected: config?.hasTokens ?? false,
    hasCredentials: !!(config?.clientId),
    defaultAccount,
    saveCredentials,
    startAuth,
    disconnect,
    saveDefaultAccount,
    reload: loadConfig,
  }
}
