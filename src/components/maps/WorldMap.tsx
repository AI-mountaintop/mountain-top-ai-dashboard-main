import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { GeographicData } from "@/types/analytics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WorldMapProps {
  data: GeographicData[];
}

// Country coordinates mapping
const countryCoordinates: Record<string, [number, number]> = {
  "United States": [-95.7129, 37.0902],
  "United Kingdom": [-3.435973, 55.378051],
  "Germany": [10.451526, 51.165691],
  "Canada": [-106.346771, 56.130366],
  "France": [2.213749, 46.227638],
  "Netherlands": [5.291266, 52.132633],
  "The Netherlands": [5.291266, 52.132633],
  "Australia": [133.775136, -25.274398],
  "Japan": [138.252924, 36.204824],
  "Brazil": [-51.92528, -14.235004],
  "India": [78.96288, 20.593684],
  "Singapore": [103.8198, 1.3521],
  "Belgium": [4.4699, 50.5039],
  "China": [104.1954, 35.8617],
  "Spain": [-3.7492, 40.4637],
  "Ireland": [-8.2439, 53.4129],
  "Turkey": [35.2433, 38.9637],
  "Hong Kong": [114.1095, 22.3964],
  "Pakistan": [69.3451, 30.3753],
};

export function WorldMap({ data }: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      mapboxgl.accessToken = token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        projection: { name: "mercator" },
        zoom: 1.2,
        center: [20, 30],
        pitch: 0,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        "top-right"
      );

      map.current.scrollZoom.disable();

      map.current.on("style.load", () => {
        // Add a layer to color countries based on traffic
        if (map.current) {
          // Create a data-driven style for countries
          const countryData: Record<string, number> = {};
          data.forEach((location) => {
            countryData[location.country] = (countryData[location.country] || 0) + location.sessions;
          });

          // Add markers for each location
          data.forEach((location) => {
            const coords = countryCoordinates[location.country];
            if (coords && map.current) {
              // Create custom marker element with purple color
              const el = document.createElement("div");
              el.className = "custom-marker";
              const size = Math.min(location.sessions / 10 + 15, 50);
              el.style.width = `${size}px`;
              el.style.height = `${size}px`;
              el.style.borderRadius = "50%";
              el.style.background = "rgba(139, 92, 246, 0.5)";
              el.style.border = "2px solid rgba(139, 92, 246, 0.8)";
              el.style.cursor = "pointer";
              el.style.boxShadow = "0 0 15px rgba(139, 92, 246, 0.6)";
              el.style.transition = "all 0.3s ease";

              el.addEventListener("mouseenter", () => {
                el.style.transform = "scale(1.2)";
                el.style.background = "rgba(139, 92, 246, 0.7)";
              });

              el.addEventListener("mouseleave", () => {
                el.style.transform = "scale(1)";
                el.style.background = "rgba(139, 92, 246, 0.5)";
              });

              // Add popup
              const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${location.country}</h3>
                  <p style="margin: 2px 0;"><strong>City:</strong> ${location.city}</p>
                  <p style="margin: 2px 0;"><strong>Sessions:</strong> ${location.sessions}</p>
                  <p style="margin: 2px 0;"><strong>Visitors:</strong> ${location.visitors}</p>
                </div>
              `);

              new mapboxgl.Marker(el)
                .setLngLat(coords)
                .setPopup(popup)
                .addTo(map.current);
            }
          });
        }
      });

      // No rotation animation for flat map
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please check your token.");
    }
  };

  const handleSetToken = () => {
    if (!tokenInput.trim()) {
      toast.error("Please enter a valid Mapbox token");
      return;
    }
    setMapboxToken(tokenInput);
    setIsTokenSet(true);
    initializeMap(tokenInput);
    toast.success("Map initialized successfully!");
  };

  useEffect(() => {
    if (isTokenSet && mapboxToken) {
      initializeMap(mapboxToken);
    }

    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, data]);

  if (!isTokenSet) {
    return (
      <div className="glass-card rounded-xl p-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-1">Geographic Traffic</h3>
          <p className="text-sm text-muted-foreground">Last 30 Days</p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To display the interactive world map, please enter your Mapbox public token.
            You can get one for free at{" "}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1..."
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={handleSetToken} className="w-full">
            Initialize Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-lg">
      <div className="p-6 pb-4">
        <h3 className="text-2xl font-bold mb-1">Geographic Traffic</h3>
        <p className="text-sm text-muted-foreground">Last 30 Days</p>
      </div>
      <div className="relative w-full" style={{ height: "500px" }}>
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
    </div>
  );
}
