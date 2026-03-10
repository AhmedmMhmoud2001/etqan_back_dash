-- DropForeignKey
ALTER TABLE `UserWeeklyPlanDay` DROP FOREIGN KEY `UserWeeklyPlanDay_workoutTemplateId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkoutSession` DROP FOREIGN KEY `WorkoutSession_workoutTemplateId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkoutTemplate` DROP FOREIGN KEY `WorkoutTemplate_createdByDoctorId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkoutTemplateExercise` DROP FOREIGN KEY `WorkoutTemplateExercise_exerciseId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkoutTemplateExercise` DROP FOREIGN KEY `WorkoutTemplateExercise_workoutTemplateId_fkey`;

-- AlterTable
ALTER TABLE `UserWeeklyPlanDay` DROP COLUMN `workoutTemplateId`;

-- AlterTable
ALTER TABLE `WorkoutSession` DROP COLUMN `workoutTemplateId`;

-- DropTable
DROP TABLE `WorkoutTemplateExercise`;

-- DropTable
DROP TABLE `WorkoutTemplate`;

-- DropEnum (optional - WorkoutLevel may be unused now)
-- MySQL does not have a separate DROP TYPE for enums; skip if not needed
