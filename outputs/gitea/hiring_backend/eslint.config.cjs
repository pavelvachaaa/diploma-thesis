module.exports = [
    {
        ignores: [
            'node_modules/**',
            'coverage/**'
        ],
    },
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'readonly',
                __dirname: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                setImmediate: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                fetch: 'readonly'
            }
        },
        rules: {
            'no-console': 'error',
            'no-debugger': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.object.name='logger'][arguments.length=1][arguments.0.type='Identifier'][arguments.0.name=/^(err|error)$/]",
                    message: 'Use structured logger.error with a message and metadata instead of logger.error(error).'
                }
            ]
        }
    },
    {
        files: ['src/platform/db/index.js'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.object.name='logger'][arguments.length=1][arguments.0.type='Identifier'][arguments.0.name=/^(err|error)$/]",
                    message: 'Use structured logger.error with a message and metadata instead of logger.error(error).'
                },
                {
                    selector: "CallExpression[callee.object.name='logger'] Property[key.name=/^(text|params)$/]",
                    message: 'Do not log raw SQL text/params in database logs.'
                },
                {
                    selector: "CallExpression[callee.object.name='logger'] MemberExpression[property.name='lastQuery']",
                    message: 'Do not log lastQuery details in database logs.'
                }
            ]
        }
    },
    {
        files: ['src/domain/auth/controller/publicAuth.controller.js', 'src/domain/auth/service/index.js', 'src/platform/auth/index.js'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.object.name='logger'][arguments.length=1][arguments.0.type='Identifier'][arguments.0.name=/^(err|error)$/]",
                    message: 'Use structured logger.error with a message and metadata instead of logger.error(error).'
                },
                {
                    selector: "CallExpression[callee.object.name='logger'] Property[key.name=/^(tokenData|idToken|accessToken|refreshToken|authorization)$/]",
                    message: 'Do not log OAuth token payload objects.'
                }
            ]
        }
    }
];
