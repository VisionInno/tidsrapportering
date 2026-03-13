import type Database from 'better-sqlite3'
import { getSetting, saveSecureSetting, saveSetting, getSecureSetting } from './settings'

const TOKEN_URL = 'https://apps.fortnox.se/oauth-v1/token'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export async function exchangeCodeForTokens(
  db: Database.Database,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<void> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Kunde inte hämta token från Fortnox: ${error}`)
  }

  const data: TokenResponse = await response.json()
  saveTokens(db, data)
}

export async function getValidToken(db: Database.Database): Promise<string> {
  const expiresAt = getSetting(db, 'fortnox_token_expires_at')
  const accessToken = getSecureSetting(db, 'fortnox_access_token')

  if (accessToken && expiresAt && new Date(expiresAt) > new Date()) {
    return accessToken
  }

  // Token expired or missing - try refresh
  const refreshToken = getSecureSetting(db, 'fortnox_refresh_token')
  const clientId = getSetting(db, 'fortnox_client_id')
  const clientSecret = getSecureSetting(db, 'fortnox_client_secret')

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Fortnox-anslutningen har gått ut. Logga in igen.')
  }

  return await refreshAccessToken(db, clientId, clientSecret, refreshToken)
}

async function refreshAccessToken(
  db: Database.Database,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Kunde inte förnya Fortnox-token: ${error}`)
  }

  const data: TokenResponse = await response.json()
  saveTokens(db, data)
  return data.access_token
}

function saveTokens(db: Database.Database, data: TokenResponse): void {
  saveSecureSetting(db, 'fortnox_access_token', data.access_token)
  saveSecureSetting(db, 'fortnox_refresh_token', data.refresh_token)
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
  saveSetting(db, 'fortnox_token_expires_at', expiresAt)
}
