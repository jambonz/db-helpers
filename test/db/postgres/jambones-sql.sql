/* SET FOREIGN_KEY_CHECKS=0; */

DROP TABLE IF EXISTS account_static_ips cascade;

DROP TABLE IF EXISTS account_limits cascade;

DROP TABLE IF EXISTS account_products cascade;

DROP TABLE IF EXISTS account_subscriptions cascade;

DROP TABLE IF EXISTS beta_invite_codes cascade;

DROP TABLE IF EXISTS call_routes cascade;

DROP TABLE IF EXISTS clients cascade;

DROP TABLE IF EXISTS dns_records cascade;

DROP TABLE IF EXISTS lcr cascade;

DROP TABLE IF EXISTS lcr_carrier_set_entry cascade;

DROP TABLE IF EXISTS lcr_routes cascade;

DROP TABLE IF EXISTS password_settings cascade;

DROP TABLE IF EXISTS user_permissions cascade;

DROP TABLE IF EXISTS permissions cascade;

DROP TABLE IF EXISTS predefined_sip_gateways cascade;

DROP TABLE IF EXISTS predefined_smpp_gateways cascade;

DROP TABLE IF EXISTS predefined_carriers cascade;

DROP TABLE IF EXISTS account_offers cascade;

DROP TABLE IF EXISTS products cascade;

DROP TABLE IF EXISTS schema_version cascade;

DROP TABLE IF EXISTS api_keys cascade;

DROP TABLE IF EXISTS sbc_addresses cascade;

DROP TABLE IF EXISTS ms_teams_tenants cascade;

DROP TABLE IF EXISTS service_provider_limits cascade;

DROP TABLE IF EXISTS signup_history cascade;

DROP TABLE IF EXISTS smpp_addresses cascade;

DROP TABLE IF EXISTS google_custom_voices cascade;

DROP TABLE IF EXISTS speech_credentials cascade;

DROP TABLE IF EXISTS system_information cascade;

DROP TABLE IF EXISTS users cascade;

DROP TABLE IF EXISTS smpp_gateways cascade;

DROP TABLE IF EXISTS phone_numbers cascade;

DROP TABLE IF EXISTS sip_gateways cascade;

DROP TABLE IF EXISTS voip_carriers cascade;

DROP TABLE accounts cascade;

DROP TABLE IF EXISTS applications cascade;

DROP TABLE IF EXISTS service_providers cascade;

DROP TABLE IF EXISTS webhooks cascade;




CREATE TABLE account_static_ips (
    account_static_ip_sid CHAR(36) NOT NULL UNIQUE,
    account_sid CHAR(36) NOT NULL,
    public_ipv4 VARCHAR(16) NOT NULL UNIQUE,
    private_ipv4 BYTEA NOT NULL UNIQUE,
    PRIMARY KEY (account_static_ip_sid)
);

CREATE TABLE account_limits (
    account_limits_sid CHAR(36) NOT NULL UNIQUE,
    account_sid CHAR(36) NOT NULL,
    category VARCHAR(30) CHECK (category IN ('api_rate', 'voice_call_session', 'device', 'voice_call_minutes', 'voice_call_session_license', 'voice_call_minutes_license')) NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (account_limits_sid)
);

CREATE TABLE account_subscriptions (
    account_subscription_sid CHAR(36) NOT NULL UNIQUE,
    account_sid CHAR(36) NOT NULL,
    pending BOOLEAN NOT NULL DEFAULT false,
    effective_start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_end_date TIMESTAMP,
    change_reason VARCHAR(255),
    stripe_subscription_id VARCHAR(56),
    stripe_payment_method_id VARCHAR(56),
    stripe_statement_descriptor VARCHAR(255),
    last4 VARCHAR(512),
    exp_month INTEGER,
    exp_year INTEGER,
    card_type VARCHAR(16),
    pending_reason BYTEA,
    PRIMARY KEY (account_subscription_sid)
);

CREATE TABLE beta_invite_codes (
    invite_code CHAR(6) NOT NULL UNIQUE,
    in_use BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (invite_code)
);

CREATE TABLE call_routes (
    call_route_sid CHAR(36) NOT NULL UNIQUE,
    priority INTEGER NOT NULL,
    account_sid CHAR(36) NOT NULL,
    regex VARCHAR(255) NOT NULL,
    application_sid CHAR(36) NOT NULL,
    PRIMARY KEY (call_route_sid)
);

CREATE TABLE clients (
    client_sid CHAR(36) NOT NULL UNIQUE,
    account_sid CHAR(36) NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    username VARCHAR(64),
    password VARCHAR(1024),
    allow_direct_app_calling INTEGER NOT NULL DEFAULT 1,
    allow_direct_queue_calling INTEGER NOT NULL DEFAULT 1,
    allow_direct_user_calling INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (client_sid)
);

CREATE TABLE dns_records (
    dns_record_sid CHAR(36) NOT NULL UNIQUE,
    account_sid CHAR(36) NOT NULL,
    record_type VARCHAR(6) NOT NULL,
    record_id INTEGER NOT NULL,
    PRIMARY KEY (dns_record_sid)
);

CREATE TABLE lcr_routes (
    lcr_route_sid CHAR(36),
    lcr_sid CHAR(36) NOT NULL,
    regex VARCHAR(32) NOT NULL,
    description VARCHAR(1024),
    priority INTEGER NOT NULL,
    PRIMARY KEY (lcr_route_sid)
);

COMMENT ON COLUMN lcr_routes.regex IS 'regex-based pattern match against dialed number, used for LCR routing of PSTN calls';
COMMENT ON COLUMN lcr_routes.priority IS 'lower priority routes are attempted first';

CREATE TABLE lcr (
    lcr_sid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(64),
    is_active INTEGER NOT NULL DEFAULT 1,
    default_carrier_set_entry_sid CHAR(36),
    service_provider_sid CHAR(36),
    account_sid CHAR(36),
    PRIMARY KEY (lcr_sid)
);

COMMENT ON COLUMN lcr.name IS 'User-assigned name for this LCR table';
COMMENT ON COLUMN lcr.default_carrier_set_entry_sid IS 'default carrier/route to use when no digit match based results are found.';

CREATE TABLE password_settings (
    min_password_length INTEGER NOT NULL DEFAULT 8,
    require_digit BOOLEAN NOT NULL DEFAULT false,
    require_special_character BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE permissions (
    permission_sid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(32) NOT NULL UNIQUE,
    description VARCHAR(255),
    PRIMARY KEY (permission_sid)
);


CREATE TABLE predefined_carriers (
    predefined_carrier_sid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    requires_static_ip BOOLEAN NOT NULL DEFAULT false,
    e164_leading_plus INTEGER NOT NULL DEFAULT 0,
    requires_register INTEGER NOT NULL DEFAULT 0,
    register_username VARCHAR(64),
    register_sip_realm VARCHAR(64),
    register_password VARCHAR(64),
    tech_prefix VARCHAR(16),
    inbound_auth_username VARCHAR(64),
    inbound_auth_password VARCHAR(64),
    diversion VARCHAR(32),
    PRIMARY KEY (predefined_carrier_sid)
);

CREATE TABLE predefined_sip_gateways (
    predefined_sip_gateway_sid CHAR(36) NOT NULL UNIQUE,
    ipv4 VARCHAR(128) NOT NULL,
    port INTEGER NOT NULL DEFAULT 5060,
    inbound BOOLEAN NOT NULL,
    outbound BOOLEAN NOT NULL,
    netmask INTEGER NOT NULL DEFAULT 32,
    predefined_carrier_sid CHAR(36) NOT NULL,
    PRIMARY KEY (predefined_sip_gateway_sid)
);

CREATE TABLE predefined_smpp_gateways (
    predefined_smpp_gateway_sid CHAR(36) NOT NULL UNIQUE,
    ipv4 VARCHAR(128) NOT NULL,
    port INTEGER NOT NULL DEFAULT 2775,
    inbound BOOLEAN NOT NULL,
    outbound BOOLEAN NOT NULL,
    netmask INTEGER NOT NULL DEFAULT 32,
    is_primary INTEGER NOT NULL DEFAULT 1,
    use_tls INTEGER NOT NULL DEFAULT 0,
    predefined_carrier_sid CHAR(36) NOT NULL,
    PRIMARY KEY (predefined_smpp_gateway_sid)
);

CREATE TABLE products (
    product_sid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(32) NOT NULL,
    category VARCHAR(30) CHECK (category IN ('api_rate', 'voice_call_session', 'device')) NOT NULL,
    PRIMARY KEY (product_sid)
);

CREATE TABLE account_products (
    account_product_sid CHAR(36) NOT NULL UNIQUE,
    account_subscription_sid CHAR(36) NOT NULL,
    product_sid CHAR(36) NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (account_product_sid)
);

CREATE TABLE account_offers (
    account_offer_sid CHAR(36) NOT NULL UNIQUE,
    account_sid CHAR(36) NOT NULL,
    product_sid CHAR(36) NOT NULL,
    stripe_product_id VARCHAR(56) NOT NULL,
    PRIMARY KEY (account_offer_sid)
);

-- Add comments
COMMENT ON COLUMN predefined_carriers.e164_leading_plus IS 'if true, a leading plus should be prepended to outbound phone numbers';
COMMENT ON COLUMN predefined_carriers.tech_prefix IS 'tech prefix to prepend to outbound calls to this carrier';

COMMENT ON COLUMN predefined_sip_gateways.ipv4 IS 'ip address or DNS name of the gateway. For gateways providing inbound calling service, ip address is required.';
COMMENT ON COLUMN predefined_sip_gateways.port IS 'sip signaling port';
COMMENT ON COLUMN predefined_sip_gateways.inbound IS 'if true, whitelist this IP to allow inbound calls from the gateway';
COMMENT ON COLUMN predefined_sip_gateways.outbound IS 'if true, include in least-cost routing when placing calls to the PSTN';

COMMENT ON COLUMN predefined_smpp_gateways.ipv4 IS 'ip address or DNS name of the gateway.';
COMMENT ON COLUMN predefined_smpp_gateways.port IS 'smpp signaling port';
COMMENT ON COLUMN predefined_smpp_gateways.inbound IS 'if true, whitelist this IP to allow inbound SMS from the gateway';


CREATE TABLE schema_version
(
version VARCHAR(16)
);

CREATE TABLE api_keys
(
api_key_sid CHAR(36) NOT NULL UNIQUE ,
token CHAR(36) NOT NULL UNIQUE ,
account_sid CHAR(36),
service_provider_sid CHAR(36),
expires_at TIMESTAMP(0) NULL  DEFAULT NULL,
last_used TIMESTAMP(0) NULL  DEFAULT NULL,
created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (api_key_sid)
) ;

CREATE TABLE sbc_addresses
(
sbc_address_sid CHAR(36) NOT NULL UNIQUE ,
ipv4 VARCHAR(255) NOT NULL,
port INTEGER NOT NULL DEFAULT 5060,
tls_port INTEGER,
wss_port INTEGER,
service_provider_sid CHAR(36),
last_updated TIMESTAMP(0),
PRIMARY KEY (sbc_address_sid)
);

CREATE TABLE ms_teams_tenants
(
ms_teams_tenant_sid CHAR(36) NOT NULL UNIQUE ,
service_provider_sid CHAR(36) NOT NULL,
account_sid CHAR(36) NOT NULL,
application_sid CHAR(36),
tenant_fqdn VARCHAR(255) NOT NULL UNIQUE ,
PRIMARY KEY (ms_teams_tenant_sid)
) ;

CREATE TABLE service_provider_limits
(
service_provider_limits_sid CHAR(36) NOT NULL UNIQUE ,
service_provider_sid CHAR(36) NOT NULL,
category VARCHAR(30) CHECK (CATEGORY IN ('api_rate','voice_call_session', 'device','voice_call_minutes','voice_call_session_license', 'voice_call_minutes_license')) NOT NULL,
quantity INTEGER NOT NULL,
PRIMARY KEY (service_provider_limits_sid)
);

CREATE TABLE signup_history
(
email VARCHAR(255) NOT NULL,
name VARCHAR(255),
signed_up_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (email)
);

CREATE TABLE smpp_addresses (
    smpp_address_sid CHAR(36) NOT NULL UNIQUE,
    ipv4 VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 5060,
    use_tls INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 1,
    service_provider_sid CHAR(36),
    PRIMARY KEY (smpp_address_sid)
);

CREATE TABLE speech_credentials (
    speech_credential_sid CHAR(36) NOT NULL UNIQUE,
    service_provider_sid CHAR(36),
    account_sid CHAR(36),
    vendor VARCHAR(32) NOT NULL,
    credential VARCHAR(8192) NOT NULL,
    use_for_tts BOOLEAN DEFAULT true,
    use_for_stt BOOLEAN DEFAULT true,
    last_used TIMESTAMP,
    last_tested TIMESTAMP,
    tts_tested_ok BOOLEAN,
    stt_tested_ok BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    label VARCHAR(64),
    PRIMARY KEY (speech_credential_sid)
);

CREATE TABLE google_custom_voices (
    google_custom_voice_sid CHAR(36) NOT NULL UNIQUE,
    speech_credential_sid CHAR(36) NOT NULL,
    model VARCHAR(512) NOT NULL,
    reported_usage VARCHAR(30) CHECK (reported_usage IN ('REPORTED_USAGE_UNSPECIFIED', 'REALTIME', 'OFFLINE')) DEFAULT 'REALTIME',
    name VARCHAR(64) NOT NULL,
    PRIMARY KEY (google_custom_voice_sid)
);

CREATE TABLE system_information (
    domain_name VARCHAR(255),
    sip_domain_name VARCHAR(255),
    monitoring_domain_name VARCHAR(255)
);

CREATE TABLE users (
    user_sid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    pending_email VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    hashed_password VARCHAR(1024),
    account_sid CHAR(36),
    service_provider_sid CHAR(36),
    force_change BOOLEAN NOT NULL DEFAULT FALSE,
    provider VARCHAR(255) NOT NULL,
    provider_userid VARCHAR(255),
    scope VARCHAR(16) NOT NULL DEFAULT 'read-write',
    phone_activation_code VARCHAR(16),
    email_activation_code VARCHAR(16),
    email_validated BOOLEAN NOT NULL DEFAULT false,
    phone_validated BOOLEAN NOT NULL DEFAULT false,
    email_content_opt_out BOOLEAN NOT NULL DEFAULT false,
    is_active INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_sid)
);

CREATE TABLE voip_carriers (
    voip_carrier_sid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    account_sid CHAR(36),
    service_provider_sid CHAR(36),
    application_sid CHAR(36),
    e164_leading_plus INTEGER NOT NULL DEFAULT 0,
    requires_register INTEGER NOT NULL DEFAULT 0,
    register_username VARCHAR(64),
    register_sip_realm VARCHAR(64),
    register_password VARCHAR(64),
    tech_prefix VARCHAR(16),
    inbound_auth_username VARCHAR(64),
    inbound_auth_password VARCHAR(64),
    diversion VARCHAR(32),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    smpp_system_id VARCHAR(255),
    smpp_password VARCHAR(64),
    smpp_enquire_link_interval INTEGER DEFAULT 0,
    smpp_inbound_system_id VARCHAR(255),
    smpp_inbound_password VARCHAR(64),
    register_from_user VARCHAR(128),
    register_from_domain VARCHAR(255),
    register_public_ip_in_contact BOOLEAN NOT NULL DEFAULT false,
    register_status JSONB,
    PRIMARY KEY (voip_carrier_sid)
);

-- Add comments for voip_carriers
COMMENT ON COLUMN voip_carriers.account_sid IS 'if provided, indicates this entity represents a sip trunk that is associated with a specific account';
COMMENT ON COLUMN voip_carriers.application_sid IS 'If provided, all incoming calls from this source will be routed to the associated application';
COMMENT ON COLUMN voip_carriers.e164_leading_plus IS 'if true, a leading plus should be prepended to outbound phone numbers';
COMMENT ON COLUMN voip_carriers.tech_prefix IS 'tech prefix to prepend to outbound calls to this carrier';

CREATE TABLE user_permissions
(
user_permissions_sid CHAR(36) NOT NULL UNIQUE ,
user_sid CHAR(36) NOT NULL,
permission_sid CHAR(36) NOT NULL,
PRIMARY KEY (user_permissions_sid)
);

CREATE TABLE smpp_gateways (
    smpp_gateway_sid CHAR(36) NOT NULL UNIQUE,
    ipv4 VARCHAR(128) NOT NULL,
    port INTEGER NOT NULL DEFAULT 2775,
    netmask INTEGER NOT NULL DEFAULT 32,
    is_primary INTEGER NOT NULL DEFAULT 1,
    inbound INTEGER NOT NULL DEFAULT 0,
    outbound INTEGER NOT NULL DEFAULT 1,
    use_tls INTEGER NOT NULL DEFAULT 0,
    voip_carrier_sid CHAR(36) NOT NULL,
    PRIMARY KEY (smpp_gateway_sid)
);

-- Add comments separately
COMMENT ON COLUMN smpp_gateways.inbound IS 'if true, whitelist this IP to allow inbound calls from the gateway';
COMMENT ON COLUMN smpp_gateways.outbound IS 'if true, include in least-cost routing when placing calls to the PSTN';

CREATE TABLE phone_numbers (
    phone_number_sid CHAR(36) UNIQUE,
    number VARCHAR(132) NOT NULL,
    voip_carrier_sid CHAR(36),
    account_sid CHAR(36),
    application_sid CHAR(36),
    service_provider_sid CHAR(36),
    PRIMARY KEY (phone_number_sid)
);

COMMENT ON COLUMN phone_numbers.service_provider_sid IS 'if not null, this number is a test number for the associated service provider';

CREATE TABLE sip_gateways (
    sip_gateway_sid CHAR(36),
    ipv4 VARCHAR(128) NOT NULL,
    netmask INTEGER NOT NULL DEFAULT 32,
    port INTEGER,
    inbound INTEGER NOT NULL DEFAULT 0,
    outbound INTEGER NOT NULL DEFAULT 0,
    voip_carrier_sid CHAR(36) NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    send_options_ping INTEGER NOT NULL DEFAULT 0,
    pad_crypto INTEGER NOT NULL DEFAULT 0,
    protocol VARCHAR(30) CHECK (protocol IN ('udp', 'tcp', 'tls', 'tls/srtp')) DEFAULT 'udp',
    PRIMARY KEY (sip_gateway_sid)
);

CREATE TABLE lcr_carrier_set_entry (
    lcr_carrier_set_entry_sid CHAR(36),
    workload INTEGER NOT NULL DEFAULT 1,
    lcr_route_sid CHAR(36) NOT NULL,
    voip_carrier_sid CHAR(36) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lcr_carrier_set_entry_sid)
);

-- Add comments for sip_gateways
COMMENT ON COLUMN sip_gateways.ipv4 IS 'ip address or DNS name of the gateway.  For gateways providing inbound calling service, ip address is required.';
COMMENT ON COLUMN sip_gateways.port IS 'sip signaling port';
COMMENT ON COLUMN sip_gateways.inbound IS 'if true, whitelist this IP to allow inbound calls from the gateway';
COMMENT ON COLUMN sip_gateways.outbound IS 'if true, include in least-cost routing when placing calls to the PSTN';
COMMENT ON COLUMN sip_gateways.protocol IS 'Outbound call protocol';

-- Add comments for lcr_carrier_set_entry
COMMENT ON COLUMN lcr_carrier_set_entry.workload IS 'represents a proportion of traffic to send through the associated carrier; can be used for load balancing traffic across carriers with a common priority for a destination';
COMMENT ON COLUMN lcr_carrier_set_entry.priority IS 'lower priority carriers are attempted first';


CREATE TABLE webhooks (
    webhook_sid CHAR(36) NOT NULL UNIQUE,
    url VARCHAR(1024) NOT NULL,
    method VARCHAR(30) CHECK (method IN ('GET', 'POST')) NOT NULL DEFAULT 'POST',
    username VARCHAR(255),
    password VARCHAR(255),
    PRIMARY KEY (webhook_sid)
);

CREATE TABLE applications (
   application_sid CHAR(36) NOT NULL UNIQUE,
   name VARCHAR(64) NOT NULL,
   service_provider_sid CHAR(36),
   account_sid CHAR(36),
   call_hook_sid CHAR(36),
   call_status_hook_sid CHAR(36),
   messaging_hook_sid CHAR(36),
   app_json TEXT,
   speech_synthesis_vendor VARCHAR(64) NOT NULL DEFAULT 'google',
   speech_synthesis_language VARCHAR(12) NOT NULL DEFAULT 'en-US',
   speech_synthesis_voice VARCHAR(64),
   speech_synthesis_label VARCHAR(64),
   speech_recognizer_vendor VARCHAR(64) NOT NULL DEFAULT 'google',
   speech_recognizer_language VARCHAR(64) NOT NULL DEFAULT 'en-US',
   speech_recognizer_label VARCHAR(64),
   use_for_fallback_speech BOOLEAN DEFAULT false,
   fallback_speech_synthesis_vendor VARCHAR(64),
   fallback_speech_synthesis_language VARCHAR(12),
   fallback_speech_synthesis_voice VARCHAR(64),
   fallback_speech_synthesis_label VARCHAR(64),
   fallback_speech_recognizer_vendor VARCHAR(64),
   fallback_speech_recognizer_language VARCHAR(64),
   fallback_speech_recognizer_label VARCHAR(64),
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   record_all_calls BOOLEAN NOT NULL DEFAULT false,
   PRIMARY KEY (application_sid)
);

-- Add table comment
COMMENT ON TABLE applications IS 'A defined set of behaviors to be applied to phone calls';

-- Add column comments
COMMENT ON COLUMN applications.service_provider_sid IS 'if non-null, this application is a test application that can be used by any account under the associated service provider';
COMMENT ON COLUMN applications.account_sid IS 'account that this application belongs to (if null, this is a service provider test application)';
COMMENT ON COLUMN applications.call_hook_sid IS 'webhook to call for inbound calls';
COMMENT ON COLUMN applications.call_status_hook_sid IS 'webhook to call for call status events';
COMMENT ON COLUMN applications.messaging_hook_sid IS 'webhook to call for inbound SMS/MMS';



CREATE TABLE service_providers (
   service_provider_sid CHAR(36) NOT NULL UNIQUE,
   name VARCHAR(64) NOT NULL UNIQUE,
   description VARCHAR(255),
   root_domain VARCHAR(128) UNIQUE,
   registration_hook_sid CHAR(36),
   ms_teams_fqdn VARCHAR(255),
   PRIMARY KEY (service_provider_sid)
);

COMMENT ON TABLE service_providers IS 'A partition of the platform used by one service provider';

CREATE TABLE accounts (
   account_sid CHAR(36) NOT NULL UNIQUE,
   name VARCHAR(64) NOT NULL,
   sip_realm VARCHAR(132) UNIQUE,
   service_provider_sid CHAR(36) NOT NULL,
   registration_hook_sid CHAR(36),
   queue_event_hook_sid CHAR(36),
   device_calling_application_sid CHAR(36),
   is_active INTEGER NOT NULL DEFAULT 1,  -- Kept as INTEGER for compatibility
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   plan_type VARCHAR(10) CHECK (plan_type IN ('trial', 'free', 'paid')) NOT NULL DEFAULT 'trial',
   stripe_customer_id VARCHAR(56),
   webhook_secret VARCHAR(36) NOT NULL,
   disable_cdrs INTEGER NOT NULL DEFAULT 0,  -- Kept as INTEGER for compatibility
   trial_end_date TIMESTAMP,
   deactivated_reason VARCHAR(255),
   device_to_call_ratio INTEGER NOT NULL DEFAULT 5,
   subspace_client_id VARCHAR(255),
   subspace_client_secret VARCHAR(255),
   subspace_sip_teleport_id VARCHAR(255),
   subspace_sip_teleport_destinations VARCHAR(255),
   siprec_hook_sid CHAR(36),
   record_all_calls INTEGER NOT NULL DEFAULT 0,  -- Kept as INTEGER for compatibility
   record_format VARCHAR(16) NOT NULL DEFAULT 'mp3',
   bucket_credential VARCHAR(8192),
   PRIMARY KEY (account_sid)
);

-- Add comments
COMMENT ON TABLE accounts IS 'An enterprise that uses the platform for comm services';
COMMENT ON COLUMN accounts.sip_realm IS 'sip domain that will be used for devices registering under this account';
COMMENT ON COLUMN accounts.service_provider_sid IS 'service provider that owns the customer relationship with this account';
COMMENT ON COLUMN accounts.registration_hook_sid IS 'webhook to call when devices underr this account attempt to register';
COMMENT ON COLUMN accounts.device_calling_application_sid IS 'application to use for outbound calling from an account';
COMMENT ON COLUMN accounts.bucket_credential IS 'credential used to authenticate with storage service';



   
-- Account Static IPs
CREATE INDEX account_static_ip_sid_idx ON account_static_ips (account_static_ip_sid);
CREATE INDEX account_sid_idx1 ON account_static_ips (account_sid);
ALTER TABLE account_static_ips ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);

-- Account Limits
CREATE INDEX account_sid_idx2 ON account_limits (account_sid);
ALTER TABLE account_limits ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid) ON DELETE CASCADE;

-- Account Subscriptions
CREATE INDEX account_subscription_sid_idx1 ON account_subscriptions (account_subscription_sid);
CREATE INDEX account_sid_idx3 ON account_subscriptions (account_sid);
ALTER TABLE account_subscriptions ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);

-- Beta Invite Codes
CREATE INDEX invite_code_idx ON beta_invite_codes (invite_code);

-- Call Routes
CREATE INDEX call_route_sid_idx ON call_routes (call_route_sid);
ALTER TABLE call_routes ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
ALTER TABLE call_routes ADD CONSTRAINT application_sid_fk 
    FOREIGN KEY (application_sid) REFERENCES applications (application_sid);

-- Clients
CREATE INDEX client_sid_idx ON clients (client_sid);
ALTER TABLE clients ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);

-- DNS Records
CREATE INDEX dns_record_sid_idx ON dns_records (dns_record_sid);
ALTER TABLE dns_records ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);

-- LCR Routes
CREATE INDEX lcr_sid_idx1 ON lcr_routes (lcr_sid);
ALTER TABLE lcr_routes ADD CONSTRAINT lcr_sid_fk 
    FOREIGN KEY (lcr_sid) REFERENCES lcr (lcr_sid);

-- LCR
CREATE INDEX lcr_sid_idx2 ON lcr (lcr_sid);
ALTER TABLE lcr ADD CONSTRAINT default_carrier_set_entry_sid_fk 
    FOREIGN KEY (default_carrier_set_entry_sid) REFERENCES lcr_carrier_set_entry (lcr_carrier_set_entry_sid);
CREATE INDEX service_provider_sid_idx1 ON lcr (service_provider_sid);
CREATE INDEX account_sid_idx4 ON lcr (account_sid);

-- Permissions
CREATE INDEX permission_sid_idx ON permissions (permission_sid);

-- Predefined Carriers
CREATE INDEX predefined_carrier_sid_idx1 ON predefined_carriers (predefined_carrier_sid);

-- Predefined SIP Gateways
CREATE INDEX predefined_sip_gateway_sid_idx ON predefined_sip_gateways (predefined_sip_gateway_sid);
CREATE INDEX predefined_carrier_sid_idx2 ON predefined_sip_gateways (predefined_carrier_sid);
ALTER TABLE predefined_sip_gateways ADD CONSTRAINT predefined_carrier_sid_fk 
    FOREIGN KEY (predefined_carrier_sid) REFERENCES predefined_carriers (predefined_carrier_sid);

-- Predefined SMPP Gateways
CREATE INDEX predefined_smpp_gateway_sid_idx ON predefined_smpp_gateways (predefined_smpp_gateway_sid);
CREATE INDEX predefined_carrier_sid_idx3 ON predefined_smpp_gateways (predefined_carrier_sid);
ALTER TABLE predefined_smpp_gateways ADD CONSTRAINT predefined_carrier_sid_fk 
    FOREIGN KEY (predefined_carrier_sid) REFERENCES predefined_carriers (predefined_carrier_sid);

-- Products and Account Products
CREATE INDEX product_sid_idx1 ON products (product_sid);
CREATE INDEX account_product_sid_idx ON account_products (account_product_sid);
CREATE INDEX account_subscription_sid_idx2 ON account_products (account_subscription_sid);
ALTER TABLE account_products ADD CONSTRAINT account_subscription_sid_fk 
    FOREIGN KEY (account_subscription_sid) REFERENCES account_subscriptions (account_subscription_sid);
ALTER TABLE account_products ADD CONSTRAINT product_sid_fk 
    FOREIGN KEY (product_sid) REFERENCES products (product_sid);

-- Account Offers
CREATE INDEX account_offer_sid_idx ON account_offers (account_offer_sid);
CREATE INDEX account_sid_idx5 ON account_offers (account_sid);
ALTER TABLE account_offers ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
CREATE INDEX product_sid_idx2 ON account_offers (product_sid);
ALTER TABLE account_offers ADD CONSTRAINT product_sid_fk 
    FOREIGN KEY (product_sid) REFERENCES products (product_sid);

-- API Keys
CREATE INDEX api_key_sid_idx ON api_keys (api_key_sid);
CREATE INDEX account_sid_idx6 ON api_keys (account_sid);
ALTER TABLE api_keys ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
CREATE INDEX service_provider_sid_idx2 ON api_keys (service_provider_sid);
ALTER TABLE api_keys ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);

-- SBC Addresses
CREATE INDEX sbc_addresses_idx_host_port ON sbc_addresses (ipv4, port);
CREATE INDEX sbc_address_sid_idx ON sbc_addresses (sbc_address_sid);
CREATE INDEX service_provider_sid_idx3 ON sbc_addresses (service_provider_sid);
ALTER TABLE sbc_addresses ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);

-- MS Teams Tenants
CREATE INDEX ms_teams_tenant_sid_idx ON ms_teams_tenants (ms_teams_tenant_sid);
ALTER TABLE ms_teams_tenants ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);
ALTER TABLE ms_teams_tenants ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
ALTER TABLE ms_teams_tenants ADD CONSTRAINT application_sid_fk 
    FOREIGN KEY (application_sid) REFERENCES applications (application_sid);
CREATE INDEX tenant_fqdn_idx ON ms_teams_tenants (tenant_fqdn);

-- Service Provider Limits
CREATE INDEX service_provider_sid_idx4 ON service_provider_limits (service_provider_sid);
ALTER TABLE service_provider_limits ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid) ON DELETE CASCADE;

-- Signup History
CREATE INDEX email_idx1 ON signup_history (email);

-- SMPP Addresses
CREATE INDEX smpp_address_sid_idx ON smpp_addresses (smpp_address_sid);
CREATE INDEX service_provider_sid_idx5 ON smpp_addresses (service_provider_sid);
ALTER TABLE smpp_addresses ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);

-- Speech Credentials
CREATE INDEX speech_credential_sid_idx1 ON speech_credentials (speech_credential_sid);
CREATE INDEX service_provider_sid_idx6 ON speech_credentials (service_provider_sid);
ALTER TABLE speech_credentials ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);
CREATE INDEX account_sid_idx7 ON speech_credentials (account_sid);
ALTER TABLE speech_credentials ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);

-- Google Custom Voices
CREATE INDEX google_custom_voice_sid_idx ON google_custom_voices (google_custom_voice_sid);
CREATE INDEX speech_credential_sid_idx2 ON google_custom_voices (speech_credential_sid);
ALTER TABLE google_custom_voices ADD CONSTRAINT speech_credential_sid_fk 
    FOREIGN KEY (speech_credential_sid) REFERENCES speech_credentials (speech_credential_sid) ON DELETE CASCADE;

-- Users
CREATE INDEX user_sid_idx2 ON users (user_sid);
CREATE INDEX email_idx2 ON users (email);
CREATE INDEX phone_idx ON users (phone);
CREATE INDEX account_sid_idx8 ON users (account_sid);
ALTER TABLE users ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
CREATE INDEX service_provider_sid_idx7 ON users (service_provider_sid);
ALTER TABLE users ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);
CREATE INDEX email_activation_code_idx ON users (email_activation_code);

-- VOIP Carriers
CREATE INDEX voip_carrier_sid_idx1 ON voip_carriers (voip_carrier_sid);
CREATE INDEX account_sid_idx9 ON voip_carriers (account_sid);

CREATE INDEX service_provider_sid_idx8 ON voip_carriers (service_provider_sid);
ALTER TABLE voip_carriers ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);
ALTER TABLE voip_carriers ADD CONSTRAINT application_sid_fk 
    FOREIGN KEY (application_sid) REFERENCES applications (application_sid);
ALTER TABLE voip_carriers ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);

-- User Permissions
CREATE INDEX user_permissions_sid_idx ON user_permissions (user_permissions_sid);
CREATE INDEX user_sid_idx1 ON user_permissions (user_sid);
ALTER TABLE user_permissions ADD CONSTRAINT user_sid_fk 
    FOREIGN KEY (user_sid) REFERENCES users (user_sid) ON DELETE CASCADE;
ALTER TABLE user_permissions ADD CONSTRAINT permission_sid_fk 
    FOREIGN KEY (permission_sid) REFERENCES permissions (permission_sid);

-- SMPP Gateways
CREATE INDEX smpp_gateway_sid_idx ON smpp_gateways (smpp_gateway_sid);
CREATE INDEX voip_carrier_sid_idx2 ON smpp_gateways (voip_carrier_sid);

ALTER TABLE smpp_gateways ADD CONSTRAINT voip_carrier_sid_fk 
    FOREIGN KEY (voip_carrier_sid) REFERENCES voip_carriers (voip_carrier_sid);

ALTER TABLE sip_gateways ADD CONSTRAINT voip_carrier_sid_fk 
    FOREIGN KEY (voip_carrier_sid) REFERENCES voip_carriers (voip_carrier_sid);
    
-- Phone Numbers
CREATE UNIQUE INDEX phone_numbers_unique_idx_voip_carrier_number ON phone_numbers (number, voip_carrier_sid);
CREATE INDEX phone_number_sid_idx ON phone_numbers (phone_number_sid);
CREATE INDEX number_idx ON phone_numbers (number);
CREATE INDEX voip_carrier_sid_idx3 ON phone_numbers (voip_carrier_sid);
ALTER TABLE phone_numbers ADD CONSTRAINT voip_carrier_sid_fk 
    FOREIGN KEY (voip_carrier_sid) REFERENCES voip_carriers (voip_carrier_sid);
ALTER TABLE phone_numbers ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
ALTER TABLE phone_numbers ADD CONSTRAINT application_sid_fk 
    FOREIGN KEY (application_sid) REFERENCES applications (application_sid);
CREATE INDEX service_provider_sid_idx9 ON phone_numbers (service_provider_sid);
ALTER TABLE phone_numbers ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);

-- SIP Gateways
CREATE INDEX sip_gateway_idx_hostport ON sip_gateways (ipv4, port);
CREATE INDEX voip_carrier_sid_idx4 ON sip_gateways (voip_carrier_sid);


-- LCR Carrier Set Entry
ALTER TABLE lcr_carrier_set_entry ADD CONSTRAINT lcr_route_sid_fk 
    FOREIGN KEY (lcr_route_sid) REFERENCES lcr_routes (lcr_route_sid);
ALTER TABLE lcr_carrier_set_entry ADD CONSTRAINT voip_carrier_sid_fk 
    FOREIGN KEY (voip_carrier_sid) REFERENCES voip_carriers (voip_carrier_sid);

-- Webhooks
CREATE INDEX webhook_sid_idx ON webhooks (webhook_sid);

-- Applications
CREATE UNIQUE INDEX applications_idx_name ON applications (account_sid, name);
CREATE INDEX application_sid_idx ON applications (application_sid);
CREATE INDEX service_provider_sid_idx10 ON applications (service_provider_sid);
ALTER TABLE applications ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);
CREATE INDEX account_sid_idx10 ON applications (account_sid);
ALTER TABLE applications ADD CONSTRAINT account_sid_fk 
    FOREIGN KEY (account_sid) REFERENCES accounts (account_sid);
ALTER TABLE applications ADD CONSTRAINT call_hook_sid_fk 
    FOREIGN KEY (call_hook_sid) REFERENCES webhooks (webhook_sid);
ALTER TABLE applications ADD CONSTRAINT call_status_hook_sid_fk 
    FOREIGN KEY (call_status_hook_sid) REFERENCES webhooks (webhook_sid);
ALTER TABLE applications ADD CONSTRAINT messaging_hook_sid_fk 
    FOREIGN KEY (messaging_hook_sid) REFERENCES webhooks (webhook_sid);

-- Service Providers
CREATE INDEX service_provider_sid_idx11 ON service_providers (service_provider_sid);
CREATE INDEX name_idx ON service_providers (name);
CREATE INDEX root_domain_idx ON service_providers (root_domain);
ALTER TABLE service_providers ADD CONSTRAINT registration_hook_sid_fk 
    FOREIGN KEY (registration_hook_sid) REFERENCES webhooks (webhook_sid);

-- Accounts
CREATE INDEX account_sid_idx11 ON accounts (account_sid);
CREATE INDEX sip_realm_idx ON accounts (sip_realm);
CREATE INDEX service_provider_sid_idx12 ON accounts (service_provider_sid);
ALTER TABLE accounts ADD CONSTRAINT service_provider_sid_fk 
    FOREIGN KEY (service_provider_sid) REFERENCES service_providers (service_provider_sid);
ALTER TABLE accounts ADD CONSTRAINT registration_hook_sid_fk 
    FOREIGN KEY (registration_hook_sid) REFERENCES webhooks (webhook_sid);
ALTER TABLE accounts ADD CONSTRAINT queue_event_hook_sid_fk 
    FOREIGN KEY (queue_event_hook_sid) REFERENCES webhooks (webhook_sid);
ALTER TABLE accounts ADD CONSTRAINT device_calling_application_sid_fk 
    FOREIGN KEY (device_calling_application_sid) REFERENCES applications (application_sid);
ALTER TABLE accounts ADD CONSTRAINT siprec_hook_sid_fk 
    FOREIGN KEY (siprec_hook_sid) REFERENCES applications (application_sid);
/* SET FOREIGN_KEY_CHECKS=1; */
