import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import {
  Settings as SettingsIcon, LogOut, Shield, Moon, Key, Save, Globe,
  RefreshCw, CheckCircle2, AlertCircle, Upload, Download, Plus, Trash2,
  Clock, Zap, Link2, Layers, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { testGeminiConnection } from '@/src/lib/gemini';
import { useFirestore } from '@/src/hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';
import {
  fetchFromSheet,
  getSheetTab, saveSheetTab,
  getLastSyncedRow, setLastSyncedRow, resetLastSyncedRow, buildSyncRange,
  type SheetType
} from '@/src/lib/sync';
import type { Expense, Payment, Site, LabourWorker, Party } from '@/src/types';

// ── Types ────────────────────────────────────────────────────────────────────

type ImportedRow = {
  date: string; type: string; amount: number; category: string;
  description: string; labour: string; site: string; party: string; user: string;
  phone?: string; wage?: number; paymentType?: 'Monthly' | 'Contract';
};

// Bug fix 1: typed wrapper instead of appending __forcetype string to raw arrays
type TaggedRow = { row: ImportedRow; forceType?: 'expense' | 'payment' | 'labour' };

type UnmappedRow = { date: string; type: string; amount: number; reason: string; raw: ImportedRow; };
type AliasEntry = { alias: string; canonical: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

const parseAmount = (raw: string) => {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[,₹\s]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createSourceRowKey = (row: ImportedRow) => {
  const normalizeField = (str?: string) => (str || '').toString().trim().toLowerCase();

  // Normalize date format: handle dd/mm/yyyy vs yyyy-mm-dd where possible or just strip spaces
  const dateStr = normalizeField(row.date);

  // Normalize type: treat "payment", "payment received", "income" as "payment"
  let typeStr = normalizeField(row.type);
  if (['payment received', 'payment', 'income'].includes(typeStr)) {
    typeStr = 'payment';
  } else if (['expense', 'expense paid'].includes(typeStr)) {
    typeStr = 'expense';
  }

  return [
    dateStr,
    typeStr,
    Number(row.amount || 0).toFixed(2),
    normalizeField(row.party),
    normalizeField(row.site),
    normalizeField(row.description)
  ].join('|');
};

const mapRowByHeader = (row: string[], map: Record<string, number>): ImportedRow => {
  const pick = (aliases: string[]) => { for (const a of aliases) { const i = map[a]; if (i !== undefined) return row[i] ?? ''; } return ''; };
  const typeStr = pick(['paymenttype', 'type', 'basis']).toLowerCase();
  return {
    date: pick(['date']), type: pick(['type']), amount: parseAmount(pick(['amount'])),
    category: pick(['category']) || 'Other',
    description: pick(['description', 'discription', 'details', 'note', 'notes']),
    labour: pick(['labour', 'labor', 'name', 'worker']), site: pick(['site']),
    party: pick(['party']), user: pick(['user', 'username']),
    phone: pick(['phone', 'mobile', 'contact']),
    wage: parseAmount(pick(['wage', 'salary', 'rate'])),
    paymentType: typeStr.includes('monthly') ? 'Monthly' : (typeStr.includes('contract') ? 'Contract' : undefined),
  };
};

const mapRowByPosition = (row: string[]): ImportedRow => {
  const [date, type, amount, category, description, labour, site, party, user, phone, wage, pType] = row;
  return { 
    date: date ?? '', type: type ?? '', amount: parseAmount(amount ?? ''), category: category || 'Other', 
    description: description ?? '', labour: labour ?? '', site: site ?? '', party: party ?? '', user: user ?? '',
    phone: phone ?? '', wage: parseAmount(wage ?? ''),
    paymentType: pType?.toLowerCase().includes('monthly') ? 'Monthly' : (pType?.toLowerCase().includes('contract') ? 'Contract' : undefined),
  };
};

const normalizeImportedRows = (rows: string[][], prependedHeader?: string[]): ImportedRow[] => {
  if (!rows.length) return [];
  let headerRow = rows[0].map(c => normalizeKey(c || ''));
  let dataRows = rows;
  const looksLikeHeader = headerRow.includes('date') && headerRow.includes('type') && headerRow.includes('amount');

  if (looksLikeHeader) {
    dataRows = rows.slice(1);
  } else if (prependedHeader) {
    // incremental: header provided separately
    headerRow = prependedHeader.map(c => normalizeKey(c || ''));
    dataRows = rows;
  }

  const headerMap: Record<string, number> = {};
  headerRow.forEach((n, i) => { if (n) headerMap[n] = i; });
  const hasNamedCols = headerMap.date !== undefined && headerMap.type !== undefined && headerMap.amount !== undefined;

  return dataRows
    .filter(r => r && r.some(c => String(c || '').trim()))
    .map(r => hasNamedCols ? mapRowByHeader(r, headerMap) : mapRowByPosition(r));
};

const SYNC_INTERVALS = [
  { label: '5 min', value: 5 }, { label: '15 min', value: 15 },
  { label: '30 min', value: 30 }, { label: '60 min', value: 60 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, logout } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [sheetApiKey, setSheetApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSheetSaved, setIsSheetSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isTestingSheet, setIsTestingSheet] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [unmappedRows, setUnmappedRows] = useState<UnmappedRow[]>([]);

  // Auto-sync
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(15);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const autoSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Alias map
  const [aliasEntries, setAliasEntries] = useState<AliasEntry[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [newCanonical, setNewCanonical] = useState('');

  // Multi-sheet tabs
  const [tabMain, setTabMain] = useState('Main');
  const [tabExpenses, setTabExpenses] = useState('');
  const [tabPayments, setTabPayments] = useState('');
  const [tabLabour, setTabLabour] = useState('');
  const [tabSites, setTabSites] = useState('');
  const [tabParties, setTabParties] = useState('');

  // Incremental sync info
  const [lastSyncedRow, setLastSyncedRowState] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: existingExpenses, add: addExpense, clearAll: clearExpenses } = useFirestore<Expense>('expenses');
  const { data: existingPayments, add: addPayment, clearAll: clearPayments } = useFirestore<Payment>('payments');
  const { data: existingLabour, add: addLabour, clearAll: clearLabour } = useFirestore<LabourWorker>('labour');
  const { data: sites, add: addSite, clearAll: clearSites } = useFirestore<Site>('sites');
  const { data: existingParties, add: addParty, clearAll: clearParties } = useFirestore<Party>('parties');

  const [isClearing, setIsClearing] = useState(false);

  // Bug fix 2: keep always-current refs so useCallback never goes stale
  const existingExpensesRef = useRef(existingExpenses);
  const existingPaymentsRef = useRef(existingPayments);
  const existingLabourRef = useRef(existingLabour);
  const existingSitesRef = useRef(sites);
  const existingPartiesRef = useRef(existingParties);
  const addExpenseRef = useRef(addExpense);
  const addPaymentRef = useRef(addPayment);
  const addLabourRef = useRef(addLabour);
  const addSiteRef = useRef(addSite);
  const addPartyRef = useRef(addParty);

  useEffect(() => { existingExpensesRef.current = existingExpenses; }, [existingExpenses]);
  useEffect(() => { existingPaymentsRef.current = existingPayments; }, [existingPayments]);
  useEffect(() => { existingLabourRef.current = existingLabour; }, [existingLabour]);
  useEffect(() => { existingSitesRef.current = sites; }, [sites]);
  useEffect(() => { existingPartiesRef.current = existingParties; }, [existingParties]);
  useEffect(() => { addExpenseRef.current = addExpense; }, [addExpense]);
  useEffect(() => { addPaymentRef.current = addPayment; }, [addPayment]);
  useEffect(() => { addLabourRef.current = addLabour; }, [addLabour]);
  useEffect(() => { addSiteRef.current = addSite; }, [addSite]);
  useEffect(() => { addPartyRef.current = addParty; }, [addParty]);

  // ── Load localStorage ─────────────────────────────────────────────────────
  useEffect(() => {
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      testGeminiConnection(savedKey).then(ok => setGeminiStatus(ok ? 'success' : 'error'));
    }
    const sid = localStorage.getItem('google_sheet_id');
    const sak = localStorage.getItem('google_sheet_api_key');
    if (sid) setSheetId(sid);
    if (sak) setSheetApiKey(sak);
    if (sid && sak) {
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}?key=${sak}`)
        .then(r => { if (r.ok) setSheetStatus('success'); });
    }
    // auto-sync
    if (localStorage.getItem('auto_sync_enabled') === 'true') setAutoSyncEnabled(true);
    const interval = localStorage.getItem('auto_sync_interval_minutes');
    if (interval) setAutoSyncInterval(Number(interval));
    const last = localStorage.getItem('last_synced_at');
    if (last) setLastSyncedAt(last);
    // aliases
    try {
      const raw = localStorage.getItem('site_alias_map');
      if (raw) setAliasEntries(Object.entries<string>(JSON.parse(raw)).map(([alias, canonical]) => ({ alias, canonical })));
    } catch (_) {}
    // multi-sheet tabs
    setTabMain(getSheetTab('main'));
    setTabExpenses(getSheetTab('expenses'));
    setTabPayments(getSheetTab('payments'));
    setTabLabour(getSheetTab('labour'));
    setTabSites(getSheetTab('sites'));
    setTabParties(getSheetTab('parties'));
    // incremental
    setLastSyncedRowState(getLastSyncedRow());
  }, []);

  // Save sheet tabs to localStorage
  const handleSaveSheetTabs = () => {
    saveSheetTab('main', tabMain || 'Main');
    saveSheetTab('expenses', tabExpenses);
    saveSheetTab('payments', tabPayments);
    saveSheetTab('labour', tabLabour);
    saveSheetTab('sites', tabSites);
    saveSheetTab('parties', tabParties);
    alert('Sheet tab names saved!');
  };

  // ── Core sync logic ───────────────────────────────────────────────────────
  const runSync = useCallback(async (silent = false, forceFullSync = false) => {
    const sid = localStorage.getItem('google_sheet_id');
    const sak = localStorage.getItem('google_sheet_api_key');
    if (!sid || !sak) { if (!silent) alert('Please configure Google Sheets first.'); return; }

    // build alias map
    let aliasMap: Record<string, string> = {};
    try { const r = localStorage.getItem('site_alias_map'); if (r) aliasMap = JSON.parse(r); } catch (_) {}

    setIsSyncing(true);

    try {
      // -- Determine which tabs to sync --
      const mainTab = getSheetTab('main');
      const expTab = getSheetTab('expenses');
      const payTab = getSheetTab('payments');
      const labTab = getSheetTab('labour');
      const sitTab = getSheetTab('sites');
      const parTab = getSheetTab('parties');

      // Start row for incremental (Labour usually isn't incremental as it's a fixed list, 
      // but we use the same row pointer for simplicity if shared)
      const lastRow = forceFullSync ? 1 : getLastSyncedRow();
      const isIncremental = lastRow > 1;

      // Fetch header row separately if doing incremental (so we know column names)
      let headerRowData: string[] | undefined;
      let rows: string[][] = [];
      let newLastRow = lastRow;

      // Tagged rows: typed wrapper instead of polluting the raw string[] array
      let taggedRows: TaggedRow[] = [];
      
      const { range: lRange } = buildSyncRange(labTab || 'Labour', 1);
      const { range: sRange } = buildSyncRange(sitTab || 'Sites', 1);
      const { range: ptRange } = buildSyncRange(parTab || 'Parties', 1);

      if (expTab || payTab) {
        // Dedicated sheet tabs per type — fetch in parallel
        const { range: eRange } = buildSyncRange(expTab || '', lastRow);
        const { range: pRange } = buildSyncRange(payTab || '', lastRow);
        
        const [eFetch, pFetch, lFetch, sFetch, ptFetch] = await Promise.all([
          expTab ? fetchFromSheet(eRange) : Promise.resolve([]),
          payTab ? fetchFromSheet(pRange) : Promise.resolve([]),
          labTab ? fetchFromSheet(lRange) : Promise.resolve([]),
          sitTab ? fetchFromSheet(sRange) : Promise.resolve([]),
          parTab ? fetchFromSheet(ptRange) : Promise.resolve([]),
        ]);
        
        const eParsed = normalizeImportedRows(eFetch || []);
        const pParsed = normalizeImportedRows(pFetch || []);
        
        taggedRows = [
          ...eParsed.map(row => ({ row, forceType: 'expense' as const })),
          ...pParsed.map(row => ({ row, forceType: 'payment' as const })),
        ];
        newLastRow = Math.max(lastRow, lastRow + (eFetch?.length || 0), lastRow + (pFetch?.length || 0));
        await processReferenceTabs(lFetch, sFetch, ptFetch);
      } else {
        // Single main sheet + sync reference tables
        const [mainFetch, lFetch, sFetch, ptFetch] = await Promise.all([
           fetchFromSheet(buildSyncRange(mainTab, lastRow).range),
           labTab ? fetchFromSheet(lRange) : Promise.resolve([]),
           sitTab ? fetchFromSheet(sRange) : Promise.resolve([]),
           parTab ? fetchFromSheet(ptRange) : Promise.resolve([])
        ]);
        
        if (isIncremental && mainFetch && mainFetch.length > 0) {
          const headerFetch = await fetchFromSheet(`${mainTab}!A1:J1`);
          headerRowData = headerFetch?.[0] || undefined;
        }
        
        rows = mainFetch || [];
        newLastRow = lastRow + rows.length;
        const importedRows = normalizeImportedRows(rows, headerRowData);
        taggedRows = importedRows.map(row => ({ row }));
        
        await processReferenceTabs(lFetch, sFetch, ptFetch);
      }
      
      async function processReferenceTabs(lDat: any, sDat: any, pDat: any) {
        // Extract array of strings from column A, skipping header rows if named
        const extract = (data: any, headerMatcher: string) => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((r: any) => String(r[0] || '')).filter(v => v.trim() && !v.toLowerCase().includes(headerMatcher));
        };
        
        const lNames = extract(lDat, 'labour');
        const sNames = extract(sDat, 'site');
        const pNames = extract(pDat, 'party');
        
        const existingWorkers = new Set(existingLabourRef.current.map(w => normalizeKey(w.name)));
        for (const name of lNames) {
           const k = normalizeKey(name);
           if (!existingWorkers.has(k)) {
             try { await addLabourRef.current({ name, paymentType: 'Contract', dailyWage: 0, balance: 0, status: 'Active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); existingWorkers.add(k); } catch (_) {}
           }
        }
        
        const existingSitesCache = new Set(existingSitesRef.current.map(s => normalizeKey(s.name)));
        for (const name of sNames) {
           const k = normalizeKey(name);
           if (!existingSitesCache.has(k)) {
             try { await addSiteRef.current({ name, location: '', status: 'Active', progress: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); existingSitesCache.add(k); } catch (_) {}
           }
        }
        
        const existingPartiesCache = new Set(existingPartiesRef.current.map(p => normalizeKey(p.name)));
        for (const name of pNames) {
           const k = normalizeKey(name);
           if (!existingPartiesCache.has(k)) {
              try { await addPartyRef.current({ name, type: 'Vendor', balance: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); existingPartiesCache.add(k); } catch (_) {}
           }
        }
      }

      if (!taggedRows.length) {
        if (!silent) alert(isIncremental ? 'No new rows since last sync.' : 'No data found in sheet or sheet is empty.');
        setIsSyncing(false);
        return;
      }

      let successCount = 0, errorCount = 0, skippedCount = 0;
      const newUnmappedRows: UnmappedRow[] = [];

      // Use always-current refs (Bug fix 2)
      const existingKeys = new Set<string>();
      [...existingExpensesRef.current, ...existingPaymentsRef.current].forEach((entry: any) => {
        if (entry.sourceRowKey) { existingKeys.add(entry.sourceRowKey); return; }

        // Ensure the fallback accurately reflects how createSourceRowKey normalizes it.
        // Also check if entry was actually a Payment type in firebase
        let fallbackType = 'Expense';
        if (entry.category === 'Payment Received' || existingPaymentsRef.current.includes(entry)) {
           fallbackType = 'payment';
        }

        const fallback: ImportedRow = {
          date: entry.date || '',
          type: fallbackType,
          amount: Number(entry.amount || 0),
          category: entry.category || '',
          description: entry.notes || '',
          labour: '',
          site: entry.siteId || '',
          party: entry.partyName || '',
          user: entry.partner || ''
        };

        // When calculating fallback keys for legacy entries without sourceRowKey,
        // increment suffix to avoid colliding identical legacy rows into a single key.
        let baseKey = createSourceRowKey(fallback);
        let finalKey = baseKey;
        let suffix = 1;
        while (existingKeys.has(finalKey)) {
          finalKey = `${baseKey}_${suffix}`;
          suffix++;
        }
        existingKeys.add(finalKey);
      });
      
      const sessionKeys = new Set<string>();

      for (const { row, forceType } of taggedRows) {
        // Apply site alias
        if (row.site) { const k = normalizeKey(row.site); if (aliasMap[k]) row.site = aliasMap[k]; }

        if (!row.date || !row.type || !row.amount) {
          skippedCount++;
          newUnmappedRows.push({ date: row.date, type: row.type, amount: row.amount, reason: 'Missing required field (Date/Type/Amount)', raw: row });
          continue;
        }

        const normalizedType = row.type.trim().toLowerCase();

        let baseKey = createSourceRowKey(row);
        let sourceRowKey = baseKey;
        let suffix = 1;
        // Calculate the next available key for this identical row in the current sheet sync session.
        while (sessionKeys.has(sourceRowKey)) {
          sourceRowKey = `${baseKey}_${suffix}`;
          suffix++;
        }
        sessionKeys.add(sourceRowKey);

        if (existingKeys.has(sourceRowKey)) { skippedCount++; continue; }

        const entry = { date: row.date, amount: row.amount, category: row.category || 'Other', notes: row.description || '', labourName: row.labour || '', partyName: row.party || '', siteId: row.site || '', partner: row.user || '', sourceRowKey };

        const isExpense = forceType === 'expense' || normalizedType === 'expense';
        const isPayment = forceType === 'payment' || ['payment received', 'payment', 'income'].includes(normalizedType);

        try {
          if (isExpense) {
            await addExpenseRef.current(entry); existingKeys.add(sourceRowKey); successCount++;
          } else if (isPayment) {
            await addPaymentRef.current(entry); existingKeys.add(sourceRowKey); successCount++;
          } else {
            skippedCount++;
            newUnmappedRows.push({ date: row.date, type: row.type, amount: row.amount, reason: 'Type not mapped to Payment/Expense', raw: row });
          }
        } catch { errorCount++; }
      }

      // Update incremental row pointer
      setLastSyncedRow(newLastRow);
      setLastSyncedRowState(newLastRow);
      setUnmappedRows(newUnmappedRows);
      const now = new Date().toLocaleString('en-IN', { hour12: true });
      setLastSyncedAt(now);
      localStorage.setItem('last_synced_at', now);

      if (!silent) {
        const mode = isIncremental ? '(incremental)' : '(full)';
        alert(`Sync ${mode} done! ${successCount} imported${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}.`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      if (!silent) alert('Sync failed. Please check your configuration.');
    } finally {
      setIsSyncing(false);
    }
  // Bug fix 2: no data deps — refs keep values current without triggering re-creation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-sync interval ────────────────────────────────────────────────────
  useEffect(() => {
    if (autoSyncTimerRef.current) { clearInterval(autoSyncTimerRef.current); autoSyncTimerRef.current = null; }
    if (autoSyncEnabled && sheetStatus === 'success') {
      autoSyncTimerRef.current = setInterval(() => runSync(true), autoSyncInterval * 60 * 1000);
    }
    return () => { if (autoSyncTimerRef.current) clearInterval(autoSyncTimerRef.current); };
  }, [autoSyncEnabled, autoSyncInterval, sheetStatus, runSync]);

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem('auto_sync_enabled', String(enabled));
  };
  const handleIntervalChange = (minutes: number) => {
    setAutoSyncInterval(minutes);
    localStorage.setItem('auto_sync_interval_minutes', String(minutes));
  };

  // ── Export unmapped CSV ───────────────────────────────────────────────────
  const handleExportUnmappedCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Reason', 'Party', 'Site', 'Description'];
    const rows = unmappedRows.map(r =>
      [r.date, r.type, r.amount, r.reason, r.raw.party, r.raw.site, r.raw.description]
      .map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `unmapped_rows_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Alias helpers ─────────────────────────────────────────────────────────
  const handleAddAlias = () => {
    const a = newAlias.trim(), c = newCanonical.trim();
    if (!a || !c) return;
    const updated = [...aliasEntries.filter(e => normalizeKey(e.alias) !== normalizeKey(a)), { alias: a, canonical: c }];
    setAliasEntries(updated); saveAliasMap(updated); setNewAlias(''); setNewCanonical('');
  };
  const handleRemoveAlias = (alias: string) => {
    const updated = aliasEntries.filter(e => e.alias !== alias);
    setAliasEntries(updated); saveAliasMap(updated);
  };
  const saveAliasMap = (entries: AliasEntry[]) => {
    const map: Record<string, string> = {};
    entries.forEach(({ alias, canonical }) => { map[normalizeKey(alias)] = canonical; });
    localStorage.setItem('site_alias_map', JSON.stringify(map));
  };

  // ── CSV Upload (Quick wins: dedup check + Promise.allSettled for parallel writes) ──
  const handleCSVUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsSyncing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');

      // Build dedup set from current data (Quick win 2)
      const existingKeys = new Set<string>();
      [...existingExpensesRef.current, ...existingPaymentsRef.current].forEach((entry: any) => {
        if (entry.sourceRowKey) { existingKeys.add(entry.sourceRowKey); return; }
        let fallbackType = 'Expense';
        if (entry.category === 'Payment Received' || existingPaymentsRef.current.includes(entry)) {
           fallbackType = 'payment';
        }
        const fallback: ImportedRow = {
          date: entry.date || '', type: fallbackType, amount: Number(entry.amount || 0),
          category: entry.category || '', description: entry.notes || '',
          labour: '', site: entry.siteId || '', party: entry.partyName || '', user: entry.partner || ''
        };
        existingKeys.add(createSourceRowKey(fallback));
      });

      // Build all write promises (Quick win 1: parallel with allSettled)
      const tasks: Promise<unknown>[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(','); const entry: any = {};
        headers.forEach((h, idx) => { entry[h.trim()] = vals[idx]?.trim(); });

        // Construct a sourceRowKey for dedup (same shape as runSync)
        const csvRow: ImportedRow = {
          date: entry.Date || '', type: entry.Type || '', amount: parseAmount(entry.Amount),
          category: entry.Category || 'Other', description: entry.Discription || entry.Description || '',
          labour: '', site: entry.Site || '', party: entry.Party || '', user: entry.User || '',
        };
        const sourceRowKey = createSourceRowKey(csvRow);
        if (existingKeys.has(sourceRowKey)) continue; // skip duplicate
        existingKeys.add(sourceRowKey); // optimistic add to prevent intra-batch dups

        const data = { date: csvRow.date, amount: csvRow.amount, category: csvRow.category, notes: csvRow.description, partyName: csvRow.party, siteId: csvRow.site, partner: csvRow.user, sourceRowKey, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if (entry.Type === 'Expense') tasks.push(addExpenseRef.current(data) as Promise<unknown>);
        else if (entry.Type === 'Payment Received') tasks.push(addPaymentRef.current(data) as Promise<unknown>);
      }

      const results = await Promise.allSettled(tasks);
      const failed = results.filter(r => r.status === 'rejected').length;
      setIsSyncing(false);
      alert(`CSV import done! ${tasks.length - failed} written${failed > 0 ? `, ${failed} failed` : ''}.`);
    };
    reader.readAsText(file);
  };

  // ── OpenRouter ────────────────────────────────────────────────────────────
  const handleSaveKey = async () => {
    setIsTestingGemini(true); setGeminiStatus('idle');
    if (!apiKey.trim()) { localStorage.removeItem('openrouter_api_key'); setIsSaved(true); setGeminiStatus('idle'); setTimeout(() => setIsSaved(false), 2000); setIsTestingGemini(false); return; }
    try {
      const ok = await testGeminiConnection(apiKey);
      if (ok) { localStorage.setItem('openrouter_api_key', apiKey); setIsSaved(true); setGeminiStatus('success'); setTimeout(() => setIsSaved(false), 2000); }
      else { setGeminiStatus('error'); if (window.confirm('Test failed. Save anyway?')) { localStorage.setItem('openrouter_api_key', apiKey); setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); } }
    } catch { setGeminiStatus('error'); alert('Error testing connection.'); }
    finally { setIsTestingGemini(false); }
  };

  // ── Clear App Data & Re-sync ──────────────────────────────────────────────
  const handleClearAndResync = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL expenses, payments, labour, sites, and parties from your database.\n\nAre you absolutely sure you want to proceed?')) {
      return;
    }

    setIsClearing(true);
    try {
      await Promise.all([
        clearExpenses(),
        clearPayments(),
        clearLabour(),
        clearSites(),
        clearParties()
      ]);

      resetLastSyncedRow();
      setLastSyncedRowState(1);

      // Give Firestore a tiny bit of time to settle after the deletes
      setTimeout(() => {
        setIsClearing(false);
        runSync(false, true); // Force full re-sync
      }, 1000);
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear app data.');
      setIsClearing(false);
    }
  };

  // ── Sheet config ──────────────────────────────────────────────────────────
  const handleSaveSheetConfig = async () => {
    setIsTestingSheet(true); setSheetStatus('idle');
    if (!sheetId || !sheetApiKey) { setSheetStatus('error'); alert('Enter both Sheet ID and API Key.'); setIsTestingSheet(false); return; }
    try {
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${sheetApiKey}`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) { localStorage.setItem('google_sheet_id', sheetId); localStorage.setItem('google_sheet_api_key', sheetApiKey); setIsSheetSaved(true); setSheetStatus('success'); setTimeout(() => setIsSheetSaved(false), 2000); }
      else { const err = await res.json(); throw new Error(err.error?.message || 'Failed to connect'); }
    } catch (err: any) { setSheetStatus('error'); alert(err.name === 'AbortError' ? 'Timeout.' : `Connection Failed: ${err.message}`); }
    finally { setIsTestingSheet(false); }
  };

  const siteNames = sites.map(s => s.name).filter(Boolean);
  const sections = [
    { title: 'Profile', icon: SettingsIcon, items: [{ label: 'Display Name', value: user?.displayName || 'Rohit Kumar' }, { label: 'Email', value: user?.email || '' }] },
    { title: 'Preferences', icon: Moon, items: [{ label: 'Theme', value: 'Dark Mode (Default)' }, { label: 'Language', value: 'Hinglish / English' }] },
    { title: 'Security', icon: Shield, items: [{ label: 'Account Status', value: 'Verified' }, { label: 'Data Sync', value: 'Real-time Enabled' }] },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <PageHeader title="Settings" subtitle="Manage your account and app preferences" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile / Prefs / Security */}
        {sections.map(s => (
          <div key={s.title} className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#1e2a40] flex items-center gap-2"><s.icon className="w-4 h-4 text-[#00d4aa]" /><h3 className="font-bold text-white">{s.title}</h3></div>
            <div className="p-5 space-y-4">{s.items.map(item => (<div key={item.label} className="flex justify-between items-center"><span className="text-sm text-gray-500">{item.label}</span><span className="text-sm font-medium text-white">{item.value}</span></div>))}</div>
          </div>
        ))}

        {/* AI */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center gap-2"><Key className="w-4 h-4 text-[#00d4aa]" /><h3 className="font-bold text-white">AI Assistant Configuration</h3></div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold block">OpenRouter API Key</label>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your OpenRouter API Key..." className="flex-1 bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" />
                <button onClick={handleSaveKey} disabled={isTestingGemini} className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer disabled:opacity-50">
                  {isTestingGemini ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaved ? 'Saved!' : isTestingGemini ? 'Testing...' : 'Save & Test'}
                </button>
              </div>
              {geminiStatus === 'success' && <div className="flex items-center gap-2 text-emerald-400 text-xs"><CheckCircle2 className="w-3 h-3" /><span>Connected!</span></div>}
              {geminiStatus === 'error' && <div className="flex items-center gap-2 text-rose-400 text-xs"><AlertCircle className="w-3 h-3" /><span>Invalid API Key.</span></div>}
              <p className="text-xs text-gray-500">Get key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[#00d4aa] hover:underline">OpenRouter Settings</a>. Stored locally.</p>
            </div>
          </div>
        </div>

        {/* Google Sheets */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center justify-between">
            <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#00d4aa]" /><h3 className="font-bold text-white">Google Sheets Integration</h3></div>
            {sheetStatus === 'success' && <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Connected</div>}
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div><p className="text-sm font-bold text-white">Sync Payments & Expenses</p><p className="text-xs text-gray-400 mt-1">Pull data from Google Sheet into GenuineOS.</p></div>
              <div className="flex gap-2 flex-wrap">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="bg-[#1e2a40] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#2a3b5c] transition cursor-pointer text-sm flex items-center gap-2"><Upload className="w-4 h-4" />Upload CSV</button>
                <button onClick={() => runSync(false, false)} disabled={isSyncing || sheetStatus !== 'success'} className="bg-[#1e2a40] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#2a3b5c] transition cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />{isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button onClick={() => { resetLastSyncedRow(); setLastSyncedRowState(1); runSync(false, true); }} disabled={isSyncing || sheetStatus !== 'success'} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-xl font-bold hover:bg-amber-500/20 transition cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50" title="Force full re-sync from row 1">
                  <RotateCcw className="w-4 h-4" />Full Re-Sync
                </button>
                <button onClick={handleClearAndResync} disabled={isSyncing || isClearing || sheetStatus !== 'success'} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl font-bold hover:bg-rose-500/20 transition cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50" title="Delete ALL data and sync fresh from row 1">
                  <Trash2 className="w-4 h-4" />{isClearing ? 'Deleting...' : 'Clear All & Sync'}
                </button>
              </div>
            </div>

            {/* Incremental sync info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0b0e14] border border-[#1e2a40] rounded-xl text-xs text-gray-400">
              <RefreshCw className="w-4 h-4 text-[#00d4aa] shrink-0" />
              <span>
                <span className="font-bold text-white">Incremental Sync:</span> Next sync will start from row <span className="font-mono text-[#00d4aa]">{lastSyncedRow}</span>
                {lastSyncedRow <= 1 ? ' (full sync on next run)' : ' — only new rows will be imported.'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#1e2a40]">
              <div className="space-y-2"><label className="text-sm text-gray-400 font-bold block">Google Sheet ID</label><input type="text" value={sheetId} onChange={e => setSheetId(e.target.value)} placeholder="e.g. 1BxiMVs0XRA5..." className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" /></div>
              <div className="space-y-2"><label className="text-sm text-gray-400 font-bold block">Google Sheets API Key</label><input type="password" value={sheetApiKey} onChange={e => setSheetApiKey(e.target.value)} placeholder="Your Google Cloud API Key..." className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" /></div>
            </div>
            <div className="flex justify-between items-center">
              <div>{sheetStatus === 'success' && <span className="flex items-center gap-2 text-emerald-400 text-xs"><CheckCircle2 className="w-3 h-3" />Sheet connected!</span>}{sheetStatus === 'error' && <span className="flex items-center gap-2 text-rose-400 text-xs"><AlertCircle className="w-3 h-3" />Connection failed.</span>}</div>
              <button onClick={handleSaveSheetConfig} disabled={isTestingSheet} className="bg-[#00d4aa] text-[#07090f] px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer disabled:opacity-50">
                {isTestingSheet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSheetSaved ? 'Config Saved!' : isTestingSheet ? 'Testing...' : 'Save & Test Connection'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Get API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#00d4aa] hover:underline">Google Cloud Console</a>.</p>
          </div>
        </div>

        {/* ── Multi-Sheet Tab Config ── */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00d4aa]" />
            <div><h3 className="font-bold text-white">Multi-Sheet Tab Configuration</h3></div>
          </div>
          <div className="p-5 space-y-5">
            <p className="text-xs text-gray-400">
              By default all data is pulled from a single <span className="font-mono text-[#00d4aa]">Main</span> sheet tab.
              Optionally assign <strong className="text-white">separate tabs</strong> for Expenses and Payments — if both are set, the main tab is ignored during sync.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide">Main / Default Tab</label>
                <input type="text" value={tabMain} onChange={e => setTabMain(e.target.value)} placeholder="Main" className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide">Expenses Tab <span className="text-gray-600">(optional)</span></label>
                <input type="text" value={tabExpenses} onChange={e => setTabExpenses(e.target.value)} placeholder="e.g. Expenses" className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide">Payments Tab <span className="text-gray-600">(optional)</span></label>
                <input type="text" value={tabPayments} onChange={e => setTabPayments(e.target.value)} placeholder="e.g. Payments" className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide">Labour Tab <span className="text-gray-600">(optional)</span></label>
                <input type="text" value={tabLabour} onChange={e => setTabLabour(e.target.value)} placeholder="e.g. Labour" className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm" />
              </div>
            </div>
            {(tabExpenses || tabPayments || tabLabour) && (
              <div className="flex items-center gap-2 bg-[#00d4aa]/5 border border-[#00d4aa]/20 text-[#00d4aa] text-xs px-4 py-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Dedicated tabs configured — sync will pull from specified tabs for each data type.</span>
              </div>
            )}
            <button onClick={handleSaveSheetTabs} className="bg-[#00d4aa] text-[#07090f] px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer">
              <Save className="w-4 h-4" />Save Tab Names
            </button>
          </div>
        </div>

        {/* Auto-Sync */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center justify-between">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#00d4aa]" /><h3 className="font-bold text-white">Background Auto-Sync</h3></div>
            {autoSyncEnabled && sheetStatus === 'success' && <div className="flex items-center gap-2 bg-[#00d4aa]/10 text-[#00d4aa] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#00d4aa]/20"><div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />Auto-Sync Active</div>}
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-bold text-white">Enable Automatic Sync</p><p className="text-xs text-gray-400 mt-1">Pulls new rows automatically in the background.</p></div>
              <button onClick={() => handleToggleAutoSync(!autoSyncEnabled)} disabled={sheetStatus !== 'success'} aria-pressed={autoSyncEnabled} className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${autoSyncEnabled ? 'bg-[#00d4aa]' : 'bg-[#1e2a40]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${autoSyncEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-[#1e2a40]">
              <div className="flex items-center gap-2 text-gray-400"><Clock className="w-4 h-4" /><span className="text-sm">Interval</span></div>
              <div className="flex gap-2">{SYNC_INTERVALS.map(({ label, value }) => (<button key={value} onClick={() => handleIntervalChange(value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${autoSyncInterval === value ? 'bg-[#00d4aa] text-[#07090f]' : 'bg-[#1e2a40] text-gray-300 hover:bg-[#2a3b5c]'}`}>{label}</button>))}</div>
            </div>
            {lastSyncedAt && <div className="flex items-center gap-2 text-gray-500 text-xs pt-2 border-t border-[#1e2a40]"><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span>Last synced: <span className="text-gray-300 font-medium">{lastSyncedAt}</span></span></div>}
            {sheetStatus !== 'success' && <p className="text-xs text-amber-500/80 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Connect Google Sheet first.</p>}
          </div>
        </div>

        {/* Site Alias Mapping */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center gap-2"><Link2 className="w-4 h-4 text-[#00d4aa]" /><h3 className="font-bold text-white">Site Alias Mapping</h3></div>
          <div className="p-5 space-y-5">
            <p className="text-xs text-gray-400">Map alternative names from your sheet to canonical site names. E.g. <span className="text-amber-400 font-mono">Ludhiana-1</span> → <span className="text-emerald-400 font-mono">Ludhiana</span></p>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1"><label className="text-xs text-gray-500 font-bold">Sheet Alias</label><input type="text" value={newAlias} onChange={e => setNewAlias(e.target.value)} placeholder="e.g. Ludhiana-1" className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition text-sm" /></div>
              <div className="text-gray-500 pb-2 text-lg">→</div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-500 font-bold">Canonical Site Name</label>
                {siteNames.length > 0 ? (
                  <select value={newCanonical} onChange={e => setNewCanonical(e.target.value)} className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition text-sm">
                    <option value="">Select site...</option>
                    {siteNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : (
                  <input type="text" value={newCanonical} onChange={e => setNewCanonical(e.target.value)} placeholder="e.g. Ludhiana" className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-3 py-2 text-white outline-none focus:border-[#00d4aa] transition text-sm" />
                )}
              </div>
              <button onClick={handleAddAlias} disabled={!newAlias.trim() || !newCanonical.trim()} className="bg-[#00d4aa] text-[#07090f] px-3 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-[#00b894] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"><Plus className="w-4 h-4" />Add</button>
            </div>
            {aliasEntries.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4 border border-dashed border-[#1e2a40] rounded-xl">No aliases configured yet.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {aliasEntries.map(({ alias, canonical }) => (
                  <div key={alias} className="flex items-center justify-between bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-3 text-sm"><span className="text-amber-400 font-mono">{alias}</span><span className="text-gray-500">→</span><span className="text-emerald-400 font-mono">{canonical}</span></div>
                    <button onClick={() => handleRemoveAlias(alias)} className="text-gray-600 hover:text-rose-400 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unmapped Rows */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center justify-between">
            <div><h3 className="font-bold text-white">Unmapped Sheet Rows</h3><p className="text-xs text-gray-500 mt-1">Rows skipped during sync because type/fields could not be mapped.</p></div>
            {unmappedRows.length > 0 && <button onClick={handleExportUnmappedCSV} className="bg-[#1e2a40] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#2a3b5c] transition cursor-pointer text-sm flex items-center gap-2"><Download className="w-4 h-4" />Export CSV ({unmappedRows.length})</button>}
          </div>
          <div className="p-5">
            {unmappedRows.length === 0 ? <p className="text-sm text-gray-500">No unmapped rows in latest sync.</p> : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unmappedRows.slice(0, 50).map((row, i) => (
                  <div key={`${row.date}-${i}`} className="bg-[#0b0e14] border border-[#1e2a40] rounded-lg p-3">
                    <p className="text-xs text-rose-400 font-semibold">{row.reason}</p>
                    <p className="text-xs text-gray-300 mt-1">{row.date || 'N/A'} | {row.type || 'N/A'} | ₹{row.amount.toLocaleString('en-IN')} | {row.raw.party || '-'} | {row.raw.site || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center md:col-span-2">
          <h3 className="text-rose-400 font-bold mb-2">Danger Zone</h3>
          <p className="text-xs text-rose-400/60 mb-6">Logging out will end your current session on this device.</p>
          <button onClick={() => logout()} className="w-full max-w-sm bg-rose-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition cursor-pointer"><LogOut className="w-4 h-4" />Logout from GenuineOS</button>
        </div>
      </div>
      <div className="text-center pt-8"><p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">GenuineOS v3.0.0</p><p className="text-[10px] text-gray-700 mt-1">© 2026 Genuine Hospi Enterprises</p></div>
    </div>
  );
}
