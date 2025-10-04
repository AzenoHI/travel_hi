export const ENV = {
    API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) ?? "https://localhost:5173/",
    GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string, // już używasz w projekcie
};
