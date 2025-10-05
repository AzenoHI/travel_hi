export type Severity = "low" | "medium" | "high";

export interface Incident {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    lat: number;
    lng: number;
}

export type IncidentType = "accident" | "roadwork" | "closure" | "other";


export interface NewIncidentPayload {
    type: IncidentType;
    description: string;
    lat: number;
    lng: number;
}