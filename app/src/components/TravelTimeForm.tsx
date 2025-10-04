import * as React from "react";
import {
    Box,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Typography,
    Button,
    TextField,
    Checkbox,
    LinearProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Chip,
    Stack,
    Divider, type SelectChangeEvent, Container,
} from "@mui/material";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {pl} from "date-fns/locale";
import {getEventsAround} from "../services/eventService";
import type {EventRead, EventSeverity, EventType} from "../types/Event";
import {IncidentsMap} from "./map/IncidentsMap.tsx";

type TravelTimeFormProps = {
    onSubmit?: (data: { date: Date | null; mode: "departure" | "arrival" }) => void;
};

export default function TravelTimeForm({onSubmit}: TravelTimeFormProps) {
    const [date, setDate] = React.useState<Date | null>(new Date());
    const [mode, setMode] = React.useState<"departure" | "arrival">("departure");

    // filtry do pobierania
    const [thresholdHours, setThresholdHours] = React.useState<number>(3);
    const [eventType, setEventType] = React.useState<EventType | "">("");
    const [severity, setSeverity] = React.useState<EventSeverity | "">("");
    const [isVerified, setIsVerified] = React.useState<boolean>(false);

    // stan wyników
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [events, setEvents] = React.useState<EventRead[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit?.({date, mode});

        if (!date) {
            setError("Wybierz datę i godzinę.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getEventsAround(date, thresholdHours, {
                eventType: eventType || undefined,
                severity: (severity as EventSeverity) || undefined,
                isVerified: isVerified ? true : undefined,
                limit: 200,
                offset: 0,
            });
            setEvents(data);
        } catch (err: any) {
            setError(err?.message ?? "Nie udało się pobrać wydarzeń");
        } finally {
            setLoading(false);
        }
    };

    const handleEventTypeChange = (e: SelectChangeEvent) => {
        setEventType((e.target.value || "") as EventType | "");
    };

    const handleSeverityChange = (e: SelectChangeEvent) => {
        const v = e.target.value;
        setSeverity((v === "" ? "" : Number(v)) as EventSeverity | "");
    };

    return (
        <>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    display="flex"
                    flexDirection="column"
                    gap={3}
                    maxWidth={720}
                >
                    <Typography variant="h6">Czas podróży</Typography>

                    <DateTimePicker
                        label="Data i godzina"
                        value={date}
                        onChange={(newDate) => setDate(newDate)}
                        slotProps={{
                            textField: {fullWidth: true, required: true},
                        }}
                    />

                    <RadioGroup
                        row
                        value={mode}
                        onChange={(e) => setMode(e.target.value as "departure" | "arrival")}
                    >
                        <FormControlLabel value="departure" control={<Radio/>} label="Odjazd"/>
                        <FormControlLabel value="arrival" control={<Radio/>} label="Przyjazd"/>
                    </RadioGroup>

                    <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                        <TextField
                            label="Próg (± godziny)"
                            type="number"
                            inputProps={{min: 1, max: 24}}
                            value={thresholdHours}
                            onChange={(e) => setThresholdHours(Number(e.target.value))}
                            sx={{width: {xs: "100%", sm: 180}}}
                        />

                        <FormControl sx={{minWidth: 180}}>
                            <InputLabel id="etype-label">Typ zdarzenia</InputLabel>
                            <Select
                                labelId="etype-label"
                                value={eventType}
                                label="Typ zdarzenia"
                                onChange={handleEventTypeChange}
                            >
                                <MenuItem value="">Dowolny</MenuItem>
                                <MenuItem value="CONCERT">CONCERT</MenuItem>
                                <MenuItem value="HOLIDAY">HOLIDAY</MenuItem>
                                <MenuItem value="SPORT">SPORT</MenuItem>
                                <MenuItem value="STRIKE">STRIKE</MenuItem>
                                <MenuItem value="WEATHER">WEATHER</MenuItem>
                                <MenuItem value="OTHER">OTHER</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{minWidth: 160}}>
                            <InputLabel id="sev-label">Istotność</InputLabel>
                            <Select
                                labelId="sev-label"
                                value={severity === "" ? "" : String(severity)}
                                label="Istotność"
                                onChange={handleSeverityChange}
                            >
                                <MenuItem value="">Dowolna</MenuItem>
                                <MenuItem value="3">HIGH</MenuItem>
                                <MenuItem value="2">MEDIUM</MenuItem>
                                <MenuItem value="1">LOW</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isVerified}
                                    onChange={(e) => setIsVerified(e.target.checked)}
                                />
                            }
                            label="Tylko zweryfikowane"
                        />
                    </Stack>

                    <Button type="submit" variant="contained" size="large">
                        Pokaż zdarzenia
                    </Button>

                    {loading && <LinearProgress/>}

                    {error && <Alert severity="error">{error}</Alert>}

                    {events.length > 0 && (
                        <>
                            <Divider/>
                            <Typography variant="subtitle1">
                                Zdarzenia ({events.length})
                            </Typography>
                            <List dense>
                                {events.map((e) => (
                                    <ListItem key={e.id} alignItems="flex-start" divider>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography fontWeight={600}>{e.name}</Typography>
                                                    <Chip size="small" label={e.event_type}/>
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            e.severity === 3 ? "HIGH" : e.severity === 2 ? "MEDIUM" : "LOW"
                                                        }
                                                    />
                                                    {e.is_verified && <Chip size="small" label="VERIFIED"/>}
                                                </Stack>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" component="span">
                                                        {new Date(e.starts_at).toLocaleString()} —{" "}
                                                        {new Date(e.ends_at).toLocaleString()}
                                                    </Typography>
                                                    {e.location_name ? (
                                                        <Typography variant="body2" component="span">
                                                            {" · "} {e.location_name}
                                                        </Typography>
                                                    ) : null}
                                                    {e.description ? (
                                                        <Typography variant="body2" display="block" sx={{mt: 0.5}}>
                                                            {e.description}
                                                        </Typography>
                                                    ) : null}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            Brak wyników — wybierz datę i kliknij „Pokaż zdarzenia”.
                        </Typography>
                    )}
                </Box>
            </LocalizationProvider>

            <Container maxWidth="lg" sx={{py: 3}}>
                <Typography variant="h5" fontWeight={700} sx={{mb: 2}}>
                    Travel HI — Mapa utrudnień
                </Typography>
                <IncidentsMap/>
            </Container></>
    );
}