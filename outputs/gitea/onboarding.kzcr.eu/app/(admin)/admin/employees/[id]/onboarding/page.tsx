"use client"

import React, { useState, useEffect, use } from "react"
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Play, FileText, User, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import Link from "next/link"
import { 
  getUserOnboardingProgress,
  UserOnboardingProgress,
  startUserOnboarding,
  getAllWorkflows,
  OnboardingWorkflow
} from "@/lib/api/workflows"
import { getEmployeeById } from "@/lib/api/employees"
import toast from "react-hot-toast"

export default function EmployeeOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [employee, setEmployee] = useState<any>(null)
  const [onboardingProgress, setOnboardingProgress] = useState<UserOnboardingProgress[]>([])
  const [availableWorkflows, setAvailableWorkflows] = useState<OnboardingWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [startFormData, setStartFormData] = useState({
    workflow_id: "",
    start_date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  useEffect(() => {
    fetchEmployeeData()
  }, [id])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [employeeData, progressData] = await Promise.all([
        getEmployeeById(id),
        getUserOnboardingProgress(id)
      ])

      setEmployee(employeeData)
      setOnboardingProgress(progressData)

      // Fetch available workflows for the employee's organization
      if (employeeData.organization_id) {
        const workflowsData = await getAllWorkflows({
          org: employeeData.organization_id,
          template: false,
          limit: 100
        })
        setAvailableWorkflows(workflowsData.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje zaměstnance')
      console.error('Error fetching employee data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    if (!startFormData.workflow_id) {
      toast.error("Vyberte workflow")
      return
    }

    if (!startFormData.start_date) {
      toast.error("Vyberte datum začátku")
      return
    }

    try {
      setIsSubmitting(true)
      
      await startUserOnboarding({
        user_id: id,
        workflow_id: startFormData.workflow_id,
        start_date: startFormData.start_date
      })
      
      toast.success("Onboarding byl úspěšně zahájen")
      setIsStartDialogOpen(false)
      fetchEmployeeData()
    } catch (err) {
      console.error('Failed to start onboarding:', err)
      toast.error("Chyba při zahájení onboardingu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const calculateProgress = (progress: UserOnboardingProgress) => {
    if (progress.status === 'completed') return 100
    if (progress.status === 'not_started') return 0
    
    // Calculate based on time elapsed
    const startDate = new Date(progress.start_date)
    const now = new Date()
    const expectedEnd = progress.expected_completion_date ? new Date(progress.expected_completion_date) : null
    
    if (!expectedEnd) return 50 // Default to 50% if no expected end date
    
    const totalDuration = expectedEnd.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Načítání onboarding údajů...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !employee) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Zaměstnanec nebyl nalezen'}</p>
            <Link href="/admin/employees">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na zaměstnance
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Onboarding: {employee.full_name}
              </h1>
              <p className="text-muted-foreground">
                {employee.email} • {employee.organization_name}
              </p>
            </div>
          </div>
          
          <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Play className="h-4 w-4 mr-2" />
                Zahájit onboarding
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Onboarding Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivní onboardingy</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {onboardingProgress.filter(p => p.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dokončené</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {onboardingProgress.filter(p => p.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zpožděné</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {onboardingProgress.filter(p => p.status === 'overdue').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Progress List */}
        <Card>
          <CardHeader>
            <CardTitle>Historie onboarding procesů</CardTitle>
            <CardDescription>
              Přehled všech onboarding procesů pro tohoto zaměstnance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onboardingProgress.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Žádné onboarding procesy</h3>
                <p className="text-muted-foreground mb-4">
                  Tento zaměstnanec zatím nemá žádné onboarding procesy.
                </p>
                <Button onClick={() => setIsStartDialogOpen(true)} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Zahájit první onboarding
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {onboardingProgress.map((progress) => (
                  <div
                    key={progress.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Workflow className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium">{progress.workflow_name}</h3>
                        <Badge className={getStatusColor(progress.status)}>
                          {getStatusIcon(progress.status)}
                          <span className="ml-1">
                            {progress.status === 'completed' && 'Dokončeno'}
                            {progress.status === 'in_progress' && 'Probíhá'}
                            {progress.status === 'overdue' && 'Zpožděno'}
                            {progress.status === 'not_started' && 'Nezahájeno'}
                          </span>
                        </Badge>
                      </div>
                      
                      {progress.workflow_description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {progress.workflow_description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Zahájeno: {new Date(progress.start_date).toLocaleDateString('cs-CZ')}</span>
                        </div>
                        {progress.expected_completion_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Očekáváno: {new Date(progress.expected_completion_date).toLocaleDateString('cs-CZ')}</span>
                          </div>
                        )}
                        {progress.actual_completion_date && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Dokončeno: {new Date(progress.actual_completion_date).toLocaleDateString('cs-CZ')}</span>
                          </div>
                        )}
                      </div>
                      
                      {progress.status !== 'completed' && progress.status !== 'not_started' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Průběh</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(calculateProgress(progress))}%
                            </span>
                          </div>
                          <Progress value={calculateProgress(progress)} className="h-2" />
                        </div>
                      )}
                      
                      {progress.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Poznámky:</strong> {progress.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Onboarding Dialog */}
        <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Zahájit nový onboarding</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workflow">Vyberte workflow *</Label>
                <Select 
                  value={startFormData.workflow_id} 
                  onValueChange={(value) => setStartFormData(prev => ({ ...prev, workflow_id: value }))}
                >
                  <SelectTrigger id="workflow">
                    <SelectValue placeholder="Vyberte workflow pro onboarding" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Datum zahájení *</Label>
                <input
                  type="date"
                  id="startDate"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={startFormData.start_date}
                  onChange={(e) => setStartFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Poznámky (volitelné)</Label>
                <Textarea 
                  id="notes"
                  placeholder="Poznámky k onboardingu"
                  value={startFormData.notes}
                  onChange={(e) => setStartFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsStartDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button 
                onClick={handleStartOnboarding}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Play className="mr-2 h-4 w-4 animate-spin" />
                    Zahajuji...
                  </>
                ) : (
                  'Zahájit onboarding'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
