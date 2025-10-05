import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Stack,
    Snackbar,
    Alert,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ENV } from "../config/env";

// 🧩 Walidacja danych — enterprise level (pełna kontrola)
const schema = z
    .object({
        email: z.string().email("Nieprawidłowy adres e-mail"),
        password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
        confirmPassword: z.string(),
        fullName: z.string().min(3, "Podaj pełne imię i nazwisko"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Hasła muszą być identyczne",
        path: ["confirmPassword"],
    });

type FormValues = z.infer<typeof schema>;

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState<{
        open: boolean;
        msg: string;
        severity: "success" | "error";
    }>({ open: false, msg: "", severity: "success" });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
    });

    const onSubmit = async (values: FormValues) => {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/users/user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                    username: values.fullName,
                }),
            });
            console.log(await res.json());
            if (!res.ok) throw new Error("Nie udało się zarejestrować użytkownika.");
            setToast({
                open: true,
                msg: "Rejestracja zakończona pomyślnie 🎉",
                severity: "success",
            });

            reset();
        } catch (err: any) {
            setToast({ open: true, msg: err.message, severity: "error" });
            console.error(err);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                minHeight: "100vh",
                pt: 8,


            }}
        >
            <Card sx={{ maxWidth: 420, width: "100%", p: 3, boxShadow: 5 }}>
                <CardContent>
                    <Typography variant="h5" fontWeight={700} align="center" mb={3}>
                        Załóż konto 🚆
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="Nazwa użytkownika"
                                {...register("fullName")}
                                error={!!errors.fullName}
                                helperText={errors.fullName?.message}
                                fullWidth
                            />

                            <TextField
                                label="Adres e-mail"
                                {...register("email")}
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                fullWidth
                            />

                            <TextField
                                label="Hasło"
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                fullWidth
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword((p) => !p)}>
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="Powtórz hasło"
                                type="password"
                                {...register("confirmPassword")}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                                fullWidth
                            />

                            <Button
                                variant="contained"
                                type="submit"
                                disabled={isSubmitting}
                                fullWidth
                            >
                                {isSubmitting ? "Rejestrowanie..." : "Zarejestruj się"}
                            </Button>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={toast.severity}
                    onClose={() => setToast((t) => ({ ...t, open: false }))}
                >
                    {toast.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
