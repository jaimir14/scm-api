-- CreateTable
CREATE TABLE `clinics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `direccion` VARCHAR(500) NOT NULL,
    `telefono` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professionals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `especialidad` VARCHAR(255) NOT NULL,
    `clinica_id` INTEGER NOT NULL,
    `telefono` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(100) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'MEDICO', 'RECEPCION', 'ENFERMERIA') NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `ultimo_acceso` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_usuario_key`(`usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `duracion` INTEGER NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `categoria` ENUM('PREVENTIVO', 'CIRUGIA', 'RESTAURACION', 'ORTODONCIA') NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `treatments_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_id` INTEGER NOT NULL,
    `profesional_id` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `ocultar` BOOLEAN NOT NULL DEFAULT false,
    `peso` DECIMAL(5, 2) NULL,
    `talla` DECIMAL(5, 2) NULL,
    `imc` DECIMAL(5, 2) NULL,
    `temperatura` DECIMAL(4, 1) NULL,
    `presion_arterial` VARCHAR(20) NULL,
    `frecuencia_cardiaca` INTEGER NULL,
    `frecuencia_respiratoria` INTEGER NULL,
    `sat_o2` DECIMAL(5, 2) NULL,
    `motivo_consulta` TEXT NULL,
    `examen_fisico` TEXT NULL,
    `impresion_diagnostica` TEXT NULL,
    `indicaciones_tratamientos` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_id` INTEGER NOT NULL,
    `profesional_id` INTEGER NOT NULL,
    `tipo_cita_id` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `hora_inicio` VARCHAR(10) NOT NULL,
    `hora_fin` VARCHAR(10) NOT NULL,
    `notas` TEXT NULL,
    `estado` ENUM('PENDIENTE', 'ATENDIDA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` INTEGER NULL,
    `usuario` VARCHAR(100) NOT NULL,
    `accion` ENUM('INICIO_SESION', 'CREACION', 'ACTUALIZACION', 'ELIMINACION', 'CONSULTA') NOT NULL,
    `modulo` VARCHAR(100) NOT NULL,
    `ip` VARCHAR(50) NULL,
    `detalle` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_config` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `nombre_sistema` VARCHAR(255) NOT NULL,
    `zona_horaria` VARCHAR(100) NOT NULL,
    `formato_fecha` VARCHAR(50) NOT NULL,
    `duracion_cita_defecto` INTEGER NOT NULL,
    `hora_inicio` VARCHAR(10) NOT NULL,
    `hora_fin` VARCHAR(10) NOT NULL,
    `restriccion_horario` BOOLEAN NOT NULL DEFAULT false,
    `registrar_bitacora` BOOLEAN NOT NULL DEFAULT true,
    `requerir_cambio_clave` BOOLEAN NOT NULL DEFAULT false,
    `tiempo_inactividad` INTEGER NOT NULL DEFAULT 30,
    `recordatorio_email` BOOLEAN NOT NULL DEFAULT false,
    `notificar_medico` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default clinic and professional for data migration
INSERT INTO `clinics` (`id`, `nombre`, `direccion`, `telefono`, `estado`, `created_at`, `updated_at`)
VALUES (1, 'Clínica Principal', 'Dirección por definir', '0000-0000', true, NOW(), NOW());

INSERT INTO `professionals` (`id`, `nombre`, `especialidad`, `clinica_id`, `estado`, `created_at`, `updated_at`)
VALUES (1, 'Profesional General', 'General', 1, true, NOW(), NOW());

-- AlterTable: Expand patients table to full Expediente
-- Step 1: Rename existing columns to match new schema
ALTER TABLE `patients` CHANGE COLUMN `name` `nombre` VARCHAR(255) NOT NULL;
ALTER TABLE `patients` CHANGE COLUMN `address` `direccion` VARCHAR(500) NOT NULL;

-- Step 2: Add new nullable columns
ALTER TABLE `patients` ADD COLUMN `apellido1` VARCHAR(255) NULL;
ALTER TABLE `patients` ADD COLUMN `apellido2` VARCHAR(255) NULL;
ALTER TABLE `patients` ADD COLUMN `tipo_identificacion` ENUM('CEDULA', 'PASAPORTE', 'RESIDENCIA') NULL;
ALTER TABLE `patients` ADD COLUMN `numero_identificacion` VARCHAR(50) NULL;
ALTER TABLE `patients` ADD COLUMN `telefono_celular` VARCHAR(50) NULL;
ALTER TABLE `patients` ADD COLUMN `telefono_casa` VARCHAR(50) NULL;
ALTER TABLE `patients` ADD COLUMN `telefono_trabajo` VARCHAR(50) NULL;
ALTER TABLE `patients` ADD COLUMN `otro_telefono` VARCHAR(50) NULL;
ALTER TABLE `patients` ADD COLUMN `sexo` ENUM('MASCULINO', 'FEMENINO') NULL;
ALTER TABLE `patients` ADD COLUMN `estado_civil` ENUM('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO') NULL;
ALTER TABLE `patients` ADD COLUMN `email` VARCHAR(255) NULL;
ALTER TABLE `patients` ADD COLUMN `ocupacion` VARCHAR(255) NULL;
ALTER TABLE `patients` ADD COLUMN `fecha_nacimiento` DATETIME(3) NULL;
ALTER TABLE `patients` ADD COLUMN `tipo_sangre` VARCHAR(10) NULL;
ALTER TABLE `patients` ADD COLUMN `clinica_id` INTEGER NULL;
ALTER TABLE `patients` ADD COLUMN `profesional_id` INTEGER NULL;
ALTER TABLE `patients` ADD COLUMN `fotografia` VARCHAR(500) NULL;
ALTER TABLE `patients` ADD COLUMN `antecedentes_patologicos` TEXT NULL;
ALTER TABLE `patients` ADD COLUMN `antecedentes_no_patologicos` JSON NULL;
ALTER TABLE `patients` ADD COLUMN `antecedentes_quirurgicos` TEXT NULL;
ALTER TABLE `patients` ADD COLUMN `antecedentes_gineco_obstetricos` JSON NULL;
ALTER TABLE `patients` ADD COLUMN `antecedentes_heredo_familiares` TEXT NULL;
ALTER TABLE `patients` ADD COLUMN `otros_antecedentes` TEXT NULL;
ALTER TABLE `patients` ADD COLUMN `notas` TEXT NULL;
ALTER TABLE `patients` ADD COLUMN `estado` BOOLEAN NOT NULL DEFAULT true;

-- Step 3: Migrate data from old columns to new columns
UPDATE `patients` SET
    `apellido1` = '',
    `tipo_identificacion` = 'CEDULA',
    `numero_identificacion` = CONCAT('MIGRATED-', `id`),
    `telefono_celular` = `phone`,
    `sexo` = 'MASCULINO',
    `estado_civil` = 'SOLTERO',
    `fecha_nacimiento` = NOW(),
    `clinica_id` = 1,
    `profesional_id` = 1
WHERE `apellido1` IS NULL;

-- Step 4: Drop old columns that were replaced
ALTER TABLE `patients` DROP COLUMN `phone`;

-- Step 5: Make required columns NOT NULL
ALTER TABLE `patients` MODIFY COLUMN `apellido1` VARCHAR(255) NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `tipo_identificacion` ENUM('CEDULA', 'PASAPORTE', 'RESIDENCIA') NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `numero_identificacion` VARCHAR(50) NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `telefono_celular` VARCHAR(50) NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `sexo` ENUM('MASCULINO', 'FEMENINO') NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `estado_civil` ENUM('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO') NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `fecha_nacimiento` DATETIME(3) NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `clinica_id` INTEGER NOT NULL;
ALTER TABLE `patients` MODIFY COLUMN `profesional_id` INTEGER NOT NULL;

-- Step 6: Add unique constraint on numero_identificacion
CREATE UNIQUE INDEX `patients_numero_identificacion_key` ON `patients`(`numero_identificacion`);

-- AddForeignKey
ALTER TABLE `professionals` ADD CONSTRAINT `professionals_clinica_id_fkey` FOREIGN KEY (`clinica_id`) REFERENCES `clinics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_clinica_id_fkey` FOREIGN KEY (`clinica_id`) REFERENCES `clinics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_profesional_id_fkey` FOREIGN KEY (`profesional_id`) REFERENCES `professionals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_paciente_id_fkey` FOREIGN KEY (`paciente_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_profesional_id_fkey` FOREIGN KEY (`profesional_id`) REFERENCES `professionals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_paciente_id_fkey` FOREIGN KEY (`paciente_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_profesional_id_fkey` FOREIGN KEY (`profesional_id`) REFERENCES `professionals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_tipo_cita_id_fkey` FOREIGN KEY (`tipo_cita_id`) REFERENCES `appointment_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
