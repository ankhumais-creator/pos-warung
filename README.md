# 🚀 FastPOS - Offline-First POS System

[![Deploy with Vercel](https://vercel.com/button)](https://fastpos-beta.vercel.app)

**Modern Point of Sale system built for Indonesian warung & small businesses.** Works offline, syncs when online.

🔗 **Live Demo:** [https://fastpos-beta.vercel.app](https://fastpos-beta.vercel.app)

![FastPOS Screenshot](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=FastPOS+Screenshot)

---

## ✨ Features

### 💰 **Cash Management**
- Open/Close shift with cash accountability
- Track opening cash & expected closing cash
- Cash reconciliation with variance calculation
- Z-Report generation for daily summary

### 🛒 **Fast Checkout**
- Split-view UI optimized for tablets
- Quick product selection with category tabs
- Flexible modifier system (like Moka POS)
- Real-time cart calculation

### 🧾 **Receipt Printing**
- Thermal printer support (58mm/80mm)
- Custom CSS `@media print` styling
- Works with `window.print()` - no driver needed

### 📱 **Offline-First PWA**
- Works 100% offline using IndexedDB
- Dexie.js for robust local storage
- Append-only sync log for data integrity
- Auto-sync when back online

### ☁️ **Cloud Backup**
- Supabase integration for cloud storage
- Real-time sync across devices
- Row Level Security (RLS) for data protection

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **TypeScript** | Type Safety |
| **Tailwind CSS** | Styling |
| **Dexie.js** | IndexedDB Wrapper (Offline Storage) |
| **Zustand** | State Management |
| **Supabase** | Cloud Database & Auth |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/ankhumais-creator/pos-warung.git
cd pos-warung

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 💡 Get your Supabase credentials from [supabase.com](https://supabase.com)

### Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# The schema is in:
supabase-schema.sql
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CloseShiftModal.tsx
│   ├── OpenShiftModal.tsx
│   ├── PaymentModal.tsx
│   └── SuccessToast.tsx
├── lib/                 # Core utilities
│   ├── db.ts           # Dexie.js database setup
│   ├── store.ts        # Zustand state management
│   ├── supabase.ts     # Supabase client
│   ├── receipt.ts      # Receipt printing logic
│   ├── seed.ts         # Demo data seeding
│   └── syncWorker.ts   # Background sync logic
├── pages/              # Page components
│   └── Cashier.tsx     # Main POS interface
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

---

## 🎯 Usage

### Opening a Shift
1. Click "Buka Shift" button
2. Enter cashier name & opening cash amount
3. Start taking orders!

### Processing Orders
1. Select category from sidebar
2. Click product to add modifiers
3. Adjust quantity & add notes
4. Click "Tambah" to add to cart
5. Click "CHARGE" to process payment

### Closing a Shift
1. Click "Tutup Shift" button
2. Enter actual cash in drawer
3. System calculates variance
4. Print Z-Report for records

---

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use for your own projects!

---

## 👨‍💻 Author

Made with ❤️ for Indonesian small businesses.

**GitHub:** [@ankhumais-creator](https://github.com/ankhumais-creator)
