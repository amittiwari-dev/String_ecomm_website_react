/**
 * Global Error Handler Service
 * 
 * Provides centralized error logging, reporting, and recovery mechanisms
 * for the entire application.
 * 
 * Requirements: 2.4
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string | null;
  sessionId: string;
  buildVersion: string;
  environment: string;
  errorType: 'javascript' | 'api' | 'network' | 'component' | 'unhandled';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface ErrorReportingConfig {
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  enableRemoteReporting: boolean;
  maxLocalErrors: number;
  remoteEndpoint?: string;
  apiKey?: string;
}

class GlobalErrorHandler {
  private config: ErrorReportingConfig;
  private sessionId: string;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableLocalStorage: true,
      enableRemoteReporting: false,
      maxLocalErrors: 50,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupGlobalHandlers();
  }

  /**
   * Initialize global error handlers
   */
  private setupGlobalHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        sessionId: this.sessionId,
        buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        environment: import.meta.env.MODE || 'development',
        errorType: 'javascript',
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        sessionId: this.sessionId,
        buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        environment: import.meta.env.MODE || 'development',
        errorType: 'unhandled',
        severity: 'high',
        context: {
          reason: event.reason,
        }
      });
    });

    // Handle network errors (fetch failures)
    this.interceptFetch();
  }

  /**
   * Intercept fetch calls to catch network errors
   */
  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log failed HTTP requests
        if (!response.ok && response.status >= 500) {
          this.reportError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getUserId(),
            sessionId: this.sessionId,
            buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
            environment: import.meta.env.MODE || 'development',
            errorType: 'network',
            severity: 'medium',
            context: {
              requestUrl: args[0],
              status: response.status,
              statusText: response.statusText,
            }
          });
        }
        
        return response;
      } catch (error) {
        // Log network failures
        this.reportError({
          message: `Network Error: ${error.message}`,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.getUserId(),
          sessionId: this.sessionId,
          buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
          environment: import.meta.env.MODE || 'development',
          errorType: 'network',
          severity: 'high',
          context: {
            requestUrl: args[0],
            requestOptions: args[1],
          }
        });
        
        throw error;
      }
    };
  }

  /**
   * Report an error with full context
   */
  public reportError(errorReport: ErrorReport) {
    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorReport);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      this.storeErrorLocally(errorReport);
    }

    // Remote reporting
    if (this.config.enableRemoteReporting) {
      this.sendToRemoteService(errorReport);
    }

    // Third-party services
    this.reportToThirdPartyServices(errorReport);
  }

  /**
   * Report API errors with specific context
   */
  public reportApiError(error: any, context: Record<string, any> = {}) {
    const errorReport: ErrorReport = {
      message: error.message || 'API Error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.sessionId,
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env.MODE || 'development',
      errorType: 'api',
      severity: this.getApiErrorSeverity(error),
      context: {
        status: error.status,
        errors: error.errors,
        ...context,
      }
    };

    this.reportError(errorReport);
  }

  /**
   * Report component errors from Error Boundaries
   */
  public reportComponentError(error: Error, errorInfo: any, context: Record<string, any> = {}) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.sessionId,
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env.MODE || 'development',
      errorType: 'component',
      severity: 'high',
      context: {
        componentName: this.getComponentName(errorInfo.componentStack),
        ...context,
      }
    };

    this.reportError(errorReport);
  }

  /**
   * Get stored error logs for debugging
   */
  public getStoredErrors(): ErrorReport[] {
    try {
      const errors = localStorage.getItem('errorLogs');
      return errors ? JSON.parse(errors) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored error logs
   */
  public clearStoredErrors() {
    try {
      localStorage.removeItem('errorLogs');
    } catch (error) {
      console.warn('Failed to clear error logs:', error);
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics() {
    const errors = this.getStoredErrors();
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent = errors.filter(error => new Date(error.timestamp) > last24Hours);
    const byType = errors.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: errors.length,
      recent: recent.length,
      byType,
      bySeverity,
      oldestError: errors[0]?.timestamp,
      newestError: errors[errors.length - 1]?.timestamp,
    };
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  }

  private getApiErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (error.status >= 500) return 'critical';
    if (error.status === 401 || error.status === 403) return 'medium';
    if (error.status >= 400) return 'low';
    return 'high';
  }

  private getComponentName(componentStack: string): string {
    const match = componentStack?.match(/in (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  private logToConsole(errorReport: ErrorReport) {
    const emoji = this.getSeverityEmoji(errorReport.severity);
    
    console.group(`${emoji} ${errorReport.errorType.toUpperCase()} Error - ${errorReport.severity.toUpperCase()}`);
    console.error('Message:', errorReport.message);
    console.error('URL:', errorReport.url);
    console.error('Timestamp:', errorReport.timestamp);
    
    if (errorReport.stack) {
      console.error('Stack:', errorReport.stack);
    }
    
    if (errorReport.componentStack) {
      console.error('Component Stack:', errorReport.componentStack);
    }
    
    if (errorReport.context) {
      console.table(errorReport.context);
    }
    
    console.groupEnd();
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🔥';
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '❓';
    }
  }

  private storeErrorLocally(errorReport: ErrorReport) {
    try {
      const errors = this.getStoredErrors();
      errors.push(errorReport);
      
      // Keep only the most recent errors
      if (errors.length > this.config.maxLocalErrors) {
        errors.splice(0, errors.length - this.config.maxLocalErrors);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(errors));
    } catch (storageError) {
      console.warn('Failed to store error locally:', storageError);
    }
  }

  private async sendToRemoteService(errorReport: ErrorReport) {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(errorReport),
      });
    } catch (networkError) {
      console.warn('Failed to send error to remote service:', networkError);
    }
  }

  private reportToThirdPartyServices(errorReport: ErrorReport) {
    // Sentry
    if (window.Sentry) {
      window.Sentry.captureException(new Error(errorReport.message), {
        extra: errorReport.context,
        tags: {
          errorType: errorReport.errorType,
          severity: errorReport.severity,
        },
        user: errorReport.userId ? { id: errorReport.userId } : undefined,
      });
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorReport.message,
        fatal: errorReport.severity === 'critical',
        custom_map: {
          error_type: errorReport.errorType,
          severity: errorReport.severity,
          session_id: errorReport.sessionId,
        }
      });
    }

    // LogRocket
    if (window.LogRocket) {
      window.LogRocket.captureException(new Error(errorReport.message));
    }

    // Bugsnag
    if (window.Bugsnag) {
      window.Bugsnag.notify(new Error(errorReport.message), {
        severity: errorReport.severity,
        context: errorReport.url,
        metaData: {
          errorReport: errorReport.context,
        },
      });
    }
  }
}

// Create and export singleton instance
export const globalErrorHandler = new GlobalErrorHandler({
  enableConsoleLogging: true,
  enableLocalStorage: true,
  enableRemoteReporting: !!import.meta.env.VITE_ERROR_REPORTING_URL,
  maxLocalErrors: 50,
  remoteEndpoint: import.meta.env.VITE_ERROR_REPORTING_URL,
  apiKey: import.meta.env.VITE_ERROR_REPORTING_API_KEY,
});

// Make it available globally for third-party integrations
if (typeof window !== 'undefined') {
  window.globalErrorHandler = globalErrorHandler;
}

export default globalErrorHandler;