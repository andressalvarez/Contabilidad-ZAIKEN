// Vista Estadísticas - Agrupa todas las gráficas principales del sistema
window.EstadisticasView = {
    charts: {},
    initialized: false,

    async init() {
        // Esperar a que el DOM esté listo
        await new Promise(res => setTimeout(res, 100));
        this.renderGraficas();
        this.vsCategorias.init();
        this.initialized = true;
    },

    renderGraficas() {
        this.renderIngresosGastos();
        this.renderGastosCategoria();
        this.renderCampanasPerformance();
        this.renderAportesUtilidades();
    },

    // Función helper para crear gráficas con responsive mejorado y sin superposiciones
    createResponsiveChart(canvasId, config) {
        const ctx = document.getElementById(canvasId);
        const container = ctx?.parentElement;
        if (!ctx) return null;

        // Limpiar container y crear estructura mejorada
        this.setupChartContainer(container, canvasId);

        // Agregar ResizeObserver para redimensionamiento automático
        const resizeObserver = new ResizeObserver(entries => {
            if (this.charts[canvasId]) {
                this.charts[canvasId].resize();
            }
        });
        resizeObserver.observe(container);

        // Configuración base responsive sin superposiciones
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 10,
                    right: 10
                }
            },
            plugins: {
                legend: {
                    display: false // Siempre usar leyendas externas
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    bodySpacing: 6
                }
            }
        };

        // Merge configuraciones
        config.options = { ...defaultOptions, ...config.options };

        const chart = new Chart(ctx, config);
        return chart;
    },

    // Configurar contenedor de gráfica con estructura limpia
    setupChartContainer(container, canvasId) {
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: auto;
            min-height: 400px;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
        `;

        // Crear wrapper para canvas como createResponsiveChart
        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.cssText = `
            position: relative;
            height: auto;
            min-height: 350px;
            width: 100%;
            margin-top: 1rem;
        `;

        const canvas = document.getElementById(canvasId);
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
        `;

        // Reorganizar estructura
        if (!container.querySelector('.canvas-wrapper')) {
            canvasWrapper.className = 'canvas-wrapper';
            container.appendChild(canvasWrapper);
            canvasWrapper.appendChild(canvas);
        }
    },

    renderIngresosGastos() {
        const ctx = document.getElementById('estadisticas-chart-ingresos-gastos');
        const container = ctx?.parentElement;
        if (!ctx) return;

        const trans = DataManager.getAll('transaccionesData');
        const ingresos = trans.filter(t => t.tipo === 'Ingreso').reduce((acc, t) => acc + (t.monto || 0), 0);
        const gastos = trans.filter(t => t.tipo === 'Gasto').reduce((acc, t) => acc + (t.monto || 0), 0);

        if (ingresos === 0 && gastos === 0) {
            if (container) {
                container.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 2rem;">No hay datos de ingresos ni gastos para mostrar.</div>';
            }
            return;
        }

        // Crear leyenda externa mejorada
        this.createCleanExternalLegend(container, [
            { label: 'Ingresos', value: ingresos, color: '#10b981', percentage: ((ingresos / (ingresos + gastos)) * 100).toFixed(1) },
            { label: 'Gastos', value: gastos, color: '#ef4444', percentage: ((gastos / (ingresos + gastos)) * 100).toFixed(1) }
        ], 'Resumen Financiero');

        this.charts.ingresosGastos = this.createResponsiveChart('estadisticas-chart-ingresos-gastos', {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Gastos'],
                datasets: [{
                    label: 'COP',
                    data: [ingresos, gastos],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderColor: ['#059669', '#dc2626'],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                plugins: {
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: { weight: 'bold', size: 14 },
                        formatter: (value) => value > 0 ? `$${value.toLocaleString()}` : '',
                        anchor: 'center',
                        align: 'center'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            },
                            color: '#6b7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
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
        const total = values.reduce((a, b) => a + b, 0);

        if (labels.length === 0) {
            if (container) {
                container.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 2rem;">No hay datos de gastos por categoría para mostrar.</div>';
            }
            return;
        }

        const colors = [
            '#6366f1','#f59e42','#10b981','#ef4444','#fbbf24','#3b82f6','#a21caf','#eab308','#0ea5e9','#f472b6'
        ];

        // Crear leyenda externa con porcentajes
        const legendData = labels.map((label, index) => ({
            label,
            value: values[index],
            color: colors[index % colors.length],
            percentage: ((values[index] / total) * 100).toFixed(1)
        }));
        this.createCleanExternalLegend(container, legendData, 'Distribución por Categoría');

        this.charts.gastosCategoria = this.createResponsiveChart('estadisticas-chart-gastos-categoria', {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 3
                }]
            },
            options: {
                plugins: {
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: { weight: 'bold', size: 11 },
                        formatter: (value, context) => {
                            const percentage = ((value / total) * 100).toFixed(1);
                            return percentage > 8 ? percentage + '%' : ''; // Solo mostrar si es > 8%
                        }
                    }
                }
            }
        });
    },

    renderCampanasPerformance() {
        const ctx = document.getElementById('estadisticas-chart-campanas-performance');
        const container = ctx?.parentElement;
        if (!ctx) return;

        const campanas = DataManager.getAll('campanasData');
        const labels = campanas.map(c => c.nombre);
        const ingresos = campanas.map(c => c.ingresos || c.ingresosGenerados || c.ingresoTotalReal || 0);
        const gastos = campanas.map(c => c.inversion || c.inversionReal || c.gastoTotalReal || 0);

        const hayDatos = ingresos.some(v => v > 0) || gastos.some(v => v > 0);
        if (labels.length === 0 || !hayDatos) {
            if (container) {
                container.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 2rem;">No hay datos de campañas para mostrar.</div>';
            }
            return;
        }

        // Crear resumen para leyenda
        const totalIngresos = ingresos.reduce((a, b) => a + b, 0);
        const totalGastos = gastos.reduce((a, b) => a + b, 0);

        this.createCleanExternalLegend(container, [
            { label: 'Total Ingresos', value: totalIngresos, color: '#10b981', percentage: '100' },
            { label: 'Total Gastos', value: totalGastos, color: '#ef4444', percentage: '100' }
        ], 'Rendimiento de Campañas');

        this.charts.campanasPerformance = this.createResponsiveChart('estadisticas-chart-campanas-performance', {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: ingresos,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                    },
                    {
                        label: 'Gastos',
                        data: gastos,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                plugins: {
                    datalabels: {
                        display: false // Evitar superposición en gráficos de barras múltiples
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            },
                            color: '#6b7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            maxRotation: 45
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
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
        const total = aportes + utilidades;

        if (aportes === 0 && utilidades === 0) {
            if (container) {
                container.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 2rem;">No hay datos de aportes ni utilidades para mostrar.</div>';
            }
            return;
        }

        // Crear leyenda externa
        this.createCleanExternalLegend(container, [
            { label: 'Aportes', value: aportes, color: '#3b82f6', percentage: ((aportes / total) * 100).toFixed(1) },
            { label: 'Utilidades', value: utilidades, color: '#f59e42', percentage: ((utilidades / total) * 100).toFixed(1) }
        ], 'Capital y Rentabilidad');

        this.charts.aportesUtilidades = this.createResponsiveChart('estadisticas-chart-aportes-utilidades', {
            type: 'doughnut',
            data: {
                labels: ['Aportes', 'Utilidades'],
                datasets: [{
                    data: [aportes, utilidades],
                    backgroundColor: ['#3b82f6', '#f59e42'],
                    borderWidth: 4,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                plugins: {
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: { weight: 'bold', size: 14 },
                        formatter: (value, context) => {
                            const percentage = ((value / total) * 100).toFixed(1);
                            return percentage + '%';
                        }
                    }
                },
                cutout: '60%'
            }
        });
    },

    // Crear leyenda externa limpia y sin superposiciones
    createCleanExternalLegend(container, data, title) {
        // Limpiar leyendas existentes
        const existingLegend = container.querySelector('.clean-legend');
        if (existingLegend) {
            existingLegend.remove();
        }

        const legend = document.createElement('div');
        legend.className = 'clean-legend';
        legend.style.cssText = `
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        `;

        // Título
        if (title) {
            const titleEl = document.createElement('h4');
            titleEl.style.cssText = `
                font-size: 1.125rem;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 1rem 0;
                text-align: center;
            `;
            titleEl.textContent = title;
            legend.appendChild(titleEl);
        }

        // Grid de items
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        `;

        data.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                transition: all 0.2s ease;
                cursor: pointer;
            `;

            legendItem.innerHTML = `
                <div style="
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: ${item.color};
                    flex-shrink: 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                "></div>
                <div style="flex: 1;">
                    <div style="
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 2px;
                    ">${item.label}</div>
                    <div style="
                        font-size: 0.75rem;
                        color: #6b7280;
                        font-weight: 500;
                    ">$${item.value.toLocaleString()} (${item.percentage}%)</div>
                </div>
            `;

            // Efectos hover sin superposición
            legendItem.addEventListener('mouseenter', () => {
                legendItem.style.borderColor = item.color;
                legendItem.style.transform = 'translateY(-2px)';
                legendItem.style.boxShadow = `0 4px 12px ${item.color}25`;
            });

            legendItem.addEventListener('mouseleave', () => {
                legendItem.style.borderColor = '#e5e7eb';
                legendItem.style.transform = 'translateY(0)';
                legendItem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            });

            grid.appendChild(legendItem);
        });

        legend.appendChild(grid);

        // Insertar al principio del container
        container.insertBefore(legend, container.firstChild);
    },

    // --- VS de Categorías MEJORADO ---
    vsCategorias: {
        chart: null,
        categorias: [],
        colores: {},
        grupos: {}, // {id: {nombre, color, categorias, visible, carpetaId}}
        carpetas: {}, // Nuevo: {id: {nombre, color, visible, carpetaPadreId, grupos}}
        filtros: {
            categorias: [],
            tipo: 'Gasto',
            fechaDesde: '',
            fechaHasta: '',
            chartType: 'bar',
            gruposSeleccionados: [],
            carpetasSeleccionadas: [], // Nuevo
        },
        coloresBase: [
            '#6366f1','#f59e42','#10b981','#ef4444','#fbbf24','#3b82f6','#a21caf','#eab308','#0ea5e9','#f472b6',
            '#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899','#64748b','#14b8a6','#f59e0b','#8b5cf6','#ef4444'
        ],

        init() {
            // Cargar configuración predefinida si existe
            const saved = localStorage.getItem('vsCategoriasConfig');
            if (saved) {
                try {
                    const config = JSON.parse(saved);
                    if (Array.isArray(config.categorias) && config.categorias.length > 0) {
                        this.filtros = { ...this.filtros, ...config };
                        if (config.colores) this.colores = config.colores;
                        if (config.grupos) this.grupos = config.grupos;
                        if (config.carpetas) this.carpetas = config.carpetas;
                    }
                } catch {}
            }

            this.categorias = DataManager.getAll('categoriasData').map(c => c.nombre);
            if (!this.filtros.categorias.length) this.filtros.categorias = this.categorias.slice(0,2);

            this.colores = this.colores || {};
            this.grupos = this.grupos || {};
            this.carpetas = this.carpetas || {};

            this.categorias.forEach((cat, i) => {
                if (!this.colores[cat]) this.colores[cat] = this.coloresBase[i % this.coloresBase.length];
            });

            this.renderSelectores();
            this.attachEvents();
            this.applySavedConfig();
            this.renderChart();

            // Inicializar alturas dinámicas después de que todo esté renderizado
            setTimeout(() => {
                this.initializeDynamicHeights();
            }, 100);
        },

        renderSelectores() {
            const chipsCont = document.getElementById('vs-categorias-chips');
            if (!chipsCont) return;

            chipsCont.innerHTML = '';
            chipsCont.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6';

            const carpetasArray = Object.entries(this.carpetas);
            const gruposSinCarpeta = Object.entries(this.grupos).filter(([id, grupo]) => !grupo.carpetaId);
            const hayContenido = carpetasArray.length > 0 || gruposSinCarpeta.length > 0;

            if (hayContenido) {
                // Mostrar carpetas y sus grupos
                this.renderCarpetasYGrupos(chipsCont);

                // Solo mostrar grupos activos en "Categorías" (sin carpetas)
                this.updateCategoriasDisplay();
            } else {
                // Mostrar mensaje si no hay contenido
                const msg = document.createElement('div');
                msg.className = 'col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200';
                msg.innerHTML = `
                    <i class="bi bi-folder-plus text-4xl text-gray-300 mb-3 block"></i>
                    <div class="text-lg font-medium mb-2">No hay grupos ni carpetas creados</div>
                    <div class="text-sm">Organiza tus métricas creando carpetas y grupos</div>
                `;
                chipsCont.appendChild(msg);
            }

            this.renderActionButtons(chipsCont);
        },

        renderCarpetasYGrupos(container) {
            const carpetasArray = Object.entries(this.carpetas);
            const gruposSinCarpeta = Object.entries(this.grupos).filter(([id, grupo]) => !grupo.carpetaId);

            // Renderizar carpetas
            carpetasArray.forEach(([carpetaId, carpeta]) => {
                this.renderCarpeta(container, carpetaId, carpeta);
            });

            // Renderizar grupos sin carpeta
            gruposSinCarpeta.forEach(([grupoId, grupo]) => {
                this.renderGrupo(container, grupoId, grupo, false);
            });
        },

        renderCarpeta(container, carpetaId, carpeta) {
            if (carpeta.visible === undefined) carpeta.visible = true;

            const carpetaDiv = document.createElement('div');
            carpetaDiv.className = `bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${carpeta.visible ? 'border-gray-200' : 'border-gray-100 opacity-60'}`;

            // Grupos en esta carpeta
            const gruposEnCarpeta = Object.entries(this.grupos).filter(([id, grupo]) => grupo.carpetaId === carpetaId);
            const gruposActivos = gruposEnCarpeta.filter(([id, grupo]) => grupo.visible !== false);
            const totalGrupos = gruposEnCarpeta.length;

            carpetaDiv.innerHTML = `
                <div class="p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-4 h-4 rounded" style="background: ${carpeta.color}"></div>
                            <div>
                                <div class="font-semibold text-gray-900">${carpeta.nombre}</div>
                                <div class="text-xs text-gray-500">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <i class="bi bi-folder-fill mr-1"></i>
                                        ${totalGrupos} grupos
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button type="button" class="text-gray-400 hover:text-gray-600 transition-colors carpeta-toggle"
                                    data-carpeta-id="${carpetaId}" title="${carpeta.visible ? 'Ocultar carpeta' : 'Mostrar carpeta'}">
                                <i class="bi ${carpeta.visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}"></i>
                            </button>
                        </div>
                    </div>

                    ${carpeta.visible ? `
                        <div class="space-y-2 grupos-carpeta">
                            ${gruposEnCarpeta.map(([grupoId, grupo]) =>
                                this.renderGrupoEnCarpeta(grupoId, grupo)
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            // Event listeners
            carpetaDiv.querySelector('.carpeta-toggle').addEventListener('click', () => {
                this.toggleCarpetaVisibility(carpetaId);
            });

            // Event listeners para grupos en carpeta
            carpetaDiv.querySelectorAll('.grupo-chip').forEach(chip => {
                const grupoId = chip.dataset.grupoId;

                chip.querySelector('.grupo-toggle').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleGrupoVisibility(grupoId);
                });

                chip.addEventListener('click', (e) => {
                    if (e.target.classList.contains('grupo-toggle')) return;
                    this.toggleGrupoSelection(grupoId);
                });
            });

            container.appendChild(carpetaDiv);
        },

        renderGrupoEnCarpeta(grupoId, grupo) {
                    if (grupo.visible === undefined) grupo.visible = true;
            const isSelected = this.filtros.gruposSeleccionados.includes(grupoId);

            return `
                <div class="grupo-chip cursor-pointer p-2 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } ${grupo.visible ? '' : 'opacity-50'}" data-grupo-id="${grupoId}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2 flex-1 min-w-0">
                            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${grupo.color}"></div>
                            <span class="text-sm font-medium text-gray-700 truncate">${grupo.nombre}</span>
                            <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                ${grupo.categorias.length}
                            </span>
                        </div>
                        <button type="button" class="text-gray-400 hover:text-gray-600 transition-colors grupo-toggle ml-2"
                                title="${grupo.visible ? 'Ocultar grupo' : 'Mostrar grupo'}">
                            <i class="bi ${grupo.visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'} text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        },

        renderGrupo(container, grupoId, grupo, enCarpeta = false) {
            if (grupo.visible === undefined) grupo.visible = true;
            const isSelected = this.filtros.gruposSeleccionados.includes(grupoId);

            const grupoDiv = document.createElement('div');
            grupoDiv.className = `grupo-chip cursor-pointer bg-white rounded-xl shadow-sm border-2 p-4 transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200' : 'border-gray-200 hover:border-gray-300'
            } ${grupo.visible ? '' : 'opacity-50'}`;
            grupoDiv.dataset.grupoId = grupoId;

            grupoDiv.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <div class="w-4 h-4 rounded-full flex-shrink-0" style="background: ${grupo.color}"></div>
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-gray-900 truncate">${grupo.nombre}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    <i class="bi bi-tags-fill mr-1"></i>
                                    ${grupo.categorias.length} categorías
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button type="button" class="text-gray-400 hover:text-gray-600 transition-colors grupo-toggle"
                                title="${grupo.visible ? 'Ocultar grupo' : 'Mostrar grupo'}">
                            <i class="bi ${grupo.visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}"></i>
                        </button>
                    </div>
                </div>
                    `;

            // Event listeners
            grupoDiv.querySelector('.grupo-toggle').addEventListener('click', (e) => {
                        e.stopPropagation();
                this.toggleGrupoVisibility(grupoId);
            });

            grupoDiv.addEventListener('click', (e) => {
                if (e.target.classList.contains('grupo-toggle')) return;
                this.toggleGrupoSelection(grupoId);
            });

            container.appendChild(grupoDiv);
        },

        renderActionButtons(container) {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'col-span-full flex flex-wrap gap-3 pt-4 border-t border-gray-200';

            buttonsDiv.innerHTML = `
                <button type="button" id="vs-categorias-crear-carpeta"
                        class="btn-action btn-primary">
                    <i class="bi bi-folder-plus"></i>
                    Crear Carpeta
                </button>
                <button type="button" id="vs-categorias-grupos"
                        class="btn-action btn-success">
                    <i class="bi bi-tags"></i>
                    Crear Grupo
                </button>
                <button type="button" id="vs-categorias-gestionar"
                        class="btn-action btn-secondary">
                    <i class="bi bi-gear"></i>
                    Gestionar
                </button>
                <button type="button" id="vs-categorias-save"
                        class="btn-action btn-info">
                    <i class="bi bi-bookmark"></i>
                    Guardar Config
                </button>
            `;

            // Agregar estilos CSS para los botones
            if (!document.getElementById('action-buttons-styles')) {
                const style = document.createElement('style');
                style.id = 'action-buttons-styles';
                style.textContent = `
                    .btn-action {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.75rem;
                        font-weight: 600;
                        font-size: 0.875rem;
                        border: 2px solid transparent;
                        transition: all 0.2s ease;
                        cursor: pointer;
                        text-decoration: none;
                        min-height: 2.75rem;
                    }
                    .btn-action:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    .btn-action:active {
                        transform: translateY(0);
                    }
                    .btn-primary { background: #3b82f6; color: white; }
                    .btn-primary:hover { background: #2563eb; }
                    .btn-success { background: #10b981; color: white; }
                    .btn-success:hover { background: #059669; }
                    .btn-secondary { background: #6b7280; color: white; }
                    .btn-secondary:hover { background: #4b5563; }
                    .btn-info { background: #06b6d4; color: white; }
                    .btn-info:hover { background: #0891b2; }
                `;
                document.head.appendChild(style);
            }

            // Event listeners
            buttonsDiv.querySelector('#vs-categorias-crear-carpeta').addEventListener('click', () => {
                this.mostrarPopupCarpetas();
            });

            buttonsDiv.querySelector('#vs-categorias-grupos').addEventListener('click', () => {
                this.mostrarPopupGrupos();
            });

            buttonsDiv.querySelector('#vs-categorias-gestionar').addEventListener('click', () => {
                this.mostrarPopupGestionar();
            });

            buttonsDiv.querySelector('#vs-categorias-save').addEventListener('click', () => {
                this.saveConfig();
                Utils && Utils.showToast ? Utils.showToast('Configuración guardada exitosamente', 'success') : alert('Configuración guardada');
            });

            container.appendChild(buttonsDiv);
        },

        // Métodos para manejar visibilidad y selección
        toggleCarpetaVisibility(carpetaId) {
            this.carpetas[carpetaId].visible = !this.carpetas[carpetaId].visible;
                        this.saveConfig();
                        this.renderSelectores();
                        this.renderChart();
        },

        toggleGrupoVisibility(grupoId) {
            this.grupos[grupoId].visible = !this.grupos[grupoId].visible;
            this.saveConfig();
            this.renderSelectores();
            this.renderChart();
        },

        toggleGrupoSelection(grupoId) {
                        if (!this.filtros.gruposSeleccionados) this.filtros.gruposSeleccionados = [];
            const idx = this.filtros.gruposSeleccionados.indexOf(grupoId);
                        if (idx === -1) {
                this.filtros.gruposSeleccionados.push(grupoId);
                        } else {
                            this.filtros.gruposSeleccionados.splice(idx, 1);
                        }
                        this.saveConfig();
                        this.renderSelectores();
                        this.renderChart();
        },

        // Actualizar display de categorías (solo grupos activos)
        updateCategoriasDisplay() {
            const categoriasView = document.querySelector('[data-tab="categorias"]');
            if (categoriasView) {
                const activeGroups = Object.entries(this.grupos)
                    .filter(([id, grupo]) => grupo.visible !== false)
                    .map(([id, grupo]) => grupo.nombre);

                // Actualizar badge en sidebar si existe
                const badge = categoriasView.querySelector('.nav-badge');
                if (badge) {
                    badge.textContent = activeGroups.length;
                } else if (activeGroups.length > 0) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'nav-badge ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full';
                    newBadge.textContent = activeGroups.length;
                    categoriasView.appendChild(newBadge);
                }
            }
        },

        renderColorPickers() {
            // Mostrar color pickers para cada categoría seleccionada
            const cont = document.getElementById('vs-categorias-colores');
            if (!cont) return;
            cont.innerHTML = '';
            this.filtros.categorias.forEach(cat => {
                const color = this.colores[cat] || '#6366f1';
                const div = document.createElement('div');
                div.className = 'flex items-center gap-2';
                div.innerHTML = `<span class="text-sm">${cat}</span><input type="color" value="${color}" data-cat="${cat}" class="w-7 h-7 border rounded" />`;
                cont.appendChild(div);
            });
            // Escuchar cambios de color
            cont.querySelectorAll('input[type=color]').forEach(input => {
                input.addEventListener('input', e => {
                    const cat = input.getAttribute('data-cat');
                    this.colores[cat] = input.value;
                    this.renderChart();
                });
            });
        },
        attachEvents() {
            // Selector de categorías
            const select = document.getElementById('vs-categorias-select');
            if (select) {
                select.addEventListener('change', e => {
                    this.filtros.categorias = Array.from(select.selectedOptions).map(opt => opt.value);
                    this.renderColorPickers();
                    this.renderChart();
                });
            }
            // Tipo de transacción
            const tipoSel = document.getElementById('vs-tipo-select');
            if (tipoSel) {
                tipoSel.addEventListener('change', e => {
                    this.filtros.tipo = tipoSel.value;
                    this.renderChart();
                });
            }
            // Fechas
            const desde = document.getElementById('vs-fecha-desde');
            const hasta = document.getElementById('vs-fecha-hasta');
            if (desde) desde.addEventListener('change', e => { this.filtros.fechaDesde = desde.value; this.renderChart(); });
            if (hasta) hasta.addEventListener('change', e => { this.filtros.fechaHasta = hasta.value; this.renderChart(); });
            // Tipo de gráfica
            const chartType = document.getElementById('vs-chart-type');
            if (chartType) chartType.addEventListener('change', e => { this.filtros.chartType = chartType.value; this.renderChart(); });
            // Exportar imagen
            const exportImg = document.getElementById('vs-export-img');
            if (exportImg) exportImg.addEventListener('click', () => { this.exportImg(); });
            // Exportar CSV
            const exportCsv = document.getElementById('vs-export-csv');
            if (exportCsv) exportCsv.addEventListener('click', () => { this.exportCsv(); });
        },
        // Popup para crear carpetas
        mostrarPopupCarpetas() {
            const popup = this.createModal('Crear Nueva Carpeta');
            const usados = Object.values(this.carpetas).map(c => c.color);
            let sugerido = this.coloresBase.find(c => !usados.includes(c)) || this.coloresBase[0];

            popup.querySelector('.modal-body').innerHTML = `
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de la carpeta</label>
                            <input type="text" id="nueva-carpeta-nombre" placeholder="Ej: Ventas, Marketing..."
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Color de la carpeta</label>
                            <input type="color" id="nueva-carpeta-color" value="${sugerido}"
                                   class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button onclick="this.closest('.modal-overlay').remove()"
                                class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button onclick="EstadisticasView.vsCategorias.crearCarpeta()"
                                class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Crear Carpeta
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(popup);
        },

        mostrarPopupGrupos() {
            const popup = this.createModal('Crear Nuevo Grupo');
            const usados = Object.values(this.grupos).map(g => g.color);
            let sugerido = this.coloresBase.find(c => !usados.includes(c)) || this.coloresBase[0];

            popup.querySelector('.modal-body').innerHTML = `
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del grupo</label>
                            <input type="text" id="nuevo-grupo-nombre" placeholder="Ej: Gastos operativos..."
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                            <input type="color" id="nuevo-grupo-color" value="${sugerido}"
                                   class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Carpeta</label>
                            <select id="nuevo-grupo-carpeta" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Sin carpeta</option>
                                ${Object.entries(this.carpetas).map(([id, carpeta]) =>
                                    `<option value="${id}">${carpeta.nombre}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Categorías del grupo</label>
                        <div id="nuevo-grupo-categorias" class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3"></div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button onclick="this.closest('.modal-overlay').remove()"
                                class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button onclick="EstadisticasView.vsCategorias.crearGrupo()"
                                class="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Crear Grupo
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(popup);
            this.renderPopupGrupos();
        },

        // Popup de gestión mejorado y más grande
        mostrarPopupGestionar() {
            const popup = this.createModal('Gestionar Carpetas y Grupos', 'large');

            popup.querySelector('.modal-body').innerHTML = `
                <div class="space-y-6">
                    <!-- Tabs -->
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-8">
                            <button class="tab-button active py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
                                    data-tab="carpetas">
                                <i class="bi bi-folder-fill mr-2"></i>Carpetas
                            </button>
                            <button class="tab-button py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    data-tab="grupos">
                                <i class="bi bi-tags-fill mr-2"></i>Grupos
                            </button>
                        </nav>
                    </div>

                    <!-- Tab Content -->
                    <div id="tab-carpetas" class="tab-content">
                        <div id="carpetas-gestion" class="space-y-4"></div>
                    </div>

                    <div id="tab-grupos" class="tab-content hidden">
                        <div id="grupos-gestion" class="space-y-4"></div>
                    </div>

                    <div class="flex justify-end pt-4 border-t border-gray-200">
                        <button onclick="this.closest('.modal-overlay').remove()"
                                class="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            // Event listeners para tabs
            popup.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    // Actualizar tabs activos
                    popup.querySelectorAll('.tab-button').forEach(b => {
                        b.classList.remove('active', 'border-blue-500', 'text-blue-600');
                        b.classList.add('border-transparent', 'text-gray-500');
                    });
                    button.classList.add('active', 'border-blue-500', 'text-blue-600');
                    button.classList.remove('border-transparent', 'text-gray-500');

                    // Mostrar contenido correspondiente
                    popup.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                    popup.querySelector(`#tab-${button.dataset.tab}`).classList.remove('hidden');
                });
            });

            document.body.appendChild(popup);
            this.renderGestionCarpetas();
            this.renderGestionGrupos();
        },

        // Helper para crear modals responsive
        createModal(title, size = 'default') {
            const popup = document.createElement('div');
            popup.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

            const maxWidth = size === 'large' ? 'max-w-6xl' : 'max-w-2xl';

            popup.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-hidden">
                    <div class="modal-header px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div class="flex justify-between items-center">
                            <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                            <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="this.closest('.modal-overlay').remove()">
                                <i class="bi bi-x-lg text-xl"></i>
                            </button>
                        </div>
                    </div>
                    <div class="modal-body p-6 overflow-y-auto" style="max-height: calc(90vh - 120px);">
                        <!-- Content will be inserted here -->
                    </div>
                </div>
            `;

            return popup;
        },
        renderPopupGrupos() {
            // Renderizar categorías disponibles para nuevo grupo
            const cont = document.getElementById('nuevo-grupo-categorias');
            if (cont) {
                cont.innerHTML = this.categorias.map(cat => `
                    <label class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                        <input type="checkbox" value="${cat}" class="categoria-checkbox rounded">
                        <span class="text-sm">${cat}</span>
                    </label>
                `).join('');
            }
        },

        crearCarpeta() {
            const nombre = document.getElementById('nueva-carpeta-nombre').value.trim();
            const color = document.getElementById('nueva-carpeta-color').value;

            if (!nombre) {
                alert('Por favor ingresa un nombre para la carpeta');
                return;
            }

            const id = 'carpeta_' + Date.now();
            this.carpetas[id] = {
                nombre: nombre,
                color: color,
                visible: true
            };

            this.saveConfig();

            // Cerrar modal y actualizar vista
            document.querySelector('.modal-overlay').remove();
            this.renderSelectores();
            this.renderChart();

            Utils && Utils.showToast ? Utils.showToast('Carpeta creada exitosamente', 'success') : alert('Carpeta creada');
        },

        renderGestionCarpetas() {
            const container = document.getElementById('carpetas-gestion');
            if (!container) return;

            if (Object.keys(this.carpetas).length === 0) {
                container.innerHTML = `
                    <div class="vs-empty-state vs-animate-in">
                        <i class="bi bi-folder vs-empty-icon"></i>
                        <div class="vs-empty-title">No hay carpetas creadas</div>
                        <div class="vs-empty-description">Las carpetas te ayudan a organizar tus grupos de métricas</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = `<div class="vs-grupos-container">` + Object.entries(this.carpetas).map(([carpetaId, carpeta]) => {
                const gruposEnCarpeta = Object.entries(this.grupos).filter(([id, grupo]) => grupo.carpetaId === carpetaId);

                            return `
                    <div class="vs-grupo-card vs-animate-in">
                        <div class="vs-grupo-header">
                            <div class="vs-grupo-title">
                                <div class="vs-grupo-color" style="background: ${carpeta.color}"></div>
                                <div>
                                    <h4 class="vs-grupo-name">${carpeta.nombre}</h4>
                                    <p class="vs-grupo-meta"><i class="bi bi-folder-fill mr-1"></i>${gruposEnCarpeta.length} grupos</p>
                                        </div>
                                        </div>
                            <div class="vs-grupo-actions">
                                <button onclick="EstadisticasView.vsCategorias.editarCarpeta('${carpetaId}')"
                                        class="text-blue-500 hover:text-blue-700">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button onclick="EstadisticasView.vsCategorias.eliminarCarpeta('${carpetaId}')"
                                        class="text-red-500 hover:text-red-700">
                                    <i class="bi bi-trash"></i>
                                </button>
                                    </div>
                        </div>

                        ${gruposEnCarpeta.length > 0 ? `
                            <div class="mt-3">
                                <div class="text-xs font-medium text-gray-700 mb-2">Grupos en esta carpeta:</div>
                                <div class="flex flex-wrap gap-1">
                                    ${gruposEnCarpeta.map(([grupoId, grupo]) => `
                                        <span class="vs-categoria-tag">
                                            <div class="w-2 h-2 rounded-full mr-1" style="background: ${grupo.color}"></div>
                                            ${grupo.nombre}
                                        </span>
                                        `).join('')}
                                    </div>
                            </div>
                        ` : ''}
                                </div>
                            `;
            }).join('') + `</div>`;
        },

        renderGestionGrupos() {
            const container = document.getElementById('grupos-gestion');
            if (!container) return;

            if (Object.keys(this.grupos).length === 0) {
                container.innerHTML = `
                    <div class="vs-empty-state vs-animate-in">
                        <i class="bi bi-tags vs-empty-icon"></i>
                        <div class="vs-empty-title">No hay grupos creados</div>
                        <div class="vs-empty-description">Los grupos te permiten analizar múltiples categorías juntas</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = `<div class="vs-grupos-container">` + Object.entries(this.grupos).map(([grupoId, grupo]) => {
                const carpetaNombre = grupo.carpetaId ? this.carpetas[grupo.carpetaId]?.nombre : 'Sin carpeta';

                            return `
                    <div class="vs-grupo-card vs-animate-in">
                        <div class="vs-grupo-header">
                            <div class="vs-grupo-title">
                                            <div class="vs-grupo-color" style="background: ${grupo.color}"></div>
                                <div>
                                    <h4 class="vs-grupo-name">${grupo.nombre}</h4>
                                    <p class="vs-grupo-meta">
                                        <i class="bi bi-folder-fill mr-1"></i>${carpetaNombre} •
                                        ${grupo.categorias.length} categorías
                                    </p>
                                        </div>
                                        </div>
                            <div class="vs-grupo-actions">
                                <button onclick="EstadisticasView.vsCategorias.editarGrupo('${grupoId}')"
                                        class="text-blue-500 hover:text-blue-700">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button onclick="EstadisticasView.vsCategorias.eliminarGrupo('${grupoId}')"
                                        class="text-red-500 hover:text-red-700">
                                    <i class="bi bi-trash"></i>
                                </button>
                                    </div>
                        </div>

                        <div class="mt-3">
                            <div class="text-xs font-medium text-gray-700 mb-2">Categorías:</div>
                                    <div class="flex flex-wrap gap-1">
                                        ${grupo.categorias.map(cat => `
                                    <span class="vs-categoria-tag">
                                        ${cat}
                                    </span>
                                        `).join('')}
                            </div>
                                    </div>
                                </div>
                            `;
                    }).join('') + `</div>`;
        },

        editarCarpeta(carpetaId) {
            const carpeta = this.carpetas[carpetaId];
            const popup = this.createModal('Editar Carpeta');

            popup.querySelector('.modal-body').innerHTML = `
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de la carpeta</label>
                            <input type="text" id="edit-carpeta-nombre" value="${carpeta.nombre}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Color de la carpeta</label>
                            <input type="color" id="edit-carpeta-color" value="${carpeta.color}"
                                   class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button onclick="this.closest('.modal-overlay').remove()"
                                class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button onclick="EstadisticasView.vsCategorias.guardarEdicionCarpeta('${carpetaId}')"
                                class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(popup);
        },

        guardarEdicionCarpeta(carpetaId) {
            const nombre = document.getElementById('edit-carpeta-nombre').value.trim();
            const color = document.getElementById('edit-carpeta-color').value;

            if (!nombre) {
                alert('El nombre no puede estar vacío');
                return;
            }

            this.carpetas[carpetaId].nombre = nombre;
            this.carpetas[carpetaId].color = color;

            this.saveConfig();
            document.querySelector('.modal-overlay').remove();
            this.renderGestionCarpetas();
            this.renderSelectores();
            this.renderChart();

            Utils && Utils.showToast ? Utils.showToast('Carpeta actualizada', 'success') : alert('Carpeta actualizada');
        },

        eliminarCarpeta(carpetaId) {
            const carpeta = this.carpetas[carpetaId];
            const gruposEnCarpeta = Object.entries(this.grupos).filter(([id, grupo]) => grupo.carpetaId === carpetaId);

            let mensaje = `¿Estás seguro de eliminar la carpeta "${carpeta.nombre}"?`;
            if (gruposEnCarpeta.length > 0) {
                mensaje += `\n\nLos ${gruposEnCarpeta.length} grupos dentro de esta carpeta quedarán sin carpeta.`;
            }

            if (confirm(mensaje)) {
                // Remover carpetaId de grupos que estaban en esta carpeta
                gruposEnCarpeta.forEach(([grupoId, grupo]) => {
                    delete this.grupos[grupoId].carpetaId;
                });

                delete this.carpetas[carpetaId];
                this.saveConfig();
                this.renderGestionCarpetas();
                this.renderSelectores();
                this.renderChart();

                Utils && Utils.showToast ? Utils.showToast('Carpeta eliminada', 'success') : alert('Carpeta eliminada');
            }
        },
        crearGrupo() {
            const nombre = document.getElementById('nuevo-grupo-nombre').value.trim();
            const color = document.getElementById('nuevo-grupo-color').value;
            const carpetaId = document.getElementById('nuevo-grupo-carpeta').value || null;
            const categoriasSeleccionadas = Array.from(document.querySelectorAll('#nuevo-grupo-categorias input:checked')).map(cb => cb.value);

            if (!nombre) {
                alert('Por favor ingresa un nombre para el grupo');
                return;
            }
            if (categoriasSeleccionadas.length === 0) {
                alert('Por favor selecciona al menos una categoría');
                return;
            }

            const id = 'grupo_' + Date.now();
            this.grupos[id] = {
                nombre: nombre,
                color: color,
                categorias: categoriasSeleccionadas,
                visible: true,
                carpetaId: carpetaId
            };

            this.saveConfig();

            // Cerrar modal y actualizar vista
            document.querySelector('.modal-overlay').remove();
            this.renderSelectores();
            this.renderChart();

            Utils && Utils.showToast ? Utils.showToast('Grupo creado exitosamente', 'success') : alert('Grupo creado');
        },
        eliminarGrupo(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
                delete this.grupos[id];
                this.renderPopupGrupos();
                this.renderChart();
            }
        },
        editarGrupo(grupoId) {
            const grupo = this.grupos[grupoId];
            const popup = this.createModal('Editar Grupo');

            popup.querySelector('.modal-body').innerHTML = `
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del grupo</label>
                            <input type="text" id="edit-grupo-nombre" value="${grupo.nombre}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                            <input type="color" id="edit-grupo-color" value="${grupo.color}"
                                   class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Carpeta</label>
                            <select id="edit-grupo-carpeta" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Sin carpeta</option>
                                ${Object.entries(this.carpetas).map(([id, carpeta]) =>
                                    `<option value="${id}" ${grupo.carpetaId === id ? 'selected' : ''}>${carpeta.nombre}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Categorías del grupo</label>
                        <div id="edit-grupo-categorias" class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                            ${this.categorias.map(cat => `
                                <label class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                                    <input type="checkbox" value="${cat}" class="edit-categoria-checkbox rounded" ${grupo.categorias.includes(cat) ? 'checked' : ''}>
                                    <span class="text-sm">${cat}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button onclick="this.closest('.modal-overlay').remove()"
                                class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button onclick="EstadisticasView.vsCategorias.guardarEdicionGrupo('${grupoId}')"
                                class="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(popup);
        },

        guardarEdicionGrupo(grupoId) {
            const nombre = document.getElementById('edit-grupo-nombre').value.trim();
            const color = document.getElementById('edit-grupo-color').value;
            const carpetaId = document.getElementById('edit-grupo-carpeta').value || null;
            const categoriasSeleccionadas = Array.from(document.querySelectorAll('#edit-grupo-categorias input:checked')).map(cb => cb.value);

            if (!nombre) {
                alert('El nombre no puede estar vacío');
                return;
            }
            if (categoriasSeleccionadas.length === 0) {
                alert('Selecciona al menos una categoría');
                return;
            }

            this.grupos[grupoId].nombre = nombre;
            this.grupos[grupoId].color = color;
            this.grupos[grupoId].carpetaId = carpetaId;
            this.grupos[grupoId].categorias = categoriasSeleccionadas;

            this.saveConfig();
            document.querySelector('.modal-overlay').remove();
            this.renderGestionGrupos();
            this.renderSelectores();
            this.renderChart();

            Utils && Utils.showToast ? Utils.showToast('Grupo actualizado', 'success') : alert('Grupo actualizado');
        },
        getDatosFiltrados() {
            // Filtrar transacciones según los filtros
            let trans = DataManager.getAll('transaccionesData');
            if (this.filtros.tipo && this.filtros.tipo !== 'Todos') {
                trans = trans.filter(t => t.tipo === this.filtros.tipo);
            }
            if (this.filtros.fechaDesde) {
                trans = trans.filter(t => t.fecha >= this.filtros.fechaDesde);
            }
            if (this.filtros.fechaHasta) {
                trans = trans.filter(t => t.fecha <= this.filtros.fechaHasta);
            }
            // Grupos activos y seleccionados
            const gruposArray = Object.entries(this.grupos);
            const hayGrupos = gruposArray.length > 0;
            if (hayGrupos && this.filtros.gruposSeleccionados && this.filtros.gruposSeleccionados.length > 0) {
                const gruposActivos = gruposArray.filter(([id, g]) => g.visible !== false && this.filtros.gruposSeleccionados.includes(id));
                if (gruposActivos.length > 0) {
                    // Agrupar por grupos seleccionados
                    const datos = {};
                    gruposActivos.forEach(([id, grupo]) => {
                        datos[grupo.nombre] = 0;
                        grupo.categorias.forEach(cat => {
                            trans.forEach(t => {
                                if (t.categoria === cat) {
                                    datos[grupo.nombre] += t.monto || 0;
                                }
                            });
                        });
                    });
                    return { datos, esGrupo: true, grupos: gruposActivos.map(([id, g])=>g) };
                }
            }
            // Si no hay grupos seleccionados, agrupar por categoría individual
            const datos = {};
            this.filtros.categorias.forEach(cat => { datos[cat] = 0; });
            trans.forEach(t => {
                if (this.filtros.categorias.includes(t.categoria)) {
                    datos[t.categoria] += t.monto || 0;
                }
            });
            return { datos, esGrupo: false };
        },
        renderChart() {
            const ctx = document.getElementById('estadisticas-vs-categorias-chart');
            const container = ctx?.parentElement;
            if (!ctx || !container) return;

            if (this.chart) { this.chart.destroy(); }

            const resultado = this.getDatosFiltrados();
            const labels = Object.keys(resultado.datos);
            const values = Object.values(resultado.datos);
            const total = values.reduce((a, b) => a + b, 0) || 1;

            if (labels.length === 0 || values.every(v => v === 0)) {
                container.innerHTML = '<div class="text-center text-gray-400 py-8">No hay datos para mostrar para las categorías seleccionadas.</div>';
                return;
            }

            // Recrear el canvas si fue removido
            if (!document.getElementById('estadisticas-vs-categorias-chart')) {
                container.innerHTML = '<canvas id="estadisticas-vs-categorias-chart" class="w-full h-full"></canvas>';
            }

            const newCtx = document.getElementById('estadisticas-vs-categorias-chart');

            // Determinar colores
            let backgroundColor, borderColor;
            if (resultado.esGrupo) {
                backgroundColor = labels.map(label => {
                    const grupo = resultado.grupos.find(g => g.nombre === label);
                    return grupo ? grupo.color : '#6366f1';
                });
                borderColor = backgroundColor;
            } else {
                backgroundColor = labels.map(cat => this.colores[cat] || '#6366f1');
                borderColor = backgroundColor;
            }

            // Crear leyenda externa antes del gráfico
            this.createVsCategoriasLegend(container, labels, values, backgroundColor, total);

            let chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,  /* ← Proporción controlada para evitar infinito */
                plugins: {
                    legend: { display: false }, // Siempre usar leyenda externa
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                                const porcentaje = ((valor / total) * 100).toFixed(1) + '%';
                                return `${context.label}: $${valor.toLocaleString()} (${porcentaje})`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: function(context) {
                            return ['pie', 'doughnut'].includes(context.chart.config.type) ? 'white' : '#374151';
                        },
                        font: { weight: 'bold', size: 12 },
                        formatter: function(value, context) {
                            const porcentaje = ((value / total) * 100).toFixed(1);
                            if (['pie', 'doughnut'].includes(context.chart.config.type)) {
                                return porcentaje > 3 ? porcentaje + '%' : ''; // Solo mostrar si es > 3%
                            } else {
                                return value > 0 ? `$${value.toLocaleString()}` : '';
                            }
                        }
                    },
                    centerTextPlugin: {
                        display: ['pie', 'doughnut'].includes(this.filtros.chartType),
                        text: `Total\n$${total.toLocaleString()}`,
                        font: 'bold 18px sans-serif',
                        color: '#111827'
                    }
                },
                scales: ['pie', 'doughnut'].includes(this.filtros.chartType) ? {} : {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            };

            // Agregar ResizeObserver igual que createResponsiveChart
            const resizeObserver = new ResizeObserver(entries => {
                if (this.chart) {
                    requestAnimationFrame(() => {
                        this.chart.resize();
                    });
                }
            });
            resizeObserver.observe(container);

            this.chart = new Chart(newCtx, {
                type: this.filtros.chartType,
                data: {
                    labels,
                    datasets: [{
                        label: 'Monto',
                        data: values,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: ['pie', 'doughnut'].includes(this.filtros.chartType) ? 3 : 2,
                        fill: this.filtros.chartType === 'bar',
                        tension: 0.3
                    }]
                },
                options: chartOptions,
                plugins: window.ChartDataLabels ? [ChartDataLabels] : []
            });

            // Configurar altura final del chart recién creado CON LÍMITES
            setTimeout(() => {
                if (this.chart) {
                    this.initializeDynamicHeights();  /* ← Aplicar límites */
                    this.chart.resize();
                }
            }, 50);
        },

        // Crear leyenda externa específica para vsCategorias
        createVsCategoriasLegend(container, labels, values, colors, total) {
            // Buscar si ya existe una leyenda y removerla
            const existingLegend = container.querySelector('.vs-categorias-legend');
            if (existingLegend) {
                existingLegend.remove();
            }

            const legend = document.createElement('div');
            legend.className = 'vs-categorias-legend mb-6';

            // Resumen general
            const summary = document.createElement('div');
            summary.className = 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4';
            summary.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-semibold text-blue-900 text-lg">Resumen Total</h4>
                        <p class="text-blue-700 text-sm">${labels.length} elemento${labels.length > 1 ? 's' : ''} analizados</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-blue-900">$${total.toLocaleString()}</div>
                        <div class="text-blue-700 text-sm">Total acumulado</div>
                    </div>
                </div>
            `;
            legend.appendChild(summary);

            // Items de leyenda
            const legendGrid = document.createElement('div');
            legendGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';

            labels.forEach((label, index) => {
                const value = values[index];
                const percentage = ((value / total) * 100).toFixed(1);
                const color = colors[index];

                const legendItem = document.createElement('div');
                legendItem.className = 'flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer';
                legendItem.innerHTML = `
                    <div class="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${color}"></div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold text-gray-900 truncate">${label}</div>
                        <div class="text-xs text-gray-600">
                            <span class="font-medium">${percentage}%</span> •
                            <span class="text-green-600 font-medium">$${value.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="text-lg font-bold text-gray-400">${percentage}%</div>
                `;

                // Efecto hover mejorado
                legendItem.addEventListener('mouseenter', () => {
                    legendItem.style.transform = 'translateY(-2px)';
                    legendItem.style.borderColor = color;
                });

                legendItem.addEventListener('mouseleave', () => {
                    legendItem.style.transform = 'translateY(0)';
                    legendItem.style.borderColor = '#e5e7eb';
                });

                legendGrid.appendChild(legendItem);
            });

            legend.appendChild(legendGrid);

            // Insertar la leyenda antes del canvas
            const chartCanvas = container.querySelector('canvas');
            if (chartCanvas) {
                container.insertBefore(legend, chartCanvas);
            } else {
                container.appendChild(legend);
            }
        },
        exportImg() {
            if (!this.chart) return;
            const url = this.chart.toBase64Image('image/png', 1.0, '#ffffff');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vs-categorias.png';
            a.click();
        },
        exportCsv() {
            const resultado = this.getDatosFiltrados();
            const csv = 'Categoría,Monto\n' + Object.entries(resultado.datos).map(([cat, val]) => `${cat},${val}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vs-categorias.csv';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        applySavedConfig() {
            try {
                // Cargar configuración desde localStorage
                const savedConfigStr = localStorage.getItem('vsCategoriasConfig');
                if (!savedConfigStr) {
                    console.log('No hay configuración guardada para VS de Categorías');
                    return;
                }

                const savedConfig = JSON.parse(savedConfigStr);
                console.log('Configuración cargada:', savedConfig);

                // Restaurar filtros básicos
                if (savedConfig.tipo) this.filtros.tipo = savedConfig.tipo;
                if (savedConfig.fechaDesde) this.filtros.fechaDesde = savedConfig.fechaDesde;
                if (savedConfig.fechaHasta) this.filtros.fechaHasta = savedConfig.fechaHasta;
                if (savedConfig.chartType) this.filtros.chartType = savedConfig.chartType;
                if (Array.isArray(savedConfig.categorias)) this.filtros.categorias = savedConfig.categorias;

                // Restaurar selecciones de grupos y carpetas
                if (Array.isArray(savedConfig.gruposSeleccionados)) {
                    this.filtros.gruposSeleccionados = savedConfig.gruposSeleccionados;
                } else {
                    this.filtros.gruposSeleccionados = [];
                }

                if (Array.isArray(savedConfig.carpetasSeleccionadas)) {
                    this.filtros.carpetasSeleccionadas = savedConfig.carpetasSeleccionadas;
                } else {
                    this.filtros.carpetasSeleccionadas = [];
                }

                // Restaurar estructuras de organización si existen
                if (savedConfig.grupos && typeof savedConfig.grupos === 'object') {
                    this.grupos = { ...this.grupos, ...savedConfig.grupos };
                }

                if (savedConfig.carpetas && typeof savedConfig.carpetas === 'object') {
                    this.carpetas = { ...this.carpetas, ...savedConfig.carpetas };
                }

                if (savedConfig.colores && typeof savedConfig.colores === 'object') {
                    this.colores = { ...this.colores, ...savedConfig.colores };
                }

                // Aplicar valores a los campos del formulario
                this.applyConfigToForm();

                // Actualizar renderizados
                this.renderGestionCarpetas();
                this.renderGestionGrupos();

                // Notificar éxito
                if (Utils && Utils.showToast) {
                    Utils.showToast('✅ Configuración cargada correctamente', 'success');
                }

                console.log('Configuración aplicada exitosamente');

            } catch (error) {
                console.error('Error al cargar configuración:', error);
                if (Utils && Utils.showToast) {
                    Utils.showToast('⚠️ Error al cargar configuración guardada', 'warning');
                }

                // En caso de error, inicializar con valores por defecto
                this.filtros.gruposSeleccionados = [];
                this.filtros.carpetasSeleccionadas = [];
            }
        },

        // Nueva función helper para aplicar configuración a formularios
        applyConfigToForm() {
            // Aplicar valores a los campos del formulario
            const tipoSel = document.getElementById('vs-tipo-select');
            const desde = document.getElementById('vs-fecha-desde');
            const hasta = document.getElementById('vs-fecha-hasta');
            const chartType = document.getElementById('vs-chart-type');

            if (tipoSel && this.filtros.tipo) tipoSel.value = this.filtros.tipo;
            if (desde && this.filtros.fechaDesde) desde.value = this.filtros.fechaDesde;
            if (hasta && this.filtros.fechaHasta) hasta.value = this.filtros.fechaHasta;
            if (chartType && this.filtros.chartType) chartType.value = this.filtros.chartType;
        },

        // Función para inicializar alturas dinámicas CON LÍMITES
        initializeDynamicHeights() {
            // Configurar el contenedor principal CON LÍMITES
            const vsContainer = document.getElementById('estadisticas-vs-categorias-chart');
            if (vsContainer) {
                vsContainer.style.width = '100%';
                vsContainer.style.height = 'auto';
                vsContainer.style.minHeight = '350px';
                vsContainer.style.maxHeight = '60vh';  /* ← LÍMITE CRUCIAL */
                vsContainer.style.display = 'block';
                vsContainer.style.margin = '0 auto';
            }

            // Configurar el contenedor del chart CON LÍMITES
            const chartContainer = document.getElementById('vs-categorias-chart-container');
            if (chartContainer) {
                chartContainer.style.height = 'auto';
                chartContainer.style.minHeight = '400px';
                chartContainer.style.maxHeight = '70vh';  /* ← LÍMITE CRUCIAL */
                chartContainer.style.overflow = 'hidden';  /* ← Control */
            }

            console.log('VS de Categorías configurado con altura controlada para verse chevere como las de arriba');
        },
        saveConfig() {
            try {
                // Actualizar filtros con valores actuales del formulario
                this.updateFiltrosFromForm();

                // Crear configuración completa y validada
                const config = {
                    // Filtros básicos
                    categorias: Array.isArray(this.filtros.categorias) ? this.filtros.categorias : [],
                    tipo: this.filtros.tipo || 'Gasto',
                    fechaDesde: this.filtros.fechaDesde || '',
                    fechaHasta: this.filtros.fechaHasta || '',
                    chartType: this.filtros.chartType || 'bar',

                    // Selecciones de grupos y carpetas
                    gruposSeleccionados: Array.isArray(this.filtros.gruposSeleccionados) ? this.filtros.gruposSeleccionados : [],
                    carpetasSeleccionadas: Array.isArray(this.filtros.carpetasSeleccionadas) ? this.filtros.carpetasSeleccionadas : [],

                    // Configuraciones de colores
                    colores: this.colores || {},

                    // Estructuras de organización
                    grupos: this.grupos || {},
                    carpetas: this.carpetas || {},

                    // Metadatos
                    timestamp: new Date().toISOString(),
                    version: '2.0'
                };

                // Guardar en localStorage con validación
                localStorage.setItem('vsCategoriasConfig', JSON.stringify(config));

                // Notificar éxito
                if (Utils && Utils.showToast) {
                    Utils.showToast('✅ Configuración guardada correctamente', 'success');
                } else {
                    alert('Configuración guardada exitosamente');
                }

                console.log('Configuración guardada:', config);

            } catch (error) {
                console.error('Error al guardar configuración:', error);
                if (Utils && Utils.showToast) {
                    Utils.showToast('❌ Error al guardar configuración', 'error');
                } else {
                    alert('Error al guardar la configuración');
                }
            }
        },

        // Nueva función helper para actualizar filtros desde formulario
        updateFiltrosFromForm() {
            const tipoSel = document.getElementById('vs-tipo-select');
            const desde = document.getElementById('vs-fecha-desde');
            const hasta = document.getElementById('vs-fecha-hasta');
            const chartType = document.getElementById('vs-chart-type');

            if (tipoSel && tipoSel.value) this.filtros.tipo = tipoSel.value;
            if (desde) this.filtros.fechaDesde = desde.value;
            if (hasta) this.filtros.fechaHasta = hasta.value;
            if (chartType && chartType.value) this.filtros.chartType = chartType.value;

            // Asegurar que las selecciones sean arrays válidos
            if (!Array.isArray(this.filtros.gruposSeleccionados)) {
                this.filtros.gruposSeleccionados = [];
            }
            if (!Array.isArray(this.filtros.carpetasSeleccionadas)) {
                this.filtros.carpetasSeleccionadas = [];
            }
        }
    },

    // Futuro: filtros, exportar, etc.
    cleanup() {
        // Destruir charts si existen
        Object.values(this.charts).forEach(chart => { if (chart && chart.destroy) chart.destroy(); });
        this.charts = {};
        this.initialized = false;
    }
};

// Plugin para texto centrado en Doughnut/Pie de VS Categorías
if (typeof Chart !== 'undefined' && !Chart._registeredCenterTextPlugin) {
    const centerTextPlugin = {
        id: 'centerTextPlugin',
        beforeDraw(chart, args, opts) {
            if (!opts || opts.display === false) return;
            const { ctx, chartArea: { width, height } } = chart;
            ctx.save();
            ctx.font = opts.font || 'bold 18px sans-serif';
            ctx.fillStyle = opts.color || '#111827';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(opts.text || '', width / 2, height / 2);
            ctx.restore();
        }
    };
    Chart.register(centerTextPlugin);
    Chart._registeredCenterTextPlugin = true;
}
