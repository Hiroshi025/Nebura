import i18next from "i18next";
import Backend from "i18next-fs-backend";

i18next
  .use(Backend)
  .init({
    fallbackLng: "en", // Idioma por defecto
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
    interpolation: {
      escapeValue: false, // No escapar valores (ya que se usa en un entorno seguro)
    },
    saveMissing: true, // Guardar traducciones faltantes
  });

export default i18next;
