"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react'
import { changePassword } from '@/lib/api/auth'
import { toast } from 'react-hot-toast'

export default function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [errors, setErrors] = useState<string[]>([])

    const validatePassword = (password: string): string[] => {
        const errors: string[] = []
        if (password.length < 8) {
            errors.push('Heslo musí mít alespoň 8 znaků')
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Heslo musí obsahovat alespoň jedno malé písmeno')
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Heslo musí obsahovat alespoň jedno velké písmeno')
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Heslo musí obsahovat alespoň jednu číslici')
        }
        return errors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const validationErrors: string[] = []
        
        // Validate new password
        const passwordErrors = validatePassword(formData.newPassword)
        validationErrors.push(...passwordErrors)
        
        // Check if passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            validationErrors.push('Nová hesla se neshodují')
        }
        
        // Check if current password is provided (for users who have a password)
        if (!formData.currentPassword.trim() && formData.currentPassword !== '') {
            validationErrors.push('Zadejte současné heslo')
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            return
        }

        setLoading(true)
        setErrors([])

        try {
            const result = await changePassword({
                currentPassword: formData.currentPassword || undefined,
                newPassword: formData.newPassword
            })
            
            toast.success(result.message || 'Heslo bylo úspěšně změněno')
            
            // Reset form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error) {
            console.error('Password change error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Nastala neočekávaná chyba'
            setErrors([errorMessage])
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

    return (
        <div className="container mx-auto py-6 max-w-md">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Key className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle>Změnit heslo</CardTitle>
                    <CardDescription>
                        Aktualizujte své heslo pro přístup k systému
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <ul className="list-disc list-inside space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                                Současné heslo
                            </Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showPasswords.current ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        currentPassword: e.target.value
                                    }))}
                                    placeholder="Zadejte současné heslo"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPasswords.current ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                Nechte prázdné, pokud nastavujete heslo poprvé
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">
                                Nové heslo *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPasswords.new ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        newPassword: e.target.value
                                    }))}
                                    required
                                    placeholder="Zadejte nové heslo"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPasswords.new ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Potvrdit nové heslo *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        confirmPassword: e.target.value
                                    }))}
                                    required
                                    placeholder="Potvrďte nové heslo"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPasswords.confirm ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Změna hesla...' : 'Změnit heslo'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Požadavky na heslo:
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Alespoň 8 znaků</li>
                            <li>• Alespoň jedno malé písmeno (a-z)</li>
                            <li>• Alespoň jedno velké písmeno (A-Z)</li>
                            <li>• Alespoň jednu číslici (0-9)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}