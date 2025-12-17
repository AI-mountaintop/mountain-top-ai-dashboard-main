import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { cn, formatNumber, formatPercentage, formatDuration } from "@/lib/utils";
import { MetricCardData } from "@/types/analytics";

interface MetricCardProps {
  data: MetricCardData;
  className?: string;
}

export function MetricCard({ data, className }: MetricCardProps) {
  const { label, value, trend, trendDirection, format = "number" } = data;

  const formatValue = (val: number | string | undefined): string => {
    if (typeof val === "string") return val;
    if (val === undefined || val === null) return "0";
    
    switch (format) {
      case "percentage":
        return formatPercentage(val);
      case "duration":
        return formatDuration(val);
      case "decimal":
        return val.toFixed(2);
      default:
        return formatNumber(val);
    }
  };

  const getTrendColor = () => {
    if (!trendDirection || trendDirection === "neutral") return "text-muted-foreground";
    return trendDirection === "up" ? "text-success" : "text-destructive";
  };

  const TrendIcon = () => {
    if (!trendDirection || trendDirection === "neutral") return <MinusIcon className="h-3 w-3" />;
    return trendDirection === "up" ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />;
  };

  return (
    <div
      className={cn(
        "rounded-xl glass-card p-6 transition-all hover-lift",
        className
      )}
    >
      <div>
        <p className="text-sm font-semibold text-muted-foreground/80 mb-3 uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
            {formatValue(value)}
          </h3>
          {trend !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full",
                getTrendColor(),
                "backdrop-blur-sm"
              )}
            >
              <TrendIcon />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
