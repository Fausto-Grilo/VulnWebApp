import React, { useEffect, useState } from "react";
import type { JSX } from "react/jsx-runtime";

type Product = {
  id?: number;
  name: string;
  price: string;
  img?: string;
  tag?: string;
};

type OrderItem = {
  id?: number;
  name: string;
  price?: string;
  qty?: number;
};

type Order = {
  id: number;
  email: string;
  items: OrderItem[];
  total: number;
  created_at?: string;
};

export default function Dashboard(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState<Product>({ name: "", price: "", img: "", tag: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const API = "http://api.bestshop.fh";

  useEffect(() => {
    // initial load
    fetchProducts();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/orders`, { headers: { "x-admin": "true" } });
      if (!res.ok) {
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(data || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function saveProduct(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.name || !form.price) return;
    const opts = {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "x-admin": "true" },
      body: JSON.stringify(form),
    };
    const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
    setLoading(true);
    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        // optional: read error
      } else {
        setForm({ name: "", price: "", img: "", tag: "" });
        setEditingId(null);
        await fetchProducts();
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function editProduct(p: Product) {
    setEditingId(p.id ?? null);
    setForm({ name: p.name, price: p.price, img: p.img || "", tag: p.tag || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id?: number) {
    if (!id) return;
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    try {
      await fetch(`${API}/products/${id}`, { method: "DELETE", headers: { "x-admin": "true" } });
      await fetchProducts();
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Manage products and view orders.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setForm({ name: "", price: "", img: "", tag: "" }); setEditingId(null); }} className="px-3 py-2 rounded border">New</button>
            <button onClick={() => fetchOrders()} className="px-3 py-2 rounded border">Refresh orders</button>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">{editingId ? "Edit product" : "Create product"}</h2>
          <form onSubmit={(e) => saveProduct(e)} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Price</label>
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Tag</label>
              <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="md:col-span-4">
              <label className="text-sm text-slate-600">Image URL</label>
              <input value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="md:col-span-4 flex gap-3 mt-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{loading ? "Saving..." : editingId ? "Update product" : "Add product"}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: "", price: "", img: "", tag: "" }); }} className="px-3 py-2 border rounded">Cancel</button>}
            </div>
          </form>
        </section>

        {/* Orders section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Orders</h2>
          <div className="bg-white rounded-xl shadow p-4">
            {ordersLoading && <div className="text-sm text-slate-500">Loading orders...</div>}
            {!ordersLoading && orders.length === 0 && <div className="text-sm text-slate-500">No orders recorded.</div>}
            {!ordersLoading && orders.map((o) => (
              <div key={o.id} className="border-b last:border-b-0 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{o.id} — {o.email}</div>
                    <div className="text-xs text-slate-500">{o.created_at}</div>
                  </div>
                  <div className="text-sm font-semibold">${Number(o.total || 0).toFixed(2)}</div>
                </div>

                <div className="mt-2">
                  <ul className="text-sm space-y-1">
                    {Array.isArray(o.items) && o.items.length > 0 ? o.items.map((it, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <div className="text-sm">{it.qty ?? 1}× {it.name}</div>
                        <div className="text-sm text-slate-500">{it.price ?? ""}</div>
                      </li>
                    )) : <li className="text-sm text-slate-500">No items recorded</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <div className="col-span-full text-center text-sm text-slate-500">Loading...</div>}
          {!loading && products.length === 0 && <div className="col-span-full text-sm text-slate-500">No products yet.</div>}
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className="h-40 w-full bg-slate-100 rounded overflow-hidden mb-3 flex items-center justify-center">
                {p.img ? <img src={p.img} alt={p.name} className="object-cover h-full w-full" /> : <div className="text-slate-400">No image</div>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-indigo-600 font-medium">{p.price}</p>
                {p.tag && <div className="text-xs mt-1 text-slate-500">{p.tag}</div>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => editProduct(p)} className="flex-1 px-3 py-2 border rounded">Edit</button>
                <button onClick={() => deleteProduct(p.id)} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}