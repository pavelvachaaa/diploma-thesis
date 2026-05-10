'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Shield, User, Key, Globe, Eye } from 'lucide-react'

interface SettingCategory {
    title: string
    description: string
    href: string
    icon: React.ReactNode
    badge?: string
}

const employeeSettingCategories: SettingCategory[] = [
    {
        title: 'Nastavení notifikací',
        description: 'Spravujte způsob a čas příjmu notifikací',
        href: '/employee/settings/notifications',
        icon: <Bell className="h-6 w-6" />
    },
    {
        title: 'Profil a osobní údaje',
        description: 'Upravte svoje osobní informace a nastavení profilu',
        href: '/employee/settings/profile',
        icon: <User className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Soukromí a zabezpečení',
        description: 'Nastavení soukromí a zabezpečení vašeho účtu',
        href: '/employee/settings/privacy',
        icon: <Shield className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Změna hesla',
        description: 'Aktualizujte svoje přihlašovací heslo',
        href: '/employee/change-password',
        icon: <Key className="h-6 w-6" />
    },
    {
        title: 'Jazykové nastavení',
        description: 'Změna jazyka rozhraní a formátů',
        href: '/employee/settings/language',
        icon: <Globe className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Vzhled',
        description: 'Přizpůsobte si vzhled aplikace podle svých preferencí',
        href: '/employee/settings/appearance',
        icon: <Eye className="h-6 w-6" />,
        badge: 'Brzy'
    }
]

export default function EmployeeSettingsPage() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Nastavení účtu
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Spravujte svoje osobní nastavení a preference
                    </p>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employeeSettingCategories.map((category) => (
                        <Link 
                            key={category.href} 
                            href={category.badge ? '#' : category.href}
                            className={`block ${category.badge ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <Card className={`h-full transition-all duration-200 ${
                                category.badge 
                                    ? 'opacity-60 hover:opacity-70' 
                                    : 'hover:shadow-md hover:scale-[1.02] border-gray-200 hover:border-blue-300'
                            }`}>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg ${
                                                category.badge ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {category.icon}
                                            </div>
                                            <CardTitle className={`text-lg ${
                                                category.badge ? 'text-gray-500' : 'text-gray-900'
                                            }`}>
                                                {category.title}
                                            </CardTitle>
                                        </div>
                                        {category.badge && (
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                                                {category.badge}
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <CardDescription className={
                                        category.badge ? 'text-gray-400' : 'text-gray-600'
                                    }>
                                        {category.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Info Card */}
                <Card className="mt-8 border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">
                                    Váš profil a nastavení
                                </h3>
                                <p className="text-sm text-blue-800 mb-3">
                                    Změny v nastavení se projeví okamžitě. Některé změny mohou vyžadovat opětovné přihlášení.
                                </p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Změny hesla vyžadují opětovné přihlášení</li>
                                    <li>• Nastavení notifikací se aplikují ihned</li>
                                    <li>• V případě problémů kontaktujte HR oddělení</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}