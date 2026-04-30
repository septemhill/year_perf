import React from 'react';
import MultiLineChart, { MultiLineChartProps } from './MultiLineChart';

interface TickerProps extends MultiLineChartProps {
  title: string;
}

const Ticker: React.FC<TickerProps> = ({ title, ...chartProps }) => {
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
    </div>
  );
};

export default Ticker;
