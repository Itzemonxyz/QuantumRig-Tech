const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      if (p.endsWith('.tsx') || p.endsWith('.ts')) {
        callback(p);
      }
    }
  }
}

function modifyFiles() {
  walk('src', (file) => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;

    content = content.replace(/\.toFixed\(0\)/g, '.toLocaleString("en-US")');
    content = content.replace(/\.toFixed\(2\)/g, '.toLocaleString("en-US")');
    
    // specifically target price elements that might have punchy colors
    content = content.replace(/text-indigo-600([^>]+)৳/g, 'text-slate-700$1৳');
    content = content.replace(/text-rose-600([^>]+)৳/g, 'text-slate-600$1৳');
    
    // Some are like: className="text-3xl font-bold text-indigo-600">৳
    content = content.replace(/text-indigo-600([^>]*)>৳/g, 'text-slate-700$1>৳');
    content = content.replace(/text-rose-600([^>]*)>৳/g, 'text-slate-600$1>৳');
    
    content = content.replace(/text-rose-600 font-bold/g, 'text-slate-600 font-bold');
    
    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Modified', file);
    }
  });
}

modifyFiles();
