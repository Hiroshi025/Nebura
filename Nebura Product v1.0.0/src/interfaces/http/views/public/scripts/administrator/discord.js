// Lógica para la SECCIÓN DE ACTUALIZACIÓN DEL CLIENTE DISCORD

document.addEventListener("DOMContentLoaded", function () {
  // Elementos del formulario
  const $form = document.getElementById("discordClientConfigForm");
  const $id = document.getElementById("discordUserId");
  const $username = document.getElementById("discordUsername");
  const $avatar = document.getElementById("discordAvatar");
  const $activityStatus = document.getElementById("discordActivityStatus");
  const $activityName = document.getElementById("discordActivityName");
  const $activityUrl = document.getElementById("discordActivityUrl");
  const $resetBtn = document.getElementById("resetDiscordClientConfigBtn");
  const $result = document.getElementById("discordClientConfigResult");

  // Vista previa
  const $previewAvatar = document.getElementById("discordPreviewAvatar");
  const $previewUsername = document.getElementById("discordPreviewUsername");
  const $previewActivity = document.getElementById("discordPreviewActivity");
  const $previewStatusBadge = document.getElementById("discordPreviewStatusBadge");

  // Estado actual
  let discordConfig = {
    id: "",
    username: "Nebura",
    avatar: "https://i.pinimg.com/736x/38/c2/83/38c283baebbc461a062a2992ae438fbe.jpg",
    activity: { status: "online", name: "Nebura AI Client", url: "" },
  };

  // Validaciones
  function isValidImageUrl(url) {
    return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(url);
  }
  function isValidActivity(status, name, url) {
    const validStatus = ["online", "idle", "dnd", "invisible"];
    if (!validStatus.includes(status)) return false;
    if (!name || typeof name !== "string" || name.length < 2) return false;
    if (url && status !== "online" && status !== "dnd") return false;
    if (url && !/^https?:\/\/.+/.test(url)) return false;
    return true;
  }

  // Actualiza la vista previa
  function updatePreview() {
    $previewAvatar.src = $avatar.value || discordConfig.avatar;
    $previewUsername.textContent = $username.value || discordConfig.username;
    $previewActivity.textContent = $activityName.value || discordConfig.activity.name;
    const status = $activityStatus.value || discordConfig.activity.status;
    $previewStatusBadge.textContent = status;
    $previewStatusBadge.className =
      "badge " +
      (status === "online"
        ? "bg-success"
        : status === "idle"
          ? "bg-warning text-dark"
          : status === "dnd"
            ? "bg-danger"
            : "bg-secondary");
  }

  // Carga la configuración actual (GET)
  function loadDiscordConfig() {
    // Solo permite ver (GET) por ID si existe, si no, deja el formulario vacío
    const id = $id.value.trim();
    if (id) {
      fetch(`/dashboard/utils-clients/discord/${id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            const d = res.data;
            discordConfig = {
              id: d.id,
              username: d.username,
              avatar: d.avatar,
              activity: d.activity || { status: "online", name: "Nebura AI Client", url: "" },
            };
            setForm(discordConfig);
            updatePreview();
          } else {
            $result.innerHTML =
              '<div class="alert alert-warning">No se encontró configuración para ese ID.</div>';
          }
        });
    } else {
      // Si no hay ID, limpia el formulario
      setForm(discordConfig);
      updatePreview();
    }
  }

  // Setea los valores en el formulario
  function setForm(cfg) {
    $id.value = cfg.id || "";
    $username.value = cfg.username || "";
    $avatar.value = cfg.avatar || "";
    $activityStatus.value = cfg.activity?.status || "online";
    $activityName.value = cfg.activity?.name || "";
    $activityUrl.value = cfg.activity?.url || "";
  }

  // Restablecer
  $resetBtn.addEventListener("click", function () {
    setForm(discordConfig);
    updatePreview();
    $result.innerHTML = "";
    $avatar.classList.remove("is-invalid");
    document.getElementById("avatarInvalidFeedback").style.display = "none";
  });

  // Actualiza la vista previa en tiempo real
  [$username, $avatar, $activityStatus, $activityName, $activityUrl].forEach((el) => {
    el.addEventListener("input", updatePreview);
  });

  // Guardar (solo PUT, no POST)
  $form.addEventListener("submit", function (e) {
    e.preventDefault();
    const id = $id.value.trim();
    const username = $username.value.trim();
    const avatar = $avatar.value.trim();
    const status = $activityStatus.value;
    const name = $activityName.value.trim();
    const url = $activityUrl.value.trim();

    // Validación de avatar
    if (!isValidImageUrl(avatar)) {
      $avatar.classList.add("is-invalid");
      document.getElementById("avatarInvalidFeedback").style.display = "block";
      return;
    } else {
      $avatar.classList.remove("is-invalid");
      document.getElementById("avatarInvalidFeedback").style.display = "none";
    }

    // Validación de activity
    if (!isValidActivity(status, name, url)) {
      $result.innerHTML =
        '<div class="alert alert-danger">Actividad inválida. El status debe ser válido, el nombre no vacío y la URL solo si el status es "online" o "dnd".</div>';
      return;
    }

    if (!id) {
      $result.innerHTML =
        '<div class="alert alert-warning">Debes ingresar un ID válido para editar.</div>';
      return;
    }

    const activity = { status, name, url };
    const body = { username, avatar, activity };

    fetch(`/dashboard/utils-clients/discord/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          discordConfig = { id, username, avatar, activity: { status, name, url } };
          setForm(discordConfig);
          updatePreview();
          $result.innerHTML =
            '<div class="alert alert-success">Configuración actualizada correctamente.</div>';
        } else {
          $result.innerHTML = `<div class="alert alert-danger">${res.message || "Error al guardar"}</div>`;
        }
      })
      .catch(() => {
        $result.innerHTML = '<div class="alert alert-danger">Error de red al guardar.</div>';
      });
  });

  // Eliminar (DELETE)
  // Puedes agregar un botón de eliminar y este handler:
  const $deleteBtn = document.getElementById("deleteDiscordClientConfigBtn");
  if ($deleteBtn) {
    $deleteBtn.addEventListener("click", function () {
      const id = $id.value.trim();
      if (!id) {
        $result.innerHTML =
          '<div class="alert alert-warning">Debes ingresar un ID válido para eliminar.</div>';
        return;
      }
      if (!confirm("¿Seguro que deseas eliminar esta configuración de Discord?")) return;
      fetch(`/dashboard/utils-clients/discord/${id}`, {
        method: "DELETE",
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            $result.innerHTML =
              '<div class="alert alert-success">Configuración eliminada correctamente.</div>';
            setForm({
              id: "",
              username: "Nebura",
              avatar: "https://i.pinimg.com/736x/38/c2/83/38c283baebbc461a062a2992ae438fbe.jpg",
              activity: { status: "online", name: "Nebura AI Client", url: "" },
            });
            updatePreview();
          } else {
            $result.innerHTML = `<div class="alert alert-danger">${res.message || "Error al eliminar"}</div>`;
          }
        })
        .catch(() => {
          $result.innerHTML = '<div class="alert alert-danger">Error de red al eliminar.</div>';
        });
    });
  }

  // Inicializar (solo ver si hay ID)
  loadDiscordConfig();
});
