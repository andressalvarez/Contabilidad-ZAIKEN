// Vista de Registro de Horas
window.RegistroHorasView = {
    table: null,

    // Inicializar vista
    init() {
        console.log('Inicializando Registro de Horas...');
        this.setupTable();
        this.updateSelects();
        Utils.setDefaultDatesToToday();
    },

    // Configurar tabla
    setupTable() {
        const tableContainer = document.getElementById('registro-horas-table');
        if (!tableContainer) return;

        this.table = new Tabulator(tableContainer, {
            data: DataManager.getAll('registroHorasData'),
            layout: "fitColumns",
            responsiveLayout: "hide",
            columns: [
                { title: "ID", field: "id", width: 50 },
                { title: "Fecha", field: "fecha", editor: "input" },
                {
                    title: "Persona",
                    field: "personaId",
                    editor: "select",
                    editorParams: this.getPersonasOptions(),
                    formatter: "lookup",
                    formatterParams: this.getPersonasLookup()
                },
                {
                    title: "Campaña",
                    field: "campanaId",
                    editor: "select",
                    editorParams: this.getCampanasOptions(),
                    formatter: "lookup",
                    formatterParams: this.getCampanasLookup()
                },
                { title: "Horas", field: "horas", editor: "number" },
                { title: "Notas", field: "notas", editor: "input" },
                {
                    title: "Acciones",
                    formatter: this.deleteButtonFormatter,
                    width: 100,
                    hozAlign: "center"
                }
            ],
            cellEdited: () => {
                Calculations.recalcularPersonas();
                DataManager.guardarDatos();
            }
        });
    },

    // Agregar nuevo registro
    agregarRegistroHora() {
        const fecha = document.getElementById("rh-fecha").value;
        const personaId = +document.getElementById("rh-personaSelect").value;
        const campanaId = +document.getElementById("rh-campanaSelect").value || null;
        const horas = +document.getElementById("rh-horas").value;

        if (!personaId || !horas) {
            Utils.showToast("Debe ingresar Persona y Horas", "error");
            return;
        }

        const nuevoRegistro = {
            id: DataManager.getNextId('registroHorasData'),
            fecha: fecha || Utils.getTodayString(),
            personaId,
            campanaId,
            horas,
            notas: ""
        };

        DataManager.agregar('registroHorasData', nuevoRegistro);
        this.table.replaceData(DataManager.getAll('registroHorasData'));

        // Limpiar formulario
        document.getElementById("rh-fecha").value = Utils.getTodayString();
        document.getElementById("rh-personaSelect").value = "";
        document.getElementById("rh-campanaSelect").value = "";
        document.getElementById("rh-horas").value = "";

        Utils.showToast("Registro de horas agregado exitosamente", "success");
    },

    // Actualizar selects
    updateSelects() {
        Utils.actualizarSelect("rh-personaSelect", DataManager.getAll('personasData'), "nombre", "id");
        Utils.actualizarSelect("rh-campanaSelect", DataManager.getAll('campanasData'), "nombre", "id");
    },

    // Opciones para personas
    getPersonasOptions() {
        const personas = DataManager.getAll('personasData');
        const options = {};
        personas.forEach(p => {
            options[p.id] = p.nombre;
        });
        return { values: options };
    },

    // Lookup para personas
    getPersonasLookup() {
        const personas = DataManager.getAll('personasData');
        const lookup = {};
        personas.forEach(p => {
            lookup[p.id] = p.nombre;
        });
        return lookup;
    },

    // Opciones para campañas
    getCampanasOptions() {
        const campanas = DataManager.getAll('campanasData');
        const options = {};
        campanas.forEach(c => {
            options[c.id] = c.nombre;
        });
        return { values: options };
    },

    // Lookup para campañas
    getCampanasLookup() {
        const campanas = DataManager.getAll('campanasData');
        const lookup = {};
        campanas.forEach(c => {
            lookup[c.id] = c.nombre;
        });
        return lookup;
    },

    // Formatter para botón eliminar
    deleteButtonFormatter(cell) {
        const button = document.createElement("button");
        button.innerHTML = "Eliminar";
        button.classList.add("btn", "btn-danger", "btn-sm");

        button.addEventListener("click", function(){
            const row = cell.getRow();
            const data = row.getData();
            if(confirm(`¿Eliminar registro de ${data.horas} horas?`)){
                DataManager.eliminar('registroHorasData', data.id);
                RegistroHorasView.table.replaceData(DataManager.getAll('registroHorasData'));
                Utils.showToast("Registro eliminado", "success");
            }
        });

        return button;
    },

    // Cleanup
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
    }
};

// Función de inicialización global para compatibilidad
if (typeof window.currentViewCleanup !== 'undefined') {
    window.currentViewCleanup = RegistroHorasView.cleanup.bind(RegistroHorasView);
}

// Auto-inicializar si ya estamos en la vista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('registro-horas-table')) {
            RegistroHorasView.init();
        }
    });
} else {
    if (document.getElementById('registro-horas-table')) {
        RegistroHorasView.init();
    }
}
