import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "es"], // Pre-cargar idiomas soportados
    ns: ["common", "errors"], // Definir namespaces
    defaultNS: "common", // Namespace por defecto
    backend: {
      loadPath: "./src/locales/{{lng}}/{{ns}}.json", // Ruta mejorada para namespaces
    },
    detection: {
      order: ["header", "querystring", "cookie"], // Añadir 'cookie' al orden de detección
      caches: ["cookie"], // Cachear en cookies
      cookieOptions: { path: "/", httpOnly: false }, // Configuración de cookies
    },
  });

export default i18next;
