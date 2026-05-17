-- CreateIndex: ordered pagination per clinic
CREATE INDEX `patients_clinica_id_created_at_idx` ON `patients`(`clinica_id`, `created_at` DESC);

-- CreateIndex: name search within clinic
CREATE INDEX `patients_clinica_id_nombre_apellido1_apellido2_idx` ON `patients`(`clinica_id`, `nombre`, `apellido1`, `apellido2`);

-- CreateIndex: cedula search within clinic
CREATE INDEX `patients_clinica_id_numero_identificacion_idx` ON `patients`(`clinica_id`, `numero_identificacion`);
