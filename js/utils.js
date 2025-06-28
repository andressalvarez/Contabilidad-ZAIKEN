// Utilidades del sistema
window.Utils = {

    // Parsear fechas de manera segura
    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const year = +parts[0];
            const month = +parts[1] - 1;
            const day = +parts[2];
            return new Date(year, month, day);
        }
        const fallback = new Date(dateStr);
        return isNaN(fallback.getTime()) ? null : fallback;
    },

    // Formatear moneda
    formatCurrency(amount, currency = 'COP') {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    },

    // ✅ AGREGADO: Función formatearMoneda para compatibilidad
    formatearMoneda(amount, currency = 'COP') {
        return this.formatCurrency(amount, currency);
    },

    // Obtener fecha de hoy en formato YYYY-MM-DD
    getFechaHoy() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },

    // Establecer fechas por defecto en formularios
    setDefaultDatesToToday() {
        const { formFields } = window.AppConfig;
        const todayStr = this.getFechaHoy();

        formFields.dateInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value) {
                el.value = todayStr;
            }
        });
    },

    // Actualizar un select con opciones
    actualizarSelect(selectId, data, labelField, valueField) {
        const sel = document.getElementById(selectId);
        if (!sel) return;

        sel.innerHTML = '<option value="">-- Seleccione --</option>';

        // Caso especial para distribuciones
        if (selectId === "dd-distSelect") {
            data.forEach(dist => {
                const opt = document.createElement("option");
                opt.value = dist.id;
                opt.textContent = `${dist.periodo} (${dist.fecha})`;
                sel.appendChild(opt);
            });
        } else {
            // Caso genérico
            data.forEach(item => {
                const opt = document.createElement("option");
                opt.value = item[valueField];
                opt.textContent = item[labelField];
                if (!item[labelField] && item['nombreCategoria']) {
                    opt.textContent = item['nombreCategoria'];
                }
                sel.appendChild(opt);
            });
        }
    },

    // Actualizar todos los selects de formularios
    actualizarSelectsEnFormularios() {
        const rolesData = DataManager.getAll('rolesData');
        const personasData = DataManager.getAll('personasData');
        const campanasData = DataManager.getAll('campanasData');
        const distribucionUtilidadesData = DataManager.getAll('distribucionUtilidadesData');
        const categoriasData = DataManager.getAll('categoriasData');

        this.actualizarSelect("persona-rolSelect", rolesData, "nombreRol", "id");
        this.actualizarSelect("vh-personaSelect", personasData, "nombre", "id");
        this.actualizarSelect("vh-rolSelect", rolesData, "nombreRol", "id");
        this.actualizarSelect("rh-personaSelect", personasData, "nombre", "id");
        this.actualizarSelect("rh-campanaSelect", campanasData, "nombre", "id");
        this.actualizarSelect("tx-personaSelect", personasData, "nombre", "id");
        this.actualizarSelect("tx-campanaSelect", campanasData, "nombre", "id");
        this.actualizarSelect("dd-personaSelect", personasData, "nombre", "id");
        this.actualizarSelect("dd-distSelect", distribucionUtilidadesData, "id", "id");
        this.actualizarSelect("tx-categoria", categoriasData, "nombre", "nombre");
    },

    // Mostrar notificación toast
    showToast(message, type = 'success') {
        // Crear el elemento toast
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white transition-all duration-300 transform translate-y-full opacity-0 z-50`;

        // Aplicar colores según el tipo
        switch (type) {
            case 'success':
                toast.className += ' bg-green-500';
                break;
            case 'error':
                toast.className += ' bg-red-500';
                break;
            case 'warning':
                toast.className += ' bg-yellow-500';
                break;
            case 'info':
                toast.className += ' bg-blue-500';
                break;
            default:
                toast.className += ' bg-gray-500';
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    },

    // Confirmar acción con modal personalizado
    confirm(message, title = 'Confirmar acción') {
        return new Promise((resolve) => {
            // Crear modal de confirmación
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button id="cancel-btn" class="btn btn-secondary">Cancelar</button>
                        <button id="confirm-btn" class="btn btn-danger">Confirmar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            modal.querySelector('#cancel-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };

            modal.querySelector('#confirm-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };

            // Cerrar con ESC o click fuera
            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            };
        });
    },

    // Debounce function para optimizar llamadas
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validar formulario
    validateForm(formData, rules) {
        const errors = [];

        Object.keys(rules).forEach(field => {
            const rule = rules[field];
            const value = formData[field];

            if (rule.required && (!value || value.toString().trim() === '')) {
                errors.push(`${rule.label || field} es requerido`);
            }

            if (rule.min && Number(value) < rule.min) {
                errors.push(`${rule.label || field} debe ser mayor a ${rule.min}`);
            }

            if (rule.max && Number(value) > rule.max) {
                errors.push(`${rule.label || field} debe ser menor a ${rule.max}`);
            }

            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${rule.label || field} tiene formato inválido`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Limpiar formulario
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    },

    // Toggle dark mode
    toggleDarkMode() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');

        if (isDark) {
            html.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        } else {
            html.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        }

        // Actualizar icono del botón
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
            }
        }
    },

    // Inicializar dark mode
    initDarkMode() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'true') {
            document.documentElement.classList.add('dark');
            const toggleBtn = document.getElementById('darkModeToggle');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = 'bi bi-sun-fill';
                }
            }
        }
    },

    // Inicializar tooltips de Bootstrap
    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },

    // Generar colores para gráficos
    generateColors(count) {
        const colors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];

        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    },

    // Exportar datos a CSV
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('No hay datos para exportar', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(field => {
                const value = row[field];
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${this.getFechaHoy()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        this.showToast('Archivo CSV exportado exitosamente', 'success');
    },

    // Exportar backup JSON
    exportarBackupJSON() {
        try {
            // Crear backup con todos los datos
            const backup = {
                timestamp: new Date().toISOString(),
                version: "1.0",
                data: {
                    rolesData: DataManager.getAll('rolesData'),
                    personasData: DataManager.getAll('personasData'),
                    valorHoraData: DataManager.getAll('valorHoraData'),
                    registroHorasData: DataManager.getAll('registroHorasData'),
                    campanasData: DataManager.getAll('campanasData'),
                    transaccionesData: DataManager.getAll('transaccionesData'),
                    distribucionUtilidadesData: DataManager.getAll('distribucionUtilidadesData'),
                    distribucionDetalleData: DataManager.getAll('distribucionDetalleData'),
                    categoriasData: DataManager.getAll('categoriasData')
                }
            };

            // Crear archivo y descargarlo
            const backupStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([backupStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showToast('Backup descargado exitosamente', 'success');

        } catch (error) {
            console.error('Error exportando backup:', error);
            this.showToast('Error al exportar backup', 'error');
        }
    },

    // Importar backup JSON
    importarBackupJSON() {
        const input = document.getElementById('backupFileInput');
        if (!input) {
            this.showToast('No se encontró el input de backup', 'error');
            return;
        }

        // Adjuntar handler una sola vez
        if (!input._backupHandlerAttached) {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    await DataManager.importBackup(file);

                    // Recalcular todo
                    if (window.Calculations) {
                        Calculations.recalcularTodo();
                    }

                    // Actualizar selects y vista actual
                    this.actualizarSelectsEnFormularios();
                    if (window.Navigation) {
                        Navigation.reloadCurrentView();
                    }
                    this.showToast('Backup importado exitosamente', 'success');
                } catch (err) {
                    console.error('Error importando backup:', err);
                    this.showToast('Error al importar backup', 'error');
                } finally {
                    // Limpiar valor para permitir volver a elegir el mismo archivo
                    input.value = '';
                }
            });
            input._backupHandlerAttached = true;
        }

        input.click();
    },

    // Obtener fecha de hoy como string
    getTodayString() {
        return this.getFechaHoy();
    },

    // Función de debug para verificar estado del sistema
    debugSystemStatus() {
        console.log('=== ESTADO DEL SISTEMA ===');

        // Verificar módulos principales
        const modules = ['AppConfig', 'Templates', 'DataManager', 'Utils', 'Calculations', 'Navigation', 'App'];
        modules.forEach(module => {
            const exists = window[module] !== undefined;
            console.log(`${module}: ${exists ? '✓' : '✗'}`);
        });

        // Verificar datos
        const data = DataManager.data;
        console.log('Datos cargados:');
        Object.keys(data).forEach(key => {
            console.log(`  ${key}: ${data[key] ? data[key].length : 0} registros`);
        });

        // Verificar vistas disponibles
        const views = ['DashboardView', 'PersonasView', 'RolesView', 'TransaccionesView'];
        console.log('Vistas disponibles:');
        views.forEach(view => {
            const exists = window[view] !== undefined;
            console.log(`  ${view}: ${exists ? '✓' : '✗'}`);
        });

        console.log('=== FIN DEBUG ===');
    }
};
