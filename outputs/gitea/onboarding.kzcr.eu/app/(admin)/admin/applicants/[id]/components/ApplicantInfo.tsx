import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    MapPin,
    Briefcase,
    Phone,
    Mail,
} from "lucide-react"
import { type Applicant } from "@/lib/api/applicants"

import { getEducationLabel, getExperienceLabel } from "../utils/statusUtils"

interface ApplicantInfoProps {
    applicant: Applicant
    getStatusDisplayName: (status: string) => string
    getStatusBadgeClass: (status: string) => string
    formatDate: (dateString: string) => string
}

export default function ApplicantInfo({ 
    applicant, 
    getStatusDisplayName, 
    getStatusBadgeClass, 
    formatDate 
}: ApplicantInfoProps) {
    return (
        <Card className="md:col-span-1">
            <CardHeader>
                <CardTitle>Informace o uchazeči</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-3 text-center">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={`/placeholder.svg?height=96&width=96`} alt={`${applicant.name} ${applicant.surname}`} />
                        <AvatarFallback className="text-2xl">
                            {applicant.name[0]}{applicant.surname[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-xl font-semibold">{applicant.name} {applicant.surname}</h3>
                        <Badge variant="outline" className={`mt-1 ${getStatusBadgeClass(applicant.current_status)}`}>
                            {getStatusDisplayName(applicant.current_status)}
                        </Badge>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{applicant.job_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{applicant.organization_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Přihláška: {formatDate(applicant.applied_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${applicant.email}`} className="text-blue-600 hover:underline">
                            {applicant.email}
                        </a>
                    </div>
                    {applicant.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${applicant.phone}`} className="text-blue-600 hover:underline">
                                {applicant.phone}
                            </a>
                        </div>
                    )}
                    {applicant.address && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{applicant.address}, {applicant.city} {applicant.zip}</span>
                        </div>
                    )}
                </div>

                <Separator />

                {applicant.education && (
                    <div>
                        <h4 className="mb-2 font-medium">Vzdělání</h4>
                        <p className="text-sm">{getEducationLabel(applicant.education)}</p>
                    </div>
                )}

                {applicant.experience && (
                    <div>
                        <h4 className="mb-2 font-medium">Zkušenosti</h4>
                        <p className="text-sm">{getExperienceLabel(applicant.experience)}</p>
                    </div>
                )}

                {applicant.field && (
                    <div>
                        <h4 className="mb-2 font-medium">Oblast</h4>
                        <p className="text-sm">{applicant.field}</p>
                    </div>
                )}

                {applicant.last_employer && (
                    <div>
                        <h4 className="mb-2 font-medium">Poslední zaměstnavatel</h4>
                        <p className="text-sm">{applicant.last_employer}</p>
                        {applicant.last_position && (
                            <p className="text-xs text-muted-foreground">Pozice: {applicant.last_position}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}