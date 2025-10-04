import {List, ListItemButton, ListItemText, Divider} from "@mui/material";
import {Link as RouterLink} from "react-router-dom";

export default function Menu() {
    return (
        <List>
            <ListItemButton component={RouterLink} to="/">
                <ListItemText primary="Strona główna"/>
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/events">
                <ListItemText primary="Wydarzenia"/>
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/travel">
                <ListItemText primary="Twoja podróż"/>
            </ListItemButton>
            <Divider/>
            <ListItemButton component={RouterLink} to="/debug">
                <ListItemText primary="O projekcie"/>
            </ListItemButton>
        </List>
    );
}