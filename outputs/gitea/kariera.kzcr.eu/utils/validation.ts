export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => 
        file.type === type || file.name.toLowerCase().endsWith(type.replace('*', ''))
    );
}


