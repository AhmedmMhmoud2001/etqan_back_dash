-- AlterTable
ALTER TABLE `subscription` ADD COLUMN `lastCurrency` VARCHAR(10) NULL,
    ADD COLUMN `lastListPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `lastPayPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `packageId` VARCHAR(191) NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `SubscriptionPackage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `durationMonths` INTEGER NOT NULL,
    `listPrice` DECIMAL(10, 2) NOT NULL,
    `payPrice` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'EGP',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SubscriptionPackage_isActive_idx`(`isActive`),
    INDEX `SubscriptionPackage_durationMonths_idx`(`durationMonths`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `SubscriptionPackage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
