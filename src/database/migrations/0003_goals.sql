CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`target` integer,
	`puzzle_id` text,
	`stat` text,
	`algorithm_set` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "goals_title_not_blank" CHECK(length(trim("goals"."title")) > 0),
	CONSTRAINT "goals_target_positive" CHECK("goals"."target" IS NULL OR "goals"."target" > 0)
);
--> statement-breakpoint
CREATE INDEX `goals_completed` ON `goals` (`completed_at`);