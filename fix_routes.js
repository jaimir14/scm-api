const fs = require('fs');
let code = fs.readFileSync('src/modules/contratos/contrato.routes.ts', 'utf-8');

// The route already has `const clinicaId = getClinicScope(request);` for `findAll` and `findByPaciente`.
// We need to add it to others and pass it to the service.

// findById
code = code.replace(
  /const contrato = await contratoService\.findById\(id\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.findById(id, clinicaId);`
);

// update
code = code.replace(
  /const contrato = await contratoService\.update\(id, input, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.update(id, input, usuarioId, nombreUsuario, clinicaId);`
);

// cambiarEstado
code = code.replace(
  /const contrato = await contratoService\.cambiarEstado\(id, estado, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.cambiarEstado(id, estado, usuarioId, nombreUsuario, clinicaId);`
);

// delete
code = code.replace(
  /await contratoService\.delete\(id\);/g,
  `const clinicaId = getClinicScope(request);
    await contratoService.delete(id, clinicaId);`
);

// addTratamiento
code = code.replace(
  /const contrato = await contratoService\.addTratamiento\(id, input, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.addTratamiento(id, input, usuarioId, nombreUsuario, clinicaId);`
);

// updateTratamientoItem
code = code.replace(
  /const contrato = await contratoService\.updateTratamientoItem\(id, itemId, input, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.updateTratamientoItem(id, itemId, input, usuarioId, nombreUsuario, clinicaId);`
);

// removeTratamiento
code = code.replace(
  /const contrato = await contratoService\.removeTratamiento\(id, itemId, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.removeTratamiento(id, itemId, usuarioId, nombreUsuario, clinicaId);`
);

// registrarPago
code = code.replace(
  /const contrato = await contratoService\.registrarPago\(id, input, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.registrarPago(id, input, usuarioId, nombreUsuario, clinicaId);`
);

// editarPago
code = code.replace(
  /const contrato = await contratoService\.editarPago\(id, pagoId, input, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.editarPago(id, pagoId, input, usuarioId, nombreUsuario, clinicaId);`
);

// anularPago
code = code.replace(
  /const contrato = await contratoService\.anularPago\(id, pagoId, motivoAnulacion, usuarioId, nombreUsuario\);/g,
  `const clinicaId = getClinicScope(request);
    const contrato = await contratoService.anularPago(id, pagoId, motivoAnulacion, usuarioId, nombreUsuario, clinicaId);`
);

// getHistorial
code = code.replace(
  /const data = await contratoService\.getHistorial\(id\);/g,
  `const clinicaId = getClinicScope(request);
    const data = await contratoService.getHistorial(id, clinicaId);`
);

fs.writeFileSync('src/modules/contratos/contrato.routes.ts', code, 'utf-8');
console.log('Fixed contrato.routes.ts');
