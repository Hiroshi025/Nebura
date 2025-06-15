document.addEventListener("DOMContentLoaded", function () {
  // Obtener parámetros de la URL
  const params = new URLSearchParams(window.location.search);

  // Elementos del DOM
  const fileContent = document.getElementById("file-content");
  const fileTitle = document.getElementById("file-title");
  const fileSize = document.getElementById("file-size");
  const fileType = document.getElementById("file-type");
  const fileDate = document.getElementById("file-date");
  const downloadBtn = document.getElementById("download-btn");
  const copyLinkBtn = document.getElementById("copy-link-btn");
  const shareBtn = document.getElementById("share-btn");
  const viewOriginalBtn = document.getElementById("view-original-btn");

  // Mostrar notificación mejorada
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `position-fixed bottom-0 end-0 p-3 toast-${type} animate__animated animate__fadeInUp`;
    toast.style.zIndex = "11";
    toast.innerHTML = `
          <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-body d-flex align-items-center">
              <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} me-2"></i>
              <span>${message}</span>
            </div>
          </div>
        `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("animate__fadeOut");
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // Formatear tamaño
  function formatSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Formatear fecha
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Determinar tipo de archivo
  function getFileType(mimeType) {
    if (!mimeType) return "Archivo";

    const typeMap = {
      "image/": "Imagen",
      "video/": "Video",
      "audio/": "Audio",
      "application/pdf": "PDF",
      "text/": "Documento de texto",
      "application/msword": "Documento Word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Documento Word",
      "application/vnd.ms-excel": "Documento Excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Documento Excel",
      "application/vnd.ms-powerpoint": "Presentación",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "Presentación",
      "application/zip": "Archivo ZIP",
      "application/x-rar-compressed": "Archivo RAR",
      "application/json": "Archivo JSON",
    };

    for (const [prefix, typeName] of Object.entries(typeMap)) {
      if (mimeType.startsWith(prefix)) {
        return typeName;
      }
    }

    return mimeType.split("/")[1] ? mimeType.split("/")[1].toUpperCase() : "Archivo";
  }

  // Obtener icono para el tipo de archivo
  function getFileIcon(mimeType) {
    const iconMap = {
      "image/": "fa-file-image",
      "video/": "fa-file-video",
      "audio/": "fa-file-audio",
      "application/pdf": "fa-file-pdf",
      "text/": "fa-file-lines",
      "application/msword": "fa-file-word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "fa-file-word",
      "application/vnd.ms-excel": "fa-file-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "fa-file-excel",
      "application/vnd.ms-powerpoint": "fa-file-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "fa-file-powerpoint",
      "application/zip": "fa-file-zipper",
      "application/x-rar-compressed": "fa-file-zipper",
      "application/json": "fa-file-code",
    };

    for (const [prefix, icon] of Object.entries(iconMap)) {
      if (mimeType.startsWith(prefix)) {
        return icon;
      }
    }

    return "fa-file";
  }

  // Renderizar vista previa del archivo
  function renderFilePreview(url, mimeType) {
    if (mimeType.startsWith("image/")) {
      fileContent.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
              <img src="${url}" alt="Vista previa" class="file-preview img-fluid" 
                   onerror="this.onerror=null;this.src='https://placehold.co/600x400/1e1e2d/6a5af9?text=Imagen+no+disponible'">
            </div>
          `;
    } else if (mimeType.startsWith("video/")) {
      fileContent.innerHTML = `
            <div class="video-container w-100 h-100 d-flex justify-content-center align-items-center">
              <video controls class="file-preview" style="max-height: 70vh;">
                <source src="${url}" type="${mimeType}">
                Tu navegador no soporta la reproducción de video.
              </video>
            </div>
          `;
    } else if (mimeType.startsWith("audio/")) {
      fileContent.innerHTML = `
            <div class="text-center py-4">
              <i class="fas ${getFileIcon(mimeType)} file-icon mb-3"></i>
              <audio controls style="width: 100%; max-width: 500px;">
                <source src="${url}" type="${mimeType}">
                Tu navegador no soporta la reproducción de audio.
              </audio>
            </div>
          `;
    } else if (mimeType === "application/pdf") {
      fileContent.innerHTML = `
            <div class="text-center py-4">
              <i class="fas ${getFileIcon(mimeType)} file-icon mb-3"></i>
              <p class="mb-4">Este archivo PDF no puede mostrarse en vista previa.</p>
              <a href="${url}" target="_blank" class="btn btn-primary">
                <i class="fas fa-external-link-alt me-2"></i> Abrir en nueva pestaña
              </a>
            </div>
          `;
    } else if (mimeType.startsWith("text/")) {
      // Intentar mostrar contenido de texto
      fetch(url)
        .then((response) => response.text())
        .then((text) => {
          // Limitar a las primeras 1000 líneas para no saturar
          const lines = text.split("\n").slice(0, 1000).join("\n");
          fileContent.innerHTML = `
                <div class="text-left p-3" style="max-height: 500px; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 0.5rem;">
                  <pre style="color: var(--text-color); white-space: pre-wrap; word-break: break-word;">${lines}</pre>
                </div>
              `;
        })
        .catch(() => {
          fileContent.innerHTML = `
                <div class="text-center py-4">
                  <i class="fas ${getFileIcon(mimeType)} file-icon mb-3"></i>
                  <p>Contenido de texto no disponible para vista previa</p>
                </div>
              `;
        });
    } else {
      fileContent.innerHTML = `
            <div class="text-center py-4">
              <i class="fas ${getFileIcon(mimeType)} file-icon mb-3"></i>
              <p>Vista previa no disponible para este tipo de archivo</p>
            </div>
          `;
    }
  }

  // Animación de aparición gradual
  function fadeInElements() {
    const elements = [downloadBtn, copyLinkBtn, shareBtn, viewOriginalBtn];
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = "1";
        el.classList.add("animate__animated", "animate__fadeIn");
      }, index * 100);
    });
  }

  // Cargar datos del archivo desde los parámetros de la URL
  function loadFileData() {
    if (!params.has("title") || !params.has("url")) {
      fileContent.innerHTML = `
            <div class="alert alert-danger text-center animate__animated animate__fadeIn">
              <h4><i class="fas fa-exclamation-triangle me-2"></i> Error al cargar el archivo</h4>
              <p>El enlace compartido es inválido o está incompleto.</p>
              <a href="/" class="btn btn-outline-primary mt-2">
                <i class="fas fa-home me-2"></i> Volver al inicio
              </a>
            </div>
          `;
      return;
    }

    const title = decodeURIComponent(params.get("title"));
    const url = decodeURIComponent(params.get("url"));
    const mimeType = params.has("mime")
      ? decodeURIComponent(params.get("mime"))
      : "application/octet-stream";
    const size = params.has("size") ? parseInt(params.get("size")) : 0;
    const date = params.has("date")
      ? decodeURIComponent(params.get("date"))
      : new Date().toISOString();

    // Actualizar la interfaz con los datos del archivo
    fileTitle.textContent = title;
    fileTitle.classList.remove("skeleton");

    fileSize.textContent = formatSize(size);
    fileSize.classList.remove("skeleton");

    fileType.textContent = getFileType(mimeType);
    fileType.classList.remove("skeleton");

    fileDate.textContent = formatDate(date);
    fileDate.classList.remove("skeleton");

    // Configurar botón de descarga
    downloadBtn.href = url;
    downloadBtn.download = title;

    // Renderizar vista previa
    renderFilePreview(url, mimeType);

    // Configurar botones de herramientas
    copyLinkBtn.addEventListener("click", () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast("Enlace copiado al portapapeles", "success"))
        .catch(() => showToast("Error al copiar el enlace", "error"));
    });

    shareBtn.addEventListener("click", () => {
      if (navigator.share) {
        navigator
          .share({
            title: `${title} - Nebura CDN`,
            text: "Mira este archivo compartido en Nebura CDN",
            url: window.location.href,
          })
          .catch(() => showToast("Compartir cancelado", "error"));
      } else {
        navigator.clipboard
          .writeText(window.location.href)
          .then(() => showToast("Enlace copiado al portapapeles", "success"))
          .catch(() => showToast("Error al copiar el enlace", "error"));
      }
    });

    viewOriginalBtn.addEventListener("click", () => {
      window.open(url, "_blank");
    });

    // Animar elementos
    fadeInElements();
  }

  // Inicializar
  loadFileData();

  // Animación de partículas
  const particlesContainer = document.body;
  const particleCount = 10;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    // Tamaño aleatorio entre 2px y 8px
    const size = Math.random() * 6 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Posición aleatoria
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;

    // Opacidad aleatoria
    particle.style.opacity = Math.random() * 0.4 + 0.1;

    // Añadir al contenedor
    particlesContainer.appendChild(particle);

    // Animación flotante
    animateParticle(particle);
  }

  function animateParticle(particle) {
    let x = parseFloat(particle.style.left);
    let y = parseFloat(particle.style.top);
    let xSpeed = (Math.random() - 0.5) * 0.02;
    let ySpeed = (Math.random() - 0.5) * 0.02;

    function move() {
      x += xSpeed;
      y += ySpeed;

      // Rebotar en los bordes
      if (x < 0 || x > 100) xSpeed *= -1;
      if (y < 0 || y > 100) ySpeed *= -1;

      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;

      requestAnimationFrame(move);
    }

    move();
  }
});
