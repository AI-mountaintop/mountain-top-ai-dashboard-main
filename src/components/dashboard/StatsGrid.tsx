import { TrendingUp, TrendingDown, Users, Eye, MousePointer, Clock } from "lucide-react";

interface StatItemProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

function StatItem({ label, value, change, isPositive, icon }: StatItemProps) {
  return (
    <div className="glass-card rounded-xl p-5 hover:scale-105 transition-transform duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function StatsGrid() {
  const stats = [
    {
      label: "Active Users",
      value: "1,234",
      change: "+12.5%",
      isPositive: true,
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      label: "Page Views",
      value: "45.2K",
      change: "+8.3%",
      isPositive: true,
      icon: <Eye className="h-5 w-5 text-secondary" />,
    },
    {
      label: "Click Rate",
      value: "3.4%",
      change: "+2.1%",
      isPositive: true,
      icon: <MousePointer className="h-5 w-5 text-accent" />,
    },
    {
      label: "Avg. Time",
      value: "4m 23s",
      change: "+0.8%",
      isPositive: true,
      icon: <Clock className="h-5 w-5 text-info" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatItem key={index} {...stat} />
      ))}
    </div>
  );
}
