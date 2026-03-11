import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';

function DataChart({ 
  data, 
  title, 
  dataKey = 'value', 
  color = '#3b82f6',
  height = 300,
  type = 'line',
  showGrid = true,
  formatValue = (value) => value.toFixed(2),
  showLabels = false
}) {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg p-4 border" style={{ 
        backgroundColor: theme.surface, 
        borderColor: theme.border 
      }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: theme.muted }}>
          {title}
        </h3>
        <div className="flex items-center justify-center h-64" style={{ color: theme.muted }}>
          No data available
        </div>
      </div>
    );
  }

  const latestValue = data[data.length - 1]?.[dataKey];
  const firstValue   = data[0]?.[dataKey];
  const change = firstValue ? ((latestValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="border rounded-lg p-3 shadow-lg" style={{ 
          backgroundColor: theme.surface, 
          borderColor: theme.border,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}>
          <p className="text-xs mb-1" style={{ color: theme.muted }}>
            {formatDateWithTimezone(new Date(data.date), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm font-semibold" style={{ color: theme.text }}>
            {formatValue(data[dataKey])}
          </p>
          {data.high && data.low && (
            <div className="text-xs mt-1" style={{ color: theme.muted }}>
              <div>High: {formatValue(data.high)}</div>
              <div>Low: {formatValue(data.low)}</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = (props) => {
    const { x, y, value, index } = props;
    // Only show labels for every 3rd point to avoid clutter
    if (index % 3 !== 0) return null;
    
    return (
      <text 
        x={x} 
        y={y - 10} 
        fill={theme.text} 
        fontSize="11" 
        fontWeight="600"
        textAnchor="middle"
      >
        {formatValue(value)}
      </text>
    );
  };

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <div className="rounded-lg p-4 border" style={{ 
      backgroundColor: theme.surface, 
      borderColor: theme.border 
    }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
            {title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold" style={{ color: theme.text }}>
              {formatValue(latestValue)}
            </span>
            <span 
              className="text-sm font-medium"
              style={{ color: isPositive ? theme.bullish : theme.bearish }}
            >
              {isPositive ? '+' : ''}{change.toFixed(2)}%
              <span className="text-xs font-normal ml-1" style={{ color: theme.muted }}>(period)</span>
            </span>
          </div>
        </div>
        <div className="text-xs" style={{ color: theme.muted }}>
          {data.length} data points
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />}
          <XAxis 
            dataKey="date" 
            stroke={theme.chartAxis}
            tick={{ fill: theme.chartAxis, fontSize: 11 }}
            tickFormatter={(date) => formatDateWithTimezone(new Date(date), 'MMM dd')}
          />
          <YAxis 
            stroke={theme.chartAxis}
            tick={{ fill: theme.chartAxis, fontSize: 11 }}
            tickFormatter={(value) => formatValue(value)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} />
          {type === 'area' ? (
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`${color}33`}
              strokeWidth={2}
            >
              {showLabels && <LabelList content={<CustomLabel />} />}
            </Area>
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            >
              {showLabels && <LabelList content={<CustomLabel />} />}
            </Line>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

export default DataChart;
