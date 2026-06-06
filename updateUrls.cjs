const fs = require('fs');

const content = fs.readFileSync('src/data/demoProducts.ts', 'utf8');

const updated = content.replace(/imageUrl:\s*"([^"]+)"/g, (match, url, offset, string) => {
  const before = string.slice(0, offset);
  let titleMatch = before.match(/title:\s*"([^"]+)"/g);
  let title = "Product";
  if (titleMatch) {
    const lastTitle = titleMatch[titleMatch.length - 1]; // get the most recent title string
    title = lastTitle.replace(/title:\s*"/, '').replace(/"$/, '');
  }
  
  // Format the text so it has newlines roughly
  const words = title.split(' ');
  let lines = [];
  let currentLine = "";
  for (const word of words) {
    if (currentLine.length + word.length > 15) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine) lines.push(currentLine);
  const formattedTitle = lines.join('\\n');
  
  const textEncoded = encodeURIComponent(formattedTitle);
  const newUrl = `https://placehold.co/400x400/1e293b/ffffff.png?text=${textEncoded}`;
  return `imageUrl: "${newUrl}"`;
});

fs.writeFileSync('src/data/demoProducts.ts', updated);
console.log('updated demoProducts.ts');
