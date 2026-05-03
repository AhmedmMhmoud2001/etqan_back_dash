/**
 * Writes OpenAPI 3 JSON next to the repo for Postman (Import → Upload Files).
 * Keeps files in sync with src/config/swagger.js and swagger.mobile.js.
 */
const fs = require('fs');
const path = require('path');

const swaggerAdmin = require('../src/config/swagger');
const swaggerMobile = require('../src/config/swagger.mobile');

const outDir = path.join(__dirname, '../openapi');
fs.mkdirSync(outDir, { recursive: true });

const files = [
  ['openapi-mobile.json', swaggerMobile],
  ['openapi-admin.json', swaggerAdmin],
];

for (const [name, doc] of files) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(doc, null, 2), 'utf8');
}

console.log(`Wrote ${files.map(([n]) => path.join('openapi', n)).join(', ')}`);
