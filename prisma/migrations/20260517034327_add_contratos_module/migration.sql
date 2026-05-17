-- CreateTable: Contrato
CREATE TABLE `Contrato` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `dentistaId` INTEGER NOT NULL,
    `clinicaId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('BORRADOR', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'BORRADOR',
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'CRC',
    `plazo` INTEGER NULL,
    `periodicidad` ENUM('SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL') NULL,
    `notas` TEXT NULL,
    `creadoPorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Contrato_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ContratoTratamiento
CREATE TABLE `ContratoTratamiento` (
    `id` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `tratamientoId` INTEGER NOT NULL,
    `pieza` VARCHAR(191) NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `estadoItem` ENUM('PROPUESTO', 'ACEPTADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'PROPUESTO',
    `fechaPropuesta` DATETIME(3) NULL,
    `observaciones` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ContratoPago
CREATE TABLE `ContratoPago` (
    `id` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `tipoPago` ENUM('EFECTIVO', 'TARJETA', 'SINPE', 'TRANSFERENCIA', 'CHEQUE', 'OTRO') NOT NULL,
    `estado` ENUM('APLICADO', 'ANULADO') NOT NULL DEFAULT 'APLICADO',
    `concepto` VARCHAR(191) NULL,
    `referencia` VARCHAR(191) NULL,
    `numeroFactura` VARCHAR(191) NULL,
    `autorizacion` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,
    `motivoAnulacion` VARCHAR(191) NULL,
    `registradoPorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ContratoHistorial
CREATE TABLE `ContratoHistorial` (
    `id` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `accion` ENUM('CREACION', 'ACTIVACION', 'MODIFICACION', 'ESTADO_CAMBIADO', 'TRATAMIENTO_AGREGADO', 'TRATAMIENTO_MODIFICADO', 'TRATAMIENTO_ELIMINADO', 'PAGO_REGISTRADO', 'PAGO_ANULADO') NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `nombreUsuario` VARCHAR(191) NOT NULL,
    `detalle` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: Contrato → patients
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Contrato → users (dentista)
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_dentistaId_fkey` FOREIGN KEY (`dentistaId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Contrato → users (creadoPor)
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ContratoTratamiento → Contrato (cascade delete)
ALTER TABLE `ContratoTratamiento` ADD CONSTRAINT `ContratoTratamiento_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ContratoTratamiento → treatments
ALTER TABLE `ContratoTratamiento` ADD CONSTRAINT `ContratoTratamiento_tratamientoId_fkey` FOREIGN KEY (`tratamientoId`) REFERENCES `treatments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ContratoPago → Contrato (cascade delete)
ALTER TABLE `ContratoPago` ADD CONSTRAINT `ContratoPago_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ContratoPago → users (registradoPor)
ALTER TABLE `ContratoPago` ADD CONSTRAINT `ContratoPago_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ContratoHistorial → Contrato (cascade delete)
ALTER TABLE `ContratoHistorial` ADD CONSTRAINT `ContratoHistorial_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
