"use client"

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface FileUploadProps {
    onFilesChange: (files: File[]) => void;
    multiple?: boolean;
    accept?: string;
    maxSize?: number; // in bytes
    className?: string;
}

const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUpload({
    onFilesChange,
    multiple = false,
    accept = "application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif",
    maxSize = 5 * 1024 * 1024, // 5MB
    className
}: FileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    
    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        if (rejectedFiles.length > 0) {
            rejectedFiles.forEach(({ file, errors }) => {
                errors.forEach((error: any) => {
                    if (error.code === 'file-too-large') {
                        toast.error(`Soubor ${file.name} je příliš velký. Max: ${formatFileSize(maxSize)}.`);
                    } else if (error.code === 'file-invalid-type') {
                        toast.error(`Nepodporovaný typ souboru: ${file.name}.`);
                    } else {
                        toast.error(error.message);
                    }
                });
            });
        }

        const newFiles = multiple ? [...selectedFiles, ...acceptedFiles] : [...acceptedFiles];
        setSelectedFiles(newFiles);
        onFilesChange(newFiles);
    }, [multiple, onFilesChange, selectedFiles, maxSize]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple,
        accept: accept ? accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}) : undefined,
        maxSize,
    });
    
    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesChange(newFiles);
    };

    return (
        <div className={className}>
            <div 
                {...getRootProps()}
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors ${isDragActive ? 'border-blue-500' : ''}`}
            >
                <input {...getInputProps()} />
                {selectedFiles.length > 0 ? (
                    <div className="space-y-2">
                         <p className="text-sm font-medium">Vybrané soubory:</p>
                        {selectedFiles.map((file, index) => (
                           <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                               <div className="flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                               </div>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                         <Button variant="outline" size="sm" type="button" className='mt-2'>
                            {multiple ? "Přidat další soubory" : "Změnit soubor"}
                          </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Přetáhněte soubory sem nebo klikněte pro výběr</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {accept ? `Podporované formáty: ${accept.split(',').map(s => s.split('/')[1] || s).join(', ').toUpperCase()}` : ''}
                            {maxSize ? ` (max. ${formatFileSize(maxSize)})` : ''}
                        </p>
                        <Button variant="outline" size="sm" type="button">
                            Vybrat soubor(y)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
