module.exports = {
    forbidden: [
        {
            name: 'domain-controller-service-only-fixture',
            severity: 'error',
            from: {
                path: '^tests/fixtures/depcruise/domain-module/domain/sample/controller(/|$)'
            },
            to: {
                pathNot: '^tests/fixtures/depcruise/domain-module/domain/sample/service(/|$)'
            }
        },
        {
            name: 'domain-service-direction-fixture',
            severity: 'error',
            from: {
                path: '^tests/fixtures/depcruise/domain-module/domain/sample/service(/|$)'
            },
            to: {
                pathNot: '^tests/fixtures/depcruise/domain-module/domain/sample/(service|repository|events)(/|$)|^tests/fixtures/depcruise/domain-module/platform(/|$)|^tests/fixtures/depcruise/domain-module/shared(/|$)'
            }
        },
        {
            name: 'domain-repository-direction-fixture',
            severity: 'error',
            from: {
                path: '^tests/fixtures/depcruise/domain-module/domain/sample/repository(/|$)'
            },
            to: {
                pathNot: '^tests/fixtures/depcruise/domain-module/domain/sample/repository(/|$)|^tests/fixtures/depcruise/domain-module/platform/db(/|$)|^tests/fixtures/depcruise/domain-module/shared(/|$)'
            }
        }
    ],
    options: {
        includeOnly: '^tests/fixtures/depcruise/domain-module',
        doNotFollow: {
            path: 'node_modules'
        }
    }
};
