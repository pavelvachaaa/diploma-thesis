"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { JobCard } from "@/components/jobs/JobCard"
import { JobFilters } from "@/components/jobs/JobFilters"
import { JobSearch } from "@/components/jobs/JobSearch"
import { useJobs } from "@/hooks/useJobs"
import { JobFilters as JobFiltersType } from "@/types/job"
import { getSeatLocationByHospitalSlug, isSeatLocation, normalizeSeatLocation } from "@/lib/hospitalLocations"
import { trackUmamiEvent } from "@/lib/analytics/umami"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isUuid = (value?: string | null): value is string => !!value && UUID_REGEX.test(value)

/**
 * Inicializace ze sessionStorage (pro návrat z detailu inzerátu)
 */
const initializeFilters = (): JobFiltersType => {
    if (typeof window !== "undefined") {
        const savedState = sessionStorage.getItem("jobsPageState")
        if (savedState) {
            try {
                const { filters: savedFilters } = JSON.parse(savedState)
                if (!savedFilters || typeof savedFilters !== "object") return {}
                const savedOrg = isUuid(savedFilters.org) ? savedFilters.org : undefined
                const savedLocation = !isUuid(savedFilters.location) && isSeatLocation(savedFilters.location)
                    ? normalizeSeatLocation(savedFilters.location) || undefined
                    : undefined
                return {
                    ...savedFilters,
                    org: savedOrg,
                    location: savedOrg ? undefined : savedLocation
                }
            } catch {
                return {}
            }
        }
    }
    return {}
}

function JobsPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Stav filtrů
    const [filters, setFilters] = useState<JobFiltersType>(initializeFilters)
    const [savedJobs, setSavedJobs] = useState<string[]>([])

    // Hook pro načítání dat
    const { jobs, loading, error, hasMore, loadMore } = useJobs(filters)

    // Pomocné reference pro scroll a inicializaci
    const hasRestoredScroll = useRef(false)
    const isInitialMount = useRef(true)

    // --- 1. SYNCHRONIZACE: URL -> STATE (Pouze při prvním načtení stránky) ---
    useEffect(() => {
        const classification = searchParams.get("classification")
        const q = searchParams.get("q")
        const orgParam = searchParams.get("org")
        const locationParam = searchParams.get("location")
        const hospitalParam = searchParams.get("hospital")
        const role = searchParams.get("role")
        const contractType = searchParams.get("contractType")

        const orgFromOrgParam = isUuid(orgParam) ? orgParam : undefined
        const orgFromLocationParam = !orgFromOrgParam && isUuid(locationParam) ? locationParam : undefined
        const resolvedOrg = orgFromOrgParam || orgFromLocationParam

        const locationFromLocationParam = !resolvedOrg && isSeatLocation(locationParam)
            ? normalizeSeatLocation(locationParam)
            : null
        const locationFromHospitalParam = !resolvedOrg && !locationFromLocationParam
            ? getSeatLocationByHospitalSlug(hospitalParam)
            : null
        const resolvedLocation = locationFromLocationParam || locationFromHospitalParam || undefined

        if (classification || q || orgParam || locationParam || hospitalParam || role || contractType) {
            setFilters((prev) => ({
                ...prev,
                classification: classification || prev.classification,
                q: q || prev.q,
                role: role || prev.role,
                contractType: contractType || prev.contractType,
                org: resolvedOrg || (resolvedLocation ? undefined : prev.org),
                location: resolvedLocation || (resolvedOrg ? undefined : prev.location),
            }))
        }
        isInitialMount.current = false
    }, []) // Spustí se jen jednou při mountu

    // --- 2. SYNCHRONIZACE: STATE -> URL (Reaguje na každou změnu filtrů) ---
    useEffect(() => {
        if (isInitialMount.current) return

        const params = new URLSearchParams()
        if (filters.classification) params.set("classification", filters.classification)
        if (filters.q) params.set("q", filters.q)
        if (filters.role) params.set("role", filters.role)
        if (filters.contractType) params.set("contractType", filters.contractType)
        if (filters.org) {
            params.set("org", filters.org)
        } else if (filters.location) {
            const normalizedLocation = normalizeSeatLocation(filters.location)
            if (normalizedLocation) {
                params.set("location", normalizedLocation)
            }
        }

        const queryString = params.toString()
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname

        // router.replace aktualizuje URL bez přidání historie a bez skoku nahoru
        router.replace(newUrl, { scroll: false })

        // Uložíme aktuální filtry pro případný návrat
        sessionStorage.setItem("jobsPageState", JSON.stringify({ filters }))
    }, [filters, pathname, router])

    // --- 3. OBNOVA SCROLL POZICE (Jen při prvním načtení dat) ---
    useEffect(() => {
        // Scroll obnovíme jen pokud máme data, nejsme v loading a ještě jsme to neudělali
        if (!loading && jobs.length > 0 && !hasRestoredScroll.current) {
            const savedScroll = sessionStorage.getItem("jobsScrollPosition")
            if (savedScroll) {
                // Malý timeout pro jistotu vykreslení všech karet
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScroll))
                    hasRestoredScroll.current = true
                }, 150)
            } else {
                hasRestoredScroll.current = true
            }
        }
    }, [loading, jobs.length])

    // --- 4. UKLÁDÁNÍ SCROLL POZICE (Průběžně při skrolování) ---
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                sessionStorage.setItem("jobsScrollPosition", window.scrollY.toString())
            }
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // --- HANDLERY ---
    const handleFiltersChange = (newFilters: JobFiltersType) => {
        if (newFilters.org) {
            setFilters({
                ...newFilters,
                location: undefined
            })
            return
        }

        if (newFilters.location) {
            setFilters({
                ...newFilters,
                org: undefined
            })
            return
        }

        setFilters(newFilters)
    }

    const handleClearFilters = () => {
        trackUmamiEvent("job_filters_clear", {
            had_query: !!filters.q,
            had_classification: !!filters.classification,
            had_location: !!(filters.location || filters.org),
            had_role: !!filters.role,
            had_contract_type: !!filters.contractType
        })
        setFilters({})
    }

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, q: search || undefined }))
    }

    const handleSaveJob = (jobId: string) => {
        const newSaved = savedJobs.includes(jobId)
            ? savedJobs.filter((id) => id !== jobId)
            : [...savedJobs, jobId]
        setSavedJobs(newSaved)
        localStorage.setItem("savedJobs", JSON.stringify(newSaved))
    }

    return (
        <main className="flex-1 bg-gray-50">
            <div className="py-8 px-4 md:px-6 mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

                    {/* Sidebar s filtry */}
                    <JobFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClearFilters={handleClearFilters}
                    />

                    {/* Hlavní obsah */}
                    <div className="space-y-6">
                        <JobSearch
                            onSearch={handleSearch}
                            initialSearch={filters.q || ""}
                            analyticsContext={{
                                classification: filters.classification,
                                location: filters.location || filters.org,
                                role: filters.role,
                                contractType: filters.contractType
                            }}
                        />

                        <div>
                            <h1 className="text-2xl font-bold">Volné pozice</h1>
                            <p className="text-gray-500">Zobrazeno {jobs.length} pozic</p>
                        </div>

                        <div className="space-y-4">
                            {error && !loading ? (
                                <div role="alert" className="text-center py-12 bg-white rounded-xl border border-red-200">
                                    <p className="font-medium text-red-700">Nepodařilo se načíst nabídky</p>
                                    <p className="mt-2 text-sm text-gray-500">{error}</p>
                                </div>
                            ) : jobs.length === 0 && !loading ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                                    <p className="text-gray-500">Žádné pozice neodpovídají vašim kritériím.</p>
                                    <Button onClick={handleClearFilters} variant="link" className="text-[var(--color-purple)] cursor-pointer">
                                        Zrušit všechny filtry
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {jobs.map((job) => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            onSave={handleSaveJob}
                                            saved={savedJobs.includes(job.id)}
                                            showOrganization={!filters.org && !filters.location}
                                        />
                                    ))}

                                    {/* Indikátor načítání / Tlačítko Načíst více */}
                                    {hasMore && (
                                        <div className="text-center py-6">
                                            <Button
                                                onClick={loadMore}
                                                disabled={loading}
                                                variant="outline"
                                                className="min-w-[200px]"
                                            >
                                                {loading ? "Načítání..." : "Načíst více pozic"}
                                            </Button>
                                        </div>
                                    )}

                                    {!hasMore && jobs.length > 0 && (
                                        <p className="text-center text-gray-400 text-sm py-6">
                                            To je vše, další pozice už tu nejsou.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

/**
 * Hlavní export stránky s nezbytným Suspense boundary
 */
export default function JobsPage() {
    return (
        <Suspense
            fallback={
                <div className="w-full h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
                </div>
            }
        >
            <JobsPageContent />
        </Suspense>
    )
}
