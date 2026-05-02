-- AlterTable
ALTER TABLE `channel` ADD COLUMN `descriptionIt` TEXT NULL,
    ADD COLUMN `nameIt` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `doctor` ADD COLUMN `bioIt` TEXT NULL,
    ADD COLUMN `specializationIt` VARCHAR(191) NULL,
    ADD COLUMN `titleIt` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `exercise` ADD COLUMN `descriptionIt` TEXT NULL,
    ADD COLUMN `nameIt` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `meal` ADD COLUMN `nameIt` VARCHAR(191) NULL;
