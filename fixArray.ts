import fs from 'fs';

const demoStr = fs.readFileSync('src/data/demoProducts.ts', 'utf-8');
const fix = demoStr.replace(/];[\s\S]*?\{\s*id: "l1"/g, ',\n  { id: "l1"') + '\n];';
fs.writeFileSync('src/data/demoProducts.ts', fix);
