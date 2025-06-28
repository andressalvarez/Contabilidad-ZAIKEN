// Valor Hora View - Script principal
(function() {
    let valorHoraTable = null;

    // Función principal que se ejecuta al cargar la vista
    function initValorHora() {
        console.log('Inicializando vista Valor por Hora...');

        // Configurar eventos
        setupEvents();

        // Inicializar tabla
        initTable();

        // Actualizar estadísticas
        updateStats();

        // Actualizar selects
        Utils.actualizarSelectsEnFormularios();

        // Configurar fecha por defecto
        const fechaInput = document.getElementById('valorhora-fechaInicio');
        if (fechaInput) {
            fechaInput.value = Utils.formatDate(new Date());
        }

        // Configurar calculadora
        setupCalculator();

        console.log('Vista Valor por Hora inicializada');
    }

    // Configurar eventos específicos de la vista
    function setupEvents() {
        // Formulario de agregar valor hora
        const form = document.getElementById('form-valor-hora');
        if (form) {
            form.addEventListener('submit', handleAddValorHora);
        }

        // Búsqueda en tabla
        const searchInput = document.getElementById('search-valor-hora');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                if (valorHoraTable) {
                    valorHoraTable.setFilter([
                        {field: "nombrePersona", type: "like", value: e.target.value},
                        {field: "valor", type: "like", value: e.target.value}
                    ]);
                }
            }, 300));
        }
    }

    // Configurar calculadora rápida
    function setupCalculator() {
        const calcHoras = document.getElementById('calc-horas');
        const calcValor = document.getElementById('calc-valor');
        const calcResultado = document.getElementById('calc-resultado');

        if (calcHoras && calcValor && calcResultado) {
            const calculate = () => {
                const horas = parseFloat(calcHoras.value) || 0;
                const valor = parseFloat(calcValor.value) || 0;
                const total = horas * valor;
                calcResultado.textContent = Utils.formatCurrency(total);
            };

            calcHoras.addEventListener('input', calculate);
            calcValor.addEventListener('input', calculate);
        }
    }

    // Inicializar tabla Tabulator
    function initTable() {
        const tableElement = document.getElementById('valor-hora-table');
        if (!tableElement) return;

        // Botón de eliminar personalizado
        const deleteButton = function(cell) {
            const button = document.createElement("button");
            button.innerHTML = '<i class="bi bi-trash"></i>';
            button.className = "btn btn-danger btn-sm";
            button.title = "Eliminar valor";

            button.addEventListener("click", async function(){
                const row = cell.getRow();
                const data = row.getData();

                const confirmed = await Utils.confirm(
                    `¿Estás seguro de eliminar el valor por hora de ${data.nombrePersona}?`,
                    'Eliminar Valor por Hora'
                );

                if (confirmed) {
                    eliminarValorHora(data.id);
                }
            });
            return button;
        };

        // Datos enriquecidos con nombre de persona
        const enrichedData = DataManager.getAll('valorHoraData').map(vh => {
            const persona = DataManager.getById('personasData', vh.personaId);
            return {
                ...vh,
                nombrePersona: persona ? persona.nombre : 'Persona no encontrada'
            };
        });

        valorHoraTable = new Tabulator(tableElement, {
            data: enrichedData,
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
                    title: "Persona",
                    field: "nombrePersona",
                    headerFilter: "input"
                },
                {
                    title: "Valor por Hora",
                    field: "valor",
                    editor: "number",
                    editorParams: { min: 0, step: 1000 },
                    validator: ["required", "min:0"],
                    formatter: function(cell) {
                        const value = cell.getValue();
                        return Utils.formatCurrency(value);
                    }
                },
                {
                    title: "Fecha Inicio",
                    field: "fechaInicio",
                    editor: "date",
                    formatter: function(cell) {
                        const value = cell.getValue();
                        return value ? Utils.formatDate(new Date(value)) : '';
                    }
                },
                {
                    title: "Notas",
                    field: "notas",
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
                DataManager.update('valorHoraData', data.id, data);
                Calculations.recalcularPersonas();
                updateStats();
                Utils.showToast('Valor por hora actualizado', 'success');
            }
        });
    }

    // Manejar formulario de agregar valor hora
    function handleAddValorHora(e) {
        e.preventDefault();

        const formData = {
            personaId: parseInt(document.getElementById('valorhora-personaId').value),
            valor: parseFloat(document.getElementById('valorhora-valor').value) || 0,
            fechaInicio: document.getElementById('valorhora-fechaInicio').value
        };

        // Validación
        const validation = Utils.validateForm(formData, {
            personaId: { required: true, label: 'Persona' },
            valor: { required: true, min: 0, label: 'Valor por Hora' },
            fechaInicio: { required: true, label: 'Fecha de Inicio' }
        });

        if (!validation.isValid) {
            Utils.showToast(validation.errors[0], 'error');
            return;
        }

        // Verificar si ya existe un valor para esta persona en la misma fecha
        const existingValue = DataManager.getAll('valorHoraData')
            .find(vh => vh.personaId === formData.personaId && vh.fechaInicio === formData.fechaInicio);

        if (existingValue) {
            Utils.showToast('Ya existe un valor para esta persona en la fecha especificada', 'error');
            return;
        }

        // Agregar valor hora
        const newValorHora = DataManager.add('valorHoraData', formData);

        // Enriquecer con nombre de persona para la tabla
        const persona = DataManager.getById('personasData', newValorHora.personaId);
        const enrichedData = {
            ...newValorHora,
            nombrePersona: persona ? persona.nombre : 'Persona no encontrada'
        };

        // Actualizar tabla
        valorHoraTable.addRow(enrichedData);

        // Recalcular sistema
        Calculations.recalcularPersonas();

        // Actualizar estadísticas
        updateStats();

        // Actualizar selects
        Utils.actualizarSelectsEnFormularios();

        // Limpiar formulario
        Utils.clearForm('form-valor-hora');

        // Restablecer fecha
        document.getElementById('valorhora-fechaInicio').value = Utils.formatDate(new Date());

        Utils.showToast('Valor por hora agregado exitosamente', 'success');
    }

    // Eliminar valor hora
    function eliminarValorHora(valorHoraId) {
        try {
            // Eliminar valor hora
            DataManager.delete('valorHoraData', valorHoraId);

            // Actualizar tabla
            valorHoraTable.deleteRow(valorHoraId);

            // Recalcular sistema
            Calculations.recalcularPersonas();

            // Actualizar estadísticas
            updateStats();

            Utils.showToast('Valor por hora eliminado exitosamente', 'success');

        } catch (error) {
            console.error('Error eliminando valor por hora:', error);
            Utils.showToast('Error al eliminar el valor por hora', 'error');
        }
    }

    // Actualizar estadísticas
    function updateStats() {
        const valoresHora = DataManager.getAll('valorHoraData');
        const personas = DataManager.getAll('personasData');

        const valores = valoresHora.map(vh => vh.valor);
        const valorPromedio = valores.length > 0 ?
            valores.reduce((sum, val) => sum + val, 0) / valores.length : 0;
        const valorMaximo = valores.length > 0 ? Math.max(...valores) : 0;
        const personasConValor = new Set(valoresHora.map(vh => vh.personaId)).size;

        // Actualizar elementos
        const valorPromedioEl = document.getElementById('stat-valor-promedio');
        const personasValorEl = document.getElementById('stat-personas-valor');
        const valorMaximoEl = document.getElementById('stat-valor-maximo');

        if (valorPromedioEl) valorPromedioEl.textContent = Utils.formatCurrency(valorPromedio);
        if (personasValorEl) personasValorEl.textContent = personasConValor;
        if (valorMaximoEl) valorMaximoEl.textContent = Utils.formatCurrency(valorMaximo);
    }

    // Exportar valores por hora a CSV
    function exportarValorHora() {
        const valoresHora = DataManager.getAll('valorHoraData').map(vh => {
            const persona = DataManager.getById('personasData', vh.personaId);
            return {
                ...vh,
                nombrePersona: persona ? persona.nombre : 'N/A'
            };
        });
        Utils.exportToCSV(valoresHora, 'valores-por-hora');
    }

    // Recalcular todo
    function recalcularTodo() {
        Calculations.recalcularTodo();
        updateStats();
        Utils.showToast('Sistema recalculado', 'success');
    }

    // Refrescar tabla
    function refreshTable() {
        if (valorHoraTable) {
            const enrichedData = DataManager.getAll('valorHoraData').map(vh => {
                const persona = DataManager.getById('personasData', vh.personaId);
                return {
                    ...vh,
                    nombrePersona: persona ? persona.nombre : 'Persona no encontrada'
                };
            });
            valorHoraTable.replaceData(enrichedData);
            updateStats();
            Utils.showToast('Tabla actualizada', 'info');
        }
    }

    // Función de limpieza al salir de la vista
    function cleanup() {
        if (valorHoraTable) {
            valorHoraTable.destroy();
            valorHoraTable = null;
        }
        console.log('Valor Hora view cleanup completado');
    }

    // Exponer funciones globalmente
    window.exportarValorHora = exportarValorHora;
    window.recalcularTodo = recalcularTodo;
    window.refreshTable = refreshTable;
    window.refreshCurrentView = () => {
        refreshTable();
        updateStats();
    };
    window.currentViewCleanup = cleanup;

    // Inicializar vista
    initValorHora();

})();
