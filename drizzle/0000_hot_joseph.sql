CREATE TABLE `ebay_connections` (
	`user_email` text PRIMARY KEY NOT NULL,
	`environment` text NOT NULL,
	`access_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL,
	`refresh_token` text NOT NULL,
	`refresh_token_expires_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
