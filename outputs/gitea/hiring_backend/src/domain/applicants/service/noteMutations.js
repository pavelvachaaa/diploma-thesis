module.exports = ({
    notesRepository,
    applicantsRepository,
    NOTE_AUDIT_FIELDS,
    applicantChildAudit
}) => {
    const createApplicantNote = async (noteData, options = {}) => {
        if (!noteData.author_id) {
            const adminAuthorId = typeof notesRepository.getDefaultAdminAuthorId === 'function'
                ? await notesRepository.getDefaultAdminAuthorId()
                : null;
            if (adminAuthorId) {
                noteData.author_id = adminAuthorId;
            }
        }

        const createdNote = await notesRepository.createNote(noteData, options);
        if (!createdNote) {
            return null;
        }

        const applicant = await applicantsRepository.getApplicantById(noteData.applicant_id);

        applicantChildAudit.emitApplicantChildAudit({
            action: 'applicant.note.create',
            applicant,
            applicantId: noteData.applicant_id,
            auditFields: NOTE_AUDIT_FIELDS,
            afterEntity: createdNote,
            metadata: {
                noteId: createdNote?.id || null
            }
        });

        return createdNote;
    };

    const updateApplicantNote = async (noteId, noteText, options = {}) => {
        const beforeNote = typeof notesRepository.getNoteById === 'function'
            ? await notesRepository.getNoteById(noteId, options)
            : null;
        const updatedNote = await notesRepository.updateNote(noteId, noteText, options);

        if (updatedNote) {
            const applicant = await applicantsRepository.getApplicantById(updatedNote.applicant_id);

            applicantChildAudit.emitApplicantChildAudit({
                action: 'applicant.note.update',
                applicant,
                applicantId: updatedNote.applicant_id,
                auditFields: NOTE_AUDIT_FIELDS,
                beforeEntity: beforeNote,
                afterEntity: updatedNote,
                metadata: {
                    noteId
                }
            });
        }

        return updatedNote;
    };

    const deleteApplicantNote = async (noteId, options = {}) => {
        const beforeNote = typeof notesRepository.getNoteById === 'function'
            ? await notesRepository.getNoteById(noteId, options)
            : null;
        const deletedNote = await notesRepository.deleteNote(noteId, options);

        if (deletedNote) {
            const applicant = await applicantsRepository.getApplicantById(deletedNote.applicant_id);

            applicantChildAudit.emitApplicantChildAudit({
                action: 'applicant.note.delete',
                applicant,
                applicantId: deletedNote.applicant_id,
                auditFields: NOTE_AUDIT_FIELDS,
                beforeEntity: beforeNote || deletedNote,
                metadata: {
                    noteId
                }
            });
        }

        return deletedNote;
    };

    return {
        createApplicantNote,
        updateApplicantNote,
        deleteApplicantNote
    };
};
