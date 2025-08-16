import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";

const app = express();

app.use(
  cors({ origin: true, allowedHeaders: ["Content-Type", "x-admin"] })
);
app.use(express.json());

async function openDb() {
  return open({
    filename: "mydb.sqlite",
    driver: sqlite3.Database,
  });
}

async function initDb() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      is_admin INTEGER DEFAULT 0
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      price TEXT,
      img TEXT,
      tag TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      email TEXT,
      items TEXT,
      total REAL,
      created_at TEXT
    )
  `);

  try {
    await db.run(
      "INSERT OR IGNORE INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)",
      ["admin", "admin@thestore.fh", "th3bestPassw0rd", 1]
    );
  } catch {}

  const sampleProducts = [
    {
      name: "Classic Leather Wallet",
      price: "$39.00",
      img: "https://images.unsplash.com/photo-1519741497103-1837d4c7f4c6?auto=format&fit=crop&w=800&q=60",
      tag: "accessories",
    },
    {
      name: "Minimalist Wristwatch",
      price: "$129.00",
      img: "https://images.unsplash.com/photo-1518544884325-1f7b3f1b7c5b?auto=format&fit=crop&w=800&q=60",
      tag: "watch",
    },
    {
      name: "Canvas Tote Bag",
      price: "$24.50",
      img: "https://images.unsplash.com/photo-1520975911702-7f0b0cb9f9b3?auto=format&fit=crop&w=800&q=60",
      tag: "bags",
    },
    {
      name: "Bluetooth Earbuds",
      price: "$59.99",
      img: "https://images.unsplash.com/photo-1518444021847-16f6f8c2d5d2?auto=format&fit=crop&w=800&q=60",
      tag: "electronics",
    },
    {
      name: "Ceramic Coffee Mug",
      price: "$14.00",
      img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=60",
      tag: "home",
    },
    {
      name: "Slim Laptop Sleeve",
      price: "$29.00",
      img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=60",
      tag: "accessories",
    },
  ];

  try {
    const row = await db.get("SELECT COUNT(1) as cnt FROM products");
    if (!row || row.cnt === 0) {
      const insert = await db.prepare(
        "INSERT INTO products (name, price, img, tag) VALUES (?, ?, ?, ?)"
      );
      try {
        for (const p of sampleProducts) {
          await insert.run(p.name, p.price, p.img || "", p.tag || "");
        }
      } finally {
        await insert.finalize();
      }
    }
  } catch {}
}

await initDb();

function checkAdmin(req) {
  const val = req.headers["x-admin"];
  if (!val) return false;
  if (Array.isArray(val)) return val.includes("true");
  return String(val) === "true";
}

// User APIs
app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await openDb();
  const user = await db.get(
    "SELECT id, name, email, is_admin FROM users WHERE email = ? AND password = ?",
    [email, password]
  );
  if (user) res.json(user);
  else res.status(401).send("Invalid email or password");
});

app.post("/users/register", async (req, res) => {
  const { name, email, password } = req.body;
  const db = await openDb();
  const result = await db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password]
  );
  res.json({ id: result.lastID, name, email, is_admin: 0 });
});

app.post("/users/logout", (_req, res) => {
  res.send("Logout successful");
});

// Product APIs
app.get("/products", async (_req, res) => {
  const db = await openDb();
  const products = await db.all("SELECT * FROM products ORDER BY id DESC");
  res.json(products);
});

app.post("/products", async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).send("Admin required");
  const { name, price, img, tag } = req.body;
  if (!name || !price) return res.status(400).send("name and price required");
  const db = await openDb();
  const result = await db.run(
    "INSERT INTO products (name, price, img, tag) VALUES (?, ?, ?, ?)",
    [name, price, img || "", tag || ""]
  );
  res.json({ id: result.lastID });
});

app.put("/products/:id", async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).send("Admin required");
  const { id } = req.params;
  const { name, price, img, tag } = req.body;
  const db = await openDb();
  await db.run(
    "UPDATE products SET name = ?, price = ?, img = ?, tag = ? WHERE id = ?",
    [name, price, img || "", tag || "", id]
  );
  res.send("Updated");
});

app.delete("/products/:id", async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).send("Admin required");
  const { id } = req.params;
  const db = await openDb();
  await db.run("DELETE FROM products WHERE id = ?", [id]);
  res.send("Deleted");
});

// Orders
app.post("/orders", async (req, res) => {
  const { email, items, total } = req.body;
  if (!email || !items || !Array.isArray(items)) {
    return res.status(400).send("email and items required");
  }
  try {
    const db = await openDb();
    const createdAt = new Date().toISOString();
    const itemsJson = JSON.stringify(items);
    const result = await db.run(
      "INSERT INTO orders (email, items, total, created_at) VALUES (?, ?, ?, ?)",
      [email, itemsJson, Number(total) || 0, createdAt]
    );
    res.json({ id: result.lastID, created_at: createdAt });
  } catch {
    res.status(500).send("Failed to save order");
  }
});

app.get("/orders", async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).send("Admin required");
  try {
    const db = await openDb();
    const rows = await db.all("SELECT * FROM orders ORDER BY id DESC");
    const parsed = rows.map((r) => {
      let items = [];
      try {
        items = JSON.parse(r.items);
      } catch {}
      return { ...r, items };
    });
    res.json(parsed);
  } catch {
    res.status(500).send("Failed to load orders");
  }
});

app.listen(4000, () => console.log("Server running on http://localhost:4000"));
