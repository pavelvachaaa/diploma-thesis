const PARTICIPANT_ROLE_LABELS = {
    organizer: 'organizátor',
    interviewer: 'tazatel',
    observer: 'pozorovatel',
};

const INTERVIEW_AUDIT_FIELDS = [
    'id',
    'applicant_id',
    'organization_id',
    'status',
    'title',
    'scheduled_at',
    'duration_minutes',
    'location_type',
    'location',
    'online_meeting_link'
];

module.exports = {
    PARTICIPANT_ROLE_LABELS,
    INTERVIEW_AUDIT_FIELDS
};
