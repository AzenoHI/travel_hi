import { GoogleMap, Marker } from "@react-google-maps/api";
import { useEffect, useRef } from "react";

interface Props {
    value: { lat: number; lng: number } | null;
    onChange: (coords: { lat: number; lng: number }) => void;
    height?: number;
}

export const MapLocationPicker: React.FC<Props> = ({ value, onChange, height = 300 }) => {
    const mapRef = useRef<google.maps.Map | null>(null);

    useEffect(() => {
        if (value && mapRef.current) {
            mapRef.current.panTo(value);
            mapRef.current.setZoom(14);
        }
    }, [value]);

    const handleClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    };

    return (
        <GoogleMap
            mapContainerStyle={{ width: "100%", height }}
            center={value ?? { lat: 52.2297, lng: 21.0122 }}
            zoom={value ? 13 : 10}
            onClick={handleClick}
            onLoad={(map: google.maps.Map) => {
                mapRef.current = map;
            }}
            onUnmount={() => {
                mapRef.current = null;
            }}
            options={{
                disableDefaultUI: false,
                streetViewControl: false,
                mapTypeControl: false,
            }}
        >
            {value && window.google && (
                <Marker
                    position={value}
                    animation={window.google.maps.Animation.DROP}
                />
            )}
        </GoogleMap>
    );
};
