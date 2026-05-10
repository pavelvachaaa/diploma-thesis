const ProcessingResult = require('@core/cvAnalysis/domain/ProcessingResult');

module.exports = ({ cvAnalysisStorePort }) => {
    const saveAnalysis = (result, options = {}) => {
        if (result?.status === 'failed') {
            return saveFailure(result, options);
        }

        return cvAnalysisStorePort.saveAnalysisResult(
            ProcessingResult.createCompleted(result),
            options
        );
    };

    const saveFailure = (result, options = {}) =>
        cvAnalysisStorePort.saveAnalysisFailure(
            ProcessingResult.createFailure(result),
            options
        );

    return {
        saveAnalysis,
        saveFailure
    };
};
