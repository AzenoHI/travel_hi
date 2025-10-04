// Intro.tsx
import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  Alert,
} from "@mui/material";

type TransportMode = "walk" | "bike" | "car" | "train" | "unknown";

type Sample = {
  ts: number;          // ms
  lat: number;
  lng: number;
  speedFromAPI?: number | null; // m/s (z navigator.geolocation)
};

type DetectResult = {
  mode: TransportMode;
  speedKmh: number; // estymata
  samples: Sample[];
};

type IntroProps = {
  onDetectComplete: (result: DetectResult) => void;
  onManualDefine: () => void;
  // opcjonalnie: ile sekund zbierać próbki (domyślnie 12)
  detectSeconds?: number;
};

export default function Intro({
  onDetectComplete,
  onManualDefine,
  detectSeconds = 12,
}: IntroProps) {
  const [detecting, setDetecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const samplesRef = React.useRef<Sample[]>([]);
  const watchIdRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    // cleanup watch/timer przy odmontowaniu
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const startDetect = () => {
    setError(null);
    setDetecting(true);
    setProgress(0);
    samplesRef.current = [];

    if (!("geolocation" in navigator)) {
      setError("Twoja przeglądarka nie obsługuje geolokalizacji.");
      setDetecting(false);
      return;
    }

    // Postęp „czasowy” – zbieramy próbki przez detectSeconds
    let elapsed = 0;
    timerRef.current = window.setInterval(() => {
      elapsed += 0.5;
      setProgress(Math.min(100, Math.round((elapsed / detectSeconds) * 100)));
      if (elapsed >= detectSeconds) {
        stopAndEstimate();
      }
    }, 500);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        samplesRef.current.push({
          ts: Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speedFromAPI: Number.isFinite(pos.coords.speed) ? pos.coords.speed : null, // m/s
        });
      },
      (err) => {
        setError(`Błąd lokalizacji: ${err.message}`);
        stopAll();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  const stopAll = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDetecting(false);
    setProgress(0);
  };

  const stopAndEstimate = () => {
    // zatrzymaj zbieranie i policz wynik
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const samples = samplesRef.current;
    if (samples.length < 2) {
      setError("Zbyt mało próbek, spróbuj ponownie (wyjdź na otwartą przestrzeń).");
      setDetecting(false);
      return;
    }

    const speedKmh = estimateSpeedKmh(samples);
    const mode = classifyMode(speedKmh);

    setDetecting(false);
    onDetectComplete({ mode, speedKmh, samples });
  };

  return (
    <Box display="grid" justifyContent="center" p={3}>
      <Box maxWidth={720}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Witaj w TravelHI
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Wybierz, czy chcesz <strong>wykryć podróż automatycznie</strong>, czy{" "}
          <strong>zdefiniować ją ręcznie</strong>. W trybie wykrywania pobierzemy lokalizację
          i oszacujemy prędkość, aby określić środek transportu (HI — Hybrid Intelligence).
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Wykrywanie */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6">Wykryj podróż (automatycznie)</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Uruchomimy geolokalizację i zbadamy prędkość ruchu, aby określić:
                pieszo / rower / auto / pociąg.
              </Typography>

              {detecting ? (
                <Box
                  mt={3}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  aria-live="polite"
                >
                  <CircularProgress />
                  <Box>
                    <Typography>Wykrywanie w toku…</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Postęp: {progress}%
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                  Uwaga: potrzebna zgoda na lokalizację. Dane są używane tylko do estymacji trybu.
                </Typography>
              )}
            </CardContent>
            <CardActions>
              {!detecting ? (
                <Button variant="contained" onClick={startDetect}>
                  Wykryj podróż
                </Button>
              ) : (
                <Button variant="outlined" onClick={stopAll}>
                  Przerwij
                </Button>
              )}
            </CardActions>
          </Card>

          {/* Ręczna definicja */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6">Zdefiniuj podróż (ręcznie)</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Sam określ trasę, czas i środek transportu — idealne, gdy nie chcesz używać GPS.
              </Typography>
            </CardContent>
            <CardActions>
              <Button variant="text" onClick={onManualDefine}>
                Przejdź do definiowania
              </Button>
            </CardActions>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

/* ================== helpers ================== */

/** Haversine distance in meters */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Szacuje prędkość na podstawie mediany z:
 *  - API speed (m/s), jeśli dostępna,
 *  - oraz prędkości policzonej z dystansu między próbkami.
 *  Zwraca km/h.
 */
function estimateSpeedKmh(samples: Sample[]): number {
  const speedsMs: number[] = [];

  // z API
  for (const s of samples) {
    if (typeof s.speedFromAPI === "number" && isFinite(s.speedFromAPI) && s.speedFromAPI >= 0) {
      speedsMs.push(s.speedFromAPI);
    }
  }

  // z dystansu między kolejnymi próbkami
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dt = (b.ts - a.ts) / 1000; // s
    if (dt <= 0) continue;
    const dist = haversineMeters(a.lat, a.lng, b.lat, b.lng); // m
    const v = dist / dt; // m/s
    if (isFinite(v) && v >= 0) speedsMs.push(v);
  }

  if (speedsMs.length === 0) return 0;

  // mediana jako estymator odporny
  speedsMs.sort((x, y) => x - y);
  const mid = Math.floor(speedsMs.length / 2);
  const medianMs =
    speedsMs.length % 2 === 0 ? (speedsMs[mid - 1] + speedsMs[mid]) / 2 : speedsMs[mid];

  return medianMs * 3.6; // km/h
}

/** Prosty klasyfikator trybu na bazie prędkości (km/h) */
function classifyMode(speedKmh: number): TransportMode {
  if (!isFinite(speedKmh) || speedKmh <= 0) return "unknown";
  if (speedKmh < 6) return "walk";             // ~1.5 m/s
  if (speedKmh < 20) return "bike";            // hulajnoga/rower
  if (speedKmh < 90) return "car";             // auto/bus miejski
  return "train";                               // pociąg/autostrada (heurystyka)
}