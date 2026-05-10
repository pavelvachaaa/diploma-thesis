module.exports = ({ applicantsService }) => {
    const getApplicantNotesAdmin = async (req, res, next) => {
        try {
            const notes = await applicantsService.getApplicantNotes(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(notes);
        } catch (err) {
            next(err);
        }
    };

    const createApplicantNoteAdmin = async (req, res, next) => {
        try {
            const { note } = req.body;

            if (!note) {
                return res.status(400).json({ message: 'Note text is required' });
            }

            const createdNote = await applicantsService.createApplicantNote({
                applicant_id: req.params.id,
                author_id: req.user?.id || null,
                note
            }, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });

            if (!createdNote) {
                return res.status(404).json({ message: 'Applicant not found' });
            }

            res.status(201).json(createdNote);
        } catch (err) {
            next(err);
        }
    };

    const updateApplicantNoteAdmin = async (req, res, next) => {
        try {
            const { note } = req.body;

            if (!note) {
                return res.status(400).json({ message: 'Note text is required' });
            }

            const updatedNote = await applicantsService.updateApplicantNote(req.params.noteId, note, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!updatedNote) {
                return res.status(404).json({ message: 'Note not found' });
            }

            res.json(updatedNote);
        } catch (err) {
            next(err);
        }
    };

    const deleteApplicantNoteAdmin = async (req, res, next) => {
        try {
            const deletedNote = await applicantsService.deleteApplicantNote(req.params.noteId, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!deletedNote) {
                return res.status(404).json({ message: 'Note not found' });
            }

            res.json({ message: 'Note deleted successfully' });
        } catch (err) {
            next(err);
        }
    };

    return {
        getApplicantNotesAdmin,
        createApplicantNoteAdmin,
        updateApplicantNoteAdmin,
        deleteApplicantNoteAdmin
    };
};
