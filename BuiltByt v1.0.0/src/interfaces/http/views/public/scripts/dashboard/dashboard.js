document.addEventListener("DOMContentLoaded", function () {
  // ...existing code...
  const tableBody = document.querySelector("#userLicensesTable tbody");
  const emptyMsg = document.getElementById("userLicensesEmpty");
  const refreshBtn = document.getElementById("refreshUserLicensesBtn");
  const searchInput = document.getElementById("licenseSearch");
  const typeFilter = document.getElementById("licenseTypeFilter");
  const statusFilter = document.getElementById("licenseStatusFilter");
  const pagination = document.getElementById("licensesPagination");
  const exportBtn = document.getElementById("exportLicensesBtn");
  const activeLicCount = document.getElementById("activeLicCount");
  const expiredLicCount = document.getElementById("expiredLicCount");
  let allLicenses = [];
  let filteredLicenses = [];
  let currentPage = 1;
  const licensesPerPage = 10;
  let currentSort = { key: null, dir: 1 };

  function applyFiltersAndRender() {
    let list = [...allLicenses];
    // Filtro búsqueda
    const q = (searchInput.value || "").toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          (l.key || l.id || "").toLowerCase().includes(q) ||
          (l.type || "").toLowerCase().includes(q) ||
          getEstado(l).toLowerCase().includes(q),
      );
    }
    // Filtro tipo
    if (typeFilter.value) list = list.filter((l) => l.type === typeFilter.value);
    // Filtro estado
    if (statusFilter.value) list = list.filter((l) => getEstado(l) === statusFilter.value);
    // Ordenamiento
    if (currentSort.key) {
      list.sort((a, b) => {
        let va = a[currentSort.key] || "";
        let vb = b[currentSort.key] || "";
        if (currentSort.key === "validUntil") {
          va = va ? new Date(va) : new Date(0);
          vb = vb ? new Date(vb) : new Date(0);
        } else if (currentSort.key === "estado") {
          va = getEstado(a);
          vb = getEstado(b);
        }
        if (va < vb) return -1 * currentSort.dir;
        if (va > vb) return 1 * currentSort.dir;
        return 0;
      });
    }
    filteredLicenses = list;
    currentPage = 1;
    renderLicensesTable(filteredLicenses);
    renderPagination(filteredLicenses.length);
    updateCounters(filteredLicenses);
  }

  function getEstado(lic) {
    return lic.validUntil && new Date(lic.validUntil) > new Date() ? "ACTIVA" : "EXPIRADA";
  }

  function renderLicensesTable(licenses) {
    tableBody.innerHTML = "";
    if (!licenses || licenses.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";
    // Paginación
    const start = (currentPage - 1) * licensesPerPage;
    const pageLicenses = licenses.slice(start, start + licensesPerPage);
    pageLicenses.forEach((lic, idx) => {
      const estado = getEstado(lic);
      const estadoIcon =
        estado === "ACTIVA"
          ? '<i class="fa fa-check-circle text-success" title="Activa"></i>'
          : '<i class="fa fa-times-circle text-danger" title="Expirada"></i>';
      tableBody.innerHTML += `
                  <tr>
                    <td>
                      <span class="badge bg-primary" style="font-size:0.95em;cursor:pointer;" data-bs-toggle="tooltip" title="Click para ver detalles" onclick="showLicenseDetail('${lic.key || lic.id || "-"}')">
                        ${lic.key || lic.id || "-"}
                      </span>
                    </td>
                    <td>${lic.type || "-"}</td>
                    <td>
                      <span class="badge badge-status ${estado} ${estado === "ACTIVA" ? "bg-success" : "bg-danger"}" style="cursor:pointer;" data-bs-toggle="tooltip" title="${estado === "ACTIVA" ? "Licencia activa y válida" : "Licencia expirada"}">
                        ${estadoIcon} ${estado}
                      </span>
                    </td>
                    <td>
                      <span data-bs-toggle="tooltip" title="${lic.validUntil ? new Date(lic.validUntil).toLocaleString() : "-"}">
                        ${lic.validUntil ? new Date(lic.validUntil).toLocaleDateString() : "-"}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-secondary" title="Copiar clave" onclick="navigator.clipboard.writeText('${lic.key || lic.id || "-"}')"><i class="fa fa-copy"></i></button>
                      <button class="btn btn-sm btn-outline-info ms-1" title="Ver detalles" onclick="showLicenseDetail('${lic.key || lic.id || "-"}')"><i class="fa fa-eye"></i></button>
                    </td>
                  </tr>
                `;
    });
    // Inicializar tooltips
    setTimeout(() => {
      var tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]'),
      );
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }, 100);
  }

  function renderPagination(total) {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(total / licensesPerPage);
    if (totalPages <= 1) return;
    // Prev
    pagination.innerHTML += `<li class="page-item${currentPage === 1 ? " disabled" : ""}">
                <a class="page-link" href="#" tabindex="-1" aria-disabled="true">&laquo;</a>
              </li>`;
    // Pages
    for (let i = 1; i <= totalPages; i++) {
      pagination.innerHTML += `<li class="page-item${i === currentPage ? " active" : ""}">
                  <a class="page-link" href="#">${i}</a>
                </li>`;
    }
    // Next
    pagination.innerHTML += `<li class="page-item${currentPage === totalPages ? " disabled" : ""}">
                <a class="page-link" href="#">&raquo;</a>
              </li>`;
    // Eventos
    Array.from(pagination.querySelectorAll(".page-link")).forEach((el, idx) => {
      el.onclick = (e) => {
        e.preventDefault();
        if (el.innerHTML.includes("&laquo;") && currentPage > 1) {
          currentPage--;
        } else if (el.innerHTML.includes("&raquo;") && currentPage < totalPages) {
          currentPage++;
        } else if (!el.innerHTML.includes("&laquo;") && !el.innerHTML.includes("&raquo;")) {
          currentPage = Number(el.textContent);
        }
        renderLicensesTable(filteredLicenses);
        renderPagination(filteredLicenses.length);
      };
    });
  }

  function updateTypeFilterOptions(licenses) {
    const types = Array.from(new Set(licenses.map((l) => l.type).filter(Boolean)));
    typeFilter.innerHTML =
      '<option value="">Todos los tipos</option>' +
      types.map((t) => `<option value="${t}">${t}</option>`).join("");
  }

  function updateCounters(licenses) {
    const act = licenses.filter((l) => getEstado(l) === "ACTIVA").length;
    const exp = licenses.filter((l) => getEstado(l) === "EXPIRADA").length;
    activeLicCount.textContent = `${act} Activas`;
    expiredLicCount.textContent = `${exp} Expiradas`;
  }

  // Exportar a CSV
  function exportToCSV() {
    if (!filteredLicenses.length) return;
    const header = ["Clave", "Tipo", "Estado", "Válida hasta"];
    const rows = filteredLicenses.map((l) => [
      `"${l.key || l.id || "-"}"`,
      `"${l.type || "-"}"`,
      `"${getEstado(l)}"`,
      `"${l.validUntil ? new Date(l.validUntil).toLocaleDateString() : "-"}"`,
    ]);
    let csv = header.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "licencias.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Modal detalles
  window.showLicenseDetail = function (key) {
    const lic = allLicenses.find((l) => (l.key || l.id) == key);
    if (!lic) return;
    const estado = getEstado(lic);
    document.getElementById("licenseDetailBody").innerHTML = `
                <ul class="list-group">
                  <li class="list-group-item"><b>Clave:</b> ${lic.key || lic.id || "-"}</li>
                  <li class="list-group-item"><b>Tipo:</b> ${lic.type || "-"}</li>
                  <li class="list-group-item"><b>Estado:</b> <span class="badge ${estado === "ACTIVA" ? "bg-success" : "bg-danger"}">${estado}</span></li>
                  <li class="list-group-item"><b>Válida hasta:</b> ${lic.validUntil ? new Date(lic.validUntil).toLocaleString() : "-"}</li>
                  <li class="list-group-item"><b>Detalles:</b> <pre style="white-space:pre-wrap;">${JSON.stringify(lic, null, 2)}</pre></li>
                </ul>
              `;
    new bootstrap.Modal(document.getElementById("licenseDetailModal")).show();
  };

  // Ordenamiento columnas
  document.querySelectorAll("#userLicensesTable th[data-sort]").forEach((th) => {
    th.onclick = function () {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.dir *= -1;
      } else {
        currentSort.key = key;
        currentSort.dir = 1;
      }
      applyFiltersAndRender();
    };
  });

  // Eventos filtros y búsqueda
  [searchInput, typeFilter, statusFilter].forEach((el) => {
    el && el.addEventListener("input", applyFiltersAndRender);
    el && el.addEventListener("change", applyFiltersAndRender);
  });

  if (exportBtn) exportBtn.onclick = exportToCSV;

  async function fetchUserLicenses() {
    tableBody.innerHTML =
      '<tr><td colspan="5"><div class="skeleton" style="height:24px;width:100%"></div></td></tr>';
    emptyMsg.style.display = "none";
    try {
      const res = await fetch(`/dashboard/utils/licenses/user/${userId}`);
      const data = await res.json();
      let licenses = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      allLicenses = licenses;
      updateTypeFilterOptions(licenses);
      applyFiltersAndRender();
    } catch (e) {
      console.error(e);
      tableBody.innerHTML =
        '<tr><td colspan="5" class="text-danger">Error al cargar licencias</td></tr>';
      emptyMsg.style.display = "none";
    }
  }

  fetchUserLicenses();
  if (refreshBtn) refreshBtn.onclick = fetchUserLicenses;
});
