"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Send, Info, CheckCircle2, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { useOrganizations, useJobRoleNames } from "@/hooks/useFilterData";
import { trackUmamiEvent } from "@/lib/analytics/umami";

export default function ContactsPage() {
    const { organizations, loading: orgLoading } = useOrganizations();
    const { jobRoleNames, loading: positionsLoading } = useJobRoleNames();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        organizationIds: [] as string[],
        preferredPosition: '',
        message: '',
        cv: undefined as File | undefined,
        attachments: [] as File[],
        privacyNoticeAcknowledged: false,
        gdprConsent: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const submittingRef = useRef(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submittingRef.current) return;

        if (!formData.organizationIds.length) {
            setError('Musíte vybrat alespoň jednu lokalitu');
            return;
        }

        if (!formData.preferredPosition.trim()) {
            setError('Musíte vybrat pozici');
            return;
        }

        if (!formData.privacyNoticeAcknowledged) {
            setError('Potvrďte prosím seznámení s informacemi o zpracování osobních údajů');
            return;
        }

        if (!formData.gdprConsent) {
            setError('Pro zařazení do databáze zájemců je potřeba udělit souhlas');
            return;
        }

        if (!formData.cv) {
            setError('Životopis je povinný');
            return;
        }

        try {
            submittingRef.current = true;
            setLoading(true);
            setError(null);

            const data = new FormData();
            data.append('firstName', formData.firstName);
            data.append('lastName', formData.lastName);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('organizationIds', JSON.stringify(formData.organizationIds));
            data.append('preferredPosition', formData.preferredPosition);
            data.append('message', formData.message);
            data.append('gdprConsent', formData.gdprConsent.toString());

            if (formData.cv) {
                data.append('cv', formData.cv);
            }

            for (const attachment of formData.attachments) {
                data.append('attachments', attachment);
            }

            await api('/contacts', {
                method: 'POST',
                body: data,
            });

            submittingRef.current = false;
            trackUmamiEvent('job_seeker_submit_success', {
                preferred_position: formData.preferredPosition,
                organization_count: formData.organizationIds.length
            });
            setSuccess(true);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                organizationIds: [],
                preferredPosition: '',
                message: '',
                cv: undefined,
                attachments: [],
                privacyNoticeAcknowledged: false,
                gdprConsent: false,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se odeslat formulář');
            submittingRef.current = false;
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string | boolean | File | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(false);
    };

    const handleFileChange = (file: File | null) => {
        setFormData(prev => ({ ...prev, cv: file || undefined }));
    };

    const handleAttachmentsChange = (files: FileList | null) => {
        const selectedFiles = files ? Array.from(files) : [];
        if (selectedFiles.length > 4) {
            setError('Můžete nahrát maximálně 4 další přílohy');
            return;
        }
        setFormData(prev => ({ ...prev, attachments: selectedFiles }));
    };

    const handleRemoveAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleOrganizationToggle = (organizationId: string, checked: boolean) => {
        setFormData(prev => {
            const exists = prev.organizationIds.includes(organizationId);
            if (checked && !exists) {
                return { ...prev, organizationIds: [...prev.organizationIds, organizationId] };
            }
            if (!checked && exists) {
                return { ...prev, organizationIds: prev.organizationIds.filter((id) => id !== organizationId) };
            }
            return prev;
        });
    };

    return (
        <div className="w-full min-h-screen bg-slate-50/30">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-20 bg-gradient-to-r from-[var(--color-info-bg)] to-blue-50 border-b">
                <div className="mx-auto max-w-7xl px-4 text-center">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-slate-900">
                        Zařazení do databáze zájemců
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Nenašli jste vhodnou pozici? Zanechte nám vaše údaje, preferované lokality a životopis.
                        <br className="hidden sm:inline" />&nbsp;
                        Rádi se s vámi spojíme, jakmile se objeví vhodná pracovní příležitost.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Sidebar - Contact Info */}
                    <div className="lg:col-span-4 space-y-6">

                        <div className="p-5 bg-[var(--color-info-bg)] rounded-xl border border-blue-100 text-blue-900 text-sm shadow-sm">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Tip pro uchazeče
                            </h4>
                            <p className="leading-relaxed text-blue-800/80">
                                Tento formulář slouží výhradně pro zařazení do databáze zájemců. Pokud máte obecný dotaz, využijte prosím stránku <Link href="/kontaktuj-nas" className="font-semibold underline underline-offset-4">Kontaktujte nás</Link>. Pokud reagujete na konkrétní pozici, použijte tlačítko <strong>&quot;Odpovědět&quot;</strong> v detailu inzerátu.
                            </p>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit}>
                            <Card className="shadow-lg border-slate-200 overflow-hidden">
                                <CardHeader className="bg-white border-b border-slate-100 pb-8">
                                    <CardTitle className="text-2xl">Dejte nám o sobě vědět</CardTitle>
                                    <CardDescription className="text-base">
                                        Vyplňte tento formulář pro zařazení do databáze uchazečů. Kontaktujeme vás, pokud se objeví ta správná pozice.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-6 md:p-8 space-y-8 bg-white">
                                    {/* Personal Info Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs text-slate-600">1</span>
                                            Osobní údaje
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">Jméno *</Label>
                                                <Input
                                                    id="firstName"
                                                    required
                                                    placeholder="Jan"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                    className="bg-slate-50/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Příjmení *</Label>
                                                <Input
                                                    id="lastName"
                                                    required
                                                    placeholder="Novák"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                    className="bg-slate-50/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    placeholder="jan.novak@example.com"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    className="bg-slate-50/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Telefon *</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    required
                                                    placeholder="+420 777 123 456"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    className="bg-slate-50/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    {/* Preference Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs text-slate-600">2</span>
                                            Preference a zpráva
                                        </h3>
                                        <div className="space-y-2">
                                            <Label>Preferované lokality *</Label>
                                            <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-2 max-h-56 overflow-y-auto">
                                                {orgLoading ? (
                                                    <p className="text-sm text-slate-500">Načítání...</p>
                                                ) : organizations.length === 0 ? (
                                                    <p className="text-sm text-slate-500">Žádné lokality nejsou k dispozici</p>
                                                ) : (
                                                    organizations.map((org) => {
                                                        const checked = formData.organizationIds.includes(org.id)
                                                        return (
                                                            <label key={org.id} className="flex items-center gap-3 cursor-pointer rounded-md p-2 hover:bg-slate-100">
                                                                <Checkbox
                                                                    checked={checked}
                                                                    onCheckedChange={(value) => handleOrganizationToggle(org.id, value === true)}
                                                                />
                                                                <span className="text-sm text-slate-800">{org.name}</span>
                                                            </label>
                                                        )
                                                    })
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Vybráno lokalit: {formData.organizationIds.length}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="preferredPosition">Preferovaná pozice *</Label>
                                            <select
                                                id="preferredPosition"
                                                required
                                                value={formData.preferredPosition}
                                                onChange={(e) => handleInputChange('preferredPosition', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-slate-50/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="">Vyberte pozici</option>
                                                {positionsLoading ? (
                                                    <option value="" disabled>Načítání pozic...</option>
                                                ) : (
                                                    jobRoleNames.map((name) => (
                                                        <option key={name} value={name}>
                                                            {name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message">Zpráva</Label>
                                            <textarea
                                                id="message"
                                                className="flex min-h-[120px] w-full rounded-md border border-input bg-slate-50/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                placeholder="Napište nám něco o sobě nebo o pozici, která by vás zajímala..."
                                                value={formData.message}
                                                onChange={(e) => handleInputChange('message', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    {/* CV Upload */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs text-slate-600">3</span>
                                            Přílohy
                                        </h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="cv">Životopis *</Label>
                                            <div className="flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="cv-upload"
                                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${formData.cv
                                                        ? "border-[var(--primary)] bg-[var(--color-info-bg)]/30"
                                                        : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        {formData.cv ? (
                                                            <>
                                                                <CheckCircle2 className="w-8 h-8 mb-2 text-[var(--primary)]" />
                                                                <p className="text-sm font-medium text-[var(--primary)]">{formData.cv.name}</p>
                                                                <p className="text-xs text-[var(--primary)]/80 mt-1">Klikněte pro změnu souboru</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                                <p className="mb-2 text-sm text-slate-600">
                                                                    <span className="font-semibold">Klikněte pro nahrání</span> nebo přetáhněte soubor
                                                                </p>
                                                                <p className="text-xs text-slate-400">PDF, DOC nebo DOCX (max. 5MB)</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Input
                                                        id="cv-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.doc,.docx"
                                                        required
                                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="attachments-upload">Další přílohy (max. 4)</Label>
                                            <div className="flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="attachments-upload"
                                                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors border-slate-300 bg-slate-50 hover:bg-slate-100"
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                                        <Upload className="w-7 h-7 mb-2 text-slate-400" />
                                                        <p className="text-sm text-slate-600">
                                                            Přidejte další přílohy
                                                        </p>
                                                        <p className="text-xs text-slate-400">PDF, DOC, DOCX, JPG, PNG (max. 4)</p>
                                                    </div>
                                                    <Input
                                                        id="attachments-upload"
                                                        type="file"
                                                        className="hidden"
                                                        multiple
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleAttachmentsChange(e.target.files)}
                                                    />
                                                </label>
                                            </div>
                                            {formData.attachments.length > 0 && (
                                                <div className="space-y-2">
                                                    {formData.attachments.map((file, index) => (
                                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                                                            <span className="text-sm text-slate-700 truncate pr-4">{file.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveAttachment(index)}
                                                                className="text-slate-500 hover:text-slate-700"
                                                                aria-label={`Odstranit přílohu ${file.name}`}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* GDPR */}
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="privacyNoticeAcknowledged"
                                                className="mt-1 data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                                                required
                                                checked={formData.privacyNoticeAcknowledged}
                                                onCheckedChange={(checked) => handleInputChange('privacyNoticeAcknowledged', checked === true)}
                                            />
                                            <div>
                                                <Label htmlFor="privacyNoticeAcknowledged" className="text-sm font-medium cursor-pointer">
                                                    Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů uchazečů o zaměstnání. *
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Informace o účelech zpracování, právních základech, příjemcích, době uchování a vašich právech najdete na stránce{" "}
                                                    <Link href={"/privacy"} className={"text-[var(--primary)] hover:underline"}>Ochrana osobních údajů</Link>.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="terms"
                                                className="mt-1 data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                                                required
                                                checked={formData.gdprConsent}
                                                onCheckedChange={(checked) => handleInputChange('gdprConsent', checked === true)}
                                            />
                                            <div>
                                                <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                                                    Souhlasím se zařazením do databáze zájemců o zaměstnání u Krajské zdravotní, a.s. za účelem kontaktování s vhodnou pracovní nabídkou po dobu 12 měsíců. *
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Beru na vědomí, že souhlas mohu kdykoliv odvolat na adrese{" "}
                                                    <Link href="mailto:dpo@kzcr.eu" className="text-[var(--primary)] hover:underline">dpo@kzcr.eu</Link>{" "}
                                                    nebo prostřednictvím kontaktní osoby personálního oddělení.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex flex-col items-stretch bg-slate-50/50 border-t p-6 md:p-8">
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                            <p className="text-red-800 text-sm">{error}</p>
                                        </div>
                                    )}
                                    {success && (
                                        <div data-testid="job-seeker-success" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                            <p className="text-green-800 text-sm">
                                                Děkujeme. Váš profil byl úspěšně zařazen do databáze zájemců. Ozveme se vám, pokud pro vás budeme mít vhodnou příležitost.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full md:w-auto btn-cta min-w-[200px]"
                                            disabled={loading}
                                        >
                                            {loading ? 'Odesílání...' : (
                                                <span className="flex items-center">
                                                    Odeslat profil <Send className="ml-2 h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
