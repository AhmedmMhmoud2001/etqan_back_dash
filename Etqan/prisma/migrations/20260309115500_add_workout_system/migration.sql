-- CreateTable
CREATE TABLE `Exercise` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `targetMuscles` JSON NULL,
    `addedByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `durationMinutes` INTEGER NULL,
    `level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NULL DEFAULT 'INTERMEDIATE',
    `createdByDoctorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutTemplateExercise` (
    `id` VARCHAR(191) NOT NULL,
    `workoutTemplateId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `sets` INTEGER NOT NULL,
    `repMin` INTEGER NOT NULL,
    `repMax` INTEGER NOT NULL,
    `restSeconds` INTEGER NOT NULL DEFAULT 90,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkoutTemplateExercise_workoutTemplateId_idx`(`workoutTemplateId`),
    UNIQUE INDEX `WorkoutTemplateExercise_workoutTemplateId_exerciseId_key`(`workoutTemplateId`, `exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserWeeklyPlan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `weekStart` DATETIME(3) NOT NULL,
    `weekEnd` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserWeeklyPlan_userId_weekStart_idx`(`userId`, `weekStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserWeeklyPlanDay` (
    `id` VARCHAR(191) NOT NULL,
    `userWeeklyPlanId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `workoutTemplateId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserWeeklyPlanDay_userWeeklyPlanId_date_idx`(`userWeeklyPlanId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userWeeklyPlanDayId` VARCHAR(191) NULL,
    `workoutTemplateId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkoutSession_userId_startedAt_idx`(`userId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutSessionExercise` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `sets` INTEGER NOT NULL,
    `repMin` INTEGER NOT NULL,
    `repMax` INTEGER NOT NULL,
    `restSeconds` INTEGER NOT NULL DEFAULT 90,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkoutSessionExercise_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutSessionSet` (
    `id` VARCHAR(191) NOT NULL,
    `workoutSessionExerciseId` VARCHAR(191) NOT NULL,
    `setNumber` INTEGER NOT NULL,
    `targetRepMin` INTEGER NOT NULL,
    `targetRepMax` INTEGER NOT NULL,
    `actualReps` INTEGER NULL,
    `completedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkoutSessionSet_workoutSessionExerciseId_idx`(`workoutSessionExerciseId`),
    UNIQUE INDEX `WorkoutSessionSet_workoutSessionExerciseId_setNumber_key`(`workoutSessionExerciseId`, `setNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Exercise` ADD CONSTRAINT `Exercise_addedByUserId_fkey` FOREIGN KEY (`addedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutTemplate` ADD CONSTRAINT `WorkoutTemplate_createdByDoctorId_fkey` FOREIGN KEY (`createdByDoctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutTemplateExercise` ADD CONSTRAINT `WorkoutTemplateExercise_workoutTemplateId_fkey` FOREIGN KEY (`workoutTemplateId`) REFERENCES `WorkoutTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutTemplateExercise` ADD CONSTRAINT `WorkoutTemplateExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWeeklyPlan` ADD CONSTRAINT `UserWeeklyPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWeeklyPlan` ADD CONSTRAINT `UserWeeklyPlan_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWeeklyPlanDay` ADD CONSTRAINT `UserWeeklyPlanDay_userWeeklyPlanId_fkey` FOREIGN KEY (`userWeeklyPlanId`) REFERENCES `UserWeeklyPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWeeklyPlanDay` ADD CONSTRAINT `UserWeeklyPlanDay_workoutTemplateId_fkey` FOREIGN KEY (`workoutTemplateId`) REFERENCES `WorkoutTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutSession` ADD CONSTRAINT `WorkoutSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutSession` ADD CONSTRAINT `WorkoutSession_userWeeklyPlanDayId_fkey` FOREIGN KEY (`userWeeklyPlanDayId`) REFERENCES `UserWeeklyPlanDay`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutSession` ADD CONSTRAINT `WorkoutSession_workoutTemplateId_fkey` FOREIGN KEY (`workoutTemplateId`) REFERENCES `WorkoutTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutSessionExercise` ADD CONSTRAINT `WorkoutSessionExercise_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `WorkoutSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutSessionExercise` ADD CONSTRAINT `WorkoutSessionExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutSessionSet` ADD CONSTRAINT `WorkoutSessionSet_workoutSessionExerciseId_fkey` FOREIGN KEY (`workoutSessionExerciseId`) REFERENCES `WorkoutSessionExercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
