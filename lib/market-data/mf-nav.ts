/**
 * MF NAV lookup via mfapi.in — free, open API for Indian mutual fund NAV data.
 */

// Simple in-memory cache with 1-hour TTL
const navCache = new Map<string, { nav: number; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getMFNav(schemeCode: string): Promise<number | null> {
  // Check cache
  const cached = navCache.get(schemeCode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.nav;
  }

  try {
    const res = await fetch(
      `https://api.mfapi.in/mf/${schemeCode}/latest`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const nav = parseFloat(data.data[0].nav);
      navCache.set(schemeCode, { nav, timestamp: Date.now() });
      return nav;
    }

    return null;
  } catch {
    return null;
  }
}

export async function searchMFScheme(
  query: string
): Promise<Array<{ schemeCode: string; schemeName: string }>> {
  try {
    const res = await fetch(
      `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data || [])
      .slice(0, 5)
      .map((item: { schemeCode: number; schemeName: string }) => ({
        schemeCode: String(item.schemeCode),
        schemeName: item.schemeName,
      }));
  } catch {
    return [];
  }
}
