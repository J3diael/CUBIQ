CREATE TABLE `lesson_progress` (
	`lesson_id` text PRIMARY KEY NOT NULL,
	`last_step` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`best_score` integer,
	`practice_total` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "lesson_progress_step" CHECK("lesson_progress"."last_step" >= 0),
	CONSTRAINT "lesson_progress_score" CHECK("lesson_progress"."best_score" IS NULL OR ("lesson_progress"."best_score" >= 0 AND "lesson_progress"."best_score" <= "lesson_progress"."practice_total"))
);
