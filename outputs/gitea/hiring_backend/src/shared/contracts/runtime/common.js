const {
    unknown,
    nonEmptyString,
    booleanFlag,
    numberRange,
    enumValue,
    optional,
    nullable,
    arrayOf,
    objectShape,
    tuple
} = require('./validators');

const entityId = nonEmptyString('entity id');
const optionsObject = objectShape({}, { allowExtra: true, cloneResult: false });
const plainObject = objectShape({}, { allowExtra: true });
const stringArray = arrayOf(nonEmptyString('string'));
const numberArray = arrayOf(numberRange());

module.exports = {
    unknown,
    nonEmptyString,
    booleanFlag,
    numberRange,
    enumValue,
    optional,
    nullable,
    arrayOf,
    objectShape,
    tuple,
    entityId,
    optionsObject,
    plainObject,
    stringArray,
    numberArray
};
