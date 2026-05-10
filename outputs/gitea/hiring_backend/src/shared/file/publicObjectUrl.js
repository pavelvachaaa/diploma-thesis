const normalizePublicS3BaseUrl = (value = process.env.PUBLIC_S3_BASE_URL) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    return trimmed.replace(/\/+$/, '');
};

const encodePathSegments = (value) => {
    const normalized = String(value || '').replace(/^\/+/, '');
    if (!normalized) {
        return '';
    }

    return normalized
        .split('/')
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join('/');
};

const buildPublicObjectUrl = ({
    baseUrl = process.env.PUBLIC_S3_BASE_URL,
    bucket,
    objectKey
} = {}) => {
    const normalizedBaseUrl = normalizePublicS3BaseUrl(baseUrl);
    const encodedBucket = encodePathSegments(bucket);
    const encodedKey = encodePathSegments(objectKey);

    if (!normalizedBaseUrl || !encodedBucket || !encodedKey) {
        return null;
    }

    return `${normalizedBaseUrl}/${encodedBucket}/${encodedKey}`;
};

const buildPublicObjectUrlFromEnv = ({ bucket, objectKey } = {}) => buildPublicObjectUrl({
    bucket,
    objectKey
});

const attachPublicObjectUrl = (record, {
    urlField = 'public_url',
    bucketField = 'bucket',
    objectKeyField = 'object_key',
    presenceField = null,
    baseUrl = process.env.PUBLIC_S3_BASE_URL
} = {}) => {
    if (!record || typeof record !== 'object') {
        return record;
    }

    const serialized = { ...record };
    const bucket = serialized[bucketField];
    const objectKey = serialized[objectKeyField];

    delete serialized[bucketField];
    delete serialized[objectKeyField];

    const shouldBuildUrl = presenceField
        ? Boolean(serialized[presenceField] && bucket && objectKey)
        : Boolean(bucket && objectKey);

    serialized[urlField] = shouldBuildUrl
        ? buildPublicObjectUrl({ baseUrl, bucket, objectKey })
        : null;

    return serialized;
};

const attachPublicObjectUrls = (records, options = {}) => {
    if (!Array.isArray(records)) {
        return records;
    }

    return records.map((record) => attachPublicObjectUrl(record, options));
};

module.exports = {
    normalizePublicS3BaseUrl,
    buildPublicObjectUrl,
    buildPublicObjectUrlFromEnv,
    attachPublicObjectUrl,
    attachPublicObjectUrls
};
