module.exports = () => {
    const detectBucketFromKey = (key) => {
        const contextMap = {
            'applicant-attachments/': 'attachments',
            'interview-attachments/': 'attachments',
            'chat-attachments/': 'chat-files',
            'user-documents/': 'documents',
            'onboarding-templates/': 'templates',
            'job-seekers/': 'cv-uploads',
        };

        for (const [prefix, bucket] of Object.entries(contextMap)) {
            if (key && key.startsWith(prefix)) {
                return bucket;
            }
        }

        return 'attachments';
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

    return {
        detectBucketFromKey,
        streamToBuffer
    };
};
