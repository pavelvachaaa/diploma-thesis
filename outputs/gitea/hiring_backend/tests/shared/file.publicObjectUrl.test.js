const {
    normalizePublicS3BaseUrl,
    buildPublicObjectUrl,
    attachPublicObjectUrl
} = require('../../src/shared/file/publicObjectUrl');

describe('shared/file/publicObjectUrl', () => {
    const originalBaseUrl = process.env.PUBLIC_S3_BASE_URL;

    beforeEach(() => {
        process.env.PUBLIC_S3_BASE_URL = 'https://cdn.example.com/';
    });

    afterEach(() => {
        if (originalBaseUrl === undefined) {
            delete process.env.PUBLIC_S3_BASE_URL;
            return;
        }

        process.env.PUBLIC_S3_BASE_URL = originalBaseUrl;
    });

    it('normalizes trailing slashes from the configured public base URL', () => {
        expect(normalizePublicS3BaseUrl('https://cdn.example.com///')).toBe('https://cdn.example.com');
    });

    it('builds path-style public object URLs and encodes key segments safely', () => {
        expect(buildPublicObjectUrl({
            baseUrl: 'https://cdn.example.com/',
            bucket: 'public-organization-photos',
            objectKey: 'organization-contact-photos/org 1/Jana Vácha.png'
        })).toBe(
            'https://cdn.example.com/public-organization-photos/organization-contact-photos/org%201/Jana%20V%C3%A1cha.png'
        );
    });

    it('returns null when base URL or object location is missing', () => {
        expect(buildPublicObjectUrl({
            baseUrl: '',
            bucket: 'public-organization-photos',
            objectKey: 'organization-contact-photos/org-1.png'
        })).toBeNull();

        expect(buildPublicObjectUrl({
            baseUrl: 'https://cdn.example.com',
            bucket: null,
            objectKey: 'organization-contact-photos/org-1.png'
        })).toBeNull();
    });

    it('attaches a public URL and removes internal bucket fields from serialized payloads', () => {
        expect(attachPublicObjectUrl({
            id: 'org-1',
            contact_photo_file_id: 'file-1',
            _contact_photo_bucket: 'public-organization-photos',
            _contact_photo_object_key: 'organization-contact-photos/org-1/photo.png'
        }, {
            urlField: 'contact_photo_url',
            bucketField: '_contact_photo_bucket',
            objectKeyField: '_contact_photo_object_key',
            presenceField: 'contact_photo_file_id'
        })).toEqual({
            id: 'org-1',
            contact_photo_file_id: 'file-1',
            contact_photo_url: 'https://cdn.example.com/public-organization-photos/organization-contact-photos/org-1/photo.png'
        });
    });
});
