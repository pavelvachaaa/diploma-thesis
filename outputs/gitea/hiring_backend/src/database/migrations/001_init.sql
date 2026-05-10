comment on database postgres is 'default administrative connection database';

create type notification_channel as enum('in_app', 'email');

alter type notification_channel owner to admin;

create type notification_status as enum('pending', 'sent', 'failed', 'skipped');

alter type notification_status owner to admin;

create table organizations (
  id uuid not null primary key,
  name varchar(255) not null constraint organizations_name_unique unique,
  seat_location varchar(3) not null constraint organizations_location_unique unique,
  address text,
  contact_email varchar(255)
);

CREATE TABLE section_type (
  code VARCHAR(32) PRIMARY KEY,   -- e.g. 'DUTIES', 'REQUIREMENTS', 'BENEFITS'
  name TEXT NOT NULL              -- display label
);



alter table organizations owner to admin;

create index idx_organizations_name on organizations (name);

create table job_role_classifications (
  code text not null primary key,
  label text not null,
  description text
);

alter table job_role_classifications owner to admin;

create table job_roles (
  id uuid not null primary key,
  name varchar(255) not null,
  description text,
  organization_id uuid constraint job_roles_organization_id_foreign references organizations on delete cascade,
  classification_code text constraint job_roles_classification_code_foreign references job_role_classifications on delete set null
);

alter table job_roles owner to admin;

create index idx_job_roles_org on job_roles (organization_id);

create index idx_job_roles_classification on job_roles (classification_code);

create table onboarding_workflows (
  id uuid not null primary key,
  name varchar(255) not null,
  description text,
  organization_id uuid constraint onboarding_workflows_organization_id_foreign references organizations on delete cascade,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  is_template boolean default false,
  is_active boolean default true,
  created_by uuid,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP
);

alter table onboarding_workflows owner to admin;

create index idx_workflows_org on onboarding_workflows (organization_id);

create table contract_types (code text not null primary key, description text);

alter table contract_types owner to admin;

create table job_posting_statuses (
  code text not null primary key,
  label text not null,
  description text
);

alter table job_posting_statuses owner to admin;

create table job_postings (
  id uuid not null primary key,
  title varchar(255) not null,
  description text,
  job_role_id uuid constraint job_postings_job_role_id_foreign references job_roles on delete set null,
  onboarding_workflow_id uuid constraint job_postings_onboarding_workflow_id_foreign references onboarding_workflows on delete set null,
  organization_id uuid constraint job_postings_organization_id_foreign references organizations on delete cascade,
  status text default 'draft' not null constraint job_postings_status_foreign references job_posting_statuses on delete set null,
  salary_min integer,
  salary_max integer,
  short_description varchar(200),
  contract_type_code text constraint job_postings_contract_type_code_foreign references contract_types on delete set null,
  department varchar(255),
  is_department_accredited boolean default false not null,
  publish_date date,
  expire_date date,
  contact_email varchar(255),
  contact_phone varchar(255),
  cv_required boolean default true not null,
  created_by uuid,
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

alter table job_postings owner to admin;

create index idx_job_postings_org on job_postings (organization_id);

create index idx_job_postings_role on job_postings (job_role_id);

-- Section types with name as primary key
create table job_posting_section_types (
  name varchar(255) not null primary key,
  description text
);

alter table job_posting_section_types owner to admin;

-- Catalog of predefined section items (shared across roles and postings)
create table section_items (
  id uuid not null primary key,
  section_type_name varchar(255) not null constraint section_items_section_type_name_foreign references job_posting_section_types on delete cascade,
  item_text text not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  order_index integer default 0 not null
);

alter table section_items owner to admin;

create index idx_section_items_type on section_items (section_type_name);

-- Job role section items (can reference catalog or have custom text)
create table job_role_section_items (
  id uuid not null primary key,
  job_role_id uuid constraint job_role_section_items_job_role_id_foreign references job_roles on delete cascade,
  section_type_name varchar(255) not null constraint job_role_section_items_section_type_name_foreign references job_posting_section_types on delete cascade,
  section_item_id uuid constraint job_role_section_items_section_item_id_foreign references section_items on delete set null,
  custom_text text,
  order_index integer default 0 not null,
  constraint job_role_section_items_text_check check (
    (section_item_id is not null) or (custom_text is not null)
  )
);

alter table job_role_section_items owner to admin;

create index idx_job_role_section_items_role on job_role_section_items (job_role_id);
create index idx_job_role_section_items_type on job_role_section_items (section_type_name);

-- Job posting section items (copy-on-create from role)
create table job_posting_section_items (
  id uuid not null primary key,
  job_posting_id uuid constraint job_posting_section_items_job_posting_id_foreign references job_postings on delete cascade,
  section_type_name varchar(255) not null constraint job_posting_section_items_section_type_name_foreign references job_posting_section_types on delete cascade,
  item_text text not null,
  order_index integer default 0 not null
);

alter table job_posting_section_items owner to admin;

create index idx_section_items_post_type on job_posting_section_items (job_posting_id, section_type_name);

create table application_statuses (
  name varchar(255) not null primary key,
  description text
);

alter table application_statuses owner to admin;

create table applicants (
  id uuid not null primary key,
  name varchar(255) not null,
  surname varchar(255) not null,
  email varchar(255) not null,
  phone varchar(255),
  address varchar(255),
  city varchar(255),
  zip varchar(255),
  education varchar(255),
  field varchar(255),
  experience varchar(255),
  last_employer varchar(255),
  last_position varchar(255),
  gdpr_consent boolean default false,
  current_status varchar(255) constraint applicants_current_status_foreign references application_statuses,
  applied_at timestamp with time zone default CURRENT_TIMESTAMP,
  job_posting_id uuid constraint applicants_job_posting_id_foreign references job_postings,
  organization_id uuid constraint applicants_organization_id_foreign references organizations
);

alter table applicants owner to admin;

create index idx_applicants_org on applicants (organization_id);

create table users (
  id uuid not null primary key,
  applicant_id uuid constraint users_applicant_id_foreign references applicants,
  email varchar(255) not null,
  name varchar(255) not null,
  surname varchar(255) not null,
  phone varchar(255),
  password_hash text,
  is_active boolean default true,
  onboarding_workflow_id uuid constraint users_onboarding_workflow_id_foreign references onboarding_workflows,
  organization_id uuid constraint users_organization_id_foreign references organizations,
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

alter table users owner to admin;

alter table onboarding_workflows
add constraint onboarding_workflows_created_by_foreign foreign key (created_by) references users on delete set null;

alter table job_postings
add constraint job_postings_created_by_foreign foreign key (created_by) references users on delete set null;

create index idx_users_org on users (organization_id);

create table applicant_status_history (
  id uuid not null primary key,
  applicant_id uuid constraint applicant_status_history_applicant_id_foreign references applicants on delete cascade,
  status_name varchar(255) constraint applicant_status_history_status_name_foreign references application_statuses,
  changed_at timestamp with time zone default CURRENT_TIMESTAMP,
  changed_by uuid constraint applicant_status_history_changed_by_foreign references users,
  notes text
);

alter table applicant_status_history owner to admin;

create index idx_status_history_applicant on applicant_status_history (applicant_id);

create table document_types (
  id uuid not null primary key,
  name varchar(255) not null constraint document_types_name_unique unique,
  description text
);

alter table document_types owner to admin;

create table onboarding_documents (
  id uuid not null primary key,
  name varchar(255) not null,
  description text,
  type_id uuid constraint onboarding_documents_type_id_foreign references document_types,
  organization_id uuid constraint onboarding_documents_organization_id_foreign references organizations on delete cascade,
  required boolean default true,
  applies_to_all_organizations boolean default false,
  file_name varchar(255),
  file_path varchar(255),
  mime_type varchar(255),
  file_size bigint,
  uploaded_at timestamp with time zone,
  is_template boolean default true,
  status text default 'active'::text constraint onboarding_documents_status_check check (
    status = ANY (
      ARRAY['draft'::text, 'active'::text, 'archived'::text]
    )
  )
);

alter table onboarding_documents owner to admin;

create index idx_onboarding_docs_org on onboarding_documents (organization_id);

create table job_role_required_documents (
  id uuid not null primary key,
  job_role_id uuid constraint job_role_required_documents_job_role_id_foreign references job_roles,
  document_id uuid constraint job_role_required_documents_document_id_foreign references onboarding_documents,
  is_mandatory boolean default true
);

alter table job_role_required_documents owner to admin;

create index idx_required_docs_role on job_role_required_documents (job_role_id);

create table onboarding_steps (
  id uuid not null primary key,
  title varchar(255) not null,
  description text,
  step_type text not null constraint onboarding_steps_step_type_check check (
    step_type = ANY (
      ARRAY[
        'info'::text,
        'ack'::text,
        'form'::text,
        'quiz'::text,
        'file'::text
      ]
    )
  ),
  content_url text,
  acknowledgment_text text,
  organization_id uuid constraint onboarding_steps_organization_id_foreign references organizations on delete cascade,
  is_mandatory boolean default true,
  order_index integer not null,
  days_from_start integer default 0,
  duration_days integer default 1,
  auto_assign boolean default false,
  instructions text,
  metadata jsonb,
  form jsonb default '{}'::jsonb not null,
  form_status varchar(255) default 'published'::character varying not null constraint onboarding_steps_form_status_check check (
    (form_status)::text = ANY (
      (
        ARRAY[
          'draft'::character varying,
          'published'::character varying
        ]
      )::text[]
    )
  )
);

alter table onboarding_steps owner to admin;

create index idx_onboarding_steps_org on onboarding_steps (organization_id);

create index idx_onboarding_steps_form_gin on onboarding_steps using gin (form jsonb_path_ops);

create index idx_onboarding_steps_form_status on onboarding_steps (form_status);

create table workflow_steps (
  id uuid not null primary key,
  workflow_id uuid constraint workflow_steps_workflow_id_foreign references onboarding_workflows on delete cascade,
  onboarding_step_id uuid constraint workflow_steps_onboarding_step_id_foreign references onboarding_steps on delete cascade,
  order_index integer not null
);

alter table workflow_steps owner to admin;

create index idx_workflow_steps_workflow on workflow_steps (workflow_id);

create table step_quizzes (
  id uuid not null primary key,
  onboarding_step_id uuid constraint step_quizzes_onboarding_step_id_foreign references onboarding_steps on delete cascade,
  title varchar(255),
  passing_score integer not null
);

alter table step_quizzes owner to admin;

create table step_quiz_questions (
  id uuid not null primary key,
  quiz_id uuid constraint step_quiz_questions_quiz_id_foreign references step_quizzes on delete cascade,
  question text not null,
  question_type text not null constraint step_quiz_questions_question_type_check check (
    question_type = ANY (
      ARRAY['single_choice'::text, 'multi_choice'::text]
    )
  ),
  options text[] not null,
  correct_answers text[] not null,
  explanation text,
  order_index integer
);

alter table step_quiz_questions owner to admin;

create index idx_quiz_questions_quiz on step_quiz_questions (quiz_id);

create table user_onboarding_steps (
  id uuid not null primary key,
  user_id uuid constraint user_onboarding_steps_user_id_foreign references users on delete cascade,
  onboarding_step_id uuid constraint user_onboarding_steps_onboarding_step_id_foreign references onboarding_steps on delete cascade,
  completed_at timestamp with time zone,
  status text default 'not_started'::text constraint user_onboarding_steps_status_check check (
    status = ANY (
      ARRAY[
        'not_started'::text,
        'in_progress'::text,
        'completed'::text,
        'skipped'::text
      ]
    )
  ),
  acknowledged boolean,
  quiz_score integer,
  passed boolean,
  form_response jsonb,
  validation_status varchar(255) default 'unvalidated'::character varying not null constraint user_onboarding_steps_validation_status_check check (
    (validation_status)::text = ANY (
      (
        ARRAY[
          'unvalidated'::character varying,
          'valid'::character varying,
          'invalid'::character varying
        ]
      )::text[]
    )
  ),
  submitted_at timestamp with time zone,
  constraint user_onboarding_steps_user_step_unique unique (user_id, onboarding_step_id)
);

alter table user_onboarding_steps owner to admin;

create index idx_user_steps_user on user_onboarding_steps (user_id);

create index idx_user_onboarding_steps_response_gin on user_onboarding_steps using gin (form_response jsonb_path_ops);

create index idx_user_onboarding_steps_user_id on user_onboarding_steps (user_id);

create index idx_user_onboarding_steps_step_id on user_onboarding_steps (onboarding_step_id);

create table user_quiz_answers (
  id uuid not null primary key,
  user_step_id uuid constraint user_quiz_answers_user_step_id_foreign references user_onboarding_steps on delete cascade,
  question_id uuid constraint user_quiz_answers_question_id_foreign references step_quiz_questions on delete cascade,
  selected_answers text[] not null,
  is_correct boolean not null,
  answered_at timestamp with time zone default CURRENT_TIMESTAMP
);

alter table user_quiz_answers owner to admin;

create index idx_user_quiz_answers_userstep on user_quiz_answers (user_step_id);

create table user_roles (
  id uuid not null primary key,
  name varchar(255) not null constraint user_roles_name_unique unique,
  description text
);

alter table user_roles owner to admin;

create table organization_memberships (
  id uuid not null primary key,
  user_id uuid constraint organization_memberships_user_id_foreign references users on delete cascade,
  organization_id uuid constraint organization_memberships_organization_id_foreign references organizations on delete cascade,
  role_id uuid constraint organization_memberships_role_id_foreign references user_roles,
  assigned_at timestamp with time zone default CURRENT_TIMESTAMP,
  expires_at timestamp with time zone,
  assignment_type varchar(10) default 'manual' check (assignment_type in ('auto', 'manual')),
  assigned_by uuid constraint organization_memberships_assigned_by_foreign references users(id),
  notes text
);

alter table organization_memberships owner to admin;

create index idx_memberships_user_org on organization_memberships (user_id, organization_id);
create index idx_memberships_expiration on organization_memberships (expires_at) where expires_at is not null;
-- This indexes permanent memberships and allows the DB to 
-- quickly find rows to check against the current time.
create index idx_memberships_user_active on organization_memberships (user_id, organization_id) where expires_at is null;
alter table organization_memberships add constraint unique_user_org_membership unique (user_id, organization_id);

comment on column organization_memberships.expires_at is 'Null = permanent role, timestamp = role expires at this time';
comment on column organization_memberships.assignment_type is 'auto = SSO/OAuth assigned (immutable), manual = admin assigned (can be modified/deleted)';
comment on column organization_memberships.assigned_by is 'Admin user who assigned this role (null for auto assignments)';
comment on column organization_memberships.notes is 'Optional notes about why this role was assigned (for manual assignments)';

create table applicant_notes (
  id uuid not null primary key,
  applicant_id uuid not null constraint applicant_notes_applicant_id_foreign references applicants on delete cascade,
  author_id uuid constraint applicant_notes_author_id_foreign references users on delete set null,
  note text not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP
);

alter table applicant_notes owner to admin;

create index idx_applicant_notes_applicant on applicant_notes (applicant_id);

create index idx_applicant_notes_author on applicant_notes (author_id);

create table document_statuses (
  name varchar(255) not null primary key,
  description text,
  color varchar(255)
);

alter table document_statuses owner to admin;

create table application_attachments (
  id uuid not null primary key,
  applicant_id uuid constraint application_attachments_applicant_id_foreign references applicants on delete cascade,
  filename varchar(255) not null,
  original_filename varchar(255) not null,
  mime_type varchar(255) not null,
  file_size integer,
  file_path text not null,
  uploaded_at timestamp with time zone default CURRENT_TIMESTAMP,
  status varchar(255) default 'pending'::character varying constraint application_attachments_status_foreign references document_statuses,
  reviewed_by uuid constraint application_attachments_reviewed_by_foreign references users,
  reviewed_at timestamp with time zone,
  review_notes text
);

alter table application_attachments owner to admin;

create index idx_attachments_applicant on application_attachments (applicant_id);

create table user_documents (
  id uuid not null primary key,
  user_id uuid constraint user_documents_user_id_foreign references users on delete cascade,
  document_id uuid constraint user_documents_document_id_foreign references onboarding_documents,
  file_path text,
  filename varchar(255),
  original_filename varchar(255),
  mime_type varchar(255),
  file_size integer,
  uploaded_at timestamp with time zone,
  reviewed_by uuid constraint user_documents_reviewed_by_foreign references users,
  reviewed_at timestamp with time zone,
  review_notes text,
  status varchar(255) default 'pending'::character varying constraint user_documents_status_foreign references document_statuses
);

alter table user_documents owner to admin;

create index idx_user_documents_user on user_documents (user_id);

create table job_role_workflows (
  id uuid default gen_random_uuid () not null primary key,
  job_role_id uuid constraint job_role_workflows_job_role_id_foreign references job_roles on delete cascade,
  workflow_id uuid constraint job_role_workflows_workflow_id_foreign references onboarding_workflows on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint job_role_workflows_job_role_id_workflow_id_unique unique (job_role_id, workflow_id)
);

alter table job_role_workflows owner to admin;

create table user_onboarding_progress (
  id uuid default gen_random_uuid () not null primary key,
  user_id uuid constraint user_onboarding_progress_user_id_foreign references users on delete cascade,
  workflow_id uuid constraint user_onboarding_progress_workflow_id_foreign references onboarding_workflows on delete cascade,
  start_date date not null,
  expected_completion_date date,
  actual_completion_date date,
  status text default 'not_started'::text constraint user_onboarding_progress_status_check check (
    status = ANY (
      ARRAY[
        'not_started'::text,
        'in_progress'::text,
        'completed'::text,
        'overdue'::text
      ]
    )
  ),
  notes text,
  assigned_hr uuid constraint user_onboarding_progress_assigned_hr_foreign references users on delete set null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint user_onboarding_progress_user_id_workflow_id_unique unique (user_id, workflow_id)
);

alter table user_onboarding_progress owner to admin;

create table onboarding_step_documents (
  id uuid default gen_random_uuid () not null primary key,
  onboarding_step_id uuid constraint onboarding_step_documents_onboarding_step_id_foreign references onboarding_steps on delete cascade,
  document_id uuid constraint onboarding_step_documents_document_id_foreign references onboarding_documents on delete cascade,
  is_mandatory boolean default true,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint onboarding_step_documents_onboarding_step_id_document_id_unique unique (onboarding_step_id, document_id)
);

alter table onboarding_step_documents owner to admin;

create table workflow_documents (
  id uuid not null primary key,
  workflow_id uuid constraint workflow_documents_workflow_id_foreign references onboarding_workflows on delete cascade,
  document_id uuid constraint workflow_documents_document_id_foreign references onboarding_documents on delete cascade,
  is_mandatory boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint workflow_documents_workflow_id_document_id_unique unique (workflow_id, document_id)
);

alter table workflow_documents owner to admin;

create index idx_workflow_documents_workflow on workflow_documents (workflow_id);

create table direct_messages (
  id uuid default gen_random_uuid () not null primary key,
  sender_id uuid not null constraint direct_messages_sender_id_foreign references users on delete set null,
  recipient_id uuid not null constraint direct_messages_recipient_id_foreign references users on delete cascade,
  body text,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  edited_at timestamp with time zone,
  is_deleted boolean default false not null,
  convo_a uuid generated always as (LEAST(sender_id, recipient_id)) stored,
  convo_b uuid generated always as (GREATEST(sender_id, recipient_id)) stored,
  constraint direct_messages_distinct_parties check (sender_id <> recipient_id)
);

alter table direct_messages owner to admin;

create index idx_dm_convo_created on direct_messages (convo_a asc, convo_b asc, created_at desc);

create table direct_message_attachments (
  id uuid default gen_random_uuid () not null primary key,
  message_id uuid not null constraint direct_message_attachments_message_id_foreign references direct_messages on delete cascade,
  file_path text not null,
  original_filename varchar(255) not null,
  mime_type varchar(255),
  file_size bigint,
  uploaded_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table direct_message_attachments owner to admin;

create index idx_dm_attach_msg on direct_message_attachments (message_id);

create table direct_message_reads (
  id uuid default gen_random_uuid () not null primary key,
  message_id uuid not null constraint direct_message_reads_message_id_foreign references direct_messages on delete cascade,
  user_id uuid not null constraint direct_message_reads_user_id_foreign references users on delete cascade,
  read_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint direct_message_reads_message_id_user_id_unique unique (message_id, user_id)
);

alter table direct_message_reads owner to admin;

create table notification_types (
  code text not null primary key,
  label text not null,
  description text,
  default_in_app_enabled boolean default true not null,
  default_email_enabled boolean default true not null
);

alter table notification_types owner to admin;

create table notifications (
  id uuid default gen_random_uuid () not null primary key,
  user_id uuid not null references users on delete cascade,
  type text not null references notification_types on update cascade,
  title text not null,
  body text,
  data jsonb default '{}'::jsonb not null,
  action_url text,
  read_at timestamp with time zone,
  is_archived boolean default false not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table notifications owner to admin;

create index idx_notifications_user_created on notifications (user_id asc, created_at desc);

create index idx_notifications_unread on notifications (user_id)
where
  (
    (read_at IS NULL)
    AND (is_archived = false)
  );

create table notification_deliveries (
  id uuid default gen_random_uuid () not null primary key,
  notification_id uuid not null references notifications on delete cascade,
  channel notification_channel default 'in_app'::notification_channel not null,
  status notification_status default 'pending'::notification_status not null,
  attempts integer default 0 not null,
  last_error text,
  email_to text,
  email_subject text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table notification_deliveries owner to admin;

create index idx_nd_status_created on notification_deliveries (channel, status, created_at);

create index idx_nd_notification on notification_deliveries (notification_id);

create table notification_preferences (
  id uuid default gen_random_uuid () not null primary key,
  user_id uuid not null unique references users on delete cascade,
  in_app_enabled boolean default true not null,
  email_enabled boolean default true not null,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table notification_preferences owner to admin;

create table notification_type_preferences (
  id uuid default gen_random_uuid () not null primary key,
  user_id uuid not null references users on delete cascade,
  type_code text not null references notification_types on update cascade on delete cascade,
  in_app_enabled boolean,
  email_enabled boolean,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint notification_type_prefs_unique unique (user_id, type_code)
);

alter table notification_type_preferences owner to admin;

create index idx_ntp_user_type on notification_type_preferences (user_id, type_code);

create table notification_type_audiences (
  id uuid default gen_random_uuid () not null primary key,
  type_code text not null references notification_types on update cascade on delete cascade,
  role_id uuid not null references user_roles,
  org_scoped boolean default true not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint notification_type_audiences_unique unique (type_code, role_id, org_scoped)
);

alter table notification_type_audiences owner to admin;

create index idx_nta_type on notification_type_audiences (type_code);

create index idx_nta_role on notification_type_audiences (role_id);

create function resolve_notification_pref (p_user_id uuid, p_type_code text, p_channel text) returns boolean language plpgsql as $$
    DECLARE
        v_global_in_app boolean := true;
        v_global_email  boolean := true;
        v_type_in_app   boolean;
        v_type_email    boolean;
        v_override_in_app boolean;
        v_override_email  boolean;
    BEGIN
        SELECT in_app_enabled, email_enabled
          INTO v_global_in_app, v_global_email
          FROM public.notification_preferences
         WHERE user_id = p_user_id;

        SELECT default_in_app_enabled, default_email_enabled
          INTO v_type_in_app, v_type_email
          FROM public.notification_types
         WHERE code = p_type_code;

        SELECT in_app_enabled, email_enabled
          INTO v_override_in_app, v_override_email
          FROM public.notification_type_preferences
         WHERE user_id = p_user_id AND type_code = p_type_code;

        IF p_channel = 'in_app' THEN
            IF v_override_in_app IS NOT NULL THEN
                RETURN v_override_in_app;
            END IF;
            IF v_global_in_app IS NOT NULL THEN
                RETURN v_global_in_app;
            END IF;
            IF v_type_in_app IS NOT NULL THEN
                RETURN v_type_in_app;
            END IF;
            RETURN true;
        ELSIF p_channel = 'email' THEN
            IF v_override_email IS NOT NULL THEN
                RETURN v_override_email;
            END IF;
            IF v_global_email IS NOT NULL THEN
                RETURN v_global_email;
            END IF;
            IF v_type_email IS NOT NULL THEN
                RETURN v_type_email;
            END IF;
            RETURN true;
        ELSE
            RETURN true;
        END IF;
    END;
    $$;

alter function resolve_notification_pref (uuid, text, text) owner to admin;

create function create_in_app_delivery_if_allowed () returns trigger language plpgsql as $$
    BEGIN
        IF public.resolve_notification_pref(NEW.user_id, NEW.type, 'in_app') IS TRUE THEN
            INSERT INTO public.notification_deliveries (notification_id, channel, status)
            VALUES (NEW.id, 'in_app', 'pending');
        END IF;
        RETURN NEW;
    END;
    $$;

alter function create_in_app_delivery_if_allowed () owner to admin;

create trigger trg_notifications_in_app_delivery
after insert on notifications for each row
execute procedure create_in_app_delivery_if_allowed ();

create function create_email_delivery_if_allowed () returns trigger language plpgsql as $$
    DECLARE
        v_email text;
    BEGIN
        IF public.resolve_notification_pref(NEW.user_id, NEW.type, 'email') IS NOT TRUE THEN
            RETURN NEW;
        END IF;

        SELECT email INTO v_email FROM public.users WHERE id = NEW.user_id;

        IF v_email IS NOT NULL AND length(btrim(v_email)) > 3 THEN
            INSERT INTO public.notification_deliveries
                (notification_id, channel, status, email_to, email_subject)
            VALUES
                (NEW.id, 'email', 'pending', v_email, NEW.title);
        END IF;

        RETURN NEW;
    END;
    $$;

alter function create_email_delivery_if_allowed () owner to admin;

create trigger trg_notifications_email_delivery
after insert on notifications for each row
execute procedure create_email_delivery_if_allowed ();

-- View to compute job posting status dynamically based on expire_date
-- This ensures status is always accurate without needing triggers or cron jobs
create view job_postings_with_status as
select
  id,
  title,
  description,
  job_role_id,
  onboarding_workflow_id,
  organization_id,
  status as base_status,
  case
    when status != 'active' then status
    when expire_date is not null and expire_date < current_date then 'expired'
    else status
  end as status,
  salary_min,
  salary_max,
  short_description,
  contract_type_code,
  department,
  is_department_accredited,
  publish_date,
  expire_date,
  contact_email,
  contact_phone,
  cv_required,
  created_by,
  created_at
from job_postings;

alter view job_postings_with_status owner to admin;

comment on view job_postings_with_status is 'View that computes job posting status dynamically. Active jobs automatically show as expired when expire_date passes.';

comment on column job_postings_with_status.base_status is 'Original status value stored in database';

comment on column job_postings_with_status.status is 'Computed status that accounts for expiration based on expire_date';

create table job_seekers (
  id uuid not null primary key,
  first_name varchar(255) not null,
  last_name varchar(255) not null,
  email varchar(255) not null,
  phone varchar(255) not null,
  organization_id uuid not null constraint job_seekers_organization_id_foreign references organizations on delete cascade,
  message text,
  cv_filename varchar(255),
  cv_original_filename varchar(255),
  cv_file_path text,
  cv_mime_type varchar(255),
  cv_file_size integer,
  gdpr_consent boolean default false not null,
  submitted_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table job_seekers owner to admin;

create index idx_job_seekers_org on job_seekers (organization_id);

create index idx_job_seekers_email on job_seekers (email);

create index idx_job_seekers_submitted on job_seekers (submitted_at desc);

comment on table job_seekers is 'Database of potential job seekers who contacted us without applying for specific position';

-- ============================================
-- Interview/Calendar System Tables
-- ============================================

-- Enums for interview system
create type interview_location_type as enum('office', 'online', 'department', 'other');

alter type interview_location_type owner to admin;

create type interview_status as enum('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');

alter type interview_status owner to admin;

create type participant_attendance_status as enum('pending', 'accepted', 'declined', 'tentative');

alter type participant_attendance_status owner to admin;

-- Main interview events table
create table interview_events (
  id uuid default gen_random_uuid() not null primary key,
  applicant_id uuid not null constraint interview_events_applicant_id_foreign references applicants on delete cascade,
  job_posting_id uuid constraint interview_events_job_posting_id_foreign references job_postings on delete set null,
  organization_id uuid not null constraint interview_events_organization_id_foreign references organizations on delete cascade,
  created_by uuid not null constraint interview_events_created_by_foreign references users on delete set null,
  title varchar(255) not null,
  description text,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer default 60 not null,
  location_type interview_location_type not null,
  location text,
  online_meeting_link text,
  notes text,
  status interview_status default 'scheduled' not null,
  reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  cancelled_at timestamp with time zone,
  cancellation_reason text
);

alter table interview_events owner to admin;

create index idx_interviews_applicant on interview_events (applicant_id);
create index idx_interviews_org on interview_events (organization_id);
create index idx_interviews_scheduled on interview_events (scheduled_at);
create index idx_interviews_status on interview_events (status);
create index idx_interviews_org_status on interview_events (organization_id, status);

comment on table interview_events is 'Calendar events for applicant interviews and meetings';
comment on column interview_events.duration_minutes is 'Interview duration in minutes, default 60';
comment on column interview_events.location_type is 'Type of location: office, online, department, or other';
comment on column interview_events.online_meeting_link is 'Video call URL for online interviews';

-- Interview participants table
create table interview_participants (
  id uuid default gen_random_uuid() not null primary key,
  interview_id uuid not null constraint interview_participants_interview_id_foreign references interview_events on delete cascade,
  user_id uuid constraint interview_participants_user_id_foreign references users on delete cascade,
  external_email varchar(255),
  external_name varchar(255),
  role varchar(50) default 'interviewer' not null,
  attendance_status participant_attendance_status default 'pending' not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint interview_participants_participant_check check (
    (user_id is not null) or (external_email is not null and external_name is not null)
  )
);

alter table interview_participants owner to admin;

create index idx_participants_interview on interview_participants (interview_id);
create index idx_participants_user on interview_participants (user_id);

comment on table interview_participants is 'Tracks participants in interviews (internal users or external via email)';
comment on column interview_participants.role is 'Participant role: organizer, interviewer, observer';
comment on column interview_participants.user_id is 'Internal user participant (nullable for external participants)';
comment on column interview_participants.external_email is 'Email for external participants not in the system';

-- Interview attachments table
create table interview_attachments (
  id uuid default gen_random_uuid() not null primary key,
  interview_id uuid not null constraint interview_attachments_interview_id_foreign references interview_events on delete cascade,
  file_path text not null,
  filename varchar(255) not null,
  original_filename varchar(255) not null,
  mime_type varchar(255) not null,
  file_size bigint not null,
  uploaded_by uuid constraint interview_attachments_uploaded_by_foreign references users on delete set null,
  uploaded_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table interview_attachments owner to admin;

create index idx_attachments_interview on interview_attachments (interview_id);

comment on table interview_attachments is 'Supporting documents attached to interviews';

-- Interview status history table (audit trail)
create table interview_status_history (
  id uuid default gen_random_uuid() not null primary key,
  interview_id uuid not null constraint interview_status_history_interview_id_foreign references interview_events on delete cascade,
  old_status interview_status,
  new_status interview_status not null,
  changed_by uuid constraint interview_status_history_changed_by_foreign references users on delete set null,
  changed_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  notes text
);

alter table interview_status_history owner to admin;

create index idx_status_history_interview on interview_status_history (interview_id);
create index idx_status_history_changed_at on interview_status_history (changed_at desc);

comment on table interview_status_history is 'Audit trail for interview status changes';
