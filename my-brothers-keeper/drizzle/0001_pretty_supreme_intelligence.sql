CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`pinned` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`visibilityScope` enum('private','all_supporters','group','role') NOT NULL DEFAULT 'all_supporters',
	`visibilityGroupId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetType` varchar(64) NOT NULL,
	`targetId` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_rsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('going','maybe','declined') NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_rsvps_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_user_idx` UNIQUE(`eventId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp,
	`location` varchar(500),
	`createdBy` int NOT NULL,
	`googleCalendarEvtId` varchar(255),
	`visibilityScope` enum('private','all_supporters','group','role') NOT NULL DEFAULT 'all_supporters',
	`visibilityGroupId` int,
	`minRole` enum('supporter','admin','primary'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `group_user_idx` UNIQUE(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `households` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`primaryUserId` int NOT NULL,
	`quietMode` boolean NOT NULL DEFAULT false,
	`timezone` varchar(64) NOT NULL DEFAULT 'America/Chicago',
	`delegateAdminApprovals` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `households_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`invitedEmail` varchar(320),
	`invitedPhone` varchar(20),
	`invitedRole` enum('admin','supporter') NOT NULL,
	`inviterUserId` int NOT NULL,
	`status` enum('sent','accepted','revoked','expired') NOT NULL DEFAULT 'sent',
	`token` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`threadId` varchar(64),
	`senderUserId` int NOT NULL,
	`body` text NOT NULL,
	`visibilityScope` enum('private','all_supporters','group','role') NOT NULL DEFAULT 'all_supporters',
	`visibilityGroupId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `need_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`needId` int NOT NULL,
	`userId` int NOT NULL,
	`note` text,
	`status` enum('claimed','completed','released') NOT NULL DEFAULT 'claimed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `need_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `needs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`details` text,
	`category` enum('meals','rides','errands','childcare','household','other') NOT NULL,
	`priority` enum('low','normal','urgent') NOT NULL DEFAULT 'normal',
	`dueAt` timestamp,
	`recurrence` varchar(255),
	`createdBy` int NOT NULL,
	`visibilityScope` enum('private','all_supporters','group','role') NOT NULL DEFAULT 'all_supporters',
	`visibilityGroupId` int,
	`status` enum('open','claimed','completed','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `needs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channelEmail` boolean NOT NULL DEFAULT true,
	`channelSms` boolean NOT NULL DEFAULT false,
	`channelPush` boolean NOT NULL DEFAULT true,
	`digestFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'daily',
	`quietHours` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_prefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_prefs_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('primary','admin','supporter','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `householdId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','pending','blocked') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX `household_idx` ON `announcements` (`householdId`);--> statement-breakpoint
CREATE INDEX `pinned_idx` ON `announcements` (`pinned`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `announcements` (`createdAt`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `audit_logs` (`householdId`);--> statement-breakpoint
CREATE INDEX `actor_idx` ON `audit_logs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `event_rsvps` (`userId`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `events` (`householdId`);--> statement-breakpoint
CREATE INDEX `start_at_idx` ON `events` (`startAt`);--> statement-breakpoint
CREATE INDEX `visibility_idx` ON `events` (`visibilityScope`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `group_members` (`userId`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `groups` (`householdId`);--> statement-breakpoint
CREATE INDEX `primary_user_idx` ON `households` (`primaryUserId`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `invites` (`householdId`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `invites` (`token`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `invites` (`status`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `messages` (`householdId`);--> statement-breakpoint
CREATE INDEX `thread_idx` ON `messages` (`threadId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `need_idx` ON `need_claims` (`needId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `need_claims` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `need_claims` (`status`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `needs` (`householdId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `needs` (`status`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `needs` (`category`);--> statement-breakpoint
CREATE INDEX `due_at_idx` ON `needs` (`dueAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notification_prefs` (`userId`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `users` (`householdId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `users` (`status`);