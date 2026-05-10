"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jsonRequest } from "@/lib/api";
import { trackUmamiEvent } from "@/lib/analytics/umami";

export default function ContactInquiryPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    gdprConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const submittingRef = useRef(false);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    if (!formData.name.trim()) {
      setError("Vyplňte prosím jméno a příjmení");
      return;
    }

    if (!formData.email.trim()) {
      setError("Vyplňte prosím email");
      return;
    }

    if (!formData.message.trim()) {
      setError("Vyplňte prosím zprávu");
      return;
    }

    if (!formData.gdprConsent) {
      setError("Potvrďte prosím seznámení s informacemi o zpracování osobních údajů");
      return;
    }

    try {
      submittingRef.current = true;
      setLoading(true);
      setError(null);

      await jsonRequest("/contact-inquiries", "POST", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        message: formData.message.trim(),
        gdprConsent: formData.gdprConsent,
      });

      trackUmamiEvent("contact_inquiry_submit_success", {
        has_phone: Boolean(formData.phone.trim()),
      });

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        gdprConsent: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat formulář");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/30">
      <section className="border-b bg-gradient-to-r from-[var(--color-info-bg)] to-blue-50 py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-6 text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Kontaktujte nás
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Máte obecný dotaz k práci v Krajské zdravotní, náboru nebo spolupráci?
            <br className="hidden sm:inline" />&nbsp;
             Napište nám a personální tým se vám ozve.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-xl border border-blue-100 bg-[var(--color-info-bg)] p-5 text-sm text-blue-900 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4" /> Kdy použít tento formulář
              </h4>
              <p className="leading-relaxed text-blue-800/80">
                Tento formulář je určený pro obecné dotazy. Pokud chcete poslat životopis do databáze zájemců,
                použijte prosím odkaz{" "}
                <Link href="/contacts" className="font-semibold underline underline-offset-4">
                  Chci práci
                </Link>
                .
              </p>
            </div>

          </div>

          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit}>
              <Card className="overflow-hidden border-slate-200 shadow-lg">
                <CardHeader className="border-b border-slate-100 bg-white pb-8">
                  <CardTitle className="text-2xl">Napište nám zprávu</CardTitle>
                  <CardDescription className="text-base"> Odpovíme vám na vámi uvedený email. Telefonní kontakt není nutný, ale pomůže nám v rychlejší odpovědi.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8 bg-white p-6 md:p-8">
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">1</span>
                      Kontaktní údaje
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Jméno a příjmení *</Label>
                        <Input
                          id="name"
                          required
                          placeholder="Jan Novák"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="jan.novak@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+420 777 123 456"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">2</span>
                      Zpráva
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="message">Jak vám můžeme pomoci? *</Label>
                      <textarea
                        id="message"
                        required
                        className="flex min-h-[180px] w-full resize-y rounded-md border border-input bg-slate-50/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Napište svůj dotaz, prosbu nebo informaci, kterou s námi potřebujete řešit..."
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="gdprConsent"
                        className="mt-1 data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                        required
                        checked={formData.gdprConsent}
                        onCheckedChange={(checked) => handleInputChange("gdprConsent", checked === true)}
                      />
                      <div>
                        <Label htmlFor="gdprConsent" className="cursor-pointer text-sm font-medium">
                          Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů. *
                        </Label>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Vaše údaje zpracuje Krajská zdravotní, a.s. za účelem vyřízení vašeho dotazu a navazující komunikace.
                          Více informací najdete v{" "}
                          <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                            dokumentu o zpracování osobních údajů
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-stretch border-t bg-slate-50/50 p-6 md:p-8">
                  {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div data-testid="inquiry-success" className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <p className="text-sm text-green-800">
                        Děkujeme, váš dotaz byl úspěšně odeslán. Ozveme se vám na uvedený email co nejdříve.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" size="lg" className="btn-cta min-w-[220px] w-full md:w-auto" disabled={loading}>
                      {loading ? (
                        "Odesílání..."
                      ) : (
                        <span className="flex items-center">
                          Odeslat dotaz <Send className="ml-2 h-4 w-4" />
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
