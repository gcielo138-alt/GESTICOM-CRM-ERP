
/* =====================================
   GESTICOM - BASE DE DATOS INICIAL
   CRM + ERP
===================================== */

const STORAGE_KEY = "gesticom_database_v1";

const initialData = {
    clients: [
        {
            id: 1,
            name: "Comercial Andina",
            email: "contacto@andina.com",
            phone: "0991234567",
            company: "Comercial Andina",
            status: "Activo"
        },
        {
            id: 2,
            name: "María López",
            email: "maria@email.com",
            phone: "0987654321",
            company: "Distribuidora ML",
            status: "Activo"
        }
    ],

    products: [
        {
            id: 1,
            name: "Computadora portátil",
            category: "Tecnología",
            stock: 15,
            price: 850,
            minimum: 5
        },
        {
            id: 2,
            name: "Impresora multifunción",
            category: "Oficina",
            stock: 8,
            price: 220,
            minimum: 3
        },
        {
            id: 3,
            name: "Teclado inalámbrico",
            category: "Accesorios",
            stock: 2,
            price: 35,
            minimum: 5
        }
    ],

    suppliers: [
        {
            id: 1,
            name: "Tech Solutions",
            contact: "Carlos Pérez",
            email: "ventas@techsolutions.com",
            phone: "0998765432"
        }
    ],

    opportunities: [
        {
            id: 1,
            name: "Venta de equipos",
            client: "Comercial Andina",
            value: 2500,
            stage: "En negociación"
        }
    ],

    sales: [],

    purchases: []
};

/* Obtener información guardada */

function getDatabase() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(initialData)
            );

            return JSON.parse(JSON.stringify(initialData));
        }

        const database = JSON.parse(saved);

        Object.keys(initialData).forEach(key => {
            if (!Array.isArray(database[key])) {
                database[key] = [...initialData[key]];
            }
        });

        return database;

    } catch (error) {
        console.error("Error al cargar los datos:", error);

        return JSON.parse(JSON.stringify(initialData));
    }
}

/* Guardar información */

function saveDatabase(database) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );

        return true;

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("No se pudieron guardar los datos.");

        return false;
    }
}

/* Base de datos disponible para toda la aplicación */

window.GESTICOM_DB = {
    getDatabase,
    saveDatabase
};

/* Inicializar */

window.gesticomData = getDatabase();

console.log("GESTICOM: base de datos inicializada correctamente");
