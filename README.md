<div align="center">

# UsahaKita

**Micro ERP multi-tenant untuk UMKM grassroots**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Hono](https://img.shields.io/badge/Hono-4-FF6B35.svg)](https://hono.dev)

</div>

---

## Tentang Aplikasi

**UsahaKita** adalah aplikasi micro ERP (Enterprise Resource Planning) berbasis cloud yang dirancang khusus untuk Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia. Aplikasi ini menyediakan manajemen stok bahan baku, resep produksi (BoM), pencatatan produksi, kasir POS, serta analisis bisnis berbasis AI — semuanya dalam satu platform yang ringan dan mudah digunakan.

### Latar Belakang

UMKM di Indonesia masih banyak yang mencatat stok dan penjualan secara manual di buku tulis. Hal ini menyebabkan:
- Stok bahan baku tidak akurat sehingga produksi terhenti mendadak
- Tidak ada jejak auditable untuk setiap pergerakan barang
- Sulit mengetahui produk mana yang paling menguntungkan
- Tidak ada peringatan dini saat stok menipis

UsahaKita hadir untuk menjawab masalah tersebut dengan sistem digital yang bisa diakses dari browser, tanpa perlu instalasi aplikasi desktop.

### Target Pengguna

- Pemilik UMKM bidang makanan & minuman ( bakery, katering, kedai kopi )
- Home industry yang memiliki resep produksi (BoM)
- Usaha kecil yang ingin mulai mencatat stok secara digital

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Manajemen Bahan Baku** | Kelola daftar material, stok masuk/keluar, batas minimum stok, presisi unit (kg/pcs/liter) |
| **Manajemen Produk Jadi** | Katalog produk jadi dengan harga jual dan stok tersedia |
| **Resep & Komposisi (BoM)** | Buat resep produksi per produk — tentukan takaran bahan per batch standar dengan simulasi pecahan |
| **Sesi Produksi Terukur** | Wizard 5 langkah: pilih produk → kalkulasi BoM → penyesuaian aktual → hasil riil → konfirmasi. Stok bahan otomatis terpotong |
| **Kasir POS (Point of Sale)** | Tambah produk ke keranjang, proses transaksi, cetak struk — stok produk otomatis berkurang |
| **Riwayat Mutasi Stok** | Jejak lengkap setiap pergerakan stok (masuk/keluar) dengan filter dan pencarian |
| **Stok Opname** | Cocokkan stok fisik dengan stok sistem, selisih otomatis terhitung |
| **Dashboard Analitik** | Ringkasan penjualan, produksi, stok rendah, dan insight AI terbaru |
| **AI Insight** | Analisis bisnis otomatis menggunakan AI (GLM Zhipu API) — developer bisa ganti model via env vars |
| **Multi-Tenant** | Setiap usaha memiliki data terisolasi. Mendaftar = membuat usaha baru |
| **Autentikasi** | Sistem login dengan session cookie, password di-hash dengan PBKDF2 |

---

## Teknologi yang Digunakan

### Backend

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Cloudflare Workers** | - | Serverless runtime edge |
| **Hono** | ^4.13 | Lightweight web framework |
| **Durable Objects** | - | Stateful compute dengan SQLite embedded |
| **SQLite** (via DO) | - | Database per-tenant |
| **Web Crypto API** | - | PBKDF2 password hashing |

### Frontend

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **React** | ^19.2 | UI library |
| **Vite** | ^8.1 | Build tool & dev server |
| **Tailwind CSS** | ^4.3 | Utility-first CSS |
| **Lucide React** | ^1.41 | Icon library |

### AI & Tools

| Teknologi | Kegunaan |
|-----------|----------|
| **GLM Zhipu API** | AI insight generation with key rotation (configurable: `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEYS`) |
| **Playwright** | End-to-end testing |
| **Vitest** | Unit testing |
| **Swagger UI** | API documentation (tersedia di `/docs/swagger`) |

### Arsitektur

```
Browser (React SPA)
    │
    ▼
Cloudflare Workers (Hono)
    │
    ├── AuthDirectoryDO (SQLite) ─── users, tenants, sessions
    │
    └── TenantDO (SQLite) ─── materials, products, boms, productions,
                               sales, inventory_movements, stock_opnames,
                               ai_insights
    │
    ▼
GLM Zhipu API (optional, with key rotation)
```

---

## Cara Instalasi

### Prasyarat

- **Node.js** ≥ 18
- **pnpm** ≥ 8 (recommended) atau npm
- **Git**
- Akun **Cloudflare** (untuk deploy ke Workers)

### Clone & Install

```bash
# Clone repository
git clone https://github.com/username/UsahaKita.git
cd UsahaKita

# Install dependencies
pnpm install
```

### Konfigurasi Environment

Buat file `.dev.vars` di root project (untuk local development):

```env
# AI Provider (GLM Zhipu — default)
AI_BASE_URL=https://api.z.ai
AI_MODEL=glm-4.7-flash
AI_API_KEYS=key1,key2,key3,key4

# Untuk pakai OpenAI sebagai alternatif:
# AI_BASE_URL=https://api.openai.com
# AI_MODEL=gpt-4o-mini
# AI_API_KEYS=sk-your-openai-key-here
```

### Seed Data (Otomas)

Seed data akan otomatis di-insert saat pertama kali menjalankan dev server. Data seed meliputi:
- 1 user: `owner@tokomaju.com` / `password123`
- 1 tenant: "Toko Maju"
- 5 bahan baku (tepung, telur, gula, minyak, coklat)
- 2 produk jadi (Donat Coklat, Roti Manis Keju)
- 1 resep BoM (Resep Donat Coklat)
- 1 catatan produksi
- 1 transaksi penjualan

---

## Cara Penggunaan

### Development Server

```bash
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

### Build & Deploy

```bash
# Build untuk production
pnpm build

# Deploy ke Cloudflare Workers
pnpm deploy
```

### Testing

```bash
# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright) — local mode
E2E_LOCAL=true pnpm test:e2e

# E2E tests — headed mode (lihat browser)
E2E_LOCAL=true pnpm test:e2e:headed
```

### Generate API Docs

```bash
# Build OpenAPI spec (otomatis saat deploy)
node scripts/build-docs.cjs
```

Swagger UI tersedia di: `http://localhost:5173/docs/swagger`

---

## Screenshot Dokumentasi

### Autentikasi

| Login Page | Register Page |
|:---------:|:------------:|
| ![Login](docs/screenshots/01-login-page.png) | ![Register](docs/screenshots/02-register-page.png) |

### Dashboard

| Dashboard Utama | Metrik Penjualan |
|:--------------:|:---------------:|
| ![Dashboard](docs/screenshots/03-dashboard.png) | ![Metrics](docs/screenshots/04-dashboard-metrics.png) |

### Manajemen Bahan Baku

| Daftar Material | Tambah Material | Stok Masuk |
|:--------------:|:--------------:|:----------:|
| ![Materials](docs/screenshots/05-materials-list.png) | ![Add Material](docs/screenshots/06-materials-add-modal.png) | ![Stock IN](docs/screenshots/07-materials-stock-in-modal.png) |

### Manajemen Produk

| Daftar Produk | Tambah Produk | Produk Keluar |
|:------------:|:------------:|:------------:|
| ![Products](docs/screenshots/08-products-list.png) | ![Add Product](docs/screenshots/09-products-add-modal.png) | ![Outgoing](docs/screenshots/10-products-outgoing-modal.png) |

### Riwayat Mutasi Stok

| Daftar Mutasi | Filter Material |
|:-------------:|:--------------:|
| ![Movements](docs/screenshots/11-movements-list.png) | ![Filter](docs/screenshots/12-movements-filter-material.png) |

### Stok Opname

| Halaman Opname | Pilih Material |
|:--------------:|:-------------:|
| ![Opname](docs/screenshots/13-stock-opname-page.png) | ![Selected](docs/screenshots/14-stock-opname-material-selected.png) |

### Resep & Komposisi (BoM)

| Daftar BoM | Editor BoM |
|:----------:|:----------:|
| ![BoM List](docs/screenshots/15-bom-list.png) | ![BoM Editor](docs/screenshots/16-bom-editor-new.png) |

### Sesi Produksi (5 Langkah)

| Langkah 1: Pilih Produk | Langkah 2: Kalkulasi BoM |
|:----------------------:|:-----------------------:|
| ![Step 1](docs/screenshots/19-production-step1.png) | ![Step 2](docs/screenshots/20-production-step2.png) |

| Langkah 3: Penyesuaian | Langkah 4: Output Riil |
|:---------------------:|:---------------------:|
| ![Step 3](docs/screenshots/21-production-step3.png) | ![Step 4](docs/screenshots/22-production-step4.png) |

### Kasir POS

| Halaman POS | Keranjang | Checkout | Struk |
|:----------:|:--------:|:--------:|:-----:|
| ![POS](docs/screenshots/23-pos-page.png) | ![Cart](docs/screenshots/24-pos-cart-with-item.png) | ![Checkout](docs/screenshots/25-pos-checkout-modal.png) | ![Receipt](docs/screenshots/26-pos-receipt.png) |

### Riwayat Penjualan & Insight

| Riwayat Penjualan | AI Insight |
|:-----------------:|:----------:|
| ![Sales](docs/screenshots/27-sales-history.png) | ![Insights](docs/screenshots/28-insights-page.png) |

### Pengaturan

| Pengaturan | Identitas Usaha |
|:---------:|:--------------:|
| ![Settings](docs/screenshots/29-settings-page.png) | ![Business](docs/screenshots/30-settings-business.png) |

---

## Alur Proses (Flow)

### 1. Alur Autentikasi

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Buka App   │────▶│  Login Page  │────▶│  Dashboard       │
│  /#/login   │     │  email+pass  │     │  /#/dashboard    │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
                    ┌──────▼───────┐
                    │  Register    │
                    │  Buat Usaha  │
                    │  Baru        │
                    └──────────────┘
```

**Detail:**
1. User membuka `/#/login`
2. Memasukkan email & password, lalu submit
3. Backend memverifikasi password dengan PBKDF2
4. Session cookie dibuat (7 hari expiry)
5. Redirect ke `/#/dashboard`

### 2. Alur Manajemen Stok Bahan Baku

```
┌──────────────────┐
│  Materials Page  │
└────────┬─────────┘
         │
    ┌────▼────┐   ┌────────────┐   ┌──────────────┐
    │ + Material│   │ + Masuk    │   │ - Keluar     │
    │ (Tambah)  │   │ (Beli)     │   │ (Susut/Afkir)│
    └────┬─────┘   └─────┬──────┘   └──────┬───────┘
         │               │                  │
         ▼               ▼                  ▼
    ┌─────────┐    ┌───────────┐     ┌───────────┐
    │ INSERT   │    │ INSERT    │     │ INSERT    │
    │ materials│    │ movements │     │ movements │
    │          │    │ type=IN   │     │ type=OUT  │
    └─────────┘    │ stock+qty │     │ stock-qty │
                   └───────────┘     └───────────┘
```

**Detail:**
1. **Tambah Material**: Isi nama, unit (kg/pcs/liter), presisi desimal, stok awal, batas minimum
2. **Stok Masuk (IN)**: Pilih material → masukkan jumlah & alasan → konfirmasi → `current_stock` bertambah
3. **Stok Keluar (OUT)**: Pilih material → masukkan jumlah & alasan → konfirmasi → `current_stock` berkurang
4. Setiap perubahan tercatat di `inventory_movements` sebagai jejak audit

### 3. Alur Produksi (5 Langkah)

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Langkah 1 │───▶│  Langkah 2 │───▶│  Langkah 3 │───▶│  Langkah 4 │───▶│  Langkah 5 │
│  Pilih     │    │  Kalkulasi │    │  Penyesuaian│    │  Output    │    │  Konfirmasi│
│  Produk &  │    │  BoM       │    │  Aktual     │    │  Riil      │    │  & Simpan  │
│  Target Qty│    │  (Preview) │    │  Bahan      │    │            │    │            │
└────────────┘    └────────────┘    └────────────┘    └────────────┘    └────────────┘
       │                │                 │                 │                 │
       ▼                ▼                 ▼                 ▼                 ▼
  Pilih produk    Hitung bahan     Sesuaikan jumlah   Input hasil      Potong stok
  dari dropdown   per batch ×      aktual tiap bahan  aktual produksi  bahan, tambah
  + target qty    multiplier       (opsional)         + catatan         stok produk
```

**Detail:**
1. **Langkah 1 — Pilih Produk & Target**: Pilih produk dari dropdown, masukkan target kuantitas produksi
2. **Langkah 2 — Kalkulasi BoM**: Sistem mengambil resep (BoM) untuk produk tersebut, menghitung kebutuhan bahan berdasarkan multiplier (`target_qty / bom_output`), mengecek ketersediaan stok
3. **Langkah 3 — Penyesuaian Aktual**: User bisa menyesuaikan jumlah aktual tiap bahan (misal: telur dibulatan 3.5 → 4 butir). Jika aktual melebihi stok, tombol "Lanjut" disabled
4. **Langkah 4 — Output Riil**: Masukkan jumlah hasil produksi aktual + catatan sesi
5. **Langkah 5 — Konfirmasi**: Tampilkan ringkasan, lalu commit. Stok bahan baku terpotong, stok produk bertambah

### 4. Alur Kasir POS

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  POS Page    │───▶│  Add to Cart │───▶│  Checkout    │───▶│  Struk       │
│  ( Produk    │    │  ( Klik      │    │  ( Konfirmasi│    │  ( Transaksi │
│    Cards )   │    │    kartu )   │    │    Bayar )   │    │    Berhasil )│
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                  │                    │                    │
       ▼                  ▼                    ▼                    ▼
  Tampilkan          Tambah item         INSERT sale +        Stok produk
  produk stok        ke keranjang        sale_items,          berkurang
  tersedia           + hitung total      kurangi stok         otomatis
```

**Detail:**
1. **POS Page**: Menampilkan semua produk dalam bentuk kartu, beserta stok tersedia dan harga
2. **Add to Cart**: Klik kartu produk → masuk ke keranjang. Harga × jumlah = subtotal
3. **Checkout**: Klik "Bayar" → muncul modal konfirmasi → klik "Konfirmasi"
4. **Struk**: Transaksi berhasil, stok produk berkurang otomatis, tampilkan struk dengan detail item
5. **Transaksi Baru**: Kembali ke POS kosong untuk transaksi berikutnya

### 5. Alur Stok Opname

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Pilih       │───▶│  Pilih Item  │───▶│  Input Stok  │───▶│  Konfirmasi  │
│  Kategori    │    │  (Material / │    │  Aktual      │    │  Selisih     │
│  (Bahan/Prod)│    │   Produk)    │    │  (Fisik)     │    │  Disimpan    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**Detail:**
1. Pilih kategori: Bahan Baku atau Produk Jadi
2. Pilih item dari dropdown
3. Sistem menampilkan stok sistem vs input stok aktual
4. Selisih dihitung otomatis (`actual - system`)
5. Konfirmasi → stok sistem disesuaikan, catatan opname tersimpan

### 6. Alur BoM (Resep & Komposisi)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  BoM List    │───▶│  BoM Editor  │───▶│  Simpan      │
│  ( Daftar    │    │  ( Buat/Edit │    │  ( Resep     │
│    Resep )   │    │    Resep )   │    │    Tersimpan )│
└──────────────┘    └──────────────┘    └──────────────┘
```

**Detail:**
1. **BoM List**: Menampilkan semua resep yang sudah dibuat
2. **BoM Editor**: Pilih produk → isi nama resep → tentukan jumlah output per batch → tambahkan baris bahan baku dengan takaran
3. **Simpan**: Resep tersimpan dan bisa digunakan di sesi produksi

### 7. Alur AI Insight

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Klik        │───▶│  Backend     │───▶│  Tampilkan   │
│  "Generate   │    │  Kumpulkan   │    │  Insight AI  │
│  Insight AI" │    │  Data Bisnis │    │  (3 kartu)   │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  Kirim ke    │
                    │  GLM API     │
                    │  (key rotate)│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Parse JSON  │
                    │  Response    │
                    └──────────────┘
```

**Detail:**
1. User klik "Generate Insight AI"
2. Backend mengumpulkan: metrics penjualan, top produk, variance produksi, data stok rendah
3. Data dikirim ke GLM API dengan **key rotation** — coba setiap key sampai 2xx
4. AI menghasilkan max 3 insight dalam format JSON (judul & body dalam Bahasa Indonesia)
5. Jika semua key gagal → return 502 error, tidak ada insight tersimpan
6. Insight disimpan di `ai_insights` table dan ditampilkan sebagai kartu berwarna

---

## Struktur Database

### AuthDirectoryDO (Global)

```
users            ── users, tenants, sessions
tenants          ── data usaha/tenant
tenant_members   ── relasi user ↔ tenant
sessions         ── session cookie
```

### TenantDO (Per-Tenant)

```
materials            ── bahan baku
products             ── produk jadi
inventory_movements  ── jejak semua pergerakan stok
boms                 ── resep & komposisi
bom_materials        ── detail bahan per resep
productions          ── catatan sesi produksi
production_materials ── detail bahan yang terpakai
stock_opnames        ── catatan stok opname
sales                ── transaksi penjualan
sale_items           ── detail item per transaksi
ai_insights          ── hasil analisis AI
```

---

## API Endpoints

Base URL: `/api/v1`

### Autentikasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/auth/register` | Daftar akun + usaha baru |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/me` | Profil user aktif |
| `POST` | `/auth/logout` | Logout |
| `POST` | `/auth/seed` | Seed data demo |

### Business

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/business/` | Detail usaha |
| `PATCH` | `/business/` | Update nama/deskripsi usaha |

### Materials

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/materials/` | Daftar material (search, pagination) |
| `POST` | `/materials/` | Tambah material baru |
| `POST` | `/materials/:id/movements` | Catat stok masuk/keluar |
| `GET` | `/materials/:id/movements` | Riwayat mutasi material |

### Products

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/products/` | Daftar produk (search, pagination) |
| `POST` | `/products/` | Tambah produk baru |
| `PATCH` | `/products/:id` | Edit produk (nama, harga, stok min) |
| `DELETE` | `/products/:id` | Sembunyikan produk (soft delete) |
| `POST` | `/products/:id/outgoing` | Catat produk keluar (afkir/rusak) |
| `GET` | `/products/:id/movements` | Riwayat mutasi produk |

### BOMs

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/boms/` | Daftar resep |
| `POST` | `/boms/` | Buat resep baru |
| `GET` | `/boms/:id` | Detail resep |
| `PATCH` | `/boms/:id` | Update resep |

### Productions

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/productions/preview` | Preview kalkulasi BoM + cek stok |
| `POST` | `/productions/` | Commit produksi |
| `GET` | `/productions/` | Daftar sesi produksi |
| `GET` | `/productions/:id` | Detail produksi |

### Sales

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/sales/` | Catat transaksi penjualan |
| `GET` | `/sales/` | Riwayat penjualan (filter tanggal) |

### Stock Opname

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/stock-opnames/` | Catat stok opname |
| `GET` | `/stock-opnames/` | Riwayat opname |

### Dashboard & Insights

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/dashboard/summary` | Ringkasan dashboard |
| `GET` | `/insights/` | Daftar insight AI |
| `POST` | `/insights/generate` | Generate insight baru via AI |

### API Docs

| Endpoint | Deskripsi |
|----------|-----------|
| `/docs/swagger` | Swagger UI |
| `/docs/openapi.json` | OpenAPI spec (JSON) |

### Dev (No Auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/dev/chat` | Test AI provider connectivity |
| `GET` | `/dev/chat/keys` | List masked API keys |
| `POST` | `/dev/reset-data` | Reset tenant data (demo account only) |

---

## Konfigurasi AI Provider

Insight AI menggunakan provider yang bisa dikonfigurasi via environment variables. Mendukung **key rotation** — coba setiap API key sampai dapat 2xx.

| Env Var | Default | Deskripsi |
|---------|---------|-----------|
| `AI_BASE_URL` | `https://api.z.ai` | Base URL API provider |
| `AI_MODEL` | `glm-4.7-flash` | Model identifier |
| `AI_API_KEYS` | (4 GLM keys) | Comma-separated API keys |

### Contoh: Switch ke OpenAI

```env
AI_BASE_URL=https://api.openai.com
AI_MODEL=gpt-4o-mini
AI_API_KEYS=sk-your-key-here
```

### Contoh: Custom Provider

```env
AI_BASE_URL=https://your-ai-provider.com/v1
AI_MODEL=your-model-name
AI_API_KEYS=your-api-key-1,your-api-key-2
```

---

## Testing

### Unit Tests (Vitest)

```bash
pnpm test
```

95 unit tests mencakup:
- Auth routes (register, login, me, logout, seed)
- Materials CRUD + movements
- Products CRUD + outgoing
- BOMs CRUD
- Productions preview + commit
- Sales + stock opname
- Dashboard summary
- Insights generate + list
- Seed data integrity
- Utility functions

### E2E Tests (Playwright)

```bash
# Local mode
E2E_LOCAL=true pnpm test:e2e

# Headed mode (lihat browser)
E2E_LOCAL=true pnpm test:e2e:headed
```

13 spec files:
- `auth.spec.ts` — login, register, logout
- `business.spec.ts` — profil usaha
- `dashboard.spec.ts` — metric cards, insight widget
- `header.spec.ts` — navigasi header
- `insights.spec.ts` — halaman AI insight
- `materials.spec.ts` — CRUD material
- `movements.spec.ts` — riwayat mutasi
- `navigation.spec.ts` — navigasi tab
- `pos.spec.ts` — kasir POS
- `products.spec.ts` — CRUD produk
- `settings.spec.ts` — pengaturan
- `stockOpname.spec.ts` — stok opname

### Demo Script

```bash
# Jalankan demo interaktif (screenshots)
npx tsx scripts/demo.ts

# Mode deployed
npx tsx scripts/demo.ts --deployed
```

Demo akan mengambil 35 screenshots yang menunjukkan setiap fitur aplikasi.

---

## Project Structure

```
UsahaKita/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── __tests__/          # Unit tests (Vitest)
│   │       ├── durable-objects/    # Durable Object classes
│   │       │   ├── auth-directory.ts
│   │       │   └── tenant.ts
│   │       ├── lib/                # Utilities
│   │       │   ├── ai.ts           # AI client with key rotation
│   │       │   ├── crypto.ts       # PBKDF2 hashing
│   │       │   ├── id.ts           # ID generator
│   │       │   ├── response.ts     # API response helpers
│   │       │   └── seed.ts         # Seed data SQL
│   │       ├── middleware/          # Hono middleware
│   │       │   ├── auth.ts         # Session validation
│   │       │   └── tenant.ts       # Tenant DO resolution
│   │       ├── routes/             # API route handlers
│   │       │   ├── auth.ts
│   │       │   ├── business.ts
│   │       │   ├── materials.ts
│   │       │   ├── products.ts
│   │       │   ├── boms.ts
│   │       │   ├── productions.ts
│   │       │   ├── sales.ts
│   │       │   ├── stock-opname.ts
│   │       │   ├── dashboard.ts
│       │       │   ├── insights.ts
│       │       │   ├── dev.ts
│       │       │   └── docs.ts
│   │       ├── types.ts            # TypeScript interfaces
│   │       └── index.tsx           # App entry point
│   └── web/
│       └── client/
│           └── src/
│               ├── components/     # Reusable UI components
│               ├── context/        # React contexts (Auth, Toast)
│               ├── pages/          # Page components
│               ├── services/       # API client
│               ├── types/          # TypeScript types
│               └── utils/          # Formatters, helpers
├── docs/                           # Documentation
│   ├── glm-request.sh             # GLM API example
│   ├── opencode-zen.js            # OpenCode API example
│   └── readme-content.json        # README structure guide
├── e2e/                            # Playwright E2E tests
├── scripts/                        # Build & demo scripts
├── test-results/                   # Test artifacts & screenshots
├── wrangler.jsonc                  # Cloudflare Workers config
├── playwright.config.ts
├── vitest.config.ts
└── package.json
```

---

## License

MIT
