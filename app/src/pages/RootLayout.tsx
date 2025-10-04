// src/pages/RootLayout.tsx
import {useState} from "react";
import {Link as RouterLink, Outlet} from "react-router-dom";
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "../common/Menu";
import ThemeControls from "../common/ThemeControls";

import Logo from "../assets/logo.jpg";

const drawerWidth = 179;

export function RootLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => setMobileOpen((p) => !p);

    const drawer = (
        <Box sx={{width: drawerWidth, display: "flex", flexDirection: "column", height: "100%"}}>
            <Box sx={{flex: 1, overflowY: "auto", mt: 1}}>
                <Menu/>
            </Box>
            <Box p={2} display={{xs: "block", md: "none"}}>
                <ThemeControls/>
            </Box>
        </Box>
    );

    return (
        <Box sx={{display: "flex"}}>
            <CssBaseline/>

            <AppBar position="fixed" sx={{zIndex: (t) => t.zIndex.drawer + 1}}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{mr: 2, display: {md: "none"}}}
                        aria-label="open navigation menu"
                    >
                        <MenuIcon/>
                    </IconButton>

                    <RouterLink
                        to="/"
                        style={{
                            flexGrow: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            textDecoration: "none",
                            width: "100%",
                        }}
                    >
                        <img
                            src={Logo}
                            alt="TravelHI logo"
                            style={{
                                height: 64,
                                width: "auto",
                                display: "block",
                                objectFit: "contain",
                                maxWidth: "80%",
                                marginLeft: "-24px"
                            }}
                        />
                    </RouterLink>

                    <Box display={{xs: "none", md: "flex"}}>
                        <ThemeControls/>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{width: {md: drawerWidth}, flexShrink: {md: 0}}} aria-label="navigation">
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{keepMounted: true}}
                    sx={{
                        display: {xs: "block", md: "none"},
                        "& .MuiDrawer-paper": {boxSizing: "border-box", width: drawerWidth},
                    }}
                >
                    {drawer}
                </Drawer>

                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: {xs: "none", md: "block"},
                        "& .MuiDrawer-paper": {boxSizing: "border-box", width: drawerWidth},
                    }}
                >
                    <Toolbar/>
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: {md: `calc(100% - ${drawerWidth}px)`},
                }}
            >
                <Toolbar/>
                <Outlet/>
            </Box>
        </Box>
    );
}