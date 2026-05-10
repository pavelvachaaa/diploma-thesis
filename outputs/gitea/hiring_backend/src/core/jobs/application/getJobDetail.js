const { attachPublicObjectUrl } = require('@shared/file/publicObjectUrl');

const CONTACT_PHOTO_URL_OPTIONS = {
    urlField: 'contact_photo_url',
    bucketField: '_contact_photo_bucket',
    objectKeyField: '_contact_photo_object_key',
    presenceField: 'contact_photo_file_id'
};

module.exports = ({ jobsStorePort }) => async (jobId) => {
    return attachPublicObjectUrl(
        await jobsStorePort.getJobDetail(jobId),
        CONTACT_PHOTO_URL_OPTIONS
    );
};
