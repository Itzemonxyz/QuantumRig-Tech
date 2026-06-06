const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix currency formatting
      content = content.replace(/\.toLocaleString\(\s*"en-US"\s*,/g, '.toLocaleString("en-IN",');
      content = content.replace(/\.toLocaleString\(\s*undefined\s*,/g, '.toLocaleString("en-IN",');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
console.log('Currency formatting replaced');
