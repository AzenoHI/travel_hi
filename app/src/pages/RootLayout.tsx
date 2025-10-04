import { Link, NavLink, Outlet, useRouteLoaderData } from "react-router-dom";

export function RootLayout() {
  const data = useRouteLoaderData("root") as { user: { name: string } | null } | undefined;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: 700 }}>Travel Hi</Link>
        <nav style={{ display: "flex", gap: 12 }}>
          <NavLink to="/" end>Intro</NavLink>
          <NavLink to="/dashboard">Home</NavLink>
          <NavLink to="/incidents">Incidents</NavLink>
          <NavLink to="/debug">Debug</NavLink>
        </nav>
        <div style={{ marginLeft: "auto" }}>
          {data?.user ? `Witaj, ${data.user.name}` : <NavLink to="/login">Zaloguj</NavLink>}
        </div>
      </header>
      <main style={{ marginTop: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}