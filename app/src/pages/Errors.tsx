import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RootErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Błąd {error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }
  console.error(error);
  return <div>Ups! Coś poszło nie tak.</div>;
}