/**
 * Evento principal al cargar el DOM.
 * Inicializa temas, sockets, listeners y carga inicial de datos.
 */
document.addEventListener("DOMContentLoaded", function () {
  // -------------------- VARIABLES GLOBALES --------------------
  /**
   * @type {Socket} socket - Instancia de Socket.IO para comunicación en tiempo real.
   * @type {string|null} currentTicketId - Ticket actualmente abierto en el modal de chat.
   * @type {string|null} currentAdminTicketId - (No usado, reservado para admins).
   * @type {string} currentSection - Sección actual ("tickets", "chat", "transcripts").
   * @type {number} currentPage - Página actual de paginación.
   * @type {number} itemsPerPage - Cantidad de ítems por página (tickets/transcripciones).
   * @type {number|null} ticketChatAutoRefreshInterval - Intervalo para refresco automático del chat de tickets.
   */
  let socket;
  let currentTicketId = null;
  let currentAdminTicketId = null;
  let currentSection = "tickets";
  let currentPage = 1;
  const itemsPerPage = 10;
  let ticketChatAutoRefreshInterval = null;

  // -------------------- INICIALIZACIÓN --------------------
  /**
   * Inicializa el tema visual (oscuro/claro) según preferencia del usuario.
   */
  initTheme();

  /**
   * Inicializa la conexión WebSocket con el backend de soporte.
   * Permite recibir eventos en tiempo real (tickets, chat, usuarios online).
   */
  initSocketConnection();

  /**
   * Inicializa todos los listeners de UI (botones, formularios, tabs, etc).
   */
  initEventListeners();

  /**
   * Carga la lista de tickets de soporte del usuario.
   */
  loadTickets();

  /**
   * Verifica el estado de la API de soporte y la conexión WebSocket.
   */
  checkSystemStatus();

  // -------------------- FUNCIONES DE INICIALIZACIÓN --------------------

  /**
   * Lee el tema guardado en localStorage y lo aplica al documento.
   * Actualiza el icono del botón de cambio de tema.
   */
  function initTheme() {
    const savedTheme = localStorage.getItem("nebura-chat-theme") || "dark";
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    updateThemeButton(savedTheme);
  }

  /**
   * Establece la conexión con el servidor de soporte mediante Socket.IO.
   * Maneja eventos de conexión, desconexión, errores y mensajes personalizados.
   */
  function initSocketConnection() {
    // Se conecta usando el path personalizado para soporte.
    socket = io({
      //path: '/support/socket.io',
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Evento: conexión exitosa
    socket.on("connect", () => {
      // Registra el usuario en el sistema de soporte
      socket.emit("register", {
        id: user.id,
        name: `${user.global_name ? user.global_name : user.username}`,
        avatar: `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=512`,
        status: "online",
      });
      updateConnectionStatus("socket", true);
      console.log("Conectado al servidor de soporte");
      showNotification("Conectado al servidor en tiempo real", "success");
    });

    // Evento: desconexión
    socket.on("disconnect", () => {
      updateConnectionStatus("socket", false);
      console.log("Desconectado del servidor de soporte");
      showNotification("Desconectado del servidor de soporte", "warning");
    });

    // Evento: error de conexión
    socket.on("connect_error", (err) => {
      console.error("Error de conexión:", err.message);
      updateConnectionStatus("socket", false);
      showNotification("Error al conectar con el servidor", "error");
    });

    // -------------------- EVENTOS PERSONALIZADOS SOCKET --------------------

    // Nuevo ticket creado (por cualquier usuario)
    socket.on("ticket:created", (ticket) => {
      if (currentSection === "tickets") {
        addTicketToTable(ticket);
        showNotification(`Ticket #${ticket.ticketId} creado`, "success");
      }
    });

    // Actualización de ticket (estado, mensajes, etc)
    socket.on("ticket:updated", (ticket) => {
      if (currentTicketId === ticket.ticketId) {
        updateTicketChat(ticket);
      }
      updateTicketInList(ticket);
    });

    // Nuevo mensaje en un ticket
    socket.on("ticket:message", (data) => {
      if (currentTicketId === data.ticketId) {
        appendNewMessage(data.message);
      }
    });

    // Mensaje global en el chat de la comunidad
    socket.on("global:message", (message) => {
      if (currentSection === "chat") {
        appendGlobalMessage(message);
      }
    });

    // Lista de usuarios online en el chat global
    socket.on("user:online", (users) => {
      if (currentSection === "chat") {
        updateOnlineUsers(users);
      }
    });

    // Solicita unirse al canal de un ticket específico (cuando se abre el modal)
    socket.emit("join:ticket", { ticketId: currentTicketId });

    // Historial del chat global (al abrir el tab)
    socket.on("global:history", (messages) => {
      const container = document.getElementById("global-chat-messages");
      container.innerHTML = ""; // Limpia el chat antes de mostrar el historial
      messages.forEach((msg) => appendGlobalMessage(msg));
    });
  }

  /**
   * Inicializa todos los listeners de UI:
   * - Navegación entre tabs
   * - Formularios y botones de tickets
   * - Chat global y chat de tickets
   * - Transcripciones
   * - Eventos de modales
   */
  function initEventListeners() {
    // Navegación entre secciones (sidebar)
    document.querySelectorAll("#supportNav .nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.getAttribute("href").substring(1);
        switchSection(target);
      });
    });

    // Tickets
    document.getElementById("new-ticket-btn").addEventListener("click", initNewTicketModal);
    document.getElementById("new-ticket-form").addEventListener("submit", handleNewTicketSubmit);
    document.getElementById("refresh-tickets").addEventListener("click", () => {
      loadTickets();
      showNotification("Tickets actualizados", "success");
    });
    document.getElementById("ticket-filter").addEventListener("change", filterTickets);
    document
      .getElementById("ticket-search")
      .addEventListener("input", debounce(searchTickets, 300));

    // Chat global
    document.getElementById("toggle-chat-theme").addEventListener("click", toggleChatTheme);
    document.getElementById("send-global-msg-btn").addEventListener("click", sendGlobalMessage);
    document.getElementById("global-chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendGlobalMessage();
      }
    });

    // Chat de ticket
    document.getElementById("send-ticket-msg-btn").addEventListener("click", sendTicketMessage);
    document.getElementById("ticket-chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendTicketMessage();
      }
    });

    document.getElementById("close-ticket-btn").addEventListener("click", closeCurrentTicket);

    // Transcripciones
    document.getElementById("refresh-transcripts").addEventListener("click", loadTranscripts);
    document.getElementById("transcript-filter").addEventListener("change", filterTranscripts);
    document.getElementById("download-transcript").addEventListener("click", downloadTranscript);

    // Eventos de cierre de modal de ticket (para limpiar estado)
    const ticketModal = document.getElementById("ticketChatModal");
    if (ticketModal) {
      ticketModal.addEventListener("hidden.bs.modal", () => {
        currentTicketId = null;
        stopTicketChatAutoRefresh();
      });
    }
  }

  // -------------------- SISTEMA DE TICKETS --------------------

  /**
   * Carga la lista de tickets del usuario desde el backend.
   * @param {number} page - Página a cargar (paginación).
   */
  async function loadTickets(page = 1) {
    try {
      showLoader("#tickets-list");

      const filter = document.getElementById("ticket-filter").value;
      const search = document.getElementById("ticket-search").value;

      const response = await fetch(
        `/dashboard/utils/tickets/${user.id}?page=${page}&limit=${itemsPerPage}&filter=${filter}&search=${search}`,
      );

      if (!response.ok) throw new Error("Error al cargar tickets");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      renderTickets(data.data);
      updatePagination("#tickets-pagination", page, Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error("Error loading tickets:", error);
      showNotification(`Error al cargar tickets: ${error.message}`, "error");
      document.getElementById("tickets-list").innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-danger">
            Error al cargar tickets. Intenta recargar la página.
          </td>
        </tr>
      `;
    }
  }

  /**
   * Renderiza la tabla de tickets en la UI.
   * @param {Array} tickets - Lista de tickets a mostrar.
   */
  function renderTickets(tickets) {
    const tbody = document.getElementById("tickets-list");

    if (!tickets || tickets.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            No se encontraron tickets. Crea uno nuevo para comenzar.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tickets
      .map(
        (ticket) => `
      <tr data-ticket-id="${ticket.ticketId}">
        <td>${ticket.ticketId}</td>
        <td>${ticket.reason || "Sin asunto"}</td>
        <td>
          <span class="ticket-status-badge ${ticket.status.toLowerCase()}">
            ${getStatusText(ticket.status)}
          </span>
        </td>
        <td>${formatDate(ticket.createdAt)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-ticket-btn" data-ticket-id="${ticket.ticketId}">
            <i class="fas fa-eye"></i>
          </button>
          ${
            ticket.status === "OPEN"
              ? `
            <button class="btn btn-sm btn-outline-danger close-ticket-btn ms-2" data-ticket-id="${ticket.ticketId}">
              <i class="fas fa-times"></i>
            </button>
          `
              : ""
          }
        </td>
      </tr>
    `,
      )
      .join("");

    // Agregar event listeners a los botones
    document.querySelectorAll(".view-ticket-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const ticketId = e.currentTarget.dataset.ticketId;
        viewTicket(ticketId);
      });
    });

    document.querySelectorAll(".close-ticket-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const ticketId = e.currentTarget.dataset.ticketId;
        closeTicket(ticketId);
      });
    });
  }

  /**
   * Abre el modal de chat de un ticket específico y carga sus mensajes.
   * @param {string} ticketId - ID del ticket a visualizar.
   */
  async function viewTicket(ticketId) {
    try {
      showLoader("#ticket-chat-messages");

      const response = await fetch(`/dashboard/utils/tickets/${user.id}/${ticketId}`);

      if (!response.ok) throw new Error("Error al cargar ticket");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      const ticket = data.data;
      currentTicketId = ticket.ticketId;

      // Actualizar modal con la información del ticket
      document.getElementById("ticket-id-placeholder").textContent = ticket.ticketId;
      document.getElementById("ticket-status-badge").className =
        `badge ${getStatusBadgeClass(ticket.status)}`;
      document.getElementById("ticket-status-badge").textContent = getStatusText(ticket.status);
      document.getElementById("ticket-created-at").textContent = formatDateTime(ticket.createdAt);
      document.getElementById("ticket-updated-at").textContent = formatDateTime(ticket.updatedAt);
      document.getElementById("ticket-category-info").textContent = ticket.category || "General";
      document.getElementById("ticket-priority-info").textContent = ticket.priority || "Normal";
      document.getElementById("ticket-subject-info").textContent = ticket.reason || "Sin asunto";

      // Mostrar adjuntos
      const attachmentsContainer = document.getElementById("ticket-attachments-info");
      attachmentsContainer.innerHTML =
        ticket.attachments && ticket.attachments.length > 0
          ? ticket.attachments
              .map(
                (file) => `
          <div class="d-flex align-items-center mb-2">
            <a href="${file.url}" target="_blank" class="text-truncate" style="max-width: 200px;">
              <i class="fas fa-paperclip me-2"></i>${file.name}
            </a>
          </div>
        `,
              )
              .join("")
          : '<span class="text-muted">Ninguno</span>';

      // --- NUEVO: Cargar mensajes del ticket ---
      const msgResponse = await fetch(`/dashboard/utils/tickets/${user.id}/${ticketId}/messages`);
      if (!msgResponse.ok) throw new Error("Error al cargar mensajes del ticket");
      const msgData = await msgResponse.json();
      if (!msgData.success)
        throw new Error(msgData.message || "Error en la respuesta del servidor");
      renderTicketMessages(msgData.data);

      // Iniciar refresco automático
      startTicketChatAutoRefresh();

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById("ticketChatModal"));
      modal.show();
    } catch (error) {
      console.error("Error viewing ticket:", error);
      showNotification(`Error al cargar ticket: ${error.message}`, "error");
    }
  }

  /**
   * Renderiza los mensajes de un ticket en el chat del modal.
   * @param {Array} messages - Lista de mensajes del ticket.
   */
  function renderTicketMessages(messages) {
    const container = document.getElementById("ticket-chat-messages");
    container.innerHTML = "";

    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          No hay mensajes en este ticket. Envía el primero.
        </div>
      `;
      return;
    }

    messages.forEach((msg) => {
      const isCurrentUser = msg.senderId === user.id;
      const isSystem = msg.senderId === "system";

      if (isSystem) {
        container.innerHTML += `
          <div class="ticket-message system">
            ${msg.content}
          </div>
        `;
      } else {
        container.innerHTML += `
          <div class="ticket-message ${isCurrentUser ? "user-message" : ""}">
            <div class="ticket-message-inner">
              <div class="ticket-message-header">
                <img src="${msg.senderAvatar ? msg.senderAvatar : "https://imgs.search.brave.com/feXSd8MjAKMZAv-aUujJ0kr2_cdg5RlRf8dsH021ig8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYXJ0cy5jb20v/ZmlsZXMvMTAvRGVm/YXVsdC1Qcm9maWxl/LVBpY3R1cmUtUE5H/LUltYWdlLVRyYW5z/cGFyZW50LUJhY2tn/cm91bmQucG5n"}" 
                     alt="${msg.senderName}" 
                     class="ticket-message-avatar">
                <span class="ticket-message-sender">${msg.senderName}</span>
                <span class="ticket-message-time">${formatDateTime(msg.timestamp)}</span>
              </div>
              <div class="ticket-message-content markdown-content">
                ${marked.parse(msg.content)}
              </div>
            </div>
          </div>
        `;
      }
    });

    // Scroll al final
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Agrega un nuevo mensaje al chat del ticket (cuando llega por socket).
   * @param {Object} msg - Mensaje recibido.
   */
  function appendNewMessage(msg) {
    const container = document.getElementById("ticket-chat-messages");
    const isCurrentUser = msg.senderId === user.id;
    const isSystem = msg.senderId === "system";

    if (isSystem) {
      container.innerHTML += `
      <div class="ticket-message system">
        ${msg.content}
      </div>
    `;
    } else {
      container.innerHTML += `
      <div class="ticket-message ${isCurrentUser ? "user-message" : ""}">
        <div class="ticket-message-inner">
          <div class="ticket-message-header">
            <img src="${msg.senderAvatar ? msg.senderAvatar : "https://imgs.search.brave.com/feXSd8MjAKMZAv-aUujJ0kr2_cdg5RlRf8dsH021ig8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYXJ0cy5jb20v/ZmlsZXMvMTAvRGVm/YXVsdC1Qcm9maWxl/LVBpY3R1cmUtUE5H/LUltYWdlLVRyYW5z/cGFyZW50LUJhY2tn/cm91bmQucG5n"}" 
                 alt="${msg.senderName}" 
                 class="ticket-message-avatar">
            <span class="ticket-message-sender">${msg.senderName}</span>
            <span class="ticket-message-time">${formatDateTime(msg.timestamp)}</span>
          </div>
          <div class="ticket-message-content markdown-content">
            ${marked.parse(msg.content)}
          </div>
        </div>
      </div>
    `;
    }
    // Scroll al final
    container.scrollTop = container.scrollHeight;
    console.log("Nuevo mensaje agregado al chat del ticket:", msg);
  }

  /**
   * Envía un mensaje en el chat del ticket actual.
   * Utiliza Socket.IO para enviar el mensaje al backend.
   */
  async function sendTicketMessage() {
    const input = document.getElementById("ticket-chat-input");
    const message = input.value.trim();
    if (!message || !currentTicketId) return;
    input.value = "";
    socket.emit(
      "ticket:message",
      {
        ticketId: currentTicketId,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        content: message,
      },
      (response) => {
        if (!response || !response.success) {
          showNotification(response?.message || "Error al enviar mensaje", "error");
        }
        // NO agregues el mensaje aquí, solo cuando llegue por socket
      },
    );
  }

  /**
   * Inicializa el modal de nuevo ticket (limpia el formulario).
   */
  function initNewTicketModal() {
    // Aquí puedes agregar lógica personalizada si lo necesitas.
    // Por ejemplo, limpiar el formulario:
    const form = document.getElementById("new-ticket-form");
    if (form) form.reset();
    // También puedes limpiar la previsualización de adjuntos, etc.
  }

  /**
   * Filtra los tickets según el select de estado.
   */
  function filterTickets() {
    loadTickets(1); // Recarga la lista de tickets desde la página 1 con el filtro actual
  }

  /**
   * Busca tickets según el input de búsqueda.
   */
  function searchTickets() {
    loadTickets(1); // Recarga la lista de tickets desde la página 1 con el filtro y búsqueda actual
  }

  /**
   * Filtra las transcripciones según el tipo.
   */
  function filterTranscripts() {
    loadTranscripts(1); // Recarga la lista de transcripciones desde la página 1 con el filtro actual
  }

  /**
   * Maneja el envío del formulario de nuevo ticket.
   * Valida los campos y envía la petición al backend.
   */
  async function handleNewTicketSubmit(event) {
    event.preventDefault();

    const subject = document.getElementById("ticket-subject").value.trim();
    const category = document.getElementById("ticket-category").value;
    const message = document.getElementById("ticket-message").value.trim();
    const priority = document.getElementById("ticket-priority").checked ? "Alta" : "Normal";
    // Adjuntos y validaciones extra pueden agregarse aquí

    if (!subject || !category || !message) {
      showNotification("Por favor completa todos los campos obligatorios", "warning");
      return;
    }

    try {
      const response = await fetch(`/dashboard/utils/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          reason: subject,
          userName: user.global_name || user.username,
          userAvatar: user.avatar,
          category,
          message,
          priority,
          userId: user.id,
          guildId: "Nebura AI", // Valor dummy
          channelId: "web-client", // Valor dummy
        }),
      });

      if (!response.ok) throw new Error("Error al crear ticket");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      showNotification("Ticket creado correctamente", "success");
      // Cierra el modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("newTicketModal"));
      if (modal) modal.hide();
      // Recarga la lista de tickets
      loadTickets();
    } catch (error) {
      console.error("Error creando ticket:", error);
      showNotification(`Error al crear ticket: ${error.message}`, "error");
    }
  }

  /**
   * Cierra un ticket (cambia su estado a 'CLOSED').
   * @param {string} ticketId - ID del ticket a cerrar.
   */
  async function closeTicket(ticketId) {
    if (!confirm("¿Estás seguro de que quieres cerrar este ticket?")) return;

    try {
      const response = await fetch(`/dashboard/utils/tickets/${user.id}/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (!response.ok) throw new Error("Error al cerrar ticket");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      showNotification("Ticket cerrado correctamente", "success");
      loadTickets(currentPage);

      // Si el ticket cerrado es el que está abierto en el modal, actualizar
      if (currentTicketId === ticketId) {
        document.getElementById("ticket-status-badge").className = "badge bg-danger";
        document.getElementById("ticket-status-badge").textContent = "Cerrado";
        document.getElementById("close-ticket-btn").disabled = true;
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      showNotification(`Error al cerrar ticket: ${error.message}`, "error");
    }
  }

  /**
   * Cierra el ticket actualmente abierto en el modal.
   */
  function closeCurrentTicket() {
    if (currentTicketId) {
      closeTicket(currentTicketId);
    }
  }

  // -------------------- CHAT GLOBAL --------------------

  /**
   * Actualiza la lista de usuarios en línea en el chat global.
   * @param {Array} users - Lista de usuarios online.
   */
  function updateOnlineUsers(users) {
    const container = document.getElementById("online-users");

    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="text-center py-3 text-muted">
          No hay usuarios en línea
        </div>
      `;
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
      <div class="chat-user">
        <img src="${user.avatar || "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9sZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn"}" 
             alt="${user.name}" 
             class="chat-user-avatar">
        <span class="chat-user-name">${user.name}</span>
        <span class="chat-user-status ${user.status === "online" ? "online" : ""}"></span>
      </div>
    `,
      )
      .join("");
  }

  /**
   * Agrega un mensaje al chat global.
   * @param {Object} message - Mensaje recibido.
   */
  function appendGlobalMessage(message) {
    const container = document.getElementById("global-chat-messages");
    const welcomeMsg = container.querySelector(".chat-welcome-message");

    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    const isCurrentUser = message.senderId === user.id;

    container.innerHTML += `
      <div class="chat-message ${isCurrentUser ? "user-message" : ""}">
        <div class="chat-message-inner">
          <div class="chat-message-header">
            <img src="${message.senderAvatar || "https://imgs.search.brave.com/_kjApAJTf5tLbC6CDpbqV5r8IE6EzQV4DwEy0MwUYdo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9zaHV0dGVy/c3RvY2svcGhvdG9z/LzUzNTg1MzI2My9k/aXNwbGF5XzE1MDAv/c3RvY2stdmVjdG9y/LXByb2ZpbGUtcGhv/dG8tdmVjdG9yLXBs/YWNlaG9sZGVyLXBp/Yy1tYWxlLXBlcnNv/bi1kZWZhdWx0LXBy/b2ZpbGUtZ3JheS1w/aG90by1waWN0dXJl/LWF2YXRhci01MzU4/NTMyNjMuanBn"}" 
                 alt="${message.senderName}" 
                 class="chat-message-avatar">
            <span class="chat-message-sender">${message.senderName}</span>
            <span class="chat-message-time">${formatTime(message.timestamp)}</span>
          </div>
          <div class="chat-message-content markdown-content">
            ${marked.parse(message.content)}
          </div>
        </div>
      </div>
    `;

    // Scroll al final
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Envía un mensaje en el chat global.
   * Utiliza Socket.IO para enviar el mensaje al backend.
   */
  async function sendGlobalMessage() {
    const input = document.getElementById("global-chat-input");
    const message = input.value.trim();

    if (!message) return;

    try {
      // NO agregar el mensaje localmente aquí
      input.value = "";

      // Enviar al servidor via socket
      socket.emit("global:message", {
        content: message,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
      });
    } catch (error) {
      console.error("Error sending global message:", error);
      showNotification(`Error al enviar mensaje: ${error.message}`, "error");
    }
  }

  // -------------------- TRANSCRIPCIONES --------------------

  /**
   * Carga la lista de transcripciones del usuario.
   * @param {number} page - Página a cargar.
   */
  async function loadTranscripts(page = 1) {
    try {
      showLoader("#transcripts-list");

      const filter = document.getElementById("transcript-filter").value;

      const response = await fetch(
        `/dashboard/utils/transcripts?userId=${user.id}&page=${page}&limit=${itemsPerPage}&type=${filter}`,
      );

      if (!response.ok) throw new Error("Error al cargar transcripciones");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      renderTranscripts(data.data);
      updatePagination("#transcripts-pagination", page, Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error("Error loading transcripts:", error);
      showNotification(`Error al cargar transcripciones: ${error.message}`, "error");
      document.getElementById("transcripts-list").innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-danger">
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
  function renderTranscripts(transcripts) {
    const tbody = document.getElementById("transcripts-list");

    if (!transcripts || transcripts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            No se encontraron transcripciones
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = transcripts
      .map(
        (transcript) => `
      <tr>
        <td>${transcript.id}</td>
        <td>${transcript.type === "ticket" ? "Ticket" : "Chat"}</td>
        <td>${formatDate(transcript.createdAt)}</td>
        <td>${transcript.participants.map((p) => p.name).join(", ")}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-transcript-btn" 
                  data-transcript-id="${transcript.id}">
            <i class="fas fa-eye"></i> Ver
          </button>
          <button class="btn btn-sm btn-outline-secondary download-transcript-btn ms-2" 
                  data-transcript-id="${transcript.id}">
            <i class="fas fa-download"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");

    // Agregar event listeners a los botones
    document.querySelectorAll(".view-transcript-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const transcriptId = e.currentTarget.dataset.transcriptId;
        viewTranscript(transcriptId);
      });
    });

    document.querySelectorAll(".download-transcript-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const transcriptId = e.currentTarget.dataset.transcriptId;
        downloadTranscript(transcriptId);
      });
    });
  }

  /**
   * Abre el modal de una transcripción y muestra su contenido.
   * @param {string} transcriptId - ID de la transcripción.
   */
  async function viewTranscript(transcriptId) {
    try {
      showLoader("#transcript-content");

      const response = await fetch(`/dashboard/utils/transcripts/${transcriptId}`);

      if (!response.ok) throw new Error("Error al cargar transcripción");

      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      const transcript = data.data;

      // Actualizar modal con la información de la transcripción
      document.getElementById("transcript-id-placeholder").textContent = transcript.id;
      document.getElementById("transcript-type").textContent =
        transcript.type === "ticket" ? "Ticket" : "Chat";
      document.getElementById("transcript-date").textContent = formatDateTime(transcript.createdAt);
      document.getElementById("transcript-participants").textContent = transcript.participants
        .map((p) => p.name)
        .join(", ");
      document.getElementById("transcript-duration").textContent = formatDuration(
        transcript.duration,
      );

      // Mostrar contenido de la transcripción
      renderTranscriptContent(transcript.content);

      // Configurar botón de descarga
      document.getElementById("download-transcript").onclick = () => {
        downloadTranscript(transcript.id);
      };

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById("transcriptModal"));
      modal.show();
    } catch (error) {
      console.error("Error viewing transcript:", error);
      showNotification(`Error al cargar transcripción: ${error.message}`, "error");
    }
  }

  /**
   * Renderiza el contenido de una transcripción.
   * @param {Array} content - Mensajes de la transcripción.
   */
  function renderTranscriptContent(content) {
    const container = document.getElementById("transcript-content");

    if (!content || content.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          No hay contenido en esta transcripción
        </div>
      `;
      return;
    }

    container.innerHTML = content
      .map((item) => {
        if (item.type === "system") {
          return `
          <div class="text-center my-3 text-muted small">
            ${item.content}
          </div>
        `;
        } else {
          const isCurrentUser = item.senderId === user.id;
          return `
          <div class="d-flex mb-3 ${isCurrentUser ? "justify-content-end" : ""}">
            <div class="transcript-message ${isCurrentUser ? "bg-primary text-white" : "bg-light"} 
                 p-3 rounded" style="max-width: 80%;">
              <div class="d-flex align-items-center mb-1">
                <strong>${item.senderName}</strong>
                <span class="ms-2 small">${formatTime(item.timestamp)}</span>
              </div>
              <div class="markdown-content">
                ${marked.parse(item.content)}
              </div>
            </div>
          </div>
        `;
        }
      })
      .join("");
  }

  /**
   * Descarga una transcripción en formato PDF.
   * @param {string} transcriptId - ID de la transcripción.
   */
  async function downloadTranscript(transcriptId) {
    try {
      const response = await fetch(`/dashboard/utils/transcripts/${transcriptId}/download`);

      if (!response.ok) throw new Error("Error al descargar transcripción");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcripcion-${transcriptId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showNotification("Transcripción descargada", "success");
    } catch (error) {
      console.error("Error downloading transcript:", error);
      showNotification(`Error al descargar transcripción: ${error.message}`, "error");
    }
  }

  // -------------------- SINCRONIZACIÓN DE SECCIÓN Y TABS --------------------
  document.querySelectorAll("#supportTabs .nav-link").forEach((tab) => {
    tab.addEventListener("shown.bs.tab", function (e) {
      const target = e.target.getAttribute("data-bs-target");
      if (target === "#chat-tab-pane") {
        currentSection = "chat";
        // Solicitar usuarios en línea al servidor si el socket está conectado
        if (socket && socket.connected) {
          socket.emit("user:list");
        }
      } else if (target === "#tickets-tab-pane") {
        currentSection = "tickets";
      } else if (target === "#transcripts-tab-pane") {
        currentSection = "transcripts";
      }
    });
  });

  // Cuando el socket se conecta, pedir la lista de usuarios si estamos en chat
  if (socket) {
    socket.on("connect", () => {
      if (currentSection === "chat") {
        socket.emit("user:list");
      }
    });
  }

  // -------------------- FUNCIONES AUXILIARES --------------------

  /**
   * Cambia la sección visible de la interfaz (tickets, chat, transcripciones).
   * @param {string} section - Nombre de la sección.
   */
  function switchSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll("main > section").forEach((sec) => {
      sec.classList.add("d-none");
    });

    // Mostrar la sección seleccionada SOLO si existe
    const sectionElement = document.getElementById(section); // <-- CORREGIDO
    if (sectionElement) {
      sectionElement.classList.remove("d-none");
    } else {
      console.warn(`No existe la sección: ${section}`);
      return;
    }

    // Actualizar navegación activa
    document.querySelectorAll("#supportNav .nav-link").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${section}`);
    });

    currentSection = section;

    // Cargar datos según la sección
    switch (section) {
      case "tickets":
        loadTickets();
        break;
      case "chat":
        if (socket && !socket.connected) {
          socket.connect();
        }
        break;
      case "transcripts":
        loadTranscripts();
        break;
    }
  }

  /**
   * Actualiza el estado visual de la conexión (WebSocket o API).
   * @param {string} type - "socket" o "api".
   * @param {boolean} connected - Estado de conexión.
   */
  function updateConnectionStatus(type, connected) {
    const indicator = document.getElementById(`${type}-indicator`);
    const badge = document.getElementById(`${type}-status-badge`);
    const text = document.getElementById(`${type}-status-text`);

    if (connected) {
      indicator.classList.add("active");
      badge.className = "badge bg-success";
      badge.innerHTML = `<i class="fas fa-check-circle me-1"></i>Conectado`;
      text.textContent = type === "socket" ? "Conexión establecida" : "API operativa";
    } else {
      indicator.classList.remove("active");
      badge.className = "badge bg-danger";
      badge.innerHTML = `<i class="fas fa-times-circle me-1"></i>Desconectado`;
      text.textContent = type === "socket" ? "Conexión perdida" : "API no disponible";
    }
  }

  /**
   * Verifica el estado de la API pública de Nebura.
   */
  async function checkSystemStatus() {
    try {
      const response = await fetch("/api/v1/public/status");

      if (!response.ok) throw new Error("Error al verificar estado del sistema");

      const data = await response.json();

      updateConnectionStatus("api", data.status === "Operational");
    } catch (error) {
      console.error("Error checking system status:", error);
      updateConnectionStatus("api", false);
    }
  }

  /**
   * Muestra un loader/spinner en el selector dado.
   * @param {string} selector - Selector CSS del elemento.
   */
  function showLoader(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.innerHTML = `
        <div class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      `;
    }
  }

  /**
   * Actualiza la paginación de la tabla actual.
   * @param {string} selector - Selector CSS de la paginación.
   * @param {number} currentPage - Página actual.
   * @param {number} totalPages - Total de páginas.
   */
  function updatePagination(selector, currentPage, totalPages) {
    const pagination = document.querySelector(selector);
    if (!pagination) return;

    let html = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
      </li>
    `;

    // Mostrar máximo 5 páginas alrededor de la actual
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage >= totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
      </li>
    `;

    pagination.innerHTML = html;

    // Agregar event listeners
    pagination.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        if (currentSection === "tickets") {
          loadTickets(page);
        } else if (currentSection === "transcripts") {
          loadTranscripts(page);
        }
      });
    });
  }

  /**
   * Muestra una notificación tipo toast en la esquina inferior derecha.
   * @param {string} message - Mensaje a mostrar.
   * @param {string} type - Tipo ('success', 'error', 'warning').
   */
  function showNotification(message, type = "success") {
    const toast = document.getElementById("notificationToast");
    if (!toast) return;

    const toastTitle = toast.querySelector("#toast-title");
    const toastBody = toast.querySelector("#toast-body");

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
   * Función de utilidad para limitar la frecuencia de ejecución de otra función.
   * @param {Function} func - Función a debilitar.
   * @param {number} wait - Tiempo de espera en ms.
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
   * Formatea una fecha a formato local corto.
   * @param {string} dateString - Fecha en formato ISO.
   * @returns {string}
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  /**
   * Formatea una hora a formato local corto.
   * @param {string} dateString - Fecha en formato ISO.
   * @returns {string}
   */
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * Formatea fecha y hora a formato local completo.
   * @param {string} dateString - Fecha en formato ISO.
   * @returns {string}
   */
  function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Formatea una duración en ms a minutos y segundos.
   * @param {number} ms - Milisegundos.
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
   * Devuelve el texto legible de un estado de ticket.
   * @param {string} status - Estado ('OPEN', 'CLOSED', 'PENDING').
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
   * Devuelve la clase CSS de badge para un estado de ticket.
   * @param {string} status
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
        
        

        
         * Cambia el tema visual del chat (oscuro/claro).
         */
  function toggleChatTheme() {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("nebura-chat-theme", newTheme);
    updateThemeButton(newTheme);
  }

  /**
   * Actualiza el icono del botón de cambio de tema.
   * @param {string} theme - Tema actual ('dark' o 'light').
   */
  function updateThemeButton(theme) {
    const btn = document.getElementById("toggle-chat-theme");
    if (btn) {
      btn.innerHTML =
        theme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }

  // -------------------- CONFIGURACIÓN DE MARKED Y HIGHLIGHT --------------------
  /**
   * Configura Marked.js para renderizar Markdown y resaltar código con Highlight.js.
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

  // -------------------- REFRESCO AUTOMÁTICO DEL CHAT DE TICKETS --------------------
  /**
   * Inicia el refresco automático de mensajes del chat del ticket abierto.
   * Consulta cada 5 segundos los mensajes del ticket.
   */
  function startTicketChatAutoRefresh() {
    stopTicketChatAutoRefresh();
    if (!currentTicketId) return;
    ticketChatAutoRefreshInterval = setInterval(async () => {
      try {
        const msgResponse = await fetch(
          `/dashboard/utils/tickets/${user.id}/${currentTicketId}/messages`,
        );
        if (!msgResponse.ok) return;
        const msgData = await msgResponse.json();
        if (!msgData.success) return;
        renderTicketMessages(msgData.data);
      } catch (e) {
        // Silenciar errores para evitar spam en consola
      }
    }, 5000);
  }

  /**
   * Detiene el refresco automático del chat de tickets.
   */
  function stopTicketChatAutoRefresh() {
    if (ticketChatAutoRefreshInterval) {
      clearInterval(ticketChatAutoRefreshInterval);
      ticketChatAutoRefreshInterval = null;
    }
  }
});
