module.exports = ({ mzcrAccreditationStorePort }) => {
    return () => mzcrAccreditationStorePort.getSyncState();
};
