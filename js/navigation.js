// Sistema de navegación y carga de vistas
window.Navigation = {
    currentView: null,
    currentScript: null,
    lastViewKey: 'zaiken_last_view', // Clave para localStorage

    // Inicializar sistema de navegación
    init() {
        this.bindNavigationEvents();
        this.loadLastView(); // Cargar la última vista visitada
    },

    // Cargar la última vista visitada o dashboard por defecto
    loadLastView() {
        const lastView = this.getLastView();
        const defaultView = 'dashboard';

        // Verificar que la vista existe en la configuración
        const { views } = window.AppConfig;
        const validView = views[lastView] ? lastView : defaultView;

        console.log(`Cargando vista: ${validView} (última vista: ${lastView})`);
        this.loadView(validView);

        // Establecer el elemento activo en la navegación
        this.setActiveNavItemByName(validView);
    },

    // Obtener la última vista visitada desde localStorage
    getLastView() {
        try {
            return localStorage.getItem(this.lastViewKey) || 'dashboard';
        } catch (error) {
            console.warn('Error al obtener última vista:', error);
            return 'dashboard';
        }
    },

    // Guardar la vista actual en localStorage
    saveLastView(viewName) {
        try {
            localStorage.setItem(this.lastViewKey, viewName);
            console.log(`Vista guardada: ${viewName}`);
        } catch (error) {
            console.warn('Error al guardar última vista:', error);
        }
    },

    // Establecer elemento activo en navegación por nombre de vista
    setActiveNavItemByName(viewName) {
        const activeLink = document.querySelector(`[data-tab="${viewName}"]`);
        if (activeLink) {
            this.setActiveNavItem(activeLink);
        }
    },

    // Enlazar eventos de navegación
    bindNavigationEvents() {
        // Navegación por sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = link.getAttribute('data-tab');
                this.loadView(viewName);
                this.setActiveNavItem(link);
            });
        });

        // Manejar navegación con teclas
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                const navItems = document.querySelectorAll('.nav-link');
                const activeIndex = Array.from(navItems).findIndex(item => item.classList.contains('active'));

                if (e.key === 'ArrowUp' && activeIndex > 0) {
                    e.preventDefault();
                    navItems[activeIndex - 1].click();
                } else if (e.key === 'ArrowDown' && activeIndex < navItems.length - 1) {
                    e.preventDefault();
                    navItems[activeIndex + 1].click();
                }
            }
        });

        // Guardar vista al cerrar la página
        window.addEventListener('beforeunload', () => {
            if (this.currentView) {
                this.saveLastView(this.currentView);
            }
        });

        // Guardar vista cuando cambia la visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.currentView) {
                this.saveLastView(this.currentView);
            }
        });
    },

    // Establecer elemento activo en navegación
    setActiveNavItem(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    },

    // Cargar vista dinámicamente
    async loadView(viewName) {
        const { views } = window.AppConfig;
        const view = views[viewName];

        if (!view) {
            console.error(`Vista '${viewName}' no encontrada`);
            return;
        }

        try {
            // Mostrar loading
            this.showLoading();

            // Limpiar script anterior si existe
            const cleanupResult = this.cleanupCurrentScript();
            if (cleanupResult === false) {
                console.log('Navegación cancelada por el usuario');
                return; // Cancelar navegación
            }

            // Cargar template HTML
            const template = await this.loadTemplate(view.template);

            // Renderizar en el contenedor principal
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = template;
            mainContent.classList.add('fade-in');

            // Esperar un momento para que el DOM se renderice
            await new Promise(resolve => setTimeout(resolve, 50));

            // Solo cargar script si la vista no está ya disponible globalmente
            const viewClassBefore = this.getViewClass(viewName);
            if (!viewClassBefore && view.script) {
                await this.loadScript(view.script);
            }

            // Esperar otro momento después de cargar el script
            await new Promise(resolve => setTimeout(resolve, 100));

            // Asegurar que la vista se inicializa (independiente de si el script ya existía)
            const viewClass = this.getViewClass(viewName);

            console.log(`Verificando vista ${viewName}:`, {
                exists: !!viewClass,
                hasInit: viewClass && typeof viewClass.init === 'function',
                windowObject: !!window[this.getViewClassName(viewName)]
            });

            if (viewClass && typeof viewClass.init === 'function') {
                try {
                    // Limpiar la vista anterior si existe
                    if (typeof viewClass.cleanup === 'function') {
                        viewClass.cleanup();
                    }

                    // Reinicializar la vista
                    console.log(`Inicializando vista: ${viewName}`);
                    await viewClass.init();

                    // Para transacciones, forzar la inicialización de la tabla
                    if (viewName === 'transacciones' && viewClass.refreshTable) {
                        setTimeout(() => {
                            viewClass.refreshTable();
                        }, 200);
                    }

                } catch (e) {
                    console.error('Error inicializando vista', viewName, e);
                    // Intentar reinicializar después de un delay
                    setTimeout(() => {
                        try {
                            console.log(`Reintentando inicialización de ${viewName}`);
                            viewClass.init();
                            if (viewName === 'transacciones' && viewClass.refreshTable) {
                                viewClass.refreshTable();
                            }
                        } catch (retryError) {
                            console.error('Error en reintento de inicialización:', retryError);
                        }
                    }, 500);
                }
            } else {
                console.warn(`Vista ${viewName} no tiene método init o no está disponible`);

                // Intentar cargar el script una vez más si la vista no está disponible
                if (!viewClass && view.script) {
                    console.log(`Reintentando carga de script para ${viewName}`);
                    setTimeout(async () => {
                        await this.loadScript(view.script);
                        const retryViewClass = this.getViewClass(viewName);
                        if (retryViewClass && typeof retryViewClass.init === 'function') {
                            console.log(`Vista ${viewName} disponible después del reintento`);
                            retryViewClass.init();
                        }
                    }, 100);
                }
            }

            this.currentView = viewName;

            // Guardar la vista actual
            this.saveLastView(viewName);

            // Actualizar título de la página
            document.title = `${view.title} - Sistema de Gestión`;

            console.log(`Vista '${viewName}' cargada exitosamente`);

        } catch (error) {
            console.error(`Error cargando vista '${viewName}':`, error);
            this.showError(`Error cargando la vista: ${error.message}`);
        }
    },

    // Cargar template HTML (sin fetch para evitar CORS)
    async loadTemplate(templatePath) {
        // Extraer nombre de vista del path
        const viewName = templatePath.split('/').pop().replace('.html', '');

        // Usar templates embebidos para evitar problemas de CORS
        if (window.Templates && window.Templates[viewName]) {
            return window.Templates[viewName];
        }

        throw new Error(`Template '${viewName}' no encontrado`);
    },

    // Cargar script JavaScript (omitir si no existe)
    async loadScript(scriptPath) {
        try {
            return new Promise((resolve, reject) => {
                // Remover script anterior si existe
                if (this.currentScript) {
                    document.head.removeChild(this.currentScript);
                }

                const script = document.createElement('script');
                script.src = scriptPath;
                script.type = 'text/javascript';

                script.onload = () => {
                    this.currentScript = script;
                    resolve();
                };

                script.onerror = () => {
                    console.warn(`Script no encontrado: ${scriptPath}`);
                    resolve(); // Resolver sin error para continuar
                };

                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn(`Error cargando script: ${scriptPath}`);
            return Promise.resolve();
        }
    },

    // Obtener clase de vista disponible globalmente
    getViewClass(viewName) {
        const viewClassNames = {
            'dashboard': 'DashboardView',
            'personas': 'PersonasView',
            'roles': 'RolesView',
            'valorHora': 'ValorHoraView',
            'registroHoras': 'RegistroHorasView',
            'campanas': 'CampanasView',
            'transacciones': 'TransaccionesView',
            'categorias': 'CategoriasView',
            'distribucionUtilidades': 'DistribucionUtilidadesView',
            'distribucionDetalle': 'DistribucionDetalleView',
            'estadisticas': 'EstadisticasView'
        };

        const className = viewClassNames[viewName];
        return className && window[className] ? window[className] : null;
    },

    // Obtener nombre de clase de vista
    getViewClassName(viewName) {
        const viewClassNames = {
            'dashboard': 'DashboardView',
            'personas': 'PersonasView',
            'roles': 'RolesView',
            'valorHora': 'ValorHoraView',
            'registroHoras': 'RegistroHorasView',
            'campanas': 'CampanasView',
            'transacciones': 'TransaccionesView',
            'categorias': 'CategoriasView',
            'distribucionUtilidades': 'DistribucionUtilidadesView',
            'distribucionDetalle': 'DistribucionDetalleView',
            'estadisticas': 'EstadisticasView'
        };

        return viewClassNames[viewName] || null;
    },

    // Limpiar script actual
    cleanupCurrentScript() {
        if (this.currentView) {
            try {
                // Llamar función de cleanup específica de la vista
                const viewClass = this.getViewClass(this.currentView);
                if (viewClass && typeof viewClass.cleanup === 'function') {
                    const result = viewClass.cleanup();
                    // Si cleanup retorna false, cancelar la navegación
                    if (result === false) {
                        return false;
                    }
                }

                // Limpiar función global si existe
                if (window.currentViewCleanup && typeof window.currentViewCleanup === 'function') {
                    window.currentViewCleanup();
                    window.currentViewCleanup = null;
                }
            } catch (error) {
                console.warn('Error limpiando vista:', error);
            }
        }

        if (this.currentScript) {
            try {
                document.head.removeChild(this.currentScript);
                this.currentScript = null;
            } catch (error) {
                console.warn('Error limpiando script:', error);
            }
        }

        return true;
    },

    // Mostrar indicador de carga
    showLoading() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span class="ml-4 text-gray-600">Cargando...</span>
            </div>
        `;
    },

    // Mostrar mensaje de error
    showError(message) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                <div class="flex">
                    <i class="bi bi-exclamation-circle text-red-400 text-xl mr-3"></i>
                    <div>
                        <h3 class="text-red-800 font-medium">Error</h3>
                        <p class="text-red-600 mt-1">${message}</p>
                        <button onclick="Navigation.loadView('dashboard')"
                                class="mt-3 btn btn-primary">
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Recargar vista actual
    reloadCurrentView() {
        if (this.currentView) {
            this.loadView(this.currentView);
        }
    },

    // Obtener vista actual
    getCurrentView() {
        return this.currentView;
    },

    // Navegar programáticamente
    navigateTo(viewName) {
        const navLink = document.querySelector(`[data-tab="${viewName}"]`);
        if (navLink) {
            navLink.click();
        } else {
            this.loadView(viewName);
        }
    },

    // Breadcrumb para navegación compleja (futuro)
    setBreadcrumb(items) {
        // Implementar breadcrumb si es necesario
        console.log('Breadcrumb:', items);
    },

    // Función para debugging - verificar estado de las vistas
    debugViewState(viewName = null) {
        const targetView = viewName || this.currentView;
        if (!targetView) {
            console.log('No hay vista actual');
            return;
        }

        const viewClass = this.getViewClass(targetView);
        console.log(`Estado de vista ${targetView}:`, {
            exists: !!viewClass,
            hasInit: viewClass && typeof viewClass.init === 'function',
            hasCleanup: viewClass && typeof viewClass.cleanup === 'function',
            initialized: viewClass && viewClass.initialized,
            currentView: this.currentView
        });

        // Para transacciones, información adicional
        if (targetView === 'transacciones' && viewClass) {
            console.log('Estado específico de TransaccionesView:', {
                hasTable: !!viewClass.table,
                tableInitialized: viewClass.table && viewClass.table.initialized
            });
        }
    },

    // Función para forzar reinicialización de vista actual
    forceReinitCurrentView() {
        if (this.currentView) {
            console.log(`Forzando reinicialización de ${this.currentView}`);
            this.loadView(this.currentView);
        }
    },

    // Limpiar la última vista guardada (resetear a dashboard)
    clearLastView() {
        try {
            localStorage.removeItem(this.lastViewKey);
            console.log('Última vista limpiada, se cargará dashboard en la próxima visita');
        } catch (error) {
            console.warn('Error al limpiar última vista:', error);
        }
    },

    // Obtener información sobre la última vista guardada
    getLastViewInfo() {
        const lastView = this.getLastView();
        const { views } = window.AppConfig;
        const viewInfo = views[lastView];

        return {
            viewName: lastView,
            viewTitle: viewInfo ? viewInfo.title : 'Vista no encontrada',
            isValid: !!viewInfo,
            currentView: this.currentView,
            isCurrentView: lastView === this.currentView
        };
    },

    // Forzar guardado de la vista actual
    forceSaveCurrentView() {
        if (this.currentView) {
            this.saveLastView(this.currentView);
            console.log(`Vista actual forzada a guardar: ${this.currentView}`);
        } else {
            console.warn('No hay vista actual para guardar');
        }
    },

    // Verificar si localStorage está disponible
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    // Función para debugging completo del sistema de navegación
    debugNavigationSystem() {
        console.log('=== DEBUG SISTEMA DE NAVEGACIÓN ===');
        console.log('Vista actual:', this.currentView);
        console.log('Última vista guardada:', this.getLastView());
        console.log('Información de última vista:', this.getLastViewInfo());
        console.log('localStorage disponible:', this.isLocalStorageAvailable());
        console.log('Configuración de vistas:', window.AppConfig.views);

        // Verificar elementos de navegación
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('Enlaces de navegación encontrados:', navLinks.length);

        navLinks.forEach((link, index) => {
            const viewName = link.getAttribute('data-tab');
            const isActive = link.classList.contains('active');
            console.log(`  ${index + 1}. ${viewName} - Activo: ${isActive}`);
        });

        console.log('=== FIN DEBUG ===');
    }
};

// Funciones globales para debugging y gestión de la última vista
window.ZaikenNavigation = {
    // Obtener información de la última vista
    getLastViewInfo: () => window.Navigation.getLastViewInfo(),

    // Limpiar última vista guardada
    clearLastView: () => {
        window.Navigation.clearLastView();
        console.log('✅ Última vista limpiada. En la próxima recarga se cargará el dashboard.');
    },

    // Forzar guardado de vista actual
    saveCurrentView: () => {
        window.Navigation.forceSaveCurrentView();
        console.log('✅ Vista actual guardada.');
    },

    // Debug completo del sistema
    debug: () => window.Navigation.debugNavigationSystem(),

    // Navegar a una vista específica
    goTo: (viewName) => {
        window.Navigation.navigateTo(viewName);
        console.log(`✅ Navegando a: ${viewName}`);
    },

    // Obtener vista actual
    getCurrent: () => {
        const current = window.Navigation.getCurrentView();
        console.log(`📍 Vista actual: ${current}`);
        return current;
    }
};

// Mostrar información de ayuda en consola
console.log(`
🚀 Sistema de Navegación ZAIKEN - Funciones de Debug Disponibles:

📋 Información:
• ZaikenNavigation.getLastViewInfo() - Ver información de la última vista
• ZaikenNavigation.getCurrent() - Ver vista actual

🔧 Gestión:
• ZaikenNavigation.clearLastView() - Limpiar última vista guardada
• ZaikenNavigation.saveCurrentView() - Forzar guardado de vista actual
• ZaikenNavigation.goTo('nombreVista') - Navegar a vista específica

🐛 Debug:
• ZaikenNavigation.debug() - Debug completo del sistema
• Navigation.debugNavigationSystem() - Debug detallado

💡 Ejemplos:
• ZaikenNavigation.goTo('personas')
• ZaikenNavigation.clearLastView()
• ZaikenNavigation.debug()
`);
