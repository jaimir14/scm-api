/*
  Warnings:

  - Added the required column `numero_identificacion` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sexo` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_identificacion` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `clinica_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_clinica_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `codigo_profesional` VARCHAR(100) NULL,
    ADD COLUMN `color` VARCHAR(7) NULL,
    ADD COLUMN `duracion_citas` INTEGER NULL,
    ADD COLUMN `google_calendar_activo` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `google_calendar_email` VARCHAR(255) NULL,
    ADD COLUMN `google_client_id` VARCHAR(500) NULL,
    ADD COLUMN `google_client_secret` VARCHAR(500) NULL,
    ADD COLUMN `numero_identificacion` VARCHAR(50) NOT NULL,
    ADD COLUMN `sexo` ENUM('MASCULINO', 'FEMENINO') NOT NULL,
    ADD COLUMN `tipo_identificacion` ENUM('CEDULA', 'PASAPORTE', 'RESIDENCIA') NOT NULL,
    MODIFY `clinica_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_clinica_id_fkey` FOREIGN KEY (`clinica_id`) REFERENCES `clinics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
