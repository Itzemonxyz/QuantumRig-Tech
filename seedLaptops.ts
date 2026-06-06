import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "emonxyz-48285.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "emonxyz-48285",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "emonxyz-48285.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)");

const laptops = [
  { title: "Apple MacBook Pro 14 (M3 Pro)", brand: "Apple", slug: "macbook-pro-14-m3", categoryId: "c11", price: 250000, stockStatus: "In Stock", inventoryCount: 5, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400", description: "Powerful M3 Pro chip for creatives and developers.", specs: { RAM: "18GB", Storage: "512GB SSD", Display: "14.2-inch Liquid Retina XDR" } },
  { title: "Asus ROG Zephyrus G14", brand: "ASUS", slug: "asus-rog-zephyrus-g14", categoryId: "c11", price: 180000, stockStatus: "In Stock", inventoryCount: 8, imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=400", description: "Ultra-portable gaming laptop.", specs: { RAM: "16GB", Storage: "1TB SSD", Display: "14-inch QHD 165Hz", GPU: "RTX 4060" } },
  { title: "Lenovo Legion Pro 5i", brand: "Lenovo", slug: "lenovo-legion-pro-5i", categoryId: "c11", price: 165000, stockStatus: "In Stock", inventoryCount: 12, imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400", description: "High performance gaming.", specs: { RAM: "16GB", Storage: "1TB SSD", Display: "16-inch WQXGA 165Hz", GPU: "RTX 4070" } },
  { title: "Dell XPS 15", brand: "Dell", slug: "dell-xps-15", categoryId: "c11", price: 210000, stockStatus: "Low Stock", inventoryCount: 3, imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=400", description: "Premium creator laptop.", specs: { RAM: "32GB", Storage: "1TB SSD", Display: "15.6-inch 3.5K OLED" } },
  { title: "HP Pavilion Aero 13", brand: "HP", slug: "hp-pavilion-aero-13", categoryId: "c11", price: 85000, stockStatus: "In Stock", inventoryCount: 15, imageUrl: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=400", description: "Ultra-lightweight everyday laptop.", specs: { RAM: "8GB", Storage: "512GB SSD", Display: "13.3-inch WUXGA" } },
  { title: "Acer Swift 3", brand: "Acer", slug: "acer-swift-3", categoryId: "c11", price: 75000, stockStatus: "In Stock", inventoryCount: 20, imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400", description: "Budget-friendly performance.", specs: { RAM: "8GB", Storage: "512GB SSD", Display: "14-inch FHD" } },
];

async function seed() {
  console.log("Seeding Laptops...");
  for (let i = 0; i < laptops.length; i++) {
    const pData = {
      ...laptops[i],
      id: `p_laptop_${Date.now() + i}`,
      code: `LAP-${1000 + i}`
    };
    await setDoc(doc(db, 'products', pData.id), pData);
  }
  console.log("Laptops Uploaded!");
  process.exit(0);
}

seed().catch(console.error);
