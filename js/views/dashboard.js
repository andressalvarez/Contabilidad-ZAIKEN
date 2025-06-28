// Dashboard View - Script principal
window.DashboardView = {
    chartIngresoGastos: null,
    chartGastosCategoria: null,
    boundHandleFiltersChanged: null,

    // Función principal que se ejecuta al cargar la vista
    init() {
        console.log('Inicializando Dashboard...');

        // Configurar eventos específicos del dashboard
        this.setupDashboardEvents();

        // Configurar gráficos
        this.setupCharts();

        // Generar resumen inicial (después de crear gráficos)
        this.generarResumen();

        // Escuchar cambios de filtros
        this.boundHandleFiltersChanged = this.handleFiltersChanged.bind(this);
        App.onEvent('filtersChanged', this.boundHandleFiltersChanged);

        console.log('Dashboard inicializado');
    },

    // Configurar eventos específicos del dashboard
    setupDashboardEvents() {
        // Configurar input de backup
        const backupInput = document.getElementById('backupFileInput');
        if (backupInput) {
            backupInput.onchange = function(event) {
                const file = event.target.files[0];
                if (file) {
                    App.importarBackup(file);
                }
            };
        }

        // Actualizar timestamp de última actualización
        this.updateLastUpdateTime();
        setInterval(() => this.updateLastUpdateTime(), 60000); // Cada minuto
    },

    // Configurar gráficos
    setupCharts() {
        // Destruir gráficos existentes si los hay
        if (this.chartIngresoGastos) {
            this.chartIngresoGastos.destroy();
        }
        if (this.chartGastosCategoria) {
            this.chartGastosCategoria.destroy();
        }

        // Configurar gráfico de Ingresos vs Gastos
        const ctxIngresoGastos = document.getElementById('chart-ingresos-gastos');
        if (ctxIngresoGastos) {
            this.chartIngresoGastos = new Chart(ctxIngresoGastos, {
                type: 'bar',
                data: {
                    labels: ['Ingresos', 'Gastos'],
                    datasets: [{
                        label: 'Monto (COP)',
                        data: [0, 0],
                        backgroundColor: ['#10B981', '#EF4444'],
                        borderColor: ['#059669', '#DC2626'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'COP ' + Utils.formatearMoneda(value);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Configurar gráfico de Gastos por Categoría
        const ctxGastosCategoria = document.getElementById('chart-gastos-categoria');
        if (ctxGastosCategoria) {
            this.chartGastosCategoria = new Chart(ctxGastosCategoria, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: Utils.generateColors(10)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    },

    // Generar resumen del dashboard
    generarResumen() {
        try {
            // Obtener filtros actuales
            const filtros = App.getGlobalFilters();

            // Calcular métricas
            const resumen = Calculations.calcularResumen(filtros);

            // Actualizar KPIs
            this.updateKPIs(resumen);

            // Actualizar métricas adicionales
            this.updateAdditionalMetrics(resumen);

            // Actualizar gráficos
            this.updateCharts(filtros);

            console.log('Resumen generado:', resumen);

        } catch (error) {
            console.error('Error generando resumen:', error);
            if (Utils && Utils.showToast) {
                Utils.showToast('Error al generar resumen', 'error');
            }
        }
    },

    // Actualizar KPIs principales
    updateKPIs(resumen) {
        const ingresosEl = document.getElementById('kpi-ingresos');
        const gastosEl = document.getElementById('kpi-gastos');
        const balanceEl = document.getElementById('kpi-balance');
        const horasEl = document.getElementById('kpi-horas');

        if (ingresosEl) ingresosEl.textContent = 'COP ' + Utils.formatearMoneda(resumen.totalIngresos);
        if (gastosEl) gastosEl.textContent = 'COP ' + Utils.formatearMoneda(resumen.totalGastos);
        if (balanceEl) {
            balanceEl.textContent = 'COP ' + Utils.formatearMoneda(resumen.balance);
            balanceEl.className = 'text-2xl font-extrabold text-white';
        }
        if (horasEl) horasEl.textContent = resumen.horasTotales + ' hrs';
    },

    // Actualizar métricas adicionales
    updateAdditionalMetrics(resumen) {
        const aportesEl = document.getElementById('metric-aportes');
        const utilidadesEl = document.getElementById('metric-utilidades');
        const transaccionesEl = document.getElementById('metric-transacciones');
        const personasEl = document.getElementById('metric-personas');
        const campanasEl = document.getElementById('metric-campanas');

        if (aportesEl) aportesEl.textContent = 'COP ' + Utils.formatearMoneda(resumen.totalAportes);
        if (utilidadesEl) utilidadesEl.textContent = 'COP ' + Utils.formatearMoneda(resumen.utilidadesDistribuidas);
        if (transaccionesEl) transaccionesEl.textContent = resumen.transaccionesCount;
        if (personasEl) personasEl.textContent = resumen.personasActivas;
        if (campanasEl) campanasEl.textContent = resumen.campanasActivas;
    },

    // Actualizar gráficos
    updateCharts(filtros) {
        this.updateIngresoGastosChart(filtros);
        this.updateGastosCategoriaChart(filtros);
    },

    // Actualizar gráfico de Ingresos vs Gastos
    updateIngresoGastosChart(filtros) {
        if (!this.chartIngresoGastos) return;

        const resumen = Calculations.calcularResumen(filtros);

        this.chartIngresoGastos.data.datasets[0].data = [resumen.totalIngresos, resumen.totalGastos];
        this.chartIngresoGastos.update();
    },

    // Actualizar gráfico de Gastos por Categoría
    updateGastosCategoriaChart(filtros) {
        if (!this.chartGastosCategoria) return;

        // Obtener transacciones filtradas
        let transacciones = DataManager.getAll('transaccionesData');

        if (filtros && (filtros.startDate || filtros.endDate)) {
            transacciones = Calculations.filtrarPorFechas(transacciones, filtros);
        }

        // Calcular gastos por categoría
        const gastosPorCategoria = {};
        transacciones
            .filter(t => t.tipo === 'Gasto')
            .forEach(t => {
                const categoria = t.categoria || 'Sin categoría';
                gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + t.monto;
            });

        // Preparar datos para el gráfico
        const labels = Object.keys(gastosPorCategoria);
        const data = Object.values(gastosPorCategoria);

        if (labels.length === 0) {
            labels.push('Sin datos');
            data.push(0);
        }

        this.chartGastosCategoria.data.labels = labels;
        this.chartGastosCategoria.data.datasets[0].data = data;
        this.chartGastosCategoria.data.datasets[0].backgroundColor = Utils.generateColors(labels.length);
        this.chartGastosCategoria.update();
    },

    // Manejar cambios en filtros
    handleFiltersChanged(event) {
        const filtros = event.detail;
        console.log('Filtros cambiados:', filtros);
        this.generarResumen();
    },

    // Actualizar timestamp de última actualización
    updateLastUpdateTime() {
        const lastUpdateEl = document.getElementById('last-update');
        if (lastUpdateEl) {
            const now = new Date();
            lastUpdateEl.textContent = now.toLocaleTimeString('es-CO');
        }
    },

    // Función de limpieza al salir de la vista
    cleanup() {
        if (this.chartIngresoGastos) {
            this.chartIngresoGastos.destroy();
            this.chartIngresoGastos = null;
        }
        if (this.chartGastosCategoria) {
            this.chartGastosCategoria.destroy();
            this.chartGastosCategoria = null;
        }

        // Remover event listeners específicos del dashboard
        if (this.boundHandleFiltersChanged) {
            document.removeEventListener('filtersChanged', this.boundHandleFiltersChanged);
            this.boundHandleFiltersChanged = null;
        }

        console.log('Dashboard cleanup completado');
    },

    // Wrappers para compatibilidad con plantilla
    aplicarFiltroFechas() {
        window.App.aplicarFiltroFechas();
    },
    limpiarFiltroFechas() {
        window.App.limpiarFiltroFechas();
    }
}; // Fin definición DashboardView

// Exponer funciones globales para compatibilidad
window.generarResumen = window.DashboardView.generarResumen.bind(window.DashboardView);
window.refreshCurrentView = window.DashboardView.generarResumen.bind(window.DashboardView);
window.currentViewCleanup = window.DashboardView.cleanup.bind(window.DashboardView);

// Inicializar DashboardView cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.DashboardView.init();
    });
} else {
    window.DashboardView.init();
}
