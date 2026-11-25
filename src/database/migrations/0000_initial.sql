CREATE TABLE `scramble_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_id` text NOT NULL,
	`scramble` text NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scramble_queue_puzzle` ON `scramble_queue` (`puzzle_id`,`generated_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`method` text,
	`purpose` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "sessions_name_not_blank" CHECK(length(trim("sessions"."name")) > 0)
);
--> statement-breakpoint
CREATE INDEX `sessions_updated` ON `sessions` (`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `solves` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`scramble` text NOT NULL,
	`scramble_generated_at` integer,
	`raw_time_ms` integer NOT NULL,
	`penalty` text DEFAULT 'none' NOT NULL,
	`inspection_ms` integer,
	`source` text DEFAULT 'timer' NOT NULL,
	`was_interrupted` integer DEFAULT false NOT NULL,
	`notes` text,
	`solved_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "solves_raw_time_non_negative" CHECK("solves"."raw_time_ms" >= 0),
	CONSTRAINT "solves_penalty_valid" CHECK("solves"."penalty" in ('none', 'plus2', 'dnf')),
	CONSTRAINT "solves_source_valid" CHECK("solves"."source" in ('timer', 'manual'))
);
--> statement-breakpoint
CREATE INDEX `solves_session_time` ON `solves` (`session_id`,`solved_at`);--> statement-breakpoint
CREATE INDEX `solves_puzzle_time` ON `solves` (`puzzle_id`,`solved_at`);