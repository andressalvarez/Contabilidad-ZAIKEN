// Transacciones View
window.TransaccionesView = {
    table: null,
    initialized: false,
    resizeHandler: null,

    // Función principal que se ejecuta al cargar la vista
    async init() {
        console.log('Inicializando TransaccionesView...');

        try {
            // Limpiar recursos anteriores si existen
            this.cleanup();

            // Esperar un momento para que el DOM esté listo
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verificar que el contenedor existe
            const container = document.getElementById('transacciones-table');
            if (!container) {
                console.error('Contenedor transacciones-table no encontrado');
                return;
            }

            // Inicializar componentes
            this.setupForm();
            this.loadPersonasSelect();
            this.loadCampanasSelect();
            this.loadCategoriasSelect();
            this.loadFiltrosSelects();

            // Inicializar tabla después de un pequeño delay
            setTimeout(() => {
                this.initTable();
                this.setupEvents();
                this.mostrarEstadisticas();
                this.initialized = true;
                console.log('TransaccionesView inicializada correctamente');
            }, 150);

        } catch (error) {
            console.error('Error inicializando TransaccionesView:', error);
            // Intentar reinicializar después de un delay más largo
            setTimeout(() => {
                this.initTable();
                this.setupEvents();
                this.mostrarEstadisticas();
                this.initialized = true;
            }, 500);
        }
    },

    // Configurar formulario
    setupForm() {
        const fechaInput = document.getElementById('tx-fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }

        this.loadPersonasSelect();
        this.loadCampanasSelect();
        this.loadCategoriasSelect();
    },

    // Cargar personas en select
    loadPersonasSelect() {
        const select = document.getElementById('tx-personaSelect');
        if (!select) return;

        const personas = DataManager.getAll('personasData');
        select.innerHTML = '<option value="">-- Seleccione persona --</option>';

        personas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.id;
            option.textContent = persona.nombre;
            select.appendChild(option);
        });
    },

    // Cargar campañas en select
    loadCampanasSelect() {
        const select = document.getElementById('tx-campanaSelect');
        if (!select) return;

        const campanas = DataManager.getAll('campanasData');
        select.innerHTML = '<option value="">-- Seleccione campaña --</option>';

        campanas.forEach(campana => {
            const option = document.createElement('option');
            option.value = campana.id;
            option.textContent = campana.nombre;
            select.appendChild(option);
        });
    },

    // Cargar categorías en select
    loadCategoriasSelect() {
        const select = document.getElementById('tx-categoria');
        if (!select) return;

        const categorias = DataManager.getAll('categoriasData') || [];
        select.innerHTML = '<option value="Otros">Otros</option>';

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.nombre;
            option.textContent = categoria.nombre;
            select.appendChild(option);
        });
    },

    // Inicializar tabla
    initTable() {
        console.log('Inicializando tabla de transacciones...');

        const container = document.getElementById('transacciones-table');
        if (!container) {
            console.error('Contenedor transacciones-table no encontrado. Reintentando en 500ms...');
            setTimeout(() => {
                this.initTable();
            }, 500);
            return;
        }

        // Limpiar contenedor
        container.innerHTML = '';

        // Botón de guardar personalizado
        const saveButton = function(cell) {
            const button = document.createElement("button");
            button.innerHTML = '<i class="bi bi-check-circle"></i>';
            button.className = "btn btn-success btn-sm me-1";
            button.title = "Guardar cambios";

            button.addEventListener("click", function(){
                const row = cell.getRow();
                const data = row.getData(); // Obtener datos actuales de la tabla (incluyendo ediciones)

                // Limpiar valores vacíos problemáticos
                if (data.personaId === "" || data.personaId === "-- Sin persona --") {
                    data.personaId = null;
                }
                if (data.campanaId === "" || data.campanaId === "-- Sin campaña --") {
                    data.campanaId = null;
                }

                // Validaciones
                if (!data.fecha || !data.concepto || !data.monto || data.monto <= 0) {
                    Utils.showToast('Por favor complete todos los campos obligatorios', 'error');
                    return;
                }

                if (!data.tipo || !['Ingreso', 'Gasto', 'Aporte'].includes(data.tipo)) {
                    Utils.showToast('Tipo de transacción inválido', 'error');
                    return;
                }

                // Validaciones específicas por tipo
                if (data.tipo === 'Aporte' && !data.personaId) {
                    Utils.showToast('Para aportes debe seleccionar una persona', 'error');
                    return;
                }

                // AHORA SÍ guardar los cambios permanentemente
                const success = DataManager.update('transaccionesData', data.id, data);

                if (success) {
                    // Recalcular datos dependientes
                    Calculations.recalcularPersonas();
                    Calculations.recalcularCampanas();

                    // Remover indicador visual de modificación
                    row.getElement().style.backgroundColor = '';

                    // Actualizar estadísticas sin recargar toda la tabla
                    TransaccionesView.mostrarEstadisticas();

                    // Forzar reformat de la fila para actualizar los formatters
                    setTimeout(() => {
                        row.reformat();
                    }, 100);

                    Utils.showToast('Transacción guardada exitosamente', 'success');
                } else {
                    Utils.showToast('Error al guardar la transacción', 'error');
                }
            });
            return button;
        };

        // Botón de descartar cambios
        const discardButton = function(cell) {
            const button = document.createElement("button");
            button.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i>';
            button.className = "btn btn-warning btn-sm me-1";
            button.title = "Descartar cambios";

            button.addEventListener("click", function(){
                const row = cell.getRow();
                const data = row.getData();

                // Obtener los datos originales del DataManager
                const originalData = DataManager.getById('transaccionesData', data.id);

                if (originalData) {
                    // Restaurar datos originales en la tabla
                    row.update(originalData);

                    // Remover indicador visual de modificación
                    row.getElement().style.backgroundColor = '';

                    // Forzar reformat para actualizar formatters
                    setTimeout(() => {
                        row.reformat();
                    }, 50);

                    Utils.showToast('Cambios descartados', 'info');
                } else {
                    Utils.showToast('Error al descartar cambios', 'error');
                }
            });
            return button;
        };

        // Botón de eliminar personalizado
        const deleteButton = function(cell) {
            const button = document.createElement("button");
            button.innerHTML = '<i class="bi bi-trash"></i>';
            button.className = "btn btn-danger btn-sm";
            button.title = "Eliminar transacción";

            button.addEventListener("click", async function(){
                const row = cell.getRow();
                const data = row.getData();

                const confirmed = await Utils.confirm(
                    `¿Estás seguro de eliminar la transacción "${data.concepto}"?`,
                    'Eliminar Transacción'
                );

                if (confirmed) {
                    TransaccionesView.eliminarTransaccion(data.id);
                }
            });
            return button;
        };

        // Formatter para botones de acción
        const actionButtons = function(cell) {
            const container = document.createElement("div");
            container.className = "d-flex gap-1";
            container.appendChild(saveButton(cell));
            container.appendChild(discardButton(cell));
            container.appendChild(deleteButton(cell));
            return container;
        };

        this.table = new Tabulator(container, {
            height: "500px",
            layout: "fitDataStretch",
            responsiveLayout: "collapse",
            responsiveLayoutCollapseStartOpen: false,
            pagination: "local",
            paginationSize: 15,
            paginationSizeSelector: [5, 10, 15, 20, 25, 50, 100],
            paginationCounter: "rows",
            movableColumns: true,
            resizableRows: true,
            resizableColumns: true,
            tooltips: true,
            columnDefaults: {
                tooltip: true,
                headerTooltip: true,
                resizable: true
            },
            placeholder: "No hay transacciones para mostrar",
            langs: {
                "es": {
                    "pagination": {
                        "page_size": "Tamaño:",
                        "first": "Primera",
                        "first_title": "Primera página",
                        "last": "Última",
                        "last_title": "Última página",
                        "prev": "Anterior",
                        "prev_title": "Página anterior",
                        "next": "Siguiente",
                        "next_title": "Página siguiente",
                        "all": "Todas"
                    }
                }
            },
            locale: "es",
            columns: [
                {
                    title: "ID",
                    field: "id",
                    width: 70,
                    minWidth: 50,
                    maxWidth: 100,
                    sorter: "number",
                    editor: false,
                    headerSort: true,
                    responsive: 0
                },
                {
                    title: "Fecha",
                    field: "fecha",
                    width: 130,
                    minWidth: 100,
                    maxWidth: 150,
                    editor: "input",
                    editorParams: { type: "date" },
                    validator: "required",
                    sorter: "date",
                    responsive: 1,
                    formatter: function(cell) {
                        const value = cell.getValue();
                        if (!value) return '';
                        const date = new Date(value);
                        return date.toLocaleDateString('es-CO');
                    }
                },
                {
                    title: "Tipo",
                    field: "tipo",
                    width: 100,
                    minWidth: 80,
                    maxWidth: 120,
                    editor: "select",
                    editorParams: {
                        values: {
                            "Ingreso": "Ingreso",
                            "Gasto": "Gasto",
                            "Aporte": "Aporte"
                        }
                    },
                    validator: "required",
                    responsive: 2,
                    formatter: function(cell) {
                        const value = cell.getValue();
                        const colors = {
                            "Ingreso": "bg-green-100 text-green-800",
                            "Gasto": "bg-red-100 text-red-800",
                            "Aporte": "bg-blue-100 text-blue-800"
                        };
                        const colorClass = colors[value] || "bg-gray-100 text-gray-800";
                        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colorClass}">${value}</span>`;
                    }
                },
                {
                    title: "Concepto",
                    field: "concepto",
                    width: 200,
                    minWidth: 150,
                    editor: "input",
                    validator: "required",
                    responsive: 3,
                    formatter: function(cell) {
                        const value = cell.getValue() || '';
                        return value.length > 30 ? value.substring(0, 30) + '...' : value;
                    }
                },
                {
                    title: "Categoría",
                    field: "categoria",
                    width: 150,
                    minWidth: 120,
                    editor: "select",
                    editorParams: function(cell) {
                        const categorias = DataManager.getAll('categoriasData') || [];
                        const values = { "Otros": "Otros" };
                        categorias.forEach(cat => {
                            values[cat.nombreCategoria] = cat.nombreCategoria;
                        });
                        return { values: values };
                    },
                    responsive: 4
                },
                {
                    title: "Monto",
                    field: "monto",
                    width: 140,
                    minWidth: 120,
                    maxWidth: 180,
                    editor: "number",
                    editorParams: { min: 0, step: 1000 },
                    validator: ["required", "min:1"],
                    responsive: 1,
                    sorter: "number",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        const moneda = cell.getRow().getData().moneda || 'COP';
                        const simbolo = moneda === 'USD' ? '$ ' : 'COP ';
                        const formatted = value.toLocaleString('es-CO');
                        return `<span class="font-semibold text-gray-900">${simbolo}${formatted}</span>`;
                    }
                },
                {
                    title: "Mon.",
                    field: "moneda",
                    width: 80,
                    minWidth: 60,
                    maxWidth: 100,
                    editor: "select",
                    editorParams: {
                        values: {
                            "COP": "COP",
                            "USD": "USD"
                        }
                    },
                    responsive: 5,
                    formatter: function(cell) {
                        const value = cell.getValue();
                        const colors = {
                            "COP": "bg-yellow-100 text-yellow-800",
                            "USD": "bg-green-100 text-green-800"
                        };
                        const colorClass = colors[value] || "bg-gray-100 text-gray-800";
                        return `<span class="px-1 py-0.5 rounded text-xs font-medium ${colorClass}">${value}</span>`;
                    }
                },
                {
                    title: "Persona",
                    field: "personaId",
                    width: 150,
                    minWidth: 120,
                    editor: "select",
                    editorParams: function(cell) {
                        const personas = DataManager.getAll('personasData');
                        const values = {};

                        personas.forEach(persona => {
                            values[persona.id] = persona.nombre;
                        });

                        // Si no hay personas, agregar opción por defecto
                        if (Object.keys(values).length === 0) {
                            values[""] = "Sin personas disponibles";
                        }

                        return { values: values };
                    },
                    responsive: 6,
                    formatter: function(cell) {
                        const personaId = cell.getValue();
                        if (!personaId) return '<span class="text-gray-400 italic">Sin persona</span>';
                        const persona = DataManager.getById('personasData', personaId);
                        return persona ? `<span class="text-blue-600 font-medium">${persona.nombre}</span>` : '<span class="text-gray-400 italic">Sin persona</span>';
                    }
                },
                {
                    title: "Campaña",
                    field: "campanaId",
                    width: 150,
                    minWidth: 120,
                    editor: "select",
                    editorParams: function(cell) {
                        const campanas = DataManager.getAll('campanasData');
                        const values = {};

                        campanas.forEach(campana => {
                            values[campana.id] = campana.nombre;
                        });

                        // Si no hay campañas, agregar opción por defecto
                        if (Object.keys(values).length === 0) {
                            values[""] = "Sin campañas disponibles";
                        }

                        return { values: values };
                    },
                    responsive: 7,
                    formatter: function(cell) {
                        const campanaId = cell.getValue();
                        if (!campanaId) return '<span class="text-gray-400 italic">Sin campaña</span>';
                        const campana = DataManager.getById('campanasData', campanaId);
                        return campana ? `<span class="text-purple-600 font-medium">${campana.nombre}</span>` : '<span class="text-gray-400 italic">Sin campaña</span>';
                    }
                },
                {
                    title: "Notas",
                    field: "notas",
                    width: 180,
                    minWidth: 150,
                    editor: "input",
                    responsive: 8,
                    formatter: function(cell) {
                        const value = cell.getValue() || '';
                        if (!value) return '<span class="text-gray-400 italic">Sin notas</span>';
                        return value.length > 25 ? value.substring(0, 25) + '...' : value;
                    }
                },
                {
                    title: "Acciones",
                    field: "acciones",
                    width: 160,
                    minWidth: 140,
                    maxWidth: 180,
                    formatter: actionButtons,
                    hozAlign: "center",
                    headerSort: false,
                    editor: false,
                    responsive: 0,
                    frozen: true
                }
            ]
        });

        // Cargar datos una vez la tabla esté construida
        this.table.on("tableBuilt", () => {
            this.loadData();
        });

        // Redimensionar tabla cuando cambie el tamaño de página
        this.table.on("pageSizeChanged", (size) => {
            setTimeout(() => {
                this.table.redraw(true);
            }, 100);
        });

        // Redimensionar tabla cuando cambie de página
        this.table.on("pageLoaded", (pageno) => {
            setTimeout(() => {
                this.table.redraw(true);
            }, 50);
        });

        // Redimensionar cuando se apliquen filtros
        this.table.on("dataFiltered", (filters, rows) => {
            setTimeout(() => {
                this.table.redraw(true);
            }, 50);
        });

        // IMPORTANTE: NO guardar automáticamente al editar celdas
        // Solo mantener cambios en la interfaz hasta presionar botón guardar
        this.table.on("cellEdited", (cell) => {
            const field = cell.getField();
            const value = cell.getValue();
            const row = cell.getRow();

            console.log(`Celda editada (solo en interfaz) - Campo: ${field}, Valor: ${value}`);

            // Marcar la fila como modificada visualmente
            row.getElement().style.backgroundColor = '#fef3c7'; // Fondo amarillo claro

            // Para campos de persona y campaña, asegurar que el formatter se actualice
            if (field === 'personaId' || field === 'campanaId') {
                setTimeout(() => {
                    cell.getRow().reformat();
                }, 50);
            }

            // NO guardar en DataManager aquí - solo mantener en la tabla
        });

        // Manejar cuando se cancela la edición
        this.table.on("cellEditCancelled", (cell) => {
            const field = cell.getField();
            const row = cell.getRow();
            console.log(`Edición cancelada - Campo: ${field}`);

            // Remover indicador visual de modificación
            row.getElement().style.backgroundColor = '';
        });

        // Manejar cuando se inicia la edición
        this.table.on("cellEditing", (cell) => {
            const field = cell.getField();
            const value = cell.getValue();
            console.log(`Iniciando edición - Campo: ${field}, Valor actual: ${value}`);
        });
    },

    // Cargar datos en tabla
    loadData() {
        if (!this.table) return;
        const transacciones = DataManager.getAll('transaccionesData');
        this.table.setData(transacciones);
        this.mostrarEstadisticas();

        // Refrescar los datos de los selects editables
        this.refreshSelectOptions();
    },

    // Refrescar opciones de los selects editables
    refreshSelectOptions() {
        if (!this.table) return;

        // Obtener las columnas que necesitan actualización
        const categoriaCol = this.table.getColumn("categoria");
        const personaCol = this.table.getColumn("personaId");
        const campanaCol = this.table.getColumn("campanaId");

        // Actualizar definiciones de columnas con nuevos datos
        if (categoriaCol) {
            categoriaCol.updateDefinition({
                editorParams: function(cell) {
                    const categorias = DataManager.getAll('categoriasData') || [];
                    const values = { "Otros": "Otros" };
                    categorias.forEach(cat => {
                        values[cat.nombreCategoria] = cat.nombreCategoria;
                    });
                    return { values: values };
                }
            });
        }

        if (personaCol) {
            personaCol.updateDefinition({
                editorParams: function(cell) {
                    const personas = DataManager.getAll('personasData');
                    const values = { "": "-- Sin persona --" };
                    personas.forEach(persona => {
                        values[persona.id] = persona.nombre;
                    });
                    return { values: values };
                }
            });
        }

        if (campanaCol) {
            campanaCol.updateDefinition({
                editorParams: function(cell) {
                    const campanas = DataManager.getAll('campanasData');
                    const values = { "": "-- Sin campaña --" };
                    campanas.forEach(campana => {
                        values[campana.id] = campana.nombre;
                    });
                    return { values: values };
                }
            });
        }
    },

    // Cargar selects de filtros
    loadFiltrosSelects() {
        // Filtro de categorías
        const filtroCategoria = document.getElementById('filtro-categoria');
        if (filtroCategoria) {
            const categorias = DataManager.getAll('categoriasData') || [];
            filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';

            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.nombreCategoria;
                option.textContent = categoria.nombreCategoria;
                filtroCategoria.appendChild(option);
            });
        }

        // Filtro de personas
        const filtroPersona = document.getElementById('filtro-persona');
        if (filtroPersona) {
            const personas = DataManager.getAll('personasData');
            filtroPersona.innerHTML = '<option value="">Todas las personas</option>';

            personas.forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.id;
                option.textContent = persona.nombre;
                filtroPersona.appendChild(option);
            });
        }

        // Filtro de campañas
        const filtroCampana = document.getElementById('filtro-campana');
        if (filtroCampana) {
            const campanas = DataManager.getAll('campanasData');
            filtroCampana.innerHTML = '<option value="">Todas las campañas</option>';

            campanas.forEach(campana => {
                const option = document.createElement('option');
                option.value = campana.id;
                option.textContent = campana.nombre;
                filtroCampana.appendChild(option);
            });
        }
    },

    // Agregar nueva transacción
    agregarTransaccion() {
        const fecha = document.getElementById('tx-fecha').value;
        const tipo = document.getElementById('tx-tipo').value;
        const concepto = document.getElementById('tx-concepto').value;
        const categoria = document.getElementById('tx-categoria').value;
        const monto = parseFloat(document.getElementById('tx-monto').value);
        const moneda = document.getElementById('tx-moneda').value || 'COP';
        const personaId = document.getElementById('tx-personaSelect').value;
        const campanaId = document.getElementById('tx-campanaSelect').value;

        // Validaciones
        if (!fecha || !concepto || !monto || isNaN(monto)) {
            Utils.showToast('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        if (monto <= 0) {
            Utils.showToast('El monto debe ser mayor a 0', 'error');
            return;
        }

        if (!tipo || !['Ingreso', 'Gasto', 'Aporte'].includes(tipo)) {
            Utils.showToast('Tipo de transacción inválido', 'error');
            return;
        }

        // Validaciones específicas por tipo
        if (tipo === 'Aporte' && !personaId) {
            Utils.showToast('Para aportes debe seleccionar una persona', 'error');
            return;
        }

        const nuevaTransaccion = {
            fecha,
            tipo,
            concepto,
            categoria: categoria || 'Otros',
            monto,
            personaId: personaId ? parseInt(personaId) : null,
            campanaId: campanaId ? parseInt(campanaId) : null,
            moneda: moneda,
            notas: ""
        };

        DataManager.add('transaccionesData', nuevaTransaccion);

        // Recalcular datos dependientes
        Calculations.recalcularPersonas();
        Calculations.recalcularCampanas();

        this.loadData();
        this.limpiarFormulario();

        // Actualizar selects en otras vistas
        Utils.actualizarSelectsEnFormularios();

        Utils.showToast('Transacción agregada exitosamente', 'success');

        console.log('Nueva transacción creada:', nuevaTransaccion);
    },

    // Eliminar transacción
    eliminarTransaccion(id) {
        try {
            const transaccion = DataManager.getById('transaccionesData', id);
            if (!transaccion) {
                Utils.showToast('Transacción no encontrada', 'error');
                return;
            }

            DataManager.delete('transaccionesData', id);

            // Recalcular datos dependientes
            Calculations.recalcularPersonas();
            Calculations.recalcularCampanas();

            this.loadData();
            Utils.showToast(`Transacción "${transaccion.concepto}" eliminada exitosamente`, 'success');

        } catch (error) {
            console.error('Error eliminando transacción:', error);
            Utils.showToast('Error al eliminar transacción: ' + error.message, 'error');
        }
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('tx-fecha').value = '';
        document.getElementById('tx-tipo').value = 'Ingreso';
        document.getElementById('tx-concepto').value = '';
        document.getElementById('tx-categoria').value = 'Otros';
        document.getElementById('tx-monto').value = '';
        document.getElementById('tx-moneda').value = 'COP';
        document.getElementById('tx-personaSelect').value = '';
        document.getElementById('tx-campanaSelect').value = '';

        // Reset fecha a hoy
        const fechaInput = document.getElementById('tx-fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
    },

    // Filtrar por tipo
    filtrarPorTipo(tipo) {
        if (!this.table) return;

        if (tipo && tipo !== 'Todos') {
            this.table.setFilter('tipo', '=', tipo);
        } else {
            this.table.clearFilter();
        }
    },

    // Filtrar por categoría
    filtrarPorCategoria(categoria) {
        if (!this.table) return;

        if (categoria && categoria !== 'Todas') {
            this.table.setFilter('categoria', '=', categoria);
        } else {
            this.table.clearFilter();
        }
    },

    // Filtrar por persona
    filtrarPorPersona(personaId) {
        if (!this.table) return;

        if (personaId) {
            this.table.setFilter('personaId', '=', parseInt(personaId));
        } else {
            this.table.clearFilter();
        }
    },

    // Filtrar por campaña
    filtrarPorCampana(campanaId) {
        if (!this.table) return;

        if (campanaId) {
            this.table.setFilter('campanaId', '=', parseInt(campanaId));
        } else {
            this.table.clearFilter();
        }
    },

    // Aplicar múltiples filtros
    aplicarFiltros() {
        if (!this.table) return;

        const filtros = [];

        const tipo = document.getElementById('filtro-tipo')?.value;
        if (tipo && tipo !== 'Todos') {
            filtros.push({ field: 'tipo', type: '=', value: tipo });
        }

        const categoria = document.getElementById('filtro-categoria')?.value;
        if (categoria && categoria !== 'Todas') {
            filtros.push({ field: 'categoria', type: '=', value: categoria });
        }

        const personaId = document.getElementById('filtro-persona')?.value;
        if (personaId) {
            filtros.push({ field: 'personaId', type: '=', value: parseInt(personaId) });
        }

        const campanaId = document.getElementById('filtro-campana')?.value;
        if (campanaId) {
            filtros.push({ field: 'campanaId', type: '=', value: parseInt(campanaId) });
        }

        if (filtros.length > 0) {
            this.table.setFilter(filtros);
        } else {
            this.table.clearFilter();
        }
    },

    // Limpiar todos los filtros
    limpiarFiltros() {
        if (!this.table) return;

        // Limpiar selects de filtro
        const filtroSelects = ['filtro-tipo', 'filtro-categoria', 'filtro-persona', 'filtro-campana'];
        filtroSelects.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        // Limpiar búsqueda
        const searchInput = document.getElementById('search-transacciones');
        if (searchInput) searchInput.value = '';

        this.table.clearFilter();
    },

    // Exportar transacciones
    exportarTransacciones() {
        const transacciones = DataManager.getAll('transaccionesData');
        const datosExportar = transacciones.map(t => {
            const persona = DataManager.getById('personasData', t.personaId);
            const campana = DataManager.getById('campanasData', t.campanaId);

            return {
                ID: t.id,
                Fecha: t.fecha,
                Tipo: t.tipo,
                Concepto: t.concepto,
                Categoría: t.categoria,
                Monto: t.monto,
                Moneda: t.moneda,
                Persona: persona ? persona.nombre : 'Sin persona',
                Campaña: campana ? campana.nombre : 'Sin campaña',
                Notas: t.notas
            };
        });

        Utils.exportToCSV(datosExportar, 'transacciones_export');
        Utils.showToast('Datos de transacciones exportados', 'success');
    },

    // Calcular totales por tipo
    calcularTotales() {
        const transacciones = DataManager.getAll('transaccionesData');

        const ingresos = transacciones
            .filter(t => t.tipo === 'Ingreso')
            .reduce((acc, t) => acc + (t.monto || 0), 0);

        const gastos = transacciones
            .filter(t => t.tipo === 'Gasto')
            .reduce((acc, t) => acc + (t.monto || 0), 0);

        const aportes = transacciones
            .filter(t => t.tipo === 'Aporte')
            .reduce((acc, t) => acc + (t.monto || 0), 0);

        return {
            ingresos,
            gastos,
            aportes,
            balance: ingresos - gastos
        };
    },

    // Mostrar estadísticas
    mostrarEstadisticas() {
        const totales = this.calcularTotales();
        const statsContainer = document.getElementById('transacciones-stats');

        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-green-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-green-600 font-medium">Total Ingresos</p>
                        <p class="text-2xl font-bold text-green-800">COP ${Utils.formatearMoneda(totales.ingresos)}</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-red-600 font-medium">Total Gastos</p>
                        <p class="text-2xl font-bold text-red-800">COP ${Utils.formatearMoneda(totales.gastos)}</p>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-blue-600 font-medium">Total Aportes</p>
                        <p class="text-2xl font-bold text-blue-800">COP ${Utils.formatearMoneda(totales.aportes)}</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg text-center">
                        <p class="text-sm text-purple-600 font-medium">Balance</p>
                        <p class="text-2xl font-bold ${totales.balance >= 0 ? 'text-green-800' : 'text-red-800'}">
                            COP ${Utils.formatearMoneda(totales.balance)}
                        </p>
                    </div>
                </div>
            `;
        }
    },

    // Configurar eventos específicos de la vista
    setupEvents() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('search-transacciones');
        if (searchInput) {
            // Guardar referencia al handler para poder limpiarlo después
            this.searchHandler = (e) => {
                const searchTerm = e.target.value.toLowerCase();
                if (this.table) {
                    this.table.setFilter([
                        [
                            {field: "concepto", type: "like", value: searchTerm},
                            {field: "categoria", type: "like", value: searchTerm},
                            {field: "notas", type: "like", value: searchTerm}
                        ]
                    ]);
                }
            };

            // Remover listener anterior si existe
            searchInput.removeEventListener('input', this.searchHandler);
            // Agregar nuevo listener
            searchInput.addEventListener('input', this.searchHandler);
        }

        // Redimensionar tabla al cambiar el tamaño de la ventana
        this.resizeHandler = () => {
            if (this.table) {
                setTimeout(() => {
                    this.table.redraw(true);
                    this.table.recalc();
                }, 100);
            }
        };

        // Remover listeners anteriores si existen
        window.removeEventListener('resize', this.resizeHandler);
        window.removeEventListener('orientationchange', this.resizeHandler);

        // Agregar nuevos listeners
        window.addEventListener('resize', this.resizeHandler);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.table) {
                    this.table.redraw(true);
                    this.table.recalc();
                }
            }, 200);
        });
    },

    // Refrescar tabla después de cambios
    refreshTable() {
        console.log('Refrescando tabla de transacciones...');

        if (!this.initialized) {
            console.log('Vista no inicializada, inicializando...');
            this.init();
            return;
        }

        if (this.table) {
            try {
                this.loadData();
                this.loadFiltrosSelects();
                this.refreshSelectOptions();
                // Forzar redimensionamiento para evitar columnas negras
                setTimeout(() => {
                    if (this.table) {
                        this.table.redraw(true);
                        this.table.recalc();
                    }
                }, 100);
                console.log('Tabla refrescada correctamente');
            } catch (error) {
                console.error('Error refrescando tabla:', error);
                // Si hay error, reinicializar completamente
                this.init();
            }
        } else {
            console.log('Tabla no existe, inicializando...');
            this.initTable();
        }
    },

    // Forzar redimensionamiento de la tabla
    forceResize() {
        if (this.table) {
            this.table.redraw(true);
            this.table.recalc();
        }
    },

    // Verificar si hay cambios pendientes de guardar
    hasUnsavedChanges() {
        if (!this.table) return false;

        const rows = this.table.getRows();
        return rows.some(row => {
            const element = row.getElement();
            return element.style.backgroundColor.includes('254, 243, 199'); // Color amarillo de modificación
        });
    },

    // Obtener número de filas modificadas
    getModifiedRowsCount() {
        if (!this.table) return 0;

        const rows = this.table.getRows();
        return rows.filter(row => {
            const element = row.getElement();
            return element.style.backgroundColor.includes('254, 243, 199');
        }).length;
    },

    // Limpiar recursos al salir de la vista
    cleanup() {
        console.log('Limpiando TransaccionesView...');

        // Verificar cambios pendientes antes de limpiar
        if (this.hasUnsavedChanges()) {
            const modifiedCount = this.getModifiedRowsCount();
            const shouldContinue = confirm(
                `Tienes ${modifiedCount} fila(s) con cambios sin guardar. ` +
                `¿Estás seguro de que quieres salir sin guardar?`
            );

            if (!shouldContinue) {
                return false; // Cancelar la navegación
            }
        }

        // Destruir tabla si existe
        if (this.table) {
            try {
                this.table.destroy();
            } catch (error) {
                console.warn('Error destruyendo tabla:', error);
            }
            this.table = null;
        }

        // Remover event listeners de redimensionamiento
        if (this.resizeHandler) {
            try {
                window.removeEventListener('resize', this.resizeHandler);
                window.removeEventListener('orientationchange', this.resizeHandler);
            } catch (error) {
                console.warn('Error removiendo event listeners:', error);
            }
            this.resizeHandler = null;
        }

        // Limpiar event listeners del formulario
        const searchInput = document.getElementById('search-transacciones');
        if (searchInput) {
            searchInput.removeEventListener('input', this.searchHandler);
        }

        // Marcar como no inicializada
        this.initialized = false;

        console.log('TransaccionesView limpiada correctamente');
        return true; // Permitir la navegación
    }
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('transacciones-table')) {
            TransaccionesView.init();
        }
    });
} else {
    if (document.getElementById('transacciones-table')) {
        TransaccionesView.init();
    }
}
