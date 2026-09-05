import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Sale } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  Package,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface PosPageProps {
  onNavigate: (path: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function PosPage({ onNavigate }: PosPageProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.products.list();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      showToast('error', `Stok ${product.name} sedang habis. Lakukan produksi terlebih dahulu.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          showToast('error', `Maksimal stok tersedia hanya ${product.current_stock} ${product.unit}.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.current_stock) {
              showToast('error', `Stok ${item.product.name} terbatas (${item.product.current_stock} ${item.product.unit}).`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  );
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmCheckout = async () => {
    setIsSubmitting(true);
    try {
      const payload = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const res = await api.sales.create(payload);
      if (res.success && res.data) {
        showToast('success', 'Transaksi kasir berhasil dicatat!');
        setCompletedSale(res.data);
        setIsConfirmOpen(false);
        setCart([]);
        fetchProducts(); // Refresh stocks from authoritative API
      } else {
        showToast('error', res.error?.message || 'Gagal memproses transaksi.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem saat checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kasir Penjualan (POS)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Pencatatan penjualan cepat dan pengurangan stok barang jadi secara otomatis.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/sales')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <Receipt className="w-4 h-4" />
          Lihat Riwayat Struk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Product catalog grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search bar */}
          <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
            <input
              id="pos-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk siap jual..."
              className="w-full bg-transparent text-xs font-semibold focus:outline-hidden"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-700">
                Reset
              </button>
            )}
          </div>

          {/* Product cards */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border-2 border-slate-900 rounded-xl p-8 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800 text-xs">Produk tidak ditemukan.</p>
              <button
                onClick={() => onNavigate('/inventory/products')}
                className="text-xs text-blue-600 font-bold underline"
              >
                Buka menu Stok Produk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((prod) => {
                const inStock = prod.current_stock > 0;
                return (
                  <button
                    key={prod.id}
                    id={`pos-add-${prod.id}`}
                    onClick={() => addToCart(prod)}
                    disabled={!inStock}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      inStock
                        ? 'bg-white border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:border-blue-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        : 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        {prod.unit}
                      </span>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Harga:</span>
                        <p className="font-extrabold font-mono text-blue-700 text-xs sm:text-sm">
                          {formatCurrency(prod.selling_price)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          inStock
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                            : 'bg-rose-100 text-rose-900 border-rose-700'
                        }`}
                      >
                        {inStock ? `${prod.current_stock} ${prod.unit}` : 'Habis'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right / Bottom: Cart & Summary panel */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 space-y-4 sticky top-24">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-700" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Keranjang Kasir
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-medium">
                  Keranjang masih kosong. Klik produk di sebelah kiri untuk menambah ke transaksi.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-600">
                        {formatCurrency(item.product.selling_price)} × {item.quantity} ={' '}
                        <strong className="text-slate-900">
                          {formatCurrency(item.product.selling_price * item.quantity)}
                        </strong>
                      </p>
                    </div>

                    {/* Steppers */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 bg-white hover:bg-slate-200 border border-slate-900 rounded text-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 bg-white hover:bg-slate-200 border border-slate-900 rounded text-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total and Checkout */}
            <div className="pt-3 border-t-2 border-slate-900 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Total Jumlah Barang:</span>
                <span className="font-mono font-bold text-slate-900">{totalItemCount} item</span>
              </div>

              <div className="flex justify-between items-center bg-blue-50 border-2 border-blue-900 rounded-lg p-3">
                <span className="font-bold text-xs text-blue-950 uppercase">Total Tagihan:</span>
                <span className="text-xl font-black font-mono text-blue-700">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <button
                id="pos-submit-btn"
                type="button"
                onClick={handleCheckoutClick}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Bayar & Cetak Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmCheckout}
        title="Konfirmasi Transaksi Penjualan"
        description="Transaksi akan dicatat dan memotong stok produk secara otomatis."
        isLoading={isSubmitting}
        confirmText="Konfirmasi Pembayaran"
        summaryItems={[
          { label: 'Total Item', value: `${totalItemCount} pcs` },
          { label: 'Total Pembayaran', value: formatCurrency(totalAmount), highlight: true },
        ]}
      />

      {/* Post-Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-2xl p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-900 mx-auto flex items-center justify-center text-emerald-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Transaksi Berhasil!</h3>
              <p className="text-xs text-slate-500 font-mono">No. #{completedSale.id}</p>
            </div>

            {/* Receipt Content */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="divide-y divide-slate-200">
                {(completedSale.items || []).map((item, i) => (
                  <div key={i} className="py-1.5 flex justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>TOTAL:</span>
                <span className="font-mono text-blue-700">{formatCurrency(completedSale.total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
