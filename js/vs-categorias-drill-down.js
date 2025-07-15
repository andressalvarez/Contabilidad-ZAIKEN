// VS de Categorías - Drill Down Module
// Funcionalidad expandible para explorar detalles de cada segmento

window.VsCategoriasDrillDown = {
    // Estado del módulo
    expandedSegment: null,
    detailsContainer: null,
    currentTransactions: [],
    currentChart: null,

    // Configuración
    useCanvasDirectEvents: false, // Controla si usar eventos directos en canvas (puede causar duplicidad)

    // Configuración de colores para gráficos detallados
    detailColors: [
        '#6366f1', '#f59e42', '#10b981', '#ef4444', '#fbbf24',
        '#3b82f6', '#a21caf', '#eab308', '#0ea5e9', '#f472b6'
    ],

    // Inicializar módulo
    init() {
        console.log('🚀 Inicializando VS Categorías Drill Down...');
        console.log('📋 Estado del sistema:', {
            EstadisticasView: !!window.EstadisticasView,
            vsCategorias: !!window.EstadisticasView?.vsCategorias,
            renderChart: !!window.EstadisticasView?.vsCategorias?.renderChart
        });

        this.setupChartClickHandler();
        this.createDetailsContainer();
        console.log('✅ Drill Down inicializado completamente');
    },

        // Configurar manejador de clics en el gráfico principal
    setupChartClickHandler() {
        console.log('🔧 Configurando manejador de clics para drill-down...');

        // Hook al sistema de VS de Categorías existente
        const originalRenderChart = EstadisticasView.vsCategorias.renderChart;

        if (!originalRenderChart) {
            console.error('❌ No se encontró EstadisticasView.vsCategorias.renderChart');
            return;
        }

        EstadisticasView.vsCategorias.renderChart = function() {
            console.log('📊 Renderizando gráfico VS de Categorías...');
            originalRenderChart.call(this);

            // Agregar evento de clic después de que se haya renderizado
            setTimeout(() => {
                console.log('⏰ Adjuntando eventos de clic después de timeout...');
                VsCategoriasDrillDown.attachClickEvent();
            }, 100);
        };

        console.log('✅ Hook de renderChart configurado correctamente');
    },

        // Adjuntar evento de clic al gráfico actual
    attachClickEvent() {
        console.log('🎯 Intentando adjuntar evento de clic...');

        const chart = EstadisticasView.vsCategorias.chart;
        console.log('📈 Chart encontrado:', chart ? '✅ SÍ' : '❌ NO');

        if (!chart) {
            console.error('❌ No se encontró el chart de VS de Categorías');
            return;
        }

        console.log('📊 Información del chart:', {
            labels: chart.data.labels,
            datasets: chart.data.datasets?.length || 0,
            canvas: chart.canvas?.id || 'sin ID'
        });

        // Limpiar eventos anteriores
        chart.options.onClick = (event, elements) => {
            console.log('🖱️ CLIC DETECTADO!', {
                elements: elements.length,
                elementIndex: elements[0]?.index
            });

            if (elements.length > 0) {
                const elementIndex = elements[0].index;
                const dataLabel = chart.data.labels[elementIndex];
                const dataValue = chart.data.datasets[0].data[elementIndex];
                const backgroundColor = chart.data.datasets[0].backgroundColor[elementIndex];

                console.log('📊 Datos del segmento clickeado:', {
                    label: dataLabel,
                    value: dataValue,
                    color: backgroundColor,
                    index: elementIndex
                });

                this.handleSegmentClick(dataLabel, dataValue, backgroundColor, elementIndex);
            } else {
                console.log('⚠️ Clic fuera de elementos del gráfico');
            }
        };

        // Hacer el cursor pointer en hover
        chart.options.onHover = (event, elements) => {
            event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        };

        chart.update('none');
        console.log('✅ Eventos de clic configurados correctamente');

        // Limpiar cualquier evento directo existente para evitar duplicidad
        this.cleanupDirectCanvasEvents();

        // MÉTODO DIRECTO OPCIONAL: Solo si está habilitado explícitamente
        if (this.useCanvasDirectEvents) {
            console.log('⚠️ Usando eventos directos en canvas (puede causar duplicidad)');
            this.attachDirectCanvasEvents();
        }
    },

    // Limpiar eventos directos del canvas para evitar duplicidad
    cleanupDirectCanvasEvents() {
        const canvas = document.getElementById('estadisticas-vs-categorias-chart');
        console.log('🧹 Limpiando eventos directos del canvas...');

        if (canvas && this.directCanvasClickHandler) {
            canvas.removeEventListener('click', this.directCanvasClickHandler);
            this.directCanvasClickHandler = null;
            console.log('✅ Eventos directos limpiados');
        }
    },

    // Método alternativo para adjuntar eventos directamente al canvas
    attachDirectCanvasEvents() {
        const canvas = document.getElementById('estadisticas-vs-categorias-chart');
        console.log('🎨 Canvas encontrado:', canvas ? '✅ SÍ' : '❌ NO');

        if (canvas) {
            // Limpiar listeners anteriores primero
            this.cleanupDirectCanvasEvents();

            // Agregar nuevo listener
            this.directCanvasClickHandler = (event) => {
                console.log('🖱️ CLIC DIRECTO EN CANVAS DETECTADO!');

                const chart = EstadisticasView.vsCategorias.chart;
                if (chart) {
                    const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                    console.log('📊 Elementos encontrados en clic directo:', elements.length);

                    if (elements.length > 0) {
                        const element = elements[0];
                        const dataLabel = chart.data.labels[element.index];
                        const dataValue = chart.data.datasets[0].data[element.index];
                        const backgroundColor = chart.data.datasets[0].backgroundColor[element.index];

                        console.log('🎯 Datos desde clic directo:', {
                            label: dataLabel,
                            value: dataValue,
                            color: backgroundColor
                        });

                        this.handleSegmentClick(dataLabel, dataValue, backgroundColor, element.index);
                    }
                }
            };

            canvas.addEventListener('click', this.directCanvasClickHandler);
            console.log('✅ Evento directo en canvas configurado');
        }
    },

        // Crear contenedor para detalles expandibles
    createDetailsContainer() {
        console.log('📦 Creando contenedor de detalles...');

        const vsContainer = document.getElementById('vs-categorias-chart-container');
        console.log('📊 Contenedor VS encontrado:', !!vsContainer);

        if (!vsContainer) {
            console.error('❌ No se encontró vs-categorias-chart-container');
            return;
        }

        // Crear contenedor si no existe
        let existingContainer = document.getElementById('vs-categorias-drill-down');
        if (!existingContainer) {
            console.log('🆕 Creando nuevo contenedor de drill-down...');

            const detailsDiv = document.createElement('div');
            detailsDiv.id = 'vs-categorias-drill-down';
            detailsDiv.className = 'drill-down-container';
            detailsDiv.style.display = 'none';
            detailsDiv.style.marginTop = '24px';
            detailsDiv.style.position = 'relative';
            detailsDiv.style.zIndex = '10';

            // Insertar después del contenedor del gráfico
            vsContainer.parentNode.insertBefore(detailsDiv, vsContainer.nextSibling);
            this.detailsContainer = detailsDiv;

            console.log('✅ Contenedor de drill-down creado:', detailsDiv.id);
        } else {
            console.log('♻️ Usando contenedor existente');
            this.detailsContainer = existingContainer;
        }

        console.log('📦 Contenedor final asignado:', !!this.detailsContainer);
    },

    // Manejar clic en segmento específico
    handleSegmentClick(segmentLabel, segmentValue, segmentColor, segmentIndex) {
        console.log('🎯 MANEJANDO CLIC EN SEGMENTO:', {
            label: segmentLabel,
            value: segmentValue,
            color: segmentColor,
            index: segmentIndex
        });

        // Si ya está expandido y es el mismo, colapsar
        if (this.expandedSegment === segmentLabel) {
            console.log('🔄 Colapsando segmento ya expandido:', segmentLabel);
            this.collapseDetails();
            return;
        }

        // Expandir nuevos detalles
        console.log('📈 Expandiendo detalles para:', segmentLabel);
        this.expandedSegment = segmentLabel;
        this.getSegmentTransactions(segmentLabel);
        this.showDetails(segmentLabel, segmentValue, segmentColor);
    },

        // Obtener transacciones específicas del segmento
    getSegmentTransactions(segmentLabel) {
        console.log('🔍 Obteniendo transacciones para segmento:', segmentLabel);

        let filteredTransactions = [];
        const resultado = EstadisticasView.vsCategorias.getDatosFiltrados();

        console.log('📊 Resultado de filtros:', {
            esGrupo: resultado.esGrupo,
            gruposCount: resultado.grupos?.length || 0,
            datosKeys: Object.keys(resultado.datos)
        });

        // Obtener todas las transacciones con filtros actuales
        let allTransactions = DataManager.getAll('transaccionesData');
        console.log('📄 Total transacciones en sistema:', allTransactions.length);

        // Aplicar los mismos filtros que en getDatosFiltrados
        const filtros = EstadisticasView.vsCategorias.filtros;
        console.log('🎛️ Filtros aplicados:', filtros);

        if (filtros.tipo && filtros.tipo !== 'Todos') {
            allTransactions = allTransactions.filter(t => t.tipo === filtros.tipo);
            console.log('🎭 Después de filtro tipo:', allTransactions.length);
        }
        if (filtros.fechaDesde) {
            allTransactions = allTransactions.filter(t => t.fecha >= filtros.fechaDesde);
            console.log('📅 Después de filtro fecha desde:', allTransactions.length);
        }
        if (filtros.fechaHasta) {
            allTransactions = allTransactions.filter(t => t.fecha <= filtros.fechaHasta);
            console.log('📅 Después de filtro fecha hasta:', allTransactions.length);
        }

        // Filtrar por el segmento específico
        if (resultado.esGrupo) {
            console.log('👥 Procesando como grupo...');
            // Es un grupo, obtener transacciones de todas las categorías del grupo
            const grupo = resultado.grupos.find(g => g.nombre === segmentLabel);
            console.log('👥 Grupo encontrado:', !!grupo, grupo?.categorias?.length || 0);

            if (grupo) {
                filteredTransactions = allTransactions.filter(t =>
                    grupo.categorias.includes(t.categoria)
                );
                console.log('🏷️ Categorías del grupo:', grupo.categorias);
            }
        } else {
            console.log('📋 Procesando como categoría individual...');
            // Es una categoría individual
            filteredTransactions = allTransactions.filter(t =>
                t.categoria === segmentLabel
            );
            console.log('🏷️ Filtrando por categoría:', segmentLabel);
        }

        this.currentTransactions = filteredTransactions;
        console.log(`✅ Transacciones encontradas para ${segmentLabel}:`, filteredTransactions.length);

        if (filteredTransactions.length > 0) {
            console.log('📄 Primeras 3 transacciones:', filteredTransactions.slice(0, 3).map(t => ({
                concepto: t.concepto,
                monto: t.monto,
                categoria: t.categoria,
                tipo: t.tipo
            })));
        }
    },

        // Mostrar detalles expandibles
    showDetails(segmentLabel, segmentValue, segmentColor) {
        console.log('👁️ Mostrando detalles para:', segmentLabel);
        console.log('📦 Contenedor disponible:', !!this.detailsContainer);

        if (!this.detailsContainer) {
            console.error('❌ No hay contenedor de detalles disponible');
            // Intentar recrear el contenedor
            this.createDetailsContainer();
            if (!this.detailsContainer) {
                console.error('❌ No se pudo crear contenedor de detalles');
                return;
            }
        }

        console.log('🎨 Renderizando contenido de detalles...');

        // Renderizar contenido PRIMERO
        this.renderDetailsContent(segmentLabel, segmentValue, segmentColor);

        console.log('📄 Contenido HTML generado, longitud:', this.detailsContainer.innerHTML.length);

        // Mostrar y animar entrada
        this.detailsContainer.style.display = 'block';
        this.detailsContainer.style.opacity = '0';
        this.detailsContainer.style.transform = 'translateY(-20px)';
        this.detailsContainer.style.transition = 'all 0.3s ease-out';

        console.log('✨ Iniciando animación de entrada...');

        // Animar entrada
        setTimeout(() => {
            this.detailsContainer.style.opacity = '1';
            this.detailsContainer.style.transform = 'translateY(0)';
            console.log('🎬 Animación de entrada completada');
        }, 50);

        // Scroll suave hacia los detalles
        setTimeout(() => {
            console.log('📜 Haciendo scroll hacia detalles...');
            this.detailsContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 200);

        console.log('✅ Detalles mostrados exitosamente');
    },

    // Renderizar contenido de detalles
    renderDetailsContent(segmentLabel, segmentValue, segmentColor) {
        console.log('🎨 Renderizando contenido para:', segmentLabel);
        console.log('📊 Transacciones disponibles:', this.currentTransactions.length);

        const transactions = this.currentTransactions;
        const transactionCount = transactions.length;

        console.log('📝 Generando HTML del contenido...');

        const htmlContent = `
            <div class="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
                <!-- Header de detalles -->
                <div class="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-6 h-6 rounded-full shadow-lg" style="background-color: ${segmentColor}"></div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900">${segmentLabel}</h3>
                                <p class="text-gray-600">${transactionCount} transacción${transactionCount !== 1 ? 'es' : ''} • $${segmentValue.toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                                                        <button onclick="VsCategoriasDrillDown.exportSegmentData('${segmentLabel}')"
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                <i class="bi bi-download mr-1"></i>
                                Exportar
                            </button>
                            <button onclick="VsCategoriasDrillDown.collapseDetails()"
                                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Pestañas de vista -->
                <div class="border-b border-gray-200 bg-gray-50">
                    <nav class="flex space-x-8 px-6" aria-label="Tabs">
                                                <button onclick="VsCategoriasDrillDown.switchView('list')"
                                class="drill-tab-btn active py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
                                data-tab="list">
                            <i class="bi bi-list-ul mr-2"></i>
                            Vista de Lista
                        </button>
                        <button onclick="VsCategoriasDrillDown.switchView('chart')"
                                class="drill-tab-btn py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                data-tab="chart">
                            <i class="bi bi-bar-chart mr-2"></i>
                            Gráfico Detallado
                        </button>
                    </nav>
                </div>

                <!-- Contenido de las pestañas -->
                <div id="drill-down-content" class="p-6">
                    ${this.renderListView()}
                </div>
            </div>
        `;

        console.log('📄 HTML generado, longitud:', htmlContent.length);
        console.log('🔧 Asignando HTML al contenedor...');

        this.detailsContainer.innerHTML = htmlContent;

        console.log('✅ Contenido HTML asignado al contenedor');
        console.log('📦 Contenedor en DOM:', document.contains(this.detailsContainer));
        console.log('👁️ Contenedor visible:', this.detailsContainer.style.display !== 'none');
    },

    // Vista de lista de transacciones
    renderListView() {
        const transactions = this.currentTransactions;

        if (transactions.length === 0) {
            return `
                <div class="text-center py-12">
                    <i class="bi bi-inbox text-4xl text-gray-300 mb-3 block"></i>
                    <div class="text-lg font-medium text-gray-900 mb-2">No hay transacciones</div>
                    <div class="text-gray-500">No se encontraron transacciones para este segmento</div>
                </div>
            `;
        }

        // Estadísticas rápidas
        const totalAmount = transactions.reduce((sum, t) => sum + (t.monto || 0), 0);
        const avgAmount = totalAmount / transactions.length;
        const maxTransaction = transactions.reduce((max, t) => (t.monto || 0) > (max.monto || 0) ? t : max, transactions[0]);

        return `
            <!-- Estadísticas rápidas -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-blue-700">Total</div>
                    <div class="text-2xl font-bold text-blue-900">$${totalAmount.toLocaleString()}</div>
                </div>
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-green-700">Promedio</div>
                    <div class="text-2xl font-bold text-green-900">$${Math.round(avgAmount).toLocaleString()}</div>
                </div>
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-purple-700">Transacciones</div>
                    <div class="text-2xl font-bold text-purple-900">${transactions.length}</div>
                </div>
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-orange-700">Mayor transacción</div>
                    <div class="text-2xl font-bold text-orange-900">$${(maxTransaction.monto || 0).toLocaleString()}</div>
                </div>
            </div>

            <!-- Tabla de transacciones -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persona</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${transactions.map(t => this.renderTransactionRow(t)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Renderizar fila de transacción
    renderTransactionRow(transaction) {
        const persona = transaction.personaId ?
            DataManager.getById('personasData', transaction.personaId) : null;

        const tipoColors = {
            'Ingreso': 'bg-green-100 text-green-800',
            'Gasto': 'bg-red-100 text-red-800',
            'Aporte': 'bg-blue-100 text-blue-800'
        };

        const tipoColor = tipoColors[transaction.tipo] || 'bg-gray-100 text-gray-800';

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.fecha || 'Sin fecha'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${transaction.concepto || 'Sin concepto'}</div>
                    <div class="text-sm text-gray-500">${transaction.categoria || 'Sin categoría'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tipoColor}">
                        ${transaction.tipo || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    $${(transaction.monto || 0).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${persona ? persona.nombre : '<span class="text-gray-400 italic">Sin persona</span>'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${transaction.notas || '<span class="text-gray-400 italic">Sin notas</span>'}
                </td>
            </tr>
        `;
    },

    // Vista de gráfico detallado
    renderChartView() {
        const transactions = this.currentTransactions;

        if (transactions.length === 0) {
            return `
                <div class="text-center py-12">
                    <i class="bi bi-graph-down text-4xl text-gray-300 mb-3 block"></i>
                    <div class="text-lg font-medium text-gray-900 mb-2">No hay datos para graficar</div>
                    <div class="text-gray-500">No se encontraron transacciones para este segmento</div>
                </div>
            `;
        }

        // Análisis detallado por transacciones individuales
        const transactionAnalysis = this.analyzeTransactionDetails(transactions);
        const monthAnalysis = this.analyzeByMonth(transactions);

        return `
            <div class="space-y-6">
                <!-- Gráfico detallado de transacciones -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Detalle de Transacciones por Persona</h4>
                    <p class="text-sm text-gray-600 mb-4">Cada punto representa una transacción individual para identificar casos puntuales</p>
                    <div class="h-80">
                        <canvas id="drill-chart-transacciones"></canvas>
                    </div>
                </div>

                <!-- Gráfico temporal -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Evolución Temporal</h4>
                    <div class="h-64">
                        <canvas id="drill-chart-temporal"></canvas>
                    </div>
                </div>

                <!-- Análisis estadístico -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Análisis Estadístico</h4>
                    ${this.renderStatisticalAnalysis(transactions)}
                </div>
            </div>
        `;
    },

    // Analizar detalles de transacciones individuales para visualización granular
    analyzeTransactionDetails(transactions) {
        return transactions.map((t, index) => {
            const persona = t.personaId ?
                DataManager.getById('personasData', t.personaId) : null;
            const personName = persona ? persona.nombre : 'Sin persona';

            return {
                id: index,
                concepto: t.concepto || 'Sin concepto',
                monto: t.monto || 0,
                fecha: t.fecha || '',
                persona: personName,
                tipo: t.tipo || 'N/A',
                categoria: t.categoria || '',
                notas: t.notas || ''
            };
        }).sort((a, b) => b.monto - a.monto); // Ordenar por monto descendente
    },

    // Analizar transacciones por persona (método original mantenido para compatibilidad)
    analyzeByPerson(transactions) {
        const personData = {};
        transactions.forEach(t => {
            const persona = t.personaId ?
                DataManager.getById('personasData', t.personaId) : null;
            const personName = persona ? persona.nombre : 'Sin persona';

            if (!personData[personName]) {
                personData[personName] = 0;
            }
            personData[personName] += t.monto || 0;
        });

        return Object.entries(personData).map(([name, amount]) => ({ name, amount }));
    },

    // Analizar transacciones por mes
    analyzeByMonth(transactions) {
        const monthData = {};
        transactions.forEach(t => {
            if (!t.fecha) return;

            const monthKey = t.fecha.substring(0, 7); // YYYY-MM
            if (!monthData[monthKey]) {
                monthData[monthKey] = 0;
            }
            monthData[monthKey] += t.monto || 0;
        });

        return Object.entries(monthData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount }));
    },

    // Renderizar análisis estadístico
    renderStatisticalAnalysis(transactions) {
        const amounts = transactions.map(t => t.monto || 0);
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        const avg = total / amounts.length;
        const max = Math.max(...amounts);
        const min = Math.min(...amounts);

        // Calcular mediana
        const sortedAmounts = [...amounts].sort((a, b) => a - b);
        const median = sortedAmounts.length % 2 === 0
            ? (sortedAmounts[sortedAmounts.length/2 - 1] + sortedAmounts[sortedAmounts.length/2]) / 2
            : sortedAmounts[Math.floor(sortedAmounts.length/2)];

        return `
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">$${total.toLocaleString()}</div>
                    <div class="text-sm text-gray-600">Total</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">$${Math.round(avg).toLocaleString()}</div>
                    <div class="text-sm text-gray-600">Promedio</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">$${Math.round(median).toLocaleString()}</div>
                    <div class="text-sm text-gray-600">Mediana</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">$${max.toLocaleString()}</div>
                    <div class="text-sm text-gray-600">Máximo</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">$${min.toLocaleString()}</div>
                    <div class="text-sm text-gray-600">Mínimo</div>
                </div>
            </div>
        `;
    },

    // Cambiar entre vistas
    switchView(viewType) {
        // Actualizar botones
        document.querySelectorAll('.drill-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeBtn = document.querySelector(`[data-tab="${viewType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-blue-500', 'text-blue-600');
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
        }

        // Actualizar contenido
        const contentContainer = document.getElementById('drill-down-content');
        if (!contentContainer) return;

        if (viewType === 'list') {
            contentContainer.innerHTML = this.renderListView();
        } else if (viewType === 'chart') {
            contentContainer.innerHTML = this.renderChartView();
            // Renderizar gráficos después de que el DOM se actualice
            setTimeout(() => {
                this.renderDetailCharts();
            }, 100);
        }
    },

    // Renderizar gráficos detallados
    renderDetailCharts() {
        const transactions = this.currentTransactions;

        // Gráfico detallado de transacciones
        const transaccionesCanvas = document.getElementById('drill-chart-transacciones');
        if (transaccionesCanvas) {
            const transactionAnalysis = this.analyzeTransactionDetails(transactions);
            this.createTransactionDetailChart(transaccionesCanvas, transactionAnalysis);
        }

        // Gráfico temporal
        const temporalCanvas = document.getElementById('drill-chart-temporal');
        if (temporalCanvas) {
            const monthAnalysis = this.analyzeByMonth(transactions);
            this.createTemporalChart(temporalCanvas, monthAnalysis);
        }
    },

    // Crear gráfico detallado de transacciones individuales
    createTransactionDetailChart(canvas, transactionData) {
        const ctx = canvas.getContext('2d');

        // Agrupar por persona para colores consistentes
        const personasUnicas = [...new Set(transactionData.map(t => t.persona))];
        const colorMap = {};
        personasUnicas.forEach((persona, index) => {
            colorMap[persona] = this.detailColors[index % this.detailColors.length];
        });

        // Preparar datos para scatter plot
        const datasets = personasUnicas.map(persona => {
            const transaccionesPersona = transactionData.filter(t => t.persona === persona);

            return {
                label: persona,
                data: transaccionesPersona.map((t, index) => ({
                    x: index + 1, // Número de transacción
                    y: t.monto,
                    concepto: t.concepto,
                    fecha: t.fecha,
                    tipo: t.tipo,
                    notas: t.notas
                })),
                backgroundColor: colorMap[persona] + '80', // 50% transparencia
                borderColor: colorMap[persona],
                borderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            };
        });

        new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                return `Transacción #${point.parsed.x}`;
                            },
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `${context.dataset.label}: $${point.y.toLocaleString()}`,
                                    `Concepto: ${point.concepto}`,
                                    `Fecha: ${point.fecha}`,
                                    `Tipo: ${point.tipo}`,
                                    ...(point.notas ? [`Notas: ${point.notas}`] : [])
                                ];
                            }
                        },
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Número de Transacción'
                        },
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return '#' + Math.floor(value);
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Monto ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'point'
                }
            }
        });
    },

    // Crear gráfico temporal
    createTemporalChart(canvas, monthData) {
        const ctx = canvas.getContext('2d');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthData.map(m => m.month),
                datasets: [{
                    label: 'Monto',
                    data: monthData.map(m => m.amount),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    },

        // Colapsar detalles
    collapseDetails() {
        console.log('🔄 Colapsando detalles...');

        if (!this.detailsContainer) {
            console.log('⚠️ No hay contenedor para colapsar');
            return;
        }

        console.log('✨ Iniciando animación de salida...');
        this.detailsContainer.style.transition = 'all 0.3s ease-out';
        this.detailsContainer.style.opacity = '0';
        this.detailsContainer.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            console.log('🙈 Ocultando contenedor...');
            this.detailsContainer.style.display = 'none';
            this.expandedSegment = null;
            this.currentTransactions = [];

            // Limpiar gráficos
            if (this.currentChart) {
                this.currentChart.destroy();
                this.currentChart = null;
            }

            console.log('✅ Detalles colapsados exitosamente');
        }, 300);
    },

    // Exportar datos del segmento
    exportSegmentData(segmentLabel) {
        const transactions = this.currentTransactions;

        if (transactions.length === 0) {
            Utils && Utils.showToast ?
                Utils.showToast('No hay datos para exportar', 'warning') :
                alert('No hay datos para exportar');
            return;
        }

        // Preparar datos para CSV
        const csvData = transactions.map(t => {
            const persona = t.personaId ? DataManager.getById('personasData', t.personaId) : null;
            const campana = t.campanaId ? DataManager.getById('campanasData', t.campanaId) : null;

            return {
                'Fecha': t.fecha || '',
                'Concepto': t.concepto || '',
                'Categoría': t.categoria || '',
                'Tipo': t.tipo || '',
                'Monto': t.monto || 0,
                'Moneda': t.moneda || 'COP',
                'Persona': persona ? persona.nombre : '',
                'Tipo de Gasto': campana ? campana.nombre : '',
                'Notas': t.notas || ''
            };
        });

        // Crear CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row =>
                headers.map(header =>
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ].join('\n');

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${segmentLabel.replace(/[^a-zA-Z0-9]/g, '_')}_detalle.csv`;
        link.click();

                Utils && Utils.showToast ?
            Utils.showToast(`Datos de "${segmentLabel}" exportados exitosamente`, 'success') :
            alert('Datos exportados exitosamente');
    },

    // Método de debug para testing
    debugTest() {
        console.log('🔧 === DEBUG TEST DEL DRILL-DOWN ===');

        // Verificar estado del sistema
        console.log('📊 Estado del sistema:', {
            EstadisticasView: !!window.EstadisticasView,
            vsCategorias: !!window.EstadisticasView?.vsCategorias,
            chart: !!window.EstadisticasView?.vsCategorias?.chart,
            canvas: !!document.getElementById('estadisticas-vs-categorias-chart'),
            detailsContainer: !!this.detailsContainer
        });

        // Intentar obtener datos del gráfico
        const chart = EstadisticasView?.vsCategorias?.chart;
        if (chart) {
            console.log('📈 Datos del gráfico:', {
                labels: chart.data.labels,
                datasets: chart.data.datasets?.length,
                hasData: chart.data.datasets?.[0]?.data?.length > 0
            });

            // Simular clic en el primer segmento si hay datos
            if (chart.data.labels?.length > 0) {
                const firstLabel = chart.data.labels[0];
                const firstValue = chart.data.datasets[0].data[0];
                const firstColor = chart.data.datasets[0].backgroundColor[0];

                console.log('🎯 Simulando clic en primer segmento:', firstLabel);
                this.handleSegmentClick(firstLabel, firstValue, firstColor, 0);
            } else {
                console.log('⚠️ No hay datos en el gráfico para simular clic');
            }
        } else {
            console.log('❌ No se encontró el gráfico para debug');
        }

                // Verificar eventos
        this.retryAttachEvents();

        console.log('🔧 === FIN DEBUG TEST ===');
    },

    // Test forzado simple
    forceShowTest() {
        console.log('🧪 === TEST FORZADO ===');

        // Crear contenedor si no existe
        if (!this.detailsContainer) {
            this.createDetailsContainer();
        }

        // Contenido de prueba simple
        const testContent = `
            <div style="background: white; border: 2px solid red; padding: 20px; margin: 20px 0; border-radius: 10px;">
                <h3 style="color: red; margin: 0 0 10px 0;">🧪 TEST DE DRILL-DOWN</h3>
                <p style="margin: 0; color: #333;">Si ves este mensaje, el contenedor funciona correctamente.</p>
                <button onclick="VsCategoriasDrillDown.collapseDetails()"
                        style="background: red; color: white; border: none; padding: 10px 15px; border-radius: 5px; margin-top: 10px; cursor: pointer;">
                    ❌ Cerrar Test
                </button>
            </div>
        `;

        // Mostrar contenido
        this.detailsContainer.innerHTML = testContent;
        this.detailsContainer.style.display = 'block';
        this.detailsContainer.style.opacity = '1';
        this.detailsContainer.style.transform = 'translateY(0)';
        this.detailsContainer.style.transition = 'none';

        // Scroll hacia el contenido
        this.detailsContainer.scrollIntoView({ behavior: 'smooth' });

        console.log('🧪 Test forzado aplicado');
        console.log('📦 Contenedor visible:', this.detailsContainer.style.display);
        console.log('📄 Contenido HTML:', this.detailsContainer.innerHTML.length > 0);
    }
};

// CSS para el drill down (se puede mover a archivo CSS separado)
const drillDownStyles = `
    .drill-down-container {
        margin-top: 24px;
        animation: fadeInUp 0.3s ease-out;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .drill-tab-btn {
        transition: all 0.2s ease;
    }

    .drill-tab-btn.active {
        border-bottom-width: 2px;
    }

    .drill-tab-btn:hover:not(.active) {
        border-bottom-width: 2px;
    }
`;

// Inyectar estilos
if (!document.getElementById('drill-down-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'drill-down-styles';
    styleSheet.textContent = drillDownStyles;
    document.head.appendChild(styleSheet);
}

// Auto-inicializar cuando se carga el script
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM cargado, inicializando drill-down...');

    // Esperar a que EstadisticasView esté disponible
    const initDrillDown = () => {
        console.log('🔄 Intentando inicializar drill-down...');

        if (window.EstadisticasView && window.EstadisticasView.vsCategorias) {
            console.log('✅ EstadisticasView disponible, inicializando...');
            VsCategoriasDrillDown.init();

            // Reintentar adjuntar eventos después de un delay adicional
            setTimeout(() => {
                console.log('🔄 Reintentando adjuntar eventos...');
                VsCategoriasDrillDown.retryAttachEvents();
            }, 2000);

        } else {
            console.log('⏳ EstadisticasView no disponible aún, reintentando...');
            setTimeout(initDrillDown, 100);
        }
    };

    initDrillDown();
});

// Método adicional para reintentar adjuntar eventos
VsCategoriasDrillDown.retryAttachEvents = function() {
    console.log('🔄 Reintentando adjuntar eventos de drill-down...');

    // Verificar si hay un gráfico disponible
    const chart = EstadisticasView?.vsCategorias?.chart;
    const canvas = document.getElementById('estadisticas-vs-categorias-chart');

    console.log('📊 Estado actual:', {
        chart: !!chart,
        canvas: !!canvas,
        expandedSegment: this.expandedSegment
    });

    if (chart && canvas) {
        console.log('✅ Gráfico y canvas disponibles, adjuntando eventos...');
        this.attachClickEvent();
    } else {
        console.log('⚠️ Gráfico o canvas no disponibles para adjuntar eventos');
    }
};
