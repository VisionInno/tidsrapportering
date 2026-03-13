import { BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import { exchangeCodeForTokens } from './token'

const AUTH_URL = 'https://apps.fortnox.se/oauth-v1/auth'
const REDIRECT_URI = 'http://localhost'

export async function startFortnoxAuth(
  db: Database.Database,
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      title: 'Logga in på Fortnox',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    const authUrl = new URL(AUTH_URL)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', 'invoice customer')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')

    let resolved = false

    const handleRedirect = async (url: string) => {
      if (resolved) return

      try {
        const parsed = new URL(url)
        if (!parsed.origin.startsWith('http://localhost')) return

        const code = parsed.searchParams.get('code')
        const error = parsed.searchParams.get('error')

        if (error) {
          resolved = true
          authWindow.close()
          resolve({ success: false, error: `Fortnox nekade åtkomst: ${error}` })
          return
        }

        if (code) {
          resolved = true
          authWindow.close()
          await exchangeCodeForTokens(db, code, clientId, clientSecret, REDIRECT_URI)
          resolve({ success: true })
        }
      } catch {
        // Not a valid URL or not our redirect - ignore
      }
    }

    authWindow.webContents.on('will-redirect', (_event, url) => {
      handleRedirect(url)
    })

    authWindow.webContents.on('will-navigate', (_event, url) => {
      handleRedirect(url)
    })

    authWindow.on('closed', () => {
      if (!resolved) {
        resolved = true
        resolve({ success: false, error: 'Inloggningen avbröts' })
      }
    })

    authWindow.loadURL(authUrl.toString())
  })
}
