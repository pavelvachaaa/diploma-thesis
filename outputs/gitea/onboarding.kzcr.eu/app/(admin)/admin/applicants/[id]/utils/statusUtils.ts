export const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case "submitted":
            return "bg-blue-50 text-blue-700"
        case "under_review":
            return "bg-amber-50 text-amber-700"
        case "interview_scheduled":
        case "interview_completed":
            return "bg-purple-50 text-purple-700"
        case "accepted":
            return "bg-green-50 text-green-700"
        case "rejected":
            return "bg-red-50 text-red-700"
        case "withdrawn":
            return "bg-gray-50 text-gray-700"
        default:
            return "bg-gray-50 text-gray-700"
    }
}

export const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    
    // Handle PostgreSQL timestamp format "2025-08-10 19:42:20.183907 +00:00"
    let date: Date
    try {
        // First try direct parsing
        date = new Date(dateString)
        
        // If that fails, try parsing PostgreSQL format manually
        if (isNaN(date.getTime())) {
            // Convert PostgreSQL format to ISO format that JS can parse
            const isoString = dateString.replace(' ', 'T').replace(' +00:00', 'Z')
            date = new Date(isoString)
        }
        
        if (isNaN(date.getTime())) {
            console.warn('Invalid date format:', dateString)
            return 'Neplatné datum'
        }
    } catch (error) {
        console.warn('Error parsing date:', dateString, error)
        return 'Neplatné datum'
    }
    
    return date.toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getEducationLabel = (education: string) => {
    switch (education) {
        case "high-school":
            return "Střední s maturitou"
        case "vocational":
            return "Vyšší odborné"
        case "bachelor":
            return "Bakalářské"
        case "master":
            return "Magisterské"
        case "doctoral":
            return "Doktorské"
        default:
            return education
    }
}

export const getExperienceLabel = (experience: string) => {
    switch (experience) {
        case "0":
            return "Bez praxe"
        case "1":
            return "Méně než 1 rok"
        case "1-3":
            return "1-3 roky"
        case "3-5":
            return "3-5 let"
        case "5-10":
            return "5-10 let"
        case "10+":
            return "Více než 10 let"
        default:
            return experience
    }
}