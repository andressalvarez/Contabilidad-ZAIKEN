// Roles View - Script principal
(function() {
    let rolesTable = null;

    // Función principal que se ejecuta al cargar la vista
    function initRoles() {
        console.log('Inicializando vista Roles...');

        // Configurar eventos
        setupEvents();

        // Inicializar tabla
        initTable();

        // Actualizar estadísticas
        updateStats();

        // Actualizar selects en formularios
        Utils.actualizarSelectsEnFormularios();

        console.log('Vista Roles inicializada');
    }

    // Configurar eventos específicos de la vista
    function setupEvents() {
        // Formulario de agregar rol
        const form = document.getElementById('form-rol');
        if (form) {
            form.addEventListener('submit', handleAddRol);
        }

        // Búsqueda en tabla
        const searchInput = document.getElementById('search-roles');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                if (rolesTable) {
                    rolesTable.setFilter("nombreRol", "like", e.target.value);
                }
            }, 300));
        }
    }

    // Inicializar tabla Tabulator
    function initTable() {
        const tableElement = document.getElementById('roles-table');
        if (!tableElement) return;

        // Botón de eliminar personalizado
        const deleteButton = function(cell) {
            const button = document.createElement("button");
            button.innerHTML = '<i class="bi bi-trash"></i>';
            button.className = "btn btn-danger btn-sm";
            button.title = "Eliminar rol";

            button.addEventListener("click", async function(){
                const row = cell.getRow();
                const data = row.getData();

                const confirmed = await Utils.confirm(
                    `¿Estás seguro de eliminar el rol "${data.nombreRol}"?`,
                    'Eliminar Rol'
                );

                if (confirmed) {
                    eliminarRol(data.id);
                }
            });
            return button;
        };

        rolesTable = new Tabulator(tableElement, {
            data: DataManager.getAll('rolesData'),
            layout: "fitColumns",
            responsiveLayout: false, // <--- Cambiado para que nunca oculte columnas
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
                    title: "Nombre del Rol",
                    field: "nombreRol",
                    editor: "input",
                    validator: "required",
                    headerFilter: "input"
                },
                {
                    title: "Importancia (%)",
                    field: "importancia",
                    editor: "number",
                    editorParams: { min: 0, max: 100 },
                    validator: ["required", "min:0", "max:100"],
                    formatter: function(cell) {
                        const value = cell.getValue();
                        return `${value}%`;
                    }
                },
                {
                    title: "Descripción",
                    field: "descripcion",
                    editor: "input",
                    formatter: "textarea"
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
                DataManager.update('rolesData', data.id, data);
                Calculations.recalcularPersonas();
                updateStats();
                Utils.showToast('Rol actualizado', 'success');
            }
        });
    }

    // Manejar formulario de agregar rol
    function handleAddRol(e) {
        e.preventDefault();

        const formData = {
            nombreRol: document.getElementById('rol-nombreRol').value.trim(),
            importancia: parseInt(document.getElementById('rol-importancia').value) || 0,
            descripcion: document.getElementById('rol-descripcion').value.trim()
        };

        // Validación
        const validation = Utils.validateForm(formData, {
            nombreRol: { required: true, label: 'Nombre del Rol' },
            importancia: { required: true, min: 0, max: 100, label: 'Importancia' }
        });

        if (!validation.isValid) {
            Utils.showToast(validation.errors[0], 'error');
            return;
        }

        // Verificar si ya existe un rol con ese nombre
        const existingRole = DataManager.getAll('rolesData')
            .find(r => r.nombreRol.toLowerCase() === formData.nombreRol.toLowerCase());

        if (existingRole) {
            Utils.showToast('Ya existe un rol con ese nombre', 'error');
            return;
        }

        // Agregar rol
        const newRole = DataManager.add('rolesData', formData);

        // Actualizar tabla
        rolesTable.addRow(newRole);

        // Recalcular sistema
        Calculations.recalcularPersonas();

        // Actualizar estadísticas
        updateStats();

        // Actualizar selects
        Utils.actualizarSelectsEnFormularios();

        // Limpiar formulario
        Utils.clearForm('form-rol');

        Utils.showToast('Rol agregado exitosamente', 'success');
    }

    // Eliminar rol
    function eliminarRol(rolId) {
        try {
            // Verificar si hay personas con este rol
            const personasConRol = DataManager.getAll('personasData')
                .filter(p => p.rolId === rolId);

            if (personasConRol.length > 0) {
                Utils.showToast(
                    `No se puede eliminar: ${personasConRol.length} persona(s) tienen este rol asignado`,
                    'warning'
                );
                return;
            }

            // Eliminar rol
            DataManager.delete('rolesData', rolId);

            // Actualizar tabla
            rolesTable.deleteRow(rolId);

            // Recalcular sistema
            Calculations.recalcularPersonas();

            // Actualizar estadísticas
            updateStats();

            // Actualizar selects
            Utils.actualizarSelectsEnFormularios();

            Utils.showToast('Rol eliminado exitosamente', 'success');

        } catch (error) {
            console.error('Error eliminando rol:', error);
            Utils.showToast('Error al eliminar el rol', 'error');
        }
    }

    // Actualizar estadísticas
    function updateStats() {
        const roles = DataManager.getAll('rolesData');
        const personas = DataManager.getAll('personasData');

        const totalRoles = roles.length;
        const importanciaTotal = roles.reduce((sum, rol) => sum + (rol.importancia || 0), 0);
        const personasAsignadas = personas.filter(p => p.rolId && p.rolId > 0).length;

        // Actualizar elementos
        const totalRolesEl = document.getElementById('stat-total-roles');
        const importanciaTotalEl = document.getElementById('stat-importancia-total');
        const personasAsignadasEl = document.getElementById('stat-personas-asignadas');

        if (totalRolesEl) totalRolesEl.textContent = totalRoles;
        if (importanciaTotalEl) importanciaTotalEl.textContent = `${importanciaTotal}%`;
        if (personasAsignadasEl) personasAsignadasEl.textContent = personasAsignadas;
    }

    // Exportar roles a CSV
    function exportarRoles() {
        const roles = DataManager.getAll('rolesData');
        Utils.exportToCSV(roles, 'roles');
    }

    // Recalcular todo
    function recalcularTodo() {
        Calculations.recalcularTodo();
        updateStats();
        Utils.showToast('Sistema recalculado', 'success');
    }

    // Refrescar tabla
    function refreshTable() {
        if (rolesTable) {
            rolesTable.replaceData(DataManager.getAll('rolesData'));
            updateStats();
            Utils.showToast('Tabla actualizada', 'info');
        }
    }

    // Función de limpieza al salir de la vista
    function cleanup() {
        if (rolesTable) {
            rolesTable.destroy();
            rolesTable = null;
        }
        console.log('Roles view cleanup completado');
    }

    // Exponer objeto RolesView
    window.RolesView = {
        init: initRoles,
        cleanup: cleanup,
        refreshTable: refreshTable,
        updateStats: updateStats,
        exportarRoles: exportarRoles,
        recalcularTodo: recalcularTodo
    };

    console.log('RolesView registrado en window:', !!window.RolesView);
    console.log('RolesView tiene método init:', typeof window.RolesView.init);

    // Exponer funciones globalmente (para compatibilidad)
    window.exportarRoles = exportarRoles;
    window.recalcularTodo = recalcularTodo;
    window.refreshTable = refreshTable;
    window.refreshCurrentView = () => {
        refreshTable();
        updateStats();
    };
    window.currentViewCleanup = cleanup;

    // Inicializar vista
    initRoles();

})();
