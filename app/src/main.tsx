import React from "react";
import ReactDOM from "react-dom/client";
import {RouterProvider} from "react-router-dom";
import {router} from "./router";
import {AppThemeProvider} from "./ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AppThemeProvider>
            <RouterProvider router={router}/>
        </AppThemeProvider>
    </React.StrictMode>
);

