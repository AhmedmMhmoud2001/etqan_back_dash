-- AlterTable
ALTER TABLE `channel` ADD COLUMN `descriptionAr` TEXT NULL,
    ADD COLUMN `nameAr` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `doctor` ADD COLUMN `bioAr` TEXT NULL,
    ADD COLUMN `specializationAr` VARCHAR(191) NULL,
    ADD COLUMN `titleAr` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `exercise` ADD COLUMN `descriptionAr` TEXT NULL;

-- AlterTable
ALTER TABLE `meal` ADD COLUMN `nameAr` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `workouttemplate` ADD COLUMN `descriptionAr` TEXT NULL;
