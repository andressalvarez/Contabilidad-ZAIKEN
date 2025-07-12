// Vista Estadísticas - Agrupa todas las gráficas principales del sistema
window.EstadisticasView = {
    charts: {},
    initialized: false,

    async init() {
        // Esperar a que el DOM esté listo
        await new Promise(res => setTimeout(res, 100));
        this.renderGraficas();
        this.initialized = true;
    },

    renderGraficas() {
        this.renderIngresosGastos();
        this.renderGastosCategoria();
        this.renderCampanasPerformance();
        this.renderAportesUtilidades();
    },

    renderIngresosGastos() {
        const ctx = document.getElementById('estadisticas-chart-ingresos-gastos');
        const container = ctx?.parentElement;
        if (!ctx) return;
        const trans = DataManager.getAll('transaccionesData');
        const ingresos = trans.filter(t => t.tipo === 'Ingreso').reduce((acc, t) => acc + (t.monto || 0), 0);
        const gastos = trans.filter(t => t.tipo === 'Gasto').reduce((acc, t) => acc + (t.monto || 0), 0);
        if (ingresos === 0 && gastos === 0) {
            if (container) container.innerHTML = '<div class="text-center text-gray-400 py-8">No hay datos de ingresos ni gastos para mostrar.</div>';
            return;
        }
        this.charts.ingresosGastos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Gastos'],
                datasets: [{
                    label: 'COP',
                    data: [ingresos, gastos],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            }
        });
    },

    renderGastosCategoria() {
        const ctx = document.getElementById('estadisticas-chart-gastos-categoria');
        const container = ctx?.parentElement;
        if (!ctx) return;
        const trans = DataManager.getAll('transaccionesData').filter(t => t.tipo === 'Gasto');
        const categorias = {};
        trans.forEach(t => {
            categorias[t.categoria] = (categorias[t.categoria] || 0) + (t.monto || 0);
        });
        const labels = Object.keys(categorias);
        const values = Object.values(categorias);
        if (labels.length === 0) {
            if (container) container.innerHTML = '<div class="text-center text-gray-400 py-8">No hay datos de gastos por categoría para mostrar.</div>';
            return;
        }
        this.charts.gastosCategoria = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#6366f1','#f59e42','#10b981','#ef4444','#fbbf24','#3b82f6','#a21caf','#eab308','#0ea5e9','#f472b6'
                    ]
                }]
            }
        });
    },

    renderCampanasPerformance() {
        const ctx = document.getElementById('estadisticas-chart-campanas-performance');
        const container = ctx?.parentElement;
        if (!ctx) return;
        const campanas = DataManager.getAll('campanasData');
        const labels = campanas.map(c => c.nombre);
        // Buscar los campos correctos de ingresos e inversión
        const ingresos = campanas.map(c => c.ingresos || c.ingresosGenerados || c.ingresoTotalReal || 0);
        const gastos = campanas.map(c => c.inversion || c.inversionReal || c.gastoTotalReal || 0);
        // Si no hay campañas o todos los valores son cero, mostrar mensaje
        const hayDatos = ingresos.some(v => v > 0) || gastos.some(v => v > 0);
        if (labels.length === 0 || !hayDatos) {
            if (container) container.innerHTML = '<div class="text-center text-gray-400 py-8">No hay datos de campañas para mostrar.</div>';
            return;
        }
        this.charts.campanasPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Ingresos', data: ingresos, backgroundColor: '#10b981' },
                    { label: 'Gastos', data: gastos, backgroundColor: '#ef4444' }
                ]
            },
            options: {
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true }
                },
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    renderAportesUtilidades() {
        const ctx = document.getElementById('estadisticas-chart-aportes-utilidades');
        const container = ctx?.parentElement;
        if (!ctx) return;
        const trans = DataManager.getAll('transaccionesData');
        const aportes = trans.filter(t => t.tipo === 'Aporte').reduce((acc, t) => acc + (t.monto || 0), 0);
        const utilidades = DataManager.getAll('distribucionUtilidadesData').reduce((acc, d) => acc + (d.utilidadTotal || 0), 0);
        if (aportes === 0 && utilidades === 0) {
            if (container) container.innerHTML = '<div class="text-center text-gray-400 py-8">No hay datos de aportes ni utilidades para mostrar.</div>';
            return;
        }
        this.charts.aportesUtilidades = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Aportes', 'Utilidades'],
                datasets: [{
                    data: [aportes, utilidades],
                    backgroundColor: ['#3b82f6', '#f59e42']
                }]
            }
        });
    },

    // Futuro: filtros, exportar, etc.
    cleanup() {
        // Destruir charts si existen
        Object.values(this.charts).forEach(chart => { if (chart && chart.destroy) chart.destroy(); });
        this.charts = {};
        this.initialized = false;
    }
};
