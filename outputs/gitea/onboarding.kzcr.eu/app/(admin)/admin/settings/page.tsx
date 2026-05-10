'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Shield, Users, Database, Mail, Key, Globe, Cog } from 'lucide-react'

interface SettingCategory {
    title: string
    description: string
    href: string
    icon: React.ReactNode
    badge?: string
}

const settingCategories: SettingCategory[] = [
    {
        title: 'Nastavení notifikací',
        description: 'Spravujte způsob a čas příjmu notifikací pro administrátora',
        href: '/admin/settings/notifications',
        icon: <Bell className="h-6 w-6" />
    },
    {
        title: 'Zabezpečení',
        description: 'Nastavení zabezpečení, autentizace a oprávnění',
        href: '/admin/settings/security',
        icon: <Shield className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Správa uživatelů',
        description: 'Globální nastavení pro správu uživatelů a rolí',
        href: '/admin/settings/users',
        icon: <Users className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Databáze a zálohy',
        description: 'Konfigurace databáze a nastavení záloh',
        href: '/admin/settings/database',
        icon: <Database className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Email konfigurace',
        description: 'Nastavení SMTP serveru a emailových šablon',
        href: '/admin/settings/email',
        icon: <Mail className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'API klíče',
        description: 'Správa API klíčů a integrace třetích stran',
        href: '/admin/settings/api',
        icon: <Key className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Systémové nastavení',
        description: 'Obecná konfigurace systému a výkonu',
        href: '/admin/settings/system',
        icon: <Cog className="h-6 w-6" />,
        badge: 'Brzy'
    },
    {
        title: 'Lokalizace',
        description: 'Nastavení jazyka, časového pásma a formátů',
        href: '/admin/settings/localization',
        icon: <Globe className="h-6 w-6" />,
        badge: 'Brzy'
    }
]

export default function AdminSettingsPage() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Nastavení administrátora
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Spravujte konfigurace systému, notifikace a další nastavení
                    </p>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settingCategories.map((category) => (
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
                                <Cog className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">
                                    Konfigurace systému
                                </h3>
                                <p className="text-sm text-blue-800 mb-3">
                                    Změny v nastavení mohou ovlivnit celý systém. Ujistěte se, že rozumíte důsledkům před provedením změn.
                                </p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Některá nastavení vyžadují restart aplikace</li>
                                    <li>• Doporučujeme vytvořit zálohu před významými změnami</li>
                                    <li>• Kontaktujte podporu v případě nejasností</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}