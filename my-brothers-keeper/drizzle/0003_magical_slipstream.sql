CREATE TABLE `updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`authorId` int NOT NULL,
	`type` enum('general','gratitude','memory','milestone') NOT NULL DEFAULT 'general',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`photoUrls` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `household_idx` ON `updates` (`householdId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `updates` (`authorId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `updates` (`createdAt`);