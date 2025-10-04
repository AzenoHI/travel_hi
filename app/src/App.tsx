import { Container, Stack, Typography } from "@mui/material";
import { ReportIncidentForm } from "./components/incidents/ReportIncidentForm";
import { IncidentsMap } from "./components/map/IncidentsMap";
import "./App.css";

export default function App() {
    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Stack spacing={2}>
                <Typography variant="h5" fontWeight={700}>
                    Travel HI
                </Typography>
                <ReportIncidentForm />
                {}
                <IncidentsMap />
            </Stack>
        </Container>
    );
}
