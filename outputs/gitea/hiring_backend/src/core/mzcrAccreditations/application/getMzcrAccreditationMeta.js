module.exports = ({ mzcrAccreditationStorePort }) => {
    return (query = {}) => mzcrAccreditationStorePort.getAccreditationMeta(query);
};
