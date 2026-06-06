import fs from 'fs';

let serverStr = fs.readFileSync('server.ts', 'utf-8');
const catIndex = serverStr.indexOf('{ id: "c10", name: "Accessories", slug: "accessories" },');
if (catIndex !== -1) {
  serverStr = serverStr.slice(0, catIndex) + '{ id: "c10", name: "Accessories", slug: "accessories" },\n  { id: "c11", name: "Laptops", slug: "laptops" },' + serverStr.slice(catIndex + 58);
}
fs.writeFileSync('server.ts', serverStr);

const laptops = `
  { id: "l1", title: "Apple MacBook Pro 14 (M3 Pro)", brand: "Apple", slug: "macbook-pro-14-m3", categoryId: "c11", price: 250000, stockStatus: "In Stock" as const, inventoryCount: 5, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400", description: "Powerful M3 Pro chip for creatives and developers.", specs: { RAM: "18GB", Storage: "512GB SSD", Display: "14.2-inch Liquid Retina XDR" } },
  { id: "l2", title: "Asus ROG Zephyrus G14", brand: "ASUS", slug: "asus-rog-zephyrus-g14", categoryId: "c11", price: 180000, stockStatus: "In Stock" as const, inventoryCount: 8, imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=400", description: "Ultra-portable gaming laptop.", specs: { RAM: "16GB", Storage: "1TB SSD", Display: "14-inch QHD 165Hz", GPU: "RTX 4060" } },
  { id: "l3", title: "Lenovo Legion Pro 5i", brand: "Lenovo", slug: "lenovo-legion-pro-5i", categoryId: "c11", price: 165000, stockStatus: "In Stock" as const, inventoryCount: 12, imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400", description: "High performance gaming.", specs: { RAM: "16GB", Storage: "1TB SSD", Display: "16-inch WQXGA 165Hz", GPU: "RTX 4070" } },
  { id: "l4", title: "Dell XPS 15", brand: "Dell", slug: "dell-xps-15", categoryId: "c11", price: 210000, stockStatus: "Low Stock" as const, inventoryCount: 3, imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=400", description: "Premium creator laptop.", specs: { RAM: "32GB", Storage: "1TB SSD", Display: "15.6-inch 3.5K OLED" } },
  { id: "l5", title: "HP Pavilion Aero 13", brand: "HP", slug: "hp-pavilion-aero-13", categoryId: "c11", price: 85000, stockStatus: "In Stock" as const, inventoryCount: 15, imageUrl: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=400", description: "Ultra-lightweight everyday laptop.", specs: { RAM: "8GB", Storage: "512GB SSD", Display: "13.3-inch WUXGA" } },
  { id: "l6", title: "Acer Swift 3", brand: "Acer", slug: "acer-swift-3", categoryId: "c11", price: 75000, stockStatus: "In Stock" as const, inventoryCount: 20, imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400", description: "Budget-friendly performance.", specs: { RAM: "8GB", Storage: "512GB SSD", Display: "14-inch FHD" } },
`;

let demoStr = fs.readFileSync('src/data/demoProducts.ts', 'utf-8');
const demoEnd = demoStr.lastIndexOf('];');
if (demoEnd !== -1) {
  demoStr = demoStr.slice(0, demoEnd) + laptops + demoStr.slice(demoEnd);
}
fs.writeFileSync('src/data/demoProducts.ts', demoStr);
