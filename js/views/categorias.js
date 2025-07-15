// Categorías View - Mejorado con sistema de carpetas
window.CategoriasView = {
    table: null,
    carpetas: {},
    categoriasPorCarpeta: {},

    // Inicializar vista
    init() {
        console.log('Inicializando vista Categorías...');
        this.loadCarpetasFromEstadisticas();
        this.renderCarpetasYGrupos();
        this.initTable();
        console.log('Categorías vista inicializada');
    },

    // Cargar carpetas desde la configuración de estadísticas
    loadCarpetasFromEstadisticas() {
        const saved = localStorage.getItem('vsCategoriasConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                if (config.carpetas) this.carpetas = config.carpetas;
                if (config.grupos) this.grupos = config.grupos;
            } catch {}
        }
    },

    // Renderizar organización de carpetas y grupos activos
    renderCarpetasYGrupos() {
        const container = document.getElementById('categorias-organizacion');
        if (!container) {
            // Crear el contenedor si no existe
            const mainContent = document.querySelector('#main-content');
            if (mainContent) {
                try {
                    const newContainer = document.createElement('div');
                    newContainer.id = 'categorias-organizacion';
                    newContainer.className = 'mb-6';

                    // Buscar un lugar seguro para insertar
                    const categoriasTable = document.getElementById('categorias-table');
                    const firstChild = mainContent.firstElementChild;

                    if (categoriasTable && categoriasTable.parentElement && mainContent.contains(categoriasTable.parentElement)) {
                        mainContent.insertBefore(newContainer, categoriasTable.parentElement);
                    } else if (firstChild) {
                        mainContent.insertBefore(newContainer, firstChild);
                    } else {
                        mainContent.appendChild(newContainer);
                    }
                } catch (error) {
                    console.warn('Error al crear contenedor de organización:', error);
                    // Intentar simplemente agregar al final
                    try {
                        const newContainer = document.createElement('div');
                        newContainer.id = 'categorias-organizacion';
                        newContainer.className = 'mb-6';
                        mainContent.appendChild(newContainer);
                    } catch (fallbackError) {
                        console.error('Error crítico al crear contenedor:', fallbackError);
                        return;
                    }
                }
            }
        }

        const organContainer = document.getElementById('categorias-organizacion');
        if (!organContainer) return;

        const gruposActivos = Object.entries(this.grupos || {})
            .filter(([id, grupo]) => grupo.visible !== false);

        const carpetasConGrupos = Object.entries(this.carpetas || {})
            .filter(([id, carpeta]) => {
                const gruposEnCarpeta = gruposActivos.filter(([grupoId, grupo]) => grupo.carpetaId === id);
                return gruposEnCarpeta.length > 0;
            });

        const gruposSinCarpeta = gruposActivos.filter(([id, grupo]) => !grupo.carpetaId);

        if (carpetasConGrupos.length === 0 && gruposSinCarpeta.length === 0) {
            organContainer.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="bi bi-info-circle text-blue-500 mr-3"></i>
                        <div>
                            <h4 class="font-medium text-blue-900">Organización de Categorías</h4>
                            <p class="text-blue-700 text-sm">Los grupos activos de la sección Estadísticas aparecerán aquí para facilitar la navegación.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        organContainer.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Organización por Grupos</h3>
                            <p class="text-sm text-gray-600">Grupos activos organizados por carpetas</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                <i class="bi bi-folder-fill mr-1"></i>
                                ${carpetasConGrupos.length} carpetas
                            </span>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <i class="bi bi-tags-fill mr-1"></i>
                                ${gruposActivos.length} grupos activos
                            </span>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${this.renderCarpetasConGrupos(carpetasConGrupos, gruposActivos)}
                        ${gruposSinCarpeta.length > 0 ? this.renderGruposSinCarpeta(gruposSinCarpeta) : ''}
                    </div>
                </div>
            </div>
        `;
    },

    renderCarpetasConGrupos(carpetasConGrupos, gruposActivos) {
        return carpetasConGrupos.map(([carpetaId, carpeta]) => {
            const gruposEnCarpeta = gruposActivos.filter(([grupoId, grupo]) => grupo.carpetaId === carpetaId);

            return `
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-4 h-4 rounded" style="background: ${carpeta.color}"></div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${carpeta.nombre}</h4>
                            <p class="text-sm text-gray-600">${gruposEnCarpeta.length} grupos activos</p>
                        </div>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-gray-300">
                            <i class="bi bi-folder-fill mr-1"></i>
                            Carpeta
                        </span>
                    </div>

                    <div class="space-y-2">
                        ${gruposEnCarpeta.map(([grupoId, grupo]) => `
                            <div class="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                                <div class="flex items-center space-x-3">
                                    <div class="w-3 h-3 rounded-full" style="background: ${grupo.color}"></div>
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">${grupo.nombre}</div>
                                        <div class="text-xs text-gray-500">
                                            ${grupo.categorias.length} categorías: ${grupo.categorias.slice(0, 3).join(', ')}${grupo.categorias.length > 3 ? '...' : ''}
                                        </div>
                                    </div>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Activo
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderGruposSinCarpeta(gruposSinCarpeta) {
        return `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-4 h-4 rounded bg-gray-400"></div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">Sin Carpeta</h4>
                        <p class="text-sm text-gray-600">${gruposSinCarpeta.length} grupos sin organizar</p>
                    </div>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                        <i class="bi bi-tags mr-1"></i>
                        Sin carpeta
                    </span>
                </div>

                <div class="space-y-2">
                    ${gruposSinCarpeta.map(([grupoId, grupo]) => `
                        <div class="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                            <div class="flex items-center space-x-3">
                                <div class="w-3 h-3 rounded-full" style="background: ${grupo.color}"></div>
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${grupo.nombre}</div>
                                    <div class="text-xs text-gray-500">
                                        ${grupo.categorias.length} categorías: ${grupo.categorias.slice(0, 3).join(', ')}${grupo.categorias.length > 3 ? '...' : ''}
                                    </div>
                                </div>
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Activo
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Inicializar tabla mejorada
    initTable() {
        const container = document.getElementById('categorias-table');
        if (!container) return;

        this.table = new Tabulator(container, {
            height: "400px",
            layout: "fitColumns",
            responsiveLayout: false,
            pagination: "local",
            paginationSize: 15,
            rowFormatter: function(row) {
                // Añadir clases CSS para mejor presentación
                row.getElement().classList.add('hover:bg-gray-50', 'transition-colors');
            },
            columns: [
                {
                    title: "ID",
                    field: "id",
                    width: 60,
                    headerSort: false
                },
                {
                    title: "Nombre de Categoría",
                    field: "nombre",
                    minWidth: 200,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return `<div class="font-medium text-gray-900">${value}</div>`;
                    }
                },
                {
                    title: "Uso en Transacciones",
                    field: "uso",
                    width: 150,
                    formatter: (cell) => {
                        const categoriaId = cell.getRow().getData().id;
                        const transacciones = DataManager.getAll('transaccionesData');
                        const uso = transacciones.filter(t => t.categoria === cell.getRow().getData().nombre).length;

                        let badgeClass = 'bg-gray-100 text-gray-800';
                        if (uso > 10) badgeClass = 'bg-green-100 text-green-800';
                        else if (uso > 5) badgeClass = 'bg-yellow-100 text-yellow-800';
                        else if (uso > 0) badgeClass = 'bg-blue-100 text-blue-800';

                        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
                            <i class="bi bi-graph-up mr-1"></i>
                            ${uso} veces
                        </span>`;
                    }
                },
                {
                    title: "Grupos Asignados",
                    field: "grupos",
                    width: 180,
                    formatter: (cell) => {
                        const categoriaNombre = cell.getRow().getData().nombre;
                        const grupos = Object.values(this.grupos || {})
                            .filter(grupo => grupo.categorias && grupo.categorias.includes(categoriaNombre));

                        if (grupos.length === 0) {
                            return '<span class="text-gray-400 text-sm">Sin grupos</span>';
                        }

                        return grupos.slice(0, 2).map(grupo =>
                            `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">
                                <div class="w-2 h-2 rounded-full mr-1" style="background: ${grupo.color}"></div>
                                ${grupo.nombre}
                            </span>`
                        ).join('') + (grupos.length > 2 ? `<span class="text-xs text-gray-500">+${grupos.length - 2} más</span>` : '');
                    }
                },
                {
                    title: "Acciones",
                    field: "acciones",
                    width: 120,
                    headerSort: false,
                    formatter: () => {
                        return `<button class="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                                onclick="CategoriasView.eliminarCategoria(this)">
                            <i class="bi bi-trash mr-1"></i>
                            Eliminar
                        </button>`;
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

        const categorias = DataManager.getAll('categoriasData') || [];
        this.table.setData(categorias);
    },

    // Agregar nueva categoría con mejores validaciones
    agregarCategoria() {
        const nombre = document.getElementById('categoria-nombre').value.trim();

        // Validaciones mejoradas
        if (!nombre) {
            Utils.showToast('Por favor ingrese el nombre de la categoría', 'error');
            return;
        }

        if (nombre.length < 2) {
            Utils.showToast('El nombre debe tener al menos 2 caracteres', 'error');
            return;
        }

        if (nombre.length > 50) {
            Utils.showToast('El nombre no puede exceder 50 caracteres', 'error');
            return;
        }

        // Verificar duplicados
        const categorias = DataManager.getAll('categoriasData') || [];
        const existe = categorias.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase());

        if (existe) {
            Utils.showToast('Ya existe una categoría con ese nombre', 'error');
            return;
        }

        const nuevaCategoria = {
            nombre: nombre,
            fechaCreacion: new Date().toISOString(),
            activa: true
        };

        DataManager.add('categoriasData', nuevaCategoria);
        this.loadData();
        this.limpiarFormulario();

        // Actualizar la organización de grupos
        this.renderCarpetasYGrupos();

        // Actualizar selects en todas las vistas para que aparezca la nueva categoría
        this.updateSelectsInAllViews();

        Utils.showToast('Categoría agregada exitosamente', 'success');
    },

    // Eliminar categoría con validaciones mejoradas
    eliminarCategoria(button) {
        // Obtener la fila desde el botón de manera correcta para Tabulator
        const row = this.table.getRow(button.closest('.tabulator-row'));
        if (!row) {
            console.error('No se pudo obtener la fila de Tabulator');
            Utils.showToast('Error al obtener los datos de la categoría', 'error');
            return;
        }
        const categoria = row.getData();

        // Verificar si está en uso en transacciones
        const transacciones = DataManager.getAll('transaccionesData');
        const usoTransacciones = transacciones.filter(t => t.categoria === categoria.nombre).length;

        // Verificar si está en uso en grupos
        const grupos = Object.values(this.grupos || {})
            .filter(grupo => grupo.categorias && grupo.categorias.includes(categoria.nombre));

        if (usoTransacciones > 0) {
            Utils.showToast(`No se puede eliminar: la categoría está siendo usada en ${usoTransacciones} transacciones`, 'error');
            return;
        }

        if (grupos.length > 0) {
            const nombreGrupos = grupos.map(g => g.nombre).join(', ');
            Utils.showToast(`No se puede eliminar: la categoría está asignada a los grupos: ${nombreGrupos}`, 'error');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            DataManager.delete('categoriasData', categoria.id);
            this.loadData();
            this.renderCarpetasYGrupos();

            // Actualizar selects en todas las vistas
            this.updateSelectsInAllViews();

            Utils.showToast('Categoría eliminada exitosamente', 'success');
        }
    },

    // Actualizar selects en todas las vistas
    updateSelectsInAllViews() {
        console.log('Actualizando selects de categorías en todas las vistas...');

        // Actualizar en vista de transacciones si existe
        if (window.TransaccionesView && TransaccionesView.refreshSelectOptions) {
            TransaccionesView.refreshSelectOptions();
        }

        // Actualizar selects generales del sistema
        if (window.Utils && Utils.actualizarSelectsEnFormularios) {
            Utils.actualizarSelectsEnFormularios();
        }

        // Disparar evento personalizado para que otras vistas se actualicen
        window.dispatchEvent(new CustomEvent('categoriasUpdated', {
            detail: {
                categorias: DataManager.getAll('categoriasData'),
                timestamp: Date.now()
            }
        }));
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('categoria-nombre').value = '';
    },

    // Cleanup mejorado
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }

        // Limpiar el contenedor de organización
        const organContainer = document.getElementById('categorias-organizacion');
        if (organContainer) {
            organContainer.innerHTML = '';
        }

        console.log('Categorías view cleanup completado');
    }
};

// Auto-inicializar mejorado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('categorias-table')) {
            CategoriasView.init();
        }
    });
} else {
    if (document.getElementById('categorias-table')) {
        CategoriasView.init();
    }
}
