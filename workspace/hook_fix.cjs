const fs = require('fs');

let content = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');

// The issue is:
// const product = products.find(p => p.id === id);
// if (!product) { return ... }
// Followed by hooks...

// We will find the "if (!product) { ... }" block and move it after all the hooks, just before the returns or use a different strategy.
// Actually, it's easier to just use standard DOM for the not found case.
// If product is undefined, we shouldn't continue setting states based on `product.id` without `?`
// Let's replace `const product = products.find(p => p.id === id);` with:
// `const product = products.find(p => p.id === id) || {} as any;`
// Wait, that might cause errors if `product` properties are accessed.
// Let's just move the `if (!product)` block.

const lines = content.split('\n');
let ifStart = -1;
let ifEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (!product) {')) {
    ifStart = i;
  }
  if (ifStart !== -1 && lines[i].includes(');')) {
    ifEnd = i + 1; // including the '}' which is next line
    break;
  }
}

if (ifStart !== -1) {
    ifEnd++; // to cover '  }' line
    const ifBlock = lines.splice(ifStart, ifEnd - ifStart);
    // Find the place before `return (` at the end
    let insertIndex = lines.findIndex(l => l.trim() === 'return (');
    if (insertIndex !== -1) {
        lines.splice(insertIndex, 0, ...ifBlock);
        
        // Also need to handle product being possibly undefined in the hooks initialization
        // We will just do a global replace of `product.` to `product?.` inside the state initializations
        // Or we can just let it crash safely or provide defaults
        
        // Instead of moving, let's just make product a dummy object if not found?
        // No, `product` is used extensively.
    }
}

// Actually, replacing `if (!product)` logic with early return is fine if we just don't do it before hooks.
// Let's just create an inner component or check the file manually.

fs.writeFileSync('src/pages/ProductDetails.tsx', lines.join('\n'));
