const fs = require('fs');
const glob = require('glob');

function modifyFiles() {
  const files = glob.sync('src/**/*.{ts,tsx,js,jsx}');
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;

    // Replace .toFixed(2) with .toLocaleString(...) when it follows Number(something) and is prefixed by ৳ 
    // Wait, let's just do a global replace for things inside ৳{...}
    content = content.replace(/৳{Number\(([^)]+)\)\.toFixed\(0\)}/g, '৳{Number($1).toLocaleString("en-US")}');
    content = content.replace(/৳{Number\(((?:(?!\)\.toFixed).)+)\)\.toFixed\(2\)}/g, '৳{Number($1).toLocaleString("en-US")}');
    content = content.replace(/\.toFixed\(2\)/g, '.toLocaleString("en-US")'); // rough fallback
    content = content.replace(/\.toFixed\(0\)/g, '.toLocaleString("en-US")');

    // Desaturate punchy colors in price spans: text-indigo-600 to text-slate-700, text-rose-600 to text-rose-500 or slate. Let's make all prices text-slate-700 and text-slate-500.
    // text-indigo-600 -> text-slate-700 for prices is easiest but let's just replace all `text-indigo-600` where it's a price span.
    content = content.replace(/className="([^"]*)text-indigo-600([^"]*)"(>৳)/g, 'className="$1text-slate-700$2"$3');
    content = content.replace(/className="([^"]*)text-rose-600([^"]*)"(>৳)/g, 'className="$1text-slate-600$2"$3');

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Modified', file);
    }
  });
}

modifyFiles();
