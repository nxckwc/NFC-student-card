// src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto archivos estáticos y APIs
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};