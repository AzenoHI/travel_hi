import type {EventRead, EventType, EventSeverity} from "../types/Event";

export async function getEventsAround(
    at: Date,
    thresholdHours: number = 3,
    options?: {
        eventType?: EventType;
        severity?: EventSeverity;
        isVerified?: boolean;
        limit?: number;
        offset?: number;
    }
): Promise<EventRead[]> {
    const params = new URLSearchParams({
        at: at.toISOString(),
        threshold_hours: thresholdHours.toString(),
        limit: (options?.limit ?? 200).toString(),
        offset: (options?.offset ?? 0).toString(),
    });

    if (options?.eventType) params.append("event_type", options.eventType);
    if (options?.severity !== undefined) params.append("severity", options.severity.toString());
    if (options?.isVerified !== undefined) params.append("is_verified", String(options.isVerified));

    const resp = await fetch(`/api/v1/events/around?${params.toString()}`);
    if (!resp.ok) {
        throw new Error(`Failed to fetch events: ${resp.status} ${resp.statusText}`);
    }

    const data: EventRead[] = await resp.json();
    return data;
}