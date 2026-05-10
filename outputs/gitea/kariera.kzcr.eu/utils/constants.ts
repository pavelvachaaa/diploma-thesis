export const JOB_TYPES = [
    { value: 'Plný úvazek', label: 'Plný úvazek' },
    { value: 'Částečný úvazek', label: 'Částečný úvazek' },
    { value: 'Smlouva', label: 'Smlouva' },
    { value: 'Dočasný', label: 'Dočasný' }
] as const;

export const SPECIALTIES = [
    { value: 'Ošetřovatelství', label: 'Ošetřovatelství' },
    { value: 'Lékařství', label: 'Lékařství' },
    { value: 'Terapie', label: 'Terapie' },
    { value: 'Radiologie', label: 'Radiologie' },
    { value: 'Urgentní medicína', label: 'Urgentní medicína' },
    { value: 'Farmacie', label: 'Farmacie' }
] as const;

export const EXPERIENCE_LEVELS = [
    { value: '0', label: 'Začátečník' },
    { value: '1-3', label: 'Střední úroveň' },
    { value: '5+', label: 'Senior' }
] as const;

export const EDUCATION_LEVELS = [
    { value: 'high-school', label: 'Střední s maturitou' },
    { value: 'vocational', label: 'Vyšší odborné' },
    { value: 'bachelor', label: 'Bakalářské' },
    { value: 'master', label: 'Magisterské' },
    { value: 'doctoral', label: 'Doktorské' }
] as const;

export const EXPERIENCE_OPTIONS = [
    { value: '0', label: 'Bez praxe' },
    { value: '1', label: 'Méně než 1 rok' },
    { value: '1-3', label: '1-3 roky' },
    { value: '3-5', label: '3-5 let' },
    { value: '5-10', label: '5-10 let' },
    { value: '10+', label: 'Více než 10 let' }
] as const;