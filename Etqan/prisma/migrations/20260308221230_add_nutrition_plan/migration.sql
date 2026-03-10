-- AlterTable
ALTER TABLE `usermeallog` ADD COLUMN `planSlotId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `NutritionPlan` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `dailyCalorieTarget` INTEGER NOT NULL,
    `dailyProteinTarget` INTEGER NOT NULL,
    `dailyCarbsTarget` INTEGER NOT NULL,
    `dailyFatsTarget` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NutritionPlanSlot` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `slotType` ENUM('BREAKFAST', 'SNACK', 'LUNCH', 'DINNER') NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `mealId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NutritionPlanSlot_planId_date_idx`(`planId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `UserMealLog_planSlotId_idx` ON `UserMealLog`(`planSlotId`);

-- AddForeignKey
ALTER TABLE `UserMealLog` ADD CONSTRAINT `UserMealLog_planSlotId_fkey` FOREIGN KEY (`planSlotId`) REFERENCES `NutritionPlanSlot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionPlan` ADD CONSTRAINT `NutritionPlan_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionPlan` ADD CONSTRAINT `NutritionPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionPlanSlot` ADD CONSTRAINT `NutritionPlanSlot_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `NutritionPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionPlanSlot` ADD CONSTRAINT `NutritionPlanSlot_mealId_fkey` FOREIGN KEY (`mealId`) REFERENCES `Meal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
