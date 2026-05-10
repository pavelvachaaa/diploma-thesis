const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
    CopyObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
    PutBucketPolicyCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

const SAFE_METADATA_KEY_PATTERN = /^[a-z0-9!#$%&'*+.^_`|~-]+$/i;
const SAFE_METADATA_VALUE_PATTERN = /^[\x20-\x7E]*$/;
const PUBLIC_ORGANIZATION_PHOTOS_BUCKET = 'public-organization-photos';

const buildPublicReadBucketPolicy = (bucket) => JSON.stringify({
    Version: '2012-10-17',
    Statement: [
        {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucket}/*`
        }
    ]
});

const encodeCopySource = ({ bucket, key }) => {
    const encodedKey = String(key || '')
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join('/');

    return `${encodeURIComponent(bucket)}/${encodedKey}`;
};

const sanitizeCustomMetadata = (customMetadata) => {
    if (!customMetadata || typeof customMetadata !== 'object') {
        return {
            metadata: {},
            dropped: []
        };
    }

    const metadata = {};
    const dropped = [];

    for (const [rawKey, rawValue] of Object.entries(customMetadata)) {
        const key = String(rawKey || '').trim();
        if (!key || !SAFE_METADATA_KEY_PATTERN.test(key)) {
            dropped.push({ key: rawKey, reason: 'invalid_key' });
            continue;
        }

        let value;
        if (rawValue === null || rawValue === undefined) {
            dropped.push({ key, reason: 'nullish_value' });
            continue;
        } else if (rawValue instanceof Date) {
            value = rawValue.toISOString();
        } else if (['string', 'number', 'boolean', 'bigint'].includes(typeof rawValue)) {
            value = String(rawValue);
        } else {
            dropped.push({ key, reason: 'unsupported_value_type' });
            continue;
        }

        if (!SAFE_METADATA_VALUE_PATTERN.test(value)) {
            dropped.push({ key, reason: 'non_ascii_value' });
            continue;
        }

        metadata[key.toLowerCase()] = value;
    }

    return { metadata, dropped };
};

class StorageService {
    constructor({ logger }) {
        this.logger = logger;
        this.client = null;
        this.initialized = false;
    }

    init() {
        if (this.client) return;

        const endpoint = process.env.S3_ENDPOINT || 'http://localhost:8444';
        const accessKey = process.env.S3_ACCESS_KEY || 'admin';
        const secretKey = process.env.S3_SECRET_KEY || 'admin';

        this.client = new S3Client({
            endpoint,
            region: 'us-east-1',
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey
            },
            forcePathStyle: true
        });

        this.logger.info('StorageService initialized', { endpoint });
    }

    async ensureBuckets() {
        if (this.initialized) return;
        this.init();

        const buckets = ['cv-uploads', 'attachments', 'documents', 'chat-files', 'templates', PUBLIC_ORGANIZATION_PHOTOS_BUCKET];

        for (const bucket of buckets) {
            try {
                await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
            } catch (err) {
                if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                    try {
                        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
                        this.logger.info(`Bucket created: ${bucket}`);
                    } catch (createErr) {
                        if (createErr.name !== 'BucketAlreadyOwnedByYou' && createErr.name !== 'BucketAlreadyExists') {
                            this.logger.error(`Failed to create bucket: ${bucket}`, { error: createErr.message });
                        }
                    }
                }
            }
        }

        await this.putBucketPolicy(
            PUBLIC_ORGANIZATION_PHOTOS_BUCKET,
            buildPublicReadBucketPolicy(PUBLIC_ORGANIZATION_PHOTOS_BUCKET)
        );

        this.initialized = true;
        this.logger.info('StorageService buckets verified');
    }

    async upload(bucket, key, body, metadata = {}) {
        this.init();
        const { metadata: customMetadata, dropped } = sanitizeCustomMetadata(metadata.custom);

        if (dropped.length > 0) {
            this.logger.warn('Dropped invalid storage metadata entries', {
                bucket,
                key,
                dropped: dropped.map((entry) => ({
                    key: entry.key,
                    reason: entry.reason
                }))
            });
        }

        const params = {
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: metadata.contentType || 'application/octet-stream',
            Metadata: customMetadata
        };

        if (metadata.cacheControl) {
            params.CacheControl = metadata.cacheControl;
        }

        if (metadata.contentLength && metadata.contentLength > 5 * 1024 * 1024) {
            const upload = new Upload({
                client: this.client,
                params,
                partSize: 5 * 1024 * 1024,
                leavePartsOnError: false
            });

            await upload.done();
        } else {
            await this.client.send(new PutObjectCommand(params));
        }

        this.logger.info('File uploaded to storage', { bucket, key, contentType: metadata.contentType });

        return { bucket, key };
    }

    async head(bucket, key) {
        this.init();
        return this.client.send(new HeadObjectCommand({
            Bucket: bucket,
            Key: key
        }));
    }

    async download(bucket, key) {
        this.init();
        return this.client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: key
        }));
    }

    async delete(bucket, key) {
        this.init();

        await this.client.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));

        this.logger.info('File deleted from storage', { bucket, key });
    }

    async copy(sourceBucket, sourceKey, targetBucket, targetKey, metadata = {}) {
        this.init();
        const { metadata: customMetadata, dropped } = sanitizeCustomMetadata(metadata.custom);

        if (dropped.length > 0) {
            this.logger.warn('Dropped invalid storage metadata entries', {
                bucket: targetBucket,
                key: targetKey,
                dropped: dropped.map((entry) => ({
                    key: entry.key,
                    reason: entry.reason
                }))
            });
        }

        const params = {
            Bucket: targetBucket,
            Key: targetKey,
            CopySource: encodeCopySource({ bucket: sourceBucket, key: sourceKey }),
            MetadataDirective: 'COPY'
        };

        if (metadata.contentType || metadata.cacheControl || Object.keys(customMetadata).length > 0) {
            params.MetadataDirective = 'REPLACE';
            params.ContentType = metadata.contentType || 'application/octet-stream';
            params.Metadata = customMetadata;
            if (metadata.cacheControl) {
                params.CacheControl = metadata.cacheControl;
            }
        }

        await this.client.send(new CopyObjectCommand(params));

        this.logger.info('File copied in storage', {
            sourceBucket,
            sourceKey,
            targetBucket,
            targetKey
        });

        return {
            bucket: targetBucket,
            key: targetKey
        };
    }

    async putBucketPolicy(bucket, policy) {
        this.init();

        await this.client.send(new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: policy
        }));

        this.logger.info('Bucket policy applied', { bucket });
    }

    async getSignedUrl(bucket, key, expiresIn = 3600) {
        this.init();

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        return getSignedUrl(this.client, command, { expiresIn });
    }

    getClient() {
        this.init();
        return this.client;
    }
}

module.exports = ({ logger }) => {
    return new StorageService({ logger });
};
