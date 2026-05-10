const {
    MEMBERSHIP_RULE_PREFIX,
    USER_ROLE_RULE_PREFIX
} = require('./constants');

const dedupeIds = (values = []) => [...new Set(
    (Array.isArray(values) ? values : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
)];

const getMembershipRule = (membershipId) => `${MEMBERSHIP_RULE_PREFIX}${membershipId}`;
const getUserRoleRule = (userId) => `${USER_ROLE_RULE_PREFIX}${userId}`;

module.exports = {
    dedupeIds,
    getMembershipRule,
    getUserRoleRule
};
