import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Settings as SettingsIcon, LogOut, Shield, Moon, Key, Save, Globe, RefreshCw, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { testGeminiConnection } from '@/src/lib/gemini';
import { useFirestore } from '@/src/hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';
import { fetchFromSheet } from '@/src/lib/sync';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { add: addExpense } = useFirestore('expenses');
  const { add: addPayment } = useFirestore('payments');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      testGeminiConnection(savedKey).then(isValid => {
        if (isValid) setGeminiStatus('success');
        else setGeminiStatus('error');
      });
    }
    
    const savedSheetId = localStorage.getItem('google_sheet_id');
    const savedSheetApiKey = localStorage.getItem('google_sheet_api_key');
    
    if (savedSheetId !== null) setSheetId(savedSheetId);
    if (savedSheetApiKey !== null) setSheetApiKey(savedSheetApiKey);

    if (savedSheetId && savedSheetApiKey) {
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${savedSheetId}?key=${savedSheetApiKey}`)
        .then(res => {
          if (res.ok) setSheetStatus('success');
        });
    }
  }, []);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const entry: any = {};
        headers.forEach((header, index) => {
          entry[header.trim()] = values[index]?.trim();
        });

        // Map CSV to Firestore
        const data = {
          date: entry.Date,
          amount: parseFloat(entry.Amount) || 0,
          category: entry.Category,
          notes: entry.Discription,
          partyName: entry.Party,
          siteId: entry.Site,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (entry.Type === 'Expense') {
          await addExpense(data);
        } else if (entry.Type === 'Payment Received') {
          await addPayment(data);
        }
      }
      setIsSyncing(false);
      alert('CSV data synced successfully!');
    };
    reader.readAsText(file);
  };

  const handleSaveKey = async () => {
    setIsTestingGemini(true);
    setGeminiStatus('idle');
    
    // If empty, just save and use default
    if (!apiKey.trim()) {
      localStorage.removeItem('gemini_api_key');
      setIsSaved(true);
      setGeminiStatus('idle');
      setTimeout(() => setIsSaved(false), 2000);
      setIsTestingGemini(false);
      return;
    }

    // Test the key before saving
    try {
      const isValid = await testGeminiConnection(apiKey);
      
      if (isValid) {
        localStorage.setItem('gemini_api_key', apiKey);
        setIsSaved(true);
        setGeminiStatus('success');
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        setGeminiStatus('error');
        // Still allow saving if user insists? No, better to keep it safe.
        // But maybe the test failed due to network.
        if (window.confirm('API test failed. This could be due to an invalid key or network issues. Do you want to save it anyway?')) {
          localStorage.setItem('gemini_api_key', apiKey);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        }
      }
    } catch (err) {
      setGeminiStatus('error');
      alert('Error testing connection. Please check your internet.');
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSaveSheetConfig = async () => {
    setIsTestingSheet(true);
    setSheetStatus('idle');

    // Basic validation
    if (!sheetId || !sheetApiKey) {
      setSheetStatus('error');
      alert('Please enter both Sheet ID and API Key.');
      setIsTestingSheet(false);
      return;
    }

    // Attempt to fetch sheet metadata as a test
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${sheetApiKey}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        localStorage.setItem('google_sheet_id', sheetId);
        localStorage.setItem('google_sheet_api_key', sheetApiKey);
        setIsSheetSaved(true);
        setSheetStatus('success');
        setTimeout(() => setIsSheetSaved(false), 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to connect to Google Sheets');
      }
    } catch (err: any) {
      setSheetStatus('error');
      if (err.name === 'AbortError') {
        alert('Sheet Connection Timeout: The request took too long. Please check your internet.');
      } else {
        alert(`Sheet Connection Failed: ${err.message}`);
      }
    } finally {
      setIsTestingSheet(false);
    }
  };

  const handleSync = async () => {
    if (!sheetId || !sheetApiKey) {
      alert('Please configure Google Sheets first.');
      return;
    }
    setIsSyncing(true);
    
    try {
      const data = await fetchFromSheet('Main!A2:J1000');
      if (!data || data.length === 0) {
        alert('No data found in sheet or sheet is empty.');
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        if (!row || row.length === 0) continue;
        
        const [date, type, amount, category, description, labour, site, party, user, chatId] = row;
        
        if (!date || !type || !amount) continue;

        const entry = {
          date: date,
          amount: parseFloat(amount) || 0,
          category: category || 'Other',
          notes: description || '',
          partyName: party || '',
          siteId: site || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        try {
          if (type === 'Expense') {
            await addExpense(entry);
            successCount++;
          } else if (type === 'Payment Received') {
            await addPayment(entry);
            successCount++;
          }
        } catch (err) {
          console.error('Error adding entry:', err);
          errorCount++;
        }
      }
      
      alert(`Sync completed! ${successCount} records imported${errorCount > 0 ? `, ${errorCount} failed` : ''}.`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please check your configuration and try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const sections = [
    { title: 'Profile', icon: SettingsIcon, items: [
      { label: 'Display Name', value: user?.displayName || 'Rohit Kumar' },
      { label: 'Email', value: user?.email || 'rohit@example.com' },
    ]},
    { title: 'Preferences', icon: Moon, items: [
      { label: 'Theme', value: 'Dark Mode (Default)' },
      { label: 'Language', value: 'Hinglish / English' },
    ]},
    { title: 'Security', icon: Shield, items: [
      { label: 'Account Status', value: 'Verified' },
      { label: 'Data Sync', value: 'Real-time Enabled' },
    ]},
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account and app preferences"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#1e2a40] flex items-center gap-2">
              <section.icon className="w-4 h-4 text-[#00d4aa]" />
              <h3 className="font-bold text-white">{section.title}</h3>
            </div>
            <div className="p-5 space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* AI Settings */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#00d4aa]" />
            <h3 className="font-bold text-white">AI Assistant Configuration</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold block">Google Gemini API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API Key..."
                  className="flex-1 bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm"
                />
                <button
                  onClick={handleSaveKey}
                  disabled={isTestingGemini}
                  className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer disabled:opacity-50"
                >
                  {isTestingGemini ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaved ? 'Saved!' : isTestingGemini ? 'Testing...' : 'Save & Test'}
                </button>
              </div>
              {geminiStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Connection established successfully!</span>
                </div>
              )}
              {geminiStatus === 'error' && (
                <div className="flex items-center gap-2 text-rose-400 text-xs mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Invalid API Key. Please verify.</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#00d4aa] hover:underline">Google AI Studio</a>. This key is stored locally on your device.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl md:col-span-2">
          <div className="p-5 border-b border-[#1e2a40] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00d4aa]" />
              <h3 className="font-bold text-white">Google Sheets Integration</h3>
            </div>
            {sheetStatus === 'success' && (
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </div>
            )}
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Sync Payments & Expenses</p>
                <p className="text-xs text-gray-400 mt-1">Automatically sync data between GenuineOS and your Google Sheet.</p>
              </div>
              <div className="flex gap-2">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#1e2a40] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#2a3b5c] transition cursor-pointer text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload CSV
                </button>
                <button
                  onClick={handleSync}
                  disabled={isSyncing || sheetStatus !== 'success'}
                  className="bg-[#1e2a40] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#2a3b5c] transition cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#1e2a40]">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-bold block">Google Sheet ID</label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-bold block">Google Sheets API Key</label>
                <input
                  type="password"
                  value={sheetApiKey}
                  onChange={(e) => setSheetApiKey(e.target.value)}
                  placeholder="Enter your Google Cloud API Key..."
                  className="w-full bg-[#0b0e14] border border-[#1e2a40] rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d4aa] transition font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {sheetStatus === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sheet connected!</span>
                  </div>
                )}
                {sheetStatus === 'error' && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>Connection failed.</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSaveSheetConfig}
                disabled={isTestingSheet}
                className="bg-[#00d4aa] text-[#07090f] px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer disabled:opacity-50"
              >
                {isTestingSheet ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSheetSaved ? 'Config Saved!' : isTestingSheet ? 'Testing...' : 'Save & Test Connection'}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Get your API key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#00d4aa] hover:underline">Google Cloud Console</a>. Ensure the Google Sheets API is enabled for your project.
            </p>
          </div>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center md:col-span-2">
          <h3 className="text-rose-400 font-bold mb-2">Danger Zone</h3>
          <p className="text-xs text-rose-400/60 mb-6">Logging out will end your current session on this device.</p>
          <button 
            onClick={() => logout()}
            className="w-full max-w-sm bg-rose-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout from GenuineOS
          </button>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">GenuineOS v3.0.0</p>
        <p className="text-[10px] text-gray-700 mt-1">© 2026 Genuine Hospi Enterprises</p>
      </div>
    </div>
  );
}
