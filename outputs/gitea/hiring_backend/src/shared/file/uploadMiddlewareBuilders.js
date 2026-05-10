const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { normalizePotentialMojibake } = require('@shared/text/filenameEncoding');

const resolveContextId = (req) => req.params.id || req.params.documentId || req.params.applicantId || 'default';

module.exports = ({
    logger,
    storageService,
    getUploadConfig,
    getBucketForContext,
    getExtensionFromMimeType
}) => {
    const generateObjectKey = (context, prefix, originalName, contextId) => {
        const uuid = crypto.randomUUID();
        const timestamp = Date.now();
        const extension = path.extname(originalName);
        return `${context}/${prefix}-${contextId}-${uuid}-${timestamp}${extension}`;
    };

    const createUploadConfig = (context, customOptions = {}) => {
        const config = getUploadConfig(context);

        const fileFilter = (_req, file, cb) => {
            if (config.allowedTypes.includes(file.mimetype)) {
                cb(null, true);
                return;
            }

            const allowedExtensions = config.allowedTypes
                .map((type) => getExtensionFromMimeType(type))
                .filter(Boolean)
                .join(', ');
            cb(new Error(`Nepodporovaný typ souboru. Povolené formáty: ${allowedExtensions}`), false);
        };

        return multer({
            storage: multer.memoryStorage(),
            fileFilter,
            defParamCharset: 'utf8',
            limits: {
                fileSize: customOptions.maxSize || config.maxSize
            }
        });
    };

    const uploadToStorage = async (file, context, contextId) => {
        const config = getUploadConfig(context);
        const bucket = getBucketForContext(context);
        const key = generateObjectKey(context, config.prefix, file.originalname, contextId);

        await storageService.upload(bucket, key, file.buffer, {
            contentType: file.mimetype,
            contentLength: file.size,
            cacheControl: config.cacheControl || null,
            custom: {
                context
            }
        });

        return { bucket, key };
    };

    const processUploadedFiles = async (files, context, contextId) => {
        const processed = [];

        for (const file of files) {
            file.originalname = normalizePotentialMojibake(file.originalname);
            file.checksum_sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
            const { bucket, key } = await uploadToStorage(file, context, contextId);
            file.bucket = bucket;
            file.key = key;
            file.uploadContext = context;
            file.uploadConfig = getUploadConfig(context);
            file.buffer = null;
            processed.push(file);
        }

        return processed;
    };

    const handleSingleOrMultipleMulterError = (res, err, context, maxCount = null) => {
        if (!(err instanceof multer.MulterError)) {
            return res.status(400).json({ error: err.message });
        }

        if (err.code === 'LIMIT_FILE_SIZE') {
            const config = getUploadConfig(context);
            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
            return res.status(400).json({
                error: maxCount
                    ? `Jeden nebo více souborů je příliš velkých. Maximální velikost: ${maxSizeMB}MB`
                    : `Soubor je příliš velký. Maximální velikost: ${maxSizeMB}MB`
            });
        }

        if (err.code === 'LIMIT_FILE_COUNT' && maxCount) {
            return res.status(400).json({
                error: `Příliš mnoho souborů. Maximální počet: ${maxCount}`
            });
        }

        return res.status(400).json({ error: err.message });
    };

    const createUploadMiddleware = (context, fieldName = 'file', options = {}) => {
        return (req, res, next) => {
            const contextId = resolveContextId(req);
            const upload = createUploadConfig(context, options);
            const uploadSingle = upload.single(fieldName);

            uploadSingle(req, res, async (err) => {
                if (err) {
                    return handleSingleOrMultipleMulterError(res, err, context);
                }

                if (req.file) {
                    try {
                        const [processedFile] = await processUploadedFiles([req.file], context, contextId);
                        req.file = processedFile;

                        logger.info(`File uploaded: ${req.file.originalname}`, {
                            context,
                            bucket: req.file.bucket,
                            key: req.file.key,
                            originalName: req.file.originalname,
                            size: req.file.size,
                            mimetype: req.file.mimetype,
                            userId: req.user?.id
                        });
                    } catch (uploadErr) {
                        logger.error('Failed to upload file to storage', {
                            error: uploadErr.message,
                            context,
                            originalName: req.file.originalname,
                            userId: req.user?.id
                        });
                        return res.status(500).json({ error: 'Nepodařilo se uložit soubor' });
                    }
                }

                next();
            });
        };
    };

    const createMultipleUploadMiddleware = (context, fieldName = 'files', maxCount = 5, options = {}) => {
        return (req, res, next) => {
            const contextId = resolveContextId(req);
            const upload = createUploadConfig(context, options);
            const uploadMultiple = upload.array(fieldName, maxCount);

            uploadMultiple(req, res, async (err) => {
                if (err) {
                    return handleSingleOrMultipleMulterError(res, err, context, maxCount);
                }

                if (req.files && req.files.length > 0) {
                    try {
                        req.files = await processUploadedFiles(req.files, context, contextId);

                        logger.info(`Multiple files uploaded: ${req.files.length} files`, {
                            context,
                            fileCount: req.files.length,
                            files: req.files.map((file) => ({
                                originalName: file.originalname,
                                key: file.key,
                                size: file.size
                            })),
                            userId: req.user?.id
                        });
                    } catch (uploadErr) {
                        logger.error('Failed to upload files to storage', {
                            error: uploadErr.message,
                            context,
                            userId: req.user?.id
                        });
                        return res.status(500).json({ error: 'Nepodařilo se uložit soubory' });
                    }
                }

                next();
            });
        };
    };

    const createFieldsUploadMiddleware = (context, fields = [], options = {}) => {
        const normalizedFields = fields
            .filter((field) => field && typeof field.name === 'string')
            .map((field) => ({
                name: field.name,
                maxCount: Number.isInteger(field.maxCount) && field.maxCount > 0 ? field.maxCount : 1
            }));

        if (normalizedFields.length === 0) {
            throw new Error('createFieldsUploadMiddleware requires at least one field definition');
        }

        const fieldDefinitions = Object.fromEntries(normalizedFields.map((field) => [field.name, field]));

        return (req, res, next) => {
            const contextId = resolveContextId(req);
            const config = getUploadConfig(context);
            const fieldAllowedTypes = options.fieldAllowedTypes || {};

            const upload = multer({
                storage: multer.memoryStorage(),
                defParamCharset: 'utf8',
                fileFilter: (_req, file, cb) => {
                    const fieldConfig = fieldDefinitions[file.fieldname];
                    if (!fieldConfig) {
                        return cb(new Error(`Unexpected file field: ${file.fieldname}`), false);
                    }

                    const allowedTypes = Array.isArray(fieldAllowedTypes[file.fieldname]) && fieldAllowedTypes[file.fieldname].length > 0
                        ? fieldAllowedTypes[file.fieldname]
                        : config.allowedTypes;

                    if (allowedTypes.includes(file.mimetype)) {
                        return cb(null, true);
                    }

                    const allowedExtensions = allowedTypes
                        .map((type) => getExtensionFromMimeType(type))
                        .filter(Boolean)
                        .join(', ');
                    return cb(new Error(`Nepodporovaný typ souboru pro pole ${file.fieldname}. Povolené formáty: ${allowedExtensions}`), false);
                },
                limits: {
                    fileSize: options.maxSize || config.maxSize
                }
            });

            const uploadFields = upload.fields(normalizedFields);

            uploadFields(req, res, async (err) => {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
                            return res.status(400).json({
                                error: `Jeden nebo více souborů je příliš velkých. Maximální velikost: ${maxSizeMB}MB`
                            });
                        }
                        if (err.code === 'LIMIT_FILE_COUNT') {
                            return res.status(400).json({
                                error: 'Příliš mnoho souborů v jednom poli'
                            });
                        }
                        return res.status(400).json({ error: err.message });
                    }
                    return res.status(400).json({ error: err.message });
                }

                const filesByField = req.files || {};
                const processedByField = {};

                try {
                    for (const [fieldName, fieldFiles] of Object.entries(filesByField)) {
                        const processed = await processUploadedFiles(fieldFiles, context, contextId);
                        processedByField[fieldName] = processed;
                    }
                } catch (uploadErr) {
                    logger.error('Failed to upload files to storage', {
                        error: uploadErr.message,
                        context,
                        userId: req.user?.id
                    });
                    return res.status(500).json({ error: 'Nepodařilo se uložit soubory' });
                }

                req.files = processedByField;

                const uploadedFiles = Object.values(processedByField).flat();
                if (uploadedFiles.length > 0) {
                    logger.info(`Field-based files uploaded: ${uploadedFiles.length} files`, {
                        context,
                        fileCount: uploadedFiles.length,
                        fields: Object.keys(processedByField),
                        userId: req.user?.id
                    });
                }

                next();
            });
        };
    };

    return {
        createUploadMiddleware,
        createMultipleUploadMiddleware,
        createFieldsUploadMiddleware
    };
};
