/** ─────────────────────────────────────────────────────────────────────────
 *  sync.ts  –  Google Sheets fetcher with multi-sheet + incremental support
 * ─────────────────────────────────────────────────────────────────────────*/

const LS_LAST_ROW_KEY = 'sync_last_row'; // stores row number of last processed row

// ── Internal fetchers ────────────────────────────────────────────────────────

const fetchViaProxy = async (sheetId: string, apiKey: string, range: string) => {
  const query = new URLSearchParams({ sheetId, apiKey, range });
  const response = await fetch(`/api/fetch-sheets?${query.toString()}`);
  return response.json();
};

const fetchDirect = async (sheetId: string, apiKey: string, range: string) => {
  const encodedRange = encodeURIComponent(range);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?key=${apiKey}`
  );
  const result = await response.json();
  return {
    success: response.ok,
    data: result.values ?? [],
    error: result?.error?.message,
  };
};

// ── Public: fetch a sheet range ───────────────────────────────────────────────
/**
 * Fetch rows from a specific sheet tab and range.
 * Falls back from proxy → direct API.
 */
export const fetchFromSheet = async (range = 'Main!A1:J1000') => {
  const sheetId = localStorage.getItem('google_sheet_id');
  const apiKey = localStorage.getItem('google_sheet_api_key');
  if (!sheetId || !apiKey) return null;

  try {
    const proxyResult = await fetchViaProxy(sheetId, apiKey, range);
    const proxyData = Array.isArray(proxyResult?.data) ? proxyResult.data : [];
    if (proxyData.length > 0) return proxyData;

    const directResult = await fetchDirect(sheetId, apiKey, range);
    if (directResult.success) return directResult.data;
    return proxyData;
  } catch {
    try {
      const directResult = await fetchDirect(sheetId, apiKey, range);
      return directResult.success ? directResult.data : null;
    } catch {
      return null;
    }
  }
};

// ── Multi-sheet helpers ───────────────────────────────────────────────────────
/**
 * Returns the configured sheet tab name for a given type,
 * falling back to 'Main' if none set.
 */
export type SheetType = 'expenses' | 'payments' | 'labour' | 'main';

export const getSheetTab = (type: SheetType): string => {
  const map: Record<SheetType, string> = {
    main: localStorage.getItem('sheet_tab_main') || 'Main',
    expenses: localStorage.getItem('sheet_tab_expenses') || '',
    payments: localStorage.getItem('sheet_tab_payments') || '',
    labour: localStorage.getItem('sheet_tab_labour') || '',
  };
  return map[type] || map.main;
};

export const saveSheetTab = (type: SheetType, tabName: string) => {
  localStorage.setItem(`sheet_tab_${type}`, tabName);
};

// ── Incremental sync helpers ──────────────────────────────────────────────────

/** Get the last synced row number (1-indexed, includes header row). */
export const getLastSyncedRow = (): number => {
  const val = localStorage.getItem(LS_LAST_ROW_KEY);
  return val ? Number(val) : 1; // 1 = only header row has been processed
};

/** Set the last synced row after a successful sync. */
export const setLastSyncedRow = (row: number) => {
  localStorage.setItem(LS_LAST_ROW_KEY, String(row));
};

/** Reset the last synced row (triggers full re-sync next time). */
export const resetLastSyncedRow = () => {
  localStorage.removeItem(LS_LAST_ROW_KEY);
};

/**
 * Build the A1 range for incremental fetch.
 * - Full sync:        tab!A1:J{bufferEnd}   (includes header)
 * - Incremental sync: tab!A{startRow}:J{endRow}  (skip header, start from next new row)
 */
export const buildSyncRange = (
  tabName: string,
  startRow: number,
  rowBuffer = 2000
): { range: string; includesHeader: boolean } => {
  if (startRow <= 1) {
    // Full sync: include header so column names can be auto-detected
    return {
      range: `${tabName}!A1:J${rowBuffer}`,
      includesHeader: true,
    };
  }
  // Incremental: skip rows already processed; prepend header row first
  return {
    range: `${tabName}!A${startRow}:J${startRow + rowBuffer}`,
    includesHeader: false,
  };
};
