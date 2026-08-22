import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface LineChartPoint {
  label: string;
  value: number | null;
}

interface SimpleLineChartProps {
  data: LineChartPoint[];
  label: string;
  unit?: string;
  color?: string;
  'data-testid'?: string;
}

export function SimpleLineChart({ data, label, unit = '', color = 'var(--color-primary)', 'data-testid': dataTestId }: SimpleLineChartProps) {
  const valid = data.filter((d) => d.value != null);
  const latest = valid[valid.length - 1];
  const max = valid.length
    ? valid.reduce((best, current) => (current.value! > best.value! ? current : best), valid[0])
    : null;

  return (
    <div className="space-y-3" data-testid={dataTestId}>
      <div aria-hidden="true" className="h-64 w-full md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={(v) => `${v}${unit}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
              labelStyle={{ color: '#e4e4e7' }}
              itemStyle={{ color: '#e4e4e7' }}
              formatter={(value) => [`${value}${unit}`, label]}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        {label}: {valid.length} registros. {latest ? `Último valor ${latest.value}${unit} en ${latest.label}.` : ''}
        {max ? `Máximo ${max.value}${unit} en ${max.label}.` : ''}
      </p>
    </div>
  );
}
