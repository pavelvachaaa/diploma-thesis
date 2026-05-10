const ProcessingResult = require('@core/jobSeekerCvAnalysis/domain/ProcessingResult');

module.exports = ({ jobSeekerCvAnalysisStorePort }) => {
    const saveAnalysis = (result, options = {}) => {
        if (result?.status === 'failed') {
            return saveFailure(result, options);
        }

        return jobSeekerCvAnalysisStorePort.saveAnalysisResult(
            ProcessingResult.createCompleted(result),
            options
        );
    };

    const saveFailure = (result, options = {}) =>
        jobSeekerCvAnalysisStorePort.saveAnalysisFailure(
            ProcessingResult.createFailure(result),
            options
        );

    return {
        saveAnalysis,
        saveFailure
    };
};
