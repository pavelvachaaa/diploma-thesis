const { createContractPort } = require('@shared/contracts/runtime');
const { optional, optionsObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekerCvAnalysis/application/ports/jobSeekerCvAnalysisUnitOfWork.port');

const callbackValidator = Object.freeze({
    expected: 'transaction callback',
    parse: (value, meta) => {
        if (typeof value !== 'function') {
            throw new Error(`${meta.port}.${meta.method} expected ${meta.path} to be a transaction callback`);
        }
        return value;
    }
});

module.exports = ({ jobSeekerCvAnalysisUnitOfWorkAdapter }) => {
    const service = requireServiceMethods(
        jobSeekerCvAnalysisUnitOfWorkAdapter,
        'jobSeekerCvAnalysisUnitOfWorkAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            runInTransaction: {
                input: tuple(callbackValidator, optional(optionsObject)),
                impl: (work, options = {}) => service.runInTransaction(work, cloneOptions(options))
            }
        }
    });
};
