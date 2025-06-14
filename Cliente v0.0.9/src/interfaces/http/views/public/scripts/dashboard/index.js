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
      if (translations[currentLanguage][key]) {
        if (element.tagName === "INPUT" && element.placeholder) {
          element.placeholder = translations[currentLanguage][key];
        } else {
          element.textContent = translations[currentLanguage][key];
        }
      }
    });
  };

  if (
    (fileData && fileData.length > 0) ||
    (ticketData && ticketData.length > 0) ||
    (licenseData && licenseData.length > 0)
  ) {
    (function () {
      let chartInstance = null;
      let lastStats = { archivos: 0, tickets: 0, licencias: 0 };
      const darkMode =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

      // Paleta de colores profesional
      const colors = {
        background: darkMode ? "#1a1a2e" : "#ffffff",
        text: darkMode ? "#e6e6e6" : "#333333",
        border: darkMode ? "#2a2a3a" : "#e0e0e0",
        gradients: {
          archivos: darkMode ? ["#4cc9f0", "#4361ee"] : ["#36D1DC", "#5B86E5"],
          tickets: darkMode ? ["#f72585", "#b5179e"] : ["#FF416C", "#FF4B2B"],
          licencias: darkMode ? ["#f7c873", "#f7b42c"] : ["#FFD700", "#FFA500"],
        },
        shadow: darkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.2)",
      };

      function getStatsData() {
        return {
          archivos: fileData?.length || 0,
          tickets: ticketData?.length || 0,
          licencias: licenseData?.length || 0,
        };
      }

      function createGradient(ctx, area, colors) {
        const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        return gradient;
      }

      function renderChart(stats) {
        const ctx = document.getElementById("userStatsChart");
        if (!ctx) return;

        if (chartInstance) {
          chartInstance.destroy();
        }

        const chartArea = {
          top: 0,
          right: 0,
          bottom: ctx.offsetHeight,
          left: 0,
        };

        chartInstance = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: [
              `Archivos subidos (${stats.archivos})`,
              `Tickets recientes (${stats.tickets})`,
              `Licencias activas (${stats.licencias})`,
            ],
            datasets: [
              {
                data: [stats.archivos, stats.tickets, stats.licencias],
                backgroundColor: [
                  createGradient(ctx.getContext("2d"), chartArea, colors.gradients.archivos),
                  createGradient(ctx.getContext("2d"), chartArea, colors.gradients.tickets),
                  createGradient(ctx.getContext("2d"), chartArea, colors.gradients.licencias),
                ],
                borderColor: colors.background,
                borderWidth: 3,
                hoverOffset: 20,
                borderRadius: 12,
                spacing: 4,
                weight: 0.5,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            //aspectRatio: 1.5,
            cutout: "72%",
            plugins: {
              legend: {
                display: true,
                position: "bottom",
                align: "center",
                labels: {
                  color: colors.text,
                  font: {
                    size: 14,
                    weight: "600",
                    family:
                      "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Helvetica Neue', sans-serif",
                  },
                  padding: 20,
                  boxWidth: 18,
                  boxHeight: 18,
                  usePointStyle: true,
                  pointStyle: "circle",
                },
                onHover: (e) => {
                  e.native.target.style.cursor = "pointer";
                },
                onLeave: (e) => {
                  e.native.target.style.cursor = "default";
                },
              },
              tooltip: {
                enabled: true,
                backgroundColor: darkMode ? "rgba(30,30,40,0.97)" : "rgba(255,255,255,0.97)",
                borderColor: colors.gradients.archivos[1],
                borderWidth: 1,
                titleColor: colors.text,
                bodyColor: colors.text,
                titleFont: { size: 14, weight: "bold" },
                bodyFont: { size: 13, weight: "500" },
                footerFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                caretSize: 8,
                displayColors: true,
                boxPadding: 6,
                callbacks: {
                  label: function (context) {
                    const label = context.label.split(" (")[0] || "";
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                    let extra = "";

                    if (context.dataIndex === 0 && value > 0 && fileData?.length) {
                      const avgSize = (
                        fileData.reduce((a, b) => a + b.size, 0) /
                        fileData.length /
                        1024
                      ).toFixed(1);
                      extra = `\nTamaño promedio: ${avgSize} KB`;
                    }

                    return `${label}: ${value} (${percent}%)${extra}`;
                  },
                  afterLabel: function (context) {
                    if (context.dataIndex === 1 && ticketData?.length) {
                      const openTickets = ticketData.filter((t) => t.status === "open").length;
                      return `Abiertos: ${openTickets}`;
                    }
                    return null;
                  },
                },
              },
              title: {
                display: true,
                text: "Resumen de Actividad del Usuario",
                color: colors.text,
                font: {
                  size: 18,
                  weight: "600",
                  family: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Helvetica Neue', sans-serif",
                },
                padding: { top: 10, bottom: 15 },
              },
              subtitle: {
                display: true,
                text: "Datos actualizados en tiempo real",
                color: darkMode ? "#a0a0a0" : "#666666",
                font: {
                  size: 12,
                  weight: "normal",
                  style: "italic",
                },
                padding: { bottom: 20 },
              },
            },
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 1500,
              easing: "easeOutQuart",
            },
            transitions: {
              show: {
                animations: {
                  x: { from: 0 },
                  y: { from: 0 },
                },
              },
              hide: {
                animations: {
                  x: { to: 0 },
                  y: { to: 0 },
                },
              },
            },
            layout: {
              padding: {
                top: 10,
                bottom: 20,
                left: 15,
                right: 15,
              },
            },
            onHover: (event, chartElements) => {
              if (chartElements.length) {
                event.native.target.style.cursor = "pointer";
              } else {
                event.native.target.style.cursor = "default";
              }
            },
          },
          plugins: [
            {
              id: "custom_shadow",
              beforeDraw: (chart, args, options) => {
                const { ctx } = chart;
                ctx.save();
                ctx.shadowColor = colors.shadow;
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 5;
              },
              afterDraw: (chart) => {
                chart.ctx.restore();
              },
            },
            {
              id: "center_text",
              afterDraw: (chart) => {
                if (chart.config.options.cutoutPercentage || chart.config.options.cutout) {
                  const {
                    ctx,
                    chartArea: { left, right, top, bottom, width, height },
                  } = chart;
                  const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

                  ctx.save();
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";

                  // Texto principal (total)
                  const centerX = (left + right) / 2;
                  const centerY = (top + bottom) / 2;

                  ctx.font = `bold 24px 'Segoe UI', 'Roboto', sans-serif`;
                  ctx.fillStyle = colors.text;
                  ctx.fillText(total, centerX, centerY - 10);

                  // Texto secundario
                  ctx.font = `12px 'Segoe UI', 'Roboto', sans-serif`;
                  ctx.fillStyle = darkMode ? "#a0a0a0" : "#666666";
                  ctx.fillText("Total actividades", centerX, centerY + 20);

                  ctx.restore();
                }
              },
            },
          ],
        });
      }

      function updateChartIfNeeded() {
        const stats = getStatsData();
        if (
          stats.archivos !== lastStats.archivos ||
          stats.tickets !== lastStats.tickets ||
          stats.licencias !== lastStats.licencias
        ) {
          renderChart(stats);
          lastStats = { ...stats };
        }
      }

      // Inicializa la gráfica con animación suave
      setTimeout(() => {
        updateChartIfNeeded();
      }, 800);

      // Actualiza automáticamente cada 30 segundos
      setInterval(updateChartIfNeeded, 30000);

      // Escucha cambios en el tema oscuro/claro
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        updateChartIfNeeded();
      });
    })();
  }

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
          showToast(
            translations[currentLanguage].toastSuccess,
            translations[currentLanguage].dragInfo,
            "success",
          );
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
              <a href="/dashboard/server/${server.id}" class="btn btn-primary btn-sm">
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
      toggleCompact.innerHTML = compactMode
        ? '<i class="fas fa-th-list"></i>'
        : '<i class="fas fa-th-large"></i>';
    });
    // Inicializar icono
    toggleCompact.innerHTML = compactMode
      ? '<i class="fas fa-th-list"></i>'
      : '<i class="fas fa-th-large"></i>';
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
    const savedLanguage =
      localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");
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
