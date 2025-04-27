"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
i18next_1.default
    .use(i18next_fs_backend_1.default)
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
exports.default = i18next_1.default;
