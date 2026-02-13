import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Snapshot } from '@/types';

interface PriceHistoryChartProps {
  snapshots: Snapshot[];
  height?: number;
}

export function PriceHistoryChart({
  snapshots,
  height = 280,
}: PriceHistoryChartProps) {
  const data = [...snapshots]
    .sort(
      (a, b) =>
        new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    )
    .map((s) => ({
      date: formatDate(s.capturedAt),
      price: s.price,
      status: s.status,
    }));

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-md border bg-muted/30 text-muted-foreground"
        style={{ height }}
      >
        No price history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${v / 1000}k`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value: number) => [formatPrice(value), 'Price']}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
