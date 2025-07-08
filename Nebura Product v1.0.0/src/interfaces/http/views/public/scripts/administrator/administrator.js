/**
 * Sistema de traducción y cambio de tema para el dashboard de administración.
 * Permite cambiar entre español e inglés, y alternar entre modo claro/oscuro.
 * Actualiza dinámicamente los textos y placeholders de la interfaz.
 * @module dashboard/administrator
 */
document.addEventListener("DOMContentLoaded", function () {
  /**
   * Diccionario de traducciones para los textos de la interfaz.
   * @type {Object.<string, Object.<string, string>>}
   */
  const translations = {
    es: {
      infoTab: "Información",
      configTab: "Configuración",
      users: "Usuarios",
      licenses: "Licencias",
      discordClients: "Clientes",
      metrics: "Métricas",
      logs: "Logs recientes",
      userRole: "Gestión de Roles de Usuario",
      selectUser: "Seleccionar usuario",
      selectRole: "Nuevo rol",
      updateRole: "Actualizar Rol",
      onlyOwner: "Solo los usuarios con rango owner pueden actualizar roles.",
      searchAll: "Buscar en todo el panel...",
      searchUsers: "Buscar por nombre, email o rol",
      searchLicenses: "Buscar por ID, tipo, usuario, admin o estado",
      searchLogs: "Buscar por archivo",
      export: "Exportar",
      exportCSV: "CSV",
      exportExcel: "Excel",
      compactToggle: "Modo compacto/expandido",
      columnsToggle: "Columnas",
      inactive: "Inactivo",
      expiringSoon: "Próx. a expirar",
      active: "Activo",
      expired: "Expirada",
      banned: "Baneada",
      revoked: "Revocada",
      yes: "Sí",
      no: "No",
      confirmAction: "Confirmar acción",
      confirmText: "¿Estás seguro de que deseas realizar esta acción?",
      cancel: "Cancelar",
      confirm: "Confirmar",
      close: "Cerrar",
      infoadd: "Información Adicional",
      typeClan: "Clan",
      Provider: "Provedor",
      Banner: "Banner"
      // ...agrega más claves si lo necesitas...
    },
    en: {
      infoTab: "Information",
      configTab: "Configuration",
      users: "Users",
      licenses: "Licenses",
      discordClients: "Clients",
      metrics: "Metrics",
      logs: "Recent Logs",
      userRole: "User Role Management",
      selectUser: "Select user",
      selectRole: "New role",
      updateRole: "Update Role",
      onlyOwner: "Only users with owner rank can update roles.",
      searchAll: "Search the entire panel...",
      searchUsers: "Search by name, email or role",
      searchLicenses: "Search by ID, type, user, admin or status",
      searchLogs: "Search by file",
      export: "Export",
      exportCSV: "CSV",
      exportExcel: "Excel",
      compactToggle: "Compact/expanded mode",
      columnsToggle: "Columns",
      inactive: "Inactive",
      expiringSoon: "Expiring soon",
      active: "Active",
      expired: "Expired",
      banned: "Banned",
      revoked: "Revoked",
      yes: "Yes",
      no: "No",
      confirmAction: "Confirm action",
      confirmText: "Are you sure you want to perform this action?",
      cancel: "Cancel",
      confirm: "Confirm",
      close: "Close",
      infoadd: "Additional Information",
      typeClan: "Clan",
      Provider: "Provider",
      Banner: "Banner"
      // ...add more keys as needed...
    },
  };
  /**
   * Idioma actual seleccionado por el usuario.
   * @type {string}
   */
  let currentLanguage =
    localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");

  // Cambiar idioma
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

  /**
   * Actualiza todos los textos traducibles de la interfaz según el idioma seleccionado.
   * Recorre los elementos relevantes y reemplaza su contenido.
   * @function
   */
  function updateTranslations() {
    // Tabs
    document.getElementById("info-tab").innerHTML =
      `<i class="fas fa-info-circle"></i> ${translations[currentLanguage].infoTab}`;
    document.getElementById("config-tab").innerHTML =
      `<i class="fas fa-cogs"></i> ${translations[currentLanguage].configTab}`;
    // Secciones
    document.querySelectorAll(".section-title").forEach((el) => {
      if (el.textContent.includes("Usuarios"))
        el.innerHTML = `<i class="fas fa-users"></i> ${translations[currentLanguage].users}`;
      if (el.textContent.includes("Licencias"))
        el.innerHTML = `<i class="fas fa-key"></i> ${translations[currentLanguage].licenses}`;
      if (el.textContent.includes("Clientes Discord"))
        el.innerHTML = `<i class="fab fa-discord"></i> ${translations[currentLanguage].discordClients}`;
      if (el.textContent.includes("Métricas"))
        el.innerHTML = `<i class="fas fa-chart-line"></i> ${translations[currentLanguage].metrics}`;
      if (el.textContent.includes("Logs"))
        el.innerHTML = `<i class="fas fa-file-alt"></i> ${translations[currentLanguage].logs}`;
      if (el.textContent.includes("Gestión de Roles") || el.textContent.includes("User Role"))
        el.innerHTML = `<i class="fas fa-user-cog"></i> ${translations[currentLanguage].userRole}`;
    });
    // Formulario de roles
    const labelUser = document.querySelector('label[for="select-user"]');
    if (labelUser) labelUser.textContent = translations[currentLanguage].selectUser;
    const labelRole = document.querySelector('label[for="select-role"]');
    if (labelRole) labelRole.textContent = translations[currentLanguage].selectRole;
    const btnRole = document.querySelector('#role-update-form button[type="submit"]');
    if (btnRole)
      btnRole.innerHTML = `<i class="fas fa-save me-1"></i> ${translations[currentLanguage].updateRole}`;
    // Mensaje de solo owner
    const onlyOwnerAlert = document.querySelector(".alert-danger");
    if (onlyOwnerAlert)
      onlyOwnerAlert.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${translations[currentLanguage].onlyOwner}`;

    // Placeholders buscadores
    const globalSearch = document.getElementById("global-search");
    if (globalSearch) globalSearch.placeholder = translations[currentLanguage].searchAll;
    const usersSearch = document.getElementById("search-users");
    if (usersSearch) usersSearch.placeholder = translations[currentLanguage].searchUsers;
    const licensesSearch = document.getElementById("search-licenses");
    if (licensesSearch) licensesSearch.placeholder = translations[currentLanguage].searchLicenses;
    const logsSearch = document.getElementById("search-logs");
    if (logsSearch) logsSearch.placeholder = translations[currentLanguage].searchLogs;

    // Botones exportar
    document.querySelectorAll(".dropdown-toggle").forEach((btn) => {
      if (btn.textContent.includes("Exportar") || btn.textContent.includes("Export")) {
        btn.innerHTML = `<i class="fas fa-file-export"></i> ${translations[currentLanguage].export}`;
      }
    });
    document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
      if (item.id && item.id.endsWith("-csv"))
        item.textContent = translations[currentLanguage].exportCSV;
      if (item.id && item.id.endsWith("-xlsx"))
        item.textContent = translations[currentLanguage].exportExcel;
    });

    // Botones compact/columnas
    document.querySelectorAll("button[id$='-compact-toggle']").forEach((btn) => {
      btn.title = translations[currentLanguage].compactToggle;
    });
    document.querySelectorAll("button[id$='-columns-toggle']").forEach((btn) => {
      btn.title = translations[currentLanguage].columnsToggle;
    });

    // Estados y badges
    document.querySelectorAll(".badge-status").forEach((el) => {
      if (el.textContent.includes("Inactivo"))
        el.textContent = translations[currentLanguage].inactive;
      if (el.textContent.includes("Próx. a expirar"))
        el.textContent = translations[currentLanguage].expiringSoon;
      if (el.textContent.includes("Activo")) el.textContent = translations[currentLanguage].active;
      if (el.textContent.includes("Expirada"))
        el.textContent = translations[currentLanguage].expired;
      if (el.textContent.includes("Baneada")) el.textContent = translations[currentLanguage].banned;
      if (el.textContent.includes("Revocada"))
        el.textContent = translations[currentLanguage].revoked;
    });
    document.querySelectorAll(".badge.bg-success, .badge.bg-secondary").forEach((el) => {
      if (el.textContent.trim() === "Sí") el.textContent = translations[currentLanguage].yes;
      if (el.textContent.trim() === "No") el.textContent = translations[currentLanguage].no;
    });

    // Modal confirmación
    const confirmModalLabel = document.getElementById("confirmModalLabel");
    if (confirmModalLabel)
      confirmModalLabel.innerHTML = `<i class="fas fa-exclamation-triangle text-warning"></i> ${translations[currentLanguage].confirmAction}`;
    const confirmModalBody = document.getElementById("confirmModalBody");
    if (confirmModalBody) confirmModalBody.textContent = translations[currentLanguage].confirmText;
    const confirmModalCancel = document.querySelector("#confirmModal .btn-secondary");
    if (confirmModalCancel) confirmModalCancel.textContent = translations[currentLanguage].cancel;
    const confirmModalOk = document.getElementById("confirmModalOk");
    if (confirmModalOk) confirmModalOk.textContent = translations[currentLanguage].confirm;
    const columnsModalClose = document.querySelector("#columnsModal .btn-secondary");
    if (columnsModalClose) columnsModalClose.textContent = translations[currentLanguage].close;
    const columnsModalApply = document.getElementById("columnsModalApply");
    if (columnsModalApply) columnsModalApply.textContent = translations[currentLanguage].confirm;
  }
  updateTranslations();

  // Tema
  const themeSwitch = document.getElementById("themeSwitch");
  const themeIcon = document.querySelector('label[for="themeSwitch"] i');
  let savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
  if (themeSwitch) themeSwitch.checked = savedTheme === "dark";
  if (themeIcon) themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  if (themeSwitch) {
    themeSwitch.addEventListener("change", () => {
      const theme = themeSwitch.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", theme);
      localStorage.setItem("theme", theme);
      if (themeIcon) themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    });
  }
});

/**
 * Instancia global del toast de notificaciones.
 * @type {bootstrap.Toast}
 */
const toastElement = document.getElementById("notificationToast");
const notificationToast = new bootstrap.Toast(toastElement);

/**
 * Muestra un toast de notificación en pantalla.
 * @param {string} title - Título del toast.
 * @param {string} body - Mensaje del toast.
 * @param {"success"|"danger"|"warning"} [type="success"] - Tipo de toast.
 */
const showToast = (title, body, type = "success") => {
  const toastTitle = document.getElementById("toast-title");
  const toastBody = document.getElementById("toast-body");
  toastTitle.textContent = title;
  toastBody.textContent = body;
  toastElement.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white");
  if (type === "success") {
    toastElement.classList.add("bg-success", "text-white");
  } else if (type === "danger" || type === "error") {
    toastElement.classList.add("bg-danger", "text-white");
  } else if (type === "warning") {
    toastElement.classList.add("bg-warning", "text-white");
  }
  notificationToast.show();
};

/**
 * Inicializa buscador, paginación y orden en tablas.
 * Permite búsqueda por campos, paginación y ordenamiento por columnas.
 * @param {string} tableId - ID de la tabla.
 * @param {Array<Object>} data - Datos a mostrar.
 * @param {function(Object): string} renderRow - Función para renderizar una fila.
 * @param {Array<string>} searchFields - Campos a buscar.
 */
function setupTableFeatures(tableId, data, renderRow, searchFields) {
  const tableBody = document.getElementById(tableId + "-body");
  const searchInput = document.getElementById("search-" + tableId);
  const pagination = document.getElementById(tableId.replace("-table", "") + "-pagination");
  const headers = document.querySelectorAll("#" + tableId + " th.sortable");
  const searchGroup = document.getElementById(tableId.replace("-table", "") + "-search-group");
  const clearBtn = document.getElementById("clear-search-" + tableId);
  const spinnerEl = document.getElementById("spinner-search-" + tableId);
  const advFilter = document.getElementById(tableId.replace("-table", "") + "-advanced-filter");
  let currentPage = 1;
  let rowsPerPage = 10;
  let sortField = null;
  let sortDir = 1;
  let filtered = [...data];
  let currentFields = [...searchFields];

  // Placeholder dinámico
  const placeholders = {
    "users-table": [
      { field: "", text: "Buscar por nombre, email o rol" },
      { field: "name", text: "Buscar por nombre" },
      { field: "email", text: "Buscar por email" },
      { field: "role", text: "Buscar por rol" },
    ],
    "licenses-table": [
      { field: "", text: "Buscar por ID, tipo, usuario, admin o estado" },
      { field: "id", text: "Buscar por ID" },
      { field: "type", text: "Buscar por tipo" },
      { field: "user", text: "Buscar por usuario" },
      { field: "admin", text: "Buscar por admin" },
      { field: "status", text: "Buscar por estado" },
    ],
    "logs-table": [
      { field: "", text: "Buscar por archivo" },
      { field: "filename", text: "Buscar por archivo" },
      { field: "isCompressed", text: "Buscar por comprimido" },
    ],
  };

  function updatePlaceholder() {
    if (!searchInput || !advFilter) return;
    const opts = placeholders[tableId] || [];
    const found = opts.find((o) => o.field === advFilter.value);
    searchInput.placeholder = found ? found.text : "Buscar...";
  }

  // Animación de entrada
  if (searchGroup) {
    searchGroup.classList.remove("search-group-animate-out");
    searchGroup.classList.add("search-group-animate-in");
  }

  function renderTable() {
    let rows = filtered
      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
      .map(renderRow)
      .join("");
    if (filtered.length === 0) {
      rows = `<tr class="no-results-row"><td colspan="100%">&#128533; No se encontraron resultados</td></tr>`;
    }
    tableBody.innerHTML = rows;
    renderPagination();
  }

  function renderPagination() {
    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    let html = "";
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item${i === currentPage ? " active" : ""}">
              <a class="page-link" href="#">${i}</a></li>`;
    }
    pagination.innerHTML = html;
    pagination.querySelectorAll("a").forEach((a, idx) => {
      a.onclick = (e) => {
        e.preventDefault();
        currentPage = idx + 1;
        renderTable();
      };
    });
  }

  // Feedback visual y animación buscador
  let errorTimeout = null;
  if (searchInput) {
    searchInput.classList.add("search-animated");
    searchInput.addEventListener("focus", () => searchInput.classList.add("search-animated"));
    searchInput.addEventListener("blur", () => searchInput.classList.remove("search-animated"));

    searchInput.addEventListener("input", function () {
      if (spinnerEl) spinnerEl.style.display = "inline-block";
      setTimeout(() => {
        try {
          const val = this.value.toLowerCase();
          if (val.length === 0) {
            filtered = [...data];
          } else {
            filtered = data.filter((row) =>
              currentFields.some((f) => (row[f] || "").toString().toLowerCase().includes(val)),
            );
          }
          currentPage = 1;
          renderTable();
          if (filtered.length === 0 && val.length > 0) {
            searchInput.classList.add("search-error");
            showToast("Sin resultados", "No se encontraron coincidencias.", "warning");
            if (errorTimeout) clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => searchInput.classList.remove("search-error"), 1200);
          } else {
            searchInput.classList.remove("search-error");
          }
        } catch (err) {
          searchInput.classList.add("search-error");
          showToast("Error", "Ocurrió un error al buscar.", "danger");
          if (errorTimeout) clearTimeout(errorTimeout);
          errorTimeout = setTimeout(() => searchInput.classList.remove("search-error"), 1500);
        }
        if (spinnerEl) spinnerEl.style.display = "none";
      }, 180);
    });
  }

  // Botón limpiar búsqueda
  if (clearBtn && searchInput) {
    clearBtn.onclick = function () {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
      searchInput.focus();
    };
  }

  // Filtro avanzado por columna
  if (advFilter && searchInput) {
    advFilter.addEventListener("change", function () {
      if (this.value) {
        currentFields = [this.value];
      } else {
        currentFields = [...searchFields];
      }
      updatePlaceholder();
      searchInput.dispatchEvent(new Event("input"));
    });
    updatePlaceholder();
  }

  // Animación de salida buscador (opcional, si se oculta)
  // if (searchGroup) {
  //   searchGroup.classList.remove('search-group-animate-in');
  //   searchGroup.classList.add('search-group-animate-out');
  // }

  headers.forEach((th) => {
    th.addEventListener("click", function () {
      const field = th.dataset.sort;
      if (sortField === field) sortDir *= -1;
      else {
        sortField = field;
        sortDir = 1;
      }
      filtered.sort((a, b) => {
        let va = a[field],
          vb = b[field];
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va > vb) return sortDir;
        if (va < vb) return -sortDir;
        return 0;
      });
      renderTable();
      headers.forEach((h) => (h.querySelector("i").className = "fas fa-sort"));
      th.querySelector("i").className = sortDir === 1 ? "fas fa-sort-up" : "fas fa-sort-down";
    });
  });

  renderTable();
}

/**
 * Datos de usuarios para la tabla, generados a partir de la variable global `users`.
 * @type {Array<Object>}
 */
const usersData = users.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
  licenses: licenses.filter((l) => l.userId === u.id).length,
}));

/**
 * Datos de licencias para la tabla, generados a partir de la variable global `licenses`.
 * @type {Array<Object>}
 */
const licensesData = licenses.map((l) => ({
  id: l.id,
  type: l.type,
  user: (users.find((u) => u.id === l.userId) || {}).name || l.userId,
  admin: (users.find((u) => u.id === l.adminId) || {}).name || l.adminId,
  hwid: Array.isArray(l.hwid) ? l.hwid.join(", ") : "",
  status:
    l.status === "BANNED"
      ? "BANNED"
      : l.status === "REVOKED"
        ? "REVOKED"
        : l.validUntil && new Date(l.validUntil) < new Date()
          ? "EXPIRED"
          : "ACTIVE",
  validUntil: l.validUntil,
  requestCount: l.requestCount,
  requestLimit: l.requestLimit,
  lastUsedIp: l.lastUsedIp,
}));

/**
 * Datos de logs para la tabla, generados a partir de la variable global `logs`.
 * @type {Array<Object>}
 */
const logsData = logs.map((log) => ({
  filename: log.filename,
  lastModified: log.lastModified,
  size: log.size,
  isCompressed: log.isCompressed,
}));

// --- RENDERIZADORES DE FILAS ---
/**
 * Renderiza una fila de usuario para la tabla de usuarios.
 * @param {Object} u - Objeto usuario.
 * @returns {string} HTML de la fila.
 */
function renderUserRow(u) {
  return `<tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="badge badge-role ${u.role} text-uppercase">${u.role}</span></td>
          <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
          <td>${u.licenses}</td>
          <td>${u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "-"}</td>
        </tr>`;
}

/**
 * Obtiene el valor de un parámetro de la URL.
 * @param {string} param - Nombre del parámetro.
 * @returns {string|null} Valor del parámetro o null si no existe.
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const userIdFromUrl = getQueryParam("id");

/**
 * Renderiza una fila de licencia para la tabla de licencias.
 * @param {Object} l - Objeto licencia.
 * @returns {string} HTML de la fila.
 */
function renderLicenseRow(l) {
  let icon =
    l.status === "ACTIVE" ? "fa-check-circle" : l.status === "EXPIRED" ? "fa-clock" : "fa-ban";
  return `<tr>
          <td>${l.id}</td>
          <td><span class="badge bg-primary">${l.type}</span></td>
          <td>
          ${usersMap[l.user] || l.user}
          </td>
          <td>${usersMap[l.admin] || l.admin}</td>
          <td>${l.hwid}</td>
          <td><span class="badge badge-status ${l.status}">
            <i class="fas ${icon}"></i> ${l.status}
          </span></td>
          <td>${l.validUntil ? new Date(l.validUntil).toLocaleDateString() : "-"}</td>
          <td>${l.requestCount} / ${l.requestLimit}</td>
          <td>${l.lastUsedIp || "-"}</td>
        </tr>`;
}

/**
 * Renderiza una fila de log para la tabla de logs.
 * @param {Object} log - Objeto log.
 * @returns {string} HTML de la fila.
 */
function renderLogRow(log) {
  return `<tr>
          <td>${log.filename}</td>
          <td>${log.lastModified ? formatDate(log.lastModified) : "-"}</td>
          <td>${log.size}</td>
          <td><span class="badge ${log.isCompressed ? "bg-info" : "bg-secondary"}">${log.isCompressed ? "Sí" : "No"}</span></td>
          <td>
            <a href="/dashboard/logs/view/${log.filename}?id=${userIdFromUrl}" class="btn btn-sm btn-outline-primary" target="_blank"><i class="fas fa-eye"></i> Ver</a>
            <a href="/dashboard/utils/logs/download/${log.filename}?download=1" class="btn btn-sm btn-outline-success" target="_blank"><i class="fas fa-download"></i> Descargar</a>
          </td>
        </tr>`;
}

// --- INICIALIZAR TABLAS ---
document.addEventListener("DOMContentLoaded", function () {
  setupTableFeatures("users-table", usersData, renderUserRow, ["name", "email", "role"]);
  setupTableFeatures("licenses-table", licensesData, renderLicenseRow, [
    "id",
    "type",
    "user",
    "admin",
    "status",
  ]);
  setupTableFeatures("logs-table", logsData, renderLogRow, ["filename", "isCompressed"]);
});

/**
 * Muestra un modal de confirmación para acciones críticas.
 * @param {string} msg - Mensaje a mostrar.
 * @param {function} onConfirm - Callback a ejecutar si se confirma.
 */
function showConfirmModal(msg, onConfirm) {
  document.getElementById("confirmModalBody").textContent = msg;
  const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
  modal.show();
  const okBtn = document.getElementById("confirmModalOk");

  function handler() {
    modal.hide();
    okBtn.removeEventListener("click", handler);
    onConfirm();
  }
  okBtn.addEventListener("click", handler);
}

// --- GESTIÓN DE ACTUALIZACIÓN DE ROLES CON MODAL ---
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("role-update-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const userId = document.getElementById("select-user").value;
    const role = document.getElementById("select-role").value;
    const resultDiv = document.getElementById("role-update-result");
    resultDiv.textContent = "";
    if (!userId || !role) {
      resultDiv.innerHTML = '<div class="alert alert-warning">Selecciona usuario y rol.</div>';
      return;
    }
    showConfirmModal("¿Estás seguro de actualizar el rol de este usuario?", async function () {
      try {
        const res = await fetch("/dashboard/utils/auth/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            role,
          }),
        });
        const data = await res.json();
        if (data.success) {
          resultDiv.innerHTML =
            '<div class="alert alert-success">Rol actualizado correctamente.</div>';
          showToast("Éxito", "Rol actualizado correctamente", "success");
        } else {
          resultDiv.innerHTML = `<div class="alert alert-danger">${data.message || "Error al actualizar el rol."}</div>`;
          showToast("Error", data.message || "Error al actualizar el rol", "danger");
        }
      } catch (err) {
        resultDiv.innerHTML =
          '<div class="alert alert-danger">Error de red al actualizar el rol.</div>';
        showToast("Error", "Error de red al actualizar el rol", "danger");
      }
    });
  });
});

// --- DARK/LIGHT MODE CON PREVISUALIZACIÓN INSTANTÁNEA ---
/**
 * Inicializa el cambio de tema (oscuro/claro) con previsualización instantánea.
 */
document.addEventListener("DOMContentLoaded", function () {
  const themeSwitch = document.getElementById("themeSwitch");
  const themeIcon = document.querySelector('label[for="themeSwitch"] i');
  let savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
  if (themeSwitch) themeSwitch.checked = savedTheme === "dark";
  if (themeIcon) themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  if (themeSwitch) {
    themeSwitch.addEventListener("input", () => {
      const theme = themeSwitch.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", theme);
      localStorage.setItem("theme", theme);
      if (themeIcon) themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    });
  }
});

// --- BUSCADOR GLOBAL ---
/**
 * Inicializa el buscador global que filtra todas las tablas visibles.
 */
document.addEventListener("DOMContentLoaded", function () {
  const globalInput = document.getElementById("global-search");
  const clearBtn = document.getElementById("clear-global-search");
  if (!globalInput) return;
  globalInput.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    // Filtra todas las tablas visibles
    ["users-table", "licenses-table", "logs-table"].forEach((tableId) => {
      const tableBody = document.getElementById(tableId + "-body");
      if (!tableBody) return;
      Array.from(tableBody.rows).forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = val.length === 0 || text.includes(val) ? "" : "none";
      });
    });
  });
  if (clearBtn) {
    clearBtn.onclick = function () {
      globalInput.value = "";
      globalInput.dispatchEvent(new Event("input"));
      globalInput.focus();
    };
  }
});

// --- EXPORTAR DATOS (CSV/Excel) ---
/**
 * Exporta una tabla HTML a formato CSV.
 * @param {string} tableId - ID de la tabla.
 * @param {string} filename - Nombre del archivo a descargar.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
function exportTableToCSV(tableId, filename) {
  const rows = Array.from(document.querySelectorAll(`#${tableId} tr`));
  const csv = rows
    .map((row) =>
      Array.from(row.querySelectorAll("th,td"))
        .map((cell) => `"${cell.innerText.replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Exporta una tabla HTML a formato Excel (XLSX).
 * Requiere la librería SheetJS (XLSX).
 * @param {string} tableId - ID de la tabla.
 * @param {string} filename - Nombre del archivo a descargar.
 * @see https://sheetjs.com/
 */
function exportTableToExcel(tableId, filename) {
  const table = document.getElementById(tableId);
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, filename);
}
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("export-users-csv").onclick = (e) => {
    e.preventDefault();
    exportTableToCSV("users-table", "usuarios.csv");
  };
  document.getElementById("export-users-xlsx").onclick = (e) => {
    e.preventDefault();
    exportTableToExcel("users-table", "usuarios.xlsx");
  };
  document.getElementById("export-licenses-csv").onclick = (e) => {
    e.preventDefault();
    exportTableToCSV("licenses-table", "licencias.csv");
  };
  document.getElementById("export-licenses-xlsx").onclick = (e) => {
    e.preventDefault();
    exportTableToExcel("licenses-table", "licencias.xlsx");
  };
  document.getElementById("export-logs-csv").onclick = (e) => {
    e.preventDefault();
    exportTableToCSV("logs-table", "logs.csv");
  };
  document.getElementById("export-logs-xlsx").onclick = (e) => {
    e.preventDefault();
    exportTableToExcel("logs-table", "logs.xlsx");
  };
});

// --- COLUMNAS CONFIGURABLES Y MODO COMPACTO ---
/**
 * Permite configurar la visibilidad de columnas en una tabla mediante un modal.
 * Guarda la configuración en localStorage.
 * @param {string} tableId - ID de la tabla.
 * @param {Array<string>} columns - Nombres de las columnas.
 */
function setupColumnConfig(tableId, columns) {
  let visibleCols = JSON.parse(localStorage.getItem(tableId + "-cols")) || columns.map((c) => true);
  function applyCols() {
    const table = document.getElementById(tableId);
    if (!table) return;
    Array.from(table.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell, idx) => {
        cell.style.display = visibleCols[idx] ? "" : "none";
      });
    });
  }
  document.getElementById(tableId.replace("-table", "") + "-columns-toggle").onclick = function () {
    const modal = new bootstrap.Modal(document.getElementById("columnsModal"));
    const body = document.getElementById("columnsModalBody");
    body.innerHTML = columns
      .map(function (col, idx) {
        return (
          '<div class="form-check">' +
          '<input class="form-check-input" type="checkbox" value="' +
          idx +
          '" id="colchk-' +
          tableId +
          "-" +
          idx +
          '" ' +
          (visibleCols[idx] ? "checked" : "") +
          ">" +
          '<label class="form-check-label" for="colchk-' +
          tableId +
          "-" +
          idx +
          '">' +
          col +
          "</label>" +
          "</div>"
        );
      })
      .join("");
    document.getElementById("columnsModalApply").onclick = function () {
      visibleCols = columns.map(function (_, idx) {
        return document.getElementById("colchk-" + tableId + "-" + idx).checked;
      });
      localStorage.setItem(tableId + "-cols", JSON.stringify(visibleCols));
      applyCols();
      modal.hide();
    };
    modal.show();
  };
  applyCols();
}
document.addEventListener("DOMContentLoaded", function () {
  setupColumnConfig("users-table", [
    "Nombre",
    "Email",
    "Rol",
    "Registrado",
    "Licencias",
    "Última actualización",
  ]);
  setupColumnConfig("licenses-table", [
    "ID",
    "Tipo",
    "Usuario",
    "Admin",
    "HWID",
    "Estado",
    "Válida hasta",
    "Solicitudes",
    "Última IP",
  ]);
  setupColumnConfig("logs-table", [
    "Archivo",
    "Última modificación",
    "Tamaño",
    "Comprimido",
    "Acciones",
  ]);
});

/**
 * Permite alternar el modo compacto/expandido de una tabla.
 * Guarda la preferencia en localStorage.
 * @param {string} tableId - ID de la tabla.
 */
function setupCompactToggle(tableId) {
  let compact = localStorage.getItem(tableId + "-compact") === "1";
  function applyCompact() {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.classList.toggle("table-compact", compact);
  }
  document.getElementById(tableId.replace("-table", "") + "-compact-toggle").onclick = function () {
    compact = !compact;
    localStorage.setItem(tableId + "-compact", compact ? "1" : "0");
    applyCompact();
  };
  applyCompact();
}
document.addEventListener("DOMContentLoaded", function () {
  setupCompactToggle("users-table");
  setupCompactToggle("licenses-table");
  setupCompactToggle("logs-table");
});

// --- FILTROS AVANZADOS (fecha, estado) ---
/**
 * Inicializa filtros avanzados por fecha y estado para una tabla.
 * @param {string} tableId - ID de la tabla.
 * @param {Array<Object>} data - Datos originales.
 * @param {function(Object): string} renderRow - Función para renderizar una fila.
 * @param {Array<string>} searchFields - Campos de búsqueda.
 * @param {string} dateField - Campo de fecha.
 * @param {string|null} statusField - Campo de estado (opcional).
 */
function setupAdvancedFilters(tableId, data, renderRow, searchFields, dateField, statusField) {
  const dateFrom = document.getElementById(tableId.replace("-table", "") + "-filter-date-from");
  const dateTo = document.getElementById(tableId.replace("-table", "") + "-filter-date-to");
  const statusSel = document.getElementById(tableId.replace("-table", "") + "-filter-status");
  let filtered = [...data];
  function filterData() {
    let from = dateFrom && dateFrom.value ? new Date(dateFrom.value) : null;
    let to = dateTo && dateTo.value ? new Date(dateTo.value) : null;
    let status = statusSel && statusSel.value ? statusSel.value : null;
    filtered = data.filter((row) => {
      let ok = true;
      if (from && row[dateField]) ok = ok && new Date(row[dateField]) >= from;
      if (to && row[dateField]) ok = ok && new Date(row[dateField]) <= to;
      if (status && row[statusField]) ok = ok && row[statusField] === status;
      return ok;
    });
    // Actualiza tabla
    setupTableFeatures(tableId, filtered, renderRow, searchFields);
  }
  if (dateFrom) dateFrom.addEventListener("change", filterData);
  if (dateTo) dateTo.addEventListener("change", filterData);
  if (statusSel) statusSel.addEventListener("change", filterData);
}
document.addEventListener("DOMContentLoaded", function () {
  setupAdvancedFilters(
    "users-table",
    usersData,
    renderUserRow,
    ["name", "email", "role"],
    "createdAt",
    "status",
  );
  setupAdvancedFilters(
    "licenses-table",
    licensesData,
    renderLicenseRow,
    ["id", "type", "user", "admin", "status"],
    "validUntil",
    "status",
  );
  setupAdvancedFilters(
    "logs-table",
    logsData,
    renderLogRow,
    ["filename", "isCompressed"],
    "lastModified",
    null,
  );
});

// --- BADGES VISUALES PARA ESTADOS CRÍTICOS ---
/**
 * Determina si un usuario está inactivo (no ha actualizado en 90 días).
 * @param {Object} u - Objeto usuario.
 * @returns {boolean}
 */
function isUserInactive(u) {
  // Ejemplo: si no ha actualizado en 90 días
  if (!u.updatedAt) return false;
  return Date.now() - new Date(u.updatedAt).getTime() > 90 * 24 * 60 * 60 * 1000;
}

/**
 * Determina si una licencia está próxima a expirar (menos de 7 días).
 * @param {Object} l - Objeto licencia.
 * @returns {boolean}
 */
function isLicenseExpiringSoon(l) {
  if (!l.validUntil) return false;
  const days = (new Date(l.validUntil) - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days < 7;
}

// Modifica renderUserRow y renderLicenseRow para incluir badges visuales:
/**
 * Renderiza una fila de usuario para la tabla de usuarios.
 * Incluye badge si el usuario está inactivo.
 * @param {Object} u - Objeto usuario.
 * @returns {string} HTML de la fila.
 */
function renderUserRow(u) {
  let badge = isUserInactive(u) ? '<span class="badge bg-warning ms-1">Inactivo</span>' : "";
  return `<tr>
          <td>${u.name} ${badge}</td>
          <td>${u.email}</td>
          <td><span class="badge badge-role ${u.role} text-uppercase">${u.role}</span></td>
          <td>${formatDate(u.createdAt)}</td>
          <td>${u.licenses}</td>
          <td>${formatDate(u.updatedAt)}</td>
        </tr>`;
}

/**
 * Renderiza una fila de licencia para la tabla de licencias.
 * Incluye badge si la licencia está próxima a expirar.
 * @param {Object} l - Objeto licencia.
 * @returns {string} HTML de la fila.
 */
function renderLicenseRow(l) {
  let icon =
    l.status === "ACTIVE" ? "fa-check-circle" : l.status === "EXPIRED" ? "fa-clock" : "fa-ban";
  let badge = isLicenseExpiringSoon(l)
    ? '<span class="badge bg-warning ms-1">Próx. a expirar</span>'
    : "";
  return `<tr>
          <td>${l.id}</td>
          <td><span class="badge bg-primary">${l.type}</span></td>
          <td>${usersMap[l.user] || l.user}</td>
          <td>${usersMap[l.admin] || l.admin}</td>
          <td>${l.hwid}</td>
          <td><span class="badge badge-status ${l.status}">
            <i class="fas ${icon}"></i> ${l.status}
          </span> ${badge}</td>
          <td>${formatDate(l.validUntil)}</td>
          <td>${l.requestCount} / ${l.requestLimit}</td>
          <td>${l.lastUsedIp || "-"}</td>
        </tr>`;
}

// --- SOPORTE MULTI-IDIOMA COMPLETO (fechas, números) ---
/**
 * Formatea una fecha según el idioma seleccionado.
 * @param {string|Date} date - Fecha a formatear.
 * @returns {string} Fecha formateada o "-" si no es válida.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
 */
function formatDate(date) {
  if (!date) return "-";
  try {
    const lang =
      localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");
    return new Date(date).toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}
