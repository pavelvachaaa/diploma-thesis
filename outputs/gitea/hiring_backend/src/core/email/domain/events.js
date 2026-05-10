const templateCreated = ({ templateId, name, type, organizationId, createdByUserId }) =>
    Object.freeze({ type: 'EmailTemplate.Created', templateId, name, templateType: type, organizationId, createdByUserId: createdByUserId || null });

const templateUpdated = ({ templateId, organizationId, actorUserId }) =>
    Object.freeze({ type: 'EmailTemplate.Updated', templateId, organizationId, actorUserId: actorUserId || null });

const templateDeleted = ({ templateId, organizationId, actorUserId }) =>
    Object.freeze({ type: 'EmailTemplate.Deleted', templateId, organizationId, actorUserId: actorUserId || null });

module.exports = { templateCreated, templateUpdated, templateDeleted };
