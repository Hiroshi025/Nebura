// --- SISTEMA DE IDIOMAS Y TEMA ---
const translations = {
  es: {
    error404: "Error 404 - No encontrado",
    error404Desc: "El recurso solicitado no existe o ha sido eliminado.",
    error403: "Error 403 - Acceso denegado",
    error403Desc: "No tienes permiso para acceder a este recurso.",
    error500: "Error 500 - Error del servidor",
    error500Desc: "Ocurrió un error inesperado en el servidor.",
    error400: "Error 400 - Solicitud incorrecta",
    error400Desc: "La solicitud enviada al servidor no es válida.",
    timeout: "Error - Tiempo de espera agotado",
    timeoutDesc: "La operación tardó demasiado tiempo en completarse.",
    homeBtn: "Volver al inicio",
    techDetailsTitle: "Detalles técnicos",
  },
  en: {
    error404: "Error 404 - Not found",
    error404Desc: "The requested resource does not exist or has been removed.",
    error403: "Error 403 - Access denied",
    error403Desc: "You do not have permission to access this resource.",
    error500: "Error 500 - Server error",
    error500Desc: "An unexpected error occurred on the server.",
    error400: "Error 400 - Bad request",
    error400Desc: "The request sent to the server is invalid.",
    timeout: "Error - Timeout",
    timeoutDesc: "The operation took too long to complete.",
    homeBtn: "Back to home",
    techDetailsTitle: "Technical details",
  },
};

const themeSwitch = document.getElementById("themeSwitch");
const themeIcon = document.querySelector('label[for="themeSwitch"] i');
const htmlElement = document.documentElement;
const langLinks = document.querySelectorAll(".lang-link");

// Loader helpers (¡esto soluciona el error!)
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// SVGs ilustrativos por tipo de error
// Elimina la inserción del SVG en error-illustration
const illustrations = {}; // vacío

function setLanguage(lang) {
  showLoader();
  setTimeout(() => {
    const t = translations[lang];
    // Detectar tipo de error
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") || "404";
    const message = params.get("message");
    const code = params.get("code") || `ERR_${type.toUpperCase()}`;

    // Elementos
    const errorTitle = document.getElementById("error-title");
    const errorCode = document.getElementById("error-code");
    const errorDescription = document.getElementById("error-description");
    const btnHome = document.getElementById("btn-home");
    const techDetailsTitle = document.querySelector(".error-details-title");

    // Traducción de título y descripción
    switch (type) {
      case "404":
        errorTitle.textContent = t.error404;
        errorDescription.textContent = message ? decodeURIComponent(message) : t.error404Desc;
        break;
      case "403":
        errorTitle.textContent = t.error403;
        errorDescription.textContent = message ? decodeURIComponent(message) : t.error403Desc;
        break;
      case "500":
        errorTitle.textContent = t.error500;
        errorDescription.textContent = message ? decodeURIComponent(message) : t.error500Desc;
        break;
      case "400":
        errorTitle.textContent = t.error400;
        errorDescription.textContent = message ? decodeURIComponent(message) : t.error400Desc;
        break;
      case "timeout":
        errorTitle.textContent = t.timeout;
        errorDescription.textContent = message ? decodeURIComponent(message) : t.timeoutDesc;
        break;
      default:
        errorTitle.textContent = t.error404;
        errorDescription.textContent = message ? decodeURIComponent(message) : t.error404Desc;
    }
    errorCode.textContent = code;
    btnHome.querySelector('span[data-key="homeBtn"]').textContent = t.homeBtn;
    if (techDetailsTitle) techDetailsTitle.textContent = t.techDetailsTitle;

    // Ilustración y mascota
    const illu = illustrations[type] || illustrations["404"];
    // document.getElementById('error-illustration').innerHTML = illu;
    // Mascota SVG ya está embebida, pero podrías cambiar colores aquí si lo deseas
    // ...existing code...
    hideLoader();
  }, 400); // Simula carga
}

function updateThemeIcon(theme) {
  themeIcon.classList.toggle("fa-moon", theme === "light");
  themeIcon.classList.toggle("fa-sun", theme === "dark");
}

function applyTheme(theme) {
  htmlElement.setAttribute("data-bs-theme", theme);
  themeSwitch.checked = theme === "dark";
  updateThemeIcon(theme);
  localStorage.setItem("theme", theme);
}

langLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    setLanguage(link.getAttribute("data-lang"));
  });
});

themeSwitch.addEventListener("change", () => {
  showLoader();
  setTimeout(() => {
    const newTheme = themeSwitch.checked ? "dark" : "light";
    applyTheme(newTheme);
    hideLoader();
  }, 400);
});

// --- Lógica de error (adaptada para idioma) ---
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar tema e idioma
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);
  const savedLang =
    localStorage.getItem("language") || (navigator.language.startsWith("en") ? "en" : "es");
  setLanguage(savedLang);

  // Mostrar detalles técnicos en entorno de desarrollo
  const params = new URLSearchParams(window.location.search);
  const errorDetails = document.getElementById("error-details");
  const errorDetailsContent = document.getElementById("error-details-content");
  function showTechnicalDetails() {
    const paramsObj = Object.fromEntries(params.entries());
    const details = {
      URL: window.location.href,
      "User Agent": navigator.userAgent,
      Plataforma: navigator.platform,
      Fecha: new Date().toISOString(),
      Parámetros:
        Object.keys(paramsObj).length > 0
          ? `<pre>${JSON.stringify(paramsObj, null, 2)}</pre>`
          : "Ninguno",
    };
    let detailsText = "";
    for (const [key, value] of Object.entries(details)) {
      detailsText += `<strong>${key}:</strong> ${value}<br>`;
    }
    errorDetailsContent.innerHTML = detailsText;
    errorDetails.style.display = "block";
  }
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    showTechnicalDetails();
  }
});

// Easter egg: presiona secuencia "N-E-B-U-R-A"
let eggSeq = [],
  eggCode = [78, 69, 66, 85, 82, 65];
document.addEventListener("keydown", (e) => {
  eggSeq.push(e.keyCode);
  if (eggSeq.slice(-6).toString() === eggCode.toString()) {
    document.getElementById("easter-egg").style.display = "block";
  }
});

// Accesibilidad: enfocar elementos clave con Tab
// ...existing code...
