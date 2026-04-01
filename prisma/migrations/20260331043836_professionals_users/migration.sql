/*
  Warnings:

  - You are about to drop the `professionals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_profesional_id_fkey`;

-- DropForeignKey
ALTER TABLE `consultations` DROP FOREIGN KEY `consultations_profesional_id_fkey`;

-- DropForeignKey
ALTER TABLE `patients` DROP FOREIGN KEY `patients_profesional_id_fkey`;

-- DropForeignKey
ALTER TABLE `professionals` DROP FOREIGN KEY `professionals_clinica_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `clinica_id` INTEGER NULL,
    ADD COLUMN `especialidad` VARCHAR(255) NULL;

-- DropTable
DROP TABLE `professionals`;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_clinica_id_fkey` FOREIGN KEY (`clinica_id`) REFERENCES `clinics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_profesional_id_fkey` FOREIGN KEY (`profesional_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_profesional_id_fkey` FOREIGN KEY (`profesional_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_profesional_id_fkey` FOREIGN KEY (`profesional_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
