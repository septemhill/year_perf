import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import Ticker from './components/Ticker';

interface RawData {
  [ticker: string]: {
    description: string;
    history: { [date: string]: number };
    worst_months: { 
      [year: string]: { 
        month: number; 
        geo_mean: number;
        monthly_return: number;
        mdd: number;
      }[] 
    };
  };
}

function Footer() {
  return (
    <div style={{ 
      marginTop: '48px', 
      paddingTop: '24px', 
      borderTop: '1px solid #e2e8f0',
      color: '#64748b',
      fontSize: '0.875rem',
      lineHeight: '1.6'
    }}>
      <h3 style={{ color: '#334155', fontSize: '1rem', marginBottom: '12px' }}>Footnotes: Calculation Methods for Worst Months</h3>
      <ul style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '16px' }}>
          <strong>Monthly Return</strong>: Calculates the cumulative return from the beginning to the end of the month.
          <br />
          <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
            Formula: (Price_end / Price_start) - 1
          </code>
        </li>
        <li style={{ marginBottom: '16px' }}>
          <strong>Geometric Mean</strong>: Reflects the average price level relative to the start of the month, accounting for the geometric average of cumulative performance.
          <br />
          <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
            Formula: [Product(Price_i / Price_start)^(1/n)] - 1
          </code>
          <span style={{ marginLeft: '8px', fontSize: '0.75rem' }}>(n = number of trading days)</span>
        </li>
        <li>
          <strong>Maximum Drawdown (MDD)</strong>: The largest peak-to-trough decline observed within the month.
          <br />
          <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
            Formula: Min((Price_i / Peak_to_i) - 1)
          </code>
        </li>
      </ul>
    </div>
  );
}

function App() {
  const [data, setData] = useState<RawData | null>(null);
  const [maxLines, setMaxLines] = useState(5);
  const deferredMaxLines = useDeferredValue(maxLines);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/all_tickers_10y.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load ticker data');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const processedTickers = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([ticker, entry]) => {
      const { history, worst_months } = entry || {};
      if (!history) return null;

      const years = new Set<string>();
      const dateMap = new Map<string, any>();

      Object.entries(history).forEach(([dateStr, value]) => {
        const year = dateStr.substring(0, 4);
        const monthDay = dateStr.substring(5); // "MM-DD"
        years.add(year);

        if (!dateMap.has(monthDay)) {
          dateMap.set(monthDay, { date: `2024-${monthDay}` });
        }
        dateMap.get(monthDay)![year] = parseFloat((value as number).toFixed(2));
      });

      const sortedData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      const sortedYears = Array.from(years).sort().reverse();

      const config = sortedYears.map(year => ({
        key: year,
        name: year
      }));

      return {
        ticker,
        description: entry.description,
        data: sortedData,
        config,
        worstMonths: worst_months
      };
    }).filter(t => t !== null);
  }, [data]);

  // Determine global max years available across all tickers for the slider
  const globalMaxYears = useMemo(() => {
    return Math.max(...processedTickers.map(t => t.config.length), 0);
  }, [processedTickers]);

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '8px' }}>Financial Trend Dashboard</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Yearly performance comparison over the last 10 years</p>
        
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading ticker data...</div>}
        {error && <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>Error: {error}</div>}

        {!loading && !error && (
          <>
            <div style={{ 
              marginBottom: '32px', 
              backgroundColor: '#fff', 
              padding: '20px', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <label htmlFor="maxLines" style={{ fontWeight: 600, color: '#334155' }}>
                Years to Overlay:
              </label>
              <input 
                id="maxLines"
                type="range" 
                value={maxLines} 
                onChange={(e) => setMaxLines(Number(e.target.value))}
                min="1"
                max={globalMaxYears || 10}
                style={{ width: '200px' }}
              />
              <span style={{ 
                backgroundColor: '#f1f5f9', 
                padding: '4px 12px', 
                borderRadius: '16px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#475569'
              }}>
                {maxLines} years
              </span>
              {maxLines !== deferredMaxLines && (
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Updating charts...</span>
              )}
            </div>

            {processedTickers.map(({ ticker, description, data, config, worstMonths }) => (
              <Ticker 
                key={ticker}
                title={ticker}
                description={description}
                data={data} 
                config={config} 
                maxLines={deferredMaxLines}
                height={450}
                worstMonths={worstMonths}
              />
            ))}
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
