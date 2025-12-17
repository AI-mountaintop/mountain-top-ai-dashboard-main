import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Custom tooltip for "Others" to show breakdown
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-sm mb-1">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        {data.value.toLocaleString()} ({((data.payload.percent || 0) * 100).toFixed(1)}%)
      </p>
      {data.payload.items && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs font-semibold mb-1">Breakdown:</p>
          {data.payload.items.map((item: any, idx: number) => (
            <p key={idx} className="text-xs text-muted-foreground">
              • {item.name}: {item.value.toLocaleString()}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export function DonutChart({ data, title, colors = DEFAULT_COLORS }: DonutChartProps) {
  // Process data: group items < 5% into "Others"
  const { processedData, total } = useMemo(() => {
    if (!data || data.length === 0) return { processedData: [], total: 0 };

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const threshold = total * 0.05; // 5% threshold

    const mainItems: Array<{ name: string; value: number }> = [];
    const otherItems: Array<{ name: string; value: number }> = [];

    data.forEach((item) => {
      if (item.value >= threshold) {
        mainItems.push(item);
      } else {
        otherItems.push(item);
      }
    });

    // If there are items in "Others", add them as a single entry
    if (otherItems.length > 0) {
      const othersTotal = otherItems.reduce((sum, item) => sum + item.value, 0);
      mainItems.push({
        name: 'Others',
        value: othersTotal,
        items: otherItems, // Store original items for tooltip
      } as any);
    }

    return { processedData: mainItems, total };
  }, [data]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-6">{title}</h3>
        <div className="flex items-center justify-center h-[320px] text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-6">{title}</h3>
      <div className="flex flex-col items-center pb-2">
        {/* Chart */}
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
            >
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom Legend with percentages */}
        <div className="w-full mt-4 space-y-3 pb-2">
          {processedData.map((entry, index) => {
            const percent = ((entry.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between text-sm leading-loose py-0.5">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-foreground truncate font-medium leading-loose">{entry.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-muted-foreground font-semibold leading-loose">
                    {entry.value.toLocaleString()}
                  </span>
                  <span className="text-foreground font-bold min-w-[3rem] text-right leading-loose">
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
