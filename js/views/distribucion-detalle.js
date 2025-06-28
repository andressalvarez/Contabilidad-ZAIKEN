// Distribución Detalle View
window.DistribucionDetalleView = {
    table: null,

    // Inicializar vista
    init() {
        console.log('Inicializando vista Distribución Detalle...');
        this.setupForm();
        this.initTable();
        console.log('Distribución Detalle vista inicializada');
    },

    // Configurar formulario
    setupForm() {
        const fechaInput = document.getElementById('dd-fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }

        this.loadDistribucionesSelect();
        this.loadPersonasSelect();
    },

    // Cargar distribuciones en select
    loadDistribucionesSelect() {
        const select = document.getElementById('dd-distSelect');
        if (!select) return;

        const distribuciones = DataManager.getAll('distribucionUtilidadesData');
        select.innerHTML = '<option value="">-- Seleccione distribución --</option>';

        distribuciones.forEach(dist => {
            const option = document.createElement('option');
            option.value = dist.id;
            option.textContent = `${dist.periodo} - COP ${dist.utilidadTotal.toLocaleString('es-CO')}`;
            select.appendChild(option);
        });
    },

    // Cargar personas en select
    loadPersonasSelect() {
        const select = document.getElementById('dd-personaSelect');
        if (!select) return;

        const personas = DataManager.getAll('personasData').filter(p => p.activo !== false);
        select.innerHTML = '<option value="">-- Seleccione persona --</option>';

        personas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.id;
            option.textContent = persona.nombre;
            select.appendChild(option);
        });
    },

    // Inicializar tabla
    initTable() {
        const container = document.getElementById('distribucion-detalle-table');
        if (!container) return;

        this.table = new Tabulator(container, {
            height: "400px",
            layout: "fitColumns",
            pagination: "local",
            paginationSize: 15,
            columns: [
                { title: "ID", field: "id", width: 60 },
                {
                    title: "Distribución",
                    field: "distribucionId",
                    width: 150,
                    formatter: (cell) => {
                        const distribId = cell.getValue();
                        if (!distribId) return 'N/A';
                        const distribucion = DataManager.getById('distribucionUtilidadesData', distribId);
                        return distribucion ? distribucion.periodo : 'N/A';
                    }
                },
                {
                    title: "Persona",
                    field: "personaId",
                    width: 150,
                    formatter: (cell) => {
                        const personaId = cell.getValue();
                        if (!personaId) return 'N/A';
                        const persona = DataManager.getById('personasData', personaId);
                        return persona ? persona.nombre : 'N/A';
                    }
                },
                {
                    title: "Participación %",
                    field: "participacionPorc",
                    width: 120,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return (value || 0).toFixed(2) + '%';
                    }
                },
                {
                    title: "Monto",
                    field: "montoRecibir",
                    width: 120,
                    formatter: function(cell) {
                        const value = cell.getValue();
                        return 'COP ' + (value || 0).toLocaleString('es-CO');
                    }
                },
                { title: "Fecha", field: "fecha", width: 100 },
                {
                    title: "Acciones",
                    field: "acciones",
                    width: 120,
                    formatter: () => {
                        return '<button class="btn btn-sm btn-danger" onclick="DistribucionDetalleView.eliminarDetalle(this)">Eliminar</button>';
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

        const detalles = DataManager.getAll('distribucionDetalleData');
        this.table.setData(detalles);
    },

    // Agregar nuevo detalle de distribución
    agregarDistribucionDetalle() {
        const distribucionId = document.getElementById('dd-distSelect').value;
        const personaId = document.getElementById('dd-personaSelect').value;
        const participacion = parseFloat(document.getElementById('dd-participacion').value);
        const fecha = document.getElementById('dd-fecha').value;

        // Validaciones
        if (!distribucionId || !personaId || !participacion || isNaN(participacion) || !fecha) {
            Utils.showToast('Por favor complete todos los campos', 'error');
            return;
        }

        if (participacion <= 0 || participacion > 100) {
            Utils.showToast('La participación debe estar entre 0 y 100%', 'error');
            return;
        }

        // Verificar duplicados
        const detalles = DataManager.getAll('distribucionDetalleData');
        const existe = detalles.some(d =>
            d.distribucionId === parseInt(distribucionId) &&
            d.personaId === parseInt(personaId)
        );

        if (existe) {
            Utils.showToast('Ya existe un detalle para esta persona en esta distribución', 'error');
            return;
        }

        // Verificar que no se exceda el 100%
        const totalParticipacion = detalles
            .filter(d => d.distribucionId === parseInt(distribucionId))
            .reduce((acc, d) => acc + (d.participacionPorc || 0), 0) + participacion;

        if (totalParticipacion > 100) {
            Utils.showToast('La participación total no puede exceder el 100%', 'error');
            return;
        }

        // Obtener distribución para calcular monto
        const distribucion = DataManager.getById('distribucionUtilidadesData', parseInt(distribucionId));
        if (!distribucion) {
            Utils.showToast('Distribución no encontrada', 'error');
            return;
        }

        const montoRecibir = Math.round((distribucion.utilidadTotal * participacion) / 100);

        const nuevoDetalle = {
            distribucionId: parseInt(distribucionId),
            personaId: parseInt(personaId),
            participacionPorc: participacion,
            montoRecibir: montoRecibir,
            fecha
        };

        DataManager.add('distribucionDetalleData', nuevoDetalle);
        this.loadData();
        this.limpiarFormulario();
        Utils.showToast('Detalle de distribución agregado exitosamente', 'success');

        // Verificar si se completó la distribución
        this.verificarDistribucionCompleta(parseInt(distribucionId));
    },

    // Verificar si la distribución está completa
    verificarDistribucionCompleta(distribucionId) {
        const detalles = DataManager.getAll('distribucionDetalleData')
            .filter(d => d.distribucionId === distribucionId);

        const totalParticipacion = detalles.reduce((acc, d) => acc + (d.participacionPorc || 0), 0);

        if (Math.abs(totalParticipacion - 100) < 0.01) {
            // Marcar distribución como completa
            DataManager.update('distribucionUtilidadesData', distribucionId, { estado: 'Distribuida' });
            Utils.showToast('¡Distribución completada al 100%!', 'success');
        }
    },

    // Repartir utilidad automáticamente - IMPLEMENTACIÓN COMPLETA CON WEIGHTEDINVERSION
    repartirUtilidadAutomatica() {
        const distribucionId = document.getElementById('dd-distSelect').value;

        if (!distribucionId) {
            Utils.showToast('Por favor seleccione una distribución', 'error');
            return;
        }

        const distribucion = DataManager.getById('distribucionUtilidadesData', parseInt(distribucionId));
        if (!distribucion) {
            Utils.showToast('Distribución no encontrada', 'error');
            return;
        }

        const utilidadTotal = distribucion.utilidadTotal;
        if (!utilidadTotal || utilidadTotal <= 0) {
            Utils.showToast('La utilidad total de esta distribución es 0 o está vacía', 'error');
            return;
        }

        if (!confirm('¿Está seguro de repartir automáticamente? Esto eliminará los detalles existentes para esta distribución.')) {
            return;
        }

        try {
            // 1. Eliminar detalles existentes para esta distribución
            const detallesExistentes = DataManager.getAll('distribucionDetalleData')
                .filter(d => d.distribucionId === parseInt(distribucionId));

            detallesExistentes.forEach(detalle => {
                DataManager.delete('distribucionDetalleData', detalle.id);
            });

            // 2. Obtener datos necesarios
            const personas = DataManager.getAll('personasData');
            const roles = DataManager.getAll('rolesData');

            // 3. Calcular WeightedInversion para cada persona (ALGORITMO ORIGINAL)
            let arrayWeighted = [];
            personas.forEach(p => {
                // Obtener la importancia del rol
                const rol = roles.find(r => r.id === p.rolId);
                const rolImportancia = rol ? rol.importancia : 0;

                // WeightedInversion = inversionTotal * (1 + (rolImportancia / 100))
                const weighted = p.inversionTotal * (1 + (rolImportancia / 100));

                arrayWeighted.push({
                    personaId: p.id,
                    personaNombre: p.nombre,
                    weighted: weighted,
                    inversionTotal: p.inversionTotal,
                    rolImportancia: rolImportancia
                });
            });

            // 4. Sumar todas las WeightedInversion
            const sumWeighted = arrayWeighted.reduce((acc, obj) => acc + obj.weighted, 0);

            if (sumWeighted <= 0) {
                Utils.showToast('No hay WeightedInversion > 0. Verifica que las personas tengan horas/aportes y roles con importancia > 0', 'error');
                return;
            }

            // 5. Crear nuevos registros en distribucionDetalleData
            arrayWeighted.forEach(obj => {
                if (obj.weighted > 0) { // Solo incluir personas con weighted > 0
                    const porcentaje = (obj.weighted / sumWeighted) * 100;
                    const montoRecibir = (porcentaje / 100) * utilidadTotal;

                    const nuevoDetalle = {
                        distribucionId: parseInt(distribucionId),
                        personaId: obj.personaId,
                        participacionPorc: +porcentaje.toFixed(2),
                        montoRecibir: +montoRecibir.toFixed(0),
                        fecha: distribucion.fecha,
                        notas: `Auto distribuido - Weighted: ${obj.weighted.toFixed(2)}`
                    };

                    DataManager.add('distribucionDetalleData', nuevoDetalle);
                }
            });

            // 6. Marcar distribución como completa
            DataManager.update('distribucionUtilidadesData', parseInt(distribucionId), {
                estado: 'Distribuida',
                fechaDistribucion: new Date().toISOString().split('T')[0]
            });

            // 7. Refrescar datos y recalcular
            this.loadData();
            Calculations.recalcularDistribucion();

            Utils.showToast(`¡Distribución automática realizada para ${arrayWeighted.filter(a => a.weighted > 0).length} personas!`, 'success');

            console.log('Distribución automática completada:', {
                distribucionId: parseInt(distribucionId),
                utilidadTotal,
                sumWeighted,
                personasIncluidas: arrayWeighted.filter(a => a.weighted > 0).length
            });

        } catch (error) {
            console.error('Error en distribución automática:', error);
            Utils.showToast('Error al distribuir automáticamente: ' + error.message, 'error');
        }
    },

    // Filtrar por distribución
    filtrarPorDistribucion(distribucionId) {
        if (!this.table) return;

        if (distribucionId) {
            this.table.setFilter('distribucionId', '=', parseInt(distribucionId));
        } else {
            this.table.clearFilter();
        }
    },

    // Eliminar detalle
    eliminarDetalle(button) {
        const row = this.table.getRow(button.closest('tr'));
        const detalle = row.getData();

        const persona = DataManager.getById('personasData', detalle.personaId);
        const distribucion = DataManager.getById('distribucionUtilidadesData', detalle.distribucionId);

        const nombrePersona = persona ? persona.nombre : 'Persona desconocida';
        const periodoDistribucion = distribucion ? distribucion.periodo : 'Distribución desconocida';

        if (confirm(`¿Estás seguro de eliminar el detalle de "${nombrePersona}" para "${periodoDistribucion}"?`)) {
            DataManager.delete('distribucionDetalleData', detalle.id);
            this.loadData();
            Utils.showToast('Detalle eliminado', 'success');

            // Actualizar estado de distribución si ya no está al 100%
            if (distribucion) {
                const detallesRestantes = DataManager.getAll('distribucionDetalleData')
                    .filter(d => d.distribucionId === detalle.distribucionId);

                const totalParticipacion = detallesRestantes.reduce((acc, d) => acc + (d.participacionPorc || 0), 0);

                if (Math.abs(totalParticipacion - 100) >= 0.01) {
                    DataManager.update('distribucionUtilidadesData', detalle.distribucionId, { estado: 'Pendiente' });
                }
            }
        }
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('dd-distSelect').value = '';
        document.getElementById('dd-personaSelect').value = '';
        document.getElementById('dd-participacion').value = '';

        // Reset fecha a hoy
        const fechaInput = document.getElementById('dd-fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
    },

    // Cleanup
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
        console.log('Distribución Detalle view cleanup completado');
    }
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('distribucion-detalle-table')) {
            DistribucionDetalleView.init();
        }
    });
} else {
    if (document.getElementById('distribucion-detalle-table')) {
        DistribucionDetalleView.init();
    }
}
