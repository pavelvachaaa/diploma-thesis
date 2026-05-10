export function formatSalary(salary: string): string {
    // Add any salary formatting logic here
    return salary;
}

export function formatDate(date: string): string {
    // Add date formatting logic here
    return date;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}