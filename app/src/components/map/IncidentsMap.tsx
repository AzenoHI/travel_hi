import { useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, Typography, Chip } from "@mui/material";
import type { Incident } from "../../types/incident";

const containerStyle = {
    width: "100%",
    height: "80vh",
    borderRadius: "12px",
};

const center = { lat: 52.2297, lng: 21.0122 }; // Warszawa

// lokalne dane — tylko do testów frontendu
const sampleIncidents: Incident[] = [
    {
        id: "1",
        title: "Roboty drogowe — Aleje Jerozolimskie",
        description: "Zwężenie do jednego pasa, utrudnienia do 18:00",
        severity: "medium",
        lat: 52.228,
        lng: 21.012,
    },
    {
        id: "2",
        title: "Wypadek — S8",
        description: "Zablokowany prawy pas, korek ok. 2 km",
        severity: "high",
        lat: 52.267,
        lng: 20.961,
    },
    {
        id: "3",
        title: "Zamknięcie mostu Śląsko-Dąbrowskiego",
        description: "Ruch pieszych utrzymany, objazdy obowiązują",
        severity: "low",
        lat: 52.248,
        lng: 21.017,
    },
];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const IncidentsMap: React.FC = () => {
    const [selected, setSelected] = useState<Incident | null>(null);

    const colorFor = (severity: Incident["severity"]) =>
        severity === "high" ? "red" : severity === "medium" ? "orange" : "yellow";

    return (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={11}>
                {sampleIncidents.map((incident) => (
                    <Marker
                        key={incident.id}
                        position={{ lat: incident.lat, lng: incident.lng }}
                        onClick={() => setSelected(incident)}
                        icon={{
                            url: `http://maps.google.com/mapfiles/ms/icons/${colorFor(
                                incident.severity
                            )}-dot.png`,
                        }}
                    />
                ))}

                {selected && (
                    <InfoWindow
                        position={{ lat: selected.lat, lng: selected.lng }}
                        onCloseClick={() => setSelected(null)}
                    >
                        <Card sx={{ minWidth: 250 }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    {selected.title}
                                </Typography>
                                <Typography variant="body2" sx={{ my: 1 }}>
                                    {selected.description}
                                </Typography>
                                <Chip
                                    label={`Poziom: ${selected.severity}`}
                                    color={
                                        selected.severity === "high"
                                            ? "error"
                                            : selected.severity === "medium"
                                                ? "warning"
                                                : "default"
                                    }
                                    size="small"
                                />
                            </CardContent>
                        </Card>
                    </InfoWindow>
                )}
            </GoogleMap>
        </LoadScript>
    );
};
