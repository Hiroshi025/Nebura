// --- Multilenguaje y tema ---
// langData contiene los textos de la interfaz en español e inglés.
// Se utiliza para cambiar dinámicamente los textos según el idioma seleccionado.
const langData = {
  es: {
    agent: "Agente Gemini",
    config: "Configuración de Gemini",
    save: "Guardar configuración",
    text: "Texto",
    file: "Archivo",
    advanced: "Avanzado",
    doc: "Documentación",
    send: "Enviar",
    response: "Respuesta",
    processing: "Procesando...",
    configSaved: "Configuración guardada",
    noFile: "Selecciona un archivo",
    error: "Error",
    success: "Éxito",
    warning: "Advertencia",
    info: "Información",
    show: "Mostrar",
    hide: "Ocultar",
  },
  en: {
    agent: "Gemini Agent",
    config: "Gemini Configuration",
    save: "Save configuration",
    text: "Text",
    file: "File",
    advanced: "Advanced",
    doc: "Documentation",
    send: "Send",
    response: "Response",
    processing: "Processing...",
    configSaved: "Configuration saved",
    noFile: "Select a file",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    show: "Show",
    hide: "Hide",
  },
};

// currentLang almacena el idioma actual de la interfaz.
// Se obtiene de localStorage o por defecto es "es" (español).
let currentLang = localStorage.getItem("agentLang") || "es";

/**
 * setLang
 * Cambia el idioma de la interfaz y actualiza todos los textos visibles.
 * Guarda la preferencia en localStorage.
 * @param {string} lang - Código de idioma ("es" o "en")
 */
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("agentLang", lang);
  document.querySelectorAll(".language-switcher a").forEach((a) => a.classList.remove("active"));
  document.querySelector(`.language-switcher a[data-lang="${lang}"]`).classList.add("active");
  // Actualizar textos dinámicos
  document.getElementById("text-tab").innerHTML =
    `<i class="fa-solid fa-message me-2"></i>${langData[lang].text}`;
  document.getElementById("file-tab").innerHTML =
    `<i class="fa-solid fa-file-arrow-up me-2"></i>${langData[lang].file}`;
  document.getElementById("advanced-tab").innerHTML =
    `<i class="fa-solid fa-layer-group me-2"></i>${langData[lang].advanced}`;
  document.getElementById("doc-tab").innerHTML =
    `<i class="fa-solid fa-book me-2"></i>${langData[lang].doc}`;

  // Multilenguaje para configuración
  document.querySelector(".card-header").innerHTML =
    `<i class="fa-solid fa-gear me-2"></i>${langData[lang].config}`;
  document.querySelector('label[for="apiKey"]').textContent = "API Key";
  document.querySelector("input#apiKey").placeholder =
    lang === "es" ? "Tu API Key de Gemini" : "Your Gemini API Key";
  document.querySelector('label[for="model"]').textContent = lang === "es" ? "Modelo" : "Model";
  document.querySelector("input#model").placeholder =
    lang === "es" ? "Ej: gemini-pro" : "Ex: gemini-pro";
  document.querySelector('label[for="systemInstruction"]').textContent =
    lang === "es" ? "Instrucción del sistema (opcional)" : "System instruction (optional)";
  document.querySelector("input#systemInstruction").placeholder =
    lang === "es" ? "Ej: Sé conciso y profesional" : "Ex: Be concise and professional";
  document.querySelector('#geminiConfigForm button[type="submit"]').innerHTML =
    `<i class="fa-solid fa-floppy-disk me-2"></i>${langData[lang].save}`;

  // Tabs y formularios
  // Texto
  document.querySelector("#text .card-header").innerHTML =
    `<i class="fa-solid fa-message me-2"></i>${langData[lang].text === "Texto" ? "Procesar Texto" : "Process Text"}`;
  document.querySelector('label[for="textInput"]').textContent =
    lang === "es" ? "Texto a procesar" : "Text to process";
  document.getElementById("textInput").placeholder =
    lang === "es" ? "Escribe tu texto aquí..." : "Write your text here...";
  document.getElementById("textSubmitBtn").innerHTML =
    `<i class="fa-solid fa-paper-plane me-2"></i>${langData[lang].send}`;

  // Archivo
  document.querySelector("#file .card-header").innerHTML =
    `<i class="fa-solid fa-file-arrow-up me-2"></i>${langData[lang].file === "Archivo" ? "Procesar Archivo" : "Process File"}`;
  document.querySelector('label[for="fileInput"]').textContent =
    lang === "es" ? "Selecciona un archivo" : "Select a file";
  document.querySelector("#fileInput").nextElementSibling.textContent =
    lang === "es"
      ? "Formatos soportados: PDF, TXT, DOCX, PPTX, imágenes"
      : "Supported formats: PDF, TXT, DOCX, PPTX, images";
  document.querySelector('label[for="fileText"]').textContent =
    lang === "es" ? "Texto de contexto (opcional)" : "Context text (optional)";
  document.getElementById("fileText").placeholder =
    lang === "es" ? "Describe el archivo o tu petición" : "Describe the file or your request";
  document.getElementById("fileSubmitBtn").innerHTML =
    `<i class="fa-solid fa-paper-plane me-2"></i>${langData[lang].send}`;

  // Avanzado
  document.querySelector("#advanced .card-header").innerHTML =
    `<i class="fa-solid fa-layer-group me-2"></i>${lang === "es" ? "Texto + Archivo" : "Text + File"}`;
  document.querySelector('label[for="advText"]').textContent = lang === "es" ? "Texto" : "Text";
  document.getElementById("advText").placeholder =
    lang === "es" ? "Texto para combinar con archivo..." : "Text to combine with file...";
  document.querySelector('label[for="advFile"]').textContent = lang === "es" ? "Archivo" : "File";
  document.querySelector("#advFile").nextElementSibling.textContent =
    lang === "es"
      ? "Formatos soportados: PDF, TXT, DOCX, PPTX, imágenes"
      : "Supported formats: PDF, TXT, DOCX, PPTX, images";
  document.getElementById("advancedSubmitBtn").innerHTML =
    `<i class="fa-solid fa-paper-plane me-2"></i>${langData[lang].send}`;
}

// Asigna eventos a los botones de cambio de idioma.
// Permite al usuario alternar entre español e inglés.
document.querySelectorAll(".language-switcher a").forEach((a) => {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    setLang(this.dataset.lang);
  });
});

// Inicializa la interfaz con el idioma guardado o por defecto.
setLang(currentLang);

// --- Tema oscuro/claro ---

// themeSwitcher es el botón que permite alternar entre modo claro y oscuro.
// Cambia el atributo data-bs-theme en el elemento <html> y guarda la preferencia en localStorage.
const themeSwitcher = document.getElementById("themeSwitcher");
themeSwitcher.addEventListener("click", function () {
  const html = document.documentElement;
  if (html.getAttribute("data-bs-theme") === "dark") {
    html.setAttribute("data-bs-theme", "light");
    localStorage.setItem("agentTheme", "light");
    this.innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    html.setAttribute("data-bs-theme", "dark");
    localStorage.setItem("agentTheme", "dark");
    this.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
});

// Al cargar la página, aplica el tema guardado en localStorage.
const savedTheme = localStorage.getItem("agentTheme");
if (savedTheme) {
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
  themeSwitcher.innerHTML =
    savedTheme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

// --- Mostrar/Ocultar API Key ---

// toggleApiKey es el botón para mostrar u ocultar el valor del input de la API Key.
// Cambia el tipo del input entre "password" y "text".
const toggleApiKey = document.getElementById("toggleApiKey");
const apiKeyInput = document.getElementById("apiKey");
toggleApiKey.addEventListener("click", function () {
  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    this.innerHTML = `<i class="fa-solid fa-eye-slash"></i> ${langData[currentLang].hide}`;
  } else {
    apiKeyInput.type = "password";
    this.innerHTML = `<i class="fa-solid fa-eye"></i> ${langData[currentLang].show}`;
  }
});

// --- Guardar configuración de Gemini ---

// geminiConfigForm es el formulario donde el usuario ingresa su API Key, modelo e instrucción del sistema.
// Al enviar, guarda estos valores en localStorage y muestra un toast de confirmación.
const geminiConfigForm = document.getElementById("geminiConfigForm");
geminiConfigForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const apiKey = document.getElementById("apiKey").value;
  const model = document.getElementById("model").value;
  const systemInstruction = document.getElementById("systemInstruction").value;
  localStorage.setItem("geminiApiKey", apiKey);
  localStorage.setItem("geminiModel", model);
  localStorage.setItem("geminiSystemInstruction", systemInstruction);
  showToast(langData[currentLang].configSaved, "success");
});

// --- Cargar configuración guardada al iniciar la página ---

window.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("loaded");
  document.getElementById("apiKey").value = localStorage.getItem("geminiApiKey") || "";
  document.getElementById("model").value = localStorage.getItem("geminiModel") || "";
  document.getElementById("systemInstruction").value =
    localStorage.getItem("geminiSystemInstruction") || "";

  // Inicializa highlight.js para resaltar código en las respuestas.
  hljs.highlightAll();
});

/**
 * showToast
 * Muestra una notificación tipo toast en la esquina inferior derecha.
 * Usa Bootstrap Toasts. El color y el icono dependen del tipo (success, error, warning, info).
 * @param {string} msg - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ("success", "error", "warning", "info")
 * @see https://getbootstrap.com/docs/5.3/components/toasts/
 */
function showToast(msg, type = "info") {
  const toastEl = document.getElementById("notificationToast");
  const toastTitle = document.getElementById("toast-title");
  const toastBody = document.getElementById("toast-body");

  // Configurar según el tipo
  let icon = "";
  let bgClass = "";

  switch (type) {
    case "success":
      icon = '<i class="fa-solid fa-circle-check me-2"></i>';
      bgClass = "bg-success";
      toastTitle.textContent = langData[currentLang].success;
      break;
    case "error":
      icon = '<i class="fa-solid fa-circle-xmark me-2"></i>';
      bgClass = "bg-danger";
      toastTitle.textContent = langData[currentLang].error;
      break;
    case "warning":
      icon = '<i class="fa-solid fa-triangle-exclamation me-2"></i>';
      bgClass = "bg-warning";
      toastTitle.textContent = langData[currentLang].warning;
      break;
    default:
      icon = '<i class="fa-solid fa-circle-info me-2"></i>';
      bgClass = "bg-primary";
      toastTitle.textContent = langData[currentLang].info;
  }

  toastBody.innerHTML = icon + msg;
  toastEl.classList.add(bgClass, "text-white");

  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  // Limpiar después de mostrar
  setTimeout(() => {
    toastEl.classList.remove(bgClass, "text-white");
  }, 5000);
}

/**
 * processResponse
 * Procesa y muestra la respuesta del backend en la interfaz.
 * Convierte markdown a HTML usando marked.js, resalta código con highlight.js,
 * extrae enlaces y los muestra como botones.
 * @param {string} response - Respuesta del backend (puede ser markdown)
 * @param {HTMLElement} contentElement - Elemento donde se muestra el contenido
 * @param {HTMLElement} linksElement - Elemento donde se muestran los enlaces extraídos
 * @see https://marked.js.org/ y https://highlightjs.org/
 */
function processResponse(response, contentElement, linksElement) {
  // Limpiar elementos
  contentElement.innerHTML = "";
  linksElement.innerHTML = "";

  // Procesar markdown si es necesario
  let formattedResponse = response;
  try {
    formattedResponse = marked.parse(response);
  } catch (e) {
    console.log("No es markdown válido, mostrando texto plano");
  }

  // Establecer contenido
  contentElement.innerHTML = formattedResponse;

  // Resaltar código
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  // Extraer enlaces y crear botones
  const linkRegex = /https?:\/\/[^\s\)\]\}]+/g;
  const links = response.match(linkRegex) || [];

  // Crear botones para enlaces únicos
  const uniqueLinks = [...new Set(links)];
  uniqueLinks.forEach((link) => {
    const linkBtn = document.createElement("a");
    linkBtn.href = link;
    linkBtn.target = "_blank";
    linkBtn.rel = "noopener noreferrer";
    linkBtn.className = "response-link-btn";
    linkBtn.innerHTML = `<i class="fa-solid fa-up-right-from-square"></i> ${new URL(link).hostname}`;
    linksElement.appendChild(linkBtn);
  });

  // Mostrar la caja de respuesta
  contentElement.parentElement.classList.remove("d-none");
  contentElement.parentElement.classList.add("pulse");
}

/**
 * sendGeminiRequest
 * Envía una petición al endpoint de Gemini usando fetch.
 * Soporta envío de datos como JSON o como FormData (para archivos).
 * Añade cabeceras personalizadas para autenticación y modelo.
 * @param {string} endpoint - URL del endpoint
 * @param {object} data - Datos a enviar (texto, archivo, etc)
 * @param {boolean} isFile - Si es true, usa FormData (para archivos)
 * @returns {Promise<object>} - Respuesta del backend (JSON)
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
async function sendGeminiRequest(endpoint, data, isFile = false) {
  const apiKey = localStorage.getItem("geminiApiKey");
  const model = localStorage.getItem("geminiModel");
  const systemInstruction = localStorage.getItem("geminiSystemInstruction");

  if (!apiKey || !model) {
    showToast("Configura tu API Key y modelo primero", "error");
    return { error: "Configura tu API Key y modelo primero" };
  }

  let formData;
  let headers = {};

  if (isFile) {
    formData = new FormData();
    Object.keys(data).forEach((k) => formData.append(k, data[k]));
    formData.append("systemInstruction", systemInstruction || "");
  } else {
    formData = JSON.stringify({ ...data, systemInstruction });
    headers["Content-Type"] = "application/json";
  }

  headers["x-secret-customer"] = customerkey;
  headers["x-gemini-api-key"] = apiKey;
  headers["x-gemini-model"] = model;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: isFile ? formData : formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error en la solicitud");
    }

    const result = await res.json();
    return result;
  } catch (err) {
    console.error("Error en la solicitud:", err);
    return { error: err.message || "Error de red o servidor" };
  }
}

// --- Formularios de envío de texto, archivo y avanzado ---

// Formulario de texto plano
document.getElementById("textForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const text = document.getElementById("textInput").value;
  const responseBox = document.getElementById("textResponse");
  const contentElement = document.getElementById("textResponseContent");
  const linksElement = document.getElementById("textResponseLinks");
  const submitBtn = document.getElementById("textSubmitBtn");

  // Mostrar estado de carga
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="loading-spinner me-2"></span> ${langData[currentLang].processing}`;

  responseBox.classList.remove("d-none");
  contentElement.textContent = langData[currentLang].processing;

  const result = await sendGeminiRequest("/api/v1/service/google/model-ai/text", { text });

  // Restaurar botón
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> ${langData[currentLang].send}`;

  if (result.error) {
    showToast(result.error, "error");
    contentElement.textContent = result.error;
    return;
  }

  processResponse(result.response || result.error || "Sin respuesta", contentElement, linksElement);
});

// Formulario de archivo
document.getElementById("fileForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const text = document.getElementById("fileText").value;
  const responseBox = document.getElementById("fileResponse");
  const contentElement = document.getElementById("fileResponseContent");
  const linksElement = document.getElementById("fileResponseLinks");
  const submitBtn = document.getElementById("fileSubmitBtn");

  const file = fileInput.files[0];
  if (!file) {
    showToast(langData[currentLang].noFile, "error");
    return;
  }

  // Mostrar estado de carga
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="loading-spinner me-2"></span> ${langData[currentLang].processing}`;

  responseBox.classList.remove("d-none");
  contentElement.textContent = langData[currentLang].processing;

  const result = await sendGeminiRequest(
    "/api/v1/service/google/model-ai/file",
    { file, text },
    true,
  );

  // Restaurar botón
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> ${langData[currentLang].send}`;

  if (result.error) {
    showToast(result.error, "error");
    contentElement.textContent = result.error;
    return;
  }

  processResponse(result.response || result.error || "Sin respuesta", contentElement, linksElement);
});

// Formulario avanzado (texto + archivo)
document.getElementById("advancedForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const text = document.getElementById("advText").value;
  const fileInput = document.getElementById("advFile");
  const responseBox = document.getElementById("advancedResponse");
  const contentElement = document.getElementById("advancedResponseContent");
  const linksElement = document.getElementById("advancedResponseLinks");
  const submitBtn = document.getElementById("advancedSubmitBtn");

  const file = fileInput.files[0];
  if (!file) {
    showToast(langData[currentLang].noFile, "error");
    return;
  }

  // Mostrar estado de carga
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="loading-spinner me-2"></span> ${langData[currentLang].processing}`;

  responseBox.classList.remove("d-none");
  contentElement.textContent = langData[currentLang].processing;

  const result = await sendGeminiRequest(
    "/api/v1/service/google/model-ai/advanced",
    { text, file },
    true,
  );

  // Restaurar botón
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> ${langData[currentLang].send}`;

  if (result.error) {
    showToast(result.error, "error");
    contentElement.textContent = result.error;
    return;
  }

  processResponse(result.response || result.error || "Sin respuesta", contentElement, linksElement);
});

// --- Inicialización de tooltips de Bootstrap ---
// Permite mostrar información adicional al pasar el mouse sobre ciertos elementos.
// @see https://getbootstrap.com/docs/5.3/components/tooltips/
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});
