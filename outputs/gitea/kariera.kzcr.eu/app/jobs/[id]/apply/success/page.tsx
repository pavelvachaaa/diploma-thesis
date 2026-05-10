"use client"
import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJob } from '@/hooks/useJobs';

interface ApplicationSuccessPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ApplicationSuccessPage({ params, searchParams }: ApplicationSuccessPageProps) {
  const { id: jobId } = use(params);
  const { applicantId, jobTitle, organizationName } = use(searchParams);
  const { job, loading } = useJob(jobId);

  const currentJob = job;
  const displayJobTitle = jobTitle || currentJob?.title || 'Pozice';
  const displayOrganization = organizationName || currentJob?.organization_name || 'Organizace';

  return (
    <main className="flex-1">
      <div className="py-8 px-4 md:px-6 mx-auto w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-green-600">
            Přihláška byla úspěšně odeslána!
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Děkujeme za váš zájem o pozici <strong>{displayJobTitle}</strong> v organizaci <strong>{displayOrganization}</strong>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--primary)]" />
                Co bude následovat?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Potvrzení přijetí přihlášky</p>
                    <p className="text-sm text-muted-foreground">
                      Obdržíte potvrzovací e-mail do 24 hodin
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Posouzení přihlášky</p>
                    <p className="text-sm text-muted-foreground">
                      HR oddělení posoudí vaši přihlášku do 5 pracovních dnů
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Kontakt v případě výběru</p>
                    <p className="text-sm text-muted-foreground">
                      Pokud budete vybráni, kontaktujeme vás co nejdříve
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Onboarding proces</p>
                    <p className="text-sm text-muted-foreground">
                      Vybraní kandidáti obdrží přístupové údaje k onboardingovému procesu
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Souhrn přihlášky</CardTitle>
              <CardDescription>Přehled vaší odeslané přihlášky</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pozice:</span>
                  <span className="font-medium text-right">{displayJobTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organizace:</span>
                  <span className="font-medium text-right">{displayOrganization}</span>
                </div>
                {currentJob?.department && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pracoviště:</span>
                    <span className="font-medium text-right">{currentJob.department}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datum podání:</span>
                  <span className="font-medium text-right">
                    {new Date().toLocaleDateString('cs-CZ')}
                  </span>
                </div>
                {applicantId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID přihlášky:</span>
                    <span className="font-medium text-right text-xs">{applicantId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Link href="/jobs">
            <Button variant="outline">
              Procházet další pozice
            </Button>
          </Link>
          <Link href="/">
            <Button className="btn-cta">
              Zpět na hlavní stránku
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}