const multerFileToUpload = (file) => file && ({
    originalName: file.originalname,
    key: file.key,
    bucket: file.bucket,
    mimetype: file.mimetype,
    size: file.size,
    checksum_sha256: file.checksum_sha256 || null
});

module.exports = {
    multerFileToUpload
};
