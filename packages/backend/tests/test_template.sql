--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1 (Debian 14.1-1.pgdg110+1)
-- Dumped by pg_dump version 14.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS test_template;
--
-- Name: test_template; Type: DATABASE; Schema: -; Owner: kenchi
--

CREATE DATABASE test_template WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';


ALTER DATABASE test_template OWNER TO kenchi;

\connect test_template

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth_type_enum; Type: TYPE; Schema: public; Owner: kenchi
--

CREATE TYPE public.auth_type_enum AS ENUM (
    'unauthenticated',
    'user',
    'login_as'
);


ALTER TYPE public.auth_type_enum OWNER TO kenchi;

--
-- Name: branch_type_enum; Type: TYPE; Schema: public; Owner: kenchi
--

CREATE TYPE public.branch_type_enum AS ENUM (
    'published',
    'draft',
    'remix',
    'suggestion'
);


ALTER TYPE public.branch_type_enum OWNER TO kenchi;

--
-- Name: external_reference_type_enum; Type: TYPE; Schema: public; Owner: kenchi
--

CREATE TYPE public.external_reference_type_enum AS ENUM (
    'tag'
);


ALTER TYPE public.external_reference_type_enum OWNER TO kenchi;

--
-- Name: object_type_enum; Type: TYPE; Schema: public; Owner: kenchi
--

CREATE TYPE public.object_type_enum AS ENUM (
    'tool',
    'workflow-embed',
    'workflow-link'
);


ALTER TYPE public.object_type_enum OWNER TO kenchi;

--
-- Name: user_type_enum; Type: TYPE; Schema: public; Owner: kenchi
--

CREATE TYPE public.user_type_enum AS ENUM (
    'user',
    'kenchi'
);


ALTER TYPE public.user_type_enum OWNER TO kenchi;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.auth_sessions (
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    id text NOT NULL,
    data json DEFAULT '{}'::json NOT NULL,
    secret text,
    type public.auth_type_enum NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.auth_sessions OWNER TO kenchi;

--
-- Name: collection_acl; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.collection_acl (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    collection_id integer NOT NULL,
    user_id integer,
    user_group_id integer,
    permissions character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    CONSTRAINT "idx_collectionAcls_user_userGroup_xor" CHECK ((num_nonnulls(user_id, user_group_id) = 1))
);


ALTER TABLE public.collection_acl OWNER TO kenchi;

--
-- Name: collection_acl_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.collection_acl_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.collection_acl_id_seq OWNER TO kenchi;

--
-- Name: collection_acl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.collection_acl_id_seq OWNED BY public.collection_acl.id;


--
-- Name: collections; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.collections (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id integer,
    name character varying NOT NULL,
    is_deleted boolean DEFAULT false,
    icon text,
    default_permissions character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    description text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.collections OWNER TO kenchi;

--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.collections_id_seq OWNER TO kenchi;

--
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- Name: data_imports; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.data_imports (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    initial_data jsonb NOT NULL,
    state jsonb,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    type text NOT NULL
);


ALTER TABLE public.data_imports OWNER TO kenchi;

--
-- Name: data_imports_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.data_imports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.data_imports_id_seq OWNER TO kenchi;

--
-- Name: data_imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.data_imports_id_seq OWNED BY public.data_imports.id;


--
-- Name: data_sources; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.data_sources (
    id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    organization_id integer,
    name text NOT NULL,
    requests jsonb NOT NULL,
    outputs jsonb NOT NULL
);


ALTER TABLE public.data_sources OWNER TO kenchi;

--
-- Name: domains; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.domains (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id integer,
    hosts character varying[] NOT NULL,
    shadow_record boolean DEFAULT false NOT NULL,
    name character varying,
    settings json DEFAULT '{}'::json NOT NULL
);


ALTER TABLE public.domains OWNER TO kenchi;

--
-- Name: domains_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.domains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.domains_id_seq OWNER TO kenchi;

--
-- Name: domains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.domains_id_seq OWNED BY public.domains.id;


--
-- Name: external_data_references; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.external_data_references (
    id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id integer,
    user_id integer,
    reference_source text NOT NULL,
    reference_type public.external_reference_type_enum NOT NULL,
    label text NOT NULL,
    reference_id text NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    CONSTRAINT "idx_external_data_references_xor_organizationId_userId" CHECK ((num_nonnulls(organization_id, user_id) = 1))
);


ALTER TABLE public.external_data_references OWNER TO kenchi;

--
-- Name: external_tags; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.external_tags (
    id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    organization_id integer,
    label text NOT NULL,
    intercom_id text
);


ALTER TABLE public.external_tags OWNER TO kenchi;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    path character varying,
    prompt character varying,
    feedback text NOT NULL
);


ALTER TABLE public.feedback OWNER TO kenchi;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.feedback_id_seq OWNER TO kenchi;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: insights_conversations; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.insights_conversations (
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id integer NOT NULL,
    id character varying NOT NULL,
    started_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    data json NOT NULL,
    rating smallint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    rated_at timestamp without time zone
);


ALTER TABLE public.insights_conversations OWNER TO kenchi;

--
-- Name: logs; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.logs (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    data jsonb NOT NULL,
    processed_at timestamp without time zone,
    logged_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.logs OWNER TO kenchi;

--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.logs_id_seq OWNER TO kenchi;

--
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    type text NOT NULL,
    static_id text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.notifications OWNER TO kenchi;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    google_domain character varying,
    settings json NOT NULL,
    additional_google_domains character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    shadow_record boolean NOT NULL
);


ALTER TABLE public.organizations OWNER TO kenchi;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organizations_id_seq OWNER TO kenchi;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: page_snapshots; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.page_snapshots (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    snapshot json NOT NULL
);


ALTER TABLE public.page_snapshots OWNER TO kenchi;

--
-- Name: page_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.page_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.page_snapshots_id_seq OWNER TO kenchi;

--
-- Name: page_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.page_snapshots_id_seq OWNED BY public.page_snapshots.id;


--
-- Name: pgmigrations; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.pgmigrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


ALTER TABLE public.pgmigrations OWNER TO kenchi;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.pgmigrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pgmigrations_id_seq OWNER TO kenchi;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.pgmigrations_id_seq OWNED BY public.pgmigrations.id;


--
-- Name: product_changes; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.product_changes (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    title character varying NOT NULL,
    description json NOT NULL,
    is_major boolean NOT NULL
);


ALTER TABLE public.product_changes OWNER TO kenchi;

--
-- Name: product_changes_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.product_changes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_changes_id_seq OWNER TO kenchi;

--
-- Name: product_changes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.product_changes_id_seq OWNED BY public.product_changes.id;


--
-- Name: session_entries; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.session_entries (
    id integer NOT NULL,
    received_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    browser_instance_id text NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    action text NOT NULL,
    window_id integer,
    tab_id integer,
    data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.session_entries OWNER TO kenchi;

--
-- Name: session_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.session_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_entries_id_seq OWNER TO kenchi;

--
-- Name: session_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.session_entries_id_seq OWNED BY public.session_entries.id;


--
-- Name: shortcuts; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.shortcuts (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id integer,
    user_id integer,
    static_id text NOT NULL,
    shortcut text,
    CONSTRAINT "idx_shortcuts_check_xor_organizationId_userId" CHECK ((num_nonnulls(organization_id, user_id) = 1))
);


ALTER TABLE public.shortcuts OWNER TO kenchi;

--
-- Name: shortcuts_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.shortcuts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shortcuts_id_seq OWNER TO kenchi;

--
-- Name: shortcuts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.shortcuts_id_seq OWNED BY public.shortcuts.id;


--
-- Name: space_acl; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.space_acl (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    static_id character varying NOT NULL,
    user_id integer,
    user_group_id integer,
    CONSTRAINT "idx_spaceAcl_user_userGroup_xor" CHECK ((num_nonnulls(user_id, user_group_id) = 1))
);


ALTER TABLE public.space_acl OWNER TO kenchi;

--
-- Name: space_acl_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.space_acl_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.space_acl_id_seq OWNER TO kenchi;

--
-- Name: space_acl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.space_acl_id_seq OWNED BY public.space_acl.id;


--
-- Name: spaces; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.spaces (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by_user_id integer NOT NULL,
    previous_version_id integer,
    is_latest boolean NOT NULL,
    static_id character varying NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    major_change_description json,
    branched_from_id integer,
    metadata json DEFAULT '{}'::json NOT NULL,
    suggested_by_user_id integer,
    branch_type public.branch_type_enum NOT NULL,
    branch_id character varying,
    widgets json NOT NULL,
    icon text,
    name text NOT NULL,
    organization_id integer,
    visible_to_org boolean DEFAULT false NOT NULL
);


ALTER TABLE public.spaces OWNER TO kenchi;

--
-- Name: spaces_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.spaces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.spaces_id_seq OWNER TO kenchi;

--
-- Name: spaces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.spaces_id_seq OWNED BY public.spaces.id;


--
-- Name: tool_run_logs; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.tool_run_logs (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    tool_id integer,
    log json NOT NULL
);


ALTER TABLE public.tool_run_logs OWNER TO kenchi;

--
-- Name: tool_run_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.tool_run_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tool_run_logs_id_seq OWNER TO kenchi;

--
-- Name: tool_run_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.tool_run_logs_id_seq OWNED BY public.tool_run_logs.id;


--
-- Name: tools; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.tools (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    static_id character varying NOT NULL,
    is_latest boolean NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    component character varying NOT NULL,
    configuration json NOT NULL,
    created_by_user_id integer NOT NULL,
    previous_version_id integer,
    inputs json NOT NULL,
    major_change_description json,
    collection_id integer NOT NULL,
    branched_from_id integer,
    metadata json DEFAULT '{}'::json NOT NULL,
    suggested_by_user_id integer,
    branch_type public.branch_type_enum NOT NULL,
    branch_id character varying,
    keywords character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    icon text
);


ALTER TABLE public.tools OWNER TO kenchi;

--
-- Name: tools_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tools_id_seq OWNER TO kenchi;

--
-- Name: tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.tools_id_seq OWNED BY public.tools.id;


--
-- Name: user_change_views; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_change_views (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    static_id character varying,
    latest_view timestamp without time zone NOT NULL
);


ALTER TABLE public.user_change_views OWNER TO kenchi;

--
-- Name: user_change_views_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.user_change_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_change_views_id_seq OWNER TO kenchi;

--
-- Name: user_change_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.user_change_views_id_seq OWNED BY public.user_change_views.id;


--
-- Name: user_domain_settings; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_domain_settings (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    domain_id integer NOT NULL,
    open boolean,
    domain_interface_options json
);


ALTER TABLE public.user_domain_settings OWNER TO kenchi;

--
-- Name: user_domain_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.user_domain_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_domain_settings_id_seq OWNER TO kenchi;

--
-- Name: user_domain_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.user_domain_settings_id_seq OWNED BY public.user_domain_settings.id;


--
-- Name: user_group_members; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_group_members (
    user_id integer NOT NULL,
    user_group_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    manager boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_group_members OWNER TO kenchi;

--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_groups (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.user_groups OWNER TO kenchi;

--
-- Name: user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.user_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_groups_id_seq OWNER TO kenchi;

--
-- Name: user_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.user_groups_id_seq OWNED BY public.user_groups.id;


--
-- Name: user_item_settings; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_item_settings (
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    static_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.user_item_settings OWNER TO kenchi;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_notifications (
    id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    notification_id text NOT NULL,
    dismissed_at timestamp without time zone,
    viewed_at timestamp without time zone
);


ALTER TABLE public.user_notifications OWNER TO kenchi;

--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_subscriptions (
    user_id integer NOT NULL,
    static_id text NOT NULL,
    subscribed boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_subscriptions OWNER TO kenchi;

--
-- Name: user_tool_runs; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_tool_runs (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    run_at timestamp without time zone DEFAULT now() NOT NULL,
    revision_id integer,
    static_id text NOT NULL,
    user_id integer NOT NULL,
    conversation_id text
);


ALTER TABLE public.user_tool_runs OWNER TO kenchi;

--
-- Name: user_tool_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.user_tool_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_tool_runs_id_seq OWNER TO kenchi;

--
-- Name: user_tool_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.user_tool_runs_id_seq OWNED BY public.user_tool_runs.id;


--
-- Name: user_workflow_views; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.user_workflow_views (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    viewed_at timestamp without time zone DEFAULT now() NOT NULL,
    revision_id integer,
    static_id text NOT NULL,
    user_id integer NOT NULL,
    conversation_id text
);


ALTER TABLE public.user_workflow_views OWNER TO kenchi;

--
-- Name: user_workflow_views_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.user_workflow_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_workflow_views_id_seq OWNER TO kenchi;

--
-- Name: user_workflow_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.user_workflow_views_id_seq OWNED BY public.user_workflow_views.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.users (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    google_id character varying,
    email character varying,
    name character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    given_name character varying,
    userinfo_first json,
    userinfo_latest json,
    type public.user_type_enum DEFAULT 'user'::public.user_type_enum NOT NULL,
    is_organization_admin boolean DEFAULT false NOT NULL,
    wants_edit_suggestion_emails boolean DEFAULT true NOT NULL,
    disabled_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO kenchi;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO kenchi;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.waitlist (
    id integer NOT NULL,
    email text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    invited_at timestamp without time zone
);


ALTER TABLE public.waitlist OWNER TO kenchi;

--
-- Name: waitlist_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.waitlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.waitlist_id_seq OWNER TO kenchi;

--
-- Name: waitlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.waitlist_id_seq OWNED BY public.waitlist.id;


--
-- Name: widgets; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.widgets (
    id integer NOT NULL,
    static_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_latest boolean NOT NULL,
    created_by_user_id text NOT NULL,
    suggested_by_user_id text,
    previous_version_id text,
    major_change_description jsonb,
    branched_from_id integer,
    branch_type public.branch_type_enum,
    branch_id text,
    is_archived boolean DEFAULT false NOT NULL,
    organization_id integer NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    contents jsonb NOT NULL,
    inputs jsonb NOT NULL
);


ALTER TABLE public.widgets OWNER TO kenchi;

--
-- Name: widgets_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.widgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.widgets_id_seq OWNER TO kenchi;

--
-- Name: widgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.widgets_id_seq OWNED BY public.widgets.id;


--
-- Name: workflow_contains_object; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.workflow_contains_object (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    workflow_static_id character varying NOT NULL,
    object_type public.object_type_enum NOT NULL,
    object_static_id character varying NOT NULL
);


ALTER TABLE public.workflow_contains_object OWNER TO kenchi;

--
-- Name: TABLE workflow_contains_object; Type: COMMENT; Schema: public; Owner: kenchi
--

COMMENT ON TABLE public.workflow_contains_object IS 'For the latest version of a Workflow, maps the objects (e.g. Tools or other Workflows) contained within the workflow. This allows us to quickly find associated Workflows from a Tool, see associated Tools in Collections, etc.';


--
-- Name: workflow_contains_object_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.workflow_contains_object_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflow_contains_object_id_seq OWNER TO kenchi;

--
-- Name: workflow_contains_object_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.workflow_contains_object_id_seq OWNED BY public.workflow_contains_object.id;


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: kenchi
--

CREATE TABLE public.workflows (
    id integer NOT NULL,
    name character varying NOT NULL,
    contents json NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by_user_id integer NOT NULL,
    previous_version_id integer,
    is_latest boolean NOT NULL,
    static_id character varying NOT NULL,
    description text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    collection_id integer NOT NULL,
    major_change_description json,
    branched_from_id integer,
    metadata json DEFAULT '{}'::json NOT NULL,
    suggested_by_user_id integer,
    branch_type public.branch_type_enum NOT NULL,
    branch_id character varying,
    icon text,
    keywords character varying[] DEFAULT '{}'::character varying[] NOT NULL
);


ALTER TABLE public.workflows OWNER TO kenchi;

--
-- Name: workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: kenchi
--

CREATE SEQUENCE public.workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflows_id_seq OWNER TO kenchi;

--
-- Name: workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kenchi
--

ALTER SEQUENCE public.workflows_id_seq OWNED BY public.workflows.id;


--
-- Name: collection_acl id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collection_acl ALTER COLUMN id SET DEFAULT nextval('public.collection_acl_id_seq'::regclass);


--
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- Name: data_imports id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.data_imports ALTER COLUMN id SET DEFAULT nextval('public.data_imports_id_seq'::regclass);


--
-- Name: domains id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.domains ALTER COLUMN id SET DEFAULT nextval('public.domains_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: page_snapshots id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.page_snapshots ALTER COLUMN id SET DEFAULT nextval('public.page_snapshots_id_seq'::regclass);


--
-- Name: pgmigrations id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.pgmigrations ALTER COLUMN id SET DEFAULT nextval('public.pgmigrations_id_seq'::regclass);


--
-- Name: product_changes id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.product_changes ALTER COLUMN id SET DEFAULT nextval('public.product_changes_id_seq'::regclass);


--
-- Name: session_entries id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.session_entries ALTER COLUMN id SET DEFAULT nextval('public.session_entries_id_seq'::regclass);


--
-- Name: shortcuts id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.shortcuts ALTER COLUMN id SET DEFAULT nextval('public.shortcuts_id_seq'::regclass);


--
-- Name: space_acl id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.space_acl ALTER COLUMN id SET DEFAULT nextval('public.space_acl_id_seq'::regclass);


--
-- Name: spaces id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces ALTER COLUMN id SET DEFAULT nextval('public.spaces_id_seq'::regclass);


--
-- Name: tool_run_logs id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tool_run_logs ALTER COLUMN id SET DEFAULT nextval('public.tool_run_logs_id_seq'::regclass);


--
-- Name: tools id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools ALTER COLUMN id SET DEFAULT nextval('public.tools_id_seq'::regclass);


--
-- Name: user_change_views id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_change_views ALTER COLUMN id SET DEFAULT nextval('public.user_change_views_id_seq'::regclass);


--
-- Name: user_domain_settings id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_domain_settings ALTER COLUMN id SET DEFAULT nextval('public.user_domain_settings_id_seq'::regclass);


--
-- Name: user_groups id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_groups ALTER COLUMN id SET DEFAULT nextval('public.user_groups_id_seq'::regclass);


--
-- Name: user_tool_runs id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_tool_runs ALTER COLUMN id SET DEFAULT nextval('public.user_tool_runs_id_seq'::regclass);


--
-- Name: user_workflow_views id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_workflow_views ALTER COLUMN id SET DEFAULT nextval('public.user_workflow_views_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: waitlist id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.waitlist ALTER COLUMN id SET DEFAULT nextval('public.waitlist_id_seq'::regclass);


--
-- Name: widgets id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.widgets ALTER COLUMN id SET DEFAULT nextval('public.widgets_id_seq'::regclass);


--
-- Name: workflow_contains_object id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflow_contains_object ALTER COLUMN id SET DEFAULT nextval('public.workflow_contains_object_id_seq'::regclass);


--
-- Name: workflows id; Type: DEFAULT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows ALTER COLUMN id SET DEFAULT nextval('public.workflows_id_seq'::regclass);


--
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.auth_sessions (created_at, expires_at, updated_at, id, data, secret, type, user_id) FROM stdin;
\.


--
-- Data for Name: collection_acl; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.collection_acl (id, created_at, updated_at, collection_id, user_id, user_group_id, permissions) FROM stdin;
\.


--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.collections (id, created_at, updated_at, organization_id, name, is_deleted, icon, default_permissions, description) FROM stdin;
\.


--
-- Data for Name: data_imports; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.data_imports (id, created_at, updated_at, user_id, initial_data, state, started_at, completed_at, type) FROM stdin;
\.


--
-- Data for Name: data_sources; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.data_sources (id, created_at, updated_at, is_archived, organization_id, name, requests, outputs) FROM stdin;
\.


--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.domains (id, created_at, updated_at, organization_id, hosts, shadow_record, name, settings) FROM stdin;
1	2022-06-01 00:21:45.488144	2022-06-01 00:21:45.488144	\N	{}	f	\N	{"isGmail":false,"sidebar":{}}
2	2022-06-01 00:21:45.488144	2022-06-01 00:21:45.488144	\N	{app.intercom.com,app.intercom.io}	f	\N	{"insertTextXPath":"//div[@contenteditable]","variableExtractors":{"intercom":{}},"isGmail":false,"sidebar":{}}
3	2022-06-01 00:21:45.488144	2022-06-01 00:21:45.488144	\N	{*.zendesk.com}	f	\N	{"insertTextXPath":"//div[has-class('workspace')][not(contains(@style, 'none'))]//div[@contenteditable][has-class('zendesk-editor--rich-text-comment')]","variableExtractors":{"zendesk":{}},"isGmail":false,"sidebar":{}}
4	2022-06-01 00:21:45.488144	2022-06-01 00:21:45.488144	\N	{mail.google.com}	f	\N	{"inject":true,"variableExtractors":{"gmail":{}},"isGmail":true,"sidebar":{}}
5	2022-06-01 00:21:46.111688	2022-06-01 00:21:46.111688	\N	{app.frontapp.com}	f	\N	{\n        "variableExtractors": {"front": {}},\n        "sidebar": {\n            "defaultOpen": true,\n            "customPlacements": {\n                "embed-left": {\n                    "name": "Embed on left side",\n                    "style": "body.kenchi-open.kenchi-embed-left > .layer { margin-left: 300px; width: calc(100% - 300px); } #kenchi-iframe.kenchi-embed-left { left: 0; }"\n                },\n                "embed-right": {\n                    "name": "Embed on right side",\n                    "style": "body.kenchi-open.kenchi-embed-right > .layer { margin-right: 300px; width: calc(100% - 300px); } #kenchi-iframe.kenchi-embed-right { right: 0; }"\n                }\n            }\n        },\n        "hud": {"inject": true},\n        "isGmail": false\n    }
\.


--
-- Data for Name: external_data_references; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.external_data_references (id, created_at, updated_at, organization_id, user_id, reference_source, reference_type, label, reference_id, is_archived) FROM stdin;
\.


--
-- Data for Name: external_tags; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.external_tags (id, created_at, updated_at, is_archived, organization_id, label, intercom_id) FROM stdin;
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.feedback (id, created_at, user_id, path, prompt, feedback) FROM stdin;
\.


--
-- Data for Name: insights_conversations; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.insights_conversations (synced_at, organization_id, id, started_at, updated_at, data, rating, created_at, rated_at) FROM stdin;
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.logs (id, created_at, user_id, data, processed_at, logged_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.notifications (id, created_at, type, static_id, data) FROM stdin;
notif_cnewuser	2022-06-01 00:21:45.855022	new_user_welcome	\N	{}
notif_ccreateorg	2022-06-01 00:21:45.970836	create_org_prompt	\N	{}
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.organizations (id, name, created_at, updated_at, google_domain, settings, additional_google_domains, shadow_record) FROM stdin;
1	\N	2022-06-01 00:21:46.141055	2022-06-01 00:21:46.141055	\N	{}	{}	t
\.


--
-- Data for Name: page_snapshots; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.page_snapshots (id, created_at, user_id, snapshot) FROM stdin;
\.


--
-- Data for Name: pgmigrations; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.pgmigrations (id, name, run_on) FROM stdin;
1	20200728000000000_init	2022-06-01 00:21:45.488144
2	20200728200000000_dont-require-collections-on-automations	2022-06-01 00:21:45.616979
3	20200731000000000_permissions	2022-06-01 00:21:45.624125
4	20200731000000001_workflow-to-tools-join-table	2022-06-01 00:21:45.638994
5	20200801000000000_permissions	2022-06-01 00:21:45.650142
6	20200805000000000_domain-css	2022-06-01 00:21:45.654069
7	20200806000000000_mark-collections-as-deleted	2022-06-01 00:21:45.656664
8	20200807002549959_unique-collections-by-name	2022-06-01 00:21:45.658592
9	20200813000000000_suggested-edits	2022-06-01 00:21:45.669711
10	20200819000000000_unset-default-automation-collection	2022-06-01 00:21:45.670519
11	20200820000000000_branch-type	2022-06-01 00:21:45.673579
12	20200821000000000_tool-run-log	2022-06-01 00:21:45.687629
13	20200824000000000_require-branch-type	2022-06-01 00:21:45.698808
14	20200824000000001_remove-item-type	2022-06-01 00:21:45.713128
15	20200824000000002_fix-branch-type-index	2022-06-01 00:21:45.71886
16	20200826000000000_notifications	2022-06-01 00:21:45.726874
17	20200902000000000_track_session	2022-06-01 00:21:45.746745
18	20200911000000000_fix-branch-type-index-again	2022-06-01 00:21:45.757126
19	20200915000000000_branch-id	2022-06-01 00:21:45.765117
20	20200930000000000_user-item-settings	2022-06-01 00:21:45.772977
21	20201008000000000_shortcuts	2022-06-01 00:21:45.792223
22	20201022000000000_user-workflow-view-counts	2022-06-01 00:21:45.80569
23	20201029000000000_auth-sessions	2022-06-01 00:21:45.815841
24	20201030000000000_login-as	2022-06-01 00:21:45.825556
25	20201117000000000_null-collection	2022-06-01 00:21:45.829273
26	20201117000000001_drop-is-default	2022-06-01 00:21:45.831252
27	20201128000000000_add-icon-to-collections	2022-06-01 00:21:45.834591
28	20201128000000000_add-icon-to-workflows	2022-06-01 00:21:45.836611
29	20201130000000000_external-tags	2022-06-01 00:21:45.839381
30	20201203000000000_additional-domains	2022-06-01 00:21:45.849475
31	20201205000000000_add-keywords-to-workflows-and-tools	2022-06-01 00:21:45.851995
32	20201208000000000_new-user-notif	2022-06-01 00:21:45.855022
33	20201217000000000_shortcuts-org-optional	2022-06-01 00:21:45.857857
34	20201218000000000_uncategorized-collection	2022-06-01 00:21:45.870866
35	20201218000000001_groups-join	2022-06-01 00:21:45.881713
36	20201221000000000_workflow-tool-optional-org	2022-06-01 00:21:45.886465
37	20201221000000001_workflow-tool-drop-org	2022-06-01 00:21:45.88903
38	20201223000000000_permissions-galore	2022-06-01 00:21:45.892493
39	20210127000000000_group-manager	2022-06-01 00:21:45.906597
40	20210216000000000_legacy-inputs	2022-06-01 00:21:45.91419
41	20210222000000000_user-admin	2022-06-01 00:21:45.916055
42	20210223000000000_waitlist	2022-06-01 00:21:45.919774
43	20210224000000000_admin-group	2022-06-01 00:21:45.925714
44	20210225000000000_spaces	2022-06-01 00:21:45.929062
45	20210301000000000_kill-unauth-session-type	2022-06-01 00:21:45.946935
46	20210309011902696_unique-group-names	2022-06-01 00:21:45.950934
47	20210311221156104_space-name	2022-06-01 00:21:45.956945
48	20210325000000000_notif-org	2022-06-01 00:21:45.961076
49	20210329000000000_workflow-type	2022-06-01 00:21:45.963441
50	20210329000000001_default-page	2022-06-01 00:21:45.966931
51	20210329000000002_default-page-kill	2022-06-01 00:21:45.968833
52	20210415000000000_create-org-notif	2022-06-01 00:21:45.970836
53	20210419000000000_inject	2022-06-01 00:21:45.973607
54	20210427000000000_metadata	2022-06-01 00:21:45.976496
55	20210427000000001_wants-edit-suggestion-emails	2022-06-01 00:21:45.978966
56	20210428000000000_waitlist-invited-at	2022-06-01 00:21:45.981011
57	20210504000000000_collection-names	2022-06-01 00:21:45.982887
58	20210506000000000_spaces-acl	2022-06-01 00:21:45.98562
59	20210510000000000_spaces-remove-group-id	2022-06-01 00:21:46.001791
60	20210512000000000_login-as-users	2022-06-01 00:21:46.0046
61	20210517000000000_data_imports-table	2022-06-01 00:21:46.008834
62	20210623000000000_external-tickets	2022-06-01 00:21:46.017571
63	20210628000000000_run-log-indexes	2022-06-01 00:21:46.034964
64	20210715000000000_external-tickets	2022-06-01 00:21:46.044123
65	20210806000000000_run-log-indexes	2022-06-01 00:21:46.047436
66	20210812000000000_tickets-rename	2022-06-01 00:21:46.065665
67	20210812000000001_tickets-rename-finish	2022-06-01 00:21:46.066466
68	20210822000000000_walkthrough-config	2022-06-01 00:21:46.073464
69	20210825000000000_data-import-type	2022-06-01 00:21:46.076199
70	20210914000000000_tool-workflow-indexes	2022-06-01 00:21:46.079659
71	20210917000000000_add-tool-icons	2022-06-01 00:21:46.086337
72	20210924000000000_domain-settings	2022-06-01 00:21:46.088433
73	20211008000000000_collection-descriptions	2022-06-01 00:21:46.094724
74	20211111000000000_domain-settings-unused-columns	2022-06-01 00:21:46.097016
75	20211203000000000_drop-tool-use-and-workflow-view-counts	2022-06-01 00:21:46.09924
76	20220209000000000_logged-at	2022-06-01 00:21:46.107492
77	20220404233847145_add-front-to-domain-settings	2022-06-01 00:21:46.111688
78	20220412165549934_update-front-domain-settings	2022-06-01 00:21:46.113722
79	20220421205306891_create-external-data-references	2022-06-01 00:21:46.122675
80	20220426175149557_external-data-reference-add-constaint	2022-06-01 00:21:46.129611
81	20220518184554814_add-external-data-reference-index	2022-06-01 00:21:46.131867
82	20220519000000000_add-shadow-column-to-organization	2022-06-01 00:21:46.134831
83	20220519000000001_fill-in-organization-shadow-records	2022-06-01 00:21:46.141055
84	20220525000000000_add-data-source	2022-06-01 00:21:46.146386
85	20220526000000001_user-organization-non-null	2022-06-01 00:21:46.155801
86	20220531000000000_add-widgets	2022-06-01 00:21:46.165482
\.


--
-- Data for Name: product_changes; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.product_changes (id, created_at, title, description, is_major) FROM stdin;
\.


--
-- Data for Name: session_entries; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.session_entries (id, received_at, user_id, browser_instance_id, "timestamp", action, window_id, tab_id, data) FROM stdin;
\.


--
-- Data for Name: shortcuts; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.shortcuts (id, created_at, updated_at, organization_id, user_id, static_id, shortcut) FROM stdin;
\.


--
-- Data for Name: space_acl; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.space_acl (id, created_at, updated_at, static_id, user_id, user_group_id) FROM stdin;
\.


--
-- Data for Name: spaces; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.spaces (id, created_at, created_by_user_id, previous_version_id, is_latest, static_id, is_deleted, major_change_description, branched_from_id, metadata, suggested_by_user_id, branch_type, branch_id, widgets, icon, name, organization_id, visible_to_org) FROM stdin;
\.


--
-- Data for Name: tool_run_logs; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.tool_run_logs (id, created_at, user_id, tool_id, log) FROM stdin;
\.


--
-- Data for Name: tools; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.tools (id, created_at, static_id, is_latest, is_deleted, name, description, component, configuration, created_by_user_id, previous_version_id, inputs, major_change_description, collection_id, branched_from_id, metadata, suggested_by_user_id, branch_type, branch_id, keywords, icon) FROM stdin;
\.


--
-- Data for Name: user_change_views; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_change_views (id, created_at, user_id, static_id, latest_view) FROM stdin;
\.


--
-- Data for Name: user_domain_settings; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_domain_settings (id, created_at, updated_at, user_id, domain_id, open, domain_interface_options) FROM stdin;
\.


--
-- Data for Name: user_group_members; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_group_members (user_id, user_group_id, created_at, manager) FROM stdin;
\.


--
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_groups (id, organization_id, created_at, updated_at, name) FROM stdin;
\.


--
-- Data for Name: user_item_settings; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_item_settings (created_at, updated_at, user_id, static_id, data) FROM stdin;
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_notifications (id, created_at, user_id, notification_id, dismissed_at, viewed_at) FROM stdin;
\.


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_subscriptions (user_id, static_id, subscribed, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_tool_runs; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_tool_runs (id, created_at, run_at, revision_id, static_id, user_id, conversation_id) FROM stdin;
\.


--
-- Data for Name: user_workflow_views; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.user_workflow_views (id, created_at, viewed_at, revision_id, static_id, user_id, conversation_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.users (id, organization_id, google_id, email, name, created_at, updated_at, given_name, userinfo_first, userinfo_latest, type, is_organization_admin, wants_edit_suggestion_emails, disabled_at) FROM stdin;
1	1	\N	support@kenchi.com	Kenchi	2022-06-01 00:21:46.0046	2022-06-01 00:21:46.0046	Kenchi	\N	\N	kenchi	t	f	\N
\.


--
-- Data for Name: waitlist; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.waitlist (id, email, created_at, invited_at) FROM stdin;
\.


--
-- Data for Name: widgets; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.widgets (id, static_id, created_at, updated_at, is_latest, created_by_user_id, suggested_by_user_id, previous_version_id, major_change_description, branched_from_id, branch_type, branch_id, is_archived, organization_id, metadata, contents, inputs) FROM stdin;
\.


--
-- Data for Name: workflow_contains_object; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.workflow_contains_object (id, created_at, workflow_static_id, object_type, object_static_id) FROM stdin;
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: kenchi
--

COPY public.workflows (id, name, contents, created_at, created_by_user_id, previous_version_id, is_latest, static_id, description, is_deleted, collection_id, major_change_description, branched_from_id, metadata, suggested_by_user_id, branch_type, branch_id, icon, keywords) FROM stdin;
\.


--
-- Name: collection_acl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.collection_acl_id_seq', 1, false);


--
-- Name: collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.collections_id_seq', 1, false);


--
-- Name: data_imports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.data_imports_id_seq', 1, false);


--
-- Name: domains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.domains_id_seq', 5, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.feedback_id_seq', 1, false);


--
-- Name: logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.logs_id_seq', 1, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, true);


--
-- Name: page_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.page_snapshots_id_seq', 1, false);


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.pgmigrations_id_seq', 86, true);


--
-- Name: product_changes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.product_changes_id_seq', 1, false);


--
-- Name: session_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.session_entries_id_seq', 1, false);


--
-- Name: shortcuts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.shortcuts_id_seq', 1, false);


--
-- Name: space_acl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.space_acl_id_seq', 1, false);


--
-- Name: spaces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.spaces_id_seq', 1, false);


--
-- Name: tool_run_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.tool_run_logs_id_seq', 1, false);


--
-- Name: tools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.tools_id_seq', 1, false);


--
-- Name: user_change_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.user_change_views_id_seq', 1, false);


--
-- Name: user_domain_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.user_domain_settings_id_seq', 1, false);


--
-- Name: user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.user_groups_id_seq', 1, false);


--
-- Name: user_tool_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.user_tool_runs_id_seq', 1, false);


--
-- Name: user_workflow_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.user_workflow_views_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: waitlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.waitlist_id_seq', 1, false);


--
-- Name: widgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.widgets_id_seq', 1, false);


--
-- Name: workflow_contains_object_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.workflow_contains_object_id_seq', 1, false);


--
-- Name: workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kenchi
--

SELECT pg_catalog.setval('public.workflows_id_seq', 1, false);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_secret_key; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_secret_key UNIQUE (secret);


--
-- Name: collection_acl collection_acl_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collection_acl
    ADD CONSTRAINT collection_acl_pkey PRIMARY KEY (id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: data_imports data_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.data_imports
    ADD CONSTRAINT data_imports_pkey PRIMARY KEY (id);


--
-- Name: data_sources data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_pkey PRIMARY KEY (id);


--
-- Name: domains domains_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_pkey PRIMARY KEY (id);


--
-- Name: external_data_references external_data_references_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.external_data_references
    ADD CONSTRAINT external_data_references_pkey PRIMARY KEY (id);


--
-- Name: external_tags external_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.external_tags
    ADD CONSTRAINT external_tags_pkey PRIMARY KEY (id);


--
-- Name: insights_conversations external_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.insights_conversations
    ADD CONSTRAINT external_tickets_pkey PRIMARY KEY (organization_id, id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_google_domain_key; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_google_domain_key UNIQUE (google_domain);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: page_snapshots page_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.page_snapshots
    ADD CONSTRAINT page_snapshots_pkey PRIMARY KEY (id);


--
-- Name: pgmigrations pgmigrations_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.pgmigrations
    ADD CONSTRAINT pgmigrations_pkey PRIMARY KEY (id);


--
-- Name: product_changes product_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.product_changes
    ADD CONSTRAINT product_changes_pkey PRIMARY KEY (id);


--
-- Name: session_entries session_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.session_entries
    ADD CONSTRAINT session_entries_pkey PRIMARY KEY (id);


--
-- Name: shortcuts shortcuts_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.shortcuts
    ADD CONSTRAINT shortcuts_pkey PRIMARY KEY (id);


--
-- Name: space_acl space_acl_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.space_acl
    ADD CONSTRAINT space_acl_pkey PRIMARY KEY (id);


--
-- Name: spaces spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_pkey PRIMARY KEY (id);


--
-- Name: tool_run_logs tool_run_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tool_run_logs
    ADD CONSTRAINT tool_run_logs_pkey PRIMARY KEY (id);


--
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


--
-- Name: user_change_views user_change_views_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_change_views
    ADD CONSTRAINT user_change_views_pkey PRIMARY KEY (id);


--
-- Name: user_change_views user_change_views_user_id_static_id_key; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_change_views
    ADD CONSTRAINT user_change_views_user_id_static_id_key UNIQUE (user_id, static_id);


--
-- Name: user_domain_settings user_domain_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_domain_settings
    ADD CONSTRAINT user_domain_settings_pkey PRIMARY KEY (id);


--
-- Name: user_domain_settings user_domain_settings_user_id_domain_id_key; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_domain_settings
    ADD CONSTRAINT user_domain_settings_user_id_domain_id_key UNIQUE (user_id, domain_id);


--
-- Name: user_group_members user_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_group_members
    ADD CONSTRAINT user_group_members_pkey PRIMARY KEY (user_id, user_group_id);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: user_item_settings user_item_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_item_settings
    ADD CONSTRAINT user_item_settings_pkey PRIMARY KEY (user_id, static_id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (user_id, static_id);


--
-- Name: user_tool_runs user_tool_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_tool_runs
    ADD CONSTRAINT user_tool_runs_pkey PRIMARY KEY (id);


--
-- Name: user_workflow_views user_workflow_views_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_workflow_views
    ADD CONSTRAINT user_workflow_views_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: widgets widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_pkey PRIMARY KEY (id);


--
-- Name: workflow_contains_object workflow_contains_object_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflow_contains_object
    ADD CONSTRAINT workflow_contains_object_pkey PRIMARY KEY (id);


--
-- Name: workflow_contains_object workflow_contains_object_uniq_workflow_static_id_object_static_; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflow_contains_object
    ADD CONSTRAINT workflow_contains_object_uniq_workflow_static_id_object_static_ UNIQUE (workflow_static_id, object_static_id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: data_sources_organization_id_is_archived_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX data_sources_organization_id_is_archived_index ON public.data_sources USING btree (organization_id, is_archived);


--
-- Name: external_data_references_organization_id_is_archived_reference_; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX external_data_references_organization_id_is_archived_reference_ ON public.external_data_references USING btree (organization_id, is_archived, reference_source, reference_type);


--
-- Name: idx_collectionAcls_collection_user; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_collectionAcls_collection_user" ON public.collection_acl USING btree (collection_id, user_id) WHERE (user_group_id IS NULL);


--
-- Name: idx_collectionAcls_collection_userGroup; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_collectionAcls_collection_userGroup" ON public.collection_acl USING btree (collection_id, user_group_id) WHERE (user_id IS NULL);


--
-- Name: idx_external_tags_organization_id; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX idx_external_tags_organization_id ON public.external_tags USING btree (organization_id);


--
-- Name: idx_group_unique_name_organization; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX idx_group_unique_name_organization ON public.user_groups USING btree (organization_id, name);


--
-- Name: idx_shortcuts_unique_shortcut_organizationId; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_shortcuts_unique_shortcut_organizationId" ON public.shortcuts USING btree (organization_id, shortcut) WHERE (user_id IS NULL);


--
-- Name: idx_shortcuts_unique_shortcut_userId; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_shortcuts_unique_shortcut_userId" ON public.shortcuts USING btree (user_id, shortcut) WHERE (organization_id IS NULL);


--
-- Name: idx_shortcuts_unique_staticId_organizationId; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_shortcuts_unique_staticId_organizationId" ON public.shortcuts USING btree (organization_id, static_id) WHERE (user_id IS NULL);


--
-- Name: idx_shortcuts_unique_staticId_userId; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_shortcuts_unique_staticId_userId" ON public.shortcuts USING btree (user_id, static_id) WHERE (organization_id IS NULL);


--
-- Name: idx_spaceAcl_collection_user; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_spaceAcl_collection_user" ON public.space_acl USING btree (static_id, user_id) WHERE (user_group_id IS NULL);


--
-- Name: idx_spaceAcl_collection_userGroup; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_spaceAcl_collection_userGroup" ON public.space_acl USING btree (static_id, user_group_id) WHERE (user_id IS NULL);


--
-- Name: idx_spaces_staticId_isLatest_branchType; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX "idx_spaces_staticId_isLatest_branchType" ON public.spaces USING btree (static_id, is_latest, branch_type);


--
-- Name: idx_spaces_unique_branchId_branchTypeUnpublished; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_spaces_unique_branchId_branchTypeUnpublished" ON public.spaces USING btree (branch_id) WHERE ((is_latest = true) AND (branch_type <> 'published'::public.branch_type_enum));


--
-- Name: idx_spaces_unique_staticId_branchTypePublished; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_spaces_unique_staticId_branchTypePublished" ON public.spaces USING btree (static_id) WHERE ((is_latest = true) AND (branch_type = 'published'::public.branch_type_enum));


--
-- Name: idx_tools_staticId_isLatest_branchType; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX "idx_tools_staticId_isLatest_branchType" ON public.tools USING btree (static_id, is_latest, branch_type);


--
-- Name: idx_tools_unique_branchId_branchTypeUnpublished; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_tools_unique_branchId_branchTypeUnpublished" ON public.tools USING btree (branch_id) WHERE ((is_latest = true) AND (branch_type <> 'published'::public.branch_type_enum));


--
-- Name: idx_tools_unique_staticId_branchTypePublished; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_tools_unique_staticId_branchTypePublished" ON public.tools USING btree (static_id) WHERE ((is_latest = true) AND (branch_type = 'published'::public.branch_type_enum));


--
-- Name: idx_user_change_views_unique_userId; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_user_change_views_unique_userId" ON public.user_change_views USING btree (user_id) WHERE (static_id IS NULL);


--
-- Name: idx_workflows_staticId_isLatest_branchType; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX "idx_workflows_staticId_isLatest_branchType" ON public.workflows USING btree (static_id, is_latest, branch_type);


--
-- Name: idx_workflows_unique_branchId_branchTypeUnpublished; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_workflows_unique_branchId_branchTypeUnpublished" ON public.workflows USING btree (branch_id) WHERE ((is_latest = true) AND (branch_type <> 'published'::public.branch_type_enum));


--
-- Name: idx_workflows_unique_staticId_branchTypePublished; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE UNIQUE INDEX "idx_workflows_unique_staticId_branchTypePublished" ON public.workflows USING btree (static_id) WHERE ((is_latest = true) AND (branch_type = 'published'::public.branch_type_enum));


--
-- Name: insights_conversations_organization_id_rated_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX insights_conversations_organization_id_rated_at_index ON public.insights_conversations USING btree (organization_id, rated_at);


--
-- Name: logs_logged_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX logs_logged_at_index ON public.logs USING btree (logged_at);


--
-- Name: tools_is_latest_branch_type_collection_id_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX tools_is_latest_branch_type_collection_id_index ON public.tools USING btree (is_latest, branch_type, collection_id);


--
-- Name: user_tool_runs_run_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX user_tool_runs_run_at_index ON public.user_tool_runs USING btree (run_at);


--
-- Name: user_tool_runs_static_id_run_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX user_tool_runs_static_id_run_at_index ON public.user_tool_runs USING btree (static_id, run_at);


--
-- Name: user_tool_runs_user_id_run_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX user_tool_runs_user_id_run_at_index ON public.user_tool_runs USING btree (user_id, run_at);


--
-- Name: user_workflow_views_static_id_viewed_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX user_workflow_views_static_id_viewed_at_index ON public.user_workflow_views USING btree (static_id, viewed_at);


--
-- Name: user_workflow_views_user_id_viewed_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX user_workflow_views_user_id_viewed_at_index ON public.user_workflow_views USING btree (user_id, viewed_at);


--
-- Name: user_workflow_views_viewed_at_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX user_workflow_views_viewed_at_index ON public.user_workflow_views USING btree (viewed_at);


--
-- Name: widgets_static_id_is_latest_branch_type_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX widgets_static_id_is_latest_branch_type_index ON public.widgets USING btree (static_id, is_latest, branch_type);


--
-- Name: workflow_contains_object_object_static_id_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX workflow_contains_object_object_static_id_index ON public.workflow_contains_object USING btree (object_static_id);


--
-- Name: workflow_contains_object_workflow_static_id_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX workflow_contains_object_workflow_static_id_index ON public.workflow_contains_object USING btree (workflow_static_id);


--
-- Name: workflows_is_latest_branch_type_collection_id_index; Type: INDEX; Schema: public; Owner: kenchi
--

CREATE INDEX workflows_is_latest_branch_type_collection_id_index ON public.workflows USING btree (is_latest, branch_type, collection_id);


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: collection_acl collection_acl_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collection_acl
    ADD CONSTRAINT collection_acl_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id);


--
-- Name: collection_acl collection_acl_user_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collection_acl
    ADD CONSTRAINT collection_acl_user_group_id_fkey FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: collection_acl collection_acl_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collection_acl
    ADD CONSTRAINT collection_acl_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: collections collections_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: data_imports data_imports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.data_imports
    ADD CONSTRAINT data_imports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: data_sources data_sources_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: domains domains_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: external_data_references external_data_references_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.external_data_references
    ADD CONSTRAINT external_data_references_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: external_data_references external_data_references_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.external_data_references
    ADD CONSTRAINT external_data_references_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: external_tags external_tags_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.external_tags
    ADD CONSTRAINT external_tags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: insights_conversations external_tickets_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.insights_conversations
    ADD CONSTRAINT external_tickets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: page_snapshots page_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.page_snapshots
    ADD CONSTRAINT page_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: session_entries session_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.session_entries
    ADD CONSTRAINT session_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shortcuts shortcuts_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.shortcuts
    ADD CONSTRAINT shortcuts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: shortcuts shortcuts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.shortcuts
    ADD CONSTRAINT shortcuts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: space_acl space_acl_user_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.space_acl
    ADD CONSTRAINT space_acl_user_group_id_fkey FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: space_acl space_acl_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.space_acl
    ADD CONSTRAINT space_acl_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: spaces spaces_branched_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_branched_from_id_fkey FOREIGN KEY (branched_from_id) REFERENCES public.spaces(id);


--
-- Name: spaces spaces_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: spaces spaces_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: spaces spaces_previous_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES public.spaces(id);


--
-- Name: spaces spaces_suggested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_suggested_by_user_id_fkey FOREIGN KEY (suggested_by_user_id) REFERENCES public.users(id);


--
-- Name: tool_run_logs tool_run_logs_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tool_run_logs
    ADD CONSTRAINT tool_run_logs_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id);


--
-- Name: tool_run_logs tool_run_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tool_run_logs
    ADD CONSTRAINT tool_run_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tools tools_branched_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_branched_from_id_fkey FOREIGN KEY (branched_from_id) REFERENCES public.tools(id);


--
-- Name: tools tools_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id);


--
-- Name: tools tools_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: tools tools_previous_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES public.tools(id);


--
-- Name: tools tools_suggested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_suggested_by_user_id_fkey FOREIGN KEY (suggested_by_user_id) REFERENCES public.users(id);


--
-- Name: user_change_views user_change_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_change_views
    ADD CONSTRAINT user_change_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_domain_settings user_domain_settings_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_domain_settings
    ADD CONSTRAINT user_domain_settings_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id);


--
-- Name: user_domain_settings user_domain_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_domain_settings
    ADD CONSTRAINT user_domain_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_group_members user_group_members_user_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_group_members
    ADD CONSTRAINT user_group_members_user_group_id_fkey FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: user_group_members user_group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_group_members
    ADD CONSTRAINT user_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_groups user_groups_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: user_item_settings user_item_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_item_settings
    ADD CONSTRAINT user_item_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_notifications user_notifications_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id);


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_tool_runs user_tool_runs_revision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_tool_runs
    ADD CONSTRAINT user_tool_runs_revision_id_fkey FOREIGN KEY (revision_id) REFERENCES public.tools(id);


--
-- Name: user_tool_runs user_tool_runs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_tool_runs
    ADD CONSTRAINT user_tool_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_workflow_views user_workflow_views_revision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_workflow_views
    ADD CONSTRAINT user_workflow_views_revision_id_fkey FOREIGN KEY (revision_id) REFERENCES public.tools(id);


--
-- Name: user_workflow_views user_workflow_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.user_workflow_views
    ADD CONSTRAINT user_workflow_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: widgets widgets_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: workflows workflows_branched_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_branched_from_id_fkey FOREIGN KEY (branched_from_id) REFERENCES public.workflows(id);


--
-- Name: workflows workflows_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id);


--
-- Name: workflows workflows_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: workflows workflows_previous_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES public.workflows(id);


--
-- Name: workflows workflows_suggested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kenchi
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_suggested_by_user_id_fkey FOREIGN KEY (suggested_by_user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

