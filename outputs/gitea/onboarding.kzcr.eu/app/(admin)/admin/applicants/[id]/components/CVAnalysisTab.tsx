import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Brain,
    RefreshCw,
    GraduationCap,
    Briefcase,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    AlertCircle,
    Clock,
} from "lucide-react"
import { type CVAnalysis } from "@/lib/api/applicants"

interface CVAnalysisTabProps {
    cvAnalysis: CVAnalysis | null
    isLoading: boolean
    onReanalyze: () => void
    isReanalyzing: boolean
}

function isAnalysisComplete(analysis: CVAnalysis | null): boolean {
    return analysis?.status === 'completed' && !!analysis.processed_at
}

function ScoreIndicator({ score }: { score: number | null }) {
    if (score === null || score === undefined) return null

    let colorClass = "bg-red-100 text-red-800 border-red-200"
    if (score >= 70) colorClass = "bg-green-100 text-green-800 border-green-200"
    else if (score >= 40) colorClass = "bg-amber-100 text-amber-800 border-amber-200"

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}>
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-sm">/100</span>
        </div>
    )
}

export default function CVAnalysisTab({
    cvAnalysis,
    isLoading,
    onReanalyze,
    isReanalyzing,
}: CVAnalysisTabProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Nacitani analyzy...</span>
            </div>
        )
    }

    if (!cvAnalysis) {
        return (
            <div className="text-center py-12">
                <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                    Pro tohoto uchazeče zatim neni k dispozici AI analyza.
                </p>
                <Button onClick={onReanalyze} disabled={isReanalyzing} variant="outline">
                    {isReanalyzing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzuji...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Analyzovat
                        </>
                    )}
                </Button>
            </div>
        )
    }

    // Handle pending/processing states
    if (cvAnalysis.status === 'pending' || cvAnalysis.status === 'processing') {
        return (
            <div className="text-center py-12">
                <div className="relative mx-auto mb-4 w-16 h-16">
                    <Clock className="h-16 w-16 text-blue-500 animate-pulse" />
                </div>
                <h3 className="font-medium text-lg mb-2">
                    {cvAnalysis.status === 'pending' ? 'Čekám na zpracování' : 'Analyzuji životopis'}
                </h3>
                <p className="text-muted-foreground mb-4">
                    {cvAnalysis.status === 'pending'
                        ? 'CV bylo přidáno do fronty a brzy bude analyzováno.'
                        : 'AI právě analyzuje životopis uchazeče. Toto může trvat několik sekund.'}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Stránka se automaticky aktualizuje</span>
                </div>
                {cvAnalysis.created_at && (
                    <p className="text-xs text-muted-foreground mt-4">
                        Vytvořeno: {new Date(cvAnalysis.created_at).toLocaleString('cs-CZ')}
                    </p>
                )}
            </div>
        )
    }

    // Handle failed state
    if (cvAnalysis.status === 'failed') {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <h3 className="font-medium text-lg mb-2">Analýza selhala</h3>
                <p className="text-muted-foreground mb-4">
                    {cvAnalysis.error_message || 'Při analýze životopisu došlo k chybě.'}
                </p>
                <Button onClick={onReanalyze} disabled={isReanalyzing} variant="outline">
                    {isReanalyzing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzuji...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Zkusit znovu
                        </>
                    )}
                </Button>
            </div>
        )
    }

    // If we have analysis but it's not complete (shouldn't happen normally)
    if (!isAnalysisComplete(cvAnalysis)) {
        return (
            <div className="text-center py-12">
                <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                    Analýza není kompletní. Zkuste ji spustit znovu.
                </p>
                <Button onClick={onReanalyze} disabled={isReanalyzing} variant="outline">
                    {isReanalyzing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzuji...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Analyzovat
                        </>
                    )}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with score and reanalyze button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="font-medium text-lg">Hodnoceni</h3>
                    <ScoreIndicator score={cvAnalysis.evaluation_score ?? null} />
                </div>
                <Button onClick={onReanalyze} disabled={isReanalyzing} variant="outline" size="sm">
                    {isReanalyzing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzuji...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Analyzovat znovu
                        </>
                    )}
                </Button>
            </div>

            {/* Summary */}
            {cvAnalysis.summary && (
                <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-2">Shrnutí</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cvAnalysis.summary}</p>
                </div>
            )}

            {/* Verbal Evaluation */}
            {cvAnalysis.verbal_evaluation && (
                <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-2">Slovní hodnocení</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cvAnalysis.verbal_evaluation}</p>
                </div>
            )}

            {/* Evaluation Reasoning */}
            {cvAnalysis.evaluation_reasoning && (
                <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-2">Odůvodnění hodnocení</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cvAnalysis.evaluation_reasoning}</p>
                </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cvAnalysis.evaluation_strengths && cvAnalysis.evaluation_strengths.length > 0 && (
                    <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            Silné stranky
                        </h4>
                        <ul className="space-y-1">
                            {cvAnalysis.evaluation_strengths.map((s, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-green-500 mt-1">+</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {cvAnalysis.evaluation_weaknesses && cvAnalysis.evaluation_weaknesses.length > 0 && (
                    <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                            Slabé stranky
                        </h4>
                        <ul className="space-y-1">
                            {cvAnalysis.evaluation_weaknesses.map((w, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-red-500 mt-1">-</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Skills, Languages, Certifications */}
            <div className="space-y-4">
                {cvAnalysis.skills && cvAnalysis.skills.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">Dovednosti</h4>
                        <div className="flex flex-wrap gap-2">
                            {cvAnalysis.skills.map((skill, i) => (
                                <Badge key={i} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {cvAnalysis.languages && cvAnalysis.languages.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">Jazyky</h4>
                        <div className="flex flex-wrap gap-2">
                            {cvAnalysis.languages.map((lang, i) => (
                                <Badge key={i} variant="outline">{lang}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {cvAnalysis.certifications && cvAnalysis.certifications.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">Certifikace</h4>
                        <div className="flex flex-wrap gap-2">
                            {cvAnalysis.certifications.map((cert, i) => (
                                <Badge key={i} variant="outline">{cert}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Education */}
            {cvAnalysis.education && cvAnalysis.education.length > 0 && (
                <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Vzdelani
                    </h4>
                    <div className="space-y-3">
                        {cvAnalysis.education.map((edu, i) => (
                            <div key={i} className="text-sm">
                                <p className="font-medium">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</p>
                                <p className="text-muted-foreground">{edu.institution}{edu.year ? ` (${edu.year})` : ''}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {cvAnalysis.experience && cvAnalysis.experience.length > 0 && (
                <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Zkusenosti
                    </h4>
                    <div className="space-y-3">
                        {cvAnalysis.experience.map((exp, i) => (
                            <div key={i} className="text-sm">
                                <p className="font-medium">{exp.position}</p>
                                <p className="text-muted-foreground">{exp.company}{exp.duration ? ` (${exp.duration})` : ''}</p>
                                {exp.description && (
                                    <p className="text-muted-foreground mt-1">{exp.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Processing metadata */}
            {cvAnalysis.processed_at && (
                <div className="text-xs text-muted-foreground border-t pt-3">
                    Model: {cvAnalysis.model_used || 'N/A'} | Zpracovano: {new Date(cvAnalysis.processed_at).toLocaleString('cs-CZ')} | Doba zpracovani: {((cvAnalysis.processing_time_ms || 0) / 1000).toFixed(1)}s
                </div>
            )}
        </div>
    )
}
