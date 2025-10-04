import React, { useEffect, useState } from "react";

type GeoData = {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
};

export default function GeoDebug() {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Twoja przeglądarka nie obsługuje geolokalizacji.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy, // metry
          speed: pos.coords.speed ?? null, // m/s lub null
        });
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Odmówiono dostępu do lokalizacji.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Pozycja niedostępna.");
            break;
          case err.TIMEOUT:
            setError("Przekroczono czas oczekiwania na lokalizację.");
            break;
          default:
            setError(`Błąd: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000, // używaj danych max 1s
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Debug geolokalizacji</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {geo ? (
        <ul>
          <li>Lat: {geo.lat.toFixed(6)}</li>
          <li>Lng: {geo.lng.toFixed(6)}</li>
          <li>Dokładność: {geo.accuracy} m</li>
          <li>
            Prędkość:{" "}
            {geo.speed !== null
              ? `${(geo.speed * 3.6).toFixed(1)} km/h`
              : "brak danych"}
          </li>
        </ul>
      ) : (
        !error && <p>Oczekiwanie na dane lokalizacji…</p>
      )}
    </div>
  );
}