CREATE TABLE `consultationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(160),
	`scheduledAt` timestamp NOT NULL,
	`timezone` varchar(80) NOT NULL,
	`status` enum('requested','confirmed','completed','cancelled') NOT NULL DEFAULT 'requested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultationRequests_id` PRIMARY KEY(`id`)
);
