export const fetchFromSheet = async (range: string = 'A2:J1000') => {
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
