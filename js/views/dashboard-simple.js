// Dashboard View - Versión simplificada funcional
window.DashboardView = {
    // Inicializar vista
    init() {
        console.log('Inicializando Dashboard...');
        this.generarResumen();
    },

    // Generar resumen básico
    generarResumen() {
        try {
            const resumenEl = document.getElementById('dashboard-resumen');
            if (!resumenEl) return;

            // Obtener datos
            const transacciones = DataManager.getAll('transaccionesData') || [];
            const registroHoras = DataManager.getAll('registroHorasData') || [];

            // Calcular totales
            const totalIngresos = transacciones
                .filter(t => t.tipo === "Ingreso")
                .reduce((acc, t) => acc + (t.monto || 0), 0);

            const totalGastos = transacciones
                .filter(t => t.tipo === "Gasto")
                .reduce((acc, t) => acc + (t.monto || 0), 0);

            const totalAportes = transacciones
                .filter(t => t.tipo === "Aporte")
                .reduce((acc, t) => acc + (t.monto || 0), 0);

            const balance = totalIngresos - totalGastos;

            const horasTotales = registroHoras
                .reduce((acc, rh) => acc + (rh.horas || 0), 0);

            // Mostrar resumen
            resumenEl.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div class="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm">Ingresos Totales</p>
                                <p class="text-2xl font-bold">COP ${this.formatearMoneda(totalIngresos)}</p>
                            </div>
                            <i class="bi bi-arrow-up-circle text-3xl opacity-80"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-red-400 to-red-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-red-100 text-sm">Gastos Totales</p>
                                <p class="text-2xl font-bold">COP ${this.formatearMoneda(totalGastos)}</p>
                            </div>
                            <i class="bi bi-arrow-down-circle text-3xl opacity-80"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm">Balance</p>
                                <p class="text-2xl font-bold ${balance >= 0 ? '' : 'text-red-200'}">COP ${this.formatearMoneda(balance)}</p>
                            </div>
                            <i class="bi bi-wallet2 text-3xl opacity-80"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100 text-sm">Horas Totales</p>
                                <p class="text-2xl font-bold">${horasTotales}</p>
                            </div>
                            <i class="bi bi-clock text-3xl opacity-80"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-lg border">
                    <h3 class="text-lg font-semibold mb-4">Resumen Detallado</h3>
                    <p><strong>Ingresos Totales:</strong> COP ${this.formatearMoneda(totalIngresos)}</p>
                    <p><strong>Gastos Totales:</strong> COP ${this.formatearMoneda(totalGastos)}</p>
                    <p><strong>Balance:</strong> COP ${this.formatearMoneda(balance)}</p>
                    <p><strong>Aportes Totales:</strong> COP ${this.formatearMoneda(totalAportes)}</p>
                    <p><strong>Horas Totales:</strong> ${horasTotales}</p>
                </div>
            `;

            console.log('Resumen generado exitosamente');

        } catch (error) {
            console.error('Error generando resumen:', error);
            const resumenEl = document.getElementById('dashboard-resumen');
            if (resumenEl) {
                resumenEl.innerHTML = '<p class="text-red-600">Error cargando resumen</p>';
            }
        }
    },

    // Formatear moneda
    formatearMoneda(monto) {
        if (typeof monto !== 'number') return '0';
        return monto.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    },

    // Aplicar filtro de fechas (básico)
    aplicarFiltroFechas() {
        console.log('Aplicando filtros de fecha...');
        this.generarResumen();
    },

    // Limpiar filtros
    limpiarFiltroFechas() {
        console.log('Limpiando filtros...');
        const startDate = document.getElementById('dashboard-startDate');
        const endDate = document.getElementById('dashboard-endDate');
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        this.generarResumen();
    },

    // Cleanup
    cleanup() {
        console.log('Dashboard cleanup');
    }
};

// Auto-inicializar cuando se carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('dashboard-resumen')) {
            DashboardView.init();
        }
    });
} else {
    if (document.getElementById('dashboard-resumen')) {
        DashboardView.init();
    }
}
