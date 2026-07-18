import L, { type LatLngLiteral } from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Ubicacion } from "../../types/votante";
import Button from "../ui/Button";

interface LocationPickerMapProps {
  error?: string;
  onChange: (location: Ubicacion) => void;
  value?: Ubicacion;
}

const defaultPosition: LatLngLiteral = {
  lat: -25.2968,
  lng: -57.6332,
};

const markerIcon = L.divIcon({
  className: "voto-map-marker",
  html: "<span></span>",
  iconAnchor: [15, 15],
  iconSize: [30, 30],
});

function MapClickHandler({ onChange }: Pick<LocationPickerMapProps, "onChange">) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapRecentering({ value }: Pick<LocationPickerMapProps, "value">) {
  const map = useMap();

  useEffect(() => {
    if (value) {
      map.setView(value, Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [map, value]);

  return null;
}

function LocationPickerMap({ error, onChange, value }: LocationPickerMapProps) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const markerRef = useRef<L.Marker | null>(null);
  const position = value ?? defaultPosition;

  const markerHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;

        if (!marker) {
          return;
        }

        const nextPosition = marker.getLatLng();
        onChange({
          lat: nextPosition.lat,
          lng: nextPosition.lng,
        });
      },
    }),
    [onChange],
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (location) => {
        setGeoStatus("idle");
        onChange({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      },
      () => setGeoStatus("error"),
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 9000,
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-body text-xs font-black uppercase text-orange-100/80">Ubicacion</p>
          <p className="font-body text-sm font-semibold text-orange-50/70">
            {value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Sin coordenadas"}
          </p>
        </div>
        <Button
          icon={<LocateFixed aria-hidden="true" size={18} strokeWidth={2.7} />}
          isLoading={geoStatus === "loading"}
          onClick={useCurrentLocation}
          variant="secondary"
        >
          Usar actual
        </Button>
      </div>

      <div className="overflow-hidden rounded-panel border border-brand-line bg-brand-coal shadow-panel">
        <MapContainer
          center={position}
          className="h-72 w-full"
          scrollWheelZoom={false}
          zoom={value ? 15 : 12}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable
            eventHandlers={markerHandlers}
            icon={markerIcon}
            position={position}
            ref={markerRef}
          />
          <MapClickHandler onChange={onChange} />
          <MapRecentering value={value} />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-body text-sm font-semibold">
        <MapPin aria-hidden="true" className="text-brand-orange" size={17} strokeWidth={2.6} />
        {error ? (
          <span className="text-red-200">{error}</span>
        ) : geoStatus === "error" ? (
          <span className="text-red-200">No se pudo obtener la ubicacion actual.</span>
        ) : value ? (
          <span className="text-orange-50/70">Punto territorial listo para guardar.</span>
        ) : (
          <span className="text-orange-50/70">Ubicacion pendiente.</span>
        )}
      </div>
    </div>
  );
}

export default LocationPickerMap;
