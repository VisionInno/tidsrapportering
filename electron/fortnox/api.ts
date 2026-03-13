const API_BASE = 'https://api.fortnox.se/3'

export interface FortnoxInvoiceRow {
  AccountNumber: number
  Description: string
  DeliveredQuantity: number
  Price: number
  Unit: string
}

export interface FortnoxInvoicePayload {
  Invoice: {
    CustomerNumber: string
    InvoiceDate?: string
    DueDate?: string
    OurReference?: string
    InvoiceRows: FortnoxInvoiceRow[]
  }
}

export interface FortnoxCustomer {
  CustomerNumber: string
  Name: string
  OrganisationNumber?: string
  City?: string
}

interface FortnoxInvoiceResponse {
  Invoice: {
    DocumentNumber: string
    CustomerNumber: string
    Total: number
    InvoiceDate: string
  }
}

async function fortnoxFetch(token: string, path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    let message = `Fortnox API-fel (${response.status})`
    try {
      const parsed = JSON.parse(text)
      message = parsed.ErrorInformation?.Message || parsed.message || message
    } catch {
      // Use default message
    }
    throw new Error(message)
  }

  return response.json()
}

export async function createFortnoxInvoice(
  token: string,
  payload: FortnoxInvoicePayload
): Promise<FortnoxInvoiceResponse> {
  return fortnoxFetch(token, '/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getFortnoxCustomers(
  token: string
): Promise<FortnoxCustomer[]> {
  const data = await fortnoxFetch(token, '/customers?limit=500')
  return (data.Customers || []).map((c: Record<string, string>) => ({
    CustomerNumber: c.CustomerNumber,
    Name: c.Name,
    OrganisationNumber: c.OrganisationNumber,
    City: c.City,
  }))
}
