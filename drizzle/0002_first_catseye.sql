CREATE INDEX `idx_ebay_remote_item_reconciled` ON `ebay_remote_objects` (`item_id`,`reconciled_at`);--> statement-breakpoint
CREATE INDEX `idx_ebay_remote_offer` ON `ebay_remote_objects` (`seller_account`,`environment`,`offer_id`);--> statement-breakpoint
CREATE INDEX `idx_publication_manifests_item_status` ON `publication_manifests` (`owner_email`,`item_id`,`approval_status`);--> statement-breakpoint
CREATE INDEX `idx_publication_manifests_batch` ON `publication_manifests` (`batch_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_studio_audit_owner_created` ON `studio_audit_events` (`owner_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_studio_audit_item_created` ON `studio_audit_events` (`item_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_studio_items_remote_identity` ON `studio_items` (`owner_email`,`environment`,`sku`,`marketplace_id`,`listing_format`);--> statement-breakpoint
CREATE INDEX `idx_studio_items_owner_updated` ON `studio_items` (`owner_email`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_studio_operations_key_attempt` ON `studio_operations` (`owner_email`,`idempotency_key`,`attempt`);--> statement-breakpoint
CREATE INDEX `idx_studio_operations_active` ON `studio_operations` (`owner_email`,`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `idx_studio_operations_batch` ON `studio_operations` (`batch_id`,`started_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_studio_photos_item_ordinal` ON `studio_photos` (`item_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `idx_studio_photos_item` ON `studio_photos` (`item_id`);--> statement-breakpoint
PRAGMA optimize;
