-- CreateTable
CREATE TABLE `patient_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_id` INTEGER NOT NULL,
    `consulta_id` INTEGER NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `storage_path` VARCHAR(500) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_files` ADD CONSTRAINT `patient_files_paciente_id_fkey` FOREIGN KEY (`paciente_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_files` ADD CONSTRAINT `patient_files_consulta_id_fkey` FOREIGN KEY (`consulta_id`) REFERENCES `consultations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
