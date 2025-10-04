import {createBrowserRouter, redirect} from "react-router-dom";

function isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
}


export async function protectedLoader() {
    if (!isAuthenticated()) {
        throw redirect("/login?next=/dashboard");
    }
    return null;
}

export async function rootLoader() {
    const user = isAuthenticated() ? {name: "Paweł"} : null;
    return {user};
}

export const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        loader: rootLoader,
        lazy: async () => {
            const mod = await import("./pages/RootLayout");
            const err = await import("./pages/Errors");
            return {Component: mod.RootLayout, ErrorBoundary: err.RootErrorBoundary};
        },
        children: [
            {
                index: true,
                lazy: async () => {
                    const mod = await import("./pages/Intro");
                    return {Component: mod.default};
                },
            },
            {
                path: "dashboard",
                index: true,
                lazy: async () => {
                    const mod = await import("./pages/Home");
                    return {Component: mod.default};
                },
            },
            {
                path: "incidents",
                index: true,
                lazy: async () => {
                    const mod = await import("./pages/Incidents");
                    return {Component: mod.default};
                },
            },
            {
                path: "debug",
                index: true,
                lazy: async () => {
                    const mod = await import("./pages/GeoDebug");
                    return {Component: mod.default};
                },
            },
            {
                path: "*",
                lazy: async () => {
                    const mod = await import("./pages/NotFound");
                    return {Component: mod.default};
                },
            },
        ],
    },
]);