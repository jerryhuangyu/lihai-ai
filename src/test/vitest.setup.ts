import '../i18n/config'

// Environment shim, not product code.
//
// Node 26 ships its own experimental global `localStorage` (see
// `node --help` → `--webstorage`). It's present on `globalThis` but is a
// no-op stub unless `--localstorage-file` is passed. Vitest's jsdom
// environment never overwrites it: `populateGlobal` only copies keys that
// are either explicitly allow-listed or own-properties of the jsdom
// `window` instance, and jsdom exposes `localStorage` via a
// `Window.prototype` getter — so it's never an own property and never makes
// it onto `globalThis`. The result: any module that reads `window.localStorage`
// at import time (e.g. zustand's `persist` middleware, which calls
// `createJSONStorage(() => window.localStorage)` synchronously when the
// store module loads) gets Node's non-functional stub instead of jsdom's
// real storage, and later `storage.setItem(...)` calls crash with
// "Cannot read properties of undefined".
//
// Runs before each jsdom test file's own imports (setupFiles execute before
// the test module is loaded), so it patches the global in time for
// import-time reads like zustand's.
const dom = (globalThis as { jsdom?: { window?: { localStorage?: Storage } } }).jsdom
if (dom?.window?.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: dom.window.localStorage,
    configurable: true,
    writable: true,
  })
}

// Mock window.matchMedia for jsdom tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// Mock ResizeObserver for jsdom tests.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mock canvas context for jsdom tests (needed for ECharts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof window !== 'undefined') {
  const HTMLCanvasElement = window.HTMLCanvasElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (HTMLCanvasElement && !HTMLCanvasElement.prototype.getContext.toString().includes('mock')) {
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(HTMLCanvasElement.prototype as any).getContext = function (contextType: any): any {
      const ctx = originalGetContext.call(this, contextType)
      if (ctx) return ctx
      // Fallback mock for unsupported context types (e.g., '2d' without canvas package)
      return {
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        closePath: () => {},
        drawImage: () => {},
        fillText: () => {},
        strokeText: () => {},
        scale: () => {},
        translate: () => {},
        rotate: () => {},
        getImageData: () => ({
          data: new Uint8ClampedArray(),
        }),
        createImageData: () => ({
          data: new Uint8ClampedArray(),
        }),
        putImageData: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createPattern: () => ({}),
        measureText: () => ({ width: 0 }),
        save: () => {},
        restore: () => {},
        setLineDash: () => {},
        getLineDash: () => [],
        lineDashOffset: 0,
        font: '',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        direction: 'ltr',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        canvas: this,
      }
    }
  }
}
