/**
 * Global type declarations for React Native environment
 */

// Global functions available in React Native
declare global {
  // Timer functions
  function setTimeout(callback: () => void, ms: number): number;
  function clearTimeout(id: number): void;
  function setInterval(callback: () => void, ms: number): number;
  function clearInterval(id: number): void;
  
  // Console
  interface Console {
    log(...args: unknown[]): void;
    error(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    info(...args: unknown[]): void;
    debug(...args: unknown[]): void;
  }
  
  const console: Console;
  
  // Development flag
  const __DEV__: boolean;
  
  // Performance API
  interface Performance {
    now(): number;
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
  
  const performance: Performance;
  
  // Location API (web)
  interface Location {
    reload(): void;
    href: string;
  }
  
  const location: Location;
  
  // Window object (web)
  interface Window {
    location: Location;
    performance: Performance;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
  
  const window: Window;
  
  // Event types
  interface Event {
    type: string;
    target: unknown;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  interface PromiseRejectionEvent extends Event {
    promise: Promise<unknown>;
    reason: unknown;
  }
  
  type EventListener = (event: Event) => void;
  
  // Require function
  function require(moduleName: string): unknown;
  
  // Navigator
  interface Navigator {
    userAgent: string;
  }
  
  const navigator: Navigator;
}

export {};
