const ContactInquiry = require('@core/contactInquiries/domain/ContactInquiry');

module.exports = ({ contactInquiryStorePort }) => {
    return async (rawFilters = {}) => {
        const { search, status } = ContactInquiry.filterQuery(rawFilters);
        return contactInquiryStorePort.getAllInquiries({
            page: rawFilters.page,
            limit: rawFilters.limit,
            search,
            status
        });
    };
};
