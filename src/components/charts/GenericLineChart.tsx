import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatDate } from "@/lib/utils";

interface LineConfig {
    key: string;
    color: string;
    name: string;
}

interface GenericLineChartProps {
    data: any[];
    title: string;
    subtitle?: string;
    lines: LineConfig[];
    xAxisKey?: string;
}

export function GenericLineChart({ data, title, subtitle, lines, xAxisKey = "date" }: GenericLineChartProps) {
    const formattedData = data.map((item) => ({
        ...item,
        [xAxisKey]: xAxisKey === "date" && item[xAxisKey] ? formatDate(item[xAxisKey]) : (item[xAxisKey] || ""),
    }));

    return (
        <div className="glass-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                <div className="flex gap-4 text-sm">
                    {lines.map((line) => (
                        <div key={line.key} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                            <span className="text-muted-foreground">{line.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey={xAxisKey}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                        }}
                    />
                    <Legend />
                    {lines.map((line) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            stroke={line.color}
                            strokeWidth={2}
                            dot={{ fill: line.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
