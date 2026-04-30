import React from 'react';
import MultiLineChart, { MultiLineChartProps } from './MultiLineChart';

interface TickerProps extends MultiLineChartProps {
  title: string;
  worstMonths?: { [year: string]: { month: number; return: number }[] };
}

const Ticker: React.FC<TickerProps> = React.memo(({ title, worstMonths, ...chartProps }) => {
  const { config, maxLines } = chartProps;
  
  // Get the years currently being displayed
  const visibleYears = config.slice(0, maxLines || 10).map(c => c.key);
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

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
        alignItems: 'baseline',
        marginBottom: '16px',
        borderBottom: '2px solid #f1f5f9',
        paddingBottom: '12px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1e293b',
          margin: 0,
          marginRight: '8px'
        }}>
          {title}
        </h2>
        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Trend Analysis</span>
      </div>
      
      <MultiLineChart {...chartProps} />

      {worstMonths && (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>
            Top 3 Worst Months per Year
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {visibleYears.map(year => (
              <div key={year} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  {year}
                </div>
                {worstMonths[year]?.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>{monthNames[m.month - 1]}</span>
                    <span style={{ color: '#ef4444', fontWeight: 500 }}>{m.return}%</span>
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
