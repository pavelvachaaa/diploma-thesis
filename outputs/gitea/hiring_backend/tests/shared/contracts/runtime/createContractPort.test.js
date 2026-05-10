const { PortContractError } = require('../../../../src/shared/contracts/runtime/errors');
const createContractPort = require('../../../../src/shared/contracts/runtime/createContractPort');
const {
    arrayOf,
    entityId,
    plainObject,
    objectShape,
    tuple
} = require('../../../../src/shared/contracts/runtime/common');
const { cloneDtoArray } = require('../../../../src/shared/contracts/runtime/portUtils');

describe('createContractPort', () => {
    it('throws an aggregated error when contract methods are missing implementations', () => {
        expect(() => createContractPort({
            portName: 'BrokenPort',
            methods: {
                create: {
                    input: tuple(entityId),
                    output: objectShape({ id: entityId }, { allowExtra: true })
                },
                update: {
                    input: tuple(entityId),
                    output: objectShape({ id: entityId }, { allowExtra: true })
                }
            }
        })).toThrow([
            'Port contract validation failed for BrokenPort:',
            ' - create must define an impl() function',
            ' - update must define an impl() function'
        ].join('\n'));
    });

    it('rejects invalid input DTOs with PortContractError', async () => {
        const port = createContractPort({
            portName: 'StrictPort',
            methods: {
                getById: {
                    input: tuple(entityId),
                    output: objectShape({ id: entityId }, { allowExtra: true }),
                    impl: async (id) => ({ id })
                }
            }
        });

        await expect(port.getById('')).rejects.toBeInstanceOf(PortContractError);
        await expect(port.getById('')).rejects.toMatchObject({
            port: 'StrictPort',
            method: 'getById',
            direction: 'input',
            path: '$[0]',
            expected: 'entity id'
        });
    });

    it('rejects invalid output DTOs with PortContractError', async () => {
        const port = createContractPort({
            portName: 'StrictPort',
            methods: {
                getById: {
                    input: tuple(entityId),
                    output: objectShape({ id: entityId }, { allowExtra: true }),
                    impl: async () => ({ id: '' })
                }
            }
        });

        await expect(port.getById('user-1')).rejects.toBeInstanceOf(PortContractError);
        await expect(port.getById('user-1')).rejects.toMatchObject({
            port: 'StrictPort',
            method: 'getById',
            direction: 'output',
            path: '$.id',
            expected: 'entity id'
        });
    });

    it('passes valid DTOs without mutating the original payload', async () => {
        const payload = { id: 'entity-1', title: 'Original' };
        const port = createContractPort({
            portName: 'CloningPort',
            methods: {
                save: {
                    input: tuple(plainObject),
                    output: objectShape({
                        saved: plainObject
                    }, { allowExtra: true }),
                    impl: async (input) => {
                        input.title = 'Changed by impl';
                        return { saved: input };
                    }
                }
            }
        });

        const result = await port.save(payload);

        expect(payload).toEqual({ id: 'entity-1', title: 'Original' });
        expect(result).toEqual({
            saved: { id: 'entity-1', title: 'Changed by impl' }
        });
    });

    it('does not hide invalid array outputs when cloning DTO arrays', async () => {
        const port = createContractPort({
            portName: 'ArrayPort',
            methods: {
                list: {
                    output: arrayOf(plainObject),
                    impl: async () => cloneDtoArray({ id: 'not-an-array' })
                }
            }
        });

        await expect(port.list()).rejects.toBeInstanceOf(PortContractError);
        await expect(port.list()).rejects.toMatchObject({
            port: 'ArrayPort',
            method: 'list',
            direction: 'output',
            path: '$',
            expected: 'array of object'
        });
    });
});
