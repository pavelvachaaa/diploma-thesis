module.exports = {
    forbidden: [
        {
            name: 'controllers-no-repository-imports-fixture',
            severity: 'error',
            from: {
                path: '^tests/fixtures/depcruise/controllers(/|$)'
            },
            to: {
                path: '^tests/fixtures/depcruise/repositories(/|$)'
            }
        }
    ],
    options: {
        includeOnly: '^tests/fixtures/depcruise',
        doNotFollow: {
            path: 'node_modules'
        }
    }
};
