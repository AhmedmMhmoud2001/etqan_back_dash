-- CreateTable
CREATE TABLE `ReferralSettings` (
    `id` VARCHAR(191) NOT NULL,
    `discountPercentPerReferral` INTEGER NOT NULL DEFAULT 10,
    `maxDiscountPercent` INTEGER NOT NULL DEFAULT 50,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
