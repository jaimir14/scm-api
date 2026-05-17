const fs = require('fs');
let code = fs.readFileSync('src/modules/contratos/contrato.service.ts', 'utf-8');

code = code.replace(
  /async findById\(id: string\)/g,
  'async findById(id: string, clinicaId?: number | null)'
);

code = code.replace(
  /if \(!contrato\) \{\n\s*throw new NotFoundError\('Contrato'\);\n\s*\}/g,
  `if (!contrato) {
      throw new NotFoundError('Contrato');
    }
    if (clinicaId && contrato.clinicaId !== clinicaId) {
      throw new NotFoundError('Contrato');
    }`
);

// update
code = code.replace(
  /async update\(id: string, input: UpdateContratoInput, usuarioId: number, nombreUsuario: string\)/g,
  'async update(id: string, input: UpdateContratoInput, usuarioId: number, nombreUsuario: string, clinicaId?: number | null)'
);

// cambiarEstado
code = code.replace(
  /async cambiarEstado\(id: string, newEstado: string, usuarioId: number, nombreUsuario: string\)/g,
  'async cambiarEstado(id: string, newEstado: string, usuarioId: number, nombreUsuario: string, clinicaId?: number | null)'
);

// delete
code = code.replace(
  /async delete\(id: string\): Promise<void>/g,
  'async delete(id: string, clinicaId?: number | null): Promise<void>'
);

// addTratamiento
code = code.replace(
  /async addTratamiento\(contratoId: string, input: AddTratamientoInput, usuarioId: number, nombreUsuario: string\)/g,
  'async addTratamiento(contratoId: string, input: AddTratamientoInput, usuarioId: number, nombreUsuario: string, clinicaId?: number | null)'
);

// updateTratamientoItem
code = code.replace(
  /async updateTratamientoItem\(\n\s*contratoId: string,\n\s*itemId: string,\n\s*input: UpdateTratamientoItemInput,\n\s*usuarioId: number,\n\s*nombreUsuario: string,\n\s*\)/g,
  `async updateTratamientoItem(
    contratoId: string,
    itemId: string,
    input: UpdateTratamientoItemInput,
    usuarioId: number,
    nombreUsuario: string,
    clinicaId?: number | null,
  )`
);

// removeTratamiento
code = code.replace(
  /async removeTratamiento\(contratoId: string, itemId: string, usuarioId: number, nombreUsuario: string\)/g,
  'async removeTratamiento(contratoId: string, itemId: string, usuarioId: number, nombreUsuario: string, clinicaId?: number | null)'
);

// registrarPago
code = code.replace(
  /async registrarPago\(contratoId: string, input: RegistrarPagoInput, usuarioId: number, nombreUsuario: string\)/g,
  'async registrarPago(contratoId: string, input: RegistrarPagoInput, usuarioId: number, nombreUsuario: string, clinicaId?: number | null)'
);

// editarPago
code = code.replace(
  /async editarPago\(\n\s*contratoId: string,\n\s*pagoId: string,\n\s*input: EditarPagoInput,\n\s*usuarioId: number,\n\s*nombreUsuario: string,\n\s*\)/g,
  `async editarPago(
    contratoId: string,
    pagoId: string,
    input: EditarPagoInput,
    usuarioId: number,
    nombreUsuario: string,
    clinicaId?: number | null,
  )`
);

// anularPago
code = code.replace(
  /async anularPago\(\n\s*contratoId: string,\n\s*pagoId: string,\n\s*motivoAnulacion: string \| undefined,\n\s*usuarioId: number,\n\s*nombreUsuario: string,\n\s*\)/g,
  `async anularPago(
    contratoId: string,
    pagoId: string,
    motivoAnulacion: string | undefined,
    usuarioId: number,
    nombreUsuario: string,
    clinicaId?: number | null,
  )`
);

// getHistorial
code = code.replace(
  /async getHistorial\(contratoId: string\)/g,
  'async getHistorial(contratoId: string, clinicaId?: number | null)'
);

// findById calls inside service
code = code.replace(
  /this\.findById\(id\)/g,
  'this.findById(id, clinicaId)'
);
code = code.replace(
  /this\.findById\(contratoId\)/g,
  'this.findById(contratoId, clinicaId)'
);

// the create method has `return this.findById(contrato.id);`. That doesn't have clinicaId defined.
// Oh wait! In create: clinicaId is `input.clinicaId`
code = code.replace(
  /return this\.findById\(contrato\.id, clinicaId\);/g,
  'return this.findById(contrato.id, input.clinicaId);'
);

fs.writeFileSync('src/modules/contratos/contrato.service.ts', code, 'utf-8');
console.log('Fixed contrato.service.ts');
