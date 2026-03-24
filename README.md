# GenuineOS — Smart Construction & Finance Ecosystem

GenuineOS is a high-performance, glassmorphism-designed PWA (Progressive Web App) built for modern project managers and construction entrepreneurs. It unifies financial tracking, site management, and labour payroll into a single, real-time interface synchronized with Google Sheets.

## 🚀 Core Modules

### 1. Dynamic Dashboard
- **AI Daily Brief**: Automated summaries of critical receivables, site progress, and pending tasks.
- **Financial Visuals**: Interactive trends (Income vs Expenses) using Recharts.
- **Urgent Alerts**: Integration with astronomical/business windows for optimal decision-making.

### 2. Smart Finance (Sync-First)
- **Google Sheets Integration**: bi-directional sync with dedicated tabs for Payments & Expenses.
- **Incremental Sync**: Only fetches new rows to minimize API usage and maximize speed.
- **Alias Mapping**: Auto-resolve site name mismatches (e.g., "Ludhiana-1" → "Ludhiana") using custom alias rules.

### 3. Labour & Payroll Management
- **Dual-Mode Payroll**: Support for both **Monthly Basis** (fixed salary) and **Contract Basis** (per-job/daily) workers.
- **One-Tap Attendance**: Pro-rated wage calculation integrated directly into the balance sheet.
- **Digital Ledger**: Track pending balances and payout history for every worker.

### 4. Site & Progress Tracking
- **Multi-Site Management**: Track status, progress percentage, and financial health per site.
- **Task & Habit Tracker**: Integrated productivity tools to manage site deadlines and personal maintenance.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Premium Glassmorphism Design)
- **Database/Auth**: Firebase Firestore & Firebase Auth
- **AI Engine**: Google Gemini API
- **Visualization**: Recharts & Lucide Icons
- **PWA**: Fully installable on iOS and Android

## ⚙️ Getting Started

### Prerequisites
- Node.js >= 18
- Firebase Project (Firestore enabled)
- Google Cloud API Key (with Sheets API access)

### Installation
```bash
# Clone the repository
git clone https://github.com/rohitsdev4/GenuinehOSapp.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration
1. **Firebase**: Add your config to `src/lib/firebase.ts`.
2. **Google Sheets**: 
   - Go to **Settings** in the app.
   - Enter your **Google Sheet ID** and **API Key**.
   - (Optional) Configure dedicated tab names for Expenses, Payments, and Labour.

## 🛡️ Security & Privacy
- **Owner-Only Access**: Firestore rules ensure users can only access data associated with their UID.
- **Local Storage**: Sensitive API keys (Gemini/Sheets) are stored securely in your browser's `localStorage`, not on the server.

---
© 2026 Genuine Hospi Enterprises. All Rights Reserved.
