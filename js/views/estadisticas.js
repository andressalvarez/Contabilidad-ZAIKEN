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

    // --- VS de Categorías ---
    vsCategorias: {
        chart: null,
        categorias: [],
        colores: {},
        grupos: {}, // Nuevo: grupos de categorías {nombreGrupo: {categorias: [], color: '', nombre: ''}}
        filtros: {
            categorias: [],
            tipo: 'Gasto',
            fechaDesde: '',
            fechaHasta: '',
            chartType: 'bar',
            gruposSeleccionados: [], // Nuevo: para almacenar los IDs de grupos seleccionados
        },
        coloresBase: [
            '#6366f1','#f59e42','#10b981','#ef4444','#fbbf24','#3b82f6','#a21caf','#eab308','#0ea5e9','#f472b6'
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
                    }
                } catch {}
            }
            this.categorias = DataManager.getAll('categoriasData').map(c => c.nombre);
            if (!this.filtros.categorias.length) this.filtros.categorias = this.categorias.slice(0,2); // Por defecto 2 primeras
            this.colores = this.colores || {};
            this.grupos = this.grupos || {};
            this.categorias.forEach((cat, i) => {
                if (!this.colores[cat]) this.colores[cat] = this.coloresBase[i % this.coloresBase.length];
            });
            this.renderSelectores();
            this.attachEvents();
            this.applySavedConfig();
            this.renderChart();
        },
        renderSelectores() {
            // Renderizar chips visuales para grupos seleccionados o mensaje si no hay grupos
            const chipsCont = document.getElementById('vs-categorias-chips');
            if (!chipsCont) return;
            chipsCont.innerHTML = '';
            chipsCont.style.marginBottom = '1.5rem'; // Espacio extra debajo de los chips
            chipsCont.style.gap = '0.75rem'; // Más espacio entre chips
            const gruposArray = Object.entries(this.grupos);
            const hayGrupos = gruposArray.length > 0;
            let seleccionados = [];
            if (hayGrupos) {
                // Mostrar chips de grupos
                gruposArray.forEach(([id, grupo]) => {
                    if (grupo.visible === undefined) grupo.visible = true;
                    const chip = document.createElement('div');
                    chip.className = 'flex items-center gap-2 px-4 py-2 rounded-full text-white text-base font-medium shadow-md border border-gray-300 cursor-pointer select-none transition-all';
                    chip.style.background = grupo.color;
                    chip.style.opacity = grupo.visible ? '1' : '0.4';
                    chip.style.margin = '0.25rem 0.5rem 0.25rem 0';
                    chip.style.boxShadow = '0 2px 8px 0 rgba(0,0,0,0.08)';
                    chip.innerHTML = `
                        <span class="cat-name">${grupo.nombre}</span>
                        <button type="button" class="ml-1 text-white hover:text-gray-200 focus:outline-none toggle-ojito" title="${grupo.visible ? 'Ocultar' : 'Mostrar'}">
                            <i class="bi ${grupo.visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}"></i>
                        </button>
                    `;
                    chip.querySelector('.toggle-ojito').addEventListener('click', e => {
                        e.stopPropagation();
                        this.grupos[id].visible = !this.grupos[id].visible;
                        this.saveConfig();
                        this.renderSelectores();
                        this.renderChart();
                    });
                    chip.addEventListener('click', e => {
                        if (e.target.classList.contains('toggle-ojito')) return;
                        if (!this.filtros.gruposSeleccionados) this.filtros.gruposSeleccionados = [];
                        const idx = this.filtros.gruposSeleccionados.indexOf(id);
                        if (idx === -1) {
                            this.filtros.gruposSeleccionados.push(id);
                        } else {
                            this.filtros.gruposSeleccionados.splice(idx, 1);
                        }
                        this.saveConfig();
                        this.renderSelectores();
                        this.renderChart();
                    });
                    if (!this.filtros.gruposSeleccionados) this.filtros.gruposSeleccionados = [];
                    if (this.filtros.gruposSeleccionados.includes(id)) {
                        chip.classList.add('ring-2','ring-white','ring-offset-2','ring-offset-gray-400');
                        seleccionados.push(id);
                    }
                    chipsCont.appendChild(chip);
                });
                if (seleccionados.length === 0) {
                    this.filtros.gruposSeleccionados = gruposArray.filter(([id, g])=>g.visible!==false).map(([id])=>id);
                }
            } else {
                // Mostrar mensaje si no hay grupos
                const msg = document.createElement('div');
                msg.className = 'text-gray-500 py-2 px-3';
                msg.textContent = 'No hay grupos creados. Haz clic en “Crear grupo” para comenzar.';
                chipsCont.appendChild(msg);
            }
            // Botones debajo de los chips
            let gruposBtn = document.getElementById('vs-categorias-grupos');
            if (!gruposBtn) {
                gruposBtn = document.createElement('button');
                gruposBtn.id = 'vs-categorias-grupos';
                gruposBtn.type = 'button';
                gruposBtn.className = 'btn btn-sm btn-info ml-2 mt-2';
                gruposBtn.textContent = 'Crear grupo';
                gruposBtn.onclick = () => this.mostrarPopupGrupos();
                chipsCont.parentElement.appendChild(gruposBtn);
            }
            let gestionarBtn = document.getElementById('vs-categorias-gestionar');
            if (!gestionarBtn) {
                gestionarBtn = document.createElement('button');
                gestionarBtn.id = 'vs-categorias-gestionar';
                gestionarBtn.type = 'button';
                gestionarBtn.className = 'btn btn-sm btn-secondary ml-2 mt-2';
                gestionarBtn.textContent = 'Gestionar grupos';
                gestionarBtn.onclick = () => this.mostrarPopupGrupos();
                chipsCont.parentElement.appendChild(gestionarBtn);
            }
            let saveBtn = document.getElementById('vs-categorias-save');
            if (!saveBtn) {
                saveBtn = document.createElement('button');
                saveBtn.id = 'vs-categorias-save';
                saveBtn.type = 'button';
                saveBtn.className = 'btn btn-sm btn-success ml-2 mt-2';
                saveBtn.textContent = 'Guardar como predefinido';
                saveBtn.onclick = () => this.saveConfig();
                chipsCont.parentElement.appendChild(saveBtn);
            }
            // Ayuda sobre porcentajes
            let ayuda = document.getElementById('vs-categorias-ayuda');
            if (!ayuda) {
                ayuda = document.createElement('div');
                ayuda.id = 'vs-categorias-ayuda';
                ayuda.className = 'text-xs text-gray-500 mt-2';
                ayuda.innerHTML = '<i class="bi bi-info-circle mr-1"></i>El % indica la proporción de cada grupo respecto al total mostrado en la gráfica.';
                chipsCont.parentElement.appendChild(ayuda);
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
        mostrarPopupGrupos() {
            const popup = document.createElement('div');
            popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            // Sugerir color único
            const usados = Object.values(this.grupos).map(g => g.color);
            let sugerido = this.coloresBase.find(c => !usados.includes(c)) || this.coloresBase[0];
            popup.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Gestionar Grupos de Categorías</h3>
                        <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">&times;</button>
                    </div>

                    <!-- Crear nuevo grupo -->
                    <div class="mb-6 p-4 bg-gray-50 rounded">
                        <h4 class="font-medium mb-3">Crear Nuevo Grupo</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input type="text" id="nuevo-grupo-nombre" placeholder="Nombre del grupo" class="form-input">
                            <input type="color" id="nuevo-grupo-color" value="${sugerido}" class="w-12 h-10 border rounded">
                            <button onclick="EstadisticasView.vsCategorias.crearGrupo()" class="btn btn-primary">Crear Grupo</button>
                        </div>
                        <div class="mt-3">
                            <label class="block text-sm font-medium mb-2">Categorías del grupo:</label>
                            <div id="nuevo-grupo-categorias" class="flex flex-wrap gap-2"></div>
                        </div>
                    </div>

                    <!-- Grupos existentes -->
                    <div>
                        <h4 class="font-medium mb-3">Grupos Existentes</h4>
                        <div id="grupos-existentes"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
            this.renderPopupGrupos();
        },
        renderPopupGrupos() {
            // Renderizar categorías disponibles para nuevo grupo
            const cont = document.getElementById('nuevo-grupo-categorias');
            if (cont) {
                cont.innerHTML = this.categorias.map(cat => `
                    <label class="flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" value="${cat}" class="categoria-checkbox">
                        <span>${cat}</span>
                    </label>
                `).join('');
            }
            // Renderizar grupos existentes
            const gruposCont = document.getElementById('grupos-existentes');
            if (gruposCont) {
                if (Object.keys(this.grupos).length === 0) {
                    gruposCont.innerHTML = '<p class="text-gray-500">No hay grupos creados</p>';
                } else {
                    gruposCont.innerHTML = Object.entries(this.grupos).map(([id, grupo]) => {
                        if (grupo.editando) {
                            // Modo edición
                            return `
                                <div class="border rounded p-3 mb-3 bg-gray-50">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <input type="text" id="edit-nombre-${id}" value="${grupo.nombre}" class="form-input w-32" />
                                            <input type="color" id="edit-color-${id}" value="${grupo.color}" class="w-8 h-8 border rounded" />
                                            <span class="text-sm text-gray-500">(${grupo.categorias.length} categorías)</span>
                                        </div>
                                        <div class="flex gap-2">
                                            <button onclick="EstadisticasView.vsCategorias.guardarEdicionGrupo('${id}')" class="btn btn-xs btn-success"><i class="bi bi-check"></i></button>
                                            <button onclick="EstadisticasView.vsCategorias.cancelarEdicionGrupo('${id}')" class="btn btn-xs btn-outline"><i class="bi bi-x"></i></button>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-2 mb-2">
                                        ${this.categorias.map(cat => `
                                            <label class="flex items-center gap-1 px-2 py-1 bg-white border rounded cursor-pointer hover:bg-gray-100">
                                                <input type="checkbox" value="${cat}" class="edit-cat-checkbox" data-grupo="${id}" ${grupo.categorias.includes(cat) ? 'checked' : ''} />
                                                <span>${cat}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        } else {
                            // Vista normal
                            return `
                                <div class="border rounded p-3 mb-3">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-4 h-4 rounded" style="background: ${grupo.color}"></div>
                                            <span class="font-medium">${grupo.nombre}</span>
                                            <span class="text-sm text-gray-500">(${grupo.categorias.length} categorías)</span>
                                        </div>
                                        <div class="flex gap-2">
                                            <button onclick="EstadisticasView.vsCategorias.editarGrupo('${id}')" class="text-blue-500 hover:text-blue-700"><i class="bi bi-pencil"></i></button>
                                            <button onclick="EstadisticasView.vsCategorias.eliminarGrupo('${id}')" class="text-red-500 hover:text-red-700">&times;</button>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${grupo.categorias.map(cat => `
                                            <span class="px-2 py-1 bg-gray-100 rounded text-sm">${cat}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }
                    }).join('');
                }
            }
        },
        crearGrupo() {
            const nombre = document.getElementById('nuevo-grupo-nombre').value.trim();
            const color = document.getElementById('nuevo-grupo-color').value;
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
                visible: true
            };
            // Guardar inmediatamente
            this.saveConfig();
            // Limpiar formulario
            document.getElementById('nuevo-grupo-nombre').value = '';
            document.getElementById('nuevo-grupo-color').value = '#6366f1';
            document.querySelectorAll('#nuevo-grupo-categorias input').forEach(cb => cb.checked = false);
            this.renderPopupGrupos();
            this.renderSelectores();
            this.renderChart();
        },
        eliminarGrupo(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
                delete this.grupos[id];
                this.renderPopupGrupos();
                this.renderChart();
            }
        },
        editarGrupo(id) {
            this.grupos[id].editando = true;
            this.renderPopupGrupos();
        },
        cancelarEdicionGrupo(id) {
            this.grupos[id].editando = false;
            this.renderPopupGrupos();
        },
        guardarEdicionGrupo(id) {
            const nombre = document.getElementById(`edit-nombre-${id}`).value.trim();
            const color = document.getElementById(`edit-color-${id}`).value;
            const cats = Array.from(document.querySelectorAll(`.edit-cat-checkbox[data-grupo='${id}']:checked`)).map(cb => cb.value);
            if (!nombre) {
                alert('El nombre no puede estar vacío');
                return;
            }
            if (cats.length === 0) {
                alert('Selecciona al menos una categoría');
                return;
            }
            this.grupos[id].nombre = nombre;
            this.grupos[id].color = color;
            this.grupos[id].categorias = cats;
            this.grupos[id].editando = false;
            this.saveConfig();
            this.renderPopupGrupos();
            this.renderSelectores();
            this.renderChart();
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
            if (!ctx) return;
            if (this.chart) { this.chart.destroy(); }
            const resultado = this.getDatosFiltrados();
            const labels = Object.keys(resultado.datos);
            const values = Object.values(resultado.datos);
            const total = values.reduce((a, b) => a + b, 0) || 1;
            if (labels.length === 0 || values.every(v => v === 0)) {
                ctx.parentElement.innerHTML = '<div class="text-center text-gray-400 py-8">No hay datos para mostrar para las categorías seleccionadas.</div>';
                return;
            } else {
                ctx.parentElement.innerHTML = '<canvas id="estadisticas-vs-categorias-chart" class="absolute inset-0 w-full h-full"></canvas>';
            }
            const newCtx = document.getElementById('estadisticas-vs-categorias-chart');
            let chartOptions = {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                                const porcentaje = ((valor / total) * 100).toFixed(1) + '%';
                                return `${context.label}: ${valor} (${porcentaje})`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#222',
                        font: { weight: 'bold' },
                        formatter: function(value, context) {
                            const porcentaje = ((value / total) * 100).toFixed(1);
                            return porcentaje > 0 ? porcentaje + '%' : '';
                        }
                    }
                },
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            };
            if (['pie', 'doughnut'].includes(this.filtros.chartType)) {
                chartOptions.plugins.legend.display = true;
                chartOptions.scales = {};
            }
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
            this.chart = new Chart(newCtx, {
                type: this.filtros.chartType,
                data: {
                    labels,
                    datasets: [{
                        label: 'Monto',
                        data: values,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 2,
                        fill: this.filtros.chartType === 'bar',
                        tension: 0.3
                    }]
                },
                options: chartOptions,
                plugins: window.ChartDataLabels ? [ChartDataLabels] : []
            });
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
            // Aplicar valores guardados a los campos del formulario
            const tipoSel = document.getElementById('vs-tipo-select');
            const desde = document.getElementById('vs-fecha-desde');
            const hasta = document.getElementById('vs-fecha-hasta');
            const chartType = document.getElementById('vs-chart-type');
            if (tipoSel && this.filtros.tipo) tipoSel.value = this.filtros.tipo;
            if (desde && this.filtros.fechaDesde) desde.value = this.filtros.fechaDesde;
            if (hasta && this.filtros.fechaHasta) hasta.value = this.filtros.fechaHasta;
            if (chartType && this.filtros.chartType) chartType.value = this.filtros.chartType;
            // Restaurar gruposSeleccionados si existe
            if (this.filtros.gruposSeleccionados && Array.isArray(this.filtros.gruposSeleccionados)) {
                // Nada extra, ya está en memoria
            } else {
                this.filtros.gruposSeleccionados = [];
            }
        },
        saveConfig() {
            // Obtener valores actuales de los campos del formulario
            const tipoSel = document.getElementById('vs-tipo-select');
            const desde = document.getElementById('vs-fecha-desde');
            const hasta = document.getElementById('vs-fecha-hasta');
            const chartType = document.getElementById('vs-chart-type');
            if (tipoSel) this.filtros.tipo = tipoSel.value;
            if (desde) this.filtros.fechaDesde = desde.value;
            if (hasta) this.filtros.fechaHasta = hasta.value;
            if (chartType) this.filtros.chartType = chartType.value;
            const config = {
                categorias: this.filtros.categorias,
                tipo: this.filtros.tipo,
                fechaDesde: this.filtros.fechaDesde,
                fechaHasta: this.filtros.fechaHasta,
                chartType: this.filtros.chartType,
                colores: this.colores,
                grupos: this.grupos,
                gruposSeleccionados: this.filtros.gruposSeleccionados
            };
            localStorage.setItem('vsCategoriasConfig', JSON.stringify(config));
            Utils && Utils.showToast ? Utils.showToast('Configuración guardada', 'success') : alert('Configuración guardada');
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
