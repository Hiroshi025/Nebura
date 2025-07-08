/**
 * Script principal para la gestión del panel de administración de soporte (tickets, estadísticas y transcripciones).
 * 
 * Funcionalidades principales:
 * - Conexión en tiempo real con el servidor mediante Socket.IO para actualización de tickets.
 * - Carga, filtrado, búsqueda y paginación de tickets y transcripciones.
 * - Visualización y gestión de mensajes de tickets (chat).
 * - Descarga y visualización de transcripciones.
 * - Estadísticas de soporte con gráficos (Chart.js).
 * - Soporte multilenguaje (español/inglés).
 * - Cambio de tema (oscuro/claro).
 * 
 * Dependencias externas:
 * - Socket.IO: https://socket.io/
 * - Chart.js: https://www.chartjs.org/
 * - Marked.js: https://marked.js.org/
 * - Highlight.js: https://highlightjs.org/
 * - Bootstrap 5: https://getbootstrap.com/
 */

document.addEventListener("DOMContentLoaded", function () {
  /**
   * Socket.IO client para comunicación en tiempo real con el backend.
   * @type {SocketIOClient.Socket}
   */
  let socket;

  /**
   * ID de la transcripción actualmente seleccionada por el admin.
   * @type {string|null}
   */
  let currentAdminTranscriptId = null;

  /**
   * Sección actual del panel de administración (tickets, stats, transcripts).
   * @type {string}
   */
  let currentAdminSection = "tickets";

  /**
   * Número de elementos por página en tablas de administración.
   * @type {number}
   */
  let adminItemsPerPage = 10;
  let adminSupportStats = null;
  let adminSupportAdmins = [];

  /**
   * Caché de estadísticas de soporte para evitar recargas innecesarias.
   * @type {{data: any, timestamp: number, ttl: number}}
   */
  let statsCache = {
    data: null,
    timestamp: null,
    ttl: 300000, // 5 minutos en milisegundos
  };

  // Inicialización
  initAdminTheme();
  initAdminSocketConnection();
  initAdminEventListeners();
  loadAdminTickets();
  loadAdminSupportStats();
  fetchAdminSupportTeam();

  // --- INICIALIZACIÓN DEL PANEL ---

  /**
   * Inicializa el tema visual (oscuro/claro) según preferencia guardada.
   */
  function initAdminTheme() {
    const savedTheme = localStorage.getItem("nebura-admin-theme") || "dark";
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
  }

  /**
   * Inicializa la conexión con el servidor de soporte vía Socket.IO.
   * Permite recibir eventos en tiempo real sobre tickets y mensajes.
   * Documentación: https://socket.io/docs/v4/client-api/
   */
  function initAdminSocketConnection() {
    socket = io();

    socket.on("connect", () => {
      console.log(
        ["Conectado al servidor de soporte IO", "Conexion como administrador"].join("\n"),
      );
    });

    // Escuchar actualizaciones de tickets
    socket.on("ticket:updated", (ticket) => {
      if (currentAdminTicketId === ticket.ticketId) {
        updateAdminTicketChat(ticket);
      }
      updateAdminTicketInList(ticket);
    });

    socket.on("ticket:message", (data) => {
      if (currentAdminTicketId === data.ticketId) {
        appendAdminNewMessage(data.message);
      }
    });
  }

  /**
   * Inicializa los listeners de eventos de la interfaz de administración.
   * Incluye navegación de pestañas, filtros, búsqueda, botones, etc.
   */
  function initAdminEventListeners() {
    // Navegación entre pestañas
    document.querySelectorAll("#adminSupportTabs .nav-link").forEach((tab) => {
      tab.addEventListener("shown.bs.tab", function (e) {
        const target = e.target.getAttribute("data-bs-target");
        if (target === "#stats-admin-pane") {
          currentAdminSection = "stats";
          loadAdminSupportStats(); // <-- Usa esta función para recargar estadísticas
        } else if (target === "#tickets-admin-pane") {
          currentAdminSection = "tickets";
        } else if (target === "#transcripts-admin-pane") {
          currentAdminSection = "transcripts";
        }
      });
    });

    // Tickets
    document.getElementById("admin-refresh-tickets").addEventListener("click", () => {
      loadAdminTickets();
      showNotification("Tickets actualizados", "success");
    });

    document.getElementById("admin-ticket-filter").addEventListener("change", filterAdminTickets);
    document
      .getElementById("admin-ticket-search")
      .addEventListener("input", debounce(searchAdminTickets, 300));

    // Transcripciones
    document.getElementById("admin-refresh-transcripts").addEventListener("click", () => {
      loadAdminTranscripts();
      showNotification("Transcripciones actualizadas", "success");
    });

    document
      .getElementById("admin-transcript-filter")
      .addEventListener("change", filterAdminTranscripts);

    // Chat de ticket
    document
      .getElementById("admin-send-ticket-msg-btn")
      .addEventListener("click", sendAdminTicketMessage);
    document.getElementById("admin-ticket-chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendAdminTicketMessage();
      }
    });

    document
      .getElementById("admin-close-ticket-btn")
      .addEventListener("click", closeAdminCurrentTicket);
    document.getElementById("admin-assign-to").addEventListener("change", assignAdminTicket);

    // Transcripciones
    document
      .getElementById("admin-download-transcript")
      .addEventListener("click", downloadAdminTranscript);
  }

  // --- FUNCIONES DE TICKETS ---

  /**
   * Carga la lista de tickets para el panel de administración.
   * Permite paginación, filtrado y búsqueda.
   * @param {number} page - Página a cargar (por defecto 1).
   */
  async function loadAdminTickets(page = 1) {
    try {
      showAdminLoader("#admin-tickets-list");

      const filter = document.getElementById("admin-ticket-filter").value;
      const search = document.getElementById("admin-ticket-search").value;

      const response = await fetch(
        `/dashboard/utils/admin/tickets?page=${page}&limit=${adminItemsPerPage}&filter=${filter}&search=${search}`,
      );

      if (!response.ok) throw new Error("Error al cargar tickets");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      renderAdminTickets(data.data);
      updateAdminPagination(
        "#admin-tickets-pagination",
        page,
        Math.ceil(data.total / adminItemsPerPage),
      );
    } catch (error) {
      console.error("Error loading admin tickets:", error);
      showNotification(`Error al cargar tickets: ${error.message}`, "error");
      document.getElementById("admin-tickets-list").innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-danger">
            Error al cargar tickets. Intenta recargar la página.
          </td>
        </tr>
      `;
    }
  }

  /**
   * Filtra los tickets según el filtro seleccionado.
   * Reinicia la paginación a la primera página.
   */
  function filterAdminTickets() {
    // Reinicia la paginación a la primera página y recarga los tickets según el filtro seleccionado
    loadAdminTickets(1);
  }

  /**
   * Busca tickets según el texto ingresado.
   * Reinicia la paginación a la primera página.
   */
  function searchAdminTickets() {
    // Reinicia la paginación a la primera página y recarga los tickets según el texto de búsqueda
    loadAdminTickets(1);
  }

  /**
   * Obtiene la lista de administradores/soporte para asignar tickets.
   * Requiere un endpoint que devuelva la lista de admins.
   * @see /dashboard/utils/admin/support/team
   */
  async function fetchAdminSupportTeam() {
    try {
      // Ajusta la URL si tu endpoint es diferente
      const response = await fetch("/dashboard/utils/admin/support/team");
      if (!response.ok) throw new Error("No se pudo cargar el equipo de soporte");
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
      adminSupportAdmins = data.data;
    } catch (error) {
      adminSupportAdmins = [];
      showNotification(`Error al cargar equipo de soporte: ${error.message}`, "error");
    }
  }

  /**
   * Actualiza la paginación de las tablas (tickets o transcripciones).
   * @param {string} selector - Selector del contenedor de paginación.
   * @param {number} currentPage - Página actual.
   * @param {number} totalPages - Total de páginas.
   */
  function updateAdminPagination(selector, currentPage, totalPages) {
    const container = document.querySelector(selector);
    if (!container) return;

    let html = "";

    // Botón anterior
    html += `<li class="page-item${currentPage === 1 ? " disabled" : ""}">
    <a class="page-link" href="#" data-page="${currentPage - 1}" data-key="previous">Anterior</a>
  </li>`;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item${i === currentPage ? " active" : ""}">
      <a class="page-link" href="#" data-page="${i}">${i}</a>
    </li>`;
    }

    // Botón siguiente
    html += `<li class="page-item${currentPage === totalPages ? " disabled" : ""}">
    <a class="page-link" href="#" data-page="${currentPage + 1}" data-key="next">Siguiente</a>
  </li>`;

    container.innerHTML = html;

    // Event listeners para paginación
    container.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const page = parseInt(this.getAttribute("data-page"));
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          if (selector === "#admin-tickets-pagination") {
            loadAdminTickets(page);
          } else if (selector === "#admin-transcripts-pagination") {
            loadAdminTranscripts(page);
          }
        }
      });
    });
  }

  /**
   * Filtra las transcripciones según el filtro seleccionado.
   * Reinicia la paginación a la primera página.
   */
  function filterAdminTranscripts() {
    // Reinicia la paginación a la primera página y recarga las transcripciones según el filtro seleccionado
    loadAdminTranscripts(1);
  }

  /**
   * Carga la lista de transcripciones para el panel de administración.
   * @param {number} page - Página a cargar (por defecto 1).
   */
  async function loadAdminTranscripts(page = 1) {
    try {
      showAdminLoader("#admin-transcripts-list");

      const filter = document.getElementById("admin-transcript-filter").value;

      const response = await fetch(
        `/dashboard/utils/admin/transcripts?page=${page}&limit=${adminItemsPerPage}&filter=${filter}`,
      );
      if (!response.ok) throw new Error("Error al cargar transcripciones");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      renderAdminTranscripts(data.data);
      updateAdminPagination(
        "#admin-transcripts-pagination",
        page,
        Math.ceil(data.total / adminItemsPerPage),
      );
    } catch (error) {
      showNotification(`Error al cargar transcripciones: ${error.message}`, "error");
      document.getElementById("admin-transcripts-list").innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-danger">
          Error al cargar transcripciones. Intenta recargar la página.
        </td>
      </tr>
    `;
    }
  }

  /**
   * Renderiza la tabla de transcripciones.
   * @param {Array} transcripts - Lista de transcripciones.
   */
  function renderAdminTranscripts(transcripts) {
    const tbody = document.getElementById("admin-transcripts-list");
    if (!transcripts || transcripts.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No se encontraron transcripciones.
        </td>
      </tr>
    `;
      return;
    }

    tbody.innerHTML = transcripts
      .map(
        (t) => `
    <tr>
      <td>${t.transcriptId}</td>
      <td>${t.type}</td>
      <td>${t.referenceId || "-"}</td>
      <td>${(t.participants || []).join(", ")}</td>
      <td>${formatDateTime(t.createdAt)}</td>
      <td>${formatDuration(t.duration)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary view-admin-transcript-btn" data-transcript-id="${t.transcriptId}">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `,
      )
      .join("");

    // Listeners para ver transcripción (puedes implementar la función viewAdminTranscript)
    document.querySelectorAll(".view-admin-transcript-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const transcriptId = e.currentTarget.dataset.transcriptId;
        viewAdminTranscript(transcriptId);
      });
    });
  }

  /**
   * Envía un mensaje en el chat del ticket actual.
   * Utiliza el endpoint REST para enviar mensajes.
   */
  async function sendAdminTicketMessage() {
    const input = document.getElementById("admin-ticket-chat-input");
    const message = input.value.trim();
    if (!message || !currentAdminTicketId) return;

    try {
      input.disabled = true;
      document.getElementById("admin-send-ticket-msg-btn").disabled = true;

      // Usa el userId de Discord del admin
      const adminId = adminUser.id;

      const response = await fetch(
        `/dashboard/utils/admin/tickets/${currentAdminTicketId}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message, adminId }),
        },
      );

      if (!response.ok) throw new Error("Error al enviar mensaje");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      input.value = "";
      input.disabled = false;
      document.getElementById("admin-send-ticket-msg-btn").disabled = false;

      // Solo agrega el nuevo mensaje
      appendAdminNewMessage(data.data);
    } catch (error) {
      input.disabled = false;
      document.getElementById("admin-send-ticket-msg-btn").disabled = false;
      showNotification(`Error al enviar mensaje: ${error.message}`, "error");
    }
  }

  /**
   * Agrega un nuevo mensaje al chat del ticket en la interfaz.
   * @param {Object} msg - Mensaje a agregar.
   */
  function appendAdminNewMessage(msg) {
    const container = document.getElementById("admin-ticket-chat-messages");
    container.innerHTML += `
    <div class="ticket-message">
      <div class="fw-bold">${msg.senderName}</div>
      <div>${msg.content}</div>
      <small class="text-muted">${formatDateTime(msg.createdAt || msg.timestamp)}</small>
    </div>
  `;
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Asigna el ticket actual a un administrador seleccionado.
   */
  async function assignAdminTicket() {
    const select = document.getElementById("admin-assign-to");
    const adminId = select.value;
    if (!currentAdminTicketId || !adminId) return;

    try {
      select.disabled = true;

      const response = await fetch(
        `/dashboard/utils/admin/tickets/${currentAdminTicketId}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminId: adminId,
          }),
        },
      ).catch((e) => {
        console.log(e);
      });

      if (!response.ok) throw new Error("Error al asignar el ticket");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      showNotification("Ticket asignado correctamente", "success");
      // Actualiza la información del ticket en el modal
      viewAdminTicket(currentAdminTicketId);
    } catch (error) {
      showNotification(`Error al asignar ticket: ${error.message}`, "error");
    } finally {
      select.disabled = false;
    }
  }

  /**
   * Descarga la transcripción seleccionada en formato TXT.
   * Utiliza la API REST para obtener el archivo.
   */
  async function downloadAdminTranscript() {
    if (!currentAdminTranscriptId) {
      showNotification("No hay transcripción seleccionada.", "warning");
      return;
    }

    try {
      // Puedes cambiar el formato a 'json' si lo prefieres
      const response = await fetch(
        `/dashboard/utils/admin/transcripts/${currentAdminTranscriptId}?format=txt`,
      );
      if (!response.ok) throw new Error("No se pudo descargar la transcripción");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace temporal para descargar el archivo
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcripcion_${currentAdminTranscriptId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showNotification("Transcripción descargada correctamente", "success");
    } catch (error) {
      showNotification(`Error al descargar transcripción: ${error.message}`, "error");
    }
  }

  /**
   * Cierra el ticket actualmente seleccionado.
   * Solicita confirmación al usuario antes de proceder.
   */
  async function closeAdminCurrentTicket() {
    if (!currentAdminTicketId) return;

    if (!confirm("¿Estás seguro de que deseas cerrar este ticket?")) return;

    try {
      const response = await fetch(`/dashboard/utils/admin/tickets/${currentAdminTicketId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al cerrar el ticket");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      showNotification("Ticket cerrado correctamente", "success");
      // Recargar la lista de tickets y cerrar el modal
      loadAdminTickets();
      const modal = bootstrap.Modal.getInstance(document.getElementById("adminTicketChatModal"));
      if (modal) modal.hide();
    } catch (error) {
      showNotification(`Error al cerrar ticket: ${error.message}`, "error");
    }
  }

  /**
   * Renderiza la tabla de tickets en la interfaz de administración.
   * @param {Array} tickets - Lista de tickets.
   */
  function renderAdminTickets(tickets) {
    const tbody = document.getElementById("admin-tickets-list");

    if (!tickets || tickets.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            No se encontraron tickets.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tickets
      .map(
        (ticket) => `
      <tr data-ticket-id="${ticket.ticketId}" class="${ticket.priority === "HIGH" ? "priority-high" : ticket.priority === "MEDIUM" ? "priority-medium" : "priority-low"}">
        <td>${ticket.ticketId}</td>
        <td>
          <div class="d-flex align-items-center">
            <img src="${ticket.userAvatar ? `https://cdn.discordapp.com/avatars/${ticket.userId}/${ticket.userAvatar}.png?size=256` : "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9zZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn"}" 
                 alt="${ticket.userName}" 
                 class="admin-avatar">
            <div>
              <div class="fw-bold">${ticket.userName}</div>
              <small class="text-muted">Proximamente</small>
            </div>
          </div>
        </td>
        <td>${ticket.reason || "Sin asunto"}</td>
        <td>
          <span class="ticket-status-badge ${ticket.status.toLowerCase()}">
            ${getStatusText(ticket.status)}
          </span>
        </td>
        <td>
          ${
            ticket.assignedTo
              ? `
            <div class="d-flex align-items-center">
              <img src="${ticket.assignedTo.userAvatar ? `https://cdn.discordapp.com/avatars/${ticket.assignedTo.userId}/${ticket.assignedTo.userAvatar}.png?size=256` : "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9zZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn"}" 
                   alt="${ticket.assignedTo.userName}" 
                   class="admin-avatar">
              <span>${ticket.assignedTo.userName}</span>
            </div>
          `
              : '<span class="badge bg-secondary">No asignado</span>'
          }
        </td>
        <td>${formatDate(ticket.createdAt)}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn-sm btn-outline-primary view-admin-ticket-btn" data-ticket-id="${ticket.ticketId}">
              <i class="fas fa-eye"></i>
            </button>
            ${
              ticket.status === "OPEN" || ticket.status === "PENDING"
                ? `
              <button class="btn btn-sm btn-outline-danger close-admin-ticket-btn" data-ticket-id="${ticket.ticketId}">
                <i class="fas fa-times"></i>
              </button>
            `
                : ""
            }
          </div>
        </td>
      </tr>
    `,
      )
      .join("");

    // Agregar event listeners a los botones
    document.querySelectorAll(".view-admin-ticket-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const ticketId = e.currentTarget.dataset.ticketId;
        viewAdminTicket(ticketId);
      });
    });

    document.querySelectorAll(".close-admin-ticket-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const ticketId = e.currentTarget.dataset.ticketId;
        closeAdminTicket(ticketId);
      });
    });
  }

  /**
   * Muestra el modal con la información y mensajes de un ticket.
   * @param {string} ticketId - ID del ticket a visualizar.
   */
  async function viewAdminTicket(ticketId) {
    try {
      showAdminLoader("#admin-ticket-chat-messages");

      const response = await fetch(`/dashboard/utils/admin/tickets/${ticketId}`);
      if (!response.ok) throw new Error("Error al cargar ticket");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      const ticket = data.data;
      currentAdminTicketId = ticket.ticketId;

      // Actualizar modal con la información del ticket
      document.getElementById("admin-ticket-id-placeholder").textContent = ticket.ticketId;
      document.getElementById("admin-ticket-status-badge").className =
        `badge ${getStatusBadgeClass(ticket.status)}`;
      document.getElementById("admin-ticket-status-badge").textContent = getStatusText(
        ticket.status,
      );

      document.getElementById("admin-ticket-user-info").innerHTML = `
        <div class="d-flex align-items-center">
          <img src="${ticket.userAvatar ? `https://cdn.discordapp.com/avatars/${ticket.userId}/${ticket.userAvatar}.png?size=256` : "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9zZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn"}" 
               alt="${ticket.userName}" 
               class="admin-avatar">
          <div>
            <div class="fw-bold">${ticket.userName}</div>
            <small class="text-muted">Proximamente</small>
          </div>
        </div>
      `;

      document.getElementById("admin-ticket-created-at").textContent = formatDateTime(
        ticket.createdAt,
      );
      document.getElementById("admin-ticket-updated-at").textContent = formatDateTime(
        ticket.updatedAt,
      );
      document.getElementById("admin-ticket-category-info").textContent =
        ticket.category || "General";
      document.getElementById("admin-ticket-priority-info").textContent =
        ticket.priority || "Normal";
      document.getElementById("admin-ticket-subject-info").textContent =
        ticket.reason || "Sin asunto";

      // Mostrar asignación
      const assignedInfo = ticket.assignedTo
        ? `
        <div class="d-flex align-items-center">
          <img src="${ticket.assignedTo.userAvatar ? `https://cdn.discordapp.com/avatars/${ticket.assignedTo.userId}/${ticket.assignedTo.userAvatar}.png?size=256` : "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9zZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn"}" 
               alt="${ticket.assignedTo.userName}" 
               class="admin-avatar">
          <span>${ticket.assignedTo.userName}</span>
        </div>
      `
        : '<span class="text-muted">No asignado</span>';
      document.getElementById("admin-ticket-assigned-info").innerHTML = assignedInfo;

      // Cargar lista de admins para asignar
      const assignSelect = document.getElementById("admin-assign-to");
      assignSelect.innerHTML = `
        <option value="" selected disabled>Asignar a...</option>
        ${adminSupportAdmins
          .map(
            (admin) => `
          <option value="${admin.discord?.userId || ""}" ${ticket.assignedTo && ticket.assignedTo.userId === admin.discord?.userId ? "selected" : ""}>
            ${admin.name} (${admin.role})
          </option>
        `,
          )
          .join("")}
      `;

      // Cargar mensajes del ticket
      const msgResponse = await fetch(`/dashboard/utils/admin/tickets/${ticketId}/messages`);
      if (!msgResponse.ok) throw new Error("Error al cargar mensajes del ticket");
      const msgData = await msgResponse.json();
      if (!msgData.success)
        throw new Error(msgData.message || "Error en la respuesta del servidor");

      renderAdminTicketMessages(msgData.data);

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById("adminTicketChatModal"));
      modal.show();
    } catch (error) {
      console.error("Error viewing admin ticket:", error);
      showNotification(`Error al cargar ticket: ${error.message}`, "error");
    }
  }

  /**
   * Renderiza los mensajes del ticket en el chat del modal.
   * @param {Array} messages - Lista de mensajes.
   */
  function renderAdminTicketMessages(messages) {
    const container = document.getElementById("admin-ticket-chat-messages");
    container.innerHTML = "";

    if (!messages || messages.length === 0) {
      container.innerHTML = `
      <div class="text-center py-4 text-muted">
        No hay mensajes en este ticket.
      </div>
    `;
      return;
    }

    // Aquí puedes renderizar los mensajes si existen
    container.innerHTML = messages
      .map(
        (msg) => `
    <div class="ticket-message">
      <div class="fw-bold">${msg.senderName}</div>
      <div>${msg.content}</div>
      <small class="text-muted">${formatDateTime(msg.createdAt)}</small>
    </div>
  `,
      )
      .join("");
  }

  // --- ESTADÍSTICAS Y GRÁFICOS ---

  /**
   * Muestra un loader/spinner en el elemento indicado (por selector)
   */
  function showAdminLoader(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </td>
      </tr>
    `;
    }
  }

  // Configuración global de gráficos
  const CHART_CONFIG = {
    colors: {
      status: {
        OPEN: "#4bc0c0",
        PENDING: "#ff9f40",
        CLOSED: "#ff6384",
      },
      monthly: "#36a2eb",
      category: [
        "#6a5af9",
        "#198754",
        "#ffc107",
        "#dc3545",
        "#0dcaf0",
        "#6610f2",
        "#fd7e14",
        "#20c997",
        "#e83e8c",
        "#6f42c1",
        "#fd7e14",
        "#20c997",
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
      },
    },
  };

  /**
   * Carga las estadísticas de soporte con manejo de caché y reintentos.
   * @param {boolean} forceRefresh - Si es true, ignora la caché.
   */
  async function loadAdminSupportStats(forceRefresh = false) {
    try {
      // Verificar caché antes de hacer la petición
      if (!forceRefresh && statsCache.data && Date.now() - statsCache.timestamp < statsCache.ttl) {
        renderAll(statsCache.data);
        return;
      }

      const response = await fetchWithTimeout("/dashboard/utils/admin/support/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Invalid server response");
      }

      // Procesar y normalizar datos
      const processedData = processStatsData(data.data);

      // Actualizar caché
      statsCache = {
        data: processedData,
        timestamp: Date.now(),
        ttl: statsCache.ttl,
      };

      renderAll(processedData);
    } catch (error) {
      console.error("Error loading stats:", error);
      handleStatsError(error);

      // Intentar mostrar datos cacheados si hay error
      if (statsCache.data) {
        renderAll(statsCache.data);
        showNotification("Mostrando datos cacheados. " + error.message, "warning");
      }
    }
  }

  /**
   * Procesa y normaliza los datos de la API de estadísticas.
   * @param {Object} rawData - Datos crudos de la API.
   * @returns {Object} Datos normalizados.
   */
  function processStatsData(rawData) {
    const stats = { ...rawData };

    // Normalizar tickets por estado
    stats.ticketsByStatus = {
      OPEN: stats.openTickets || 0,
      PENDING: stats.pendingTickets || 0,
      CLOSED: stats.closedTickets || 0,
    };

    // Normalizar tickets por mes
    stats.ticketsByMonth = normalizeMonthlyData(stats.ticketsByMonth);

    // Normalizar tickets por categoría
    stats.ticketsByCategory = normalizeCategoryData(stats.ticketsByCategory);

    // Normalizar top usuarios
    stats.topUsers = normalizeTopUsers(stats.topUsers);

    return stats;
  }

  /**
   * Normaliza datos mensuales para el gráfico de tickets por mes.
   * @param {Array} monthlyData - Datos mensuales crudos.
   * @returns {Object} {labels, data}
   */
  function normalizeMonthlyData(monthlyData) {
    if (!Array.isArray(monthlyData)) {
      return { labels: [], data: [] };
    }

    // Agrupar por mes-año y ordenar cronológicamente
    const monthMap = new Map();

    monthlyData.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      monthMap.set(monthYear, (monthMap.get(monthYear) || 0) + (item._count?._all || 0));
    });

    // Ordenar por fecha
    const sortedEntries = [...monthMap.entries()].sort();

    return {
      labels: sortedEntries.map(([monthYear]) => {
        const [year, month] = monthYear.split("-");
        return new Date(year, month - 1).toLocaleDateString("es-ES", {
          month: "short",
          year: "numeric",
        });
      }),
      data: sortedEntries.map(([, count]) => count),
    };
  }

  /**
   * Normaliza datos por categoría para el gráfico de tickets por categoría.
   * @param {Array} categoryData - Datos de categorías crudos.
   * @returns {Object} {labels, data}
   */
  function normalizeCategoryData(categoryData) {
    if (!Array.isArray(categoryData)) {
      return { labels: [], data: [] };
    }

    const categoryMap = new Map();

    categoryData.forEach((item) => {
      const category = item.category || item.reason || "General";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // Ordenar por cantidad descendente
    const sortedEntries = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);

    return {
      labels: sortedEntries.map(([category]) => category),
      data: sortedEntries.map(([, count]) => count),
    };
  }

  /**
   * Normaliza datos de usuarios para el ranking de top usuarios.
   * @param {Array} usersData - Datos crudos de usuarios.
   * @returns {Array} Lista de usuarios normalizada.
   */
  function normalizeTopUsers(usersData) {
    if (!Array.isArray(usersData)) {
      return [];
    }

    return usersData
      .map((user) => ({
        userId: user.userId,
        userName: user.userName || `Usuario ${user.userId}`,
        userAvatar: user.avatar || "/img/default-avatar.png",
        tickets: user.ticketCount || user.tickets || 0,
        lastActivity: user.lastActivity ? new Date(user.lastActivity) : null,
      }))
      .sort((a, b) => b.tickets - a.tickets);
  }

  /**
   * Renderiza todos los componentes de estadísticas con los datos.
   * @param {Object} stats - Datos normalizados de estadísticas.
   */
  function renderAll(stats) {
    renderStatusChart(stats.ticketsByStatus);
    renderMonthlyChart(stats.ticketsByMonth);
    renderCategoryChart(stats.ticketsByCategory);
    renderTopUsers(stats.topUsers);
    updateSummaryCards(stats);
  }

  /**
   * Actualiza tarjetas de resumen (stub, puedes implementar lógica adicional).
   * @param {Object} stats - Datos de estadísticas.
   */
  function updateSummaryCards(stats) {
    // No hace nada actualmente.
  }

  /**
   * Renderiza el gráfico de estados de tickets (abiertos, pendientes, cerrados).
   * @param {Object} statusData - Datos de estados.
   */
  function renderStatusChart(statusData) {
    const ctx = document.getElementById("tickets-summary-chart");
    if (!ctx) return;

    const hasData = statusData.OPEN + statusData.PENDING + statusData.CLOSED > 0;

    if (!hasData) {
      renderNoData(ctx);
      return;
    }

    const config = {
      type: "doughnut",
      data: {
        labels: ["Abiertos", "Pendientes", "Cerrados"],
        datasets: [
          {
            data: [statusData.OPEN, statusData.PENDING, statusData.CLOSED],
            backgroundColor: [
              CHART_CONFIG.colors.status.OPEN,
              CHART_CONFIG.colors.status.PENDING,
              CHART_CONFIG.colors.status.CLOSED,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        ...CHART_CONFIG.options,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.raw;
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "75%",
      },
    };

    renderChart(ctx, config);
  }

  /**
   * Renderiza el gráfico de tickets por mes.
   * @param {Object} monthlyData - Datos mensuales.
   */
  function renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById("tickets-monthly-chart");
    if (!ctx) return;

    if (monthlyData.labels.length === 0) {
      renderNoData(ctx);
      return;
    }

    const config = {
      type: "bar",
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: "Tickets",
            data: monthlyData.data,
            backgroundColor: CHART_CONFIG.colors.monthly,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        ...CHART_CONFIG.options,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Tickets: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#6c757d" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { color: "#6c757d", precision: 0 },
          },
        },
      },
    };

    renderChart(ctx, config);
  }

  /**
   * Renderiza el gráfico de tickets por categoría.
   * @param {Object} categoryData - Datos por categoría.
   */
  function renderCategoryChart(categoryData) {
    const ctx = document.getElementById("tickets-category-chart");
    if (!ctx) return;

    if (categoryData.labels.length === 0) {
      renderNoData(ctx);
      return;
    }

    const config = {
      type: "pie",
      data: {
        labels: categoryData.labels,
        datasets: [
          {
            data: categoryData.data,
            backgroundColor: CHART_CONFIG.colors.category,
            borderWidth: 0,
          },
        ],
      },
      options: {
        ...CHART_CONFIG.options,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              padding: 16,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.raw / total) * 100);
                return `${context.label}: ${context.raw} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "60%",
      },
    };

    renderChart(ctx, config);
  }

  /**
   * Renderiza un gráfico en el canvas especificado usando Chart.js.
   * @param {HTMLCanvasElement} canvas - Canvas destino.
   * @param {Object} config - Configuración de Chart.js.
   */
  function renderChart(canvas, config) {
    // Destruir gráfico existente si existe
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    // Crear nuevo gráfico
    canvas.chart = new Chart(canvas.getContext("2d"), config);
  }

  /**
   * Muestra un mensaje de "No hay datos disponibles" en el canvas.
   * @param {HTMLCanvasElement} canvas - Canvas destino.
   */
  function renderNoData(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '14px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.fillText("No hay datos disponibles", canvas.width / 2, canvas.height / 2);
  }

  /**
   * Realiza una petición fetch con timeout.
   * @param {string} resource - URL del recurso.
   * @param {Object} options - Opciones de fetch (incluye timeout).
   * @returns {Promise<Response>}
   */
  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);
    return response;
  }

  /**
   * Maneja errores al cargar estadísticas y muestra notificaciones.
   * @param {Error} error - Error capturado.
   */
  function handleStatsError(error) {
    const errorMessage = error.message.includes("aborted")
      ? "La solicitud tardó demasiado. Verifica tu conexión."
      : `Error al cargar estadísticas: ${error.message}`;

    showNotification(errorMessage, "error");
  }

  /**
   * Renderiza la tabla de top usuarios en el panel de estadísticas.
   * @param {Array} topUsers - Lista de usuarios destacados.
   */
  function renderTopUsers(topUsers) {
    const tbody = document.getElementById("top-users-list");
    if (!tbody) return;
    if (!topUsers || topUsers.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-3 text-muted">No hay datos.</td>
      </tr>
    `;
      return;
    }
    tbody.innerHTML = topUsers
      .map((user) => {
        const name =
          user.userName || user.name || user.username || user.discord?.username || "Desconocido";
        const avatar =
          user.userAvatar ||
          user.userAvatar ||
          (user.discord && user.discord.userId && user.discord.userAvatar
            ? `https://cdn.discordapp.com/avatars/${user.discord.userId}/${user.discord.userAvatar}.png?size=256`
            : "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9zZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn");
        return `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <img src="${avatar}" alt="${name}" class="admin-avatar">
          <span>${name}</span>
        </div>
      </td>
      <td>${user.tickets}</td>
      <td>${user.lastActivity ? formatDateTime(user.lastActivity) : "-"}</td>
    </tr>
  `;
      })
      .join("");
  }

  // --- FUNCIONES DE UTILIDAD ---

  /**
   * Muestra una notificación tipo toast usando Bootstrap.
   * @param {string} message - Mensaje a mostrar.
   * @param {"success"|"error"|"warning"} type - Tipo de notificación.
   */
  function showNotification(message, type = "success") {
    const toast = document.getElementById("notificationToast");
    if (!toast) return;

    const toastTitle = toast.querySelector(".toast-title");
    const toastBody = toast.querySelector(".toast-body");

    if (toastTitle)
      toastTitle.textContent =
        type === "success" ? "Éxito" : type === "error" ? "Error" : "Advertencia";
    if (toastBody) toastBody.textContent = message;

    // Cambiar color según tipo
    toast.className = "toast";
    toast.classList.add(`bg-${type}`);

    // Mostrar toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  }

  /**
   * Función de utilidad para debouncing (retrasa la ejecución).
   * @param {Function} func - Función a debounciar.
   * @param {number} wait - Tiempo de espera en ms.
   * @returns {Function}
   */
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }

  /**
   * Formatea una fecha a DD/MM/YYYY o formato personalizado.
   * @param {string} dateString - Fecha en string.
   * @param {string} format - Formato deseado.
   * @returns {string}
   */
  function formatDate(dateString, format = "DD/MM/YYYY") {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    if (format === "DD/MM/YYYY") {
      return date.toLocaleDateString("es-ES");
    } else if (format === "MMM YYYY") {
      return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
    }

    return date.toLocaleDateString();
  }

  /**
   * Formatea una hora a HH:mm.
   * @param {string} dateString - Fecha en string.
   * @returns {string}
   */
  function formatTime(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * Formatea fecha y hora a string local.
   * @param {string} dateString - Fecha en string.
   * @returns {string}
   */
  function formatDateTime(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES");
  }

  /**
   * Formatea una duración en milisegundos a "Xm Ys".
   * @param {number} ms - Duración en milisegundos.
   * @returns {string}
   */
  function formatDuration(ms) {
    if (!ms) return "N/A";
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  }

  /**
   * Devuelve el texto legible para un estado de ticket.
   * @param {string} status - Estado (OPEN, CLOSED, PENDING).
   * @returns {string}
   */
  function getStatusText(status) {
    switch (status) {
      case "OPEN":
        return "Abierto";
      case "CLOSED":
        return "Cerrado";
      case "PENDING":
        return "Pendiente";
      default:
        return status;
    }
  }

  /**
   * Devuelve la clase CSS para el badge de estado de ticket.
   * @param {string} status - Estado.
   * @returns {string}
   */
  function getStatusBadgeClass(status) {
    switch (status) {
      case "OPEN":
        return "bg-success";
      case "CLOSED":
        return "bg-danger";
      case "PENDING":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  }

  /**
   * Muestra el modal de una transcripción y carga su contenido.
   * @param {string} transcriptId - ID de la transcripción.
   */
  async function viewAdminTranscript(transcriptId) {
    try {
      currentAdminTranscriptId = transcriptId;
      // Mostrar loader
      document.getElementById("admin-transcript-content").innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    `;
      // Cargar datos de la transcripción
      const response = await fetch(`/dashboard/utils/admin/transcripts/${transcriptId}`);
      if (!response.ok) throw new Error("Error al cargar transcripción");
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
      const t = data.data;

      // Actualizar campos del modal
      document.getElementById("admin-transcript-id-placeholder").textContent = t.transcriptId;
      document.getElementById("admin-transcript-type").textContent = t.type || "-";
      document.getElementById("admin-transcript-reference").textContent = t.referenceId || "-";
      document.getElementById("admin-transcript-date").textContent = formatDateTime(t.createdAt);
      document.getElementById("admin-transcript-duration").textContent = formatDuration(t.duration);

      // Mostrar contenido de la transcripción
      document.getElementById("admin-transcript-content").innerHTML = t.content
        ? `<pre style="white-space:pre-wrap;">${t.content}</pre>`
        : '<div class="text-muted">Sin contenido.</div>';

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById("adminTranscriptModal"));
      modal.show();
    } catch (error) {
      showNotification(`Error al cargar transcripción: ${error.message}`, "error");
      document.getElementById("admin-transcript-content").innerHTML =
        `<div class="text-danger">Error al cargar transcripción.</div>`;
    }
  }

  // --- INTEGRACIÓN DE MARKED.JS Y HIGHLIGHT.JS ---

  /**
   * Configura Marked.js para renderizar Markdown con resaltado de código (Highlight.js).
   * @see https://marked.js.org/
   * @see https://highlightjs.org/
   */
  marked.setOptions({
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(lang, code).value;
      }
      return hljs.highlightAuto(code).value;
    },
    langPrefix: "hljs language-",
    breaks: true,
    gfm: true,
  });

  // --- MULTILENGUAJE ---

  /**
   * Diccionario de traducciones para la interfaz de administración.
   * Puedes agregar más idiomas o claves según sea necesario.
   */
  const translations = {
    es: {
      supportAdminTitle: "Soporte Admin",
      ticketsTab: "Tickets",
      statsTab: "Estadísticas",
      transcriptsTab: "Transcripciones",
      filterAll: "Todos",
      filterOpen: "Abiertos",
      filterPending: "Pendientes",
      filterClosed: "Cerrados",
      searchTicketsPlaceholder: "Buscar tickets...",
      ticketId: "ID",
      user: "Usuario",
      subject: "Asunto",
      status: "Estado",
      assignedTo: "Asignado a",
      date: "Fecha",
      actions: "Acciones",
      loading: "Cargando...",
      previous: "Anterior",
      next: "Siguiente",
      transcriptsAdminTitle: "Todas las Transcripciones",
      filterTicket: "Tickets",
      filterChat: "Chats",
      type: "Tipo",
      referenceId: "Referencia",
      participants: "Participantes",
      duration: "Duración",
      ticketNumber: "Ticket #",
      openStatus: "Abierto",
      ticketInfo: "Información del Ticket",
      userLabel: "Usuario:",
      createdLabel: "Creado:",
      updatedLabel: "Actualizado:",
      priorityLabel: "Prioridad:",
      assignedToLabel: "Asignado a:",
      writeReplyPlaceholder: "Escribe tu respuesta...",
      closeTicketBtn: "Cerrar Ticket",
      transcriptNumber: "Transcripción #",
      typeLabel: "Tipo:",
      referenceLabel: "Referencia:",
      dateLabel: "Fecha:",
      durationLabel: "Duración:",
      closeBtn: "Cerrar",
      downloadBtn: "Descargar",
      assignToPlaceholder: "Asignar a...",
      tickets: "Tickets",
      lastActivity: "Última actividad",
      categoryLabel: "Categoría:",
      subjectLabel: "Asunto:",
    },
    en: {
      supportAdminTitle: "Support Admin",
      ticketsTab: "Tickets",
      statsTab: "Statistics",
      transcriptsTab: "Transcripts",
      filterAll: "All",
      filterOpen: "Open",
      filterPending: "Pending",
      filterClosed: "Closed",
      searchTicketsPlaceholder: "Search tickets...",
      ticketId: "ID",
      user: "User",
      subject: "Subject",
      status: "Status",
      assignedTo: "Assigned to",
      date: "Date",
      actions: "Actions",
      loading: "Loading...",
      previous: "Previous",
      next: "Next",
      transcriptsAdminTitle: "All Transcripts",
      filterTicket: "Tickets",
      filterChat: "Chats",
      type: "Type",
      referenceId: "Reference",
      participants: "Participants",
      duration: "Duration",
      ticketNumber: "Ticket #",
      openStatus: "Open",
      ticketInfo: "Ticket Information",
      userLabel: "User:",
      createdLabel: "Created:",
      updatedLabel: "Updated:",
      priorityLabel: "Priority:",
      assignedToLabel: "Assigned to:",
      writeReplyPlaceholder: "Write your reply...",
      closeTicketBtn: "Close Ticket",
      transcriptNumber: "Transcript #",
      typeLabel: "Type:",
      referenceLabel: "Reference:",
      dateLabel: "Date:",
      durationLabel: "Duration:",
      closeBtn: "Close",
      downloadBtn: "Download",
      assignToPlaceholder: "Assign to...",
      tickets: "Tickets",
      lastActivity: "Last activity",
      categoryLabel: "Category:",
      subjectLabel: "Subject:",
    },
  };

  /**
   * Idioma actual de la interfaz.
   * Se obtiene de localStorage o del navegador.
   * @type {"es"|"en"}
   */
  let currentLanguage =
    localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");

  /**
   * Actualiza todos los textos de la interfaz según el idioma seleccionado.
   */
  function updateAdminTranslations() {
    document.querySelectorAll("[data-key]").forEach((el) => {
      const key = el.getAttribute("data-key");
      if (!key) return;

      const value = translations[currentLanguage][key];
      if (el.tagName === "INPUT" && el.placeholder) {
        el.placeholder = value;
      } else if (el.tagName === "OPTION") {
        el.textContent = value;
      } else {
        el.textContent = value;
      }
    });
    // Actualizar cabecera de la tabla Top Usuarios
    updateTopUsersTableHeaders();
  }

  /**
   * Actualiza los encabezados de la tabla de top usuarios según el idioma.
   */
  function updateTopUsersTableHeaders() {
    const table = document.getElementById("top-users-list");
    if (!table) return;
    const thead = table.closest("table")?.querySelector("thead");
    if (!thead) return;
    thead.querySelectorAll("th[data-key]").forEach((th) => {
      const key = th.getAttribute("data-key");
      if (translations[currentLanguage][key]) {
        th.textContent = translations[currentLanguage][key];
      }
    });
  }

  // Listeners para cambiar idioma desde la interfaz (sidebar).
  const langLinks = document.querySelectorAll(".lang-link");
  langLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.lang === currentLanguage);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentLanguage = link.dataset.lang;
      localStorage.setItem("language", currentLanguage);
      langLinks.forEach((l) => l.classList.toggle("active", l === link));
      updateAdminTranslations();
    });
  });

  // Inicializa las traducciones al cargar el script.
  updateAdminTranslations();

  // --- CAMBIO DE TEMA (OSC/CLR) ---

  /**
   * Listener para el cambio de tema (oscuro/claro) usando Bootstrap 5.
   * Guarda la preferencia en localStorage.
   * @see https://getbootstrap.com/docs/5.3/customize/color-modes/
   */
  document.addEventListener("DOMContentLoaded", function () {
    const themeSwitch = document.getElementById("themeSwitch");
    const themeIcon = document.querySelector('label[for="themeSwitch"] i');
    let savedTheme = localStorage.getItem("nebura-admin-theme") || "dark";
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    if (themeSwitch) themeSwitch.checked = savedTheme === "dark";
    if (themeIcon) themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    if (themeSwitch) {
      themeSwitch.addEventListener("change", () => {
        const theme = themeSwitch.checked ? "dark" : "light";
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("nebura-admin-theme", theme);
        if (themeIcon) themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
      });
    }
  });

  // --- FIN DEL SCRIPT DE ADMINISTRACIÓN DE SOPORTE ---
});

// --- FIN DEL ARCHIVO ---
