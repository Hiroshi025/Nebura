// --- MULTILENGUAJE ---
const translations = {
  es: {
    supportTitle: "Soporte",
    ticketsTab: "Tickets",
    chatTab: "Chat Global",
    transcriptsTab: "Transcripciones",
    systemStatus: "Estado del Sistema",
    connecting: "Conectando",
    checking: "Verificando",
    realtimeConnection: "Conexión en tiempo real",
    establishingConnection: "Estableciendo conexión...",
    supportApi: "API de Soporte",
    checkingStatus: "Verificando estado...",
    mySupportTickets: "Mis Tickets de Soporte",
    newTicketBtn: "Nuevo Ticket",
    filterAll: "Todos",
    filterOpen: "Abiertos",
    filterClosed: "Cerrados",
    filterPending: "Pendientes",
    searchTicketsPlaceholder: "Buscar tickets...",
    ticketId: "ID",
    subject: "Asunto",
    status: "Estado",
    date: "Fecha",
    actions: "Acciones",
    loading: "Cargando...",
    previous: "Anterior",
    next: "Siguiente",
    communityChat: "Chat de la Comunidad",
    searchUsersPlaceholder: "Buscar usuarios...",
    myTranscripts: "Mis Transcripciones",
    filterTicket: "Tickets",
    filterChat: "Chats",
    createNewTicket: "Crear Nuevo Ticket",
    subjectLabel: "Asunto",
    categoryLabel: "Categoría",
    selectCategory: "Selecciona una categoría",
    categoryGeneral: "Consulta General",
    categoryTechnical: "Problema Técnico",
    categoryBilling: "Facturación/Pagos",
    categoryAccount: "Problema con Cuenta",
    categoryOther: "Otro",
    messageLabel: "Mensaje",
    attachmentsLabel: "Adjuntos (opcional)",
    dropFilesHere: "Arrastra archivos aquí o haz clic para seleccionar",
    attachmentsLimit: "Máximo 5 archivos, 10MB cada uno",
    markHighPriority: "Marcar como prioridad alta",
    cancelBtn: "Cancelar",
    sendTicketBtn: "Enviar Ticket",
    ticketNumber: "Ticket #",
    openStatus: "Abierto",
    ticketInfo: "Información del Ticket",
    createdLabel: "Creado:",
    updatedLabel: "Actualizado:",
    priorityLabel: "Prioridad:",
    none: "Ninguno",
    closeTicketBtn: "Cerrar Ticket",
    writeReplyPlaceholder: "Escribe tu respuesta...",
    transcriptNumber: "Transcripción #",
    typeLabel: "Tipo:",
    dateLabel: "Fecha:",
    participantsLabel: "Participantes:",
    durationLabel: "Duración:",
    closeBtn: "Cerrar",
    downloadBtn: "Descargar",
    transcriptId: "ID",
    type: "Tipo",
    // Agrega traducciones para los tooltips y placeholders de los botones de chat
    attachFile: "Adjuntar archivo",
    emojis: "Emojis",
    formatText: "Formatear texto",
    insertCode: "Insertar código",
    // Traducciones para mensajes de bienvenida y otros textos dinámicos
    welcomeChat: "Bienvenido al chat global",
    startChat: "Envía un mensaje para comenzar a chatear con la comunidad",
  },
  en: {
    supportTitle: "Support",
    ticketsTab: "Tickets",
    chatTab: "Global Chat",
    transcriptsTab: "Transcripts",
    systemStatus: "System Status",
    connecting: "Connecting",
    checking: "Checking",
    realtimeConnection: "Realtime Connection",
    establishingConnection: "Establishing connection...",
    supportApi: "Support API",
    checkingStatus: "Checking status...",
    mySupportTickets: "My Support Tickets",
    newTicketBtn: "New Ticket",
    filterAll: "All",
    filterOpen: "Open",
    filterClosed: "Closed",
    filterPending: "Pending",
    searchTicketsPlaceholder: "Search tickets...",
    ticketId: "ID",
    subject: "Subject",
    status: "Status",
    date: "Date",
    actions: "Actions",
    loading: "Loading...",
    previous: "Previous",
    next: "Next",
    communityChat: "Community Chat",
    searchUsersPlaceholder: "Search users...",
    myTranscripts: "My Transcripts",
    filterTicket: "Tickets",
    filterChat: "Chats",
    createNewTicket: "Create New Ticket",
    subjectLabel: "Subject",
    categoryLabel: "Category",
    selectCategory: "Select a category",
    categoryGeneral: "General Inquiry",
    categoryTechnical: "Technical Issue",
    categoryBilling: "Billing/Payments",
    categoryAccount: "Account Issue",
    categoryOther: "Other",
    messageLabel: "Message",
    attachmentsLabel: "Attachments (optional)",
    dropFilesHere: "Drag files here or click to select",
    attachmentsLimit: "Max 5 files, 10MB each",
    markHighPriority: "Mark as high priority",
    cancelBtn: "Cancel",
    sendTicketBtn: "Send Ticket",
    ticketNumber: "Ticket #",
    openStatus: "Open",
    ticketInfo: "Ticket Information",
    createdLabel: "Created:",
    updatedLabel: "Updated:",
    priorityLabel: "Priority:",
    none: "None",
    closeTicketBtn: "Close Ticket",
    writeReplyPlaceholder: "Write your reply...",
    transcriptNumber: "Transcript #",
    typeLabel: "Type:",
    dateLabel: "Date:",
    participantsLabel: "Participants:",
    durationLabel: "Duration:",
    closeBtn: "Close",
    downloadBtn: "Download",
    transcriptId: "ID",
    type: "Type",
    attachFile: "Attach file",
    emojis: "Emojis",
    formatText: "Format text",
    insertCode: "Insert code",
    welcomeChat: "Welcome to the global chat",
    startChat: "Send a message to start chatting with the community",
  },
};

let currentLanguage =
  localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");

function updateTranslations() {
  document.querySelectorAll("[data-key]").forEach((el) => {
    const key = el.getAttribute("data-key");
    if (!key) return;
    const value = translations[currentLanguage][key];
    if (el.tagName === "INPUT" && el.placeholder) {
      el.placeholder = value;
    } else if (el.tagName === "TEXTAREA" && el.placeholder) {
      el.placeholder = value;
    } else if (el.tagName === "OPTION") {
      el.textContent = value;
    } else {
      el.textContent = value;
    }
  });

  // Actualiza los tooltips y títulos de los botones de chat global y tickets
  const chatAttachBtn = document.querySelector("#chat-tab-pane .fa-paperclip")?.parentElement;
  if (chatAttachBtn) chatAttachBtn.title = translations[currentLanguage].attachFile;
  const chatEmojiBtn = document.querySelector("#chat-tab-pane .fa-smile")?.parentElement;
  if (chatEmojiBtn) chatEmojiBtn.title = translations[currentLanguage].emojis;
  const chatFormatBtn = document.querySelector("#chat-tab-pane .fa-font")?.parentElement;
  if (chatFormatBtn) chatFormatBtn.title = translations[currentLanguage].formatText;

  const ticketAttachBtn = document.querySelector("#ticketChatModal .fa-paperclip")?.parentElement;
  if (ticketAttachBtn) ticketAttachBtn.title = translations[currentLanguage].attachFile;
  const ticketCodeBtn = document.querySelector("#ticketChatModal .fa-code")?.parentElement;
  if (ticketCodeBtn) ticketCodeBtn.title = translations[currentLanguage].insertCode;

  // Mensaje de bienvenida en el chat global
  const welcomeTitle = document.querySelector(".chat-welcome-message h5");
  if (welcomeTitle) welcomeTitle.textContent = translations[currentLanguage].welcomeChat;
  const welcomeDesc = document.querySelector(".chat-welcome-message p");
  if (welcomeDesc) welcomeDesc.textContent = translations[currentLanguage].startChat;
}

document.addEventListener("DOMContentLoaded", function () {
  // Cambiar idioma desde el sidebar
  const langLinks = document.querySelectorAll(".lang-link");
  langLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.lang === currentLanguage);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentLanguage = link.dataset.lang;
      localStorage.setItem("language", currentLanguage);
      langLinks.forEach((l) => l.classList.toggle("active", l === link));
      updateTranslations();
    });
  });
  updateTranslations();
});

// --- SISTEMA DE NOTIFICACIONES (TOAST) ---
const toastElement = document.getElementById("notificationToast");

// --- ADJUNTAR ARCHIVOS EN CHAT GLOBAL Y CHAT DE TICKETS ---
function showToast(title, body, type = "success") {
  const toastElement = document.getElementById("notificationToast");
  if (!toastElement) return;
  const toastTitle = toastElement.querySelector(".toast-title");
  const toastBody = toastElement.querySelector(".toast-body");
  if (toastTitle) toastTitle.textContent = title;
  if (toastBody) toastBody.textContent = body;
  toastElement.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white");
  if (type === "success") {
    toastElement.classList.add("bg-success", "text-white");
  } else if (type === "danger" || type === "error") {
    toastElement.classList.add("bg-danger", "text-white");
  } else if (type === "warning") {
    toastElement.classList.add("bg-warning", "text-white");
  }
  const notificationToast = new bootstrap.Toast(toastElement);
  notificationToast.show();
}

function showNotification(message, type = "success") {
  showToast(
    type === "success" ? "Éxito" : type === "error" ? "Error" : "Advertencia",
    message,
    type,
  );
}

// Utilidad para subir archivos al CDN
async function uploadChatFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", user.id);
  formData.append("title", file.name);
  formData.append("description", "Adjunto de chat");

  const response = await fetch("/dashboard/utils/cdn", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Error al subir archivo");
  // Devuelve la URL de descarga directa
  return data.data.downloadUrl;
}

// --- CHAT GLOBAL ---
const globalFileInput = document.createElement("input");
globalFileInput.type = "file";
globalFileInput.style.display = "none";
document.body.appendChild(globalFileInput);

document
  .querySelector("#chat-tab-pane .fa-paperclip")
  .parentElement.addEventListener("click", () => {
    globalFileInput.value = "";
    globalFileInput.click();
  });

globalFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const url = await uploadChatFile(file);
    // Construir enlace de compartición tipo CDN
    const shareUrl = `${webURL}/dashboard/cdn/share?title=${encodeURIComponent(file.name)}&url=${encodeURIComponent(url)}&mime=${encodeURIComponent(file.type)}&size=${file.size}&date=${encodeURIComponent(new Date().toISOString())}`;
    const input = document.getElementById("global-chat-input");
    input.value += ` [${file.name}](${shareUrl}) `;
    input.focus();
    showNotification("Archivo adjuntado. Envía el mensaje para compartirlo.", "success");
  } catch (err) {
    showNotification("Error al subir archivo: " + err.message, "error");
  }
});

// --- CHAT DE TICKETS ---
const ticketFileInput = document.createElement("input");
ticketFileInput.type = "file";
ticketFileInput.style.display = "none";
document.body.appendChild(ticketFileInput);

document
  .querySelector("#ticketChatModal .fa-paperclip")
  .parentElement.addEventListener("click", () => {
    ticketFileInput.value = "";
    ticketFileInput.click();
  });

ticketFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const url = await uploadChatFile(file);

    const shareUrl = `${webURL}/dashboard/cdn/share?title=${encodeURIComponent(file.name)}&url=${encodeURIComponent(url)}&mime=${encodeURIComponent(file.type)}&size=${file.size}&date=${encodeURIComponent(new Date().toISOString())}`;
    const input = document.getElementById("ticket-chat-input");
    input.value += ` [${file.name}](${shareUrl}) `;
    input.focus();
    showNotification("Archivo adjuntado. Envía el mensaje para compartirlo.", "success");
  } catch (err) {
    showNotification("Error al subir archivo: " + err.message, "error");
  }
});

// --- EMOJIS EN CHAT GLOBAL Y CHAT DE TICKETS ---
const emojiList = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😃",
  "😄",
  "😅",
  "😆",
  "😉",
  "😊",
  "😋",
  "😎",
  "😍",
  "😘",
  "🥰",
  "😗",
  "😙",
  "😚",
  "🙂",
  "🤗",
  "🤩",
  "🤔",
  "🤨",
  "😐",
  "😑",
  "😶",
  "🙄",
  "😏",
  "😣",
  "😥",
  "😮",
  "🤐",
  "😯",
  "😪",
  "😫",
  "🥱",
  "😴",
  "😌",
  "😛",
  "😜",
  "😝",
  "🤤",
  "😒",
  "😓",
  "😔",
  "😕",
  "🙃",
  "🤑",
  "😲",
  "☹️",
  "🙁",
  "😖",
  "😞",
  "😟",
  "😤",
  "😢",
  "😭",
  "😦",
  "😧",
  "😨",
  "😩",
  "🤯",
  "😬",
  "😰",
  "😱",
  "🥵",
  "🥶",
  "😳",
  "🤪",
  "😵",
  "😡",
  "😠",
  "🤬",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🥴",
  "😇",
  "🥳",
  "🥺",
  "🤠",
  "🤡",
  "🤥",
  "🤫",
  "🤭",
  "🧐",
  "🤓",
];

function createEmojiPanel(targetInput) {
  let panel = document.getElementById("emoji-panel");
  if (panel) {
    panel.targetInput = targetInput;
    return panel;
  }
  panel = document.createElement("div");
  panel.id = "emoji-panel";
  panel.style.position = "absolute";
  panel.style.zIndex = "9999";
  panel.style.background = "#222";
  panel.style.border = "1px solid #444";
  panel.style.borderRadius = "8px";
  panel.style.padding = "8px";
  panel.style.display = "none";
  panel.style.maxWidth = "280px";
  panel.style.maxHeight = "200px";
  panel.style.overflowY = "auto";
  panel.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
  panel.style.fontSize = "22px";
  panel.targetInput = targetInput;

  emojiList.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-link p-1 m-1";
    btn.style.fontSize = "22px";
    btn.style.lineHeight = "1";
    btn.style.background = "none";
    btn.style.border = "none";
    btn.style.outline = "none";
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      insertEmojiToInput(panel.targetInput, emoji);
      panel.style.display = "none";
    });
    panel.appendChild(btn);
  });

  document.body.appendChild(panel);
  return panel;
}

function insertEmojiToInput(input, emoji) {
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  input.value = text.substring(0, start) + emoji + text.substring(end);
  input.focus();
  input.setSelectionRange(start + emoji.length, start + emoji.length);
}

document.addEventListener("DOMContentLoaded", function () {
  // Chat global
  const emojiBtnGlobal = document.querySelector("#chat-tab-pane .fa-smile")?.parentElement;
  const chatInputGlobal = document.getElementById("global-chat-input");
  let panel = null;

  if (emojiBtnGlobal) {
    emojiBtnGlobal.addEventListener("click", function (e) {
      e.preventDefault();
      if (!panel) panel = createEmojiPanel(chatInputGlobal);
      else panel.targetInput = chatInputGlobal;
      const rect = emojiBtnGlobal.getBoundingClientRect();
      panel.style.left = `${rect.left + window.scrollX}px`;
      panel.style.top = `${rect.bottom + window.scrollY + 4}px`;
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
  }

  // Chat de tickets
  const emojiBtnTicket = document.querySelector("#ticketChatModal .fa-smile")?.parentElement;
  const chatInputTicket = document.getElementById("ticket-chat-input");

  if (emojiBtnTicket) {
    emojiBtnTicket.addEventListener("click", function (e) {
      e.preventDefault();
      if (!panel) panel = createEmojiPanel(chatInputTicket);
      else panel.targetInput = chatInputTicket;
      const rect = emojiBtnTicket.getBoundingClientRect();
      panel.style.left = `${rect.left + window.scrollX}px`;
      panel.style.top = `${rect.bottom + window.scrollY + 4}px`;
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
  }

  // Ocultar el panel si se hace clic fuera
  document.addEventListener("mousedown", function (e) {
    if (panel && panel.style.display === "block") {
      if (
        !panel.contains(e.target) &&
        (!emojiBtnGlobal || !emojiBtnGlobal.contains(e.target)) &&
        (!emojiBtnTicket || !emojiBtnTicket.contains(e.target))
      ) {
        panel.style.display = "none";
      }
    }
  });

  // Opcional: ocultar el panel si el input pierde foco
  if (chatInputGlobal) {
    chatInputGlobal.addEventListener("blur", function () {
      setTimeout(() => {
        if (panel && panel.targetInput === chatInputGlobal) panel.style.display = "none";
      }, 200);
    });
  }
  if (chatInputTicket) {
    chatInputTicket.addEventListener("blur", function () {
      setTimeout(() => {
        if (panel && panel.targetInput === chatInputTicket) panel.style.display = "none";
      }, 200);
    });
  }
});

// --- INSERTAR CÓDIGO EN CHAT DE TICKETS ---
document.addEventListener("DOMContentLoaded", function () {
  // Selector del botón de insertar código en el modal de ticket
  const insertCodeBtn = document.querySelector(
    'ticket-chat-tools .btn-outline-secondary[title="Insertar código"]',
  );

  if (insertCodeBtn) {
    insertCodeBtn.addEventListener("click", function () {
      showCodeInsertModal();
    });
  }

  // Función para mostrar el modal de inserción de código
  function showCodeInsertModal() {
    // Crear el modal dinámicamente
    const modalHTML = `
            <div class="modal fade" id="codeInsertModal" tabindex="-1" aria-labelledby="codeInsertModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="codeInsertModalLabel">
                                <i class="fas fa-code me-2"></i>Insertar Código
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="code-language" class="form-label">Lenguaje</label>
                                <select class="form-select" id="code-language">
                                    <option value="javascript">JavaScript</option>
                                    <option value="html">HTML</option>
                                    <option value="css">CSS</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="php">PHP</option>
                                    <option value="sql">SQL</option>
                                    <option value="bash">Bash</option>
                                    <option value="json">JSON</option>
                                    <option value="markdown">Markdown</option>
                                    <option value="plaintext">Texto Plano</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="code-content" class="form-label">Código</label>
                                <textarea class="form-control font-monospace" id="code-content" rows="10" style="font-family: 'Courier New', monospace;"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="insert-code-btn">Insertar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Añadir el modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Mostrar el modal
    const codeModal = new bootstrap.Modal(document.getElementById("codeInsertModal"));
    codeModal.show();

    // Configurar el evento para el botón de insertar
    document.getElementById("insert-code-btn").addEventListener("click", function () {
      insertCodeToChat();
      codeModal.hide();
    });

    // Eliminar el modal del DOM cuando se cierre
    document.getElementById("codeInsertModal").addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  }

  // Función para insertar el código formateado en el área de chat
  function insertCodeToChat() {
    const language = document.getElementById("code-language").value;
    const codeContent = document.getElementById("code-content").value;
    const chatInput = document.getElementById("ticket-chat-input");

    if (!codeContent.trim()) return;

    // Formatear el código para Markdown
    const formattedCode = `\`\`\`${language}\n${codeContent}\n\`\`\``;

    // Insertar en el campo de chat
    if (chatInput) {
      const currentValue = chatInput.value;
      const newValue = currentValue ? `${currentValue}\n${formattedCode}` : formattedCode;
      chatInput.value = newValue;

      // Enfocar el campo y posicionar el cursor al final
      chatInput.focus();
      chatInput.setSelectionRange(newValue.length, newValue.length);

      // Autoajustar la altura del textarea
      autoResizeTextarea(chatInput);
    }
  }

  // Función para autoajustar la altura del textarea
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
});

// Inicializar el resaltado de código para los mensajes existentes
document.addEventListener("DOMContentLoaded", function () {
  // Configurar marked para usar highlight.js
  marked.setOptions({
    highlight: function (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: "hljs language-",
  });

  // Aplicar el resaltado a todos los bloques de código en los mensajes
  document.querySelectorAll(".message-content pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
});
