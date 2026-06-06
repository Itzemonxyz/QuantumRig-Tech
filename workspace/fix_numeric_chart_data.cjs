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
      
      const regex = /Number\(([a-zA-Z0-9_$.]+)\.toLocaleString\("en-IN", \{.*?\}\)\)/g;
      
      let changed = false;
      content = content.replace(regex, (match, p1) => {
          changed = true;
          return `Number(${p1})`;
      });
      
      if (changed) {
          fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
console.log('Fixed Number(toLocaleString) issues');
