// Aplicación principal del sistema de gestión
window.App = {
    // Variables globales de estado
    globalFilters: {
        startDate: null,
        endDate: null
    },

    // Inicializar la aplicación
    async init() {
        try {
            console.log('Iniciando aplicación...');

            // Inicializar módulos base
            DataManager.init();
            Utils.initDarkMode();

            // Configurar eventos globales
            this.setupGlobalEvents();

            // Inicializar navegación (esto cargará la vista inicial)
            Navigation.init();

            // Configurar tooltips después de un breve delay
            setTimeout(() => {
                Utils.initTooltips();
            }, 500);

            // Debug del sistema
            setTimeout(() => {
                Utils.debugSystemStatus();
            }, 1000);

            console.log('Aplicación iniciada exitosamente');

        } catch (error) {
            console.error('Error iniciando aplicación:', error);
            this.showFatalError(error);
        }
    },

    // Configurar eventos globales de la aplicación
    setupGlobalEvents() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', Utils.toggleDarkMode);
        }

        // Atajos de teclado globales
        document.addEventListener('keydown', (e) => {
            // Ctrl+S para guardar datos
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                DataManager.saveData();
                Utils.showToast('Datos guardados', 'success');
            }

            // Ctrl+R para recalcular todo
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.recalcularTodo();
            }

            // Ctrl+E para exportar backup
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                DataManager.exportBackup();
            }
        });

        // Manejador global de errores
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('ResizeObserver loop completed')) {
                // Error benigno de ResizeObserver emitido por algunos navegadores, se ignora
                return;
            }
            console.groupCollapsed('%c⚠️ Error global capturado','color:red;font-weight:bold');
            console.error('Mensaje:', e.message);
            console.error('Archivo:', e.filename + ':' + e.lineno + ':' + e.colno);
            if (e.error && e.error.stack) {
                console.error('Stack:', e.error.stack);
            } else {
                console.error('Objeto error:', e.error);
            }
            console.groupEnd();
            Utils.showToast('Error inesperado (ver consola)', 'error');
        });

        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada:', e.reason);
            Utils.showToast('Error de comunicación', 'error');
        });

        // Detectar cambios en localStorage de otras pestañas
        window.addEventListener('storage', (e) => {
            if (Object.values(AppConfig.storageKeys).includes(e.key)) {
                console.log('Datos actualizados en otra pestaña, recargando...');
                DataManager.loadData();
                this.refreshCurrentView();
            }
        });
    },

    // Recalcular todo el sistema
    recalcularTodo() {
        try {
            Utils.showToast('Recalculando sistema...', 'info');
            Calculations.recalcularTodo();
            this.refreshCurrentView();
            Utils.showToast('Sistema recalculado exitosamente', 'success');
        } catch (error) {
            console.error('Error recalculando:', error);
            Utils.showToast('Error al recalcular', 'error');
        }
    },

    // Refrescar vista actual
    refreshCurrentView() {
        const currentView = Navigation.getCurrentView();
        if (currentView && window.refreshCurrentView) {
            window.refreshCurrentView();
        }
    },

    // Aplicar filtros globales de fecha
    aplicarFiltroFechas() {
        const startInput = document.getElementById('dashboard-startDate');
        const endInput = document.getElementById('dashboard-endDate');

        if (startInput && endInput) {
            this.globalFilters.startDate = startInput.value ? Utils.parseDate(startInput.value) : null;
            this.globalFilters.endDate = endInput.value ? Utils.parseDate(endInput.value) : null;

            // Emitir evento para que las vistas se actualicen
            this.emitEvent('filtersChanged', this.globalFilters);

            Utils.showToast('Filtros aplicados', 'success');
        }
    },

    // Limpiar filtros globales
    limpiarFiltroFechas() {
        this.globalFilters.startDate = null;
        this.globalFilters.endDate = null;

        const startInput = document.getElementById('dashboard-startDate');
        const endInput = document.getElementById('dashboard-endDate');

        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';

        // Emitir evento para que las vistas se actualicen
        this.emitEvent('filtersChanged', this.globalFilters);

        Utils.showToast('Filtros limpiados', 'info');
    },

    // Sistema simple de eventos
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Escuchar eventos
    onEvent(eventName, callback) {
        document.addEventListener(eventName, callback);
    },

    // Importar backup
    async importarBackup(file) {
        try {
            Utils.showToast('Importando backup...', 'info');

            const backup = await DataManager.importBackup(file);

            // Recalcular todo después de importar
            Calculations.recalcularTodo();

            // Refrescar vista actual
            this.refreshCurrentView();

            // Actualizar selects en formularios
            Utils.actualizarSelectsEnFormularios();

            // Establecer fechas por defecto
            Utils.setDefaultDatesToToday();

            Utils.showToast('Backup importado exitosamente', 'success');

            // Recargar la aplicación para garantizar que todas las tablas y selects
            // se reconstruyan con los datos recién importados.
            setTimeout(() => {
                window.location.reload();
            }, 800);

        } catch (error) {
            console.error('Error importando backup:', error);
            Utils.showToast('Error al importar backup: ' + error.message, 'error');
        }
    },

    // Exportar backup
    exportarBackup() {
        try {
            DataManager.exportBackup();
            Utils.showToast('Backup exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error exportando backup:', error);
            Utils.showToast('Error al exportar backup', 'error');
        }
    },

    // Limpiar todos los datos
    async limpiarTodosLosDatos() {
        const confirmed = await Utils.confirm(
            '¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.',
            'Limpiar todos los datos'
        );

        if (confirmed) {
            if (DataManager.clearAllData()) {
                Calculations.recalcularTodo();
                this.refreshCurrentView();
                Utils.actualizarSelectsEnFormularios();
                Utils.showToast('Todos los datos han sido eliminados', 'info');
            }
        }
    },

    // Mostrar error fatal
    showFatalError(error) {
        document.body.innerHTML = `
            <div class="min-h-screen bg-red-50 flex items-center justify-center px-4">
                <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center mb-4">
                        <i class="bi bi-exclamation-triangle text-red-500 text-2xl mr-3"></i>
                        <h1 class="text-xl font-bold text-red-800">Error Fatal</h1>
                    </div>
                    <p class="text-gray-600 mb-4">
                        La aplicación no pudo iniciarse correctamente.
                    </p>
                    <p class="text-sm text-gray-500 mb-6">
                        Error: ${error.message}
                    </p>
                    <button onclick="window.location.reload()"
                            class="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors">
                        Recargar Página
                    </button>
                </div>
            </div>
        `;
    },

    // Obtener filtros actuales
    getGlobalFilters() {
        return { ...this.globalFilters };
    },

    // Debug: información del sistema
    getSystemInfo() {
        return {
            currentView: Navigation.getCurrentView(),
            dataCount: Object.keys(DataManager.data).reduce((acc, key) => {
                acc[key] = DataManager.data[key].length;
                return acc;
            }, {}),
            filters: this.globalFilters,
            darkMode: document.documentElement.classList.contains('dark'),
            version: '1.0.0'
        };
    }
};

// Funciones globales de compatibilidad (para mantener funcionalidad existente)
window.descargarBackupJSON = () => App.exportarBackup();
window.seleccionarBackupJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        if (e.target.files[0]) {
            App.importarBackup(e.target.files[0]);
        }
    };
    input.click();
};
window.aplicarFiltroFechas = () => App.aplicarFiltroFechas();
window.limpiarFiltroFechas = () => App.limpiarFiltroFechas();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Exponer App globalmente para debugging
window.App = App;

// Función para aplicar patches de Tabulator cuando esté listo
function applyTabulatorPatches() {
    // Parche de estabilidad para Tabulator: retrasar initializeEditor unos ms
    try {
        if (window.Tabulator &&
            window.Tabulator.prototype &&
            window.Tabulator.prototype.modules &&
            window.Tabulator.prototype.modules.edit &&
            typeof window.Tabulator.prototype.modules.edit.initializeEditor === 'function' &&
            !window.Tabulator._patchedSlowEditor){

            window.Tabulator._patchedSlowEditor = true;
            const EditModule = window.Tabulator.prototype.modules.edit;
            const originalInit = EditModule.initializeEditor;

            EditModule.initializeEditor = function(cell, onRendered, success, cancel, editorParams){
                // Pequeño retardo para permitir que el DOM del editor se hidrate y evitar editorClear doble
                setTimeout(()=>{
                    if (originalInit && typeof originalInit.call === 'function') {
                        originalInit.call(this, cell, onRendered, success, cancel, editorParams);
                    }
                }, 30); // 30 ms — imperceptible para el usuario
            };
            console.log('✅ Tabulator patched: initializeEditor delayed 30ms');
        }
    } catch (error) {
        console.warn('❌ Error aplicando patch de Tabulator initializeEditor:', error);
    }

    // Parche de estabilidad para Tabulator: capturar error en clearEditor y prevenir bubbling
    try {
        if (window.Tabulator &&
            window.Tabulator.prototype &&
            window.Tabulator.prototype.modules &&
            window.Tabulator.prototype.modules.edit &&
            typeof window.Tabulator.prototype.modules.edit.clearEditor === 'function' &&
            !window.Tabulator._patchedClearEditor){

            window.Tabulator._patchedClearEditor = true;
            const EditModule = window.Tabulator.prototype.modules.edit;
            const origClear = EditModule.clearEditor;

            EditModule.clearEditor = function(){
                try {
                    if (origClear && typeof origClear.apply === 'function') {
                        origClear.apply(this, arguments);
                    }
                } catch(err){
                    console.warn('Tabulator clearEditor error suprimido:', err.message);
                }
            };
            console.log('✅ Tabulator patched: clearEditor wrapped');
        }
    } catch (error) {
        console.warn('❌ Error aplicando patch de Tabulator clearEditor:', error);
    }
}

// Aplicar patches inmediatamente si Tabulator ya está disponible
applyTabulatorPatches();

// Si no está disponible, intentar cada 100ms hasta encontrarlo
let patchAttempts = 0;
const maxPatchAttempts = 50; // 5 segundos máximo
const patchInterval = setInterval(() => {
    patchAttempts++;
    if (window.Tabulator && window.Tabulator.prototype && window.Tabulator.prototype.modules) {
        applyTabulatorPatches();
        clearInterval(patchInterval);
        console.log('✅ Tabulator encontrado y patcheado después de', patchAttempts * 100, 'ms');
    } else if (patchAttempts >= maxPatchAttempts) {
        clearInterval(patchInterval);
        console.warn('⚠️ Tabulator no encontrado después de 5 segundos');
    }
}, 100);



// Manejo global de errores para debugging
window.addEventListener('error', function(e) {
    console.error('🚨 Error global capturado:', {
        message: e.message,
        filename: e.filename ? e.filename.split('/').pop() : 'unknown',
        location: `${e.lineno}:${e.colno}`,
        error: e.error,
        stack: e.error?.stack?.substring(0, 200) + '...'
    });

    // Si es el error de Tabulator que nos molesta, dar más contexto
    if (e.message && e.message.includes("Cannot read properties of undefined (reading 'edit')")) {
        console.warn('🔧 Este parece ser el error de Tabulator. Estado actual:', {
            tabulatorExists: !!window.Tabulator,
            hasPrototype: !!(window.Tabulator?.prototype),
            hasModules: !!(window.Tabulator?.prototype?.modules),
            hasEdit: !!(window.Tabulator?.prototype?.modules?.edit)
        });
    }
});

// También capturar promesas rechazadas
window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Promesa rechazada:', e.reason);
});

// Verificación de estado de Tabulator
if (typeof window.Tabulator === 'undefined') {
    console.warn('⚠️ Tabulator no está disponible - algunas funcionalidades de tabla pueden no funcionar');
} else {
    console.log('✅ Tabulator disponible');
}

// Estado de módulos críticos
setTimeout(() => {
    const modules = {
        'DataManager': window.DataManager,
        'Navigation': window.Navigation,
        'Utils': window.Utils,
        'Templates': window.Templates
    };

    Object.entries(modules).forEach(([name, module]) => {
        if (module) {
            console.log(`✅ ${name} disponible`);
        } else {
            console.error(`❌ ${name} NO disponible`);
        }
    });
}, 1000);
