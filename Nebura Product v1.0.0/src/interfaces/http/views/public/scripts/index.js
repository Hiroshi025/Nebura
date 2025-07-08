/**
 * Script para las funcionalidades de insertar código y subir archivos en el panel de admin
 */

document.addEventListener("DOMContentLoaded", function () {
  // -------------------- INSERTAR CÓDIGO --------------------

  // Selector del botón de insertar código en el modal de ticket admin
  const adminInsertCodeBtn = document.querySelector(
    '.ticket-chat-tools .btn-outline-secondary[title="Insertar código"]',
  );

  if (adminInsertCodeBtn) {
    adminInsertCodeBtn.addEventListener("click", function () {
      showAdminCodeInsertModal();
    });
  }

  // Función para mostrar el modal de inserción de código en admin
  function showAdminCodeInsertModal() {
    // Crear el modal dinámicamente
    const modalHTML = `
            <div class="modal fade" id="adminCodeInsertModal" tabindex="-1" aria-labelledby="adminCodeInsertModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="adminCodeInsertModalLabel">
                                <i class="fas fa-code me-2"></i>Insertar Código
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="admin-code-language" class="form-label">Lenguaje</label>
                                <select class="form-select" id="admin-code-language">
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
                                <label for="admin-code-content" class="form-label">Código</label>
                                <textarea class="form-control font-monospace" id="admin-code-content" rows="10" style="font-family: 'Courier New', monospace;"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="admin-insert-code-btn">Insertar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Añadir el modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Mostrar el modal
    const codeModal = new bootstrap.Modal(document.getElementById("adminCodeInsertModal"));
    codeModal.show();

    // Configurar el evento para el botón de insertar
    document.getElementById("admin-insert-code-btn").addEventListener("click", function () {
      insertAdminCodeToChat();
      codeModal.hide();
    });

    // Eliminar el modal del DOM cuando se cierre
    document
      .getElementById("adminCodeInsertModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  // Función para insertar el código formateado en el área de chat admin
  function insertAdminCodeToChat() {
    const language = document.getElementById("admin-code-language").value;
    const codeContent = document.getElementById("admin-code-content").value;
    const chatInput = document.getElementById("admin-ticket-chat-input");

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

  // -------------------- SUBIR ARCHIVOS --------------------

  // Selector del botón de adjuntar archivo en el modal de ticket admin
  const adminAttachFileBtn = document.querySelector(
    '.ticket-chat-tools .btn-outline-secondary[title="Adjuntar archivo"]',
  );

  if (adminAttachFileBtn) {
    adminAttachFileBtn.addEventListener("click", function () {
      // Crear input de archivo dinámicamente
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.accept = ".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar";
      fileInput.style.display = "none";

      // Configurar el evento change
      fileInput.addEventListener("change", function (e) {
        if (e.target.files.length > 0) {
          uploadAdminFiles(e.target.files);
        }
      });

      // Añadir al DOM y hacer click
      document.body.appendChild(fileInput);
      fileInput.click();

      // Eliminar después de usar
      setTimeout(() => {
        document.body.removeChild(fileInput);
      }, 100);
    });
  }

  // Función para subir archivos en el panel admin
  async function uploadAdminFiles(files) {
    if (!files || files.length === 0) return;

    // Verificar límite de archivos (5 máximo)
    if (files.length > 5) {
      showNotification("Máximo 5 archivos permitidos", "warning");
      return;
    }

    // Verificar tamaño de archivos (10MB máximo cada uno)
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) {
        showNotification(`El archivo ${files[i].name} supera el límite de 10MB`, "warning");
        return;
      }
    }

    try {
      // Mostrar carga
      showNotification("Subiendo archivos...", "info");

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]); // Cambia 'files' por 'file'
      }
      formData.append("userId", window.user.id); // O el userId del admin
      formData.append("title", files[0].name); // O el título que desees

      // Añadir ticketId si está disponible
      if (currentAdminTicketId) {
        formData.append("ticketId", currentAdminTicketId);
      }

      const response = await fetch("/dashboard/utils/cdn", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error al subir archivos");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");

      // Mostrar éxito
      showNotification("Archivos subidos correctamente", "success");

      // Si estamos en un ticket, insertar enlaces en el chat
      if (currentAdminTicketId && data.data && data.data.length > 0) {
        const chatInput = document.getElementById("admin-ticket-chat-input");
        const fileLinks = data.data.map((file) => `[${file.originalName}](${file.url})`).join("\n");

        if (chatInput) {
          const currentValue = chatInput.value;
          chatInput.value = currentValue ? `${currentValue}\n${fileLinks}` : fileLinks;
          chatInput.focus();
          autoResizeTextarea(chatInput);
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      showNotification(`Error al subir archivos: ${error.message}`, "error");
    }
  }

  // -------------------- FUNCIONES UTILITARIAS --------------------

  // Función para autoajustar la altura del textarea
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  // Función para mostrar notificaciones
  function showNotification(message, type = "info") {
    const toast = document.getElementById("notificationToast");
    if (!toast) return;

    const toastBody = toast.querySelector(".toast-body");
    const toastTitle = toast.querySelector(".toast-header strong");

    // Configurar colores según el tipo
    let bgClass = "bg-primary";
    if (type === "error") bgClass = "bg-danger";
    else if (type === "success") bgClass = "bg-success";
    else if (type === "warning") bgClass = "bg-warning";

    toast.querySelector(".toast-header").className = `toast-header ${bgClass} text-white`;

    // Configurar contenido
    toastTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    toastBody.textContent = message;

    // Mostrar toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  }

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
});
