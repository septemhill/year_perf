import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// High-contrast color palette (Tableau 10)
const DEFAULT_COLORS = [
  '#4E79A7', // Blue
  '#F28E2C', // Orange
  '#E15759', // Red
  '#76B7B2', // Cyan
  '#59A14F', // Green
  '#EDC949', // Yellow
  '#AF7AA1', // Purple
  '#FF9DA7', // Pink
  '#9C755F', // Brown
  '#BAB0AB', // Gray
];

export interface LineConfig {
  key: string;
  name: string;
  color?: string;
}

export interface MultiLineChartProps {
  data: any[];
  config: LineConfig[];
  maxLines?: number;
  height?: number | string;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  config,
  maxLines = 10,
  height = 400,
}) => {
  // Limit the number of lines to maxLines
  const visibleLines = config.slice(0, maxLines);

  const formatXAxis = (tickItem: string) => {
    try {
      // Assuming tickItem is a date string like '2024-04-30'
      return format(parseISO(tickItem), 'MM/dd');
    } catch (e) {
      return tickItem;
    }
  };

  const formatYAxis = (tickItem: number) => {
    return `${tickItem}%`;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#ccc' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#ccc' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            labelFormatter={(label) => {
              try {
                return format(parseISO(label), 'yyyy/MM/dd');
              } catch (e) {
                return label;
              }
            }}
            formatter={(value: number) => [`${value}%`]}
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          {visibleLines.map((line, index) => (
            <Line
              key={line.key}
              connectNulls={true}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiLineChart;
