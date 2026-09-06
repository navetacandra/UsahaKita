const fs = require('fs');
const yaml = require('yaml');

const content = fs.readFileSync('docs/openapi.yaml', 'utf8');
const parsed = yaml.parse(content);
fs.writeFileSync('docs/openapi-content.json', JSON.stringify(parsed));
console.log('Generated docs/openapi-content.json (' + fs.statSync('docs/openapi-content.json').size + ' bytes)');
