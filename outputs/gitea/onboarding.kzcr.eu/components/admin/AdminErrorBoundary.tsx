'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AdminErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface AdminErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<AdminErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void
  showDetails?: boolean
  isolate?: boolean // If true, only resets this boundary, not the whole page
}

export interface AdminErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo | null
  errorId: string
  onReset: () => void
  onReportError: () => void
  showDetails?: boolean
}

class AdminErrorBoundary extends React.Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: AdminErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    const errorId = `admin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Admin Error Boundary - ${this.state.errorId}`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo, this.state.errorId)

    // Auto-reset after 30 seconds (can be cancelled by manual reset)
    if (!this.props.isolate) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary()
      }, 30000)
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  reportError = () => {
    const { error, errorInfo, errorId } = this.state
    
    // In a real app, this would send to an error reporting service
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    console.info('Error report generated:', errorReport)
    
    // For now, just copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
    
    // Show toast or alert that error was reported
    alert('Chybová zpráva byla zkopírována do schránky. Pošlete ji prosím administrátorovi.')
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback = DefaultAdminErrorFallback } = this.props
      
      return (
        <Fallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.resetErrorBoundary}
          onReportError={this.reportError}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

function DefaultAdminErrorFallback({
  error,
  errorInfo,
  errorId,
  onReset,
  onReportError,
  showDetails = false
}: AdminErrorFallbackProps) {
  const [showDetailsState, setShowDetailsState] = React.useState(showDetails)

  const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network')
  const isAuthError = error.message?.includes('401') || error.message?.includes('403')

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-red-800">
            Něco se pokazilo
          </CardTitle>
          <CardDescription>
            {isNetworkError && 'Nastala chyba při komunikaci se serverem.'}
            {isAuthError && 'Nemáte oprávnění k této akci.'}
            {!isNetworkError && !isAuthError && 'Nastala neočekávaná chyba v aplikaci.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Chyba:</strong> {error.message}
              <br />
              <span className="text-sm text-muted-foreground">ID: {errorId}</span>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onReset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Zkusit znovu
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/dashboard'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Přejít na dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onReportError}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Nahlásit chybu
            </Button>
          </div>

          {/* Details toggle */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailsState(!showDetailsState)}
              className="w-full"
            >
              {showDetailsState ? 'Skrýt detaily' : 'Zobrazit detaily'}
            </Button>
            
            {showDetailsState && (
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-2">Stack trace:</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </div>
                
                {errorInfo?.componentStack && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Component stack:</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error boundaries for different admin sections
export function AdminPageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AdminErrorBoundary
      onError={(error, errorInfo, errorId) => {
        // Log page-level errors
        console.error(`Admin Page Error [${errorId}]:`, error)
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </AdminErrorBoundary>
  )
}

export function AdminComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode
  componentName?: string 
}) {
  return (
    <AdminErrorBoundary
      isolate={true}
      fallback={({ error, onReset }) => (
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {componentName && `Komponenta ${componentName}: `}
                {error.message}
              </span>
              <Button size="sm" variant="outline" onClick={onReset}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Obnovit
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      onError={(error, errorInfo, errorId) => {
        console.warn(`Admin Component Error [${componentName}] [${errorId}]:`, error)
      }}
    >
      {children}
    </AdminErrorBoundary>
  )
}

// Hook for manual error reporting
export function useAdminErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const errorId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    console.error(`Manual Error Report [${errorId}]:`, errorReport)
    
    // In a real app, send to error reporting service
    // For now, just log to console
    
    return errorId
  }, [])

  return { reportError }
}

export default AdminErrorBoundary