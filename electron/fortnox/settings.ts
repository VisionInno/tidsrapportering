import type Database from 'better-sqlite3'
import { safeStorage } from 'electron'

export function saveSetting(db: Database.Database, key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function deleteSetting(db: Database.Database, key: string): void {
  db.prepare('DELETE FROM settings WHERE key = ?').run(key)
}

export function saveSecureSetting(db: Database.Database, key: string, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Kryptering är inte tillgänglig på denna dator')
  }
  const encrypted = safeStorage.encryptString(value).toString('base64')
  saveSetting(db, key, encrypted)
}

export function getSecureSetting(db: Database.Database, key: string): string | null {
  const encrypted = getSetting(db, key)
  if (!encrypted) return null
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Kryptering är inte tillgänglig på denna dator')
  }
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
}

export interface FortnoxConfig {
  clientId: string | null
  clientSecret: string | null
  hasTokens: boolean
  tokenExpiresAt: string | null
}

export function getFortnoxConfig(db: Database.Database): FortnoxConfig {
  return {
    clientId: getSetting(db, 'fortnox_client_id'),
    clientSecret: getSecureSetting(db, 'fortnox_client_secret'),
    hasTokens: getSetting(db, 'fortnox_access_token') !== null,
    tokenExpiresAt: getSetting(db, 'fortnox_token_expires_at'),
  }
}

export function saveFortnoxCredentials(db: Database.Database, clientId: string, clientSecret: string): void {
  saveSetting(db, 'fortnox_client_id', clientId)
  saveSecureSetting(db, 'fortnox_client_secret', clientSecret)
}

export function clearFortnoxTokens(db: Database.Database): void {
  deleteSetting(db, 'fortnox_access_token')
  deleteSetting(db, 'fortnox_refresh_token')
  deleteSetting(db, 'fortnox_token_expires_at')
}

export function clearAllFortnoxSettings(db: Database.Database): void {
  clearFortnoxTokens(db)
  deleteSetting(db, 'fortnox_client_id')
  deleteSetting(db, 'fortnox_client_secret')
  deleteSetting(db, 'fortnox_default_account')
}
