CREATE TABLE `algorithm_progress` (
	`case_key` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`preferred_algorithm` text,
	`notes` text,
	`ease` real DEFAULT 2.5 NOT NULL,
	`interval_days` real DEFAULT 0 NOT NULL,
	`due_at` integer,
	`reviews` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`last_reviewed_at` integer,
	`executions` integer DEFAULT 0 NOT NULL,
	`best_execution_ms` integer,
	`last_execution_ms` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "algorithm_progress_counts" CHECK("algorithm_progress"."correct" <= "algorithm_progress"."reviews")
);
--> statement-breakpoint
CREATE INDEX `algorithm_progress_due` ON `algorithm_progress` (`due_at`);--> statement-breakpoint
CREATE TABLE `custom_algorithms` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`set` text NOT NULL,
	`collection` text,
	`name` text NOT NULL,
	`algorithm` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "custom_algorithms_name_not_blank" CHECK(length(trim("custom_algorithms"."name")) > 0),
	CONSTRAINT "custom_algorithms_alg_not_blank" CHECK(length(trim("custom_algorithms"."algorithm")) > 0)
);
--> statement-breakpoint
CREATE INDEX `custom_algorithms_case` ON `custom_algorithms` (`case_id`);