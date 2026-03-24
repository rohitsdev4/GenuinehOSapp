const fetchViaProxy = async (sheetId: string, apiKey: string, range: string) => {
  const query = new URLSearchParams({
    sheetId,
    apiKey,
    range,
  });

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

export const fetchFromSheet = async (range: string = 'Main!A1:J1000') => {
  const sheetId = localStorage.getItem('google_sheet_id');
  const apiKey = localStorage.getItem('google_sheet_api_key');

  if (!sheetId || !apiKey) return null;

  try {
    const proxyResult = await fetchViaProxy(sheetId, apiKey, range);
    const proxyData = Array.isArray(proxyResult?.data) ? proxyResult.data : [];

    // Some deployments/proxies return empty data incorrectly; try direct API as fallback.
    if (proxyData.length > 0) return proxyData;

    const directResult = await fetchDirect(sheetId, apiKey, range);
    if (directResult.success) return directResult.data;

    return proxyData;
  } catch (error) {
    console.error('Fetch from sheet failed:', error);
    try {
      const directResult = await fetchDirect(sheetId, apiKey, range);
      return directResult.success ? directResult.data : null;
    } catch (directError) {
      console.error('Direct sheets fetch failed:', directError);
      return null;
    }
  }
};
