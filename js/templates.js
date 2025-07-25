// Templates HTML embebidos para evitar problemas de CORS
window.Templates = {
    dashboard: `
        <div class="space-y-8">
            <!-- Encabezado y filtros -->
            <div class="bg-white rounded-xl shadow p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <i class="bi bi-speedometer2"></i>
                    Dashboard de Resúmenes
                    <span id="last-update" class="text-sm text-gray-500 ml-auto"></span>
                </h2>

                <!-- Filtros de fecha -->
                <div class="flex flex-wrap items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-2">
                        <label for="dashboard-startDate" class="text-sm font-medium text-gray-700">Desde:</label>
                        <input type="date" id="dashboard-startDate" class="px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="dashboard-endDate" class="text-sm font-medium text-gray-700">Hasta:</label>
                        <input type="date" id="dashboard-endDate" class="px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    <div class="flex gap-2">
                        <button onclick="DashboardView.aplicarFiltroFechas()" class="btn btn-primary flex items-center gap-1">
                            <i class="bi bi-funnel"></i>Filtrar
                        </button>
                        <button onclick="DashboardView.limpiarFiltroFechas()" class="btn btn-secondary flex items-center gap-1">
                            <i class="bi bi-x-circle"></i>Limpiar
                        </button>
                    </div>
                </div>

                <!-- KPIs principales -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div class="p-4 rounded-lg shadow-lg text-center bg-emerald-600 text-white">
                        <p class="text-sm font-medium text-emerald-100/80 mb-1">Ingresos</p>
                        <p id="kpi-ingresos" class="text-2xl font-extrabold">--</p>
                    </div>
                    <div class="p-4 rounded-lg shadow-lg text-center bg-rose-600 text-white">
                        <p class="text-sm font-medium text-rose-100/80 mb-1">Gastos</p>
                        <p id="kpi-gastos" class="text-2xl font-extrabold">--</p>
                    </div>
                    <div class="p-4 rounded-lg shadow-lg text-center bg-sky-600 text-white">
                        <p class="text-sm font-medium text-sky-100/80 mb-1">Balance</p>
                        <p id="kpi-balance" class="text-2xl font-extrabold">--</p>
                    </div>
                    <div class="p-4 rounded-lg shadow-lg text-center bg-amber-400 text-gray-900">
                        <p class="text-sm font-medium text-gray-900/80 mb-1">Horas Totales</p>
                        <p id="kpi-horas" class="text-2xl font-extrabold">--</p>
                    </div>
                </div>

                <!-- Métricas adicionales -->
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10 text-center">
                    <div class="bg-gray-50 shadow-sm p-4 rounded-md border border-gray-100">
                        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Aportes</p>
                        <p id="metric-aportes" class="text-lg font-semibold text-gray-700">--</p>
                    </div>
                    <div class="bg-gray-50 shadow-sm p-4 rounded-md border border-gray-100">
                        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Utilidades Distribuidas</p>
                        <p id="metric-utilidades" class="text-lg font-semibold text-gray-700">--</p>
                    </div>
                    <div class="bg-gray-50 shadow-sm p-4 rounded-md border border-gray-100">
                        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Transacciones</p>
                        <p id="metric-transacciones" class="text-lg font-semibold text-gray-700">--</p>
                    </div>
                    <div class="bg-gray-50 shadow-sm p-4 rounded-md border border-gray-100">
                        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Personas Activas</p>
                        <p id="metric-personas" class="text-lg font-semibold text-gray-700">--</p>
                    </div>
                    <div class="bg-gray-50 shadow-sm p-4 rounded-md border border-gray-100">
                        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Tipos de Gasto Activos</p>
                        <p id="metric-campanas" class="text-lg font-semibold text-gray-700">--</p>
                    </div>
                </div>

                <!-- Gráficas en tarjetas -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Ingresos vs Gastos</h3>
                        <div class="relative w-full h-72"><canvas id="chart-ingresos-gastos" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Gastos por Tipo de Gasto</h3>
                        <div class="relative w-full h-72"><canvas id="chart-gastos-categoria" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                </div>

                <!-- Acciones -->
                <div class="flex flex-wrap gap-3">
                    <button onclick="DashboardView.generarResumen()" class="btn btn-primary flex items-center gap-1">
                        <i class="bi bi-arrow-clockwise"></i>Actualizar Resumen
                    </button>
                    <button onclick="DataManager.exportBackup()" class="btn btn-warning flex items-center gap-1">
                        <i class="bi bi-download"></i>Descargar Backup
                    </button>
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" id="backup-incluir-config" checked>
                        Incluir configuración personalizada (filtros globales, grupos/carpetas de estadísticas, preferencias de navegación)
                    </label>
                    <label for="backupFileInput" class="btn btn-success flex items-center gap-1 cursor-pointer">
                        <i class="bi bi-upload"></i>Cargar Backup
                    </label>
                    <input type="file" id="backupFileInput" accept="application/json" style="display:none">
                </div>
            </div>
        </div>
    `,

    personas: `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-people mr-2"></i>
                    Gestión de Personas
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" id="persona-nombre" placeholder="Nombre" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <select id="persona-rolSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione rol --</option>
                        </select>
                        <button onclick="PersonasView.agregarPersona()" class="btn btn-primary">
                            Agregar Persona
                        </button>
                    </div>
                </div>
                <div id="personas-table"></div>
            </div>
        </div>
    `,

    roles: `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-diagram-3 mr-2"></i>
                    Gestión de Roles
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" id="rol-nombreRol" placeholder="Nombre del rol" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <input type="number" id="rol-importancia" placeholder="Importancia %" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="RolesView.agregarRol()" class="btn btn-primary">
                            Crear Rol
                        </button>
                    </div>
                </div>
                <div id="roles-table"></div>
            </div>
        </div>
    `,

    "valor-hora": `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-currency-dollar mr-2"></i>
                    Gestión de Valor por Hora
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select id="vh-personaSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione persona --</option>
                        </select>
                        <select id="vh-rolSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione rol --</option>
                        </select>
                        <input type="number" id="vh-valor" placeholder="Valor por hora" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="ValorHoraView.agregarValorHora()" class="btn btn-primary">
                            Asignar Valor
                        </button>
                    </div>
                </div>
                <div id="valor-hora-table"></div>
            </div>
        </div>
    `,

    "registro-horas": `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-clock mr-2"></i>
                    Registro de Horas
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input type="date" id="rh-fecha" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <select id="rh-personaSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione persona --</option>
                        </select>
                        <select id="rh-campanaSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione tipo de gasto --</option>
                        </select>
                        <input type="number" step="0.5" id="rh-horas" placeholder="Horas" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="RegistroHorasView.agregarRegistroHora()" class="btn btn-primary">
                            Registrar
                        </button>
                    </div>
                </div>
                <div id="registro-horas-table"></div>
            </div>
        </div>
    `,

    campanas: `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-receipt"></i>
                    Gestión de Gastos
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input type="text" id="camp-nombre" placeholder="Nombre campaña" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <input type="date" id="camp-fechaInicio" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <input type="date" id="camp-fechaFin" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="number" id="camp-presupuesto" placeholder="Presupuesto" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <input type="number" id="camp-objetivoIngresos" placeholder="Objetivo ingresos" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="CampanasView.agregarCampana()" class="btn btn-primary">
                            Crear Campaña
                        </button>
                    </div>
                </div>
                <div id="campanas-table"></div>
                <!-- Gráficas de Campañas -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8" id="campanas-charts">
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Ingresos vs Gastos por Campaña</h3>
                        <div class="relative w-full h-72"><canvas id="camp-chart-ing-gast" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Rentabilidad Real por Campaña</h3>
                        <div class="relative w-full h-72"><canvas id="camp-chart-rentabilidad" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                </div>
            </div>
        </div>
    `,

    transacciones: `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-cash-stack mr-2"></i>
                    Gestión de Transacciones
                </h2>

                <!-- Estadísticas -->
                <div id="transacciones-stats" class="mb-6"></div>

                <!-- Formulario de agregar transacción -->
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <input type="date" id="tx-fecha" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <select id="tx-tipo" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="Ingreso">Ingreso</option>
                            <option value="Gasto">Gasto</option>
                            <option value="Aporte">Aporte</option>
                        </select>
                        <input type="text" id="tx-concepto" placeholder="Concepto" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <select id="tx-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="number" id="tx-monto" placeholder="Monto (COP)" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <select id="tx-moneda" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="COP">COP</option>
                            <option value="USD">USD</option>
                        </select>
                        <select id="tx-personaSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione persona --</option>
                        </select>
                        <select id="tx-campanaSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione tipo de gasto --</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-1 gap-4 mt-4">
                        <button onclick="TransaccionesView.agregarTransaccion()" class="btn btn-primary w-full sm:w-auto">
                            Agregar Transacción
                        </button>
                    </div>
                </div>

                <!-- Filtros y búsqueda -->
                <div class="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filtros y Búsqueda</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                        <input type="date" id="filtro-startDate" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        <input type="date" id="filtro-endDate" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        <input type="text" id="search-transacciones" placeholder="Buscar..." class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <select id="filtro-tipo" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Todos los tipos</option>
                            <option value="Ingreso">Ingreso</option>
                            <option value="Gasto">Gasto</option>
                            <option value="Aporte">Aporte</option>
                        </select>
                        <select id="filtro-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Todas las categorías</option>
                        </select>
                        <select id="filtro-persona" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Todas las personas</option>
                        </select>
                        <select id="filtro-campana" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Todos los tipos de gasto</option>
                        </select>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <button onclick="TransaccionesView.aplicarFiltros()" class="btn btn-sm btn-secondary w-full sm:w-auto">
                            Filtrar
                        </button>
                        <button onclick="TransaccionesView.limpiarFiltros()" class="btn btn-sm btn-outline w-full sm:w-auto">
                            Limpiar
                        </button>
                        <button onclick="TransaccionesView.exportarTransacciones()" class="btn btn-sm btn-success w-full sm:w-auto">
                            <i class="bi bi-download mr-1"></i>
                            Exportar CSV
                        </button>
                        <button onclick="TransaccionesView.mostrarEstadisticas()" class="btn btn-sm btn-info w-full sm:w-auto">
                            <i class="bi bi-bar-chart mr-1"></i>
                            Actualizar Stats
                        </button>
                    </div>
                </div>

                <!-- Filtro de persona para gráficas -->
                <div class="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label for="charts-persona-filter" class="text-sm font-medium text-gray-700">Filtrar persona (gráficas):</label>
                    <select id="charts-persona-filter" class="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto">
                        <option value="">Todas</option>
                    </select>
                </div>
                <!-- Gráficas de Transacciones -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10" id="transacciones-charts">
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Ingresos y Gastos Mensuales</h3>
                        <div class="relative w-full h-72"><canvas id="tx-chart-mensual" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Gastos por Tipo de Gasto (Top 10)</h3>
                        <div class="relative w-full h-72"><canvas id="tx-chart-gastos-cat" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                </div>

                <!-- Tabla de transacciones -->
                <div id="transacciones-table"></div>
            </div>
        </div>
    `,

    categorias: `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-tags mr-2"></i>
                    Gestión de Categorías
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" id="categoria-nombre" placeholder="Nombre de la categoría" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="CategoriasView.agregarCategoria()" class="btn btn-primary">
                            Agregar Categoría
                        </button>
                    </div>
                </div>
                <div id="categorias-table"></div>
            </div>
        </div>
    `,

    "distribucion-utilidades": `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-pie-chart mr-2"></i>
                    Distribución de Utilidades
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" id="du-periodo" placeholder="Ej: Enero 2025" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <input type="date" id="du-fecha" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <input type="number" id="du-utilidad" placeholder="Utilidad Total (COP)" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="DistribucionUtilidadesView.agregarDistribucion()" class="btn btn-primary">
                            Agregar Distribución
                        </button>
                    </div>
                </div>
                <div id="distribucion-utilidades-table"></div>
            </div>
        </div>
    `,

    "distribucion-detalle": `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="bi bi-list-check mr-2"></i>
                    Distribución Detalle
                </h2>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <select id="dd-distSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione distribución --</option>
                        </select>
                        <select id="dd-personaSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">-- Seleccione persona --</option>
                        </select>
                        <input type="number" id="dd-participacion" placeholder="Participación %" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="date" id="dd-fecha" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="DistribucionDetalleView.agregarDistribucionDetalle()" class="btn btn-primary">
                            Agregar Detalle
                        </button>
                        <button onclick="DistribucionDetalleView.repartirUtilidadAutomatica()" class="btn btn-warning">
                            Repartir Automático
                        </button>
                    </div>
                </div>
                <div id="distribucion-detalle-table"></div>
            </div>
        </div>
    `,

    estadisticas: `
        <div class="space-y-8">
            <div class="bg-white rounded-xl shadow p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <i class="bi bi-bar-chart-fill"></i>
                    Estadísticas Generales
                </h2>
                <div class="mb-6">
                    <p class="text-gray-600">Aquí puedes ver todas las gráficas del sistema agrupadas. Pronto podrás filtrar y personalizar esta sección.</p>
                </div>
                <!-- Filtros escalables -->
                <div id="estadisticas-filtros" class="mb-8 flex flex-wrap gap-4"></div>
                <!-- Gráficas agrupadas -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Ingresos vs Gastos</h3>
                        <div class="relative w-full h-72"><canvas id="estadisticas-chart-ingresos-gastos" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Gastos por Categoría</h3>
                        <div class="relative w-full h-72"><canvas id="estadisticas-chart-gastos-categoria" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Histórico de Gastos e Ingresos</h3>
                        <div class="relative w-full h-72"><canvas id="estadisticas-chart-campanas-performance" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                    <div class="bg-white shadow rounded-lg p-4 overflow-hidden">
                        <h3 class="graph-title">Aportes y Utilidades</h3>
                        <div class="relative w-full h-72"><canvas id="estadisticas-chart-aportes-utilidades" class="absolute inset-0 w-full h-full"></canvas></div>
                    </div>
                </div>
                <!-- VS de Categorías MEJORADO -->
                <div class="bg-white shadow-lg rounded-xl p-6 mt-8 border border-gray-200">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <i class="bi bi-bar-chart-steps text-blue-600"></i>
                                VS de Categorías
                            </h3>
                            <p class="text-sm text-gray-600 mt-1">Análisis comparativo por grupos y carpetas organizadas</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                <i class="bi bi-graph-up mr-1"></i>
                                Análisis Avanzado
                            </span>
                        </div>
                    </div>

                    <!-- Gestión de Grupos y Carpetas -->
                    <div class="mb-8">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="bi bi-folder-check"></i>
                            Organización de Métricas
                        </h4>
                        <div id="vs-categorias-chips" class="min-h-[120px]">
                            <!-- Los chips de grupos y carpetas se cargan aquí dinámicamente -->
                        </div>
                    </div>

                    <!-- Filtros Avanzados -->
                    <div class="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="bi bi-funnel"></i>
                            Filtros de Análisis
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Transacción</label>
                                <select id="vs-tipo-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="Gasto">💸 Gastos</option>
                                    <option value="Ingreso">💰 Ingresos</option>
                                    <option value="Aporte">🤝 Aportes</option>
                                    <option value="Todos">📊 Todos</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Desde</label>
                                <input type="date" id="vs-fecha-desde"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Hasta</label>
                                <input type="date" id="vs-fecha-hasta"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Gráfica</label>
                                <select id="vs-chart-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="bar">📊 Barras</option>
                                    <option value="line">📈 Líneas</option>
                                    <option value="pie">🥧 Circular</option>
                                    <option value="doughnut">🍩 Dónut</option>
                                </select>
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Exportar</label>
                                <button type="button" id="vs-export-img"
                                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                                    📸 Imagen
                                </button>
                                <button type="button" id="vs-export-csv"
                                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                    📄 CSV
                                </button>
                            </div>
                        </div>
                    </div>

                                        <!-- Tip sobre funcionalidad drill-down -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                                <i class="bi bi-lightbulb text-blue-600 text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-sm font-semibold text-blue-900 mb-1">💡 Funcionalidad Interactiva</h4>
                                <p class="text-sm text-blue-800 mb-2">
                                    <strong>Haz clic en cualquier segmento del gráfico</strong> para ver detalles expandibles tipo Notion:
                                    lista de transacciones, análisis estadístico, y gráficos detallados de ese segmento específico.
                                </p>
                                <div class="flex gap-2">
                                    <button onclick="VsCategoriasDrillDown.debugTest()"
                                            class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                        🔧 Test Debug
                                    </button>
                                                                        <button onclick="console.log('Estado drill-down:', VsCategoriasDrillDown)"
                                            class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                                        📊 Ver Estado
                                    </button>
                                    <button onclick="VsCategoriasDrillDown.forceShowTest()"
                                            class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                                        🧪 Test Forzado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Área del Gráfico con Container Mejorado -->
                    <div id="vs-categorias-chart-container" class="relative bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-inner cursor-pointer">
                        <!-- El gráfico y leyenda se insertan aquí dinámicamente -->
                        <div class="relative w-full h-auto min-h-96 p-4">
                            <canvas id="estadisticas-vs-categorias-chart" class="w-full h-auto min-h-96"></canvas>
                        </div>
                    </div>

                    <!-- Área de drill-down expandible (se crea dinámicamente por el módulo) -->
                </div>
            </div>
        </div>
    `
};
