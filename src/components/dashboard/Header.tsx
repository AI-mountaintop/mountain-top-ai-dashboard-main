import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, RefreshCw, Globe, Languages } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onGenerateReport?: () => void;
  autoRefresh?: boolean;
}

export function Header({
  lastUpdated,
  isRefreshing,
  onRefresh,
  onGenerateReport,
  autoRefresh,
}: HeaderProps) {
  const { activeSite } = useSite();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  // Only show header actions on analytics page
  const isAnalyticsPage = location.pathname === '/analytics';
  const showActions = isAnalyticsPage && onRefresh && onGenerateReport;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/analytics':
        return t('page.title');
      case '/translation':
        return 'Website Translation';
      case '/audit':
        return 'Audit Report';
      default:
        return 'Dashboard';
    }
  };

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'nl', label: 'Dutch' },
    { value: 'de', label: 'German' },
    { value: 'fr', label: 'French' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm h-[73px]">
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {getPageTitle()}
              </h1>
              <div className="flex items-center gap-3">
                {isAnalyticsPage && activeSite && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {activeSite.name}
                  </p>
                )}
                {isAnalyticsPage && lastUpdated && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {t('header.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-3">
              {/* Language Selector - Only on Analytics page */}
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-[140px] gap-2">
                  <Languages className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!autoRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                  title="Refresh data now"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  <span className="hidden sm:inline">{t('header.refreshNow')}</span>
                </Button>
              )}

              <Button 
                onClick={onGenerateReport} 
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">{t('header.generateReport')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
