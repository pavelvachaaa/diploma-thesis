const path = require('node:path');
const { createContainer, asFunction, asValue, InjectionMode } = require('awilix');
const registry = require('@/container.registry');

const container = createContainer({ injectionMode: InjectionMode.PROXY });

const toSingletonFactory = (factory) => asFunction(factory).singleton();

const registerInfrastructure = (infrastructure = {}) => {
    const registrations = {};

    for (const [token, definition] of Object.entries(infrastructure)) {
        if (definition?.type === 'value') {
            registrations[token] = asValue(require(definition.modulePath));
            continue;
        }

        registrations[token] = toSingletonFactory(require(definition.modulePath));
    }

    container.register(registrations);
};

const registerFactoryMap = (entries = {}) => {
    const registrations = {};

    for (const [token, modulePath] of Object.entries(entries)) {
        registrations[token] = toSingletonFactory(require(modulePath));
    }

    container.register(registrations);
};

const resolveDomainFactory = (moduleDefinition, registrationEntry) => {
    if (typeof registrationEntry === 'function') {
        return registrationEntry;
    }

    if (typeof registrationEntry === 'string') {
        return require(path.join(moduleDefinition.basePath, registrationEntry));
    }

    throw new Error(`Unsupported domain registration entry in module "${moduleDefinition.name}"`);
};

const registerDomainModules = (modulePaths = []) => {
    for (const modulePath of modulePaths) {
        const moduleDefinition = require(modulePath);

        if (!moduleDefinition || typeof moduleDefinition !== 'object') {
            throw new Error(`Invalid domain module definition at ${modulePath}`);
        }

        if (!moduleDefinition.basePath || !moduleDefinition.registrations) {
            throw new Error(`Domain module "${moduleDefinition.name || modulePath}" is missing basePath or registrations`);
        }

        const moduleRegistrations = {};
        for (const [token, registrationEntry] of Object.entries(moduleDefinition.registrations)) {
            moduleRegistrations[token] = toSingletonFactory(
                resolveDomainFactory(moduleDefinition, registrationEntry)
            );
        }

        container.register(moduleRegistrations);
    }
};

registerInfrastructure(registry.infrastructure);
registerFactoryMap(registry.outboundAdapters);
registerFactoryMap(registry.services);
registerFactoryMap(registry.controllers);
registerDomainModules(registry.domainModules);
registerFactoryMap(registry.routes);

module.exports = container;
