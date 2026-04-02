# Project Overview: GenuineOS

This document provides a comprehensive overview of the GenuineOS construction management application, including its structure, core functionalities, and data integration mechanisms.

## 1. Tech Stack
- **Frontend:** React 18+, Vite, TypeScript, Tailwind CSS, Motion (for animations).
- **Backend/Database:** Firebase (Firestore, Firebase Admin SDK).
- **AI Integration:** Google Gemini API (for data parsing and analysis).
- **Data Integration:** Google Sheets API (read-only automated sync).

## 2. Project Structure
- `/src/`: Source code directory.
  - `/components/`: Reusable UI components.
    - `/layout/`: App shell components (Sidebar, BottomNav, Header, Auth).
    - `/modals/`: CRUD modals (Add/Edit Sites, Expenses, etc.).
    - `/ui/`: Generic UI components (PageHeader, ConfirmModal).
  - `/hooks/`: Custom React hooks (e.g., `useFirestore` for CRUD).
  - `/lib/`: Utility functions and service integrations (`firebase.ts`, `gemini.ts`, `sync.ts`, `utils.ts`).
  - `/pages/`: Main application pages (Dashboard, Sites, Expenses, Payments, etc.).
  - `/types/`: TypeScript interfaces and types.
- `/server.ts`: Custom Express server handling API routes and background tasks.

## 3. Core Features & Modules
- **Dashboard:** Real-time KPIs (Receivables, Income, P&L, Active Sites, Pending Tasks, Balance).
- **Sites:** Manage project locations, progress tracking, and client assignments.
- **Expenses & Payments:** Financial tracking for business and site-specific costs.
- **Tasks & Diary:** Project management and daily logging.
- **AI Assistant:** Integrated AI capabilities for data analysis and insights.
- **Settings:** Configuration for Google Sheets integration (Sheet ID, API Key).

## 4. Working Functions & CRUD
- **CRUD Operations:** All major modules (Sites, Expenses, Payments, etc.) support Create, Read, Update, and Delete operations via Firestore.
- **Real-time Sync:** The application uses `onSnapshot` listeners to ensure all UI components (cards, tables, dashboards) update automatically when data changes in Firestore.
- **Client Management:** Sites are linked to clients, and client selection is managed via dropdowns in Add/Edit modals.

## 5. Data Integration (Google Sheets Sync)
- **Mechanism:** A background task in `server.ts` runs periodically (every hour).
- **Process:**
  1.  Fetches raw data from the configured Google Sheet using `googleapis`.
  2.  Sends raw data to Gemini to parse and structure it into JSON.
  3.  Updates Firestore idempotently (using `externalId` to prevent duplicates).
- **Authentication:** Uses Google Service Account/OAuth2 via `google-auth-library` for secure access.

## 6. How to Manage
- **Configuration:** Add `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_API_KEY` in the application Settings.
- **Data Consistency:** Ensure Google Sheet data includes a unique `externalId` field to enable proper auto-syncing without duplicates.
