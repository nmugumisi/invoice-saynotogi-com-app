interface RateSource {
  label: string;
  url: string;
  key: string;
}

const RATE_SOURCES: RateSource[] = [
  { label: 'ExchangeRate-API', url: 'https://open.er-api.com/v6/latest/USD', key: 'rates' },
  { label: 'Currency-API', url: 'https://latest.currency-api.pages.dev/v1/currencies/usd.json', key: 'usd' },
  {
    label: 'Currency-API (jsDelivr)',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    key: 'usd',
  },
];

export interface FetchedRates {
  zar: number | null;
  bwp: number | null;
  source: string;
}

/**
 * Tries each feed in turn — the same fallback list the WordPress plugin uses —
 * and returns the first usable set of USD-based rates. One feed being down
 * should not leave the app without rates.
 */
export async function fetchLiveRates(): Promise<FetchedRates> {
  const failures: string[] = [];

  for (const source of RATE_SOURCES) {
    try {
      const response = await fetch(source.url, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        failures.push(`${source.label}: HTTP ${response.status}`);
        continue;
      }
      const data = await response.json();
      const bucket = data?.[source.key];
      if (!bucket || typeof bucket !== 'object') {
        failures.push(`${source.label}: unreadable response`);
        continue;
      }

      const rates: Record<string, number> = {};
      for (const [code, rate] of Object.entries(bucket)) {
        if (typeof rate === 'number') {
          rates[code.toUpperCase()] = rate;
        }
      }

      if (!('ZAR' in rates) && !('BWP' in rates)) {
        failures.push(`${source.label}: no ZAR or BWP in response`);
        continue;
      }

      return {
        zar: rates.ZAR ?? null,
        bwp: rates.BWP ?? null,
        source: source.label,
      };
    } catch (err: any) {
      failures.push(`${source.label}: ${err?.message ?? 'network error'}`);
    }
  }

  throw new Error(`Could not reach any exchange-rate feed. (${failures.join('; ')})`);
}
