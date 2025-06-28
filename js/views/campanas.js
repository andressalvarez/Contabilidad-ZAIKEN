// Vista de Campañas
window.CampanasView = {
    table: null,
    initialized: false,
    // Gráficos de campañas
    chartIngGast: null,
    chartRentabilidad: null,

    // Inicializar vista
    init() {
        if (this.initialized) {
            this.refreshTable();
            return;
        }

        console.log('Inicializando Campañas...');
        this.setupTable();
        this.setupForm();

        // Configurar gráficos (se crearán después de que el DOM incluya los canvas)
        this.setupCharts();

        this.initialized = true;
        console.log('Campañas vista inicializada');
    },

    // Configurar formulario
    setupForm() {
        // Establecer fechas por defecto
        Utils.setDefaultDatesToToday();

        // Configurar validaciones de fechas
        const fechaInicio = document.getElementById('camp-fechaInicio');
        const fechaFin = document.getElementById('camp-fechaFin');

        if (fechaInicio && fechaFin) {
            fechaInicio.addEventListener('change', () => {
                if (fechaFin.value && fechaInicio.value > fechaFin.value) {
                    Utils.showToast('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
                    fechaInicio.value = '';
                }
            });

            fechaFin.addEventListener('change', () => {
                if (fechaInicio.value && fechaFin.value < fechaInicio.value) {
                    Utils.showToast('La fecha de fin no puede ser anterior a la fecha de inicio', 'error');
                    fechaFin.value = '';
                }
            });
        }
    },

    // Configurar tabla
    setupTable() {
        const tableContainer = document.getElementById('campanas-table');
        if (!tableContainer) return;

        this.table = new Tabulator(tableContainer, {
            height: "400px",
            layout: "fitColumns",
            responsiveLayout: "hide",
            pagination: "local",
            paginationSize: 15,
            columns: [
                { title: "ID", field: "id", width: 50 },
                {
                    title: "Nombre",
                    field: "nombre",
                    editor: "input",
                    validator: "required"
                },
                {
                    title: "Fecha Inicio",
                    field: "fechaInicio",
                    editor: "input",
                    sorter: "date",
                    validator: "required"
                },
                {
                    title: "Fecha Fin",
                    field: "fechaFin",
                    editor: "input",
                    sorter: "date",
                    validator: "required"
                },
                {
                    title: "Presupuesto (COP)",
                    field: "presupuesto",
                    editor: "number",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return 'COP ' + value.toLocaleString('es-CO');
                    }
                },
                {
                    title: "Objetivo Ingresos (COP)",
                    field: "objetivoIngresos",
                    editor: "number",
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return 'COP ' + value.toLocaleString('es-CO');
                    }
                },
                {
                    title: "Horas Invertidas",
                    field: "horasInvertidas",
                    editor: false,
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return value + 'h';
                    }
                },
                {
                    title: "Gasto Real (COP)",
                    field: "gastoTotalReal",
                    editor: false,
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return 'COP ' + value.toLocaleString('es-CO');
                    }
                },
                {
                    title: "Ingreso Real (COP)",
                    field: "ingresoTotalReal",
                    editor: false,
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        return 'COP ' + value.toLocaleString('es-CO');
                    }
                },
                {
                    title: "Rentabilidad (COP)",
                    field: "rentabilidadReal",
                    editor: false,
                    formatter: function(cell) {
                        const value = cell.getValue() || 0;
                        const className = value >= 0 ? 'text-green-600' : 'text-red-600';
                        return `<span class="${className}">COP ${value.toLocaleString('es-CO')}</span>`;
                    }
                },
                {
                    title: "Notas",
                    field: "notas",
                    editor: "input"
                },
                {
                    title: "Acciones",
                    formatter: this.deleteButtonFormatter,
                    width: 100,
                    hozAlign: "center",
                    headerSort: false
                }
            ],
            cellEdited: (cell) => {
                const data = cell.getRow().getData();

                // Validar fechas al editar
                if (data.fechaInicio && data.fechaFin && new Date(data.fechaInicio) > new Date(data.fechaFin)) {
                    Utils.showToast('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
                    cell.restoreOldValue();
                    return;
                }

                DataManager.update('campanasData', data.id, data);
                Calculations.recalcularCampanas();
                this.refreshTable();
                Utils.showToast('Campaña actualizada', 'success');
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

        const campanas = DataManager.getAll('campanasData');
        this.table.setData(campanas);

        // Actualizar gráficos con la data más reciente
        this.updateCharts();
    },

    // ✅ CORREGIDO: Agregar nueva campaña
    agregarCampana() {
        const nombre = document.getElementById("camp-nombre").value.trim();
        const fechaInicio = document.getElementById("camp-fechaInicio").value;
        const fechaFin = document.getElementById("camp-fechaFin").value;
        const presupuesto = +document.getElementById("camp-presupuesto").value || 0;
        const objetivoIngresos = +document.getElementById("camp-objetivoIngresos").value || 0;

        // Validaciones
        if (!nombre) {
            Utils.showToast("Debe ingresar un nombre de campaña", "error");
            return;
        }

        if (!fechaInicio || !fechaFin) {
            Utils.showToast("Debe ingresar fechas de inicio y fin", "error");
            return;
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            Utils.showToast("La fecha de inicio no puede ser posterior a la fecha de fin", "error");
            return;
        }

        // Verificar duplicados
        const campanas = DataManager.getAll('campanasData');
        const existe = campanas.some(c => c.nombre.toLowerCase() === nombre.toLowerCase());

        if (existe) {
            Utils.showToast('Ya existe una campaña con ese nombre', 'error');
            return;
        }

        // Crear nueva campaña con la misma estructura que el sistema original
        const nuevaCampana = {
            nombre,
            fechaInicio,
            fechaFin,
            presupuesto,
            objetivoIngresos,
            horasInvertidas: 0,
            gastoTotalReal: 0,
            ingresoTotalReal: 0,
            rentabilidadReal: 0,
            notas: ""
        };

        // ✅ CORREGIDO: Usar DataManager.add() en lugar de DataManager.agregar()
        const campanaCreada = DataManager.add('campanasData', nuevaCampana);

        // Recalcular campañas
        Calculations.recalcularCampanas();

        // Refrescar tabla
        this.loadData();

        // Limpiar formulario
        this.limpiarFormulario();

        // Actualizar selects en otras vistas
        Utils.actualizarSelectsEnFormularios();

        Utils.showToast(`Campaña "${nombre}" creada exitosamente`, "success");

        console.log('Nueva campaña creada:', campanaCreada);
    },

    // Formatter para botón eliminar
    deleteButtonFormatter(cell) {
        const button = document.createElement("button");
        button.innerHTML = '<i class="bi bi-trash"></i>';
        button.classList.add("btn", "btn-danger", "btn-sm");
        button.title = "Eliminar campaña";

        button.addEventListener("click", async function(){
            const row = cell.getRow();
            const data = row.getData();

            const confirmed = await Utils.confirm(
                `¿Eliminar campaña "${data.nombre}"? Esto también eliminará todos los registros de horas y transacciones relacionadas.`,
                'Eliminar Campaña'
            );

            if (confirmed) {
                CampanasView.eliminarCampana(data.id);
            }
        });

        return button;
    },

    // Eliminar campaña
    eliminarCampana(campanaId) {
        try {
            const campana = DataManager.getById('campanasData', campanaId);
            if (!campana) {
                Utils.showToast('Campaña no encontrada', 'error');
                return;
            }

            // Eliminar registros relacionados
            const registroHoras = DataManager.getAll('registroHorasData');
            const transacciones = DataManager.getAll('transaccionesData');

            // Eliminar horas relacionadas
            registroHoras.filter(rh => rh.campanaId === campanaId)
                .forEach(rh => DataManager.delete('registroHorasData', rh.id));

            // Eliminar transacciones relacionadas
            transacciones.filter(t => t.campanaId === campanaId)
                .forEach(t => DataManager.delete('transaccionesData', t.id));

            // Eliminar la campaña
            DataManager.delete('campanasData', campanaId);

            // Recalcular todo el sistema
            Calculations.recalcularTodo();

            // Refrescar tabla
            this.loadData();

            // Actualizar selects en otras vistas
            Utils.actualizarSelectsEnFormularios();

            Utils.showToast(`Campaña "${campana.nombre}" eliminada exitosamente`, "success");

        } catch (error) {
            console.error('Error eliminando campaña:', error);
            Utils.showToast('Error al eliminar campaña: ' + error.message, 'error');
        }
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById("camp-nombre").value = "";
        document.getElementById("camp-fechaInicio").value = "";
        document.getElementById("camp-fechaFin").value = "";
        document.getElementById("camp-presupuesto").value = "";
        document.getElementById("camp-objetivoIngresos").value = "";
    },

    // Refrescar tabla
    refreshTable() {
        if (this.table) {
            this.loadData();
        }
    },

    // Exportar campañas
    exportarCampanas() {
        const campanas = DataManager.getAll('campanasData');
        const datosExportar = campanas.map(c => ({
            ID: c.id,
            Nombre: c.nombre,
            'Fecha Inicio': c.fechaInicio,
            'Fecha Fin': c.fechaFin,
            'Presupuesto': c.presupuesto,
            'Objetivo Ingresos': c.objetivoIngresos,
            'Horas Invertidas': c.horasInvertidas,
            'Gasto Real': c.gastoTotalReal,
            'Ingreso Real': c.ingresoTotalReal,
            'Rentabilidad': c.rentabilidadReal,
            'Notas': c.notas
        }));

        Utils.exportToCSV(datosExportar, 'campanas_export');
        Utils.showToast('Datos de campañas exportados', 'success');
    },

    // ---------------------------
    //  GRÁFICOS
    // ---------------------------
    setupCharts() {
        // Esperar un pequeño delay para asegurar que los canvas existan
        setTimeout(() => {
            // Destruir existentes
            if (this.chartIngGast) {
                this.chartIngGast.destroy();
                this.chartIngGast = null;
            }
            if (this.chartRentabilidad) {
                this.chartRentabilidad.destroy();
                this.chartRentabilidad = null;
            }

            const ctxIG = document.getElementById('camp-chart-ing-gast');
            const ctxRent = document.getElementById('camp-chart-rentabilidad');

            if (ctxIG) {
                this.chartIngGast = new Chart(ctxIG, {
                    type: 'bar',
                    data: { labels: [], datasets: [
                        { label: 'Ingresos', data: [], backgroundColor: '#10B981' },
                        { label: 'Gastos', data: [], backgroundColor: '#EF4444' }
                    ] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v)=> 'COP '+Utils.formatearMoneda(v) } } } }
                });
            }

            if (ctxRent) {
                this.chartRentabilidad = new Chart(ctxRent, {
                    type: 'bar',
                    data: { labels: [], datasets: [
                        { label: 'Rentabilidad', data: [], backgroundColor: '#3B82F6' }
                    ] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v)=> 'COP '+Utils.formatearMoneda(v) } } } }
                });
            }

            // Una vez creados, actualizar con datos reales
            this.updateCharts();
        }, 300);
    },

    updateCharts() {
        if (!this.chartIngGast || !this.chartRentabilidad) return; // Aún no creados

        const campanas = DataManager.getAll('campanasData');
        if (!campanas || campanas.length === 0) return;

        const labels = campanas.map(c => c.nombre);
        const ingresos = campanas.map(c => c.ingresoTotalReal || 0);
        const gastos = campanas.map(c => c.gastoTotalReal || 0);
        const rentabilidad = campanas.map(c => c.rentabilidadReal || 0);

        // Ingresos vs Gastos
        this.chartIngGast.data.labels = labels;
        this.chartIngGast.data.datasets[0].data = ingresos;
        this.chartIngGast.data.datasets[1].data = gastos;
        this.chartIngGast.update();

        // Rentabilidad
        this.chartRentabilidad.data.labels = labels;
        this.chartRentabilidad.data.datasets[0].data = rentabilidad;
        this.chartRentabilidad.data.datasets[0].backgroundColor = rentabilidad.map(v => v >= 0 ? '#10B981' : '#EF4444');
        this.chartRentabilidad.update();
    },

    // Cleanup
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }

        // Destruir gráficos
        if (this.chartIngGast) {
            this.chartIngGast.destroy();
            this.chartIngGast = null;
        }
        if (this.chartRentabilidad) {
            this.chartRentabilidad.destroy();
            this.chartRentabilidad = null;
        }

        this.initialized = false;
        console.log('Campañas view cleanup completado');
    }
};

// Función global para compatibilidad con el sistema original
window.agregarCampana = function() {
    CampanasView.agregarCampana();
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('campanas-table')) {
            CampanasView.init();
        }
    });
} else {
    if (document.getElementById('campanas-table')) {
        CampanasView.init();
    }
}
