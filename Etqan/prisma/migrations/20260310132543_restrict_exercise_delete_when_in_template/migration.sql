-- DropForeignKey
ALTER TABLE `workouttemplateexercise` DROP FOREIGN KEY `WorkoutTemplateExercise_exerciseId_fkey`;

-- AddForeignKey
ALTER TABLE `WorkoutTemplateExercise` ADD CONSTRAINT `WorkoutTemplateExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
