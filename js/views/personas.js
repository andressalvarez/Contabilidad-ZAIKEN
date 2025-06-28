// Personas View - Script principal
window.PersonasView = {
    table: null,
    initialized: false,

    // Función principal que se ejecuta al cargar la vista
    init() {
        console.log('PersonasView.init() llamado');

        if (this.initialized) {
            console.log('PersonasView ya inicializado, refrescando tabla');
            this.refreshTable();
            return;
        }

        console.log('Inicializando vista Personas...');

        // Configurar eventos
        this.setupEvents();

        // Inicializar tabla
        this.initTable();

        // Actualizar estadísticas
        this.updateStats();

        // Actualizar selects
        this.loadRolesSelect();

        this.initialized = true;
        console.log('Vista Personas inicializada correctamente');
    },

    // Configurar eventos específicos de la vista
    setupEvents() {
        // Búsqueda en tabla
        const searchInput = document.getElementById('search-personas');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                if (this.table) {
                    this.table.setFilter("nombre", "like", e.target.value);
                }
            }, 300));
        }
    },

    // Cargar roles en select
    loadRolesSelect() {
        const select = document.getElementById('persona-rolSelect');
        if (!select) return;

        const roles = DataManager.getAll('rolesData');
        select.innerHTML = '<option value="">-- Seleccione rol --</option>';

        roles.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.id;
            option.textContent = rol.nombreRol;
            select.appendChild(option);
        });
    },

    // Inicializar tabla Tabulator
    initTable() {
        const tableElement = document.getElementById('personas-table');
        if (!tableElement) return;

        // Botón de eliminar personalizado
        const deleteButton = function(cell) {
            const button = document.createElement("button");
            button.innerHTML = '<i class="bi bi-trash"></i>';
            button.className = "btn btn-danger btn-sm";
            button.title = "Eliminar persona";

            button.addEventListener("click", async function(){
                const row = cell.getRow();
                const data = row.getData();

                const confirmed = await Utils.confirm(
                    `¿Estás seguro de eliminar a "${data.nombre}"?`,
                    'Eliminar Persona'
                );

                if (confirmed) {
                    await PersonasView.eliminarPersona(data.id);
                }
            });
            return button;
        };

        this.table = new Tabulator(tableElement, {
            height: "400px",
            layout: "fitColumns",
            responsiveLayout: "hide",
            pagination: "local",
            paginationSize: 10,
            paginationSizeSelector: [5, 10, 20, 50],
            movableColumns: true,
            resizableRows: true,
            tooltips: true,
            columns: [
                {
                    title: "ID",
                    field: "id",
                    width: 60,
                    sorter: "number"
                },
                {
                    title: "Nombre",
                    field: "nombre",
                    editor: "input",
                    validator: "required",
                    headerFilter: "input"
                },
                {
                    title: "Rol",
                    field: "rolId",
                    headerFilter: "list",
                    headerFilterParams: {
                        values: () => {
                            const roles = DataManager.getAll('rolesData');
                            const values = { "": "Todos los roles" };
                            roles.forEach(rol => {
                                values[rol.id] = rol.nombreRol;
                            });
                            return values;
                        }
                    },
                    formatter: (cell) => {
                        const rolId = cell.getValue();
                        if (!rolId) return 'Sin rol';
                        const rol = DataManager.getById('rolesData', rolId);
                        return rol ? rol.nombreRol : 'Sin rol';
                    }
                },
                {
                    title: "Horas Totales",
                    field: "horasTotales",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return `${value}h`;
                    }
                },
                {
                    title: "Aportes Totales",
                    field: "aportesTotales",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return Utils.formatCurrency(value);
                    }
                },
                {
                    title: "Gastos Totales",
                    field: "gastosTotales",
                    formatter: function(cell){
                        const personaId = cell.getRow().getData().id;
                        const trans = DataManager.getAll('transaccionesData').filter(t => t.tipo === 'Gasto' && t.personaId === personaId);
                        const total = trans.reduce((sum, t) => sum + (t.monto || 0), 0);
                        return Utils.formatCurrency(total);
                    }
                },
                {
                    title: "Valor Hora",
                    field: "valorHora",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return Utils.formatCurrency(value);
                    }
                },
                {
                    title: "Participación %",
                    field: "participacionPorc",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return `${value.toFixed(2)}%`;
                    }
                },
                {
                    title: "Notas",
                    field: "notas",
                    editor: "input",
                    formatter: "textarea"
                },
                {
                    title: "Inversión Horas (COP)",
                    field: "inversionHoras",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return Utils.formatCurrency(value);
                    }
                },
                {
                    title: "Inversión Total (COP)",
                    field: "inversionTotal",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return Utils.formatCurrency(value);
                    }
                },
                {
                    title: "Acciones",
                    field: "acciones",
                    formatter: deleteButton,
                    hozAlign: "center",
                    width: 100,
                    headerSort: false
                }
            ],
            cellEdited: function(cell) {
                const data = cell.getRow().getData();
                DataManager.update('personasData', data.id, data);
                Calculations.recalcularPersonas();
                PersonasView.updateStats();
                PersonasView.refreshTable();
                Utils.showToast('Persona actualizada', 'success');
            }
        });

        // Cargar datos cuando la tabla esté lista
        this.table.on("tableBuilt", () => {
            this.loadData();
        });
    },

    // Cargar datos en tabla
    loadData() {
        if (!this.table) return;

        const personas = DataManager.getAll('personasData');
        this.table.setData(personas);
    },

    // ✅ IMPLEMENTACIÓN COMPLETA: Agregar nueva persona
    agregarPersona() {
        const nombre = document.getElementById('persona-nombre').value.trim();
        const rolId = parseInt(document.getElementById('persona-rolSelect').value) || null;

        // Validaciones
        if (!nombre) {
            Utils.showToast('Debe ingresar un nombre', 'error');
            return;
        }

        // Verificar duplicados
        const personas = DataManager.getAll('personasData');
        const existe = personas.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());

        if (existe) {
            Utils.showToast('Ya existe una persona con ese nombre', 'error');
            return;
        }

        // Crear nueva persona con la misma estructura que el sistema original
        const nuevaPersona = {
            nombre: nombre,
            rolId: rolId || 0,
            horasTotales: 0,
            aportesTotales: 0,
            valorHora: 0,
            inversionHoras: 0,
            inversionTotal: 0,
            participacionPorc: 0,
            notas: "",
            activo: true
        };

        // Agregar persona usando DataManager
        const personaCreada = DataManager.add('personasData', nuevaPersona);

        // Recalcular datos de personas
        Calculations.recalcularPersonas();

        // Refrescar tabla y estadísticas
        this.loadData();
        this.updateStats();

        // Limpiar formulario
        this.limpiarFormulario();

        // Actualizar selects en otras vistas
        Utils.actualizarSelectsEnFormularios();

        Utils.showToast(`Persona "${nombre}" agregada exitosamente`, 'success');

        console.log('Nueva persona creada:', personaCreada);
    },

    // Eliminar persona
    async eliminarPersona(personaId) {
        try {
            const persona = DataManager.getById('personasData', personaId);
            if (!persona) {
                Utils.showToast('Persona no encontrada', 'error');
                return;
            }

            // Verificar dependencias antes de eliminar
            const registroHoras = DataManager.getAll('registroHorasData');
            const transacciones = DataManager.getAll('transaccionesData');
            const valorHora = DataManager.getAll('valorHoraData');
            const distribuciones = DataManager.getAll('distribucionDetalleData');

            const tieneHoras = registroHoras.some(rh => rh.personaId === personaId);
            const tieneTransacciones = transacciones.some(t => t.personaId === personaId);
            const tieneValorHora = valorHora.some(vh => vh.personaId === personaId);
            const tieneDistribuciones = distribuciones.some(dd => dd.personaId === personaId);

            if (tieneHoras || tieneTransacciones || tieneValorHora || tieneDistribuciones) {
                const dependencias = [];
                if (tieneHoras) dependencias.push('registro de horas');
                if (tieneTransacciones) dependencias.push('transacciones');
                if (tieneValorHora) dependencias.push('valor por hora');
                if (tieneDistribuciones) dependencias.push('distribuciones');

                const confirmar = await Utils.confirm(
                    `Esta persona tiene datos relacionados en: ${dependencias.join(', ')}. ¿Desea continuar? Esto eliminará todos los datos relacionados.`,
                    'Eliminar Persona con Dependencias'
                );

                if (!confirmar) return;

                // Eliminar datos relacionados
                if (tieneHoras) {
                    registroHoras.filter(rh => rh.personaId === personaId)
                        .forEach(rh => DataManager.delete('registroHorasData', rh.id));
                }
                if (tieneTransacciones) {
                    transacciones.filter(t => t.personaId === personaId)
                        .forEach(t => DataManager.delete('transaccionesData', t.id));
                }
                if (tieneValorHora) {
                    valorHora.filter(vh => vh.personaId === personaId)
                        .forEach(vh => DataManager.delete('valorHoraData', vh.id));
                }
                if (tieneDistribuciones) {
                    distribuciones.filter(dd => dd.personaId === personaId)
                        .forEach(dd => DataManager.delete('distribucionDetalleData', dd.id));
                }
            }

            // Eliminar la persona
            DataManager.delete('personasData', personaId);

            // Recalcular todo el sistema
            Calculations.recalcularTodo();

            // Refrescar vista
            this.loadData();
            this.updateStats();

            // Actualizar selects en otras vistas
            Utils.actualizarSelectsEnFormularios();

            Utils.showToast(`Persona "${persona.nombre}" eliminada exitosamente`, 'success');

        } catch (error) {
            console.error('Error eliminando persona:', error);
            Utils.showToast('Error al eliminar persona: ' + error.message, 'error');
        }
    },

    // Actualizar estadísticas
    updateStats() {
        const personas = DataManager.getAll('personasData');
        const personasActivas = personas.filter(p => p.activo !== false);

        const totalHoras = personas.reduce((acc, p) => acc + (p.horasTotales || 0), 0);
        const totalAportes = personas.reduce((acc, p) => acc + (p.aportesTotales || 0), 0);
        const totalInversion = personas.reduce((acc, p) => acc + (p.inversionTotal || 0), 0);

        // Mostrar estadísticas si existe el contenedor
        const statsContainer = document.getElementById('personas-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-blue-600 font-medium">Total Personas</p>
                        <p class="text-2xl font-bold text-blue-800">${personas.length}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-green-600 font-medium">Personas Activas</p>
                        <p class="text-2xl font-bold text-green-800">${personasActivas.length}</p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-yellow-600 font-medium">Total Horas</p>
                        <p class="text-2xl font-bold text-yellow-800">${totalHoras}h</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-purple-600 font-medium">Total Inversión</p>
                        <p class="text-2xl font-bold text-purple-800">COP ${Utils.formatearMoneda(totalInversion)}</p>
                    </div>
                </div>
            `;
        }
    },

    // Exportar personas a CSV
    exportarPersonas() {
        const personas = DataManager.getAll('personasData');
        const datosExportar = personas.map(p => {
            const rol = DataManager.getById('rolesData', p.rolId);
            return {
                ID: p.id,
                Nombre: p.nombre,
                Rol: rol ? rol.nombreRol : 'Sin rol',
                'Horas Totales': p.horasTotales,
                'Aportes Totales': p.aportesTotales,
                'Valor Hora': p.valorHora,
                'Participación %': p.participacionPorc,
                'Inversión Horas': p.inversionHoras,
                'Inversión Total': p.inversionTotal,
                Notas: p.notas
            };
        });

        Utils.exportToCSV(datosExportar, 'personas_export');
        Utils.showToast('Datos de personas exportados', 'success');
    },

    // Recalcular todo
    recalcularTodo() {
        Calculations.recalcularTodo();
        this.refreshTable();
        this.updateStats();
        Utils.showToast('Datos recalculados', 'success');
    },

    // Refrescar tabla
    refreshTable() {
        if (this.table) {
            this.loadData();
        }
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('persona-nombre').value = '';
        document.getElementById('persona-rolSelect').value = '';
    },

    // Cleanup
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
        this.initialized = false;
        console.log('Personas view cleanup completado');
    }
};

// Función global para compatibilidad con el sistema original
window.agregarPersona = function() {
    PersonasView.agregarPersona();
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('personas-table')) {
            PersonasView.init();
        }
    });
} else {
    if (document.getElementById('personas-table')) {
        PersonasView.init();
    }
}

// Confirmar que PersonasView está registrado
console.log('PersonasView registrado en window:', !!window.PersonasView);
console.log('PersonasView tiene método init:', typeof window.PersonasView.init);
