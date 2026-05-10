const APPLICANT_AUDIT_FIELDS = [
    'id',
    'name',
    'surname',
    'email',
    'phone',
    'current_status',
    'job_posting_id',
    'organization_id'
];

const NOTE_AUDIT_FIELDS = [
    'id',
    'applicant_id',
    'author_id',
    'note',
    'created_at',
    'updated_at'
];

const ATTACHMENT_AUDIT_FIELDS = [
    'id',
    'applicant_id',
    'status',
    'reviewed_by',
    'reviewed_at',
    'review_notes'
];

const STATUS_LABELS_CS = {
    submitted: 'Přihláška odeslána',
    under_review: 'V přezkoumání',
    interview_scheduled: 'Pohovor naplánován',
    interview_completed: 'Pohovor proběhl',
    offer_sent: 'Nabídka odeslána',
    hired: 'Přijat/a',
    rejected: 'Zamítnuto',
    withdrawn: 'Staženo'
};

module.exports = {
    APPLICANT_AUDIT_FIELDS,
    NOTE_AUDIT_FIELDS,
    ATTACHMENT_AUDIT_FIELDS,
    STATUS_LABELS_CS
};
