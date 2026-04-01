export const syncToSheet = async (action: 'append' | 'update', data: any, range: string) => {
  const sheetId = localStorage.getItem('google_sheet_id');
  const apiKey = localStorage.getItem('google_sheet_api_key');

  if (!sheetId || !apiKey) return;

  try {
    await fetch('/api/sync-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId, apiKey, data, action, range })
    });
  } catch (error) {
    console.error('Sync to sheet failed:', error);
  }
};

export const fetchFromSheet = async (range: string = 'A1:J100') => {
  const sheetId = localStorage.getItem('google_sheet_id');
  const apiKey = localStorage.getItem('google_sheet_api_key');

  if (!sheetId || !apiKey) return null;

  try {
    const response = await fetch(`/api/fetch-sheets?sheetId=${sheetId}&apiKey=${apiKey}&range=${range}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Fetch from sheet failed:', error);
    return null;
  }
};
