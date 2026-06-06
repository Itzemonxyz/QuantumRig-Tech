import fs from 'fs';

const USD_TO_BDT = 120; // approximate multiplier

const imgMap: Record<string, string> = {
  'c1': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400', // CPU
  'c2': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400', // Mobo
  'c3': 'https://images.unsplash.com/photo-1562976540-1502f75a61e3?auto=format&fit=crop&q=80&w=400', // RAM
  'c4': 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&q=80&w=400', // Storage
  'c5': 'https://images.unsplash.com/photo-1591488320449-011701f2f357?auto=format&fit=crop&q=80&w=400', // GPU
  'c6': 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=400', // PSU
  'c7': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=400', // Case
  'c8': 'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?auto=format&fit=crop&q=80&w=400', // Cooler
  'c9': 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&q=80&w=400', // Monitor
  'c10': 'https://images.unsplash.com/photo-1615663245857-ac1eeb536628?auto=format&fit=crop&q=80&w=400', // Access
};

let content = fs.readFileSync('src/data/demoProducts.ts', 'utf-8');

// Replace prices
content = content.replace(/price: ([\d\.]+)/g, (match, p1) => {
  const priceUsd = parseFloat(p1);
  const priceBdt = Math.round((priceUsd * USD_TO_BDT) / 100) * 100; // round to nearest 100
  return `price: ${priceBdt}`;
});

// Replace images
content = content.replace(/categoryId: "(c\d+)"(.*?)imageUrl: "[^"]+"/g, (match, p1, p2) => {
  const cat = p1 as string;
  if (imgMap[cat]) {
    return `categoryId: "${cat}"${p2}imageUrl: "${imgMap[cat]}"`;
  }
  return match;
});

// One more pass for imageUrls that might be after categoryId but I should just do a simple replacement for each line.
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
   const line = lines[i];
   const catMatch = line.match(/categoryId: "(c\d+)"/);
   if (catMatch && catMatch[1]) {
       const cat = catMatch[1];
       if (imgMap[cat]) {
           lines[i] = line.replace(/imageUrl: "[^"]+"/, `imageUrl: "${imgMap[cat]}"`);
       }
   }
}

fs.writeFileSync('src/data/demoProducts.ts', lines.join('\n'));
console.log('Done modifying demoProducts.ts');
