import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";
import { JobApplication as JobApplicationType, Job } from "@/types/job";
import { ApiError, api, generateIdempotencyKey } from "@/lib/api";
import { getContractLabels } from "@/lib/utils";
import Link from "next/link";
import { trackUmamiEvent } from "@/lib/analytics/umami";

interface JobApplicationProps {
    jobId: string;
    job?: Job;
    onSubmit?: (application: JobApplicationType) => void;
}

type ValidationError = {
    field_name: string;
    error_type: string;
};

const nativeFieldNameMap: Record<string, string> = {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    field: 'field',
    'cv-upload': 'cv',
};

function getNativeValidationErrorType(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
    if (element.validity.valueMissing) {
        return 'required';
    }

    if (element.id === 'email' && element.validity.typeMismatch) {
        return 'invalid_format';
    }

    return 'invalid';
}

function getSubmitErrorMeta(error: unknown): { errorCategory: string; httpStatus?: number } {
    if (error instanceof ApiError && typeof error.status === 'number') {
        if (error.status >= 400 && error.status < 500) {
            return { errorCategory: 'client', httpStatus: error.status };
        }

        if (error.status >= 500 && error.status < 600) {
            return { errorCategory: 'server', httpStatus: error.status };
        }

        return { errorCategory: 'unknown', httpStatus: error.status };
    }

    if (
        (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')) ||
        (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) ||
        (error instanceof Error && /network|fetch/i.test(error.message))
    ) {
        return { errorCategory: 'network' };
    }

    return { errorCategory: 'unknown' };
}

export function JobApplication({ jobId, job, onSubmit }: JobApplicationProps) {
    const router = useRouter();
    const [application, setApplication] = useState<JobApplicationType>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        education: '',
        field: '',
        experience: '',
        lastEmployer: '',
        lastPosition: '',
        gdprConsent: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submittingRef = useRef(false);
    const hasInteractedRef = useRef(false);
    const hasSubmitStartedRef = useRef(false);
    const hasSubmitSucceededRef = useRef(false);
    const hasAbandonTrackedRef = useRef(false);

    const getJobAnalyticsContext = (responseJob?: { title?: string; organization_name?: string }) => ({
        job_id: jobId,
        job_title: job?.title || responseJob?.title,
        organization_name: job?.organization_name || responseJob?.organization_name,
        department: job?.department || undefined,
    });

    const trackValidationErrors = (validationErrors: ValidationError[]) => {
        validationErrors.forEach(({ field_name, error_type }) => {
            trackUmamiEvent('job_application_form_validation_error', {
                ...getJobAnalyticsContext(),
                field_name,
                error_type,
            });
        });
    };

    const trackFirstInteraction = () => {
        if (hasInteractedRef.current) {
            return;
        }

        hasInteractedRef.current = true;
        trackUmamiEvent('job_application_form_interaction', getJobAnalyticsContext());
    };

    const trackAbandonIfNeeded = () => {
        if (!hasInteractedRef.current || hasSubmitSucceededRef.current || hasAbandonTrackedRef.current) {
            return;
        }

        hasAbandonTrackedRef.current = true;
        trackUmamiEvent('job_application_form_abandon', {
            ...getJobAnalyticsContext(),
            had_submit_start: hasSubmitStartedRef.current,
        });
    };

    const validateApplication = (): ValidationError[] => {
        const validationErrors: ValidationError[] = [];

        if (!application.education) {
            validationErrors.push({ field_name: 'education', error_type: 'required' });
        }

        if (!application.experience) {
            validationErrors.push({ field_name: 'experience', error_type: 'required' });
        }

        if (!application.gdprConsent) {
            validationErrors.push({ field_name: 'gdprConsent', error_type: 'missing_consent' });
        }

        return validationErrors;
    };

    const handleInvalidCapture = (event: React.InvalidEvent<HTMLFormElement>) => {
        const target = event.target;
        trackFirstInteraction();

        if (
            !(target instanceof HTMLInputElement) &&
            !(target instanceof HTMLSelectElement) &&
            !(target instanceof HTMLTextAreaElement)
        ) {
            return;
        }

        const fieldName = nativeFieldNameMap[target.id];

        if (!fieldName) {
            return;
        }

        setError(null);
        trackValidationErrors([
            {
                field_name: fieldName,
                error_type: getNativeValidationErrorType(target),
            },
        ]);
    };

    useEffect(() => {
        const handlePageHide = () => {
            trackAbandonIfNeeded();
        };

        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handlePageHide);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handlePageHide);
            trackAbandonIfNeeded();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submittingRef.current) return;

        const validationErrors = validateApplication();

        if (validationErrors.length > 0) {
            trackValidationErrors(validationErrors);

            const hasConsentError = validationErrors.some(({ field_name }) => field_name === 'gdprConsent');
            setError(
                hasConsentError && validationErrors.length === 1
                    ? 'Potvrďte prosím seznámení s informacemi o zpracování osobních údajů'
                    : 'Vyplňte prosím všechna povinná pole formuláře'
            );
            return;
        }

        try {
            submittingRef.current = true;
            setLoading(true);
            setError(null);

            const formData = new FormData();

            // Add all form fields
            formData.append('firstName', application.firstName);
            formData.append('lastName', application.lastName);
            formData.append('email', application.email);
            formData.append('phone', application.phone);
            formData.append('address', application.address || '');
            formData.append('city', application.city || '');
            formData.append('zip', application.zip || '');
            formData.append('education', application.education);
            formData.append('field', application.field);
            formData.append('experience', application.experience);
            formData.append('lastEmployer', application.lastEmployer || '');
            formData.append('lastPosition', application.lastPosition || '');
            formData.append('gdprConsent', application.gdprConsent.toString());

            // Add files if they exist
            if (application.cv) {
                formData.append('attachments', application.cv);
            }
            if (application.coverLetter) {
                formData.append('attachments', application.coverLetter);
            }

            hasSubmitStartedRef.current = true;
            trackUmamiEvent('job_application_submit_start', getJobAnalyticsContext());

            const response = await api<{ applicant?: { id: string }; job?: { title: string; organization_name: string } }>(`/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Idempotency-Key': generateIdempotencyKey() },
                body: formData,
                // Don't set Content-Type header - let browser set it for FormData
            });

            onSubmit?.(application);
            setError(null);
            hasSubmitSucceededRef.current = true;

            trackUmamiEvent('job_application_submit_success', getJobAnalyticsContext(response?.job));
            
            // Redirect to success page with application details
            const searchParams = new URLSearchParams();
            if (response?.applicant?.id) {
                searchParams.set('applicantId', response.applicant.id);
            }
            if (response?.job?.title) {
                searchParams.set('jobTitle', response.job.title);
            }
            if (response?.job?.organization_name) {
                searchParams.set('organizationName', response.job.organization_name);
            }
            
            router.push(`/jobs/${jobId}/apply/success?${searchParams.toString()}`);
        } catch (err) {
            const { errorCategory, httpStatus } = getSubmitErrorMeta(err);

            trackUmamiEvent('job_application_submit_error', {
                ...getJobAnalyticsContext(),
                error_category: errorCategory,
                http_status: httpStatus,
            });
            setError(err instanceof Error ? err.message : 'Nepodařilo se odeslat přihlášku');
            submittingRef.current = false;
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof JobApplicationType, value: string | boolean) => {
        trackFirstInteraction();
        setApplication(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (field: 'cv' | 'coverLetter', file: File | null) => {
        trackFirstInteraction();
        setApplication(prev => ({ ...prev, [field]: file || undefined }));
    };

    return (
        <form onSubmit={handleSubmit} onInvalidCapture={handleInvalidCapture} className="space-y-8">
            {job && (
                <Card>
                    <CardHeader>
                        <CardTitle>Přihlašujete se na pozici</CardTitle>
                        <CardDescription>Ověřte si, že se přihlašujete na správnou pozici</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Pozice</Label>
                                <p className="font-semibold">{job.title}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Pracoviště</Label>
                                <p className="font-semibold">{job.department}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Organizace</Label>
                                <p className="font-semibold">{job.organization_name}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Typ úvazku</Label>
                                <p className="font-semibold">{getContractLabels(job).join(', ')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Osobní údaje</CardTitle>
                    <CardDescription>Vyplňte prosím své osobní údaje</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Jméno *</Label>
                            <Input
                                id="firstName"
                                required
                                value={application.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Příjmení *</Label>
                            <Input
                                id="lastName"
                                required
                                value={application.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={application.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                required
                                value={application.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Adresa</Label>
                        <Input
                            id="address"
                            value={application.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="city">Město</Label>
                            <Input
                                id="city"
                                value={application.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zip">PSČ</Label>
                            <Input
                                id="zip"
                                value={application.zip}
                                onChange={(e) => handleInputChange('zip', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Vzdělání a praxe</CardTitle>
                    <CardDescription>Informace o vašem vzdělání a pracovních zkušenostech</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="education">Nejvyšší dosažené vzdělání *</Label>
                        <Select value={application.education} onValueChange={(value) => handleInputChange('education', value)}>
                            <SelectTrigger id="education">
                                <SelectValue placeholder="Vyberte vzdělání" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high-school">Střední s maturitou</SelectItem>
                                <SelectItem value="vocational">Vyšší odborné</SelectItem>
                                <SelectItem value="bachelor">Bakalářské</SelectItem>
                                <SelectItem value="master">Magisterské</SelectItem>
                                <SelectItem value="doctoral">Doktorské</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="field">Obor vzdělání *</Label>
                        <Input
                            id="field"
                            required
                            value={application.field}
                            onChange={(e) => handleInputChange('field', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="experience">Délka praxe v oboru *</Label>
                        <Select value={application.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                            <SelectTrigger id="experience">
                                <SelectValue placeholder="Vyberte délku praxe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Bez praxe</SelectItem>
                                <SelectItem value="1">Méně než 1 rok</SelectItem>
                                <SelectItem value="1-3">1-3 roky</SelectItem>
                                <SelectItem value="3-5">3-5 let</SelectItem>
                                <SelectItem value="5-10">5-10 let</SelectItem>
                                <SelectItem value="10+">Více než 10 let</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastEmployer">Poslední zaměstnavatel</Label>
                        <Input
                            id="lastEmployer"
                            value={application.lastEmployer}
                            onChange={(e) => handleInputChange('lastEmployer', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastPosition">Poslední pracovní pozice</Label>
                        <Input
                            id="lastPosition"
                            value={application.lastPosition}
                            onChange={(e) => handleInputChange('lastPosition', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dokumenty</CardTitle>
                    <CardDescription>Nahrajte svůj životopis a další dokumenty</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cv">Životopis {(job?.cv_required !== false) && '*'}</Label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="cv-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Klikněte pro nahrání</span> nebo přetáhněte soubor
                                    </p>
                                    <p className="text-xs text-muted-foreground">PDF, DOC nebo DOCX (max. 5MB)</p>
                                    {application.cv && (
                                        <p className="text-xs text-[var(--primary)] mt-1">{application.cv.name}</p>
                                    )}
                                </div>
                                <Input
                                    id="cv-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    required={job?.cv_required !== false}
                                    onChange={(e) => handleFileChange('cv', e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cover-letter">Motivační dopis</Label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="cover-letter-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Klikněte pro nahrání</span> nebo přetáhněte soubor
                                    </p>
                                    <p className="text-xs text-muted-foreground">PDF, DOC nebo DOCX (max. 5MB)</p>
                                    {application.coverLetter && (
                                        <p className="text-xs text-[var(--primary)] mt-1">{application.coverLetter.name}</p>
                                    )}
                                </div>
                                <Input
                                    id="cover-letter-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleFileChange('coverLetter', e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Informace o zpracování osobních údajů</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="terms"
                            className="mt-1"
                            required
                            checked={application.gdprConsent}
                            onCheckedChange={(checked) => handleInputChange('gdprConsent', checked === true)}
                        />
                        <div>
                            <Label htmlFor="terms" className="text-sm font-normal">
                                Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů uchazečů o zaměstnání. *
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Vaše údaje zpracovává Krajská zdravotní, a.s. za účelem vyřízení reakce na tuto pracovní pozici,
                                komunikace s vámi a ověření splnění předpokladů pro pozici. Právním základem je zejména čl. 6 odst. 1
                                písm. b) GDPR. Údaje uchováváme po dobu výběrového řízení a následně nejdéle 6 měsíců po jeho
                                ukončení pro ochranu právních nároků. <Link href={"/privacy"} className={"text-[var(--primary)] hover:underline"}>Informace o zpracování osobních údajů naleznete zde</Link>
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    {error && (
                        <p className="text-red-600 text-sm mb-4">{error}</p>
                    )}
                    <Button
                        type="submit"
                        className="w-full btn-cta"
                        disabled={loading}
                    >
                        {loading ? 'Odesílání...' : 'Odeslat přihlášku'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
