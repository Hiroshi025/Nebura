document.addEventListener("DOMContentLoaded", function () {
  // ...dentro de document.addEventListener('DOMContentLoaded', function () { ...
  const toastElement = document.getElementById("notificationToast");
  const notificationToast = new bootstrap.Toast(toastElement);
  // ...resto del código...

  // Filtrar solo los servidores relevantes (con permisos de administración)
  const ADMIN_PERMISSION = 0x8; // Permiso de administrador
  let compactMode = localStorage.getItem("compactMode") === "true";
  let dragSrcIndex = null;
  let filteredServers = USER_DATA.guilds.filter(
    (guild) => (guild.permissions & ADMIN_PERMISSION) === ADMIN_PERMISSION || guild.owner,
  );
  let filterType = "all";
  let filterFeature = "all";
  let searchTerm = "";
  let serversPerPage = 6; // <--- Agrega esta línea
  let currentPage = 1; // <--- Y esta para evitar otros errores

  // --- DICCIONARIO DE TRADUCCIONES ---
  const translations = {
    en: {
      profileTab: "Profile",
      serversTab: "Servers",
      personalInfo: "Personal Information",
      usernameLabel: "Username",
      globalNameLabel: "Global Name",
      userIdLabel: "User ID",
      accountInfo: "Account Information",
      accountTypeLabel: "Account Type",
      localeLabel: "Language",
      mfaLabel: "Two-Factor Authentication",
      serversTitle: "My Servers",
      searchPlaceholder: "Search servers...",
      noServersTitle: "No servers",
      noServersSubtitle: "You're not in any servers or don't have admin permissions",
      previous: "Previous",
      next: "Next",
      ownerBadge: "OWNER",
      membersLabel: "Members",
      featuresLabel: "Features",
      manageBtn: "Manage",
      viewBtn: "View",
      serverFeatures: {
        COMMUNITY: "Community Server",
        VERIFIED: "Verified",
        PARTNERED: "Partnered",
        VANITY_URL: "Custom URL",
        NEWS: "Announcement Channels",
        DISCOVERABLE: "Discoverable",
      },
      filterAll: "All",
      filterOwner: "Owned",
      filterMember: "Miembro",
      filterFeatureAll: "All",
      filterCommunity: "Community",
      filterVerified: "Verified",
      filterPartnered: "Partnered",
      dragInfo: "Drag to reorder servers",
      toastSuccess: "Success",
      toastError: "Error",
      ownedServers: "Owned Servers",
      memberServers: "Member Servers",
      memberSince: "Member since",
      apiTab: "API",
      licenseSectionTitle: "User Licenses",
      refreshLicenses: "Reload licenses",
      licenseSearchPlaceholder: "Search license...",
      licenseTypeAll: "All types",
      licenseStatusAll: "All statuses",
      licenseStatusActive: "Active",
      licenseStatusExpired: "Expired",
      exportCSV: "Export CSV",
      activeLicenses: "Active",
      expiredLicenses: "Expired",
      licenseKey: "Key",
      licenseType: "Type",
      licenseState: "State",
      licenseValidUntil: "Valid until",
      licenseActions: "Actions",
      noLicenses: "You have no registered licenses.",
      licenseDetails: "License Details",
      close: "Close",
      licensesTab: "Licenses",
      infoadd: "Additional Information",
      typeClan: "Clan",
      Provider: "Provider",
      Banner: "Banner",
    },
    es: {
      profileTab: "Perfil",
      serversTab: "Servidores",
      personalInfo: "Información Personal",
      usernameLabel: "Nombre de usuario",
      globalNameLabel: "Nombre global",
      userIdLabel: "ID de usuario",
      accountInfo: "Información de la cuenta",
      accountTypeLabel: "Tipo de cuenta",
      localeLabel: "Idioma",
      mfaLabel: "Autenticación de dos factores",
      serversTitle: "Mis Servidores",
      searchPlaceholder: "Buscar servidores...",
      noServersTitle: "No hay servidores",
      noServersSubtitle: "No estás en ningún servidor o no tienes permisos de administración",
      previous: "Anterior",
      next: "Siguiente",
      ownerBadge: "PROPIETARIO",
      membersLabel: "Miembros",
      featuresLabel: "Características",
      manageBtn: "Administrar",
      viewBtn: "Ver",
      serverFeatures: {
        COMMUNITY: "Servidor comunitario",
        VERIFIED: "Verificado",
        PARTNERED: "Asociado",
        VANITY_URL: "URL personalizada",
        NEWS: "Canales de anuncios",
        DISCOVERABLE: "Descubrible",
      },
      filterAll: "Todos",
      filterOwner: "Propios",
      filterMember: "Miembro",
      filterFeatureAll: "Todas",
      filterCommunity: "Comunitario",
      filterVerified: "Verificado",
      filterPartnered: "Asociado",
      dragInfo: "Arrastra para reordenar servidores",
      toastSuccess: "Éxito",
      toastError: "Error",
      ownedServers: "Servidores Propios",
      memberServers: "Servidores Miembro",
      memberSince: "Miembro desde",
      apiTab: "API",
      licenseSectionTitle: "Licencias de Usuario",
      refreshLicenses: "Recargar licencias",
      licenseSearchPlaceholder: "Buscar licencia...",
      licenseTypeAll: "Todos los tipos",
      licenseStatusAll: "Todos los estados",
      licenseStatusActive: "Activa",
      licenseStatusExpired: "Expirada",
      exportCSV: "Exportar CSV",
      activeLicenses: "Activas",
      expiredLicenses: "Expiradas",
      licenseKey: "Clave",
      licenseType: "Tipo",
      licenseState: "Estado",
      licenseValidUntil: "Válida hasta",
      licenseActions: "Acciones",
      noLicenses: "No tienes licencias registradas.",
      licenseDetails: "Detalles de la Licencia",
      close: "Cerrar",
      licensesTab: "Licencias",
      infoadd: "Información Adicional",
      typeClan: "Clan",
      Provider: "Proveedor",
      Banner: "Banner",
    },
  };

  // --- FUNCIONES DE AYUDA ---
  const showToast = (title, body, type = "success") => {
    const toastTitle = document.getElementById("toast-title");
    const toastBody = document.getElementById("toast-body");
    toastTitle.innerHTML = `${
      type === "success"
        ? '<i class="fas fa-check-circle me-2"></i>'
        : type === "error"
          ? '<i class="fas fa-times-circle me-2"></i>'
          : '<i class="fas fa-info-circle me-2"></i>'
    }${title}`;
    toastBody.textContent = body;
    toastElement.classList.remove("bg-success", "bg-danger", "bg-info", "text-white");
    if (type === "success") {
      toastElement.classList.add("bg-success", "text-white");
    } else if (type === "error") {
      toastElement.classList.add("bg-danger", "text-white");
    } else {
      toastElement.classList.add("bg-info", "text-white");
    }
    notificationToast.show();
  };

  const getServerIconUrl = (guildId, iconHash) => {
    if (!iconHash) return "https://cdn.discordapp.com/embed/avatars/0.png";
    return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png?size=256`;
  };

  const getServerBannerUrl = (guildId, bannerHash) => {
    if (!bannerHash) return "";
    return `https://cdn.discordapp.com/banners/${guildId}/${bannerHash}.png?size=512`;
  };

  const formatServerFeatures = (features) => {
    if (!features || features.length === 0) return "";
    return features
      .map((feature) => {
        const label = translations[currentLanguage].serverFeatures[feature] || feature;
        return `<span class="badge bg-info me-1">${label}</span>`;
      })
      .join(" ");
  };

  const updateTranslations = () => {
    document.querySelectorAll("[data-key]").forEach((element) => {
      const key = element.dataset.key;
      // Traducción para placeholders y texto
      if (translations[currentLanguage][key]) {
        if (element.tagName === "INPUT" && element.placeholder) {
          element.placeholder = translations[currentLanguage][key];
        } else {
          element.textContent = translations[currentLanguage][key];
        }
      }
    });

    // Traducción de pestañas y secciones que no usan data-key
    // Licenses tab
    const licensesTab = document.querySelector("#licenses-tab");
    if (licensesTab) {
      const span = licensesTab.querySelector("span");
      if (span) span.textContent = translations[currentLanguage].licensesTab;
    }
    // Licenses section title
    const licenseSectionTitle = document.querySelector("#userLicensesSection .section-title");
    if (licenseSectionTitle) {
      licenseSectionTitle.innerHTML = `<i class="fa-solid fa-key me-2"></i>${translations[currentLanguage].licenseSectionTitle}`;
    }
    // Refresh button
    const refreshBtn = document.getElementById("refreshUserLicensesBtn");
    if (refreshBtn) {
      refreshBtn.title = translations[currentLanguage].refreshLicenses;
    }
    // License search
    const licenseSearch = document.getElementById("licenseSearch");
    if (licenseSearch) {
      licenseSearch.placeholder = translations[currentLanguage].licenseSearchPlaceholder;
    }
    // License type filter
    const licenseTypeFilter = document.getElementById("licenseTypeFilter");
    if (licenseTypeFilter) {
      licenseTypeFilter.options[0].text = translations[currentLanguage].licenseTypeAll;
    }
    // License status filter
    const licenseStatusFilter = document.getElementById("licenseStatusFilter");
    if (licenseStatusFilter) {
      licenseStatusFilter.options[0].text = translations[currentLanguage].licenseStatusAll;
      if (licenseStatusFilter.options.length > 1)
        licenseStatusFilter.options[1].text = translations[currentLanguage].licenseStatusActive;
      if (licenseStatusFilter.options.length > 2)
        licenseStatusFilter.options[2].text = translations[currentLanguage].licenseStatusExpired;
    }
    // Export CSV
    const exportBtn = document.getElementById("exportLicensesBtn");
    if (exportBtn) {
      exportBtn.innerHTML = `<i class="fa fa-file-csv"></i> ${translations[currentLanguage].exportCSV}`;
    }
    // Licenses count badges
    const activeLicCount = document.getElementById("activeLicCount");
    if (activeLicCount) {
      activeLicCount.innerHTML = `0 ${translations[currentLanguage].activeLicenses}`;
    }
    const expiredLicCount = document.getElementById("expiredLicCount");
    if (expiredLicCount) {
      expiredLicCount.innerHTML = `0 ${translations[currentLanguage].expiredLicenses}`;
    }
    // License table headers
    const userLicensesTable = document.getElementById("userLicensesTable");
    if (userLicensesTable) {
      const ths = userLicensesTable.querySelectorAll("thead th");
      if (ths.length >= 5) {
        ths[0].innerHTML = `${translations[currentLanguage].licenseKey} <i class="fa fa-sort"></i>`;
        ths[1].innerHTML = `${translations[currentLanguage].licenseType} <i class="fa fa-sort"></i>`;
        ths[2].innerHTML = `${translations[currentLanguage].licenseState} <i class="fa fa-sort"></i>`;
        ths[3].innerHTML = `${translations[currentLanguage].licenseValidUntil} <i class="fa fa-sort"></i>`;
        ths[4].textContent = translations[currentLanguage].licenseActions;
      }
    }
    // Empty licenses message
    const userLicensesEmpty = document.getElementById("userLicensesEmpty");
    if (userLicensesEmpty) {
      userLicensesEmpty.textContent = translations[currentLanguage].noLicenses;
    }
    // License modal
    const licenseDetailModalLabel = document.getElementById("licenseDetailModalLabel");
    if (licenseDetailModalLabel) {
      licenseDetailModalLabel.textContent = translations[currentLanguage].licenseDetails;
    }
    // Modal close button
    const licenseDetailModal = document.getElementById("licenseDetailModal");
    if (licenseDetailModal) {
      const closeBtn = licenseDetailModal.querySelector(".btn-close");
      if (closeBtn) closeBtn.setAttribute("aria-label", translations[currentLanguage].close);
    }
  };

  // --- FILTRO Y BÚSQUEDA ---
  function applyFilters() {
    let servers = USER_DATA.guilds.filter(
      (guild) => (guild.permissions & ADMIN_PERMISSION) === ADMIN_PERMISSION || guild.owner,
    );
    if (filterType === "owner") {
      servers = servers.filter((g) => g.owner);
    } else if (filterType === "member") {
      servers = servers.filter((g) => !g.owner);
    }
    if (filterFeature !== "all") {
      servers = servers.filter((g) => g.features && g.features.includes(filterFeature));
    }
    if (searchTerm) {
      servers = servers.filter((server) => server.name.toLowerCase().includes(searchTerm));
    }
    filteredServers = servers;
    renderServers(filteredServers, 1);
  }

  // --- RENDERIZADO DE SERVIDORES ---
  const renderServers = (servers, page = 1) => {
    const serverGrid = document.getElementById("server-grid");
    serverGrid.innerHTML = "";
    currentPage = page;

    if (!servers || servers.length === 0) {
      document.getElementById("no-servers-message").classList.remove("d-none");
      document.getElementById("loading-spinner").classList.add("d-none");
      return;
    }

    document.getElementById("no-servers-message").classList.add("d-none");

    // Paginación
    const startIndex = (page - 1) * serversPerPage;
    const paginatedServers = servers.slice(startIndex, startIndex + serversPerPage);

    paginatedServers.forEach((server, index) => {
      const serverCard = document.createElement("div");
      serverCard.className = "col-lg-2 col-md-4 col-sm-6 col-12 fade-in";
      serverCard.style.animationDelay = `${index * 0.05}s`;

      // Drag & Drop
      serverCard.setAttribute("draggable", "true");
      serverCard.dataset.index = startIndex + index;
      serverCard.addEventListener("dragstart", (e) => {
        dragSrcIndex = Number(serverCard.dataset.index);
        serverCard.classList.add("dragging");
      });
      serverCard.addEventListener("dragend", (e) => {
        serverCard.classList.remove("dragging");
      });
      serverCard.addEventListener("dragover", (e) => {
        e.preventDefault();
        serverCard.classList.add("drag-over");
      });
      serverCard.addEventListener("dragleave", (e) => {
        serverCard.classList.remove("drag-over");
      });
      serverCard.addEventListener("drop", (e) => {
        e.preventDefault();
        serverCard.classList.remove("drag-over");
        const dropIndex = Number(serverCard.dataset.index);
        if (dragSrcIndex !== null && dropIndex !== dragSrcIndex) {
          // Reordenar
          const moved = filteredServers.splice(dragSrcIndex, 1)[0];
          filteredServers.splice(dropIndex, 0, moved);
          localStorage.setItem("serverOrder", JSON.stringify(filteredServers.map((s) => s.id)));
          showToast(translations[currentLanguage].toastSuccess, translations[currentLanguage].dragInfo, "success");
          renderServers(filteredServers, currentPage);
        }
        dragSrcIndex = null;
      });

      const bannerUrl = getServerBannerUrl(server.id, server.banner);
      const iconUrl = getServerIconUrl(server.id, server.icon);

      serverCard.innerHTML = `
          <div class="card server-card ${compactMode ? "compact" : "expanded"} h-100" tabindex="0">
            ${
              bannerUrl
                ? `<img src="${bannerUrl}" class="server-banner" alt="${server.name} banner">`
                : `<div class="server-banner bg-secondary"></div>`
            }
            <img src="${iconUrl}" class="server-icon" alt="${server.name} icon">
            ${server.owner ? `<span class="owner-badge">${translations[currentLanguage].ownerBadge}</span>` : ""}
            <div class="card-body">
              <h5 class="card-title">${server.name}</h5>
              <p class="card-text">
                <small class="text-muted">${translations[currentLanguage].membersLabel}: ${Math.floor(Math.random() * 5000) + 100}</small>
              </p>
            </div>
            <div class="card-footer text-center">
              <a href="/dashboard/discord/server?id=${server.id}" class="btn btn-primary btn-sm">
                <i class="fas fa-cog me-1"></i> ${translations[currentLanguage].manageBtn}
              </a>
              <a href="https://discord.com/channels/${server.id}" class="btn btn-outline-primary btn-sm ms-2" target="_blank">
                <i class="fas fa-external-link-alt me-1"></i> ${translations[currentLanguage].viewBtn}
              </a>
            </div>
          </div>
        `;

      serverGrid.appendChild(serverCard);
    });

    // Actualizar paginación
    updatePagination(servers.length);
    document.getElementById("loading-spinner").classList.add("d-none");
  };

  const updatePagination = (totalServers) => {
    const totalPages = Math.ceil(totalServers / serversPerPage);
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = "";

    // Botón Anterior
    const prevItem = document.createElement("li");
    prevItem.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevItem.innerHTML = `
        <a class="page-link" href="#" tabindex="-1" aria-disabled="true" data-key="previous">
          ${translations[currentLanguage].previous}
        </a>
      `;
    prevItem.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        renderServers(filteredServers, currentPage - 1);
      }
    });
    pagination.appendChild(prevItem);

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
      const pageItem = document.createElement("li");
      pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      pageItem.addEventListener("click", (e) => {
        e.preventDefault();
        renderServers(filteredServers, i);
      });
      pagination.appendChild(pageItem);
    }

    // Botón Siguiente
    const nextItem = document.createElement("li");
    nextItem.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextItem.innerHTML = `
        <a class="page-link" href="#" data-key="next">
          ${translations[currentLanguage].next}
        </a>
      `;
    nextItem.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        renderServers(filteredServers, currentPage + 1);
      }
    });
    pagination.appendChild(nextItem);
  };

  // --- MANEJADORES DE EVENTOS ---
  const themeSwitch = document.getElementById("themeSwitch");
  if (themeSwitch) {
    themeSwitch.addEventListener("change", () => {
      const theme = themeSwitch.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", theme);
      localStorage.setItem("theme", theme);
      const themeIcon = document.querySelector('label[for="themeSwitch"] i');
      if (themeIcon) themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    });
  }

  const langLinks = document.querySelectorAll(".lang-link");
  if (langLinks && langLinks.length) {
    langLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        currentLanguage = link.dataset.lang;
        localStorage.setItem("language", currentLanguage);
        updateTranslations();
        langLinks.forEach((l) => l.classList.toggle("active", l === link));
        // Volver a renderizar servidores para actualizar traducciones
        renderServers(filteredServers, currentPage);
      });
    });
  }

  // Compact/Expanded toggle
  const toggleCompact = document.getElementById("toggle-compact");
  if (toggleCompact) {
    toggleCompact.addEventListener("click", () => {
      compactMode = !compactMode;
      localStorage.setItem("compactMode", compactMode);
      renderServers(filteredServers, currentPage);
      toggleCompact.innerHTML = compactMode ? '<i class="fas fa-th-list"></i>' : '<i class="fas fa-th-large"></i>';
    });
    // Inicializar icono
    toggleCompact.innerHTML = compactMode ? '<i class="fas fa-th-list"></i>' : '<i class="fas fa-th-large"></i>';
  }

  // Filtros avanzados
  const filterTypeSelect = document.getElementById("filter-type");
  const filterFeatureSelect = document.getElementById("filter-feature");
  if (filterTypeSelect) {
    filterTypeSelect.addEventListener("change", (e) => {
      filterType = e.target.value;
      applyFilters();
    });
  }
  if (filterFeatureSelect) {
    filterFeatureSelect.addEventListener("change", (e) => {
      filterFeature = e.target.value;
      applyFilters();
    });
  }

  // Búsqueda de servidores
  const serverSearch = document.getElementById("server-search");
  if (serverSearch) {
    serverSearch.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase();
      applyFilters();
    });
  }

  // --- INICIALIZACIÓN ---
  const init = () => {
    // Cargar tema guardado o preferencia del sistema
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    if (themeSwitch) themeSwitch.checked = savedTheme === "dark";

    // Cargar idioma guardado o preferencia del navegador
    const savedLanguage = localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");
    currentLanguage = savedLanguage;

    // Activar pestaña de idioma correspondiente
    document.querySelector(`.lang-link[data-lang="${savedLanguage}"]`).classList.add("active");

    // Actualizar traducciones
    updateTranslations();

    // Restaurar orden de servidores si existe
    const savedOrder = localStorage.getItem("serverOrder");
    if (savedOrder) {
      const order = JSON.parse(savedOrder);
      filteredServers.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    // Mostrar skeletons antes de cargar
    setTimeout(() => {
      renderServers(filteredServers, 1);
    }, 600);
  };

  // Iniciar la aplicación
  init();
  document.body.classList.add("loaded");
});
