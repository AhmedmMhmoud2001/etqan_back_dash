-- Add exercise fields to UserWeeklyPlanDay (after removing workoutTemplate)
ALTER TABLE `UserWeeklyPlanDay` ADD COLUMN `exerciseId` VARCHAR(191) NULL,
ADD COLUMN `sets` INTEGER NULL,
ADD COLUMN `repMin` INTEGER NULL,
ADD COLUMN `repMax` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `UserWeeklyPlanDay` ADD CONSTRAINT `UserWeeklyPlanDay_exerciseId_fkey` 
  FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index for lookups by exercise
CREATE INDEX `UserWeeklyPlanDay_exerciseId_idx` ON `UserWeeklyPlanDay`(`exerciseId`);
