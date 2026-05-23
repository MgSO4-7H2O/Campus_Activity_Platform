import '@testing-library/jest-dom'
import { vi } from 'vitest'

const getComputedStyle = window.getComputedStyle.bind(window)

Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: (element: Element) => getComputedStyle(element),
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: TestResizeObserver,
})
