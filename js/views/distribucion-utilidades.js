// Distribución de Utilidades View
window.DistribucionUtilidadesView = {
    table: null,

    // Inicializar vista
    init() {
        console.log('Inicializando vista Distribución de Utilidades...');
        this.setupForm();
        this.initTable();
        console.log('Distribución de Utilidades vista inicializada');
    },

    // Configurar formulario
    setupForm() {
        const fechaInput = document.getElementById('du-fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }

        // Sugerir período actual
        const periodoInput = document.getElementById('du-periodo');
        if (periodoInput && !periodoInput.value) {
            const ahora = new Date();
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            periodoInput.value = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
        }
    },

    // Inicializar tabla
    initTable() {
        const container = document.getElementById('distribucion-utilidades-table');
        if (!container) return;

        this.table = new Tabulator(container, {
            height: "400px",
            layout: "fitColumns",
            responsiveLayout: false, // <--- Cambiado para que nunca oculte columnas
            pagination: "local",
            paginationSize: 15,
            columns: [
                { title: "ID", field: "id", width: 60 },
                { title: "Período", field: "periodo", width: 120 },
                { title: "Fecha", field: "fecha", width: 100 },
                {
                    title: "Utilidad Total",
                    field: "utilidadTotal",
                    width: 140,
                    formatter: function(cell) {
                        const value = cell.getValue();
                        return 'COP ' + (value || 0).toLocaleString('es-CO');
                    }
                },
                {
                    title: "Estado",
                    field: "estado",
                    width: 100,
                    formatter: (cell) => {
                        const estado = cell.getValue() || 'Pendiente';
                        const color = estado === 'Distribuida' ? 'success' : 'warning';
                        return `<span class="badge bg-${color}">${estado}</span>`;
                    }
                },
                {
                    title: "Distribuido",
                    field: "distribuido",
                    width: 120,
                    formatter: (cell) => {
                        const distribucionDetalle = DataManager.getAll('distribucionDetalleData');
                        const distribucionId = cell.getRow().getData().id;
                        const detalle = distribucionDetalle.filter(d => d.distribucionId === distribucionId);
                        const totalDistribuido = detalle.reduce((acc, d) => acc + (d.monto || 0), 0);
                        return 'COP ' + totalDistribuido.toLocaleString('es-CO');
                    }
                },
                {
                    title: "Acciones",
                    field: "acciones",
                    width: 150,
                    formatter: () => {
                        return `
                            <button class="btn btn-sm btn-info me-1" onclick="DistribucionUtilidadesView.verDetalle(this)">
                                Detalle
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="DistribucionUtilidadesView.eliminarDistribucion(this)">
                                Eliminar
                            </button>
                        `;
                    }
                }
            ]
        });

        // Esperar a que la tabla se inicialice antes de cargar datos
        this.table.on("tableBuilt", () => {
            this.loadData();
        });
    },

    // Cargar datos en tabla
    loadData() {
        if (!this.table) return;

        const distribuciones = DataManager.getAll('distribucionUtilidadesData');
        this.table.setData(distribuciones);
    },

    // Agregar nueva distribución
    agregarDistribucion() {
        const periodo = document.getElementById('du-periodo').value.trim();
        const fecha = document.getElementById('du-fecha').value;
        const utilidadTotal = parseFloat(document.getElementById('du-utilidad').value);

        // Validaciones
        if (!periodo || !fecha || !utilidadTotal || isNaN(utilidadTotal)) {
            Utils.showToast('Por favor complete todos los campos', 'error');
            return;
        }

        if (utilidadTotal <= 0) {
            Utils.showToast('La utilidad debe ser mayor a 0', 'error');
            return;
        }

        // Verificar duplicados por período
        const distribuciones = DataManager.getAll('distribucionUtilidadesData');
        const existe = distribuciones.some(d => d.periodo.toLowerCase() === periodo.toLowerCase());

        if (existe) {
            if (!confirm('Ya existe una distribución para este período. ¿Desea continuar?')) {
                return;
            }
        }

        const nuevaDistribucion = {
            periodo,
            fecha,
            utilidadTotal,
            estado: 'Pendiente'
        };

        const distribucionCreada = DataManager.add('distribucionUtilidadesData', nuevaDistribucion);
        this.loadData();
        this.limpiarFormulario();
        Utils.showToast('Distribución de utilidades creada exitosamente', 'success');

        // Preguntar si quiere distribuir automáticamente
        if (confirm('¿Desea distribuir automáticamente las utilidades entre las personas activas?')) {
            this.distribuirAutomaticamente(distribucionCreada.id);
        }
    },

    // Distribuir automáticamente entre personas
    distribuirAutomaticamente(distribucionId) {
        try {
            Calculations.repartirUtilidadAutomatica(distribucionId);
            this.loadData();
            Utils.showToast('Utilidades distribuidas automáticamente', 'success');
        } catch (error) {
            console.error('Error distribuyendo automáticamente:', error);
            Utils.showToast(error.message || 'Error al distribuir automáticamente', 'error');
        }
    },

    // Ver detalle de distribución
    verDetalle(button) {
        const row = this.table.getRow(button.closest('tr'));
        const distribucion = row.getData();

        // Redirigir a la vista de distribución detalle con filtro
        if (window.Navigation) {
            window.Navigation.loadView('distribucionDetalle');

            // Esperar a que se cargue y filtrar
            setTimeout(() => {
                if (window.DistribucionDetalleView && window.DistribucionDetalleView.filtrarPorDistribucion) {
                    window.DistribucionDetalleView.filtrarPorDistribucion(distribucion.id);
                }
            }, 500);
        }
    },

    // Eliminar distribución
    eliminarDistribucion(button) {
        const row = this.table.getRow(button.closest('tr'));
        const distribucion = row.getData();

        // Verificar si tiene detalles
        const distribucionDetalle = DataManager.getAll('distribucionDetalleData');
        const tieneDetalles = distribucionDetalle.some(d => d.distribucionId === distribucion.id);

        let mensaje = `¿Estás seguro de eliminar la distribución "${distribucion.periodo}"?`;
        if (tieneDetalles) {
            mensaje += '\n\nEsto también eliminará todos los detalles de distribución asociados.';
        }

        if (confirm(mensaje)) {
            // Eliminar detalles primero
            if (tieneDetalles) {
                const detallesAEliminar = distribucionDetalle.filter(d => d.distribucionId === distribucion.id);
                detallesAEliminar.forEach(detalle => {
                    DataManager.delete('distribucionDetalleData', detalle.id);
                });
            }

            // Eliminar distribución
            DataManager.delete('distribucionUtilidadesData', distribucion.id);
            this.loadData();
            Utils.showToast('Distribución eliminada', 'success');
        }
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('du-periodo').value = '';
        document.getElementById('du-utilidad').value = '';

        // Reset fecha a hoy
        const fechaInput = document.getElementById('du-fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
    },

    // Cleanup
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
        console.log('Distribución Utilidades view cleanup completado');
    }
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('distribucion-utilidades-table')) {
            DistribucionUtilidadesView.init();
        }
    });
} else {
    if (document.getElementById('distribucion-utilidades-table')) {
        DistribucionUtilidadesView.init();
    }
}
