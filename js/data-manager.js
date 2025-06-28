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
        const backup = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: { ...this.data }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Backup exportado');
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
