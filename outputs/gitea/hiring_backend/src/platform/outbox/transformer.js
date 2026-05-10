const crypto = require('node:crypto');

module.exports = ({ config, storageService }) => {
    let encryptionKeyBuffer = null;

    const getEncryptionKey = () => {
        if (encryptionKeyBuffer) {
            return encryptionKeyBuffer;
        }

        const raw = process.env.SIDE_EFFECT_OUTBOX_ENCRYPTION_KEY;
        if (!raw || !raw.trim()) {
            throw new Error('SIDE_EFFECT_OUTBOX_ENCRYPTION_KEY is required when SIDE_EFFECT_OUTBOX_ENABLED=true');
        }

        const value = raw.trim();
        let candidate = null;

        if (/^[0-9a-fA-F]{64}$/.test(value)) {
            candidate = Buffer.from(value, 'hex');
        } else {
            const decoded = Buffer.from(value, 'base64');
            if (decoded.length === 32) {
                candidate = decoded;
            }
        }

        if (!candidate || candidate.length !== 32) {
            throw new Error('SIDE_EFFECT_OUTBOX_ENCRYPTION_KEY must be a 32-byte key in hex (64 chars) or base64');
        }

        encryptionKeyBuffer = candidate;
        return encryptionKeyBuffer;
    };

    const encryptSecret = (plaintext) => {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);

        const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return {
            algorithm: 'aes-256-gcm',
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            ciphertext: encrypted.toString('base64')
        };
    };

    const decryptSecret = (encrypted) => {
        if (!encrypted || typeof encrypted !== 'object') {
            throw new Error('Encrypted payload is missing');
        }

        const iv = Buffer.from(encrypted.iv, 'base64');
        const tag = Buffer.from(encrypted.tag, 'base64');
        const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

        const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('utf8');
    };

    const streamToBuffer = async (body) => {
        if (!body) {
            return Buffer.alloc(0);
        }

        if (Buffer.isBuffer(body)) {
            return body;
        }

        if (typeof body.transformToByteArray === 'function') {
            const bytes = await body.transformToByteArray();
            return Buffer.from(bytes);
        }

        const chunks = [];
        for await (const chunk of body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    };

    const normalizeAttachmentForPayload = (attachment = {}) => {
        if (!attachment || typeof attachment !== 'object') {
            throw new Error('Attachment must be an object');
        }

        const storage = attachment.storage
            || ((attachment.bucket && attachment.key) ? { bucket: attachment.bucket, key: attachment.key } : null);

        if (storage?.bucket && storage?.key) {
            return {
                filename: attachment.filename || null,
                contentType: attachment.contentType || attachment.mimetype || null,
                contentDisposition: attachment.contentDisposition || null,
                cid: attachment.cid || null,
                storage: {
                    bucket: storage.bucket,
                    key: storage.key
                }
            };
        }

        if (attachment.content === undefined || attachment.content === null) {
            return { ...attachment };
        }

        const inlineMaxBytes = config.getInlineAttachmentMaxBytes();
        const bufferLike = Buffer.isBuffer(attachment.content)
            ? attachment.content
            : (attachment.content?.type === 'Buffer' && Array.isArray(attachment.content?.data)
                ? Buffer.from(attachment.content.data)
                : null);

        if (bufferLike) {
            if (bufferLike.length > inlineMaxBytes) {
                throw new Error(`Inline attachment "${attachment.filename || 'unnamed'}" exceeds SIDE_EFFECT_OUTBOX_INLINE_ATTACHMENT_MAX_BYTES=${inlineMaxBytes}`);
            }

            return {
                ...attachment,
                content: bufferLike.toString('base64'),
                contentEncoding: 'base64'
            };
        }

        if (typeof attachment.content === 'string') {
            return { ...attachment };
        }

        throw new Error(`Unsupported attachment content for "${attachment.filename || 'unnamed'}"`);
    };

    const normalizeAttachmentsForPayload = (attachments = []) => {
        return (attachments || []).map(normalizeAttachmentForPayload);
    };

    const normalizeIcalEventForPayload = (icalEvent = null) => {
        if (!icalEvent) {
            return null;
        }

        const normalized = { ...icalEvent };
        const bufferLike = Buffer.isBuffer(normalized.content)
            ? normalized.content
            : (normalized.content?.type === 'Buffer' && Array.isArray(normalized.content?.data)
                ? Buffer.from(normalized.content.data)
                : null);

        if (bufferLike) {
            normalized.content = bufferLike.toString('base64');
            normalized.contentEncoding = 'base64';
        }

        return normalized;
    };

    const materializeIcalEventFromPayload = (icalEvent = null) => {
        if (!icalEvent) {
            return null;
        }

        const materialized = { ...icalEvent };
        if (materialized.contentEncoding === 'base64' && typeof materialized.content === 'string') {
            materialized.content = Buffer.from(materialized.content, 'base64');
            delete materialized.contentEncoding;
        }
        return materialized;
    };

    const materializeAttachmentFromPayload = async (attachment = {}) => {
        if (attachment.storage?.bucket && attachment.storage?.key) {
            if (!storageService) {
                throw new Error('storageService dependency is required to process storage-backed email attachments');
            }

            const response = await storageService.download(attachment.storage.bucket, attachment.storage.key);
            const content = await streamToBuffer(response.Body);

            return {
                filename: attachment.filename || null,
                content,
                contentType: attachment.contentType || null,
                contentDisposition: attachment.contentDisposition || null,
                cid: attachment.cid || null
            };
        }

        const materialized = { ...attachment };

        if (materialized.contentEncoding === 'base64' && typeof materialized.content === 'string') {
            materialized.content = Buffer.from(materialized.content, 'base64');
            delete materialized.contentEncoding;
        } else if (materialized.content?.type === 'Buffer' && Array.isArray(materialized.content?.data)) {
            materialized.content = Buffer.from(materialized.content.data);
        }

        return materialized;
    };

    const materializeAttachmentsFromPayload = async (attachments = []) => {
        return Promise.all((attachments || []).map(materializeAttachmentFromPayload));
    };

    return {
        getEncryptionKey,
        encryptSecret,
        decryptSecret,
        normalizeAttachmentsForPayload,
        normalizeIcalEventForPayload,
        materializeAttachmentsFromPayload,
        materializeIcalEventFromPayload
    };
};
