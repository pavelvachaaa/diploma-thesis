module.exports = {
    forbidden: [
        {
            name: 'no-circular',
            comment: 'Circular dependencies are disallowed.',
            severity: 'error',
            from: {},
            to: {
                circular: true
            }
        },
        {
            name: 'no-imports-from-legacy-utils-layer',
            comment: 'Legacy utils layer is removed; use platform/shared instead.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/utils(/|$)'
            }
        },
        {
            name: 'no-imports-from-legacy-db-layer',
            comment: 'Legacy db layer is removed; use platform/db via DI.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/db(/|$)'
            }
        },
        {
            name: 'internal-users-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Pilot core/internalUsers code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/internalUsers(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$)'
            }
        },
        {
            name: 'contact-inquiries-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Pilot core/contactInquiries code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/contactInquiries(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$)'
            }
        },
        {
            name: 'qualification-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Pilot core/qualification code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/qualification(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$)'
            }
        },
        {
            name: 'catalog-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Strict hexagon core/catalog code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/catalog(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$|pg$)'
            }
        },
        {
            name: 'organizations-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Strict hexagon core/organizations code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/organizations(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$|pg$)'
            }
        },
        {
            name: 'role-assignments-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Strict hexagon core/roleAssignments code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/roleAssignments(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$|pg$)'
            }
        },
        {
            name: 'section-items-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Strict hexagon core/sectionItems code must stay independent from HTTP, adapters, platform, ReBAC SQL, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/sectionItems(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes|shared/authz)(/|$)|express$|pg$)'
            }
        },
        {
            name: 'operations-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Strict hexagon core/operations code must stay independent from HTTP, adapters, platform, ReBAC SQL, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/operations(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes|shared/authz)(/|$)|express$|pg$)'
            }
        },
        {
            name: 'ai-core-no-inbound-or-outbound-runtime-imports',
            comment: 'Strict hexagon core/ai code must stay independent from HTTP, adapters, platform, and legacy domain runtime.',
            severity: 'error',
            from: {
                path: '^src/core/ai(/|$)'
            },
            to: {
                path: '^(src/(adapters|domain|middlewares|platform|routes)(/|$)|express$|pg$)'
            }
        },
        {
            name: 'pure-port-contracts-no-src-imports',
            comment: 'Core/domain port contracts must remain pure declarations without runtime or infrastructure imports.',
            severity: 'error',
            from: {
                path: '^src/(core/[^/]+/application/ports|domain/[^/]+/ports)/.*\\.port\\.js$'
            },
            to: {
                path: '^src(/|$)'
            }
        },
        {
            name: 'adapters-in-no-direct-outbound-or-platform-imports',
            comment: 'Inbound adapters must depend on application services, not outbound adapters or platform internals.',
            severity: 'error',
            from: {
                path: '^src/adapters/in(/|$)'
            },
            to: {
                path: '^src/(adapters/out|platform)(/|$)'
            }
        },
        {
            name: 'internal-users-outbound-no-inbound-imports',
            comment: 'Pilot outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/internalUsers(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'contact-inquiries-inbound-no-domain-imports',
            comment: 'Pilot contactInquiries inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/contactInquiries(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'internal-users-controller-no-domain-imports',
            comment: 'Pilot internalUsers HTTP controller must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/internalUsers/controller\\.js$'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'internal-users-routes-no-domain-outbound-or-platform-imports',
            comment: 'Pilot route composition must only depend on express, middlewares, and inbound controller wiring.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/internalUsers/admin\\.routes\\.js$'
            },
            to: {
                path: '^src/(adapters/out|domain|platform)(/|$)'
            }
        },
        {
            name: 'contact-inquiries-outbound-no-inbound-imports',
            comment: 'Pilot contactInquiries outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/contactInquiries(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'qualification-inbound-no-domain-imports',
            comment: 'Pilot qualification inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/qualification(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'catalog-inbound-no-domain-imports',
            comment: 'Strict catalog inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/catalog(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'organizations-inbound-no-domain-imports',
            comment: 'Strict organizations inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/organizations(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'role-assignments-inbound-no-domain-imports',
            comment: 'Strict roleAssignments inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/roleAssignments(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'section-items-inbound-no-domain-imports',
            comment: 'Strict sectionItems inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/sectionItems(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'operations-inbound-no-domain-imports',
            comment: 'Strict operations inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/operations(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'ai-inbound-no-domain-imports',
            comment: 'Strict ai inbound adapters must depend on application only, not legacy domain modules.',
            severity: 'error',
            from: {
                path: '^src/adapters/in/http/ai(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'qualification-outbound-no-inbound-imports',
            comment: 'Pilot qualification outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/qualification(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'catalog-outbound-no-inbound-imports',
            comment: 'Strict catalog outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/catalog(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'organizations-outbound-no-inbound-imports',
            comment: 'Strict organizations outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/organizations(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'role-assignments-outbound-no-inbound-imports',
            comment: 'Strict roleAssignments outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/roleAssignments(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'section-items-outbound-no-inbound-imports',
            comment: 'Strict sectionItems outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/sectionItems(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'operations-outbound-no-inbound-imports',
            comment: 'Strict operations outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/operations(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'ai-outbound-no-inbound-imports',
            comment: 'Strict ai outbound adapters must not depend on inbound HTTP adapters.',
            severity: 'error',
            from: {
                path: '^src/adapters/out/.*/ai(/|$)'
            },
            to: {
                path: '^src/adapters/in(/|$)'
            }
        },
        {
            name: 'domain-no-interface-layer-imports',
            comment: 'Domain code should not depend on legacy controllers, routes, or middlewares.',
            severity: 'error',
            from: {
                path: '^src/domain(/|$)'
            },
            to: {
                path: '^src/(controllers|routes|middlewares)(/|$)'
            }
        },
        {
            name: 'domain-no-direct-utils-imports',
            comment: 'Domain code should use platform/shared facades instead of @utils internals.',
            severity: 'error',
            from: {
                path: '^src/domain(/|$)'
            },
            to: {
                path: '^src/utils(/|$)'
            }
        },
        {
            name: 'domain-no-services-imports',
            comment: 'Domain modules must not depend on legacy services layer.',
            severity: 'error',
            from: {
                path: '^src/domain(/|$)'
            },
            to: {
                path: '^src/services(/|$)'
            }
        },
        {
            name: 'qualification-no-platform-auth-lookup-dependency',
            comment: 'Qualification module must use platform/qualification adapter, not platform/auth.',
            severity: 'error',
            from: {
                path: '^src/domain/qualification(/|$)'
            },
            to: {
                path: '^src/platform/auth(/|$)'
            }
        },
        {
            name: 'no-legacy-week12-module-imports',
            comment: 'Legacy onboardingSteps/notification/email module paths are removed after domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(onboardingSteps|notification|email|email_templates)\\.service\\.js|controllers/(onboardingSteps|notification|email_templates)\\.controller\\.js|controllers/admin/onboardingForms\\.controller\\.js|repositories/(onboardingSteps|notification|email_templates)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week13-module-imports',
            comment: 'Legacy jobs/workflows module paths are removed after domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(jobs|workflows)\\.service\\.js|controllers/(jobs|workflows)\\.controller\\.js|repositories/(jobs|workflows)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week14-module-imports',
            comment: 'Legacy onboarding_documents/employee_onboarding module paths are removed after domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(onboarding_documents|employee_onboarding)\\.service\\.js|controllers/(onboarding_documents|employee_onboarding)\\.controller\\.js|repositories/(onboarding_documents|employee_onboarding)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week15-module-imports',
            comment: 'Legacy chat/organizations module paths are removed after domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(chat|organizations)\\.service\\.js|controllers/(chat|organizations)\\.controller\\.js|repositories/(chat|organizations)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week16-module-imports',
            comment: 'Legacy role-assignments/section-items module paths are removed after domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(role-assignments|section_items)\\.service\\.js|controllers/(role-assignments|section_items)\\.controller\\.js|repositories/(role-assignments|section_items)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week17-module-imports',
            comment: 'Legacy cv_analysis/job_seeker_cv_analysis module paths are removed after domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(cv_analysis|job_seeker_cv_analysis)\\.service\\.js|controllers/(cv_analysis|job_seeker_cv_analysis)\\.controller\\.js|repositories/(cv_analysis|job_seeker_cv_analysis)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week17-consumer-service-imports',
            comment: 'Legacy Rabbit consumer services were moved to domain events in Week 17.1.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/services/(cv_analysis_consumer|job_seeker_cv_consumer|job_embeddings_consumer)\\.service\\.js$'
            }
        },
        {
            name: 'no-legacy-week18-module-imports',
            comment: 'Legacy catalog/ai module paths are removed after Week 18 domain cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(services/(contract_types|job_roles|document_types|job_posting_statuses|ai_data_chat|ai_job_chat)\\.service\\.js|controllers/(contract_types|job_roles|document_types|job_posting_statuses|ai_data_chat|ai_job_chat)\\.controller\\.js|repositories/(contract_types|job_roles|document_types|job_posting_statuses)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week19-module-imports',
            comment: 'Legacy applicants/interviews flat-layer paths are removed after Week 19 cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(controllers/(applicants|calendar)\\.controller\\.js|repositories/(applicants|attachments|notes|status|calendar)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week20-module-imports',
            comment: 'Legacy jobSeekers/jobEmbeddings flat-layer paths are removed after Week 20 cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(controllers/job_seekers\\.controller\\.js|services/(job_seekers|job_embeddings)\\.service\\.js|repositories/(job_seekers|job_embeddings)\\.repository\\.js)$'
            }
        },
        {
            name: 'no-legacy-week21-module-imports',
            comment: 'Legacy operations/outbox flat-layer paths are removed after Week 21 cutover.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/(controllers/(audit|outbox)\\.controller\\.js|services/audit\\.service\\.js|repositories/audit\\.repository\\.js|services/side_effect_outbox\\.service\\.js|services/side_effect_outbox/.*|repositories/side_effect_outbox\\.repository\\.js)$'
            }
        },
    
        {
            name: 'no-business-side-effect-adapters-outside-outbox',
            comment: 'Business side-effect adapters must be used only inside side-effect outbox internals.',
            severity: 'error',
            from: {
                path: '^src/(domain|services|platform)(/|$)',
                pathNot: '^src/platform/outbox(/|$)'
            },
            to: {
                path: '^src/platform/(email/index\\.js|rabbitmq/index\\.js)$'
            }
        },
        {
            name: 'no-direct-email-service-slice-imports',
            comment: 'Import email service internals only through module entrypoints.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/email/service(/|$)'
            },
            to: {
                path: '^src/domain/email/service/(?!index\\.js$|templates\\.js$).+\\.js$'
            }
        },
        {
            name: 'no-direct-interviews-controller-slice-imports',
            comment: 'Import interviews controller internals only through controller index.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/interviews/controller(/|$)'
            },
            to: {
                path: '^src/domain/interviews/controller/(?!index\\.js$).+\\.js$'
            }
        },
        {
            name: 'no-direct-interviews-repository-slice-imports',
            comment: 'Import interviews repository internals only through repository index.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/interviews/repository(/|$)'
            },
            to: {
                path: '^src/domain/interviews/repository/(?!index\\.js$).+\\.js$'
            }
        },
        {
            name: 'no-direct-onboarding-documents-service-slice-imports',
            comment: 'Import onboardingDocuments service internals only through service index.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/onboardingDocuments/service(/|$)'
            },
            to: {
                path: '^src/domain/onboardingDocuments/service/(?!index\\.js$).+\\.js$'
            }
        },
        {
            name: 'no-direct-onboarding-documents-repository-slice-imports',
            comment: 'Import onboardingDocuments repository internals only through repository index.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/onboardingDocuments/repository(/|$)'
            },
            to: {
                path: '^src/domain/onboardingDocuments/repository/(?!index\\.js$).+\\.js$'
            }
        },
        {
            name: 'no-direct-notification-service-slice-imports',
            comment: 'Import notification service internals only through service index.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/notification/service(/|$)'
            },
            to: {
                path: '^src/domain/notification/service/(?!index\\.js$).+\\.js$'
            }
        },
        {
            name: 'no-direct-applicants-controller-slice-imports',
            comment: 'Import applicants controller internals only through controller index.',
            severity: 'error',
            from: {
                path: '^src(/|$)',
                pathNot: '^src/domain/applicants/controller(/|$)'
            },
            to: {
                path: '^src/domain/applicants/controller/(?!index\\.js$).+\\.js$'
            }
        },
        {
            name: 'domain-no-application-layer-paths',
            comment: 'The application/ folder name is deprecated in domain modules.',
            severity: 'error',
            from: {
                path: '^src(/|$)'
            },
            to: {
                path: '^src/domain/[^/]+/application(/|$)'
            }
        },
        {
            name: 'platform-no-domain-imports',
            comment: 'Platform layer should stay independent from domain modules.',
            severity: 'error',
            from: {
                path: '^src/platform(/|$)'
            },
            to: {
                path: '^src/domain(/|$)'
            }
        },
        {
            name: 'services-no-controller-imports',
            comment: 'Application services should not import HTTP controllers directly.',
            severity: 'error',
            from: {
                path: '^src/services(/|$)'
            },
            to: {
                path: '^src/controllers(/|$)'
            }
        },
        {
            name: 'controllers-no-repository-imports',
            comment: 'Controllers should use services/domain applications, not repositories directly.',
            severity: 'error',
            from: {
                path: '^src/controllers(/|$)'
            },
            to: {
                path: '^src/repositories(/|$)'
            }
        },
        {
            name: 'routes-no-repository-imports',
            comment: 'Routes should not import repositories directly.',
            severity: 'error',
            from: {
                path: '^src/routes(/|$)'
            },
            to: {
                path: '^src/repositories(/|$)'
            }
        },
        {
            name: 'routes-no-direct-shared-file-helper-imports',
            comment: 'Routes must use DI-injected fileHandler/fileDownload instead of direct shared file helper imports.',
            severity: 'error',
            from: {
                path: '^src/routes(/|$)'
            },
            to: {
                path: '^src/shared/file/(upload|download)(\\.js)?$'
            }
        },
        {
            name: 'domain-auth-controller-only-service',
            comment: 'Auth controllers may depend only on auth service.',
            severity: 'error',
            from: {
                path: '^src/domain/auth/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/auth/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-employees-controller-only-service',
            comment: 'Employees controllers may depend only on employees service.',
            severity: 'error',
            from: {
                path: '^src/domain/employees/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/employees/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-applicants-controller-only-service',
            comment: 'Applicants controllers may depend only on applicants service and controller-local slices.',
            severity: 'error',
            from: {
                path: '^src/domain/applicants/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/applicants/(service|controller)(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-interviews-controller-only-service',
            comment: 'Interviews controllers may depend only on interviews service and controller-local slices.',
            severity: 'error',
            from: {
                path: '^src/domain/interviews/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/interviews/(service|controller)(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-documents-controller-only-service',
            comment: 'Documents controllers may depend only on documents service.',
            severity: 'error',
            from: {
                path: '^src/domain/documents/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/documents/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-cv-controller-only-service',
            comment: 'CV controllers may depend only on cv service.',
            severity: 'error',
            from: {
                path: '^src/domain/cv/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/cv/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-onboarding-steps-controller-only-service',
            comment: 'Onboarding steps controllers may depend only on onboarding steps service.',
            severity: 'error',
            from: {
                path: '^src/domain/onboardingSteps/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/onboardingSteps/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-notification-controller-only-service',
            comment: 'Notification controllers may depend only on notification service.',
            severity: 'error',
            from: {
                path: '^src/domain/notification/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/notification/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-email-controller-only-service',
            comment: 'Email controllers may depend only on email service.',
            severity: 'error',
            from: {
                path: '^src/domain/email/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/email/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-jobs-controller-only-service',
            comment: 'Jobs controllers may depend only on jobs service.',
            severity: 'error',
            from: {
                path: '^src/domain/jobs/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/jobs/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-workflows-controller-only-service',
            comment: 'Workflows controllers may depend only on workflows service.',
            severity: 'error',
            from: {
                path: '^src/domain/workflows/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/workflows/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-job-seekers-controller-only-service',
            comment: 'JobSeekers controllers may depend only on jobSeekers service.',
            severity: 'error',
            from: {
                path: '^src/domain/jobSeekers/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/jobSeekers/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-onboarding-documents-controller-only-service',
            comment: 'Onboarding documents controllers may depend only on onboardingDocuments service and controller-local slices.',
            severity: 'error',
            from: {
                path: '^src/domain/onboardingDocuments/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/onboardingDocuments/(service|controller)(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-employee-onboarding-controller-only-service',
            comment: 'Employee onboarding controllers may depend only on employeeOnboarding service.',
            severity: 'error',
            from: {
                path: '^src/domain/employeeOnboarding/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/employeeOnboarding/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-chat-controller-only-service',
            comment: 'Chat controllers may depend only on chat service.',
            severity: 'error',
            from: {
                path: '^src/domain/chat/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/chat/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-organizations-controller-only-service',
            comment: 'Organizations controllers may depend only on organizations service.',
            severity: 'error',
            from: {
                path: '^src/domain/organizations/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/organizations/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-role-assignments-controller-only-service',
            comment: 'Role assignments controllers may depend only on roleAssignments service.',
            severity: 'error',
            from: {
                path: '^src/domain/roleAssignments/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/roleAssignments/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-section-items-controller-only-service',
            comment: 'Section items controllers may depend only on sectionItems service.',
            severity: 'error',
            from: {
                path: '^src/domain/sectionItems/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/sectionItems/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-cv-analysis-controller-only-service',
            comment: 'CV analysis controllers may depend only on cvAnalysis service.',
            severity: 'error',
            from: {
                path: '^src/domain/cvAnalysis/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/cvAnalysis/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-job-seeker-cv-analysis-controller-only-service',
            comment: 'Job seeker CV analysis controllers may depend only on jobSeekerCvAnalysis service.',
            severity: 'error',
            from: {
                path: '^src/domain/jobSeekerCvAnalysis/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/jobSeekerCvAnalysis/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-catalog-controller-only-service',
            comment: 'Catalog controllers may depend only on catalog service.',
            severity: 'error',
            from: {
                path: '^src/domain/catalog/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/catalog/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-ai-controller-only-service',
            comment: 'AI controllers may depend only on ai service.',
            severity: 'error',
            from: {
                path: '^src/domain/ai/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/ai/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-operations-controller-only-service',
            comment: 'Operations controllers may depend only on operations services.',
            severity: 'error',
            from: {
                path: '^src/domain/operations/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/operations/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-qualification-controller-only-service',
            comment: 'Qualification controllers may depend only on qualification service.',
            severity: 'error',
            from: {
                path: '^src/domain/qualification/controller(/|$)'
            },
            to: {
                pathNot: '^src/domain/qualification/service(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-auth-service-dependency-direction',
            comment: 'Auth service may depend only on auth repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/auth/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/auth/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-employees-service-dependency-direction',
            comment: 'Employees service may depend only on employees repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/employees/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/employees/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-applicants-service-dependency-direction',
            comment: 'Applicants service may depend only on applicants repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/applicants/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/applicants/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-interviews-service-dependency-direction',
            comment: 'Interviews service may depend only on interviews repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/interviews/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/interviews/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-documents-service-dependency-direction',
            comment: 'Documents service may depend only on documents repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/documents/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/documents/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-cv-service-dependency-direction',
            comment: 'CV service may depend only on cv repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/cv/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/cv/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-onboarding-steps-service-dependency-direction',
            comment: 'Onboarding steps service may depend only on onboardingSteps repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/onboardingSteps/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/onboardingSteps/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-notification-service-dependency-direction',
            comment: 'Notification service may depend only on notification repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/notification/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/notification/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-email-service-dependency-direction',
            comment: 'Email service may depend only on email repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/email/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/email/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-jobs-service-dependency-direction',
            comment: 'Jobs service may depend only on jobs repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/jobs/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/jobs/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-workflows-service-dependency-direction',
            comment: 'Workflows service may depend only on workflows repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/workflows/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/workflows/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-onboarding-documents-service-dependency-direction',
            comment: 'Onboarding documents service may depend only on onboardingDocuments repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/onboardingDocuments/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/onboardingDocuments/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-employee-onboarding-service-dependency-direction',
            comment: 'Employee onboarding service may depend only on employeeOnboarding repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/employeeOnboarding/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/employeeOnboarding/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-chat-service-dependency-direction',
            comment: 'Chat service may depend only on chat repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/chat/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/chat/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-organizations-service-dependency-direction',
            comment: 'Organizations service may depend only on organizations repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/organizations/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/organizations/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-role-assignments-service-dependency-direction',
            comment: 'Role assignments service may depend only on roleAssignments repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/roleAssignments/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/roleAssignments/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-section-items-service-dependency-direction',
            comment: 'Section items service may depend only on sectionItems repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/sectionItems/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/sectionItems/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-cv-analysis-service-dependency-direction',
            comment: 'CV analysis service may depend only on cvAnalysis repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/cvAnalysis/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/cvAnalysis/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-job-seeker-cv-analysis-service-dependency-direction',
            comment: 'Job seeker CV analysis service may depend only on jobSeekerCvAnalysis repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/jobSeekerCvAnalysis/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/jobSeekerCvAnalysis/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-catalog-service-dependency-direction',
            comment: 'Catalog service may depend only on catalog repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/catalog/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/catalog/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-ai-service-dependency-direction',
            comment: 'AI service may depend only on ai repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/ai/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/ai/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-job-seekers-service-dependency-direction',
            comment: 'JobSeekers service may depend only on jobSeekers repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/jobSeekers/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/jobSeekers/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-operations-service-dependency-direction',
            comment: 'Operations services may depend only on operations repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/operations/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/operations/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-qualification-service-dependency-direction',
            comment: 'Qualification service may depend only on qualification repository/events/platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/qualification/service(/|$)'
            },
            to: {
                pathNot: '^src/domain/qualification/(service|repository|events)(/|$)|^src/platform(/|$)|^src/shared(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-auth-repository-direction',
            comment: 'Auth repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/auth/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/auth/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-employees-repository-direction',
            comment: 'Employees repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/employees/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/employees/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-applicants-repository-direction',
            comment: 'Applicants repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/applicants/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/applicants/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-interviews-repository-direction',
            comment: 'Interviews repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/interviews/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/interviews/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-documents-repository-direction',
            comment: 'Documents repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/documents/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/documents/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-cv-repository-direction',
            comment: 'CV repository may depend only on platform/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/cv/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform(/|$)|^src/shared(/|$)|^src/domain/cv/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-onboarding-steps-repository-direction',
            comment: 'Onboarding steps repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/onboardingSteps/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/onboardingSteps/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-notification-repository-direction',
            comment: 'Notification repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/notification/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/notification/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-email-repository-direction',
            comment: 'Email repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/email/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/email/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-jobs-repository-direction',
            comment: 'Jobs repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/jobs/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/jobs/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-workflows-repository-direction',
            comment: 'Workflows repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/workflows/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/workflows/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-job-seekers-repository-direction',
            comment: 'JobSeekers repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/jobSeekers/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/jobSeekers/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-onboarding-documents-repository-direction',
            comment: 'Onboarding documents repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/onboardingDocuments/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/onboardingDocuments/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-employee-onboarding-repository-direction',
            comment: 'Employee onboarding repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/employeeOnboarding/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/employeeOnboarding/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-chat-repository-direction',
            comment: 'Chat repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/chat/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/chat/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-organizations-repository-direction',
            comment: 'Organizations repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/organizations/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/organizations/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-role-assignments-repository-direction',
            comment: 'Role assignments repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/roleAssignments/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/roleAssignments/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-section-items-repository-direction',
            comment: 'Section items repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/sectionItems/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/sectionItems/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-cv-analysis-repository-direction',
            comment: 'CV analysis repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/cvAnalysis/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/cvAnalysis/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-job-seeker-cv-analysis-repository-direction',
            comment: 'Job seeker CV analysis repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/jobSeekerCvAnalysis/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/jobSeekerCvAnalysis/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-catalog-repository-direction',
            comment: 'Catalog repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/catalog/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/catalog/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-ai-repository-direction',
            comment: 'AI repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/ai/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/ai/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-operations-repository-direction',
            comment: 'Operations repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/operations/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/operations/repository(/|$)|^node_modules(/|$)|^node:'
            }
        },
        {
            name: 'domain-qualification-repository-direction',
            comment: 'Qualification repository may depend only on platform/db/shared.',
            severity: 'error',
            from: {
                path: '^src/domain/qualification/repository(/|$)'
            },
            to: {
                pathNot: '^src/platform/db(/|$)|^src/shared(/|$)|^src/domain/qualification/repository(/|$)|^node_modules(/|$)|^node:'
            }
        }
    ],
    options: {
        includeOnly: '^src',
        doNotFollow: {
            path: 'node_modules'
        },
        exclude: {
            path: '(^|/)(tests|tests-integration)(/|$)|\\.test\\.js$|\\.md$'
        },
        enhancedResolveOptions: {
            exportsFields: ['exports'],
            conditionNames: ['import', 'require', 'node', 'default', 'types'],
            extensions: ['.js', '.json'],
            mainFields: ['main', 'types', 'typings'],
            aliasFields: ['_moduleAliases']
        },
        reporterOptions: {
            dot: {
                collapsePattern: 'node_modules/[^/]+'
            }
        }
    }
};
