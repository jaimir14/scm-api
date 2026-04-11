-- AlterTable
ALTER TABLE `consultations` ADD COLUMN `cita_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `consultations_cita_id_key` ON `consultations`(`cita_id`);

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_cita_id_fkey` FOREIGN KEY (`cita_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
