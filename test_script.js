const fs = require('fs');
let code = fs.readFileSync('src/modules/contratos/contrato.routes.test.ts', 'utf-8');
code = code.replace(
  'expect(res.statusCode).toBe(200);',
  'if (res.statusCode !== 200) console.error("BODY:", body);\n      expect(res.statusCode).toBe(200);'
);
fs.writeFileSync('src/modules/contratos/contrato.routes.test.ts', code, 'utf-8');
