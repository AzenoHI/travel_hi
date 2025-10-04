export type EventType = "CONCERT" | "HOLIDAY" | "SPORT" | "STRIKE" | "WEATHER" | "OTHER";
export type EventSeverity = 1 | 2 | 3; // LOW=1, MEDIUM=2, HIGH=3

export interface EventRead {
    id: number;
    name: string;
    description?: string | null;
    event_type: EventType;
    severity: EventSeverity;
    starts_at: string;
    ends_at: string;
    lat: number;
    lng: number;
    radius_m: number;
    location_name?: string | null;
    source?: string | null;
    carrier?: string | null;
    affected_lines?: string | null;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}