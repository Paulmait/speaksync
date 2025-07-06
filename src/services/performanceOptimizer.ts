// Performance optimization utilities for SpeakSync
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private observers: Map<string, PerformanceObserver> = new Map();
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Memory management
  initMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          const memoryUsage = {
            used: memory.usedJSHeapSize / 1024 / 1024, // MB
            total: memory.totalJSHeapSize / 1024 / 1024, // MB
            limit: memory.jsHeapSizeLimit / 1024 / 1024, // MB
          };
          
          // Trigger garbage collection if memory usage is high
          if (memoryUsage.used / memoryUsage.limit > 0.8) {
            this.optimizeMemory();
          }
          
          this.recordMetric('memory', memoryUsage.used);
        }
      };

      // Check memory every 30 seconds
      setInterval(checkMemory, 30000);
      checkMemory(); // Initial check
    }
  }

  // Network request optimization
  createOptimizedFetch() {
    const requestCache = new Map<string, { data: any; timestamp: number }>();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    return async (url: string, options?: RequestInit) => {
      const cacheKey = `${url}_${JSON.stringify(options)}`;
      const cached = requestCache.get(cacheKey);
      
      // Return cached data if still valid
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return Promise.resolve(new Response(JSON.stringify(cached.data)));
      }

      // Batch similar requests
      if (this.hasPendingRequest(url)) {
        return this.waitForPendingRequest(url);
      }

      const startTime = performance.now();
      
      try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        // Cache successful responses
        if (response.ok) {
          requestCache.set(cacheKey, { data, timestamp: Date.now() });
        }
        
        // Record network timing
        this.recordMetric('network', performance.now() - startTime);
        
        return new Response(JSON.stringify(data));
      } catch (error) {
        this.recordMetric('networkErrors', 1);
        throw error;
      }
    };
  }

  // Image optimization and lazy loading
  createLazyImageObserver(callback: (entries: IntersectionObserverEntry[]) => void) {
    const observer = new IntersectionObserver(
      (entries) => {
        callback(entries);
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.1,
      }
    );

    return observer;
  }

  // Virtual scrolling for large lists
  calculateVirtualScrollItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems - 1, visibleEnd + overscan);

    return {
      start,
      end,
      visibleStart,
      visibleEnd,
      offsetY: start * itemHeight,
    };
  }

  // Debounce function for performance-critical operations
  debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T {
    let timeout: NodeJS.Timeout | null = null;
    
    return ((...args: Parameters<T>) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func(...args);
    }) as T;
  }

  // Throttle function for scroll and resize events
  throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): T {
    let inThrottle: boolean;
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  // Web Worker management for heavy computations
  createOptimizedWorker(workerScript: string) {
    return new Promise<Worker>((resolve, reject) => {
      try {
        const worker = new Worker(workerScript);
        
        worker.onerror = (error) => {
          reject(error);
        };
        
        worker.onmessage = (event) => {
          if (event.data.type === 'ready') {
            resolve(worker);
          }
        };
        
        // Timeout for worker initialization
        setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Bundle size optimization - dynamic imports
  async loadModule<T>(moduleLoader: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const module = await moduleLoader();
      this.recordMetric('moduleLoad', performance.now() - startTime);
      return module;
    } catch (error) {
      this.recordMetric('moduleLoadErrors', 1);
      throw error;
    }
  }

  // Audio processing optimization
  createOptimizedAudioContext(): AudioContext {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 44100,
    });

    // Optimize for speech processing
    if (audioContext.createScriptProcessor) {
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.connect(audioContext.destination);
    }

    return audioContext;
  }

  // Performance monitoring
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getPerformanceReport() {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        report[name] = {
          average: Math.round(avg * 100) / 100,
          max: Math.round(max * 100) / 100,
          min: Math.round(min * 100) / 100,
          samples: values.length,
        };
      }
    });
    
    return report;
  }

  // Clean up resources
  private optimizeMemory() {
    // Clear old cached data
    this.clearOldCaches();
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  private clearOldCaches() {
    // This would be implemented to clear various caches
    console.log('Clearing old caches to optimize memory');
  }

  private hasPendingRequest(url: string): boolean {
    // Implementation to track pending requests
    return false;
  }

  private waitForPendingRequest(url: string): Promise<Response> {
    // Implementation to wait for pending requests
    return Promise.resolve(new Response());
  }

  // Real-time speech processing optimization
  optimizeSpeechProcessing(audioBuffer: AudioBuffer): AudioBuffer {
    // Apply noise reduction and gain normalization
    const channelData = audioBuffer.getChannelData(0);
    const length = channelData.length;
    
    // Simple noise gate
    const threshold = 0.01;
    for (let i = 0; i < length; i++) {
      if (Math.abs(channelData[i]) < threshold) {
        channelData[i] = 0;
      }
    }
    
    // Normalize audio levels
    let maxAmplitude = 0;
    for (let i = 0; i < length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }
    
    if (maxAmplitude > 0) {
      const normalizeGain = 0.8 / maxAmplitude;
      for (let i = 0; i < length; i++) {
        channelData[i] *= normalizeGain;
      }
    }
    
    return audioBuffer;
  }

  // Public cleanup method
  cleanup() {
    this.optimizeMemory();
    this.clearOldCaches();
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
