import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, updateDoc, initializeFirestore, setLogLevel } from "firebase/firestore";
import { User, Category, Brand, Product, Order, Settings, Coupon, Offer, RestockRequest, UserNotification, SocialLink } from "./src/types";

setLogLevel('silent');


const app = express();
const PORT = 3000;

const originalConsoleError = console.error;
console.error = (...args) => {
  const argStr = args.map(a => typeof a === 'object' ? JSON.stringify(a, Object.getOwnPropertyNames(a)) : String(a)).join(' ');
  if (argStr.includes("PERMISSION_DENIED") || argStr.includes("CANCELLED") || argStr.includes("GrpcConnection RPC")) {
    return;
  }
  originalConsoleError(...args);
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// ================= FIREBASE SETUP =================
let db: any = null;
let firebaseConfig = null;

try {
  firebaseConfig = {
    apiKey: "AIzaSyDYoNvGjDRk-HDFhuTpF4eaYJExqDyF1p0",
    authDomain: "emonxyz-48285.firebaseapp.com",
    projectId: "emonxyz-48285",
    storageBucket: "emonxyz-48285.firebasestorage.app",
    messagingSenderId: "1035995553022",
    appId: "1:1035995553022:web:a5843d6cb15f10464c99af",
    firestoreDatabaseId: "(default)"
  };

  if (firebaseConfig) {
    const firebaseApp = initializeApp(firebaseConfig);
    const firestoreSettings = { experimentalForceLongPolling: true };
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
      db = initializeFirestore(firebaseApp, firestoreSettings, firebaseConfig.firestoreDatabaseId);
    } else {
      db = initializeFirestore(firebaseApp, firestoreSettings);
    }
    console.log("🔥 Connected to Firebase Firestore with Long Polling");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// IN-MEMORY DATABASE
let stockNotifications: { id: string; productId: string; email: string; createdAt: string }[] = [];
let supportTickets: { id: string; productId: string; email: string; question: string; status: 'Open' | 'Closed'; createdAt: string }[] = [];
let complaints: { id: string; name: string; email: string; orderId?: string; category: string; description: string; createdAt: string }[] = [];
let analyticsEvents: { id: string; event: string; productId: string; timestamp: string }[] = [];
let restockRequests: RestockRequest[] = [];
let users: User[] = [
  { id: "admin_1", name: "Administrator", email: "admin@quantumrig.tech", password: "admin", role: "admin", savedProductIds: [] },
  { id: "admin_2", name: "Administrator", email: "admin@quantumrig.tech", password: "admin6207", role: "admin", savedProductIds: [] }
];

let categories: Category[] = [
  { id: "c1", name: "Processors", slug: "processors" },
  { id: "c2", name: "Motherboards", slug: "motherboards" },
  { id: "c3", name: "RAM", slug: "ram" },
  { id: "c4", name: "Storage", slug: "storage" },
  { id: "c5", name: "Graphics Cards", slug: "graphics-cards" },
  { id: "c6", name: "Power Supplies", slug: "power-supplies" },
  { id: "c7", name: "Casings", slug: "casings" },
  { id: "c8", name: "Coolers", slug: "coolers" },
  { id: "c9", name: "Monitors", slug: "monitors" },
  { id: "c10", name: "Accessories", slug: "accessories" },
  { id: "c11", name: "Laptops", slug: "laptops" }
];
let brands: Brand[] = [
  { id: "b1", name: "Intel", slug: "intel" },
  { id: "b2", name: "AMD", slug: "amd" },
  { id: "b3", name: "NVIDIA", slug: "nvidia" },
  { id: "b4", name: "Corsair", slug: "corsair" },
  { id: "b5", name: "ASUS", slug: "asus" },
  { id: "b6", name: "MSI", slug: "msi" },
  { id: "b7", name: "Gigabyte", slug: "gigabyte" },
  { id: "b8", name: "AORUS", slug: "aorus" },
  { id: "b9", name: "ROG", slug: "rog" },
  { id: "b10", name: "Razer", slug: "razer" }
];

let products: Product[] = [];

let coupons: Coupon[] = [];

let offers: Offer[] = [];

let socialLinks: SocialLink[] = [
  { id: "sl1", name: "Facebook", url: "https://facebook.com" },
  { id: "sl2", name: "WhatsApp", url: "https://whatsapp.com" },
  { id: "sl3", name: "Instagram", url: "https://instagram.com" }
];

let orders: Order[] = [];

let settings: Settings = {
  announcementText: "🚀 Free shipping on all PC Builds over ৳2000! Use code QUANTUM24",
  facebookUrl: "https://facebook.com",
  whatsappUrl: "https://whatsapp.com",
  instagramUrl: "https://instagram.com"
};

// ================= FIRESTORE SYNC =================
async function syncDatabase() {
  if (!db) return;
  try {
    // 1. Sync Products
    const pSnap = await getDocs(collection(db, "products"));
    if (!pSnap.empty) {
      products = pSnap.docs.map((d: any) => d.data() as Product);
      
      // Just load products
      // No code rewriting
      await Promise.all(products.map(async (p) => {
        if (!p.code) {
          p.code = p.id;
          await setDoc(doc(db, "products", p.id), JSON.parse(JSON.stringify(p))).catch(console.error);
        }
      }));
    } else {
      await Promise.all(products.map(p => setDoc(doc(db, "products", p.id), JSON.parse(JSON.stringify(p)))));
    }

    // 2. Sync Categories
    const cSnap = await getDocs(collection(db, "categories"));
    if (!cSnap.empty) {
      categories = cSnap.docs.map((d: any) => d.data() as Category);
    } else {
      await Promise.all(categories.map(c => setDoc(doc(db, "categories", c.id), JSON.parse(JSON.stringify(c)))));
    }

    // 3. Sync Brands
    const bSnap = await getDocs(collection(db, "brands"));
    if (!bSnap.empty) {
      brands = bSnap.docs.map((d: any) => d.data() as Brand);
    } else {
      await Promise.all(brands.map(b => setDoc(doc(db, "brands", b.id), JSON.parse(JSON.stringify(b)))));
    }

    // 4. Sync Users 
    const uSnap = await getDocs(collection(db, "users"));
    if (!uSnap.empty) {
       // Merge users carefully so we don't overwrite mock memory if there's no auth system.
       const fsUsers = uSnap.docs.map((d: any) => d.data() as User);
       const uMap = new Map();
       users.forEach(u => uMap.set(u.email, u));
       fsUsers.forEach(u => uMap.set(u.email, { ...uMap.get(u.email), ...u }));
       users = Array.from(uMap.values());
    }

    // 5. Sync Orders
    const oSnap = await getDocs(collection(db, "orders"));
    if (!oSnap.empty) {
      orders = oSnap.docs.map((d: any) => d.data() as Order);
      
      // Clean up any stray mock orders from the DB
      const mockOrdersToDelete = orders.filter(o => o.id && o.id.startsWith("mock_"));
      if (mockOrdersToDelete.length > 0) {
        await Promise.all(mockOrdersToDelete.map(mo => deleteDoc(doc(db, "orders", mo.id)).catch(console.error)));
        orders = orders.filter(o => !o.id || !o.id.startsWith("mock_"));
      }
    } // if empty, do not seed mock orders to avoid bloat

    // 6. Sync Settings
    const setSnap = await getDocs(collection(db, "settings"));
    if (!setSnap.empty) {
      const globalSet = setSnap.docs.find(d => d.id === 'global');
      if (globalSet) settings = globalSet.data() as Settings;
    } else {
      await setDoc(doc(db, "settings", "global"), JSON.parse(JSON.stringify(settings))).catch(console.error);
    }

    // 7. Sync Coupons
    const cpSnap = await getDocs(collection(db, "coupons"));
    if (!cpSnap.empty) {
      coupons = cpSnap.docs.map((d: any) => d.data() as Coupon);
    }

    // 8. Sync Offers
    const ofSnap = await getDocs(collection(db, "offers"));
    if (!ofSnap.empty) {
      offers = ofSnap.docs.map((d: any) => d.data() as Offer);
    }

    // 9. Sync Restock Requests
    const rrSnap = await getDocs(collection(db, "restocks"));
    if (!rrSnap.empty) {
      restockRequests = rrSnap.docs.map((d: any) => d.data() as RestockRequest);
    }

    // 10. Sync Support Tickets
    const stSnap = await getDocs(collection(db, "support"));
    if (!stSnap.empty) {
      supportTickets = stSnap.docs.map((d: any) => d.data() as any);
    }

    // 11. Sync Social Links
    const slSnap = await getDocs(collection(db, "social_links"));
    if (!slSnap.empty) {
      socialLinks = slSnap.docs.map((d: any) => d.data() as SocialLink);
    } else {
      await Promise.all(socialLinks.map(sl => setDoc(doc(db, "social_links", sl.id), JSON.parse(JSON.stringify(sl))).catch(console.error)));
    }

    // 12. Sync Complaints
    const cmpSnap = await getDocs(collection(db, "complaints"));
    if (!cmpSnap.empty) {
      complaints = cmpSnap.docs.map((d: any) => d.data() as any);
    }

  } catch (error: any) {
    if (error && error.message && error.message.includes('PERMISSION_DENIED')) return;
    console.warn("Firestore Sync Error (rules may not open yet):", error);
  }
}

let dbSyncPromise: Promise<void> | null = null;
function ensureDbSynced() {
  if (!dbSyncPromise) {
    dbSyncPromise = syncDatabase();
  }
  return dbSyncPromise;
}

// Ensure database is synced before handling any API request
app.use('/api', async (req, res, next) => {
  try {
    await ensureDbSynced();
    next();
  } catch (error) {
    next(error);
  }
});

// ================= API ROUTES =================

// Users & Auth
app.post("/api/users/me/saved-products", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  if (!user.savedProductIds) user.savedProductIds = [];
  const { productId } = req.body;
  if (!user.savedProductIds.includes(productId)) {
    user.savedProductIds.push(productId);
    if (db) await setDoc(doc(db, "users", user.id), { savedProductIds: user.savedProductIds }, { merge: true }).catch(console.error);
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.delete("/api/users/me/saved-products/:productId", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  if (user.savedProductIds) {
    user.savedProductIds = user.savedProductIds.filter(id => id !== req.params.productId);
    if (db) await setDoc(doc(db, "users", user.id), { savedProductIds: user.savedProductIds }, { merge: true }).catch(console.error);
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post("/api/users/me/cart", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { cart } = req.body;
  user.cart = Array.isArray(cart) ? cart : [];
  
  if (db) {
    await setDoc(doc(db, "users", user.id), { cart: user.cart }, { merge: true }).catch(console.error);
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ token: `dummy-token-${user.id}`, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email taken" });
  }
  const newUser: User = { id: `u${Date.now()}`, name, email, password, phone, role: role || "user", savedProductIds: [] };
  if (db) await setDoc(doc(db, "users", newUser.id), JSON.parse(JSON.stringify(newUser))).catch(console.error);
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ token: `dummy-token-${newUser.id}`, user: userWithoutPassword });
});

app.post("/api/auth/google", async (req, res) => {
  const { email, name, avatar, phone, role } = req.body;
  let user = users.find((u) => u.email === email);
  if (user) {
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (name) user.name = name;
    if (role) user.role = role;
  } else {
    user = { id: `u${Date.now()}`, name, email, phone, avatar, role: role || "user", savedProductIds: [] };
    if (db) await setDoc(doc(db, "users", user.id), JSON.parse(JSON.stringify(user))).catch(console.error);
    users.push(user);
  }
  const { password, ...userWithoutPassword } = user;
  res.json({ token: `dummy-token-${user.id}`, user: userWithoutPassword });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  // Standard success response for forgot password
  res.json({ success: true, message: "If the email exists, a password reset link has been sent." });
});

app.get("/api/users/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (user) {
     const { password, ...userWithoutPassword } = user;
     // Calculate loyalty points
     const userOrders = orders.filter((o) => o.userId === user.id && o.status !== 'Cancelled');
     const totalSpent = userOrders.reduce((acc, order) => acc + order.totalAmount, 0);
     const loyaltyPoints = Math.floor(totalSpent / 100);
     res.json({ ...userWithoutPassword, loyaltyPoints });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.put("/api/users/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (user) {
    const { name, phone, password, avatar } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (password) user.password = password; // Only saving in mock memory
    const { password: currentPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Social Links
app.get("/api/social-links", (req, res) => res.json(socialLinks));
app.post("/api/social-links", async (req, res) => {
  const sl: SocialLink = { id: `sl${Date.now()}`, ...req.body };
  if (db) await setDoc(doc(db, "social_links", sl.id), JSON.parse(JSON.stringify(sl))).catch(console.error);
  socialLinks.push(sl);
  res.json(sl);
});
app.put("/api/social-links/:id", async (req, res) => {
  const idx = socialLinks.findIndex(sl => sl.id === req.params.id);
  if (idx > -1) {
    socialLinks[idx] = { ...socialLinks[idx], ...req.body };
    if (db) await setDoc(doc(db, "social_links", socialLinks[idx].id), JSON.parse(JSON.stringify(socialLinks[idx]))).catch(console.error);
    res.json(socialLinks[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/social-links/:id", async (req, res) => {
  socialLinks = socialLinks.filter(sl => sl.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "social_links", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

// Settings
app.get("/api/settings", (req, res) => res.json(settings));
app.put("/api/settings", async (req, res) => {
  settings = { ...settings, ...req.body };
  if (db) await setDoc(doc(db, "settings", "global"), JSON.parse(JSON.stringify(settings))).catch(console.error);
  res.json(settings);
});

// Categories
app.get("/api/categories", (req, res) => res.json(categories));
// Note: In a real app we'd save this to a database

app.get("/api/admin/restock-requests", (req, res) => res.json(restockRequests));

app.post("/api/restock-requests", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });

  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const newReq: RestockRequest = {
    id: `rr_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    productId,
    productTitle: product.title,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  if (db) await setDoc(doc(db, "restocks", newReq.id), JSON.parse(JSON.stringify(newReq))).catch(console.error);
  restockRequests.push(newReq);
  res.json(newReq);
});

app.delete("/api/restock-requests/:id", async (req, res) => {
  restockRequests = restockRequests.filter(r => r.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "restocks", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

app.post("/api/users/me/price-alerts", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });

  // In a real app we'd save this to a database, but for now we just return ok
  res.json({ success: true, productId });
});

app.get("/api/users/me/notifications", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(user.notifications || []);
});

app.put("/api/users/me/notifications/:id/read", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const notif = (user.notifications || []).find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    if (db) await setDoc(doc(db, "users", user.id), { notifications: user.notifications }, { merge: true }).catch(console.error);
  }
  res.json({ success: true });
});

app.post("/api/notify-stock", (req, res) => {
  const { productId, email } = req.body;
  if (!productId || !email) return res.status(400).json({ error: 'Missing fields' });
  stockNotifications.push({ id: `sn_${Date.now()}`, productId, email, createdAt: new Date().toISOString() });
  res.json({ success: true });
});

app.post("/api/analytics/track", (req, res) => {
  const { event, productId } = req.body;
  analyticsEvents.push({ id: `evt_${Date.now()}`, event, productId, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

app.get("/api/support-tickets", (req, res) => res.json(supportTickets));

app.post("/api/support-tickets", async (req, res) => {
  const { productId, email, question } = req.body;
  if (!productId || !email || !question) return res.status(400).json({ error: 'Missing fields' });
  const ticket = { id: `st_${Date.now()}`, productId, email, question, status: 'Open' as const, createdAt: new Date().toISOString() };
  if (db) await setDoc(doc(db, "support", ticket.id), JSON.parse(JSON.stringify(ticket))).catch(console.error);
  supportTickets.push(ticket);
  res.json(ticket);
});

app.put("/api/support-tickets/:id", async (req, res) => {
  const idx = supportTickets.findIndex(t => t.id === req.params.id);
  if (idx !== -1) {
    supportTickets[idx] = { ...supportTickets[idx], ...req.body };
    if (db) await setDoc(doc(db, "support", supportTickets[idx].id), JSON.parse(JSON.stringify(supportTickets[idx]))).catch(console.error);
    res.json(supportTickets[idx]);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.delete("/api/support-tickets/:id", async (req, res) => {
  supportTickets = supportTickets.filter(t => t.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "support", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

// Complaints endpoints
app.get("/api/complaints", (req, res) => res.json(complaints));

app.post("/api/complaints", async (req, res) => {
  const { name, email, orderId, category, description } = req.body;
  if (!name || !email || !category || !description) return res.status(400).json({ error: 'Missing fields' });
  const complaint = {
    id: `cmp_${Date.now()}`,
    name,
    email,
    orderId: orderId || '',
    category,
    description,
    createdAt: new Date().toISOString()
  };
  if (db) await setDoc(doc(db, "complaints", complaint.id), JSON.parse(JSON.stringify(complaint))).catch(console.error);
  complaints.push(complaint);
  res.json(complaint);
});

app.delete("/api/complaints/:id", async (req, res) => {
  complaints = complaints.filter(c => c.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "complaints", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

app.post("/api/categories", async (req, res) => {
  const c: Category = { id: `c${Date.now()}`, ...req.body };
  if (db) await setDoc(doc(db, "categories", c.id), JSON.parse(JSON.stringify(c))).catch(console.error);
  categories.push(c);
  res.json(c);
});
app.put("/api/categories/:id", async (req, res) => {
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    categories[idx] = { ...categories[idx], ...req.body };
    if (db) await setDoc(doc(db, "categories", categories[idx].id), JSON.parse(JSON.stringify(categories[idx]))).catch(console.error);
    res.json(categories[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/categories/:id", async (req, res) => {
  categories = categories.filter(c => c.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "categories", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

// Brands
app.get("/api/brands", (req, res) => res.json(brands));
app.post("/api/brands", async (req, res) => {
  const b: Brand = { id: `b${Date.now()}`, ...req.body };
  if (db) await setDoc(doc(db, "brands", b.id), JSON.parse(JSON.stringify(b))).catch(console.error);
  brands.push(b);
  res.json(b);
});
app.put("/api/brands/:id", async (req, res) => {
  const idx = brands.findIndex(b => b.id === req.params.id);
  if (idx > -1) {
    brands[idx] = { ...brands[idx], ...req.body };
    if (db) await setDoc(doc(db, "brands", brands[idx].id), JSON.parse(JSON.stringify(brands[idx]))).catch(console.error);
    res.json(brands[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/brands/:id", async (req, res) => {
  brands = brands.filter(b => b.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "brands", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

app.delete("/api/internal/clear-all", async (req, res) => {
  products = [];
  try {
    if (db) {
      const snap = await getDocs(collection(db, "products"));
      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
    }
    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Products
app.get("/api/admin/products/search", (req, res) => {
  const q = (req.query.q as string || "").toLowerCase();
  let results = products;
  if (q) {
    results = products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.code && p.code.toLowerCase().includes(q))
    );
  }
  res.json(results);
});

app.get("/api/products", (req, res) => res.json(products));

app.post("/api/products", async (req, res) => {
  let code = req.body.code;
  if (!code) {
    let attempts = 0;
    while (attempts < 100) {
      const randId = Math.floor(10000 + Math.random() * 90000).toString();
      if (!products.some(p => p.code === randId || p.id === randId)) {
        code = randId;
        break;
      }
      attempts++;
    }
  }
  const p: Product = { ...req.body, id: code, code };
  const safeP = JSON.parse(JSON.stringify(p));
  if (db) await setDoc(doc(db, "products", p.id), safeP).catch(console.error);
  products.push(p);
  res.json(p);
});
app.put("/api/products/:id", async (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx > -1) {
    const oldProduct = products[idx];
    let code = req.body.code || products[idx].code;
    
    if (!code) {
      let attempts = 0;
      while (attempts < 100) {
        const randId = Math.floor(10000 + Math.random() * 90000).toString();
        if (!products.some((p, i) => i !== idx && p.code === randId)) {
          code = randId;
          break;
        }
        attempts++;
      }
    }
    const newProduct = { ...oldProduct, ...req.body, id: code, code };
    products[idx] = newProduct;
    const safeProduct = JSON.parse(JSON.stringify(newProduct));
    if (db) {
      if (oldProduct.id !== newProduct.id) {
        await deleteDoc(doc(db, "products", oldProduct.id)).catch(console.error);
      }
      await setDoc(doc(db, "products", newProduct.id), safeProduct).catch(console.error);
    }
    
    if (
      (oldProduct.stockStatus === 'Out of Stock' || oldProduct.inventoryCount === 0) &&
      (newProduct.stockStatus !== 'Out of Stock' && newProduct.inventoryCount !== undefined && newProduct.inventoryCount > 0)
    ) {
      for (let i = 0; i < restockRequests.length; i++) {
        let r = restockRequests[i];
        if (r.productId === newProduct.id && r.status === 'pending') {
          const uIdx = users.findIndex(u => u.id === r.userId);
          if (uIdx > -1) {
            users[uIdx].notifications = users[uIdx].notifications || [];
            users[uIdx].notifications.push({
              id: `notif_${Date.now()}_${Math.random()}`,
              message: `${newProduct.title} is back in stock!`,
              link: `/products/${newProduct.id}`,
              read: false,
              createdAt: new Date().toISOString()
            });
            if (db) await setDoc(doc(db, "users", users[uIdx].id), { notifications: users[uIdx].notifications }, { merge: true }).catch(console.error);
          }
          restockRequests[i] = { ...r, status: 'fulfilled' };
          if (db) await updateDoc(doc(db, "restocks", r.id), { status: 'fulfilled' }).catch(console.error);
        }
      }
    }

    res.json(products[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/products/:id", async (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "products", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

app.get("/api/products/:id", (req, res) => {
  const p = products.find(p => p.id === req.params.id);
  if (p) res.json(p);
  else res.status(404).json({ error: "Not found" });
});

app.post("/api/products/:id/reviews", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const review = {
    id: `rev${Date.now()}`,
    userId: user.id,
    userName: user.name,
    rating: req.body.rating,
    comment: req.body.comment,
    createdAt: new Date().toISOString()
  };

  products[idx].reviews = products[idx].reviews || [];
  products[idx].reviews.push(review);
  if (db) await setDoc(doc(db, "products", products[idx].id), JSON.parse(JSON.stringify(products[idx]))).catch(console.error);

  res.json(review);
});

// Offers
app.get("/api/offers", (req, res) => res.json(offers));
app.post("/api/offers", async (req, res) => {
  const o: Offer = { id: `of${Date.now()}`, ...req.body };
  if (db) await setDoc(doc(db, "offers", o.id), JSON.parse(JSON.stringify(o))).catch(console.error);
  offers.push(o);
  res.json(o);
});
app.put("/api/offers/:id", async (req, res) => {
  const idx = offers.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    offers[idx] = { ...offers[idx], ...req.body };
    if (db) await setDoc(doc(db, "offers", offers[idx].id), JSON.parse(JSON.stringify(offers[idx]))).catch(console.error);
    res.json(offers[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/offers/:id", async (req, res) => {
  offers = offers.filter(o => o.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "offers", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

// Coupons
app.get("/api/coupons", (req, res) => res.json(coupons));
app.post("/api/coupons", async (req, res) => {
  const c: Coupon = { id: `cp${Date.now()}`, ...req.body };
  if (db) await setDoc(doc(db, "coupons", c.id), JSON.parse(JSON.stringify(c))).catch(console.error);
  coupons.push(c);
  res.json(c);
});
app.put("/api/coupons/:id", async (req, res) => {
  const idx = coupons.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    coupons[idx] = { ...coupons[idx], ...req.body };
    if (db) await setDoc(doc(db, "coupons", coupons[idx].id), JSON.parse(JSON.stringify(coupons[idx]))).catch(console.error);
    res.json(coupons[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/coupons/:id", async (req, res) => {
  coupons = coupons.filter(c => c.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "coupons", req.params.id)).catch(console.error);
  res.sendStatus(204);
});
app.get("/api/coupons/validate/:code", (req, res) => {
  const code = req.params.code;
  const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive);
  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404).json({ error: "Invalid or inactive coupon" });
  }
});

// Orders
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.delete("/api/orders/:id", async (req, res) => {
  orders = orders.filter(o => o.id !== req.params.id);
  if (db) await deleteDoc(doc(db, "orders", req.params.id)).catch(console.error);
  res.sendStatus(204);
});

app.get("/api/orders/user", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "") || "guest";
  const userOrders = orders.filter(o => o.userId === token);
  res.json(userOrders);
});
app.post("/api/orders", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const paymentMethod = req.body.paymentMethod || 'Cash on Delivery';
  
  let orderId = Math.floor(100000 + Math.random() * 900000).toString();
  while (orders.some(o => o.id === orderId)) {
    orderId = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const order: Order = {
    id: orderId,
    userId: token || "guest",
    items: req.body.items,
    totalAmount: req.body.totalAmount,
    couponCode: req.body.couponCode,
    discountAmount: req.body.discountAmount,
    status: "Pending",
    deliveryDetails: req.body.deliveryDetails,
    paymentMethod,
    transactionId: req.body.transactionId,
    paymentStatus: paymentMethod === 'Manual Payment' ? 'Pending' : undefined,
    trackingHistory: [
      {
        status: "Pending",
        date: new Date().toISOString(),
        description: "Order placed successfully. Awaiting confirmation."
      }
    ],
    createdAt: new Date().toISOString()
  };
  
  // Decrease product stock and save back to database
  if (req.body.items && Array.isArray(req.body.items)) {
    for (const item of req.body.items) {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx > -1) {
        const prod = products[pIdx];
        if (prod.inventoryCount !== undefined) {
          prod.inventoryCount = Math.max(0, prod.inventoryCount - (item.quantity || 1));
          if (prod.inventoryCount === 0) {
            prod.stockStatus = 'Out of Stock';
          }
        }
        if (db) {
          await setDoc(doc(db, "products", prod.id), JSON.parse(JSON.stringify(prod))).catch(console.error);
        }
      }
    }
  }

  // Remove undefined fields to prevent Firestore errors
  const safeOrder = JSON.parse(JSON.stringify(order));
  
  if (db) await setDoc(doc(db, "orders", order.id), safeOrder).catch(console.error);
  orders.push(order);
  res.json(order);
});
app.put("/api/orders/:id/status", async (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    orders[idx].status = req.body.status;
    
    // Append to tracking history
    const descriptions: Record<string, string> = {
      "Accepted": "Order has been accepted and is being processed.",
      "Shipped": "Order has been dispatched and is on its way.",
      "Delivered": "Order has been delivered successfully.",
      "Cancelled": "Order has been cancelled."
    };
    
    orders[idx].trackingHistory = orders[idx].trackingHistory || [];
    orders[idx].trackingHistory.push({
      status: req.body.status,
      date: new Date().toISOString(),
      description: descriptions[req.body.status] || "Order status updated."
    });

    if (db) await updateDoc(doc(db, "orders", req.params.id), { status: req.body.status, trackingHistory: orders[idx].trackingHistory }).catch(console.error);
    res.json(orders[idx]);
  } else res.status(404).json({ error: "Not found" });
});

app.put("/api/orders/:id/paymentStatus", async (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    orders[idx].paymentStatus = req.body.paymentStatus;
    if (db) await updateDoc(doc(db, "orders", req.params.id), { paymentStatus: req.body.paymentStatus }).catch(console.error);
    res.json(orders[idx]);
  } else res.status(404).json({ error: "Not found" });
});

app.get("/api/public/orders/:id", (req, res) => {
  const o = orders.find(o => o.id === req.params.id);
  // We explicitly strip out PII (like shipping address if any) to protect guest lookup, 
  // but we can return status, trackingHistory, items briefly
  if (o) {
    res.json({
      id: o.id,
      status: o.status,
      trackingHistory: o.trackingHistory,
      totalAmount: o.totalAmount,
      items: o.items.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
      createdAt: o.createdAt
    });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});


// Analytics
app.get("/api/admin/analytics", (req, res) => {
  const validOrders = orders.filter(o => o.status !== 'Cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  const orderBreakdown = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Verified: orders.filter(o => o.status === 'Accepted').length, 
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Shipped: orders.filter(o => o.status === 'Shipped').length
  };

  const productSales: Record<string, {title: string, count: number}> = {};
  validOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { title: item.title, count: 0 };
      }
      productSales[item.productId].count += item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return { fullDate: d, dateStr: d.toISOString().split('T')[0] };
  }).reverse();

  const salesData = last7Days.map(({ fullDate, dateStr }) => {
    const dailyRevenue = validOrders
      .filter(o => {
        // Need to check if createdAt falls on this day in UTC or local, simplified by slicing
        return o.createdAt.startsWith(dateStr);
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
      
    // Format as MM/DD
    const displayMonth = fullDate.getMonth() + 1;
    const displayDay = fullDate.getDate();
    return { name: `${displayMonth}/${displayDay}`, revenue: dailyRevenue };
  });

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    totalUsers: users.length,
    totalProducts: products.length,
    orderBreakdown,
    topProducts,
    salesData
  });
});

// Vite & Static file serving
async function startServer() {
  await ensureDbSynced();

  if (process.env.VERCEL) {
    return; // Vercel handles static routing and starts the function automatically
  }

  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite so it isn't statically required by Vercel
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
