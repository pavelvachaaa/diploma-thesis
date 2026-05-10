const createInternalUsersApplication = require('../../src/core/internalUsers/application');

describe('internalUsers.application', () => {
    it('returns search results across organizations without pre-filtering', async () => {
        const application = createInternalUsersApplication({
            internalUserDirectoryPort: {
                searchUsers: jest.fn().mockResolvedValue([
                    {
                        id: '272',
                        name: 'Pavel',
                        surname: 'Vacha',
                        fullName: 'Pavel Vacha',
                        email: 'p.vacha@example.com',
                        seatLocation: 'CE'
                    },
                    {
                        id: '273',
                        name: 'Jana',
                        surname: 'Novakova',
                        fullName: 'Jana Novakova',
                        email: 'jana.novakova@kzcr.eu',
                        seatLocation: 'UL'
                    },
                    {
                        id: '274',
                        name: 'Bez',
                        surname: 'Mapovani',
                        fullName: 'Bez Mapovani',
                        email: 'bez.mapovani@kzcr.eu',
                        seatLocation: 'XX'
                    }
                ])
            },
            internalUsersStorePort: {
                getOrganizationsBySeatLocations: jest.fn().mockResolvedValue([
                    { id: 'org-ce', name: 'Centrum', seat_location: 'CE' },
                    { id: 'org-ul', name: 'Usti', seat_location: 'UL' }
                ]),
                findLocalUsersByEmails: jest.fn().mockResolvedValue([
                    { id: 'user-1', email: 'jana.novakova@kzcr.eu' }
                ])
            }
        });

        const result = await application.search({
            query: 'Pavel',
            organizationId: 'org-any'
        });

        expect(result).toEqual([
            expect.objectContaining({
                email: 'p.vacha@example.com',
                seatLocation: 'CE',
                organizationId: 'org-ce',
                organizationName: 'Centrum',
                existsLocally: false
            }),
            expect.objectContaining({
                email: 'jana.novakova@kzcr.eu',
                seatLocation: 'UL',
                organizationId: 'org-ul',
                organizationName: 'Usti',
                localUserId: 'user-1',
                existsLocally: true
            }),
            expect.objectContaining({
                email: 'bez.mapovani@kzcr.eu',
                seatLocation: 'XX',
                organizationId: null,
                organizationName: null,
                existsLocally: false
            })
        ]);
    });

    it('creates or updates local user through internal users repository only', async () => {
        const storePort = {
            getOrganizationBySeatLocation: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Centrum' }),
            findLocalUserByEmail: jest.fn().mockResolvedValue({ id: 'user-1', email: 'p.vacha@example.com' }),
            updateLocalUserProfile: jest.fn().mockResolvedValue({ id: 'user-1', email: 'p.vacha@example.com' }),
            createLocalInternalUser: jest.fn()
        };

        const application = createInternalUsersApplication({
            internalUserDirectoryPort: { searchUsers: jest.fn() },
            internalUsersStorePort: storePort
        });

        const result = await application.ensureLocalUser({
            email: 'Pavel.Vacha@KZCR.EU',
            fullName: 'Pavel Vacha',
            seatLocation: 'CE'
        });

        expect(storePort.findLocalUserByEmail).toHaveBeenCalledWith('p.vacha@example.com', {});
        expect(storePort.updateLocalUserProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({
            name: 'Pavel',
            surname: 'Vacha',
            organization_id: 'org-1'
        }), {});
        expect(storePort.createLocalInternalUser).not.toHaveBeenCalled();
        expect(result.created).toBe(false);
    });

    it('normalizes seat location for organization lookup', async () => {
        const internalUsersStorePort = {
            getOrganizationBySeatLocation: jest.fn().mockResolvedValue({ id: 'org-1', seat_location: 'CE' })
        };
        const application = createInternalUsersApplication({
            internalUserDirectoryPort: { searchUsers: jest.fn() },
            internalUsersStorePort
        });

        const result = await application.getOrganizationBySeatLocation(' ce ');

        expect(result).toEqual({ id: 'org-1', seat_location: 'CE' });
        expect(internalUsersStorePort.getOrganizationBySeatLocation).toHaveBeenCalledWith('CE', {});
    });

    it('returns null for blank seat location lookup without hitting persistence', async () => {
        const internalUsersStorePort = {
            getOrganizationBySeatLocation: jest.fn()
        };
        const application = createInternalUsersApplication({
            internalUserDirectoryPort: { searchUsers: jest.fn() },
            internalUsersStorePort
        });

        const result = await application.getOrganizationBySeatLocation('   ');

        expect(result).toBeNull();
        expect(internalUsersStorePort.getOrganizationBySeatLocation).not.toHaveBeenCalled();
    });

    it('rejects empty search query with a 400 application error', async () => {
        const application = createInternalUsersApplication({
            internalUserDirectoryPort: { searchUsers: jest.fn() },
            internalUsersStorePort: {
                getOrganizationsBySeatLocations: jest.fn(),
                findLocalUsersByEmails: jest.fn()
            }
        });

        await expect(application.search({ query: '   ' })).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            message: 'Vyhledávací dotaz je povinný'
        });
    });
});
