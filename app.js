const storageKey = "pim-products";
const catalogKey = "pim-catalogs";

const form = document.getElementById("product-form");
const tableBody = document.getElementById("product-table");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("filter-status");
const availabilityFilter = document.getElementById("filter-availability");
const statsContainer = document.getElementById("stats");
const supplierList = document.getElementById("supplier-list");
const rowTemplate = document.getElementById("row-template");
const supplierTemplate = document.getElementById("supplier-template");
const catalogTemplate = document.getElementById("catalog-template");
const catalogResultTemplate = document.getElementById("catalog-result-template");
const seedButton = document.getElementById("seed-demo");
const clearButton = document.getElementById("clear-data");
const catalogForm = document.getElementById("catalog-form");
const catalogList = document.getElementById("catalog-list");
const catalogResults = document.getElementById("catalog-results");
const catalogEmpty = document.getElementById("catalog-empty");

const loadProducts = () => {
  const raw = window.localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
};

const saveProducts = (products) => {
  window.localStorage.setItem(storageKey, JSON.stringify(products));
};

const loadCatalogs = () => {
  const raw = window.localStorage.getItem(catalogKey);
  return raw ? JSON.parse(raw) : [];
};

const saveCatalogs = (catalogs) => {
  window.localStorage.setItem(catalogKey, JSON.stringify(catalogs));
};

const renderStats = (products) => {
  const total = products.length;
  const active = products.filter((item) => item.status === "Ativo").length;
  const suppliers = new Set(products.map((item) => item.supplier)).size;
  const catalogs = loadCatalogs().length;

  statsContainer.innerHTML = "";
  const stats = [
    { label: "Produtos", value: total },
    { label: "Ativos", value: active },
    { label: "Fornecedores", value: suppliers },
    { label: "Catálogos", value: catalogs },
  ];

  stats.forEach((stat) => {
    const div = document.createElement("div");
    div.className = "stat-card";
    div.textContent = `${stat.value} ${stat.label}`;
    statsContainer.appendChild(div);
  });
};

const renderSuppliers = (products) => {
  const grouped = products.reduce((acc, item) => {
    acc[item.supplier] ||= [];
    acc[item.supplier].push(item);
    return acc;
  }, {});

  supplierList.innerHTML = "";

  const suppliers = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  if (!suppliers.length) {
    supplierList.innerHTML = "<p class=\"empty-state\">Nenhum fornecedor cadastrado ainda.</p>";
    return;
  }

  suppliers.forEach((supplier) => {
    const fragment = supplierTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".supplier-card");
    const title = card.querySelector("h3");
    const badge = card.querySelector(".badge");
    const list = card.querySelector("ul");

    title.textContent = supplier;
    badge.textContent = `${grouped[supplier].length} itens`;

    grouped[supplier]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} • ${item.sku} • ${item.availability}`;
        list.appendChild(li);
      });

    supplierList.appendChild(fragment);
  });
};

const renderCatalogs = (catalogs) => {
  catalogList.innerHTML = "";

  if (!catalogs.length) {
    catalogList.innerHTML = "<p class=\"empty-state\">Nenhum catálogo importado.</p>";
    return;
  }

  catalogs.forEach((catalog) => {
    const fragment = catalogTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".catalog-card");
    const title = card.querySelector("h3");
    const meta = card.querySelector(".catalog-meta");
    const badge = card.querySelector(".badge");
    const link = card.querySelector(".catalog-link");
    const list = card.querySelector("ul");
    const removeButton = card.querySelector("[data-action=remove-catalog]");

    title.textContent = catalog.supplier;
    meta.textContent = `${catalog.sourceType} • ${catalog.fileName || "sem arquivo"} • ${catalog.createdAt}`;
    badge.textContent = `${catalog.items.length} itens`;
    if (catalog.sourceUrl) {
      link.innerHTML = `<a href="${catalog.sourceUrl}" target="_blank" rel="noreferrer">Abrir catálogo</a>`;
    } else {
      link.textContent = "Sem link informado";
      link.classList.add("empty-state");
    }

    catalog.items.slice(0, 5).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name}${item.sku ? ` • ${item.sku}` : ""}`;
      list.appendChild(li);
    });
    if (catalog.items.length > 5) {
      const li = document.createElement("li");
      li.textContent = `+${catalog.items.length - 5} itens`;
      list.appendChild(li);
    }

    removeButton.dataset.catalogId = catalog.id;
    catalogList.appendChild(fragment);
  });
};

const renderTable = (products) => {
  tableBody.innerHTML = "";

  products.forEach((item) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector(".cell-name").textContent = item.name;
    row.querySelector(".cell-sku").textContent = item.sku;
    row.querySelector(".cell-category").textContent = item.category;
    row.querySelector(".cell-supplier").textContent = item.supplier;
    row.querySelector(".cell-status").textContent = item.status;
    row.querySelector(".cell-availability").textContent = item.availability;
    row.querySelector("[data-action=remove]").dataset.sku = item.sku;

    tableBody.appendChild(row);
  });

  emptyState.style.display = products.length ? "none" : "block";
};

const renderCatalogResults = (catalogs, term) => {
  catalogResults.innerHTML = "";
  if (!term) {
    catalogEmpty.style.display = "block";
    return;
  }

  const normalizedTerm = term.toLowerCase();
  const matches = catalogs.flatMap((catalog) =>
    catalog.items
      .filter((item) => {
        const haystack = `${item.name} ${item.sku || ""}`.toLowerCase();
        return haystack.includes(normalizedTerm);
      })
      .map((item) => ({
        ...item,
        supplier: catalog.supplier,
        sourceType: catalog.sourceType,
      })),
  );

  matches.slice(0, 12).forEach((item) => {
    const fragment = catalogResultTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".catalog-result");
    const title = card.querySelector("h4");
    const meta = card.querySelector(".result-meta");
    const badge = card.querySelector(".badge");

    title.textContent = item.name;
    meta.textContent = `${item.supplier} • ${item.sku || "SKU não informado"} • ${item.sourceType}`;
    badge.textContent = "Catálogo";
    catalogResults.appendChild(fragment);
  });

  catalogEmpty.style.display = matches.length ? "none" : "block";
};

const filterProducts = (products) => {
  const term = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;
  const availability = availabilityFilter.value;

  return products.filter((item) => {
    const haystack = [item.name, item.sku, item.category, item.supplier]
      .join(" ")
      .toLowerCase();

    const matchesTerm = term ? haystack.includes(term) : true;
    const matchesStatus = status ? item.status === status : true;
    const matchesAvailability = availability
      ? item.availability === availability
      : true;

    return matchesTerm && matchesStatus && matchesAvailability;
  });
};

const render = () => {
  const products = loadProducts();
  const catalogs = loadCatalogs();
  const filtered = filterProducts(products);
  const searchTerm = searchInput.value.toLowerCase().trim();

  renderStats(products);
  renderTable(filtered);
  renderSuppliers(products);
  renderCatalogs(catalogs);
  renderCatalogResults(catalogs, searchTerm);
};

const handleSubmit = (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  const products = loadProducts();
  const existingIndex = products.findIndex((item) => item.sku === payload.sku);

  if (existingIndex >= 0) {
    products[existingIndex] = { ...products[existingIndex], ...payload };
  } else {
    products.push(payload);
  }

  saveProducts(products);
  form.reset();
  render();
};

const removeProduct = (sku) => {
  const products = loadProducts().filter((item) => item.sku !== sku);
  saveProducts(products);
  render();
};

const seedDemoData = () => {
  const demo = [
    {
      name: "Camiseta algodão",
      sku: "CAM-001",
      category: "Vestuário",
      supplier: "Fornecedor ABC",
      status: "Ativo",
      availability: "Pronta entrega",
      description: "Camiseta unissex 100% algodão",
    },
    {
      name: "Jaqueta corta-vento",
      sku: "JAC-045",
      category: "Vestuário",
      supplier: "Fornecedor Alfa",
      status: "Em análise",
      availability: "Sob encomenda",
      description: "Jaqueta resistente à água",
    },
    {
      name: "Tênis esportivo",
      sku: "TEN-300",
      category: "Calçados",
      supplier: "Esportes X",
      status: "Ativo",
      availability: "Pronta entrega",
      description: "Tênis leve para corrida",
    },
    {
      name: "Mochila executiva",
      sku: "MOC-120",
      category: "Acessórios",
      supplier: "Fornecedor ABC",
      status: "Descontinuado",
      availability: "Indisponível",
      description: "Mochila para notebook 15''",
    },
  ];
  saveProducts(demo);
  saveCatalogs([
    {
      id: crypto.randomUUID(),
      supplier: "Distribuidora Brasil",
      sourceType: "Planilha (CSV/TSV)",
      sourceUrl: "https://exemplo.com/catalogo-brasil",
      fileName: "catalogo-brasil.csv",
      createdAt: new Date().toLocaleDateString("pt-BR"),
      items: [
        { name: "Monitor 24 polegadas", sku: "MON-240" },
        { name: "Teclado sem fio", sku: "TEC-900" },
        { name: "Mouse ergonômico", sku: "MOU-110" },
      ],
    },
    {
      id: crypto.randomUUID(),
      supplier: "Importadora Global",
      sourceType: "PDF",
      sourceUrl: "",
      fileName: "oferta-2024.pdf",
      createdAt: new Date().toLocaleDateString("pt-BR"),
      items: [
        { name: "Luminária LED", sku: "LUM-321" },
        { name: "Câmera IP", sku: "CAM-771" },
      ],
    },
  ]);
  render();
};

const parseItemsFromText = (text) => {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[|;,\\t]/).map((part) => part.trim());
      return {
        name: parts[0] || line,
        sku: parts[1] || "",
      };
    })
    .filter((item) => item.name);
};

const parseFile = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve({ items: [], warning: "" });
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (["csv", "tsv", "txt"].includes(extension)) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result?.toString() || "";
        resolve({ items: parseItemsFromText(text), warning: "" });
      };
      reader.readAsText(file);
      return;
    }

    resolve({
      items: [],
      warning: "Arquivos PDF/XLSX precisam de lista manual no campo de itens.",
    });
  });

const handleCatalogSubmit = async (event) => {
  event.preventDefault();
  const data = new FormData(catalogForm);
  const payload = Object.fromEntries(data.entries());
  const file = data.get("file");
  const { items: fileItems } = await parseFile(file instanceof File ? file : null);
  const manualItems = parseItemsFromText(payload.items);
  const items = [...fileItems, ...manualItems];

  const catalogs = loadCatalogs();
  catalogs.unshift({
    id: crypto.randomUUID(),
    supplier: payload.supplier,
    sourceType: payload.sourceType,
    sourceUrl: payload.sourceUrl || "",
    fileName: file instanceof File && file.name ? file.name : "sem arquivo",
    createdAt: new Date().toLocaleDateString("pt-BR"),
    items,
  });

  saveCatalogs(catalogs);
  catalogForm.reset();
  render();
};

const removeCatalog = (catalogId) => {
  const catalogs = loadCatalogs().filter((catalog) => catalog.id !== catalogId);
  saveCatalogs(catalogs);
  render();
};

form.addEventListener("submit", handleSubmit);
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
availabilityFilter.addEventListener("change", render);
seedButton.addEventListener("click", seedDemoData);
clearButton.addEventListener("click", () => {
  saveProducts([]);
  saveCatalogs([]);
  render();
});

catalogForm.addEventListener("submit", handleCatalogSubmit);

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const sku = button.dataset.sku;
  if (sku) {
    removeProduct(sku);
  }
});

catalogList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const catalogId = button.dataset.catalogId;
  if (catalogId) {
    removeCatalog(catalogId);
  }
});

render();
