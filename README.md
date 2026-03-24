# GenuineOS — Smart Construction & Finance Ecosystem

GenuineOS is a high-performance, glassmorphism-designed PWA (Progressive Web App) built specifically for modern project managers and construction entrepreneurs. It unifies financial tracking, site management, and labour payroll into a single, real-time interface driven entirely by a **Single Source of Truth Telegram Sync Architecture**.

## 🚀 Core Modules & Architecture

### 1. Telegram Sync Engine (Idempotent Ledger)
- **Single Source of Truth**: Connected dynamically to a Telegram Expense Bot's Google Sheet, fully eliminating manual double-entry.
- **Idempotent Syncing**: Maps exact transaction rows using unique hash keys (`sourceRowKey`) so data can be appended safely without ever duplicating.
- **Auto-Reference Generation**: Automatically detects and creates missing `Sites`, `Parties`, and `Labour` entries during sync, keeping records completely flawless without manual input.

### 2. Smart Finance & Ledgers
- **Dynamic Parties Ledger**: Automatically calculates real-time "Given" vs "Received" balances for all Vendors and Clients instantly derived from raw transactions.
- **Dynamic Site Pricing**: Site budgets, received incomes, and precise overhead investment costs are extrapolated entirely from the raw data.
- **Recharts Analytics**: Interactive dashboards for P&L tracking, expense breakdowns, and 6-month historical trajectory overlays.

### 3. Labour & Payroll Management (Dual-Mode)
- **Fluid Work Logic**: Supports both **Monthly Basis** (fixed salary pro-rating) and **Contract Basis** (per-job/daily) workers.
- **Derived Real-Time Balances**: Instead of relying on static balances, the system strictly calculates pending dues using `(Total Accrued Work) - (Total Sync Payments)`, making financial disputes impossible.
- **One-Tap Attendance**: Seamless daily presence marking or contract cost incrementing seamlessly hooked into the ledger logic.

### 4. Daily Operational Command
- **Command Center Dashboard**: Live KPIs tracking critical receivables, active operational sites, pending high-priority tasks, and combined partner balances.
- **Task & Habit Tracker**: Integrated productivity tools to manage site deadlines and personal maintenance streaks.
- **Astro Insights**: Proprietary integration with planetary/business windows for optimal day-to-day decision-making mapping.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Premium Glassmorphism Aesthetics)
- **Database/Auth**: Firebase Firestore & Firebase Auth
- **AI Engine**: Google Gemini API
- **Visualization**: Recharts & Lucide Icons
- **PWA**: Fully installable native app-like experience on iOS, Android, and Windows.

## ⚙️ Getting Started

### Prerequisites
- Node.js >= 18
- Firebase Project (Firestore enabled)
- Google Cloud API Key (with Sheets API access configured to your Telegram Expense Bot sheet)

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
2. **Google Sheets Sync**: 
   - Open the **Settings** menu in the app window.
   - Enter your **Google Sheet ID** and **API Key**.
   - Review and set your exact Map names for the Telegram Bot `Main`, `Expenses`, `Payments`, `Labour`, `Sites`, and `Parties` tabs to commence instant sync operations.

## 🛡️ Security & Privacy
- **Owner-Only Guard**: Strict Firestore propagation rules ensure users can only ever read and write data explicitly owned by their authenticated UID.
- **Local Vaulting**: Sensitive Google Workspace and Gemini keys are vaulted securely within the browser's persistent `localStorage`.

---
© 2026 Genuine Hospi Enterprises. All Rights Reserved.
