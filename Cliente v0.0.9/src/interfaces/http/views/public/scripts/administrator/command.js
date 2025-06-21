document.addEventListener("DOMContentLoaded", function () {
  // Command management variables
  let commands = [];
  let currentPage = 1;
  const commandsPerPage = 10;
  let currentSortColumn = "name";
  let currentSortDirection = "asc";

  // DOM Elements
  const commandsTable = document.getElementById("commands-table");
  const commandsTableBody = document.getElementById("commands-table-body");
  const commandsPagination = document.getElementById("commands-pagination");
  const commandModal = new bootstrap.Modal(document.getElementById("commandModal"));
  const commandForm = document.getElementById("commandForm");
  const saveCommandBtn = document.getElementById("saveCommandBtn");
  const addCommandBtn = document.getElementById("add-command-btn");
  const searchCommandsInput = document.getElementById("search-commands");
  const clearSearchCommandsBtn = document.getElementById("clear-search-commands");
  const commandsFilterGuild = document.getElementById("commands-filter-guild");
  const commandsFilterStatus = document.getElementById("commands-filter-status");
  const commandEmbedToggle = document.getElementById("commandEmbed");
  const embedSettings = document.getElementById("embedSettings");
  const embedPreviewCard = document.getElementById("embedPreviewCard");
  const embedPreviewContent = document.getElementById("embedPreviewContent");

  // Initialize command management
  initCommandManagement();

  function initCommandManagement() {
    // Load commands from API
    loadCommands();

    // Set up event listeners
    if (addCommandBtn) {
      addCommandBtn.addEventListener("click", () => showCommandModal());
    }
    if (saveCommandBtn) {
      saveCommandBtn.addEventListener("click", saveCommand);
    }
    if (commandEmbedToggle) {
      commandEmbedToggle.addEventListener("change", toggleEmbedSettings);
    }

    // Add live preview listeners
    const embedTitleInput = document.getElementById("commandEmbedTitle");
    if (embedTitleInput) embedTitleInput.addEventListener("input", updateEmbedPreview);
    const responseInput = document.getElementById("commandResponse");
    if (responseInput) responseInput.addEventListener("input", updateEmbedPreview);
    const embedFooterInput = document.getElementById("commandEmbedFooter");
    if (embedFooterInput) embedFooterInput.addEventListener("input", updateEmbedPreview);
    const embedAuthorInput = document.getElementById("commandEmbedAuthor");
    if (embedAuthorInput) embedAuthorInput.addEventListener("input", updateEmbedPreview);
    const embedColorInput = document.getElementById("commandEmbedColor");
    if (embedColorInput) embedColorInput.addEventListener("input", updateEmbedPreview);

    // Search and filter events
    if (searchCommandsInput) {
      searchCommandsInput.addEventListener("input", debounce(filterCommands, 300));
    }
    if (clearSearchCommandsBtn) {
      clearSearchCommandsBtn.addEventListener("click", () => {
        searchCommandsInput.value = "";
        filterCommands();
      });
    }

    if (commandsFilterGuild) {
      commandsFilterGuild.addEventListener("change", filterCommands);
    }
    if (commandsFilterStatus) {
      commandsFilterStatus.addEventListener("change", filterCommands);
    }

    // Sortable columns
    document.querySelectorAll("#commands-table th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const column = th.getAttribute("data-sort");
        if (currentSortColumn === column) {
          currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
        } else {
          currentSortColumn = column;
          currentSortDirection = "asc";
        }
        renderCommandsTable();
        updateSortIndicator();
      });
    });

    // Compact view toggle
    const compactToggle = document.getElementById("commands-compact-toggle");
    if (compactToggle) {
      compactToggle.addEventListener("click", () => {
        commandsTable.classList.toggle("table-compact");
      });
    }
  }

  function loadCommands() {
    fetch("/dashboard/utils/commands")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          commands = data.data;
          populateGuildFilter();
          renderCommandsTable();
          renderPagination();
        } else {
          showToast("Error", "Failed to load commands: " + data.message, "danger");
        }
      })
      .catch((error) => {
        console.error("Error loading commands:", error);
        showToast("Error", "Failed to load commands", "danger");
      });
  }

  function populateGuildFilter() {
    const guilds = [...new Set(commands.map((c) => c.guildId))];
    guilds.forEach((guildId) => {
      const option = document.createElement("option");
      option.value = guildId;
      option.textContent = guildId;
      commandsFilterGuild.appendChild(option);
    });
  }

  function renderCommandsTable() {
    const filteredCommands = getFilteredCommands();
    const sortedCommands = sortCommands(filteredCommands);
    const paginatedCommands = paginateCommands(sortedCommands);

    commandsTableBody.innerHTML = "";

    if (paginatedCommands.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="8" class="text-center py-4">
          <i class="fas fa-info-circle me-2"></i>
          No commands found matching your criteria
        </td>
      `;
      commandsTableBody.appendChild(row);
      return;
    }

    paginatedCommands.forEach((command) => {
      // Manejo seguro de botones
      let hasButtons = false;
      try {
        if (command.buttons) {
          let btns = command.buttons;
          if (typeof btns === "string") {
            btns = JSON.parse(btns);
          }
          hasButtons = Array.isArray(btns) && btns.length > 0;
        }
      } catch (e) {
        hasButtons = false;
      }
      const hasFile = command.file;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <span class="badge bg-primary">${command.name}</span>
        </td>
        <td>${command.guildId}</td>
        <td class="command-description">${command.description || "No description"}</td>
        <td>
          <span class="response-type-badge response-type-badge-${command.embed ? "embed" : "text"}">
            ${command.embed ? "Embed" : "Text"}
          </span>
          ${hasButtons ? '<span class="badge bg-info ms-1">Buttons</span>' : ""}
          ${hasFile ? '<span class="badge bg-warning ms-1">File</span>' : ""}
        </td>
        <td class="usage-count">${command.usageCount}</td>
        <td>
          <span class="command-status command-status-${command.isEnabled ? "enabled" : "disabled"}"></span>
          ${command.isEnabled ? "Enabled" : "Disabled"}
        </td>
        <td>${new Date(command.updatedAt).toLocaleString()}</td>
        <td class="command-actions">
          <button class="btn btn-sm btn-outline-primary edit-command" data-id="${command.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-command" data-id="${command.id}">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary toggle-command" data-id="${command.id}" data-status="${command.isEnabled}">
            <i class="fas fa-power-off"></i>
          </button>
        </td>
      `;
      commandsTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll(".edit-command").forEach((btn) => {
      btn.addEventListener("click", () => editCommand(btn.getAttribute("data-id")));
    });

    document.querySelectorAll(".delete-command").forEach((btn) => {
      btn.addEventListener("click", () => deleteCommand(btn.getAttribute("data-id")));
    });

    document.querySelectorAll(".toggle-command").forEach((btn) => {
      btn.addEventListener("click", () =>
        toggleCommandStatus(btn.getAttribute("data-id"), btn.getAttribute("data-status")),
      );
    });
  }

  function getFilteredCommands() {
    const searchTerm = searchCommandsInput.value.toLowerCase();
    const guildFilter = commandsFilterGuild.value;
    const statusFilter = commandsFilterStatus.value;

    return commands.filter((command) => {
      const matchesSearch =
        command.name.toLowerCase().includes(searchTerm) ||
        (command.description && command.description.toLowerCase().includes(searchTerm)) ||
        command.response.toLowerCase().includes(searchTerm);

      const matchesGuild = guildFilter ? command.guildId === guildFilter : true;

      const matchesStatus = statusFilter
        ? (statusFilter === "enabled" && command.isEnabled) ||
          (statusFilter === "disabled" && !command.isEnabled)
        : true;

      return matchesSearch && matchesGuild && matchesStatus;
    });
  }

  function sortCommands(commands) {
    return [...commands].sort((a, b) => {
      let valueA, valueB;

      switch (currentSortColumn) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "guildId":
          valueA = a.guildId;
          valueB = b.guildId;
          break;
        case "description":
          valueA = a.description?.toLowerCase() || "";
          valueB = b.description?.toLowerCase() || "";
          break;
        case "usageCount":
          valueA = a.usageCount;
          valueB = b.usageCount;
          break;
        case "updatedAt":
          valueA = new Date(a.updatedAt).getTime();
          valueB = new Date(b.updatedAt).getTime();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (valueA < valueB) return currentSortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return currentSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  function paginateCommands(commands) {
    const startIndex = (currentPage - 1) * commandsPerPage;
    return commands.slice(startIndex, startIndex + commandsPerPage);
  }

  function renderPagination() {
    const filteredCommands = getFilteredCommands();
    const totalPages = Math.ceil(filteredCommands.length / commandsPerPage);

    commandsPagination.innerHTML = "";

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        renderCommandsTable();
        renderPagination();
      }
    });
    commandsPagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageLi = document.createElement("li");
      pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      pageLi.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i;
        renderCommandsTable();
        renderPagination();
      });
      commandsPagination.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        renderCommandsTable();
        renderPagination();
      }
    });
    commandsPagination.appendChild(nextLi);
  }

  function updateSortIndicator() {
    document.querySelectorAll("#commands-table th.sortable i").forEach((icon) => {
      icon.className = "fa fa-sort";
    });

    const currentTh = document.querySelector(
      `#commands-table th[data-sort="${currentSortColumn}"]`,
    );
    if (currentTh) {
      const icon = currentTh.querySelector("i");
      if (icon) {
        icon.className = currentSortDirection === "asc" ? "fa fa-sort-up" : "fa fa-sort-down";
      }
    }
  }

  function filterCommands() {
    currentPage = 1;
    renderCommandsTable();
    renderPagination();
  }

  function showCommandModal(command = null) {
    const modalTitle = document.getElementById("commandModalLabel");
    const form = document.getElementById("commandForm");

    if (command) {
      modalTitle.textContent = "Edit Command";
      document.getElementById("commandId").value = command.id;
      document.getElementById("commandName").value = command.name;
      document.getElementById("commandGuild").value = command.guildId;
      document.getElementById("commandDescription").value = command.description || "";
      document.getElementById("commandResponse").value = command.response || "";
      document.getElementById("commandEmbed").checked = command.embed;
      document.getElementById("commandEmbedColor").value = command.embedColor || "#ff0000";
      document.getElementById("commandEmbedTitle").value = command.embedTitle || "";
      document.getElementById("commandEmbedFooter").value = command.embedFooter || "";
      document.getElementById("commandEmbedAuthor").value = command.embedAuthor || "";
      document.getElementById("commandEmbedThumbnail").value = command.embedThumbnail || "";
      document.getElementById("commandEmbedImage").value = command.embedImage || "";
      document.getElementById("commandFile").value = command.file || "";

      // Manejo seguro de botones para evitar error de JSON.parse
      let buttonsValue = "";
      if (command.buttons) {
        try {
          if (typeof command.buttons === "string") {
            // Si es string, intenta parsear
            buttonsValue = JSON.stringify(JSON.parse(command.buttons), null, 2);
          } else if (Array.isArray(command.buttons) || typeof command.buttons === "object") {
            // Si ya es objeto/array, solo serializa
            buttonsValue = JSON.stringify(command.buttons, null, 2);
          }
        } catch (e) {
          // Si falla el parseo, muestra como string plano
          buttonsValue = String(command.buttons);
        }
      }
      document.getElementById("commandButtons").value = buttonsValue;

      document.getElementById("commandEnabled").checked = command.isEnabled;

      toggleEmbedSettings();
      updateEmbedPreview();
    } else {
      modalTitle.textContent = "New Command";
      form.reset();
      document.getElementById("commandEmbedColor").value = "#ff0000";
      document.getElementById("commandEnabled").checked = true;
      document.getElementById("commandButtons").value = "";
      embedSettings.style.display = "none";
      embedPreviewCard.style.display = "none";
    }

    commandModal.show();
  }

  function toggleEmbedSettings() {
    const showEmbed = commandEmbedToggle.checked;
    embedSettings.style.display = showEmbed ? "flex" : "none";
    embedPreviewCard.style.display = showEmbed ? "block" : "none";
    if (showEmbed) {
      updateEmbedPreview();
    }
  }

  function updateEmbedPreview() {
    if (!commandEmbedToggle.checked) return;

    const embedColor = document.getElementById("commandEmbedColor").value;
    const embedTitle = document.getElementById("commandEmbedTitle").value;
    const description = document.getElementById("commandResponse").value;
    const embedFooter = document.getElementById("commandEmbedFooter").value;
    const embedAuthor = document.getElementById("commandEmbedAuthor").value;
    const embedThumbnail = document.getElementById("commandEmbedThumbnail").value;
    const embedImage = document.getElementById("commandEmbedImage").value;

    let previewHTML = `
      <div class="embed-preview-title" style="color: ${embedColor}">${embedTitle || "Embed Title"}</div>
      <div class="embed-preview-content">${description || "Embed description content will appear here..."}</div>
    `;

    if (embedAuthor) {
      previewHTML = `
        <div class="embed-preview-author">${embedAuthor}</div>
        ${previewHTML}
      `;
    }

    if (embedFooter) {
      previewHTML += `<div class="embed-preview-footer">${embedFooter}</div>`;
    }

    embedPreviewContent.innerHTML = previewHTML;
    document.querySelector(".embed-preview").style.borderLeftColor = embedColor;

    // Show thumbnail/image previews if provided
    const thumbnailPreview = document.getElementById("embedThumbnailPreview");
    const imagePreview = document.getElementById("embedImagePreview");

    if (embedThumbnail) {
      if (!thumbnailPreview) {
        const img = document.createElement("img");
        img.id = "embedThumbnailPreview";
        img.src = embedThumbnail;
        img.className = "embed-preview-thumbnail";
        embedPreviewContent.prepend(img);
      } else {
        thumbnailPreview.src = embedThumbnail;
      }
    } else if (thumbnailPreview) {
      thumbnailPreview.remove();
    }

    if (embedImage) {
      if (!imagePreview) {
        const img = document.createElement("img");
        img.id = "embedImagePreview";
        img.src = embedImage;
        img.className = "embed-preview-image";
        embedPreviewContent.appendChild(img);
      } else {
        imagePreview.src = embedImage;
      }
    } else if (imagePreview) {
      imagePreview.remove();
    }
  }

  function saveCommand() {
    const form = document.getElementById("commandForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Validate buttons JSON
    let buttonsValue = null;
    try {
      const buttonsInput = document.getElementById("commandButtons").value;
      if (buttonsInput && buttonsInput.trim() !== "") {
        buttonsValue = JSON.parse(buttonsInput);
        if (!Array.isArray(buttonsValue)) {
          throw new Error("Buttons must be an array");
        }

        // Validate each button
        buttonsValue.forEach((btn) => {
          if (!btn.label || !btn.style || !btn.customId) {
            throw new Error("Each button must have label, style, and customId properties");
          }
        });
      }
    } catch (e) {
      showToast("Error", "Invalid buttons format: " + e.message, "danger");
      return;
    }

    const commandData = {
      id: document.getElementById("commandId").value || undefined,
      guildId: document.getElementById("commandGuild").value,
      name: document.getElementById("commandName").value,
      description: document.getElementById("commandDescription").value,
      response: document.getElementById("commandResponse").value,
      embed: document.getElementById("commandEmbed").checked,
      embedColor: document.getElementById("commandEmbed").checked
        ? document.getElementById("commandEmbedColor").value
        : undefined,
      embedTitle: document.getElementById("commandEmbed").checked
        ? document.getElementById("commandEmbedTitle").value
        : undefined,
      embedFooter: document.getElementById("commandEmbed").checked
        ? document.getElementById("commandEmbedFooter").value
        : undefined,
      embedAuthor: document.getElementById("commandEmbed").checked
        ? document.getElementById("commandEmbedAuthor").value
        : undefined,
      embedThumbnail: document.getElementById("commandEmbed").checked
        ? document.getElementById("commandEmbedThumbnail").value
        : undefined,
      embedImage: document.getElementById("commandEmbed").checked
        ? document.getElementById("commandEmbedImage").value
        : undefined,
      file: document.getElementById("commandFile").value, // <-- Cambia esto
      buttons: buttonsValue ? JSON.stringify(buttonsValue) : undefined,
      isEnabled: document.getElementById("commandEnabled").checked,
    };

    const method = commandData.id ? "PUT" : "POST";
    const url = commandData.id
      ? `/dashboard/utils/commands/${commandData.id}`
      : "/dashboard/utils/commands";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commandData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast(
            "Success",
            `Command ${commandData.id ? "updated" : "created"} successfully`,
            "success",
          );
          loadCommands();
          commandModal.hide();
        } else {
          showToast("Error", data.message || "Failed to save command", "danger");
        }
      })
      .catch((error) => {
        console.error("Error saving command:", error);
        showToast("Error", "Failed to save command", "danger");
      });
  }

  function editCommand(commandId) {
    const command = commands.find((c) => c.id === commandId);
    if (command) {
      showCommandModal(command);
    }
  }

  function deleteCommand(commandId) {
    if (confirm("Are you sure you want to delete this command? This action cannot be undone.")) {
      fetch(`/dashboard/utils/commands/${commandId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast("Success", "Command deleted successfully", "success");
            loadCommands();
          } else {
            showToast("Error", data.message || "Failed to delete command", "danger");
          }
        })
        .catch((error) => {
          console.error("Error deleting command:", error);
          showToast("Error", "Failed to delete command", "danger");
        });
    }
  }

  function toggleCommandStatus(commandId, currentStatus) {
    const newStatus = currentStatus === "true" ? false : true;

    fetch(`/dashboard/utils/commands/${commandId}/toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isEnabled: newStatus }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast(
            "Success",
            `Command ${newStatus ? "enabled" : "disabled"} successfully`,
            "success",
          );
          loadCommands();
        } else {
          showToast("Error", data.message || "Failed to toggle command status", "danger");
        }
      })
      .catch((error) => {
        console.error("Error toggling command status:", error);
        showToast("Error", "Failed to toggle command status", "danger");
      });
  }

  // Utility functions
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function showToast(title, message, type) {
    const toast = document.getElementById("notificationToast");
    const toastTitle = document.getElementById("toast-title");
    const toastBody = document.getElementById("toast-body");

    toastTitle.textContent = title;
    toastBody.textContent = message;

    // Remove previous color classes
    toast.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");

    // Add new color class based on type
    switch (type) {
      case "success":
        toast.classList.add("text-bg-success");
        break;
      case "danger":
        toast.classList.add("text-bg-danger");
        break;
      case "warning":
        toast.classList.add("text-bg-warning");
        break;
      default:
        toast.classList.add("text-bg-info");
    }

    // Show the toast
    const toastInstance = new bootstrap.Toast(toast);
    toastInstance.show();
  }
});
