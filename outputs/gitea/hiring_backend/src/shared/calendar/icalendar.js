/**
 * iCalendar (.ics) file generator for calendar event invitations
 * Generates RFC 5545 compliant iCalendar format for email attachments
 */

const generateUID = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}@kzcr.eu`;
};

const formatICalDate = (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const escapeText = (text) => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
};

const foldLine = (line) => {
    if (line.length <= 75) return line;

    const result = [];
    let currentLine = line;

    while (currentLine.length > 75) {
        result.push(currentLine.substring(0, 75));
        currentLine = ` ${currentLine.substring(75)}`;
    }

    result.push(currentLine);
    return result.join('\r\n');
};

const generateICS = ({
    uid = generateUID(),
    title,
    description = '',
    location = '',
    startTime,
    endTime,
    organizer,
    attendees = [],
    onlineMeetingLink = '',
    status = 'CONFIRMED',
    method = 'REQUEST'
}) => {
    const now = formatICalDate(new Date());
    const dtStart = formatICalDate(startTime);
    const dtEnd = formatICalDate(endTime);

    const organizerLine = organizer
        ? foldLine(`ORGANIZER;CN=${escapeText(organizer.name)}:mailto:${organizer.email}`)
        : '';

    const attendeeLines = attendees
        .filter((attendee) => attendee.email)
        .map((attendee) => {
            const cn = attendee.name ? `CN=${escapeText(attendee.name)};` : '';
            return foldLine(`ATTENDEE;${cn}RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${attendee.email}`);
        })
        .join('\r\n');

    let fullDescription = escapeText(description);
    if (onlineMeetingLink) {
        fullDescription += `\\n\\nOnline Meeting Link: ${escapeText(onlineMeetingLink)}`;
    }

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KZCR//Hiring System//CS',
        'CALSCALE:GREGORIAN',
        `METHOD:${method}`,
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        foldLine(`SUMMARY:${escapeText(title)}`),
        foldLine(`DESCRIPTION:${fullDescription}`),
        location ? foldLine(`LOCATION:${escapeText(location)}`) : null,
        `STATUS:${status}`,
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        'CLASS:PUBLIC',
        'PRIORITY:5',
        organizerLine,
        attendeeLines,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    return lines.filter(Boolean).join('\r\n');
};

const generateInterviewICS = (interview, applicant, organizer, participants = []) => {
    const startTime = new Date(interview.scheduled_at);
    const endTime = new Date(startTime.getTime() + (interview.duration_minutes * 60 * 1000));

    let location = interview.location || '';
    if (interview.location_type === 'online' && interview.online_meeting_link) {
        location = 'Online Meeting';
    }

    const description = interview.description || `Pohovor s uchazečem ${applicant.name} ${applicant.surname}`;

    const attendees = [
        {
            name: `${applicant.name} ${applicant.surname}`,
            email: applicant.email
        },
        ...participants.map((participant) => ({
            name: participant.user_name || participant.external_name,
            email: participant.user_email || participant.external_email
        })).filter((participant) => participant.email)
    ];

    return generateICS({
        uid: `interview-${interview.id}@kzcr.eu`,
        title: interview.title,
        description,
        location,
        startTime,
        endTime,
        organizer: {
            name: `${organizer.name} ${organizer.surname || ''}`.trim(),
            email: organizer.email
        },
        attendees,
        onlineMeetingLink: interview.online_meeting_link || '',
        status: interview.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'
    });
};

const generateCancellationICS = (interview, applicant, organizer, participants = []) => {
    const ics = generateInterviewICS(interview, applicant, organizer, participants);
    return ics.replace('STATUS:CONFIRMED', 'STATUS:CANCELLED').replace('METHOD:REQUEST', 'METHOD:CANCEL');
};

module.exports = {
    generateICS,
    generateInterviewICS,
    generateCancellationICS,
    generateUID,
    formatICalDate,
    escapeText
};
