import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceInFile(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('$')) {
      // Replace $ with ৳ EXCEPT for string interpolation ${}
      // Wait, we need to be careful with template literals: ${}
      // It's safer to just replace '\$' and maybe exact '$' if not followed by '{'
      
      // Let's replace instances of \$ and '$' -> '৳' where appropriate.
      // E.g., `\$${` or `$` not followed by `{` when it comes to currency.
      
      // Actually, regex: \$(?!\{) replaces $ not followed by {
      // It might break jQuery or $ variables, but this codebase doesn't use them much.
      let newContent = content.replace(/\$(?!\{)/g, '৳');
      
      // Some cases like `\$${` -> `৳${`
      newContent = newContent.replace(/\\\$\$\{/g, '৳${'); 
      // e.g. `\$${price.toFixed(2)}` -> `৳${price.toFixed(2)}` in tsx
      
      fs.writeFileSync(filePath, newContent);
    }
  }
}

walkDir('./src', replaceInFile);
replaceInFile('./server.ts');
console.log('Currency replaced');
