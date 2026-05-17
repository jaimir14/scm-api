import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Build DATABASE_URL from individual env vars
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Missing required DB_USER, DB_PASSWORD, or DB_NAME in .env');
  process.exit(1);
}
const host = DB_HOST || 'localhost';
const port = DB_PORT || '3306';
process.env.DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${host}:${port}/${DB_NAME}`;

const prisma = new PrismaClient();

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { clave: 'dashboard', nombre: 'Dashboard Principal', descripcion: 'Panel de inicio con estadísticas generales', modulo: 'General' },
  { clave: 'citas', nombre: 'Agenda de Citas', descripcion: 'Ver y gestionar la agenda de citas', modulo: 'Citas' },
  { clave: 'expediente.buscar', nombre: 'Buscar Expediente', descripcion: 'Buscar expedientes de pacientes', modulo: 'Expediente' },
  { clave: 'expediente.crear', nombre: 'Crear Expediente', descripcion: 'Crear nuevos expedientes de pacientes', modulo: 'Expediente' },
  { clave: 'mantenimientos.clinicas', nombre: 'Mantenimiento Clínicas', descripcion: 'Gestionar catálogo de clínicas', modulo: 'Mantenimientos' },
  { clave: 'mantenimientos.tipos_cita', nombre: 'Mantenimiento Tipos de Cita', descripcion: 'Gestionar tipos de cita', modulo: 'Mantenimientos' },
  { clave: 'mantenimientos.tratamientos', nombre: 'Mantenimiento Tratamientos', descripcion: 'Gestionar catálogo de tratamientos', modulo: 'Mantenimientos' },
  { clave: 'reportes.citas', nombre: 'Reporte de Citas', descripcion: 'Generar reportes de citas', modulo: 'Reportes' },
  { clave: 'reportes.pacientes', nombre: 'Reporte de Pacientes', descripcion: 'Generar reportes de pacientes', modulo: 'Reportes' },
  { clave: 'reportes.clinicas', nombre: 'Reporte de Clínicas', descripcion: 'Generar reportes de clínicas', modulo: 'Reportes' },
  { clave: 'reportes.tratamientos', nombre: 'Reporte de Tratamientos', descripcion: 'Generar reportes de tratamientos', modulo: 'Reportes' },
  { clave: 'reportes.usuarios', nombre: 'Reporte de Usuarios', descripcion: 'Generar reportes de usuarios', modulo: 'Reportes' },
  { clave: 'admin.bitacora', nombre: 'Bitácora', descripcion: 'Ver registro de actividades del sistema', modulo: 'Administración' },
  { clave: 'admin.configuracion', nombre: 'Configuración', descripcion: 'Configuración general del sistema', modulo: 'Administración' },
  { clave: 'doctor.dashboard', nombre: 'Dashboard Médico', descripcion: 'Panel de inicio del médico', modulo: 'Portal Médico' },
  { clave: 'doctor.agenda', nombre: 'Agenda Médica', descripcion: 'Agenda personal del médico', modulo: 'Portal Médico' },
  { clave: 'doctor.pacientes', nombre: 'Pacientes del Médico', descripcion: 'Listado de pacientes del médico', modulo: 'Portal Médico' },
];

const CONTRATOS_FEATURES = [
  { clave: 'dentista.access', nombre: 'Acceso Dentista', descripcion: 'Marca al usuario como dentista del consultorio', modulo: 'dentistas', activo: true },
  { clave: 'contratos.ver', nombre: 'Ver contratos', descripcion: 'Permite ver la lista y detalle de contratos', modulo: 'contratos', activo: true },
  { clave: 'contratos.crear', nombre: 'Crear contratos', descripcion: 'Permite crear nuevos contratos', modulo: 'contratos', activo: true },
  { clave: 'contratos.editar', nombre: 'Editar contratos', descripcion: 'Permite editar contratos y sus tratamientos', modulo: 'contratos', activo: true },
  { clave: 'contratos.eliminar', nombre: 'Eliminar contratos', descripcion: 'Permite eliminar contratos en estado BORRADOR', modulo: 'contratos', activo: true },
  { clave: 'contratos.pago.registrar', nombre: 'Registrar pagos', descripcion: 'Permite registrar y anular pagos de contratos', modulo: 'contratos', activo: true },
];

// Features assigned to the Médico role
const DOCTOR_FEATURE_KEYS = [
  'doctor.dashboard',
  'doctor.agenda',
  'doctor.pacientes',
  'expediente.buscar',
];

const DENTISTA_FEATURE_KEYS = ['dentista.access'];

// ── Appointment Types ─────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = [
  { nombre: 'Consulta General', duracion: 30 },
  { nombre: 'Control de Seguimiento', duracion: 20 },
  { nombre: 'Primera Consulta', duracion: 45 },
  { nombre: 'Urgencia', duracion: 30 },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Features
  for (const feature of FEATURES) {
    await prisma.feature.upsert({
      where: { clave: feature.clave },
      update: { nombre: feature.nombre, descripcion: feature.descripcion, modulo: feature.modulo },
      create: feature,
    });
  }
  for (const feature of CONTRATOS_FEATURES) {
    await prisma.feature.upsert({
      where: { clave: feature.clave },
      update: { nombre: feature.nombre, descripcion: feature.descripcion, modulo: feature.modulo },
      create: feature,
    });
  }
  console.log(`✅ ${FEATURES.length + CONTRATOS_FEATURES.length} features`);

  // 2. Roles
  const adminRole = await prisma.role.upsert({
    where: { nombre: 'Administrador' },
    update: { descripcion: 'Acceso completo al sistema', esAdmin: true },
    create: {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema',
      esAdmin: true,
      activo: true,
    },
  });

  const medicoRole = await prisma.role.upsert({
    where: { nombre: 'Médico' },
    update: { descripcion: 'Profesional de salud con acceso al portal médico' },
    create: {
      nombre: 'Médico',
      descripcion: 'Profesional de salud con acceso al portal médico',
      esAdmin: false,
      activo: true,
    },
  });
  const dentistaRole = await prisma.role.upsert({
    where: { nombre: 'Dentista' },
    update: { descripcion: 'Dentista del consultorio' },
    create: {
      nombre: 'Dentista',
      descripcion: 'Dentista del consultorio',
      esAdmin: false,
      activo: true,
    },
  });
  console.log(`✅ Roles: Administrador (id: ${adminRole.id}), Médico (id: ${medicoRole.id}), Dentista (id: ${dentistaRole.id})`);

  // 3. Assign features to Médico role
  const doctorFeatures = await prisma.feature.findMany({
    where: { clave: { in: DOCTOR_FEATURE_KEYS } },
  });
  // Clear existing and recreate
  await prisma.roleFeature.deleteMany({ where: { rolId: medicoRole.id } });
  await prisma.roleFeature.createMany({
    data: doctorFeatures.map(f => ({ rolId: medicoRole.id, featureId: f.id })),
    skipDuplicates: true,
  });
  console.log(`✅ ${doctorFeatures.length} features assigned to Médico role`);

  // Assign dentista.access to Dentista role
  const dentistaFeatures = await prisma.feature.findMany({
    where: { clave: { in: DENTISTA_FEATURE_KEYS } },
  });
  await prisma.roleFeature.deleteMany({ where: { rolId: dentistaRole.id } });
  await prisma.roleFeature.createMany({
    data: dentistaFeatures.map(f => ({ rolId: dentistaRole.id, featureId: f.id })),
    skipDuplicates: true,
  });
  console.log(`✅ ${dentistaFeatures.length} features assigned to Dentista role`);

  // 4. Clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Clínica Central MedikalCR',
      direccion: 'San José, Costa Rica, Avenida Central 100m Norte',
      telefono: '2222-1234',
      email: 'info@medikalcr.com',
      estado: true,
    },
  });
  console.log(`✅ Clinic: ${clinic.nombre} (id: ${clinic.id})`);

  // 5. Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);

  const adminUser = await prisma.user.upsert({
    where: { usuario: 'jmiranda' },
    update: { rolId: adminRole.id },
    create: {
      usuario: 'jmiranda',
      nombre: 'Dr. Miranda',
      passwordHash: adminPassword,
      rolId: adminRole.id,
      tipoIdentificacion: 'CEDULA',
      numeroIdentificacion: '101010101',
      sexo: 'MASCULINO',
      clinicaId: clinic.id,
      estado: true,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { usuario: 'doctor' },
    update: { rolId: medicoRole.id },
    create: {
      usuario: 'doctor',
      nombre: 'Dr. López',
      passwordHash: doctorPassword,
      rolId: medicoRole.id,
      tipoIdentificacion: 'CEDULA',
      numeroIdentificacion: '202020202',
      sexo: 'MASCULINO',
      especialidad: 'Medicina General',
      codigoProfesional: 'MED-001',
      duracionCitas: 30,
      color: '#2563EB',
      clinicaId: clinic.id,
      estado: true,
    },
  });
  console.log(`✅ Users: ${adminUser.usuario} (admin), ${doctorUser.usuario} (médico)`);

  // 6. Appointment Types
  const existingTypes = await prisma.appointmentType.count();
  if (existingTypes === 0) {
    await prisma.appointmentType.createMany({
      data: APPOINTMENT_TYPES.map(t => ({ ...t, estado: true })),
    });
    console.log(`✅ ${APPOINTMENT_TYPES.length} appointment types`);
  } else {
    console.log(`⏭️  Appointment types already exist (${existingTypes}), skipping`);
  }

  // 7. System Config
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreSistema: 'MedikalCR',
      zonaHoraria: 'America/Costa_Rica',
      formatoFecha: 'DD/MM/YYYY',
      duracionCitaDefecto: 30,
      horaInicioJornada: '08:00',
      horaFinJornada: '18:00',
      restriccionHorario: false,
      registrarBitacora: true,
      requerirCambioClave: false,
      tiempoInactividad: 30,
      enviarRecordatorioEmail: false,
      notificarMedicoCitas: false,
    },
  });
  console.log('✅ System config');

  // 8. Patients
  const existingPatients = await prisma.patient.count();
  if (existingPatients === 0) {
    const patients = [
      { nombre: 'María', apellido1: 'González', apellido2: 'Ramírez', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '301120456', telefonoCelular: '8812-3456', sexo: 'FEMENINO' as const, estadoCivil: 'CASADO' as const, direccion: 'San José, Escazú, 200m sur del parque', email: 'maria.gonzalez@email.com', ocupacion: 'Contadora', fechaNacimiento: new Date('1985-03-15'), tipoSangre: 'O+' },
      { nombre: 'Carlos', apellido1: 'Mora', apellido2: 'Jiménez', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '104560789', telefonoCelular: '8834-5678', sexo: 'MASCULINO' as const, estadoCivil: 'SOLTERO' as const, direccion: 'Heredia, San Francisco, Residencial Los Ángeles', email: 'carlos.mora@email.com', ocupacion: 'Ingeniero', fechaNacimiento: new Date('1990-07-22'), tipoSangre: 'A+' },
      { nombre: 'Ana', apellido1: 'Rodríguez', apellido2: 'Castro', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '206780123', telefonoCelular: '8856-7890', sexo: 'FEMENINO' as const, estadoCivil: 'DIVORCIADO' as const, direccion: 'Alajuela, San Carlos, Ciudad Quesada centro', email: 'ana.rodriguez@email.com', ocupacion: 'Abogada', fechaNacimiento: new Date('1978-11-03'), tipoSangre: 'B+' },
      { nombre: 'José', apellido1: 'Hernández', apellido2: 'Vargas', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '108900345', telefonoCelular: '8878-9012', sexo: 'MASCULINO' as const, estadoCivil: 'CASADO' as const, direccion: 'Cartago, Paraíso, Barrio El Carmen', email: 'jose.hernandez@email.com', ocupacion: 'Profesor', fechaNacimiento: new Date('1982-01-28'), tipoSangre: 'AB+' },
      { nombre: 'Laura', apellido1: 'Solano', apellido2: 'Méndez', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '305010567', telefonoCelular: '8890-1234', sexo: 'FEMENINO' as const, estadoCivil: 'SOLTERO' as const, direccion: 'San José, Desamparados, San Rafael Abajo', email: 'laura.solano@email.com', ocupacion: 'Diseñadora', fechaNacimiento: new Date('1995-05-10'), tipoSangre: 'O-' },
      { nombre: 'Roberto', apellido1: 'Chaves', apellido2: 'Arias', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '109120789', telefonoCelular: '8812-3457', sexo: 'MASCULINO' as const, estadoCivil: 'VIUDO' as const, direccion: 'Guanacaste, Liberia, Barrio Condega', email: 'roberto.chaves@email.com', ocupacion: 'Agricultor', fechaNacimiento: new Date('1965-09-18'), tipoSangre: 'A-' },
      { nombre: 'Sofía', apellido1: 'Brenes', apellido2: 'López', tipoIdentificacion: 'PASAPORTE' as const, numeroIdentificacion: 'PA-987654', telefonoCelular: '8834-5679', sexo: 'FEMENINO' as const, estadoCivil: 'CASADO' as const, direccion: 'Puntarenas, Esparza, centro', email: 'sofia.brenes@email.com', ocupacion: 'Enfermera', fechaNacimiento: new Date('1988-12-05'), tipoSangre: 'B-' },
      { nombre: 'Diego', apellido1: 'Ureña', apellido2: 'Fallas', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '207340901', telefonoCelular: '8856-7891', sexo: 'MASCULINO' as const, estadoCivil: 'SOLTERO' as const, direccion: 'Limón, Siquirres, centro', email: 'diego.urena@email.com', ocupacion: 'Técnico', fechaNacimiento: new Date('1998-04-30'), tipoSangre: 'O+' },
      { nombre: 'Valentina', apellido1: 'Rojas', apellido2: 'Villalobos', tipoIdentificacion: 'CEDULA' as const, numeroIdentificacion: '110560123', telefonoCelular: '8878-9013', sexo: 'FEMENINO' as const, estadoCivil: 'CASADO' as const, direccion: 'San José, Moravia, San Vicente', email: 'valentina.rojas@email.com', ocupacion: 'Administradora', fechaNacimiento: new Date('1992-08-14'), tipoSangre: 'AB-' },
      { nombre: 'Fernando', apellido1: 'Calderón', apellido2: 'Navarro', tipoIdentificacion: 'RESIDENCIA' as const, numeroIdentificacion: 'RES-456789', telefonoCelular: '8890-1235', sexo: 'MASCULINO' as const, estadoCivil: 'CASADO' as const, direccion: 'Heredia, Barva, San Pedro', email: 'fernando.calderon@email.com', ocupacion: 'Chef', fechaNacimiento: new Date('1975-06-21'), tipoSangre: 'A+' },
    ];

    await prisma.patient.createMany({
      data: patients.map(p => ({
        ...p,
        clinicaId: clinic.id,
        profesionalId: doctorUser.id,
        estado: true,
      })),
    });
    console.log(`✅ ${patients.length} patients`);
  } else {
    console.log(`⏭️  Patients already exist (${existingPatients}), skipping`);
  }

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
