import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
    Snackbar,
    Alert,
    Avatar,
    IconButton,
} from "@mui/material";

import TrainIcon from "@mui/icons-material/Train";
import ConstructionIcon from "@mui/icons-material/Construction";
import BlockIcon from "@mui/icons-material/Block";
import EngineeringIcon from "@mui/icons-material/Engineering";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import { MapLocationPicker } from "../map/MapLocationPicker";
import { ENV } from "../../config/env";

const MAX_IMAGE_MB = 5;

// 📘 Schema walidacji
const schema = z.object({
    type: z.enum(["accident", "roadwork", "closure", "police", "other"]),
    lat: z.coerce.number().refine(Number.isFinite, "Wymagana lokalizacja"),
    lng: z.coerce.number().refine(Number.isFinite, "Wymagana lokalizacja"),
    photo: z
        .union([z.instanceof(File), z.null()])
        .optional()
        .nullable()
        .superRefine((f, ctx) => {
            if (!f) return;
            if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Zdjęcie do ${MAX_IMAGE_MB} MB`,
                });
            }
            if (!f.type.startsWith("image/")) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Dozwolone wyłącznie pliki graficzne",
                });
            }
        }),
});

type FormValues = z.infer<typeof schema>;

export const ReportIncidentForm: React.FC = () => {
    const [toast, setToast] = useState<{
        open: boolean;
        msg: string;
        severity: "success" | "error";
    }>({
        open: false,
        msg: "",
        severity: "success",
    });

    const [preview, setPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: {
            type: "other",
            lat: 0,
            lng: 0,
            photo: null,
        },
        mode: "onBlur",
    });

    const lat = watch("lat");
    const lng = watch("lng");
    const type = watch("type");
    const photoWatch = watch("photo");

    // 🧹 Czyść preview po zmianie
    useEffect(() => {
        if (!photoWatch) setPreview(null);
    }, [photoWatch]);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    // 📍 Pobierz lokalizację z przeglądarki
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setToast({
                open: true,
                msg: "Twoja przeglądarka nie obsługuje geolokalizacji.",
                severity: "error",
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setValue("lat", latitude, { shouldValidate: true });
                setValue("lng", longitude, { shouldValidate: true });
                setToast({
                    open: true,
                    msg: "Lokalizacja ustawiona ✅",
                    severity: "success",
                });
            },
            (err) => {
                console.error(err);
                setToast({
                    open: true,
                    msg: `Nie udało się pobrać lokalizacji (${err.code}: ${err.message}).`,
                    severity: "error",
                });
            }
        );
    };

    // 🗺️ Zmiana lokalizacji z mapy
    const onPickLocation = (p: { lat: number; lng: number }) => {
        setValue("lat", p.lat, { shouldValidate: true });
        setValue("lng", p.lng, { shouldValidate: true });
    };

    // 📸 Obsługa zdjęcia
    const photoInputProps = useMemo(
        () => ({
            accept: "image/*",
            onClick: (e: React.MouseEvent<HTMLInputElement>) => {
                (e.currentTarget as HTMLInputElement).value = "";
            },
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] ?? null;
                setValue("photo", file, { shouldValidate: true });
                if (file) {
                    const url = URL.createObjectURL(file);
                    setPreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return url;
                    });
                } else {
                    setPreview(null);
                }
            },
        }),
        [setValue]
    );

    // 🚀 Wysłanie formularza
    const onSubmit = async (values: FormValues) => {
        try {
            const fd = new FormData();
            fd.append("type", values.type);
            fd.append("lat", String(values.lat));
            fd.append("lng", String(values.lng));
            const file = values.photo ?? null;
            if (file) fd.append("photo", file);

            const res = await fetch(`${ENV.API_BASE_URL}/incidents`, {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }

            setToast({ open: true, msg: "Zgłoszono.", severity: "success" });
            reset();
            setPreview(null);
        } catch (e: any) {
            setToast({
                open: true,
                msg: e?.message ?? "Nie udało się wysłać zgłoszenia.",
                severity: "error",
            });
        }
    };

    // 🚆 Typy zdarzeń — kolejowe
    const incidentTypes = [
        {
            value: "accident" as const,
            label: "Wypadek na torach",
            icon: <TrainIcon />,
            color: "#d32f2f",
        },
        {
            value: "roadwork" as const,
            label: "Roboty na torach",
            icon: <ConstructionIcon />,
            color: "#f57c00",
        },
        {
            value: "closure" as const,
            label: "Zamknięcie toru",
            icon: <BlockIcon />,
            color: "#616161",
        },
        {
            value: "police" as const,
            label: "Popsuta lokomotywa",
            icon: <EngineeringIcon />,
            color: "#1976d2",
        },
        {
            value: "other" as const,
            label: "Inne",
            icon: <ReportProblemIcon />,
            color: "#757575",
        },
    ];

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    Zgłoś utrudnienie kolejowe 🚆
                </Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <input type="hidden" {...register("type")} />

                    <Stack spacing={3}>
                        {/* Typ (ikony) */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Wybierz typ zdarzenia:
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={3}
                                justifyContent="center"
                                flexWrap="wrap"
                                sx={{ rowGap: 2 }}
                            >
                                {incidentTypes.map((item) => (
                                    <Box
                                        key={item.value}
                                        textAlign="center"
                                        sx={{ width: 90 }}
                                    >
                                        <IconButton
                                            aria-label={item.label}
                                            aria-pressed={type === item.value}
                                            onClick={() =>
                                                setValue("type", item.value, { shouldValidate: true })
                                            }
                                            sx={{
                                                backgroundColor: type === item.value ? item.color : "#f5f5f5",
                                                color: type === item.value ? "white" : "black",
                                                width: 70,
                                                height: 70,
                                                borderRadius: "50%",
                                                transition: "transform 0.2s ease",
                                                "&:hover": {
                                                    transform: "scale(1.05)",
                                                    backgroundColor: type === item.value ? item.color : "#e0e0e0",
                                                },
                                            }}
                                        >
                                            {item.icon}
                                        </IconButton>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: "block",
                                                mt: 0.5,
                                                fontWeight: type === item.value ? 600 : 400,
                                                color: type === item.value ? item.color : "text.secondary",
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                            {errors.type && (
                                <Typography variant="caption" color="error" textAlign="center" display="block">
                                    {String(errors.type.message)}
                                </Typography>
                            )}
                        </Box>

                        {/* Lokalizacja (mapa/GPS) */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="subtitle1">Wybierz lokalizację:</Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleUseMyLocation}
                                    sx={{ textTransform: "none" }}
                                >
                                    📍 Użyj mojej lokalizacji
                                </Button>
                            </Stack>

                            <MapLocationPicker
                                value={
                                    Number.isFinite(lat) && Number.isFinite(lng)
                                        ? { lat, lng }
                                        : null
                                }
                                onChange={onPickLocation}
                                height={300}
                            />
                            {(errors.lat || errors.lng) && (
                                <Typography variant="caption" color="error">
                                    Wybierz lokalizację na mapie lub użyj GPS.
                                </Typography>
                            )}
                        </Box>

                        {/* Zdjęcie */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button variant="outlined" component="label">
                                Dodaj zdjęcie (opcjonalnie)
                                <input type="file" hidden {...photoInputProps} />
                            </Button>
                            {preview && (
                                <Avatar variant="rounded" src={preview} sx={{ width: 64, height: 64 }} />
                            )}
                        </Stack>
                        {errors.photo && (
                            <Typography variant="caption" color="error">
                                {String(errors.photo.message)}
                            </Typography>
                        )}

                        {/* Submit */}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button type="submit" variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? "Wysyłanie..." : "Zgłoś utrudnienie"}
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </CardContent>

            {/* Toast */}
            <Snackbar
                open={toast.open}
                autoHideDuration={2500}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={toast.severity}
                    onClose={() => setToast((t) => ({ ...t, open: false }))}
                >
                    {toast.msg}
                </Alert>
            </Snackbar>
        </Card>
    );
};
