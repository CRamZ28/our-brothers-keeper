CREATE TABLE `admin_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `group_user_idx` UNIQUE(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `admin_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`createdBy` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_message_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_message_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`householdId` int NOT NULL,
	`senderId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`recipientType` enum('individual','group','all') NOT NULL,
	`recipientGroupId` int,
	`includedPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `group_idx` ON `admin_group_members` (`groupId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `admin_group_members` (`userId`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `admin_groups` (`householdId`);--> statement-breakpoint
CREATE INDEX `message_idx` ON `admin_message_recipients` (`messageId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `admin_message_recipients` (`userId`);--> statement-breakpoint
CREATE INDEX `household_idx` ON `admin_messages` (`householdId`);--> statement-breakpoint
CREATE INDEX `sender_idx` ON `admin_messages` (`senderId`);