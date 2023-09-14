import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TYPE item_type_enum AS ENUM (
      'normal',
      'draft',
      'fork'
    );

    CREATE TYPE workflow_type_enum AS ENUM (
      'workflow',
      'page',
      'embed'
    );

    CREATE TABLE collections (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      organization_id integer NOT NULL,
      name character varying NOT NULL,
      is_default boolean DEFAULT false NOT NULL
    );

    CREATE UNIQUE INDEX "idx_collections_single_isDefault" ON collections (organization_id) WHERE (is_default = true);

    CREATE TABLE domains (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      organization_id integer,
      hosts character varying[] NOT NULL,
      shadow_record boolean DEFAULT false NOT NULL,
      default_open boolean,
      default_interface character varying,
      insert_text_xpath character varying,
      name character varying,
      variable_extractors jsonb,
      custom_style text,
      iframe_style text,
      default_interface_options json
    );

    CREATE TABLE feedback (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      user_id integer,
      path character varying,
      prompt character varying,
      feedback text NOT NULL
    );

    CREATE TABLE logs (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      user_id integer,
      data jsonb NOT NULL,
      processed_at timestamp without time zone
    );

    CREATE TABLE organizations (
      id SERIAL PRIMARY KEY,
      name character varying,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      default_page_static_id character varying NOT NULL,
      google_domain character varying UNIQUE
    );

    CREATE TABLE product_changes (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      title character varying NOT NULL,
      description json NOT NULL,
      is_major boolean NOT NULL
    );

    CREATE TABLE tools (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      static_id character varying NOT NULL,
      is_latest boolean NOT NULL,
      is_deleted boolean DEFAULT false NOT NULL,
      name character varying NOT NULL,
      description text NOT NULL,
      component character varying NOT NULL,
      configuration json NOT NULL,
      owning_organization_id integer NOT NULL,
      created_by_user_id integer NOT NULL,
      previous_version_id integer,
      inputs json NOT NULL,
      forked_from_id integer,
      item_type item_type_enum DEFAULT 'normal'::item_type_enum NOT NULL,
      major_change_description json,
      collection_id integer NOT NULL
    );

    CREATE INDEX "idx_tools_staticId_isLatest_itemType" ON tools (static_id, is_latest, item_type);
    CREATE UNIQUE INDEX "idx_tools_unique_staticId" ON tools (static_id) WHERE (is_latest = true);
    CREATE UNIQUE INDEX "idx_tools_unique_staticId_user_draft" ON tools (static_id, created_by_user_id) WHERE ((is_latest = true) AND (item_type = 'draft'::item_type_enum));

    CREATE TABLE user_change_views (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      user_id integer NOT NULL,
      static_id character varying,
      latest_view timestamp without time zone NOT NULL,
      CONSTRAINT user_change_views_user_id_static_id_key UNIQUE (user_id, static_id)
    );

    CREATE UNIQUE INDEX "idx_user_change_views_unique_userId" ON user_change_views (user_id) WHERE (static_id IS NULL);

    CREATE TABLE user_domain_settings (
      id SERIAL PRIMARY KEY,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      user_id integer NOT NULL,
      domain_id integer NOT NULL,
      open boolean,
      domain_interface character varying,
      domain_interface_options json,
      CONSTRAINT user_domain_settings_user_id_domain_id_key UNIQUE (user_id, domain_id)
    );

    CREATE TABLE user_tool_use_counts (
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      user_id integer NOT NULL,
      tool_static_id character varying NOT NULL,
      date date NOT NULL,
      count integer NOT NULL,
      CONSTRAINT user_tool_use_counts_pkey PRIMARY KEY (user_id, tool_static_id, date)
    );

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      organization_id integer NOT NULL,
      google_id character varying UNIQUE,
      email character varying UNIQUE,
      name character varying,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      given_name character varying,
      userinfo_first json,
      userinfo_latest json
    );

    CREATE TABLE workflows (
      id SERIAL PRIMARY KEY,
      name character varying NOT NULL,
      contents json NOT NULL,
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      created_by_user_id integer NOT NULL,
      previous_version_id integer,
      is_latest boolean NOT NULL,
      owning_organization_id integer NOT NULL,
      static_id character varying NOT NULL,
      description text NOT NULL,
      is_deleted boolean DEFAULT false NOT NULL,
      collection_id integer NOT NULL,
      forked_from_id integer,
      item_type item_type_enum DEFAULT 'normal'::item_type_enum NOT NULL,
      type workflow_type_enum DEFAULT 'workflow'::workflow_type_enum NOT NULL,
      major_change_description json
    );

    CREATE INDEX "idx_workflows_staticId_isLatest_itemType" ON workflows (static_id, is_latest, item_type);
    CREATE UNIQUE INDEX "idx_workflows_unique_staticId" ON workflows (static_id) WHERE (is_latest = true);
    CREATE UNIQUE INDEX "idx_workflows_unique_staticId_user_draft" ON workflows (static_id, created_by_user_id) WHERE ((is_latest = true) AND (item_type = 'draft'::item_type_enum));

    -- FOREIGN KEYS --

    ALTER TABLE ONLY collections
      ADD CONSTRAINT collections_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);

    ALTER TABLE ONLY domains
      ADD CONSTRAINT domains_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);

    ALTER TABLE ONLY feedback
      ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE ONLY logs
      ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE ONLY tools
      ADD CONSTRAINT tools_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections(id),
      ADD CONSTRAINT tools_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
      ADD CONSTRAINT tools_forked_from_id_fkey FOREIGN KEY (forked_from_id) REFERENCES tools(id),
      ADD CONSTRAINT tools_owning_organization_id_fkey FOREIGN KEY (owning_organization_id) REFERENCES organizations(id),
      ADD CONSTRAINT tools_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES tools(id);

    ALTER TABLE ONLY user_change_views
      ADD CONSTRAINT user_change_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE ONLY user_domain_settings
      ADD CONSTRAINT user_domain_settings_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES domains(id),
      ADD CONSTRAINT user_domain_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE ONLY user_tool_use_counts
      ADD CONSTRAINT user_tool_use_counts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE ONLY users
      ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);

    ALTER TABLE ONLY workflows
      ADD CONSTRAINT workflows_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections(id),
      ADD CONSTRAINT workflows_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
      ADD CONSTRAINT workflows_forked_from_id_fkey FOREIGN KEY (forked_from_id) REFERENCES workflows(id),
      ADD CONSTRAINT workflows_owning_organization_id_fkey FOREIGN KEY (owning_organization_id) REFERENCES organizations(id),
      ADD CONSTRAINT workflows_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES workflows(id);

    -- INITIAL DATA --

    INSERT INTO domains
      (hosts,                                 default_interface, variable_extractors, insert_text_xpath)
    VALUES
      (E'{}',                                 E'default',        NULL,                NULL),
      (E'{app.intercom.com,app.intercom.io}', E'intercom',       E'{"intercom": {}}', E'//div[@contenteditable]'),
      (E'{*.zendesk.com}',                    E'zendesk',        E'{"zendesk": {}}',  E'//div[has-class(\\'workspace\\')][not(contains(@style, \\'none\\'))]//div[@contenteditable][has-class(\\'zendesk-editor--rich-text-comment\\')]'),
      (E'{mail.google.com}',                  E'gmail',          E'{"gmail": {}}',    NULL);
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {
  // Drop everything I guess?
}
