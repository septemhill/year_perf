import React, { useState } from 'react';
import MultiLineChart, { MultiLineChartProps } from './MultiLineChart';

interface WorstMonthData {
  month: number;
  geo_mean: number;
  monthly_return: number;
  mdd: number;
}

interface TickerProps extends MultiLineChartProps {
  title: string;
  description?: string;
  worstMonths?: { [year: string]: WorstMonthData[] };
}

type MetricType = 'geo_mean' | 'monthly_return' | 'mdd';

const Ticker: React.FC<TickerProps> = React.memo(({ title, description, worstMonths, ...chartProps }) => {
  const { data, config, maxLines } = chartProps;
  const [metric, setMetric] = useState<MetricType>('monthly_return');
  
  // Get the years currently being displayed
  const visibleYears = config.slice(0, maxLines || 10).map(c => c.key);
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const annualStats = React.useMemo(() => {
    const stats: { [year: string]: { return: number; mdd: number } } = {};
    
    visibleYears.forEach(year => {
      let peak = -Infinity;
      let maxDD = 0;
      let lastVal = 0;
      let hasData = false;

      data.forEach(d => {
        const val = d[year];
        if (val !== undefined && val !== null) {
          hasData = true;
          lastVal = val;
          const ratio = val / 100 + 1;
          if (ratio > peak) {
            peak = ratio;
          }
          const dd = (peak - ratio) / peak;
          if (dd > maxDD) {
            maxDD = dd;
          }
        }
      });

      if (hasData) {
        stats[year] = {
          return: lastVal,
          mdd: maxDD * 100
        };
      }
    });
    
    return stats;
  }, [data, visibleYears]);

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        borderBottom: '2px solid #f1f5f9',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0,
            marginRight: '8px'
          }}>
            {title}
          </h2>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{description}</span>
        </div>
      </div>
      
      <MultiLineChart {...chartProps} />

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>
          Annual Performance Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {visibleYears.map(year => {
            const stats = annualStats[year];
            if (!stats) return null;
            return (
              <div key={year} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  {year}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Total Return</span>
                  <span style={{ color: stats.return >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {stats.return > 0 ? '+' : ''}{stats.return.toFixed(2)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>Max Drawdown</span>
                  <span style={{ color: '#ef4444', fontWeight: 500 }}>
                    -{stats.mdd.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {worstMonths && (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', margin: 0 }}>
              Top 3 Worst Months per Year (Ranked by Geometric Mean)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Metric:</span>
              <select 
                value={metric} 
                onChange={(e) => setMetric(e.target.value as MetricType)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="monthly_return">Monthly Return</option>
                <option value="mdd">Max Drawdown</option>
                <option value="geo_mean">Geometric Average</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {visibleYears.map(year => (
              <div key={year} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  {year}
                </div>
                {worstMonths[year]?.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>{monthNames[m.month - 1]}</span>
                    <span style={{ color: '#ef4444', fontWeight: 500 }}>
                      {m[metric]}%
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default Ticker;
