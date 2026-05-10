const { normalizePotentialMojibake } = require('@shared/text/filenameEncoding');

const resolveOriginalName = (fileInfo = {}) => {
    const rawName = fileInfo.original_name || fileInfo.original_filename || 'document';
    return normalizePotentialMojibake(rawName);
};

const createAsciiFilenameFallback = (fileName) => {
    const normalizedName = String(fileName || 'document')
        .replace(/[\r\n]+/g, ' ')
        .trim();
    const asciiFallback = normalizedName
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '_')
        .replace(/["\\]/g, '_');

    return asciiFallback || 'document';
};

const encodeContentDispositionFilename = (fileName) => {
    return encodeURIComponent(String(fileName || 'document'))
        .replace(/['()*]/g, (character) => {
            return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
        });
};

const buildContentDispositionHeader = (fileName, disposition = 'attachment') => {
    const asciiFallback = createAsciiFilenameFallback(fileName);
    const encodedUtf8Name = encodeContentDispositionFilename(fileName);
    return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8Name}`;
};

module.exports = {
    resolveOriginalName,
    buildContentDispositionHeader
};
