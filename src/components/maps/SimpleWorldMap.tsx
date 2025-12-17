import { GeographicData } from "@/types/analytics";
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

interface SimpleWorldMapProps {
  data: GeographicData[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function SimpleWorldMap({ data }: SimpleWorldMapProps) {
  const { t } = useLanguage();
  const [tooltipContent, setTooltipContent] = useState("");

  // Calculate max sessions for color intensity
  const maxSessions = useMemo(() => {
    return Math.max(...data.map(d => d.sessions), 1);
  }, [data]);

  // Country name mapping to handle variations
  const normalizeCountryName = (name: string): string => {
    const mapping: Record<string, string> = {
      "United States of America": "United States",
      "USA": "United States",
      "UK": "United Kingdom",
      "Great Britain": "United Kingdom",
      "UAE": "United Arab Emirates",
      "South Korea": "Korea",
      "Republic of Korea": "Korea",
      "The Netherlands": "Netherlands",
    };
    return mapping[name] || name;
  };

  // Group data by country with normalized names
  const countryData = useMemo(() => {
    const grouped: Record<string, { sessions: number; visitors: number; cities: string[]; originalName: string }> = {};
    data.forEach(location => {
      // Normalize the country name for grouping
      const normalizedCountry = normalizeCountryName(location.country);
      if (!grouped[normalizedCountry]) {
        grouped[normalizedCountry] = { sessions: 0, visitors: 0, cities: [], originalName: location.country };
      }
      grouped[normalizedCountry].sessions += location.sessions;
      grouped[normalizedCountry].visitors += location.visitors;
      grouped[normalizedCountry].cities.push(location.city);
    });
    return grouped;
  }, [data]);

  // Get color for country based on sessions - using coral gradient
  const getCountryColor = (geoCountryName: string) => {
    // Try to find matching country data
    const normalizedGeoName = normalizeCountryName(geoCountryName);
    let stats = countryData[normalizedGeoName] || countryData[geoCountryName];
    
    // Try partial matching if exact match fails
    if (!stats) {
      const matchingKey = Object.keys(countryData).find(key => 
        key.toLowerCase().includes(geoCountryName.toLowerCase()) ||
        geoCountryName.toLowerCase().includes(key.toLowerCase())
      );
      if (matchingKey) stats = countryData[matchingKey];
    }
    
    if (!stats) return "#2a3441"; // Lighter dark background for countries without data
    
    const intensity = Math.min((stats.sessions / maxSessions) * 0.6 + 0.4, 1);
    // Use coral gradient (Spijkerenco primary color)
    return `rgba(240, 130, 106, ${intensity})`;
  };

  // Top 10 countries by sessions
  const topCountries = useMemo(() => {
    return Object.entries(countryData)
      .sort(([, a], [, b]) => b.sessions - a.sessions)
      .slice(0, 10);
  }, [countryData]);

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-lg">
      <div className="p-6 pb-4">
        <h3 className="text-2xl font-bold mb-1">{t('geo.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('geo.last30Days')}</p>
      </div>
      
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map visualization */}
          <div className="relative bg-[#1a1d24] rounded-lg overflow-hidden min-h-[400px]">
            <ComposableMap
              projectionConfig={{
                rotate: [-10, 0, 0],
                scale: 130,
              }}
              width={800}
              height={400}
              className="w-full h-full"
            >
              <ZoomableGroup zoom={1} center={[0, 20]}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryName = geo.properties.name;
                      const hasData = countryData[countryName];
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getCountryColor(countryName)}
                          stroke="#1a1d24"
                          strokeWidth={0.75}
                          style={{
                            default: { outline: "none" },
                            hover: {
                              fill: hasData ? "#F0826A" : "#3a4451",
                              outline: "none",
                              cursor: hasData ? "pointer" : "default",
                            },
                            pressed: { outline: "none" },
                          }}
                          onMouseEnter={() => {
                            if (hasData) {
                              setTooltipContent(
                                `${countryName}: ${countryData[countryName].sessions} ${t('chart.sessions').toLowerCase()}`
                              );
                            }
                          }}
                          onMouseLeave={() => {
                            setTooltipContent("");
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
            
            {/* Tooltip */}
            {tooltipContent && (
              <div className="absolute top-4 left-4 bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
                {tooltipContent}
              </div>
            )}
          </div>

          {/* Country list */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Top Countries
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {topCountries.map(([country, stats], index) => (
                <div
                  key={country}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{country}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.cities.slice(0, 2).join(", ")}
                        {stats.cities.length > 2 && ` +${stats.cities.length - 2} more`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{stats.sessions}</p>
                    <p className="text-xs text-muted-foreground">sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold">{Object.keys(countryData).length}</p>
            <p className="text-sm text-muted-foreground">Countries</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {Object.values(countryData).reduce((sum, c) => sum + c.sessions, 0)}
            </p>
            <p className="text-sm text-muted-foreground">{t('metric.totalSessions')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {Object.values(countryData).reduce((sum, c) => sum + c.visitors, 0)}
            </p>
            <p className="text-sm text-muted-foreground">{t('metric.totalVisitors')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
