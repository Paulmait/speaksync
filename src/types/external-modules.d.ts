/**
 * Type declarations for external modules used in SpeakSync Mobile
 * Add type declarations here for third-party modules that don't have their own types
 */

declare module '@sentry/react-native' {
  export function init(options: Record<string, unknown>): void;
  export function captureException(error: unknown, context?: Record<string, unknown>): void;
  export function captureMessage(message: string, level?: string): void;
  export function setUser(user: Record<string, unknown> | null): void;
  export function setTag(key: string, value: string): void;
  export function setTags(tags: Record<string, string>): void;
  export function setContext(name: string, context: Record<string, unknown>): void;
  export function addBreadcrumb(breadcrumb: Record<string, unknown>): void;
  export function startTransaction(context: Record<string, unknown>): any;
  export function configureScope(callback: (scope: any) => void): void;
  export function flush(timeout?: number): Promise<boolean>;
  export function close(timeout?: number): Promise<boolean>;
  export const ReactNativeTracing: any;
  export const ReactNavigationInstrumentation: any;
}

declare module '@react-native-firebase/crashlytics' {
  export default function crashlytics(): {
    crash(): void;
    log(message: string): void;
    setAttribute(name: string, value: string): Promise<null>;
    setAttributes(attributes: Record<string, string>): Promise<null>;
    setUserId(userId: string): Promise<null>;
    setCustomKey(key: string, value: string | number | boolean): Promise<null>;
    setCustomKeys(keys: Record<string, string | number | boolean>): Promise<null>;
    recordError(error: Error, jsErrorName?: string): Promise<null>;
    sendUnsentReports(): Promise<null>;
    deleteUnsentReports(): Promise<null>;
    didCrashOnPreviousExecution(): Promise<boolean>;
    setCrashlyticsCollectionEnabled(enabled: boolean): Promise<null>;
  };
}

declare module '@react-native-firebase/perf' {
  export default function perf(): {
    setPerformanceCollectionEnabled(enabled: boolean): Promise<null>;
    startTrace(traceName: string): {
      putAttribute(attribute: string, value: string): Promise<null>;
      removeAttribute(attribute: string): Promise<null>;
      getAttributes(): Promise<Record<string, string>>;
      putMetric(metricName: string, value: number): Promise<null>;
      incrementMetric(metricName: string, incrementBy: number): Promise<null>;
      getMetric(metricName: string): Promise<number>;
      stop(): Promise<null>;
    };
    newHttpMetric(url: string, method: string): {
      start(): Promise<null>;
      setHttpResponseCode(code: number): Promise<null>;
      setResponseContentType(type: string): Promise<null>;
      setRequestPayloadSize(bytes: number): Promise<null>;
      setResponsePayloadSize(bytes: number): Promise<null>;
      putAttribute(attribute: string, value: string): Promise<null>;
      removeAttribute(attribute: string): Promise<null>;
      getAttributes(): Promise<Record<string, string>>;
      stop(): Promise<null>;
    };
    newScreenTrace(screen: string): {
      start(): Promise<null>;
      stop(): Promise<null>;
      putMetric(metricName: string, value: number): Promise<null>;
      putAttribute(attribute: string, value: string): Promise<null>;
      getAttributes(): Promise<Record<string, string>>;
      removeAttribute(attribute: string): Promise<null>;
      getMetric(metricName: string): Promise<number>;
      incrementMetric(metricName: string, incrementBy: number): Promise<null>;
    };
  };
}

declare module '@datadog/browser-rum' {
  export const datadogRum: {
    init: (config: Record<string, unknown>) => void;
    startView: (name: string, context?: Record<string, unknown>) => void;
    addAction: (action: string, context?: Record<string, unknown>) => void;
    addError: (error: Error, context?: Record<string, unknown>) => void;
    addTiming: (name: string) => void;
    setUser: (user: Record<string, unknown> | null) => void;
    setGlobalContext: (context: Record<string, unknown>) => void;
    startSessionReplayRecording: () => void;
    stopSessionReplayRecording: () => void;
  };
}
