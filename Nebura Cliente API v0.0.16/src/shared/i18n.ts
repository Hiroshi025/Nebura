/**
 * @module i18n
 * @description
 * This module initializes and configures the i18next internationalization library
 * for the application, enabling multi-language support with file-system backend.
 *
 * It sets up language detection, namespace management, and backend loading for translation files.
 * The configuration is tailored for a Node.js environment using the `i18next-fs-backend` plugin.
 */

import i18next from "i18next";
import Backend from "i18next-fs-backend";

import { ProyectError } from "./utils/extends/error.extension";
import { logWithLabel } from "./utils/functions/console";

/**
 * Initializes i18next with the following configuration:
 *
 * - `fallbackLng`: Default language to use if the detected language is not available.
 * - `preload`: Array of supported languages to preload.
 * - `ns`: List of namespaces to load (e.g., 'common', 'errors').
 * - `defaultNS`: Default namespace to use for translation keys.
 * - `backend.loadPath`: Path pattern to load translation files from the filesystem.
 * - `detection`: Language detection options, including order and caching in cookies.
 * - `interpolation.escapeValue`: Disables escaping since the environment is considered safe.
 * - `saveMissing`: Enables saving of missing translation keys for later review.
 *
 * @see https://www.i18next.com/
 * @see https://github.com/i18next/i18next-fs-backend
 */
i18next
  .use(Backend)
  .init(
    {
      //debug: true,
      //fallbackLng: { en: ["en-US"], es: ["es-ES"], default: ["en-US"] },
      preload: ["en-US", "es-ES"], // Supported languages to preload
      cleanCode: true, // Clean language codes (e.g., 'en-US' to 'en')
      ns: ["common", "errors", "discord", "whatsapp"], // Namespaces to load
      defaultNS: "common", // Default namespace
      backend: {
        /**
         * Path to load translation files.
         * The placeholders `{{lng}}` and `{{ns}}` are replaced by the language code and namespace respectively.
         * Example: './src/locales/en/common.json'
         */
        loadPath: "./src/locales/{{lng}}/{{ns}}.json",
      },
      detection: {
        /**
         * Order in which language detection is attempted.
         * - 'header': Detect from HTTP headers.
         * - 'querystring': Detect from URL query parameters.
         * - 'cookie': Detect from browser cookies.
         */
        order: ["header", "querystring", "cookie"],
        /**
         * Specifies where to cache the detected language.
         * In this case, the language is cached in cookies.
         */
        caches: ["cookie"],
        /**
         * Cookie configuration for language caching.
         * - `path`: The path where the cookie is accessible.
         * - `httpOnly`: If false, the cookie is accessible via JavaScript.
         */
        cookieOptions: { path: "/", httpOnly: false },
      },
      interpolation: {
        /**
         * Disables escaping of values during interpolation.
         * This is safe in trusted environments (e.g., server-side rendering).
         */
        escapeValue: false,
      },
      /**
       * If true, missing translation keys will be sent to the backend for saving.
       */
      saveMissing: true
    },
    async (err, _t) => {
      if (err) throw new ProyectError("i18next initialization failed");
      logWithLabel(
        "custom",
        [
          "i18next initialized successfully with the following configuration:",
          `Supported languages: ${i18next.languages.join(", ")}`,
        ].join("\n"),
        {
          customLabel: "i18next",
        },
      );
    },
  );

/**
 * Exports the configured i18next instance for use throughout the application.
 */
export default i18next;
