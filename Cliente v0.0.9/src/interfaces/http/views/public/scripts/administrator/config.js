// Configuración del Cliente - Funcionalidad
document.addEventListener("DOMContentLoaded", function () {
  // Variables globales
  let currentPage = {
    clients: 1,
    discord: 1,
    whatsapp: 1,
  };
  const itemsPerPage = 10;

  // Inicializar la sección
  initClientConfigSection();

  // Event listeners para los botones de añadir
  if (document.getElementById("add-client-btn")) {
    document.getElementById("add-client-btn").addEventListener("click", () => showClientModal());
  }
  if (document.getElementById("add-discord-btn")) {
    document.getElementById("add-discord-btn").addEventListener("click", () => showDiscordModal());
  }
  if (document.getElementById("add-whatsapp-btn")) {
    document
      .getElementById("add-whatsapp-btn")
      .addEventListener("click", () => showWhatsappModal());
  }

  // Event listeners para los botones de guardar
  if (document.getElementById("saveClientBtn")) {
    document.getElementById("saveClientBtn").addEventListener("click", saveClient);
  }
  if (document.getElementById("saveDiscordBtn")) {
    document.getElementById("saveDiscordBtn").addEventListener("click", saveDiscord);
  }
  if (document.getElementById("saveWhatsappBtn")) {
    document.getElementById("saveWhatsappBtn").addEventListener("click", saveWhatsapp);
  }

  // Función para inicializar la sección
  function initClientConfigSection() {
    loadClients();
    loadDiscordConfigs();
    loadWhatsappConfigs();

    // Configurar paginación
    setupPagination("clients", loadClients);
    setupPagination("discord", loadDiscordConfigs);
    setupPagination("whatsapp", loadWhatsappConfigs);
  }

  // Función para cargar clientes
  function loadClients(page = 1) {
    currentPage.clients = page;
    fetch("/dashboard/utils/client")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          renderClientsTable(data.data);
          renderPagination("clients", data.data.length, page);
        } else {
          showToast("Error", "No se pudieron cargar los clientes", "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading clients:", error);
        showToast("Error", "Error al cargar clientes", "danger");
      });
  }

  // Función para renderizar la tabla de clientes
  function renderClientsTable(clients) {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Paginación
    const start = (currentPage.clients - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedClients = clients.slice(start, end);

    if (paginatedClients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="fas fa-users-slash me-2"></i> No hay clientes registrados
          </td>
        </tr>
      `;
      return;
    }

    paginatedClients.forEach((client) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="badge bg-secondary">${client.id}</span></td>
        <td>${client.name || "-"}</td>
        <td>${client.version || "-"}</td>
        <td><span class="badge ${client.maintenance ? "bg-danger" : "bg-secondary"}">${client.maintenance ? "Sí" : "No"}</span></td>
        <td>-</td>
        <td>${client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "-"}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-table-action edit-client" data-id="${client.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-table-action delete-client" data-id="${client.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Agregar event listeners a los botones de editar/eliminar
    document.querySelectorAll(".edit-client").forEach((btn) => {
      btn.addEventListener("click", (e) => editClient(e.target.closest("button").dataset.id));
    });

    document.querySelectorAll(".delete-client").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        confirmDeleteClient(e.target.closest("button").dataset.id),
      );
    });
  }

  // Función para cargar configuraciones de Discord
  function loadDiscordConfigs(page = 1) {
    currentPage.discord = page;
    fetch("/dashboard/utils/discord/config")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          renderDiscordTable(data.data);
          renderPagination("discord", data.data.length, page);
        } else {
          showToast("Error", "No se pudieron cargar las configuraciones de Discord", "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading Discord configs:", error);
        showToast("Error", "Error al cargar configuraciones de Discord", "danger");
      });
  }

  // Función para renderizar la tabla de Discord
  function renderDiscordTable(configs) {
    const tbody = document.getElementById("discord-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Paginación
    const start = (currentPage.discord - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedConfigs = configs.slice(start, end);

    if (paginatedConfigs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="fas fa-robot me-2"></i> No hay configuraciones de Discord
          </td>
        </tr>
      `;
      return;
    }

    paginatedConfigs.forEach((config) => {
      row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="badge bg-secondary">${config.id}</span></td>
        <td><span class="token-display" title="${config.token || ""}">${config.token ? config.token.substring(0, 8) + "..." : "-"}</span></td>
        <td>${config.clientId || "-"}</td>
        <td><span class="badge ${config.logconsole ? "bg-success" : "bg-secondary"}">${config.logconsole ? "Activo" : "Inactivo"}</span></td>
        <td>${config.webhookURL ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-secondary"></i>'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-table-action edit-discord" data-id="${config.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-table-action delete-discord" data-id="${config.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Agregar event listeners a los botones de editar/eliminar
    document.querySelectorAll(".edit-discord").forEach((btn) => {
      btn.addEventListener("click", (e) => editDiscord(e.target.closest("button").dataset.id));
    });

    document.querySelectorAll(".delete-discord").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        confirmDeleteDiscord(e.target.closest("button").dataset.id),
      );
    });
  }

  // Función para cargar configuraciones de WhatsApp
  function loadWhatsappConfigs(page = 1) {
    currentPage.whatsapp = page;
    fetch("/dashboard/utils/whatsapp")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          renderWhatsappTable(data.data);
          renderPagination("whatsapp", data.data.length, page);
        } else {
          showToast("Error", "No se pudieron cargar las configuraciones de WhatsApp", "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading WhatsApp configs:", error);
        showToast("Error", "Error al cargar configuraciones de WhatsApp", "danger");
      });
  }

  // Función para renderizar la tabla de WhatsApp
  function renderWhatsappTable(configs) {
    const tbody = document.getElementById("whatsapp-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Paginación
    const start = (currentPage.whatsapp - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedConfigs = configs.slice(start, end);

    if (paginatedConfigs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="fas fa-phone-alt me-2"></i> No hay configuraciones de WhatsApp
          </td>
        </tr>
      `;
      return;
    }

    paginatedConfigs.forEach((config) => {
      // WhatsApp solo tiene: id, session, createdAt, updatedAt
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="badge bg-secondary">${config.id}</span></td>
        <td>${config.session || "-"}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-table-action edit-whatsapp" data-id="${config.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-table-action delete-whatsapp" data-id="${config.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Agregar event listeners a los botones de editar/eliminar
    document.querySelectorAll(".edit-whatsapp").forEach((btn) => {
      btn.addEventListener("click", (e) => editWhatsapp(e.target.closest("button").dataset.id));
    });

    document.querySelectorAll(".delete-whatsapp").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        confirmDeleteWhatsapp(e.target.closest("button").dataset.id),
      );
    });
  }

  // Funciones para mostrar modales
  function showClientModal(client = null) {
    const modalEl = document.getElementById("clientModal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById("clientForm");
    if (!form) return;

    if (client) {
      document.getElementById("clientModalLabel").textContent = "Editar Cliente";
      if (document.getElementById("clientId"))
        document.getElementById("clientId").value = client.id || "";
      if (document.getElementById("clientName"))
        document.getElementById("clientName").value = client.name || "";
      // Solo asigna si existen los campos en el DOM
      if (document.getElementById("clientEmail"))
        document.getElementById("clientEmail").value = client.email || "";
      if (document.getElementById("clientPhone"))
        document.getElementById("clientPhone").value = client.phone || "";
      if (document.getElementById("clientStatus"))
        document.getElementById("clientStatus").value = client.status || "active";
      if (document.getElementById("clientNotes"))
        document.getElementById("clientNotes").value = client.notes || "";
      // Si tienes campos adicionales como version o maintenance, agrégalos aquí solo si existen en el DOM
      if (document.getElementById("clientVersion") && client.version !== undefined)
        document.getElementById("clientVersion").value = client.version || "";
      if (document.getElementById("clientMaintenance") && client.maintenance !== undefined)
        document.getElementById("clientMaintenance").value = client.maintenance ? "true" : "false";
    } else {
      document.getElementById("clientModalLabel").textContent = "Nuevo Cliente";
      form.reset();
      if (document.getElementById("clientId")) document.getElementById("clientId").value = "";
    }

    modal.show();
  }

  function showDiscordModal(config = null) {
    const modalEl = document.getElementById("discordModal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById("discordForm");
    if (!form) return;

    if (config) {
      document.getElementById("discordModalLabel").textContent = "Editar Configuración de Discord";
      document.getElementById("discordId").value = config.id || "";
      document.getElementById("discordToken").value = config.token || "";
      document.getElementById("discordClientId").value = config.clientId || "";
      document.getElementById("discordWebhook").value = config.webhookURL || "";
      document.getElementById("discordStatus").value = config.logconsole ? "active" : "inactive";
      document.getElementById("discordConfig").value = "";
    } else {
      document.getElementById("discordModalLabel").textContent = "Nueva Configuración de Discord";
      form.reset();
      document.getElementById("discordId").value = "";
      document.getElementById("discordConfig").value = "";
    }

    modal.show();
  }

  function showWhatsappModal(config = null) {
    const modalEl = document.getElementById("whatsappModal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById("whatsappForm");
    if (!form) return;

    if (config) {
      document.getElementById("whatsappModalLabel").textContent =
        "Editar Configuración de WhatsApp";
      document.getElementById("whatsappId").value = config.id || "";
      document.getElementById("whatsappNumber").value = config.session || "";
      document.getElementById("whatsappApiKey").value = "";
      document.getElementById("whatsappWebhook").value = "";
      document.getElementById("whatsappStatus").value = "active";
      document.getElementById("whatsappConfig").value = "";
    } else {
      document.getElementById("whatsappModalLabel").textContent = "Nueva Configuración de WhatsApp";
      form.reset();
      document.getElementById("whatsappId").value = "";
      document.getElementById("whatsappConfig").value = "";
    }

    modal.show();
  }

  // Funciones para editar registros
  function editClient(id) {
    fetch(`/dashboard/utils/client/${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showClientModal(data.data);
        } else {
          showToast("Error", "No se pudo cargar el cliente", "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading client:", error);
        showToast("Error", "Error al cargar cliente", "danger");
      });
  }

  function editDiscord(id) {
    fetch(`/dashboard/utils/discord/config/${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showDiscordModal(data.data);
        } else {
          showToast("Error", "No se pudo cargar la configuración de Discord", "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading Discord config:", error);
        showToast("Error", "Error al cargar configuración de Discord", "danger");
      });
  }

  function editWhatsapp(id) {
    fetch(`/dashboard/utils/whatsapp/${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showWhatsappModal(data.data);
        } else {
          showToast("Error", "No se pudo cargar la configuración de WhatsApp", "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading WhatsApp config:", error);
        showToast("Error", "Error al cargar configuración de WhatsApp", "danger");
      });
  }

  // Funciones para guardar registros
  function saveClient() {
    const form = document.getElementById("clientForm");
    if (!form) return;
    const id = document.getElementById("clientId").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/dashboard/utils/client/${id}` : "/dashboard/utils/client";

    const clientData = {
      name: document.getElementById("clientName").value,
      version: document.getElementById("clientVersion").value,
      maintenance: document.getElementById("clientMaintenance").value === "true",
    };

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clientData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast(
            "Éxito",
            id ? "Cliente actualizado correctamente" : "Cliente creado correctamente",
            "success",
          );
          loadClients(currentPage.clients);
          bootstrap.Modal.getInstance(document.getElementById("clientModal")).hide();
        } else {
          showToast("Error", data.message || "Error al guardar el cliente", "danger");
        }
      })
      .catch((error) => {
        console.error("Error saving client:", error);
        showToast("Error", "Error al guardar el cliente", "danger");
      });
  }

  function saveDiscord() {
    const form = document.getElementById("discordForm");
    if (!form) return;
    const id = document.getElementById("discordId").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/dashboard/utils/discord/config/${id}` : "/dashboard/utils/discord/config";

    const discordData = {
      token: document.getElementById("discordToken").value,
      clientId: document.getElementById("discordClientId").value,
      webhookURL: document.getElementById("discordWebhook").value,
      logconsole: document.getElementById("discordStatus").value === "active",
    };

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast(
            "Éxito",
            id
              ? "Configuración de Discord actualizada correctamente"
              : "Configuración de Discord creada correctamente",
            "success",
          );
          loadDiscordConfigs(currentPage.discord);
          bootstrap.Modal.getInstance(document.getElementById("discordModal")).hide();
        } else {
          showToast(
            "Error",
            data.message || "Error al guardar la configuración de Discord",
            "danger",
          );
        }
      })
      .catch((error) => {
        console.error("Error saving Discord config:", error);
        showToast("Error", "Error al guardar la configuración de Discord", "danger");
      });
  }

  function saveWhatsapp() {
    const form = document.getElementById("whatsappForm");
    if (!form) return;
    const id = document.getElementById("whatsappId").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/dashboard/utils/whatsapp/${id}` : "/dashboard/utils/whatsapp";

    const whatsappData = {
      session: document.getElementById("whatsappNumber").value,
    };

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(whatsappData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast(
            "Éxito",
            id
              ? "Configuración de WhatsApp actualizada correctamente"
              : "Configuración de WhatsApp creada correctamente",
            "success",
          );
          loadWhatsappConfigs(currentPage.whatsapp);
          bootstrap.Modal.getInstance(document.getElementById("whatsappModal")).hide();
        } else {
          showToast(
            "Error",
            data.message || "Error al guardar la configuración de WhatsApp",
            "danger",
          );
        }
      })
      .catch((error) => {
        console.error("Error saving WhatsApp config:", error);
        showToast("Error", "Error al guardar la configuración de WhatsApp", "danger");
      });
  }

  // Funciones para eliminar registros
  function confirmDeleteClient(id) {
    showConfirmModal(
      "Eliminar Cliente",
      "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.",
      () => deleteClient(id),
    );
  }

  function confirmDeleteDiscord(id) {
    showConfirmModal(
      "Eliminar Configuración de Discord",
      "¿Estás seguro de que deseas eliminar esta configuración de Discord? Esta acción no se puede deshacer.",
      () => deleteDiscord(id),
    );
  }

  function confirmDeleteWhatsapp(id) {
    showConfirmModal(
      "Eliminar Configuración de WhatsApp",
      "¿Estás seguro de que deseas eliminar esta configuración de WhatsApp? Esta acción no se puede deshacer.",
      () => deleteWhatsapp(id),
    );
  }

  function deleteClient(id) {
    fetch(`/dashboard/utils/client/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast("Éxito", "Cliente eliminado correctamente", "success");
          loadClients(currentPage.clients);
        } else {
          showToast("Error", data.message || "Error al eliminar el cliente", "danger");
        }
      })
      .catch((error) => {
        console.error("Error deleting client:", error);
        showToast("Error", "Error al eliminar el cliente", "danger");
      });
  }

  function deleteDiscord(id) {
    fetch(`/dashboard/utils/discord/config/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast("Éxito", "Configuración de Discord eliminada correctamente", "success");
          loadDiscordConfigs(currentPage.discord);
        } else {
          showToast(
            "Error",
            data.message || "Error al eliminar la configuración de Discord",
            "danger",
          );
        }
      })
      .catch((error) => {
        console.error("Error deleting Discord config:", error);
        showToast("Error", "Error al eliminar la configuración de Discord", "danger");
      });
  }

  function deleteWhatsapp(id) {
    fetch(`/dashboard/utils/whatsapp/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast("Éxito", "Configuración de WhatsApp eliminada correctamente", "success");
          loadWhatsappConfigs(currentPage.whatsapp);
        } else {
          showToast(
            "Error",
            data.message || "Error al eliminar la configuración de WhatsApp",
            "danger",
          );
        }
      })
      .catch((error) => {
        console.error("Error deleting WhatsApp config:", error);
        showToast("Error", "Error al eliminar la configuración de WhatsApp", "danger");
      });
  }

  // Funciones auxiliares
  function getStatusText(status) {
    const statusMap = {
      active: "Activo",
      inactive: "Inactivo",
      suspended: "Suspendido",
      maintenance: "Mantenimiento",
    };
    return statusMap[status] || status;
  }

  function renderPagination(type, totalItems, currentPage) {
    const pagination = document.getElementById(`${type}-pagination`);
    if (!pagination) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    // Botón Anterior
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>`;
    pagination.appendChild(prevLi);

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      pagination.appendChild(li);
    }

    // Botón Siguiente
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>`;
    pagination.appendChild(nextLi);

    // Event listeners para los botones de paginación
    pagination.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        if (page && page !== currentPage) {
          switch (type) {
            case "clients":
              loadClients(page);
              break;
            case "discord":
              loadDiscordConfigs(page);
              break;
            case "whatsapp":
              loadWhatsappConfigs(page);
              break;
          }
        }
      });
    });
  }

  function setupPagination(type, loadFunction) {
    const pagination = document.getElementById(`${type}-pagination`);
    if (pagination) {
      pagination.addEventListener("click", (e) => {
        if (e.target.classList.contains("page-link")) {
          e.preventDefault();
          const page = parseInt(e.target.dataset.page);
          if (page) {
            loadFunction(page);
          }
        }
      });
    }
  }

  function showConfirmModal(title, message, callback) {
    const modalEl = document.getElementById("confirmModal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    document.getElementById("confirmModalLabel").textContent = title;
    document.getElementById("confirmModalBody").textContent = message;

    const confirmBtn = document.getElementById("confirmModalOk");
    if (confirmBtn) {
      confirmBtn.onclick = function () {
        callback();
        modal.hide();
      };
    }

    modal.show();
  }

  function showToast(title, message, type = "info") {
    const toastEl = document.getElementById("notificationToast");
    if (!toastEl) return;
    const toast = new bootstrap.Toast(toastEl);
    const toastTitle = document.getElementById("toast-title");
    const toastBody = document.getElementById("toast-body");

    toastEl.className = `toast bg-${type} text-white`;

    if (toastTitle) toastTitle.textContent = title;
    if (toastBody) toastBody.textContent = message;

    toast.show();
  }
});
