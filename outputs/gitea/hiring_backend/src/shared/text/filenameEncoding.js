const normalizePotentialMojibake = (fileName) => {
    if (typeof fileName !== 'string' || fileName.length === 0) {
        return fileName;
    }

    let decodedUtf8;
    try {
        decodedUtf8 = Buffer.from(fileName, 'latin1').toString('utf8');
    } catch (_error) {
        return fileName;
    }

    if (decodedUtf8.includes('\uFFFD')) {
        return fileName;
    }

    const isLatin1Roundtrip = Buffer.from(decodedUtf8, 'utf8').toString('latin1') === fileName;
    if (!isLatin1Roundtrip) {
        return fileName;
    }

    return decodedUtf8;
};

module.exports = {
    normalizePotentialMojibake
};
