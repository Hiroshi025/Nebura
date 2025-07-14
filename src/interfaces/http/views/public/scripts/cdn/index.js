window.addEventListener("load", function () {
  // Mostrar un loader mientras se carga todo
  document.body.classList.add("loaded");
});

document.addEventListener("DOMContentLoaded", function () {
  // --- CONFIGURACIÓN Y ESTADO ---
  let currentLanguage = "es";
  let currentFiles = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;
  let currentView = "grid"; // 'grid' o 'list'
  let selectedFiles = new Set();
  const toastElement = document.getElementById("notificationToast");
  const notificationToast = new bootstrap.Toast(toastElement);
  const filePreviewModal = new bootstrap.Modal(document.getElementById("filePreviewModal"));
  const userAvatar = document.querySelector(".user-avatar");
  const shareFileModal = new bootstrap.Modal(document.getElementById("shareFileModal"));
  const shareFilePreview = document.getElementById("share-file-preview");
  const shareFileTitle = document.getElementById("share-file-title");
  const shareFileDesc = document.getElementById("share-file-desc");
  const shareFileLink = document.getElementById("share-file-link");
  const copyShareLinkBtn = document.getElementById("copy-share-link-btn");
  const shareLinkCopied = document.getElementById("share-link-copied");

  // --- DICCIONARIO DE TRADUCCIONES ---
  const translations = {
    en: {
      mainTitle: "My Files",
      uploadBtn: "Upload File",
      modalTitle: "Upload New File",
      fileTitleLabel: "File Title",
      fileDescriptionLabel: "Description (Optional)",
      fileSelectLabel: "File",
      dropZoneText: "Drag & drop a file here or click to select",
      modalUploadBtn: "Upload File",
      noFilesTitle: "No files yet",
      noFilesSubtitle: "Upload your first file to get started!",
      viewBtn: "View",
      downloadBtn: "Download",
      shareBtn: "Share",
      deleteBtn: "Delete",
      uploadDate: "Uploaded",
      fileSize: "Size",
      fileSharedTitle: "Shared File",
      copiedSuccess: "Link copied to clipboard!",
      deleteConfirm: "Are you sure you want to delete this file?",
      deleteSuccess: "File deleted successfully.",
      uploadSuccess: "File uploaded successfully!",
      errorFetch: "Error fetching files.",
      errorUpload: "Error uploading file.",
      errorDelete: "Error deleting file.",
      searchPlaceholder: "Search files...",
      filterAll: "All",
      filterImages: "Images",
      filterVideos: "Videos",
      filterAudio: "Audio",
      filterDocuments: "Documents",
      filterOther: "Other",
      totalFiles: "Total Files",
      totalSize: "Total Size",
      lastUpload: "Last Upload",
      previewBtn: "Preview",
      fileType: "Type",
      image: "Image",
      video: "Video",
      audio: "Audio",
      pdf: "PDF",
      document: "Document",
      archive: "Archive",
      other: "Other",
      shareModalTitle: "Share File",
      shareFileNameLabel: "File:",
      shareFileDescLabel: "Description:",
      shareLinkLabel: "Share Link:",
      copyLinkBtn: "Copy",
      batchDeleteBtn: "Delete selected",
      batchDownloadBtn: "Download selected",
      selectedCount: "selected",
    },
    es: {
      mainTitle: "Mis Archivos",
      uploadBtn: "Subir Archivo",
      modalTitle: "Subir Nuevo Archivo",
      fileTitleLabel: "Título del Archivo",
      fileDescriptionLabel: "Descripción (Opcional)",
      fileSelectLabel: "Archivo",
      dropZoneText: "Arrastra y suelta un archivo aquí o haz clic para seleccionar",
      modalUploadBtn: "Subir Archivo",
      noFilesTitle: "No hay archivos todavía",
      noFilesSubtitle: "¡Sube tu primer archivo para empezar!",
      viewBtn: "Ver",
      downloadBtn: "Descargar",
      shareBtn: "Compartir",
      deleteBtn: "Eliminar",
      uploadDate: "Subido el",
      fileSize: "Tamaño",
      fileSharedTitle: "Archivo Compartido",
      copiedSuccess: "¡Enlace copiado al portapapeles!",
      deleteConfirm: "¿Estás seguro de que quieres eliminar este archivo?",
      deleteSuccess: "Archivo eliminado correctamente.",
      uploadSuccess: "¡Archivo subido con éxito!",
      errorFetch: "Error al cargar los archivos.",
      errorUpload: "Error al subir el archivo.",
      errorDelete: "Error al eliminar el archivo.",
      searchPlaceholder: "Buscar archivos...",
      filterAll: "Todos",
      filterImages: "Imágenes",
      filterVideos: "Videos",
      filterAudio: "Audio",
      filterDocuments: "Documentos",
      filterOther: "Otros",
      totalFiles: "Archivos Totales",
      totalSize: "Tamaño Total",
      lastUpload: "Última Subida",
      previewBtn: "Vista Previa",
      fileType: "Tipo",
      image: "Imagen",
      video: "Video",
      audio: "Audio",
      pdf: "PDF",
      document: "Documento",
      archive: "Archivo",
      other: "Otro",
      shareModalTitle: "Compartir Archivo",
      shareFileNameLabel: "Archivo:",
      shareFileDescLabel: "Descripción:",
      shareLinkLabel: "Enlace para compartir:",
      copyLinkBtn: "Copiar",
      batchDeleteBtn: "Eliminar seleccionados",
      batchDownloadBtn: "Descargar seleccionados",
      selectedCount: "seleccionados",
    },
  };

  // --- ELEMENTOS DEL DOM ---
  const themeSwitch = document.getElementById("themeSwitch");
  const themeIcon = document.querySelector('label[for="themeSwitch"] i');
  const langLinks = document.querySelectorAll(".lang-link");
  const mainView = document.getElementById("main-view");
  const sharedFileView = document.getElementById("shared-file-view");
  const fileGrid = document.getElementById("file-grid");
  const fileList = document.getElementById("file-list");
  const fileListBody = document.getElementById("file-list-body");
  const toggleViewBtn = document.getElementById("toggle-view-btn");
  const batchActions = document.getElementById("batch-actions");
  const batchDeleteBtn = document.getElementById("batch-delete-btn");
  const batchDownloadBtn = document.getElementById("batch-download-btn");
  const selectedCount = document.getElementById("selected-count");
  const selectAllFiles = document.getElementById("select-all-files");
  const globalProgressContainer = document.getElementById("global-progress-container");
  const globalProgressBar = document.getElementById("global-progress-bar");
  const paginationNav = document.getElementById("pagination-nav");
  const prevPageBtn = document.getElementById("prev-page-btn");
  const nextPageBtn = document.getElementById("next-page-btn");
  const pageInfo = document.getElementById("page-info");
  const loadingSpinner = document.getElementById("loading-spinner");
  const noFilesMessage = document.getElementById("no-files-message");
  const uploadModal = new bootstrap.Modal(document.getElementById("uploadModal"));
  const searchInput = document.getElementById("search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const uploadProgress = document.querySelector(".upload-progress");
  const uploadProgressBar = document.querySelector(".upload-progress-bar");
  const totalFilesElement = document.getElementById("total-files");
  const totalSizeElement = document.getElementById("total-size");
  const lastUploadElement = document.getElementById("last-upload");
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("fileInput");
  const fileNameDisplay = document.getElementById("file-name-display");
  const uploadForm = document.getElementById("uploadForm");

  // --- FUNCIONES DE AYUDA ---
  const showToast = (title, body, type = "success") => {
    const toastTitle = document.getElementById("toast-title");
    const toastBody = document.getElementById("toast-body");
    toastTitle.textContent = title;
    toastBody.textContent = body;
    toastElement.classList.remove("bg-success", "bg-danger", "text-white");
    if (type === "success") {
      toastElement.classList.add("bg-success", "text-white");
    } else {
      toastElement.classList.add("bg-danger", "text-white");
    }
    notificationToast.show();
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(currentLanguage, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (mimeType) => {
    const type = mimeType.split("/")[0];
    const specificType = mimeType.split("/")[1];

    if (type === "image") return "image";
    if (type === "video") return "video";
    if (type === "audio") return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (
      mimeType.includes("word") ||
      mimeType.includes("excel") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("text")
    )
      return "document";
    if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) return "archive";
    return "other";
  };

  const getFileIcon = (mimeType) => {
    const iconMap = {
      image: "fa-solid fa-file-image",
      audio: "fa-solid fa-file-audio",
      video: "fa-solid fa-file-video",
      pdf: "fa-solid fa-file-pdf",
      archive: "fa-solid fa-file-zipper",
      document: "fa-solid fa-file-lines",
      other: "fa-solid fa-file",
    };
    const fileType = getFileType(mimeType);
    return iconMap[fileType] || iconMap["other"];
  };

  const getFileTypeName = (mimeType) => {
    const fileType = getFileType(mimeType);
    return translations[currentLanguage][fileType] || translations[currentLanguage]["other"];
  };

  const updateUserStats = (files) => {
    if (!files || files.length === 0) {
      totalFilesElement.textContent = "0";
      totalSizeElement.textContent = "0 MB";
      lastUploadElement.textContent = "-";
      return;
    }

    // Total files
    totalFilesElement.textContent = files.length;

    // Total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    totalSizeElement.textContent = formatSize(totalSize);

    // Last upload
    const sortedFiles = [...files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    lastUploadElement.textContent = formatDate(sortedFiles[0].uploadedAt);
  };

  // --- TRADUCCIÓN DE INTERFAZ ---
  function updateTranslations() {
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
    // Traducir modal de compartir
    if (document.getElementById("shareFileModalLabel"))
      document.getElementById("shareFileModalLabel").textContent = translations[currentLanguage].shareModalTitle;
    if (document.querySelector('[data-key="shareFileNameLabel"]'))
      document.querySelector('[data-key="shareFileNameLabel"]').textContent =
        translations[currentLanguage].shareFileNameLabel;
    if (document.querySelector('[data-key="shareFileDescLabel"]'))
      document.querySelector('[data-key="shareFileDescLabel"]').textContent =
        translations[currentLanguage].shareFileDescLabel;
    if (document.querySelector('[data-key="shareLinkLabel"]'))
      document.querySelector('[data-key="shareLinkLabel"]').textContent = translations[currentLanguage].shareLinkLabel;
    if (copyShareLinkBtn) copyShareLinkBtn.textContent = translations[currentLanguage].copyLinkBtn;
    if (shareLinkCopied) shareLinkCopied.textContent = translations[currentLanguage].copiedSuccess;

    // Acciones en lote
    const batchDeleteBtn = document.getElementById("batch-delete-btn");
    if (batchDeleteBtn)
      batchDeleteBtn.innerHTML = `<i class="fas fa-trash"></i> ${translations[currentLanguage].batchDeleteBtn}`;
    const batchDownloadBtn = document.getElementById("batch-download-btn");
    if (batchDownloadBtn)
      batchDownloadBtn.innerHTML = `<i class="fas fa-download"></i> ${translations[currentLanguage].batchDownloadBtn}`;

    // Traducir vista de archivo compartido si está activa
    if (window.location.pathname.includes("/cdn/share") || window.location.search.includes("share?title=")) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("title") && params.has("url")) {
        renderSharedFileView(params);
        document.title = translations[currentLanguage].fileSharedTitle;
      }
    }
  }

  // --- VISTA DE ARCHIVO COMPARTIDO MULTILENGUAJE ---
  function renderSharedFileView(params) {
    const sharedFileContent = document.getElementById("shared-file-content");
    if (!sharedFileContent) return;
    const title = decodeURIComponent(params.get("title") || "");
    const url = decodeURIComponent(params.get("url") || "");
    const mime = decodeURIComponent(params.get("mime") || "");
    const size = params.get("size") ? Number(params.get("size")) : 0;
    const date = params.get("date") ? decodeURIComponent(params.get("date")) : "";

    let previewHtml = "";
    if (mime.startsWith("image/")) {
      previewHtml = `<img src="${url}" alt="${title}" class="img-fluid mb-3" style="max-height: 60vh; object-fit: contain;">`;
    } else if (mime.startsWith("video/")) {
      previewHtml = `<video controls style="max-width:100%;max-height:60vh;"><source src="${url}" type="${mime}"></video>`;
    } else if (mime.startsWith("audio/")) {
      previewHtml = `<audio controls style="width:100%;"><source src="${url}" type="${mime}"></audio>`;
    } else if (mime === "application/pdf") {
      previewHtml = `<iframe src="${url}" style="width:100%;height:60vh;" frameborder="0"></iframe>`;
    } else if (mime.startsWith("text/")) {
      previewHtml = `<iframe src="${url}" style="width:100%;height:60vh;" frameborder="0"></iframe>`;
    } else {
      previewHtml = `<i class="${getFileIcon(mime)} fa-5x mb-3"></i>`;
    }

    sharedFileContent.innerHTML = `
      <div class="card-body text-center">
        ${previewHtml}
        <h3 class="card-title mb-2">${title}</h3>
        <p class="card-text text-muted mb-2">${translations[currentLanguage].fileType}: ${getFileTypeName(mime)}</p>
        <p class="card-text mb-2">${translations[currentLanguage].fileSize}: ${formatSize(size)}</p>
        <p class="card-text mb-2">${translations[currentLanguage].uploadDate}: ${date ? formatDate(date) : "-"}</p>
        <a href="${url}" class="btn btn-primary" download>
          <i class="fas fa-download me-2"></i> ${translations[currentLanguage].downloadBtn}
        </a>
      </div>
    `;
  }

  // --- ELIMINAR ARCHIVO INDIVIDUAL ---
  async function handleDelete(fileName, cardElement) {
    if (!confirm(translations[currentLanguage].deleteConfirm)) return;

    try {
      const result = await api.deleteFile(USER_ID, fileName);
      if (result.success) {
        showToast(translations[currentLanguage].deleteSuccess, translations[currentLanguage].deleteSuccess, "success");
        if (cardElement && cardElement.parentElement) {
          cardElement.parentElement.remove();
        }
        updateUserStats(currentFiles.filter((f) => f.fileName !== fileName));
        // Recargar archivos después de eliminar
        await fetchAndRenderFiles();
      } else {
        showToast(
          translations[currentLanguage].errorDelete,
          result.message || translations[currentLanguage].errorDelete,
          "danger",
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast(
        translations[currentLanguage].errorDelete,
        error.message || translations[currentLanguage].errorDelete,
        "danger",
      );
    }
  }

  // --- LÓGICA DE LA APLICACIÓN ---
  const api = {
    getFiles: async (userId) => {
      const cacheKey = `files-${userId}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      try {
        const response = await fetch(`/dashboard/utils/cdn/${userId}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        // Almacenar en caché por 1 minuto
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        setTimeout(() => sessionStorage.removeItem(cacheKey), 60000);

        return data;
      } catch (error) {
        console.error("API Error getFiles:", error);
        return { success: false, message: "Error fetching files" };
      }
    },
    uploadFile: async (formData, onProgress) => {
      return new Promise(async (resolve) => {
        try {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
          });

          xhr.open("POST", `/dashboard/utils/cdn?userId=${USER_ID}`, true);

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              resolve({ success: false, message: "Upload failed" });
            }
          };

          xhr.onerror = () => {
            resolve({ success: false, message: "Network error" });
          };

          xhr.send(formData);
        } catch (error) {
          console.error("API Error uploadFile:", error);
          return { success: false, message: "Error uploading file" };
        }
      });
    },
    deleteFile: async (userId, fileName) => {
      try {
        const response = await fetch(`/dashboard/utils/cdn/${userId}/${fileName}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Delete failed");
        return await response.json();
      } catch (error) {
        console.error("API Error deleteFile:", error);
        return { success: false, message: "Error deleting file" };
      }
    },
  };

  // --- VISTA GRID Y LISTA ---
  function renderFileGrid(files) {
    fileGrid.innerHTML = "";
    currentFiles = files || [];
    updateUserStats(currentFiles);

    if (!files || files.length === 0) {
      noFilesMessage.classList.remove("d-none");
      return;
    }
    noFilesMessage.classList.add("d-none");

    // Paginación
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const paginatedFiles = files.slice(start, end);

    paginatedFiles.forEach((file, index) => {
      const fileType = getFileType(file.mimeType);
      const preview = file.mimeType.startsWith("image/")
        ? `<img src="${file.downloadUrl}" alt="${file.title}" onerror="this.onerror=null;this.src='https://placehold.co/400/cccccc/ffffff?text=Error';">`
        : `<i class="${getFileIcon(file.mimeType)}"></i>`;

      const card = document.createElement("div");
      card.className = "col-lg-3 col-md-4 col-sm-6 fade-in";
      card.style.animationDelay = `${index * 0.05}s`;
      card.innerHTML = `
        <div class="card file-card h-100" data-type="${fileType}" data-title="${file.title.toLowerCase()}" data-description="${(file.description || "").toLowerCase()}">
          <div class="file-preview position-relative">
            <input type="checkbox" class="file-checkbox position-absolute top-0 start-0 m-2" data-filename="${file.fileName}" ${selectedFiles.has(file.fileName) ? "checked" : ""}>
            ${preview}
            <span class="file-type-badge">${getFileTypeName(file.mimeType)}</span>
          </div>
          <div class="card-body pb-0">
            <h5 class="card-title text-truncate">${file.title}</h5>
            <p class="card-text text-muted text-truncate">${file.description || file.originalName}</p>
          </div>
          <div class="card-footer">
            <p class="card-text text-muted mb-2">
              <small><strong data-key="uploadDate">${translations[currentLanguage].uploadDate}</strong>: ${formatDate(file.uploadedAt)}</small><br>
              <small><strong data-key="fileSize">${translations[currentLanguage].fileSize}</strong>: ${formatSize(file.size)}</small>
            </p>
            <div class="d-flex justify-content-between">
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary preview-btn" title="${translations[currentLanguage].previewBtn}">
                  <i class="fas fa-eye"></i>
                </button>
                <a href="/dashboard/utils/cdn/${USER_ID}/${file.fileName}" download="${file.originalName}" class="btn btn-sm btn-outline-secondary" title="${translations[currentLanguage].downloadBtn}">
                  <i class="fas fa-download"></i>
                </a>
              </div>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary share-btn" title="${translations[currentLanguage].shareBtn}">
                  <i class="fas fa-share-alt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" title="${translations[currentLanguage].deleteBtn}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      card.querySelector(".preview-btn").addEventListener("click", () => handlePreview(file));
      card.querySelector(".share-btn").addEventListener("click", () => handleShare(file));
      card.querySelector(".delete-btn").addEventListener("click", () => handleDelete(file.fileName, card));
      card.querySelector(".file-checkbox").addEventListener("change", (e) => handleSelectFile(e, file.fileName));
      fileGrid.appendChild(card);
    });

    // Drag & drop para subir archivos
    fileGrid.addEventListener("dragover", (e) => {
      e.preventDefault();
      fileGrid.classList.add("dragover");
    });
    fileGrid.addEventListener("dragleave", () => fileGrid.classList.remove("dragover"));
    fileGrid.addEventListener("drop", (e) => {
      e.preventDefault();
      fileGrid.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        handleDroppedFiles(e.dataTransfer.files);
      }
    });

    // SortableJS para reordenar (solo visual)
    new Sortable(fileGrid, {
      animation: 150,
      ghostClass: "sortable-ghost",
    });

    updatePagination(files.length);
  }

  function renderFileList(files) {
    fileListBody.innerHTML = "";
    currentFiles = files || [];
    updateUserStats(currentFiles);

    if (!files || files.length === 0) {
      noFilesMessage.classList.remove("d-none");
      return;
    }
    noFilesMessage.classList.add("d-none");

    // Paginación
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const paginatedFiles = files.slice(start, end);

    paginatedFiles.forEach((file) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
              <td><input type="checkbox" class="file-checkbox" data-filename="${file.fileName}" ${selectedFiles.has(file.fileName) ? "checked" : ""}></td>
              <td><span class="file-type-badge">${getFileTypeName(file.mimeType)}</span></td>
              <td>${file.title}</td>
              <td>${file.description || file.originalName}</td>
              <td>${formatDate(file.uploadedAt)}</td>
              <td>${formatSize(file.size)}</td>
              <td>
                <button class="btn btn-sm btn-outline-secondary preview-btn" title="${translations[currentLanguage].previewBtn}">
                  <i class="fas fa-eye"></i>
                </button>
                <a href="/dashboard/utils/cdn/${USER_ID}/${file.fileName}" download="${file.originalName}" class="btn btn-sm btn-outline-secondary" title="${translations[currentLanguage].downloadBtn}">
                  <i class="fas fa-download"></i>
                </a>
                <button class="btn btn-sm btn-outline-secondary share-btn" title="${translations[currentLanguage].shareBtn}">
                  <i class="fas fa-share-alt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" title="${translations[currentLanguage].deleteBtn}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
      tr.querySelector(".preview-btn").addEventListener("click", () => handlePreview(file));
      tr.querySelector(".share-btn").addEventListener("click", () => handleShare(file));
      tr.querySelector(".delete-btn").addEventListener("click", () => handleDelete(file.fileName, tr));
      tr.querySelector(".file-checkbox").addEventListener("change", (e) => handleSelectFile(e, file.fileName));
      fileListBody.appendChild(tr);
    });

    updatePagination(files.length);
  }

  function updatePagination(totalFiles) {
    const totalPages = Math.ceil(totalFiles / PAGE_SIZE);
    if (totalPages <= 1) {
      paginationNav.classList.add("d-none");
      return;
    }
    paginationNav.classList.remove("d-none");
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  }

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentView();
    }
  });
  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(currentFiles.length / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentView();
    }
  });

  function renderCurrentView() {
    if (currentView === "grid") {
      fileGrid.classList.remove("d-none");
      fileList.classList.add("d-none");
      renderFileGrid(currentFiles);
    } else {
      fileGrid.classList.add("d-none");
      fileList.classList.remove("d-none");
      renderFileList(currentFiles);
    }
    updateBatchActions();
  }

  // Alternar vista grid/lista
  toggleViewBtn.addEventListener("click", () => {
    currentView = currentView === "grid" ? "list" : "grid";
    toggleViewBtn.querySelector("i").className = currentView === "grid" ? "fas fa-th" : "fas fa-list";
    renderCurrentView();
  });

  // --- SELECCIÓN MÚLTIPLE Y ACCIONES EN LOTE ---
  function handleSelectFile(e, fileName) {
    if (e.target.checked) {
      selectedFiles.add(fileName);
    } else {
      selectedFiles.delete(fileName);
    }
    updateBatchActions();
  }

  function updateBatchActions() {
    if (selectedFiles.size > 0) {
      batchActions.classList.remove("d-none");
      selectedCount.textContent = `${selectedFiles.size} ${translations[currentLanguage].selectedCount}`;
    } else {
      batchActions.classList.add("d-none");
      selectedCount.textContent = "";
    }
    // Actualizar checkboxes
    document.querySelectorAll(".file-checkbox").forEach((cb) => {
      cb.checked = selectedFiles.has(cb.dataset.filename);
    });
    // Actualizar select-all
    if (selectAllFiles) {
      const visibleCheckboxes = Array.from(document.querySelectorAll("#file-list .file-checkbox"));
      selectAllFiles.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every((cb) => cb.checked);
    }
  }

  if (selectAllFiles) {
    selectAllFiles.addEventListener("change", (e) => {
      const check = e.target.checked;
      document.querySelectorAll("#file-list .file-checkbox").forEach((cb) => {
        cb.checked = check;
        if (check) selectedFiles.add(cb.dataset.filename);
        else selectedFiles.delete(cb.dataset.filename);
      });
      updateBatchActions();
    });
  }

  batchDeleteBtn.addEventListener("click", async () => {
    if (!selectedFiles.size) return;
    if (!confirm(translations[currentLanguage].deleteConfirm)) return;
    globalProgressContainer.style.display = "block";
    let done = 0;
    for (const fileName of Array.from(selectedFiles)) {
      await handleDelete(fileName);
      done++;
      globalProgressBar.style.width = `${(done / selectedFiles.size) * 100}%`;
    }
    globalProgressContainer.style.display = "none";
    globalProgressBar.style.width = "0%";
    selectedFiles.clear();
    updateBatchActions();
    await fetchAndRenderFiles();
  });

  batchDownloadBtn.addEventListener("click", async () => {
    if (!selectedFiles.size) return;
    globalProgressContainer.style.display = "block";
    let done = 0;
    for (const fileName of Array.from(selectedFiles)) {
      const file = currentFiles.find((f) => f.fileName === fileName);
      if (file) {
        const a = document.createElement("a");
        a.href = `/dashboard/utils/cdn/${USER_ID}/${file.fileName}`;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      done++;
      globalProgressBar.style.width = `${(done / selectedFiles.size) * 100}%`;
    }
    globalProgressContainer.style.display = "none";
    globalProgressBar.style.width = "0%";
  });

  // --- DRAG & DROP PARA SUBIDA ---
  function handleDroppedFiles(files) {
    if (!files.length) return;
    // Solo subir el primer archivo (puedes adaptar para múltiples)
    fileInput.files = files;
    if (fileNameDisplay) fileNameDisplay.textContent = files[0].name;
    uploadModal.show();
  }

  // --- VALIDACIÓN AVANZADA DE ARCHIVOS ---
  function validateFile(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      "image/",
      "video/",
      "audio/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "application/zip",
      "application/x-7z-compressed",
      "application/x-rar-compressed",
    ];
    if (file.size > maxSize) {
      showToast("Error", "El archivo excede el tamaño máximo permitido (100MB).", "danger");
      return false;
    }
    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      showToast("Error", "Tipo de archivo no permitido.", "danger");
      return false;
    }
    return true;
  }

  // --- MEJOR PREVISUALIZACIÓN ---
  const handlePreview = (file) => {
    const previewContent = document.getElementById("file-preview-content");
    if (file.mimeType.startsWith("image/")) {
      previewContent.innerHTML = `
        <img src="/dashboard/utils/cdn/view/${USER_ID}/${file.fileName}" class="img-fluid" style="max-height: 70vh; max-width: 100%; object-fit: contain;">
      `;
    } else if (file.mimeType.startsWith("video/")) {
      previewContent.innerHTML = `
        <video controls style="max-height: 70vh; max-width: 100%;">
          <source src="/dashboard/utils/cdn/view/${USER_ID}/${file.fileName}" type="${file.mimeType}">
          Your browser does not support the video tag.
        </video>
      `;
    } else if (file.mimeType.startsWith("audio/")) {
      previewContent.innerHTML = `
        <div class="text-center">
          <i class="${getFileIcon(file.mimeType)} fa-5x mb-4"></i>
          <audio controls style="width: 100%;">
            <source src="/dashboard/utils/cdn/view/${USER_ID}/${file.fileName}" type="${file.mimeType}">
            Your browser does not support the audio element.
          </audio>
          <h4 class="mt-3">${file.title}</h4>
        </div>
      `;
    } else if (file.mimeType === "application/pdf") {
      previewContent.innerHTML = `
        <iframe src="/dashboard/utils/cdn/view/${USER_ID}/${file.fileName}" style="width: 100%; height: 70vh;" frameborder="0"></iframe>
      `;
    } else if (file.mimeType.startsWith("text/")) {
      fetch(`/dashboard/utils/cdn/view/${USER_ID}/${file.fileName}`)
        .then((res) => res.text())
        .then((text) => {
          previewContent.innerHTML = `<pre style="max-height:70vh;overflow:auto;">${text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c])}</pre>`;
        });
    } else {
      previewContent.innerHTML = `
        <div class="text-center">
          <i class="${getFileIcon(file.mimeType)} fa-5x mb-3"></i>
          <h4>${file.title}</h4>
          <p>${file.description || ""}</p>
          <p class="text-muted">${formatSize(file.size)} | ${getFileTypeName(file.mimeType)}</p>
          <a href="/dashboard/utils/cdn/view/${USER_ID}/${file.fileName}" class="btn btn-primary" download>
            <i class="fas fa-download me-2"></i> ${translations[currentLanguage].downloadBtn}
          </a>
        </div>
      `;
    }
    filePreviewModal.show();
  };

  // --- VALIDACIÓN EN SUBIDA ---
  const handleUpload = async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("submit-upload-btn");
    const spinner = submitBtn.querySelector(".spinner-border");

    const title = document.getElementById("fileTitle").value;
    const description = document.getElementById("fileDescription").value;
    const file = fileInput.files[0];

    if (!title || !file) {
      showToast("Error", "Title and file are required.", "danger");
      return;
    }
    if (!validateFile(file)) return;

    submitBtn.disabled = true;
    spinner.classList.remove("d-none");
    uploadProgress.style.display = "block";
    globalProgressContainer.style.display = "block";

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", USER_ID);
      formData.append("title", title);
      formData.append("description", description);

      const result = await api.uploadFile(formData, (progress) => {
        uploadProgressBar.style.width = `${progress}%`;
        globalProgressBar.style.width = `${progress}%`;
      });

      if (result.success) {
        // Avatar pulse animación al subir archivo
        if (userAvatar) {
          userAvatar.classList.remove("pulse");
          void userAvatar.offsetWidth; // trigger reflow
          userAvatar.classList.add("pulse");
        }
        showToast(translations[currentLanguage].uploadSuccess, translations[currentLanguage].uploadSuccess, "success");
        uploadModal.hide();
        sessionStorage.removeItem(`files-${USER_ID}`);
        await fetchAndRenderFiles();
      } else {
        showToast(
          translations[currentLanguage].errorUpload,
          result.message || translations[currentLanguage].errorUpload,
          "danger",
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast(
        translations[currentLanguage].errorUpload,
        error.message || translations[currentLanguage].errorUpload,
        "danger",
      );
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add("d-none");
      uploadProgress.style.display = "none";
      uploadProgressBar.style.width = "0%";
      globalProgressContainer.style.display = "none";
      globalProgressBar.style.width = "0%";
      uploadForm.reset();
      fileNameDisplay.textContent = "";
    }
  };

  // --- FUNCIÓN PARA COMPARTIR ARCHIVO ---
  function handleShare(file) {
    const shareUrl = `${window.location.origin}/dashboard/cdn/share?title=${encodeURIComponent(file.title)}&url=${encodeURIComponent(file.downloadUrl)}&mime=${encodeURIComponent(file.mimeType)}&size=${file.size}&date=${encodeURIComponent(file.uploadedAt)}`;

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        showToast(translations[currentLanguage].copiedSuccess, translations[currentLanguage].copiedSuccess, "success");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        showToast("Error", "Could not copy link to clipboard", "danger");
      });
  }

  // --- FILTRO Y BÚSQUEDA ---
  function filterFiles() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector(".filter-btn.active").dataset.filter;
    const filtered = currentFiles.filter((file) => {
      const title = (file.title || "").toLowerCase();
      const description = (file.description || "").toLowerCase();
      const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
      const matchesFilter = activeFilter === "all" || getFileType(file.mimeType) === activeFilter;
      return matchesSearch && matchesFilter;
    });
    currentPage = 1;
    if (currentView === "grid") renderFileGrid(filtered);
    else renderFileList(filtered);
  }

  // --- FETCH Y RENDER PRINCIPAL ---
  async function fetchAndRenderFiles() {
    loadingSpinner.classList.remove("d-none");
    fileGrid.innerHTML = "";
    fileListBody.innerHTML = "";
    noFilesMessage.classList.add("d-none");
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result = await api.getFiles(USER_ID);
      if (result.success) {
        currentFiles = result.data;
        currentPage = 1;
        renderCurrentView();
        setTimeout(() => {
          loadingSpinner.classList.add("d-none");
        }, 100);
      } else {
        showToast("Error", translations[currentLanguage].errorFetch, "danger");
        loadingSpinner.classList.add("d-none");
        noFilesMessage.classList.remove("d-none");
      }
    } catch (error) {
      console.error("Error loading files:", error);
      loadingSpinner.classList.add("d-none");
      noFilesMessage.classList.remove("d-none");
      showToast("Error", translations[currentLanguage].errorFetch, "danger");
    }
  }

  // --- NOTIFICACIONES PUSH (PLACEHOLDER) ---
  function setupPushNotifications() {
    if (!("Notification" in window)) return;
    // Placeholder: aquí iría la lógica real con backend/service worker
    // Notification.requestPermission().then(permission => { ... });
  }
  setupPushNotifications();

  // --- MANEJADORES DE EVENTOS ---

  if (themeSwitch) {
    themeSwitch.addEventListener("change", () => {
      const theme = themeSwitch.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", theme);
      localStorage.setItem("theme", theme);
      if (themeIcon) themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    });
  }

  if (langLinks && langLinks.length) {
    langLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        currentLanguage = link.dataset.lang;
        localStorage.setItem("language", currentLanguage);
        updateTranslations();
        langLinks.forEach((l) => l.classList.toggle("active", l === link));
      });
    });
  }

  if (dropZone) {
    dropZone.addEventListener("click", () => fileInput && fileInput.click());
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length && fileInput) {
        if (!validateFile(e.dataTransfer.files[0])) return;
        fileInput.files = e.dataTransfer.files;
        if (fileNameDisplay) fileNameDisplay.textContent = fileInput.files[0].name;
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length && fileNameDisplay) {
        fileNameDisplay.textContent = fileInput.files[0].name;
      }
    });
  }

  if (uploadForm) uploadForm.addEventListener("submit", handleUpload);
  if (searchInput) searchInput.addEventListener("input", filterFiles);

  if (filterButtons && filterButtons.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        filterFiles();
      });
    });
  }

  if (refreshBtn) refreshBtn.addEventListener("click", fetchAndRenderFiles);

  // --- INICIALIZACIÓN ---
  const init = () => {
    const isSharedView =
      window.location.pathname.includes("/cdn/share") || window.location.search.includes("share?title=");

    if (isSharedView) {
      if (mainView) mainView.style.display = "none";
      if (sharedFileView) sharedFileView.style.display = "block";

      // Asegurar que los parámetros existen antes de renderizar
      const params = new URLSearchParams(window.location.search);
      if (params.has("title") && params.has("url")) {
        renderSharedFileView(params);
        document.title = translations[currentLanguage].fileSharedTitle;
      } else {
        // Redirigir si faltan parámetros esenciales
        window.location.href = "/dashboard/cdn";
      }
    } else {
      if (mainView) mainView.style.display = "block";
      if (sharedFileView) sharedFileView.style.display = "none";
      setTimeout(fetchAndRenderFiles, 100);
    }

    // Set theme from localStorage or preference
    const savedTheme = localStorage.getItem("theme") || "dark"; // Forzar dark por defecto
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    themeSwitch.checked = savedTheme === "dark";
    themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    // Set language from localStorage or browser
    const savedLanguage = localStorage.getItem("language") || (navigator.language.startsWith("es") ? "es" : "en");
    currentLanguage = savedLanguage;
    document.querySelector(`.lang-link[data-lang="${savedLanguage}"]`).classList.add("active");
    updateTranslations();
  };

  setTimeout(init, 50);
});
