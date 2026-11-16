
/* ==========================================
   GESTICOM - MOTOR PRINCIPAL
   CRM + ERP INTEGRADO
========================================== */

let db = window.GESTICOM_DB.getDatabase();
let currentPage = "dashboard";
let editingId = null;
let currentModule = null;

const $ = (selector) => document.querySelector(selector);

const configs = {
    clients: {
        title: "Clientes",
        description: "Administración de clientes y contactos",
        fields: [
            {name:"name",label:"Nombre del cliente",required:true},
            {name:"company",label:"Empresa"},
            {name:"email",label:"Correo electrónico",type:"email"},
            {name:"phone",label:"Teléfono"},
            {name:"status",label:"Estado",type:"select",options:["Activo","Inactivo"]}
        ],
        columns: ["name","company","email","phone","status"]
    },

    opportunities: {
        title: "Oportunidades",
        description: "Seguimiento de oportunidades comerciales",
        fields: [
            {name:"name",label:"Nombre de oportunidad",required:true},
            {name:"client",label:"Cliente"},
            {name:"value",label:"Valor estimado",type:"number",required:true},
            {name:"stage",label:"Etapa",type:"select",options:["Nuevo","En negociación","Ganada","Perdida"]}
        ],
        columns: ["name","client","value","stage"]
    },

    products: {
        title: "Inventario",
        description: "Control de productos y existencias",
        fields: [
            {name:"name",label:"Nombre del producto",required:true},
            {name:"category",label:"Categoría"},
            {name:"stock",label:"Existencias",type:"number",required:true},
            {name:"price",label:"Precio unitario",type:"number",required:true},
            {name:"minimum",label:"Stock mínimo",type:"number",required:true}
        ],
        columns: ["name","category","stock","price","minimum"]
    },

    suppliers: {
        title: "Proveedores",
        description: "Administración de proveedores",
        fields: [
            {name:"name",label:"Nombre del proveedor",required:true},
            {name:"contact",label:"Persona de contacto"},
            {name:"email",label:"Correo electrónico",type:"email"},
            {name:"phone",label:"Teléfono"}
        ],
        columns: ["name","contact","email","phone"]
    },

    opportunities_unused: {
        title: "Oportunidades"
    }
};

const currency = value =>
    new Intl.NumberFormat("es-EC", {
        style:"currency",
        currency:"USD"
    }).format(Number(value) || 0);

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
    })[char]);
}

function persist() {
    window.GESTICOM_DB.saveDatabase(db);
    window.gesticomData = db;
}

function nextId(module) {
    return Math.max(0, ...db[module].map(item => Number(item.id) || 0)) + 1;
}

function formatValue(key, value) {
    if (key === "price" || key === "value" || key === "total") {
        return currency(value);
    }

    if (key === "stage" || key === "status") {
        const warning = ["En negociación","Nuevo","Perdida","Inactivo"].includes(value);
        return `<span class="badge ${warning ? "warning" : ""}">${escapeHTML(value)}</span>`;
    }

    return escapeHTML(value);
}

/* ==========================================
   NAVEGACIÓN
========================================== */

document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".nav").forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");
        currentPage = button.dataset.page;
        renderPage();
    });
});

function renderPage() {
    const titles = {
        dashboard:"Dashboard",
        clients:"Clientes",
        opportunities:"Oportunidades",
        products:"Inventario",
        suppliers:"Proveedores",
        sales:"Ventas",
        purchases:"Compras",
        reports:"Reportes"
    };

    $("#page-title").textContent = titles[currentPage] || "Dashboard";

    if (currentPage === "dashboard") renderDashboard();
    else if (currentPage === "sales") renderTransactions("sales");
    else if (currentPage === "purchases") renderTransactions("purchases");
    else if (currentPage === "reports") renderReports();
    else renderModule(currentPage);
}

/* ==========================================
   DASHBOARD
========================================== */

function renderDashboard() {
    const totalClients = db.clients.length;
    const totalProducts = db.products.length;

    const revenue = db.sales.reduce((sum,item) =>
        sum + Number(item.total || 0), 0
    );

    const lowStock = db.products.filter(item =>
        Number(item.stock) <= Number(item.minimum)
    ).length;

    $("#content").innerHTML = `
        <div class="welcome">
            <h2>¡Bienvenido a GESTICOM!</h2>
            <p>Administra tus clientes, inventario, compras y ventas
            desde una sola plataforma.</p>
        </div>

        <div class="stats">
            <div class="stat">
                <small>Total de clientes</small>
                <h2>${totalClients}</h2>
                <p>CRM</p>
            </div>

            <div class="stat">
                <small>Productos registrados</small>
                <h2>${totalProducts}</h2>
                <p>Inventario ERP</p>
            </div>

            <div class="stat">
                <small>Ventas acumuladas</small>
                <h2>${currency(revenue)}</h2>
                <p>Ingresos registrados</p>
            </div>

            <div class="stat">
                <small>Productos por reponer</small>
                <h2>${lowStock}</h2>
                <p>Control de inventario</p>
            </div>
        </div>

        <div class="panel">
            <h3>Resumen de actividad</h3>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Indicador</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Clientes</td><td>${totalClients}</td></tr>
                        <tr><td>Proveedores</td><td>${db.suppliers.length}</td></tr>
                        <tr><td>Oportunidades</td><td>${db.opportunities.length}</td></tr>
                        <tr><td>Ventas realizadas</td><td>${db.sales.length}</td></tr>
                        <tr><td>Compras realizadas</td><td>${db.purchases.length}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <h3>Alertas de inventario</h3>
            ${lowStock === 0
                ? `<p class="empty">No existen alertas de inventario.</p>`
                : db.products.filter(p => Number(p.stock) <= Number(p.minimum))
                    .map(p => `
                        <p style="padding:10px;border-bottom:1px solid #eee">
                            ⚠️ ${escapeHTML(p.name)}:
                            ${p.stock} unidades disponibles.
                            Stock mínimo: ${p.minimum}
                        </p>
                    `).join("")
            }
        </div>
    `;
}

/* ==========================================
   MÓDULOS GENERALES
========================================== */

function renderModule(module, query = "") {
    const config = configs[module];

    if (!config) return;

    const records = db[module].filter(item =>
        Object.values(item).some(value =>
            String(value).toLowerCase().includes(query.toLowerCase())
        )
    );

    $("#content").innerHTML = `
        <div class="section-head">
            <div>
                <h2>${config.title}</h2>
                <p>${config.description}</p>
            </div>

            <button class="btn-primary"
                onclick="openModal('${module}')">
                + Nuevo registro
            </button>
        </div>

        <div class="panel">
            <div class="toolbar">
                <input class="search" id="search-input"
                    placeholder="Buscar información..."
                    value="${escapeHTML(query)}">
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            ${config.columns.map(key =>
                                `<th>${escapeHTML(
                                    config.fields.find(f => f.name === key)?.label || key
                                )}</th>`
                            ).join("")}
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${records.map(item => `
                            <tr>
                                ${config.columns.map(key =>
                                    `<td>${formatValue(key,item[key])}</td>`
                                ).join("")}

                                <td>
                                    <div class="actions">
                                        <button class="action-btn"
                                            onclick="editRecord('${module}',${item.id})">
                                            Editar
                                        </button>

                                        <button class="btn-danger"
                                            onclick="deleteRecord('${module}',${item.id})">
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}

                        ${records.length === 0
                            ? `<tr><td colspan="${config.columns.length+1}"
                                class="empty">No hay registros disponibles.</td></tr>`
                            : ""
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;

    $("#search-input").addEventListener("input", event => {
        const position = event.target.selectionStart;
        const value = event.target.value;
        renderModule(module,value);
        const input = $("#search-input");
        input.focus();
        input.setSelectionRange(position,position);
    });
}

/* ==========================================
   MODAL Y FORMULARIOS
========================================== */

function openModal(module, record = null) {
    currentModule = module;
    editingId = record ? record.id : null;

    $("#modal-title").textContent =
        (record ? "Editar " : "Registrar ") +
        (configs[module]?.title || "información");

    const fields = configs[module].fields;

    $("#form-fields").innerHTML = fields.map(field => {
        const value = record?.[field.name] ?? "";

        if (field.type === "select") {
            return `
                <div class="field">
                    <label>${escapeHTML(field.label)}</label>
                    <select name="${field.name}" ${field.required ? "required" : ""}>
                        ${field.options.map(option => `
                            <option value="${escapeHTML(option)}"
                                ${value === option ? "selected" : ""}>
                                ${escapeHTML(option)}
                            </option>
                        `).join("")}
                    </select>
                </div>
            `;
        }

        return `
            <div class="field">
                <label>${escapeHTML(field.label)}</label>
                <input
                    type="${field.type || "text"}"
                    name="${field.name}"
                    value="${escapeHTML(value)}"
                    ${field.type === "number" ? 'min="0" step="any"' : ""}
                    ${field.required ? "required" : ""}
                >
            </div>
        `;
    }).join("");

    $("#modal").classList.remove("hidden");
}

function closeModal() {
    $("#modal").classList.add("hidden");
    $("#data-form").reset();
    editingId = null;
    currentModule = null;
}

function editRecord(module,id) {
    const record = db[module].find(item => item.id === id);
    if (record) openModal(module,record);
}

function deleteRecord(module,id) {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    db[module] = db[module].filter(item => item.id !== id);

    persist();
    renderPage();
}

/* ==========================================
   GUARDAR REGISTROS GENERALES
========================================== */

$("#data-form").addEventListener("submit", event => {
    event.preventDefault();

    const module = currentModule;
    const formData = new FormData(event.target);
    const record = Object.fromEntries(formData.entries());

    if (!module) return;

    for (const field of configs[module].fields) {
        if (field.type === "number") {
            record[field.name] = Number(record[field.name]);
        }
    }

    if (editingId !== null) {
        db[module] = db[module].map(item =>
            item.id === editingId
                ? {...item,...record}
                : item
        );
    } else {
        record.id = nextId(module);
        db[module].push(record);
    }

    persist();
    closeModal();
    renderPage();
});

/* ==========================================
   VENTAS Y COMPRAS
========================================== */

function renderTransactions(module) {
    const isSale = module === "sales";

    const title = isSale ? "Ventas" : "Compras";

    const records = db[module];

    const total = records.reduce((sum,item) =>
        sum + Number(item.total || 0),0
    );

    $("#content").innerHTML = `
        <div class="section-head">
            <div>
                <h2>${title}</h2>
                <p>Control de ${title.toLowerCase()} y movimientos de inventario</p>
            </div>

            <button class="btn-primary"
                onclick="openTransactionModal('${module}')">
                + Registrar ${isSale ? "venta" : "compra"}
            </button>
        </div>

        <div class="stats">
            <div class="stat">
                <small>Total de operaciones</small>
                <h2>${records.length}</h2>
            </div>
            <div class="stat">
                <small>Valor acumulado</small>
                <h2>${currency(total)}</h2>
            </div>
        </div>

        <div class="panel">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>${isSale ? "Cliente" : "Proveedor"}</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(item => `
                            <tr>
                                <td>${escapeHTML(item.date)}</td>
                                <td>${escapeHTML(isSale ? item.client : item.supplier)}</td>
                                <td>${escapeHTML(item.product)}</td>
                                <td>${item.quantity}</td>
                                <td>${currency(item.total)}</td>
                                <td>
                                    <button class="btn-danger"
                                        onclick="deleteTransaction('${module}',${item.id})">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        `).join("")}

                        ${records.length === 0
                            ? `<tr><td colspan="6" class="empty">
                                No existen operaciones registradas.
                               </td></tr>`
                            : ""
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openTransactionModal(module) {
    currentModule = module;
    editingId = null;

    const isSale = module === "sales";

    $("#modal-title").textContent =
        isSale ? "Registrar nueva venta" : "Registrar nueva compra";

    const products = db.products;

    if (!products.length) {
        alert("Primero debes registrar productos en inventario.");
        return;
    }

    const counterparties = isSale ? db.clients : db.suppliers;

    if (!counterparties.length) {
        alert(isSale
            ? "Primero registra un cliente."
            : "Primero registra un proveedor."
        );
        return;
    }

    $("#form-fields").innerHTML = `
        <div class="field">
            <label>${isSale ? "Cliente" : "Proveedor"}</label>
            <select name="counterparty" required>
                ${counterparties.map(item => `
                    <option value="${escapeHTML(item.name)}">
                        ${escapeHTML(item.name)}
                    </option>
                `).join("")}
            </select>
        </div>

        <div class="field">
            <label>Producto</label>
            <select name="productId" id="transaction-product" required>
                ${products.map(item => `
                    <option value="${item.id}">
                        ${escapeHTML(item.name)} (Stock: ${item.stock})
                    </option>
                `).join("")}
            </select>
        </div>

        <div class="field">
            <label>Cantidad</label>
            <input type="number" name="quantity"
                min="1" step="1" required>
        </div>

        <div class="field">
            <label>Precio unitario</label>
            <input type="number" name="unitPrice"
                min="0.01" step="0.01" required>
        </div>
    `;

    const productSelect = $("#transaction-product");
    const priceInput = document.querySelector('[name="unitPrice"]');

    function updatePrice() {
        const product = db.products.find(item =>
            item.id === Number(productSelect.value)
        );

        priceInput.value = product
            ? Number(product.price).toFixed(2)
            : "";
    }

    productSelect.addEventListener("change",updatePrice);
    updatePrice();

    $("#modal").classList.remove("hidden");
}

/* Guardar compras y ventas */

function saveTransaction(module,values) {
    const isSale = module === "sales";

    const product = db.products.find(item =>
        item.id === Number(values.productId)
    );

    if (!product) {
        alert("Producto no encontrado.");
        return false;
    }

    const quantity = Number(values.quantity);
    const unitPrice = Number(values.unitPrice);

    if (!Number.isInteger(quantity) || quantity <= 0 ||
        !Number.isFinite(unitPrice) || unitPrice <= 0) {
        alert("Ingresa una cantidad y un precio válidos.");
        return false;
    }

    if (isSale && quantity > Number(product.stock)) {
        alert("No hay suficientes existencias para esta venta.");
        return false;
    }

    if (isSale) {
        product.stock -= quantity;
    } else {
        product.stock += quantity;
    }

    const record = {
        id: nextId(module),
        date: new Date().toLocaleDateString("es-EC"),
        product: product.name,
        productId: product.id,
        quantity,
        unitPrice,
        total: quantity * unitPrice
    };

    if (isSale) {
        record.client = values.counterparty;
    } else {
        record.supplier = values.counterparty;
    }

    db[module].push(record);

    persist();
    return true;
}

/* Formulario de transacciones */

$("#data-form").addEventListener("submit", event => {
    if (currentModule !== "sales" &&
        currentModule !== "purchases") return;

    event.preventDefault();

    const values = Object.fromEntries(
        new FormData(event.target).entries()
    );

    if (saveTransaction(currentModule,values)) {
        closeModal();
        renderPage();
    }
});

/* Eliminar una transacción y revertir inventario */

function deleteTransaction(module,id) {
    if (!confirm("¿Eliminar esta operación y actualizar inventario?")) return;

    const record = db[module].find(item => item.id === id);

    if (!record) return;

    const product = db.products.find(item =>
        item.id === record.productId
    );

    if (product) {
        if (module === "sales") {
            product.stock += Number(record.quantity);
        } else {
            if (product.stock < Number(record.quantity)) {
                alert("No es posible revertir esta compra: las existencias actuales son insuficientes.");
                return;
            }

            product.stock -= Number(record.quantity);
        }
    }

    db[module] = db[module].filter(item => item.id !== id);

    persist();
    renderPage();
}

/* ==========================================
   REPORTES
========================================== */

function renderReports() {
    const salesTotal = db.sales.reduce((sum,item) =>
        sum + Number(item.total),0
    );

    const purchasesTotal = db.purchases.reduce((sum,item) =>
        sum + Number(item.total),0
    );

    $("#content").innerHTML = `
        <div class="section-head">
            <div>
                <h2>Reportes empresariales</h2>
                <p>Resumen de los movimientos registrados</p>
            </div>
        </div>

        <div class="stats">
            <div class="stat">
                <small>Ingresos por ventas</small>
                <h2>${currency(salesTotal)}</h2>
            </div>

            <div class="stat">
                <small>Compras realizadas</small>
                <h2>${currency(purchasesTotal)}</h2>
            </div>

            <div class="stat">
                <small>Clientes</small>
                <h2>${db.clients.length}</h2>
            </div>

            <div class="stat">
                <small>Productos</small>
                <h2>${db.products.length}</h2>
            </div>
        </div>

        <div class="panel">
            <h3>Exportar información</h3>
            <p style="margin-bottom:15px;color:#8290a2">
                Descarga los registros para analizarlos en Excel.
            </p>

            <div class="actions" style="flex-wrap:wrap">
                <button class="btn-primary"
                    onclick="exportCSV('clients')">Exportar clientes</button>

                <button class="btn-primary"
                    onclick="exportCSV('products')">Exportar inventario</button>

                <button class="btn-primary"
                    onclick="exportCSV('sales')">Exportar ventas</button>

                <button class="btn-primary"
                    onclick="exportCSV('purchases')">Exportar compras</button>
            </div>
        </div>
    `;
}

function exportCSV(module) {
    const records = db[module];

    if (!records.length) {
        alert("No existen datos para exportar.");
        return;
    }

    const headers = Object.keys(records[0]);

    const rows = [
        headers.join(";"),
        ...records.map(record =>
            headers.map(key =>
                `"${String(record[key] ?? "").replace(/"/g,'""')}"`
            ).join(";")
        )
    ];

    const csv = "\uFEFF" + rows.join("\n");

    const blob = new Blob([csv], {
        type:"text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `gesticom-${module}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}

/* ==========================================
   INICIO DEL SISTEMA
========================================== */

$("#modal").addEventListener("click", event => {
    if (event.target.id === "modal") closeModal();
});

renderPage();

console.log("GESTICOM CRM + ERP iniciado correctamente");
