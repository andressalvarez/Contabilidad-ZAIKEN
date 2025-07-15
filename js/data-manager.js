// Gestor de datos del sistema
window.DataManager = {
    // Variables globales de datos
    data: {},
    counters: {},

    // Inicializar el gestor de datos
    init() {
        this.loadData();
        this.syncCounters();
    },

    // Cargar datos desde localStorage o usar datos iniciales
    loadData() {
        const { initialData, storageKeys } = window.AppConfig;

        Object.keys(initialData).forEach(key => {
            const stored = localStorage.getItem(storageKeys[key]);
            this.data[key] = stored ? JSON.parse(stored) : [...initialData[key]];
        });

        this.normalizeData();
        console.log('Datos cargados:', this.data);
    },

    // Guardar todos los datos en localStorage
    saveData() {
        const { storageKeys } = window.AppConfig;

        Object.keys(this.data).forEach(key => {
            if (storageKeys[key]) {
                localStorage.setItem(storageKeys[key], JSON.stringify(this.data[key]));
            }
        });

        console.log('Datos guardados en localStorage');
    },

    // Obtener el ID máximo de un array
    getMaxId(dataArray) {
        if (!Array.isArray(dataArray) || dataArray.length === 0) return 0;
        return Math.max(...dataArray.map(item => item.id || 0));
    },

    // Sincronizar contadores con los IDs más altos
    syncCounters() {
        Object.keys(this.data).forEach(key => {
            this.counters[key] = this.getMaxId(this.data[key]) + 1;
        });
        console.log('Contadores sincronizados:', this.counters);
    },

    // Obtener siguiente ID para una entidad
    getNextId(entityName) {
        if (!this.counters[entityName]) {
            this.counters[entityName] = this.getMaxId(this.data[entityName]) + 1;
        }
        return this.counters[entityName]++;
    },

    // Agregar nuevo registro
    add(entityName, newRecord) {
        if (!this.data[entityName]) {
            this.data[entityName] = [];
        }

        newRecord.id = this.getNextId(entityName);
        this.data[entityName].push(newRecord);
        this.saveData();

        console.log(`Nuevo ${entityName} agregado:`, newRecord);
        return newRecord;
    },

    // Actualizar registro existente
    update(entityName, id, updatedFields) {
        const index = this.data[entityName].findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[entityName][index] = { ...this.data[entityName][index], ...updatedFields };
            this.saveData();
            console.log(`${entityName} actualizado:`, this.data[entityName][index]);
            return this.data[entityName][index];
        }
        return null;
    },

    // Eliminar registro
    delete(entityName, id) {
        const index = this.data[entityName].findIndex(item => item.id === id);
        if (index !== -1) {
            const deleted = this.data[entityName].splice(index, 1)[0];
            this.saveData();
            console.log(`${entityName} eliminado:`, deleted);
            return deleted;
        }
        return null;
    },

    // Buscar registro por ID
    findById(entityName, id) {
        return this.data[entityName].find(item => item.id === id);
    },

    // Alias para findById
    getById(entityName, id) {
        return this.findById(entityName, id);
    },

    // Filtrar registros
    filter(entityName, filterFn) {
        return this.data[entityName].filter(filterFn);
    },

    // Obtener todos los registros de una entidad
    getAll(entityName) {
        return this.data[entityName] || [];
    },

    // Reemplazar todos los datos (útil para importar backup)
    replaceAllData(newData) {
        Object.keys(newData).forEach(key => {
            if (this.data[key] !== undefined) {
                this.data[key] = newData[key] || [];
            }
        });
        this.syncCounters();
        this.normalizeData();
        this.saveData();
        console.log('Todos los datos reemplazados');
    },

    // Exportar backup completo
    exportBackup() {
        const incluirConfig = document.getElementById('backup-incluir-config')?.checked;
        const backup = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: { ...this.data }
        };
        if (incluirConfig) {
            // Guardar configuración personalizada relevante de localStorage
            backup.configPersonalizada = {
                vsCategoriasConfig: localStorage.getItem('vsCategoriasConfig'),
                darkMode: localStorage.getItem('darkMode'),
                // Nuevas configuraciones mejoradas
                lastView: localStorage.getItem('app_lastView'),
                globalFilters: this.getGlobalFiltersState(),
                tableStates: this.getTableStates(),
                userPreferences: this.getUserPreferences()
            };
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('Backup exportado');
    },

    // Nuevo: Obtener estado de filtros globales
    getGlobalFiltersState() {
        try {
            const globalFilters = {};

            // Filtros de fecha del dashboard
            const startDate = document.getElementById('dashboard-startDate')?.value;
            const endDate = document.getElementById('dashboard-endDate')?.value;

            if (startDate || endDate) {
                globalFilters.dateFilters = {
                    startDate: startDate || null,
                    endDate: endDate || null
                };
            }

            return globalFilters;
        } catch (error) {
            console.warn('Error obteniendo filtros globales:', error);
            return {};
        }
    },

    // Nuevo: Obtener estados de tablas
    getTableStates() {
        try {
            const tableStates = {};

            // Estados de filtros de transacciones
            const txFiltros = {
                tipo: document.getElementById('filtro-tipo')?.value || '',
                categoria: document.getElementById('filtro-categoria')?.value || '',
                persona: document.getElementById('filtro-persona')?.value || '',
                campana: document.getElementById('filtro-campana')?.value || '',
                startDate: document.getElementById('filtro-startDate')?.value || '',
                endDate: document.getElementById('filtro-endDate')?.value || ''
            };

            // Solo guardar si hay filtros activos
            const hasFiltros = Object.values(txFiltros).some(val => val !== '');
            if (hasFiltros) {
                tableStates.transacciones = { filtros: txFiltros };
            }

            // Estados de filtros de campañas
            const campFiltros = {
                estado: document.getElementById('filter-estado')?.value || '',
                fechaDesde: document.getElementById('filter-fecha-desde')?.value || '',
                fechaHasta: document.getElementById('filter-fecha-hasta')?.value || ''
            };

            const hasCampFiltros = Object.values(campFiltros).some(val => val !== '');
            if (hasCampFiltros) {
                tableStates.campanas = { filtros: campFiltros };
            }

            return tableStates;
        } catch (error) {
            console.warn('Error obteniendo estados de tablas:', error);
            return {};
        }
    },

    // Nuevo: Obtener preferencias de usuario
    getUserPreferences() {
        try {
            return {
                autoSave: true, // Por defecto activo
                dateFormat: 'YYYY-MM-DD',
                currency: 'COP',
                enableTooltips: true,
                // Agregar más preferencias según sea necesario
                dashboardLayout: 'default'
            };
        } catch (error) {
            console.warn('Error obteniendo preferencias:', error);
            return {};
        }
    },

    // Importar backup
    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    // Validar estructura del backup
                    if (backup.data) {
                        this.replaceAllData(backup.data);
                        this.syncCounters();
                        // Restaurar configuración personalizada si existe
                        if (backup.configPersonalizada) {
                            if (backup.configPersonalizada.vsCategoriasConfig) {
                                localStorage.setItem('vsCategoriasConfig', backup.configPersonalizada.vsCategoriasConfig);
                            }
                            if (backup.configPersonalizada.darkMode) {
                                localStorage.setItem('darkMode', backup.configPersonalizada.darkMode);
                            }

                            // Restaurar nuevas configuraciones mejoradas
                            if (backup.configPersonalizada.lastView) {
                                localStorage.setItem('app_lastView', backup.configPersonalizada.lastView);
                            }

                            // Restaurar filtros globales
                            if (backup.configPersonalizada.globalFilters) {
                                this.restoreGlobalFilters(backup.configPersonalizada.globalFilters);
                            }

                            // Restaurar estados de tablas
                            if (backup.configPersonalizada.tableStates) {
                                this.restoreTableStates(backup.configPersonalizada.tableStates);
                            }

                            // Nota: userPreferences se restauran automáticamente con la aplicación

                            if (window.Utils && window.Utils.showToast) {
                                Utils.showToast('Configuración personalizada completa restaurada', 'success');
                            }
                        }
                        resolve(backup);
                    } else {
                        // Compatibilidad con formato anterior
                        this.replaceAllData(backup);
                        resolve(backup);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    },

    // Nuevo: Restaurar filtros globales
    restoreGlobalFilters(globalFilters) {
        try {
            if (globalFilters.dateFilters) {
                // Restaurar filtros de fecha del dashboard
                const startInput = document.getElementById('dashboard-startDate');
                const endInput = document.getElementById('dashboard-endDate');

                if (startInput && globalFilters.dateFilters.startDate) {
                    startInput.value = globalFilters.dateFilters.startDate;
                }
                if (endInput && globalFilters.dateFilters.endDate) {
                    endInput.value = globalFilters.dateFilters.endDate;
                }

                console.log('Filtros globales restaurados:', globalFilters.dateFilters);
            }
        } catch (error) {
            console.warn('Error restaurando filtros globales:', error);
        }
    },

    // Nuevo: Restaurar estados de tablas
    restoreTableStates(tableStates) {
        try {
            // Restaurar filtros de transacciones
            if (tableStates.transacciones?.filtros) {
                const filtros = tableStates.transacciones.filtros;

                // Aplicar filtros cuando la vista esté cargada
                setTimeout(() => {
                    const elements = {
                        'filtro-tipo': filtros.tipo,
                        'filtro-categoria': filtros.categoria,
                        'filtro-persona': filtros.persona,
                        'filtro-campana': filtros.campana,
                        'filtro-startDate': filtros.startDate,
                        'filtro-endDate': filtros.endDate
                    };

                    Object.entries(elements).forEach(([id, value]) => {
                        const element = document.getElementById(id);
                        if (element && value) {
                            element.value = value;
                        }
                    });

                    console.log('Filtros de transacciones restaurados:', filtros);
                }, 1000);
            }

            // Restaurar filtros de campañas
            if (tableStates.campanas?.filtros) {
                const filtros = tableStates.campanas.filtros;

                setTimeout(() => {
                    const elements = {
                        'filter-estado': filtros.estado,
                        'filter-fecha-desde': filtros.fechaDesde,
                        'filter-fecha-hasta': filtros.fechaHasta
                    };

                    Object.entries(elements).forEach(([id, value]) => {
                        const element = document.getElementById(id);
                        if (element && value) {
                            element.value = value;
                        }
                    });

                    console.log('Filtros de campañas restaurados:', filtros);
                }, 1000);
            }
        } catch (error) {
            console.warn('Error restaurando estados de tablas:', error);
        }
    },

    // Limpiar todos los datos (reset)
    clearAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            const { initialData } = window.AppConfig;
            Object.keys(initialData).forEach(key => {
                this.data[key] = [...initialData[key]];
            });
            this.syncCounters();
            this.saveData();
            console.log('Todos los datos han sido limpiados');
            return true;
        }
        return false;
    },

    // Normalizar datos importados para garantizar consistencia
    normalizeData() {
        // 1. Categorías: asegurar campo nombre
        if (this.data.categoriasData) {
            this.data.categoriasData = this.data.categoriasData.map(cat => {
                if (!cat.nombre && cat.nombreCategoria) {
                    cat.nombre = cat.nombreCategoria;
                }
                return cat;
            });
        }

        // 2. Transacciones: convertir ids a número y campo moneda por defecto
        if (this.data.transaccionesData) {
            this.data.transaccionesData = this.data.transaccionesData.map(tx => {
                if (tx.id) tx.id = +tx.id;
                tx.personaId = tx.personaId ? +tx.personaId : null;
                tx.campanaId = tx.campanaId ? +tx.campanaId : null;
                if (!tx.moneda) tx.moneda = 'COP';
                return tx;
            });
        }

        // 3. Campañas: asegurar ids numéricos
        if (this.data.campanasData) {
            this.data.campanasData = this.data.campanasData.map(c => {
                c.id = +c.id;
                return c;
            });
        }

        // 4. Personas y roles: ids numéricos
        ['personasData','rolesData','valorHoraData','registroHorasData','distribucionUtilidadesData','distribucionDetalleData'].forEach(key=>{
            if(this.data[key]){
                this.data[key]=this.data[key].map(item=>{if(item.id)item.id=+item.id;return item;});
            }
        });
    }
};
