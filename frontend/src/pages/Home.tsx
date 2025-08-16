import { useEffect, useMemo, useState, useContext } from "react";
import type { JSX } from "react/jsx-runtime";
import { AuthContext } from "../App"; // added

type Product = {
  id: number;
  name: string;
  price: string;
  img?: string;
  tag?: string;
};

type CartItem = {
  id: number;
  name: string;
  price: string;
  img?: string;
  qty: number;
};

export default function Home(): JSX.Element {
  const { user } = useContext(AuthContext); // added
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>(""); // search query
  const API = "http://api.bestshop.fh";

  // Quick view / cart UI state
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Checkout UI state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // keep checkout email in sync with logged in user
  useEffect(() => {
    if (user?.email) setCheckoutEmail(user.email);
  }, [user]);

  // load products
  useEffect(() => {
    let mounted = true;
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        if (mounted) setProducts(data || []);
      } catch (err) {
        if (mounted) setError("Unable to load products. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // cart persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_v1");
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart_v1", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // quick ephemeral notice
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 1800);
    return () => clearTimeout(t);
  }, [notice]);

  // derived filtered list (case-insensitive, matches name, tag or price)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.tag || "").toLowerCase().includes(q) ||
        p.price.toLowerCase().includes(q)
      );
    });
  }, [products, query]);

  function openQuick(p: Product) {
    setQuickProduct(p);
  }

  function closeQuick() {
    setQuickProduct(null);
  }

  function addToCart(p: Product, qty = 1) {
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.id === p.id);
      let next: CartItem[] = [];
      if (idx >= 0) {
        next = prev.map((it, i) => (i === idx ? { ...it, qty: it.qty + qty } : it));
      } else {
        next = [...prev, { id: p.id, name: p.name, price: p.price, img: p.img, qty }];
      }
      return next;
    });
    setNotice(`${p.name} added to cart`);
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((it) => it.id !== id));
  }

  function changeQty(id: number, qty: number) {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)));
  }

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);
  const cartTotal = cart.reduce((s, it) => {
    // try to parse price numbers (strip non-digits)
    const num = Number(String(it.price).replace(/[^0-9.]/g, "")) || 0;
    return s + num * it.qty;
  }, 0);

  // Open checkout modal — require logged in user and use their email
  function openCheckout() {
    if (cart.length === 0) {
      setNotice("Cart is empty");
      return;
    }
    if (!user?.email) {
      setNotice("You must be logged in to checkout");
      setCheckoutError("Please sign in to continue");
      return;
    }
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setCheckoutEmail(user.email); // ensure using logged-in email
    setCheckoutOpen(true);
  }

  // perform checkout: POST order to backend then clear cart
  async function handleCheckout(e?: React.FormEvent) {
    e?.preventDefault();
    setCheckoutError(null);
    if (!user?.email) {
      setCheckoutError("You must be logged in to checkout");
      return;
    }
    setCheckoutLoading(true);
    try {
      const payload = {
        email: user.email,
        items: cart.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty })),
        total: cartTotal,
      };
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Checkout failed");
      }
      const data = await res.json();
      setCheckoutSuccess("Order recorded. Thank you!");
      setCart([]); // clear cart
      localStorage.removeItem("cart_v1");
      // small delay so user sees the success
      setTimeout(() => {
        setCheckoutOpen(false);
        setCheckoutEmail("");
      }, 900);
    } catch (err: any) {
      setCheckoutError(err?.message || "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-gray-100 text-slate-900">
      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">Shop • Curated</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight">
            Discover essentials that elevate everyday life
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              className="w-72 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Search products..."
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500 px-2 py-1 hover:text-slate-700"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setCartOpen((s) => !s)}
            className="relative bg-white border px-3 py-2 rounded-lg shadow hover:shadow-md"
            aria-label="Open cart"
          >
            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 7h14l-2-7M10 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Featured products */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <a href="#" className="text-indigo-600 hover:underline text-sm">View all</a>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="w-full h-44 bg-slate-200" />
                <div className="p-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="h-8 bg-slate-200 rounded w-24" />
                    <div className="h-10 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}

            {!loading && error && (
              <div className="col-span-full text-center text-red-600">{error}</div>
            )}

            {!loading && !error && filtered.map((p) => (
              <article key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col">
                <div className="relative">
                  <img src={p.img || `https://picsum.photos/seed/${p.id}/800/600`} alt={p.name} className="w-full h-44 object-cover" />
                  {p.tag && (
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs px-2 py-1 rounded">{p.tag}</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="mt-2 text-indigo-600 font-medium">{p.price}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => openQuick(p)} className="text-sm px-3 py-1 border rounded-md text-slate-700 hover:bg-slate-50">Quick view</button>
                    <button onClick={() => addToCart(p)} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700">Add to cart</button>
                  </div>
                </div>
              </article>
            ))}

            {!loading && !error && filtered.length === 0 && (
              <div className="col-span-full text-center text-slate-500">No products match your search.</div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="mt-12 bg-indigo-600 rounded-2xl text-white p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Join our newsletter</h3>
            <p className="mt-2 text-indigo-100">Get 10% off your first order and early access to new drops.</p>
          </div>
          <form className="flex gap-3 w-full sm:w-auto">
            <input aria-label="Email" type="email" placeholder="you@example.com" className="px-4 py-3 rounded-md text-slate-800 w-full sm:w-64" />
            <button className="bg-white text-indigo-600 font-semibold px-4 py-3 rounded-md">Subscribe</button>
          </form>
        </section>

        {/* Simple footer */}
        <footer className="mt-10 text-sm text-slate-500">
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between">
            <p>© {new Date().getFullYear()} Your Shop — All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Terms</a>
              <a href="#" className="hover:underline">Contact</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Quick view modal */}
      {quickProduct && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeQuick} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-64 md:h-auto bg-slate-100 flex items-center justify-center">
                <img src={quickProduct.img || `https://picsum.photos/seed/${quickProduct.id}/800/600`} alt={quickProduct.name} className="object-cover w-full h-full" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold">{quickProduct.name}</h3>
                  <button onClick={closeQuick} className="text-slate-500 hover:text-slate-700">✕</button>
                </div>
                <p className="mt-2 text-indigo-600 font-medium">{quickProduct.price}</p>
                {quickProduct.tag && <div className="mt-2 text-sm text-slate-500">{quickProduct.tag}</div>}
                <p className="mt-4 text-sm text-slate-600">This is a quick view. For full product details and reviews, visit the product page (not implemented in demo).</p>

                <div className="mt-6 flex items-center gap-3">
                  <button onClick={() => { addToCart(quickProduct); closeQuick(); }} className="bg-indigo-600 text-white px-4 py-2 rounded">Add to cart</button>
                  <button onClick={() => { closeQuick(); setCartOpen(true); }} className="px-3 py-2 border rounded">View cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full md:w-96 transform ${cartOpen ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <div className="h-full bg-white shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Your cart</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-500">{cartCount} items</div>
              <button onClick={() => setCartOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-auto">
            {cart.length === 0 && <div className="text-sm text-slate-500">Your cart is empty.</div>}
            <div className="space-y-4">
              {cart.map((it) => (
                <div key={it.id} className="flex gap-3 items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden">
                    {it.img ? <img src={it.img} alt={it.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-indigo-600">{it.price}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="number" value={it.qty} min={1} onChange={(e) => changeQty(it.id, Math.max(1, Number(e.target.value) || 1))} className="w-20 px-2 py-1 border rounded" />
                      <button onClick={() => removeFromCart(it.id)} className="text-sm text-red-600">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-600">Total</div>
              <div className="font-semibold">${cartTotal.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={openCheckout} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded">{cart.length ? "Checkout" : "Checkout"}</button>
              <button onClick={() => { setCart([]); setCartOpen(false); }} className="px-3 py-2 border rounded">Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCheckoutOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold">Checkout</h3>
            <p className="text-sm text-slate-600 mt-1">This order will be recorded under your account email.</p>

            <form onSubmit={handleCheckout} className="mt-4 space-y-3">
              {user?.email ? (
                <div>
                  <input
                    type="email"
                    value={checkoutEmail}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-slate-100"
                  />
                  <div className="text-xs text-slate-500 mt-1">Order will be recorded for this email</div>
                </div>
              ) : (
                <input
                  type="email"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              )}

              {checkoutError && <div className="text-sm text-red-600">{checkoutError}</div>}
              {checkoutSuccess && <div className="text-sm text-emerald-600">{checkoutSuccess}</div>}
              <div className="flex gap-2">
                <button type="submit" disabled={checkoutLoading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded">
                  {checkoutLoading ? "Processing..." : "Confirm purchase"}
                </button>
                <button type="button" onClick={() => setCheckoutOpen(false)} className="px-3 py-2 border rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice */}
      {notice && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 bg-slate-900 text-white px-4 py-2 rounded shadow">
          {notice}
        </div>
      )}
    </div>
  );
}
