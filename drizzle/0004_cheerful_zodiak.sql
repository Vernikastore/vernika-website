CREATE TABLE `caseStudies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`clientName` varchar(160) NOT NULL,
	`industry` varchar(120) NOT NULL,
	`title` varchar(220) NOT NULL,
	`metric` varchar(80) NOT NULL,
	`metricLabel` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`challenge` text NOT NULL,
	`solution` text NOT NULL,
	`outcome` text NOT NULL,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caseStudies_id` PRIMARY KEY(`id`),
	CONSTRAINT `caseStudies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(120) NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`impact` varchar(160) NOT NULL,
	`status` varchar(80) NOT NULL DEFAULT 'Active',
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`detailKey` varchar(160) NOT NULL,
	`label` varchar(160) NOT NULL,
	`value` text NOT NULL,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteDetails_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteDetails_detailKey_unique` UNIQUE(`detailKey`)
);
