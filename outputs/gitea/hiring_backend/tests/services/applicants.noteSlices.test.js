const createNoteQueries = require('../../src/domain/applicants/service/noteQueries');
const createNoteMutations = require('../../src/domain/applicants/service/noteMutations');

describe('applicants note slices', () => {
    it('delegates note queries to repository', async () => {
        const queries = createNoteQueries({
            notesRepository: {
                getNotesByApplicantId: jest.fn().mockResolvedValue([{ id: 'note-1' }])
            }
        });

        const result = await queries.getApplicantNotes('applicant-1');
        expect(result).toEqual([{ id: 'note-1' }]);
    });

    it('emits applicant child audit metadata when mutating notes', async () => {
        const applicantChildAudit = {
            emitApplicantChildAudit: jest.fn()
        };
        const mutations = createNoteMutations({
            notesRepository: {
                getDefaultAdminAuthorId: jest.fn().mockResolvedValue('admin-1'),
                createNote: jest.fn().mockResolvedValue({ id: 'note-1', applicant_id: 'applicant-1' })
            },
            applicantsRepository: {
                getApplicantById: jest.fn().mockResolvedValue({ id: 'applicant-1', organization_id: 'org-1' })
            },
            NOTE_AUDIT_FIELDS: ['id'],
            applicantChildAudit
        });

        await mutations.createApplicantNote({
            applicant_id: 'applicant-1',
            note: 'Hello'
        });

        expect(applicantChildAudit.emitApplicantChildAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'applicant.note.create',
            metadata: expect.objectContaining({ noteId: 'note-1' })
        }));
    });
});
