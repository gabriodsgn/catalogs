const storageKey = "pim-products";

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
const seedButton = document.getElementById("seed-demo");
const clearButton = document.getElementById("clear-data");

const loadProducts = () => {
  const raw = window.localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
};

const saveProducts = (products) => {
  window.localStorage.setItem(storageKey, JSON.stringify(products));
};

const renderStats = (products) => {
  const total = products.length;
  const active = products.filter((item) => item.status === "Ativo").length;
  const suppliers = new Set(products.map((item) => item.supplier)).size;

  statsContainer.innerHTML = "";
  const stats = [
    { label: "Produtos", value: total },
    { label: "Ativos", value: active },
    { label: "Fornecedores", value: suppliers },
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
  const filtered = filterProducts(products);

  renderStats(products);
  renderTable(filtered);
  renderSuppliers(products);
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
  render();
};

form.addEventListener("submit", handleSubmit);
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
availabilityFilter.addEventListener("change", render);
seedButton.addEventListener("click", seedDemoData);
clearButton.addEventListener("click", () => {
  saveProducts([]);
  render();
});

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const sku = button.dataset.sku;
  if (sku) {
    removeProduct(sku);
  }
});

render();
