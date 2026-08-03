CREATE TABLE `ebay_remote_objects` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`seller_account` text NOT NULL,
	`environment` text NOT NULL,
	`marketplace_id` text NOT NULL,
	`listing_format` text NOT NULL,
	`sku` text NOT NULL,
	`offer_id` text,
	`listing_id` text,
	`listing_url` text,
	`remote_snapshot_json` text NOT NULL,
	`reconciled_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `publication_manifests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`item_id` text NOT NULL,
	`batch_id` text,
	`environment` text NOT NULL,
	`manifest_hash` text NOT NULL,
	`manifest_json` text NOT NULL,
	`approval_status` text NOT NULL,
	`approved_at` integer,
	`invalidated_at` integer,
	`invalidation_reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`item_id` text,
	`batch_id` text,
	`event_type` text NOT NULL,
	`details_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_items` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`sku` text NOT NULL,
	`marketplace_id` text NOT NULL,
	`listing_format` text NOT NULL,
	`environment` text NOT NULL,
	`content_status` text NOT NULL,
	`evidence_status` text NOT NULL,
	`sync_status` text NOT NULL,
	`offer_status` text NOT NULL,
	`publication_status` text NOT NULL,
	`operation_status` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`item_id` text,
	`batch_id` text,
	`idempotency_key` text NOT NULL,
	`operation_type` text NOT NULL,
	`environment` text NOT NULL,
	`request_hash` text NOT NULL,
	`request_json` text NOT NULL,
	`attempt` integer NOT NULL,
	`status` text NOT NULL,
	`remote_result_json` text,
	`error_json` text,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE TABLE `studio_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`object_key` text NOT NULL,
	`sha256` text NOT NULL,
	`content_type` text NOT NULL,
	`file_name` text NOT NULL,
	`ordinal` integer NOT NULL,
	`created_at` integer NOT NULL
);
