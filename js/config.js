// Configuración y datos iniciales del sistema
window.AppConfig = {
    // Datos iniciales
    initialData: {
        // Roles
        rolesData: [
            { id: 1, nombreRol: "Director", importancia: 40, descripcion: "Gestión general" },
            { id: 2, nombreRol: "Operativo", importancia: 30, descripcion: "Operaciones diarias" },
            { id: 3, nombreRol: "Marketing", importancia: 30, descripcion: "Publicidad y campañas" },
        ],

        // Personas
        personasData: [
            {
                id: 1,
                nombre: "Juan Pérez",
                rolId: 1,
                horasTotales: 0,
                aportesTotales: 0,
                valorHora: 0,
                inversionHoras: 0,
                inversionTotal: 0,
                participacionPorc: 40,
                notas: "",
            },
            {
                id: 2,
                nombre: "Salma Gómez",
                rolId: 3,
                horasTotales: 0,
                aportesTotales: 0,
                valorHora: 0,
                inversionHoras: 0,
                inversionTotal: 0,
                participacionPorc: 30,
                notas: "",
            },
        ],

        // Valor Hora
        valorHoraData: [
            { id: 1, personaId: 1, rolId: 1, valor: 50000, notas: "" },
            { id: 2, personaId: 2, rolId: 3, valor: 30000, notas: "" },
        ],

        // Registro de Horas
        registroHorasData: [],

        // Campañas
        campanasData: [],

        // Transacciones
        transaccionesData: [],

        // Distribución de Utilidades
        distribucionUtilidadesData: [],

        // Distribución Detalle
        distribucionDetalleData: [],

        // Categorías
        categoriasData: [
            { id: 1, nombre: "Publicidad (TikTok)" },
            { id: 2, nombre: "Publicidad (Facebook)" },
            { id: 3, nombre: "Dominio/Hosting" },
            { id: 4, nombre: "Aporte socio" },
            { id: 5, nombre: "Venta / Ingreso campaña" },
            { id: 6, nombre: "Otros" },
        ],
    },

    // Configuración de la aplicación
    settings: {
        autoSave: true,
        dateFormat: 'YYYY-MM-DD',
        currency: 'COP',
        defaultsToToday: true,
        enableTooltips: true,
        enableDarkMode: true
    },

    // Configuración de las vistas
    views: {
        dashboard: {
            title: 'Dashboard de Resúmenes',
            template: './views/dashboard.html',
            script: './js/views/dashboard.js'
        },
        personas: {
            title: 'Gestión de Personas',
            template: './views/personas.html',
            script: './js/views/personas.js'
        },
        roles: {
            title: 'Gestión de Roles',
            template: './views/roles.html',
            script: './js/views/roles.js'
        },
        valorHora: {
            title: 'Valor por Hora',
            template: './views/valor-hora.html',
            script: './js/views/valor-hora.js'
        },
        registroHoras: {
            title: 'Registro de Horas',
            template: './views/registro-horas.html',
            script: './js/views/registro-horas.js'
        },
        campanas: {
            title: 'Campañas',
            template: './views/campanas.html',
            script: './js/views/campanas.js'
        },
        transacciones: {
            title: 'Transacciones',
            template: './views/transacciones.html',
            script: './js/views/transacciones.js'
        },
        categorias: {
            title: 'Categorías',
            template: './views/categorias.html',
            script: './js/views/categorias.js'
        },
        distribucionUtilidades: {
            title: 'Distribución de Utilidades',
            template: './views/distribucion-utilidades.html',
            script: './js/views/distribucion-utilidades.js'
        },
        distribucionDetalle: {
            title: 'Distribución Detalle',
            template: './views/distribucion-detalle.html',
            script: './js/views/distribucion-detalle.js'
        }
    },

    // Configuración de los formularios
    formFields: {
        dateInputs: [
            "rh-fecha",
            "camp-fechaInicio",
            "camp-fechaFin",
            "tx-fecha",
            "du-fecha",
            "dd-fecha"
        ]
    },

    // Claves de localStorage
    storageKeys: {
        rolesData: 'rolesData',
        personasData: 'personasData',
        valorHoraData: 'valorHoraData',
        registroHorasData: 'registroHorasData',
        campanasData: 'campanasData',
        transaccionesData: 'transaccionesData',
        distribucionUtilidadesData: 'distribucionUtilidadesData',
        distribucionDetalleData: 'distribucionDetalleData',
        categoriasData: 'categoriasData',
        darkMode: 'darkMode'
    }
};
