import '@testing-library/jest-dom'

// Clear localStorage between tests to prevent leaks
beforeEach(() => {
  localStorage.clear()
})

// Mock the Electron API to always return false (tests run in browser/localStorage mode)
vi.mock('@/api', () => ({
  isElectron: () => false,
  getAPI: () => {
    throw new Error('Electron API not available in tests')
  },
}))
