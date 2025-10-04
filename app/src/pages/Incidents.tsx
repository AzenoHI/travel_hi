import {Container, Stack, Typography} from "@mui/material";
import {ReportIncidentForm} from "../components/incidents/ReportIncidentForm";
import {IncidentsMap} from "../components/map/IncidentsMap";

import {LoadScript} from "@react-google-maps/api";


export default function Incidents() {
    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <Container maxWidth="md" sx={{py: 3}}>
                <Stack spacing={2}>
                    <Typography variant="h5" fontWeight={700}>
                        Travel HI
                    </Typography>
                    <ReportIncidentForm/>
                    {}
                    <IncidentsMap/>
                </Stack>
            </Container>
        </LoadScript>
    );
}
