module.exports = ({ contactInquiryStorePort }) => {
    return async (id, options = {}) => contactInquiryStorePort.getInquiryById(id, options);
};
