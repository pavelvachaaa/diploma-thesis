'use client'

import { useEffect, useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, MessageSquare, CheckCircle, FileText, Loader2, Save, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface NotificationType {
    code: string
    label: string
    description: string
    icon: React.ReactNode
}

const notificationTypes: NotificationType[] = [
    {
        code: 'chat.message',
        label: 'Zprávy v chatu',
        description: 'Notifikace při přijetí nových zpráv v chatu',
        icon: <MessageSquare className="h-4 w-4" />
    },
    {
        code: 'onboarding.step.completed',
        label: 'Pokrok v onboardingu',
        description: 'Aktualizace o dokončení kroků onboardingu',
        icon: <CheckCircle className="h-4 w-4" />
    },
    {
        code: 'document.uploaded',
        label: 'Aktualizace dokumentů',
        description: 'Notifikace o nahraných a změněných dokumentech',
        icon: <FileText className="h-4 w-4" />
    },
    {
        code: 'document.approved',
        label: 'Schválení dokumentu',
        description: 'Notifikace při schválení nahraného dokumentu',
        icon: <CheckCircle className="h-4 w-4" />
    },
    {
        code: 'document.rejected',
        label: 'Zamítnutí dokumentu',
        description: 'Notifikace při zamítnutí nahraného dokumentu',
        icon: <XCircle className="h-4 w-4" />
    }
]

export default function EmployeeNotificationSettingsPage() {
    const {
        preferences,
        preferencesLoading,
        loadPreferences,
        updateNotificationPreferences,
        loadTypePreferences,
        updateNotificationTypePreferences
    } = useNotifications()

    const [typePreferences, setTypePreferences] = useState<Record<string, {
        inAppEnabled: boolean | null
        emailEnabled: boolean | null
    }>>({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Load preferences on mount
    useEffect(() => {
        loadPreferences()
        
        // Load type-specific preferences
        const loadTypePrefs = async () => {
            setLoading(true)
            try {
                const prefs: Record<string, any> = {}
                for (const type of notificationTypes) {
                    try {
                        const typePrefs = await loadTypePreferences(type.code)
                        prefs[type.code] = {
                            inAppEnabled: typePrefs.inAppEnabled,
                            emailEnabled: typePrefs.emailEnabled
                        }
                    } catch (error) {
                        // If type preferences don't exist, use defaults
                        prefs[type.code] = {
                            inAppEnabled: null, // inherit from global
                            emailEnabled: null  // inherit from global
                        }
                    }
                }
                setTypePreferences(prefs)
            } catch (error) {
                console.error('Failed to load type preferences:', error)
            } finally {
                setLoading(false)
            }
        }
        
        loadTypePrefs()
    }, [loadPreferences])

    const handleGlobalPreferenceChange = async (key: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
        if (!preferences) return

        try {
            setSaving(true)
            await updateNotificationPreferences({
                ...preferences,
                [key]: value
            })
            
            toast.success('Nastavení notifikací bylo úspěšně aktualizováno.')
        } catch (error) {
            toast.error('Chyba při ukládání nastavení notifikací.')
        } finally {
            setSaving(false)
        }
    }

    const handleTypePreferenceChange = (
        typeCode: string,
        channel: 'inAppEnabled' | 'emailEnabled',
        value: boolean | null
    ) => {
        setTypePreferences(prev => ({
            ...prev,
            [typeCode]: {
                ...prev[typeCode],
                [channel]: value
            }
        }))
    }

    const getEffectivePreference = (typeCode: string, channel: 'inAppEnabled' | 'emailEnabled'): boolean => {
        const typePref = typePreferences[typeCode]?.[channel]
        if (typePref !== null && typePref !== undefined) {
            return typePref
        }
        
        // Fall back to global preference
        if (channel === 'inAppEnabled') {
            return preferences?.inAppEnabled ?? true
        } else {
            return preferences?.emailEnabled ?? false
        }
    }

    const handleSaveTypePreferences = async () => {
        setSaving(true)
        try {
            // Save all modified type preferences
            const promises = Object.entries(typePreferences).map(async ([typeCode, prefs]) => {
                if (prefs.inAppEnabled !== null || prefs.emailEnabled !== null) {
                    return await updateNotificationTypePreferences(typeCode, prefs)
                }
            })
            
            await Promise.all(promises)
            toast.success('Specifická nastavení notifikací byla úspěšně uložena.')
        } catch (error) {
            console.error('Failed to save type preferences:', error)
            toast.error('Chyba při ukládání specifických nastavení notifikací.')
        } finally {
            setSaving(false)
        }
    }

    if (preferencesLoading || loading) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <p className="text-gray-500">Načítám nastavení notifikací...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Nastavení notifikací
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Spravujte způsob a čas příjmu notifikací
                    </p>
                </div>

                {/* Global Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Bell className="h-5 w-5" />
                            <span>Globální nastavení</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <Bell className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">Notifikace v aplikaci</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Zobrazovat notifikace v aplikaci
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.inAppEnabled ?? true}
                                onCheckedChange={(checked) => handleGlobalPreferenceChange('inAppEnabled', checked)}
                                disabled={saving}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">Emailové notifikace</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Posílat notifikace na emailovou adresu
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.emailEnabled ?? false}
                                onCheckedChange={(checked) => handleGlobalPreferenceChange('emailEnabled', checked)}
                                disabled={saving}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Type-specific Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle>Typy notifikací</CardTitle>
                        <p className="text-sm text-gray-600">
                            Přizpůsobte nastavení pro konkrétní typy notifikací. Ponechte beze změny pro použití globálního nastavení.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {notificationTypes.map((type, index) => (
                                <div key={type.code}>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-1">
                                            {type.icon}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{type.label}</h4>
                                                <p className="text-sm text-gray-600">{type.description}</p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-6">
                                                <div className="flex items-center space-x-3">
                                                    <Bell className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">V aplikaci</span>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={getEffectivePreference(type.code, 'inAppEnabled')}
                                                            onCheckedChange={(checked) => 
                                                                handleTypePreferenceChange(type.code, 'inAppEnabled', checked)
                                                            }
                                                            disabled={saving}
                                                        />
                                                        {typePreferences[type.code]?.inAppEnabled !== null && (
                                                            <span className="text-xs text-blue-600">Vlastní</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-3">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">Email</span>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={getEffectivePreference(type.code, 'emailEnabled')}
                                                            onCheckedChange={(checked) => 
                                                                handleTypePreferenceChange(type.code, 'emailEnabled', checked)
                                                            }
                                                            disabled={saving}
                                                        />
                                                        {typePreferences[type.code]?.emailEnabled !== null && (
                                                            <span className="text-xs text-blue-600">Vlastní</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {index < notificationTypes.length - 1 && (
                                        <Separator className="mt-6" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end space-x-3">
                    <Button 
                        variant="outline"
                        onClick={() => {
                            // Reset to defaults (inherit from global)
                            const resetPrefs: Record<string, any> = {}
                            for (const type of notificationTypes) {
                                resetPrefs[type.code] = {
                                    inAppEnabled: null,
                                    emailEnabled: null
                                }
                            }
                            setTypePreferences(resetPrefs)
                            toast.success('Nastavení bylo obnoveno na výchozí hodnoty.')
                        }}
                        disabled={saving}
                    >
                        Obnovit výchozí
                    </Button>
                    <Button 
                        onClick={handleSaveTypePreferences}
                        disabled={saving} 
                        className="flex items-center space-x-2"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>Uložit změny</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}