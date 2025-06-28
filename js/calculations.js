// Módulo de cálculos del sistema
window.Calculations = {

    // Funciones de cálculo para personas
    recalcularValorHora(personaId) {
        const registro = DataManager.getAll('valorHoraData').find(vh => vh.personaId === personaId);
        return registro ? +registro.valor : 0;
    },

    recalcularHorasTotales(personaId) {
        return DataManager.getAll('registroHorasData')
            .filter(rh => rh.personaId === personaId)
            .reduce((acc, curr) => acc + Number(curr.horas || 0), 0);
    },

    recalcularAportesTotales(personaId) {
        return DataManager.getAll('transaccionesData')
            .filter(t => t.tipo === "Aporte" && t.personaId === personaId)
            .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    },

    calcInversionHoras(horas, valorHora) {
        return horas * valorHora;
    },

    calcInversionTotal(aportesTotales, inversionHoras) {
        return aportesTotales + inversionHoras;
    },

    getParticipacionPorRol(rolId) {
        const rol = DataManager.getAll('rolesData').find(r => r.id === rolId);
        return rol ? Number(rol.importancia) : 0;
    },

    // Funciones de cálculo para campañas
    calcGastoCampana(campanaId) {
        return DataManager.getAll('transaccionesData')
            .filter(t => t.tipo === "Gasto" && t.campanaId === campanaId)
            .reduce((acc, t) => acc + Number(t.monto), 0);
    },

    calcIngresoCampana(campanaId) {
        return DataManager.getAll('transaccionesData')
            .filter(t => t.tipo === "Ingreso" && t.campanaId === campanaId)
            .reduce((acc, t) => acc + Number(t.monto), 0);
    },

    calcHorasCampana(campanaId) {
        return DataManager.getAll('registroHorasData')
            .filter(rh => rh.campanaId === campanaId)
            .reduce((acc, rh) => acc + Number(rh.horas), 0);
    },

    // Funciones de cálculo para distribución
    calcMontoRecibir(utilidadTotal, participacion) {
        return (utilidadTotal * participacion) / 100;
    },

    // Recalcular todas las personas
    recalcularPersonas() {
        const personas = DataManager.getAll('personasData');

        personas.forEach(p => {
            // Forzamos rolId a número
            p.rolId = +p.rolId;

            const valHora = this.recalcularValorHora(p.id);
            const horasTot = this.recalcularHorasTotales(p.id);
            const aportesTot = this.recalcularAportesTotales(p.id);
            const rolPorc = this.getParticipacionPorRol(p.rolId);

            p.valorHora = valHora;
            p.horasTotales = horasTot;
            p.aportesTotales = aportesTot;
            p.inversionHoras = this.calcInversionHoras(horasTot, valHora);
            p.inversionTotal = this.calcInversionTotal(aportesTot, p.inversionHoras);
            p.participacionPorc = rolPorc;
        });

        DataManager.saveData();
        console.log('Personas recalculadas');
    },

    // Recalcular todas las campañas
    recalcularCampanas() {
        const campanas = DataManager.getAll('campanasData');

        campanas.forEach(c => {
            c.horasInvertidas = this.calcHorasCampana(c.id);
            c.gastoTotalReal = this.calcGastoCampana(c.id);
            c.ingresoTotalReal = this.calcIngresoCampana(c.id);
            c.rentabilidadReal = c.ingresoTotalReal - c.gastoTotalReal;
        });

        DataManager.saveData();
        console.log('Campañas recalculadas');
    },

    // Recalcular distribución
    recalcularDistribucion() {
        const distribuciones = DataManager.getAll('distribucionDetalleData');
        const distribucionesUtilidades = DataManager.getAll('distribucionUtilidadesData');

        distribuciones.forEach(d => {
            const dist = distribucionesUtilidades.find(du => du.id === d.distribucionId);
            const utilidadTotal = dist ? dist.utilidadTotal : 0;
            d.montoRecibir = this.calcMontoRecibir(utilidadTotal, d.participacionPorc);
        });

        DataManager.saveData();
        console.log('Distribución recalculada');
    },

    // Recalcular todo el sistema
    recalcularTodo() {
        this.recalcularPersonas();
        this.recalcularCampanas();
        this.recalcularDistribucion();
        console.log('Sistema completo recalculado');
    },

    // Cálculos para el dashboard
    calcularResumen(filtroFechas = null) {
        let transacciones = DataManager.getAll('transaccionesData');
        let registroHoras = DataManager.getAll('registroHorasData');
        let distribucionUtilidades = DataManager.getAll('distribucionUtilidadesData');

        // Aplicar filtros de fecha si están definidos
        if (filtroFechas && (filtroFechas.startDate || filtroFechas.endDate)) {
            transacciones = this.filtrarPorFechas(transacciones, filtroFechas);
            registroHoras = this.filtrarPorFechas(registroHoras, filtroFechas);
            distribucionUtilidades = this.filtrarPorFechas(distribucionUtilidades, filtroFechas);
        }

        const totalIngresos = transacciones
            .filter(t => t.tipo === "Ingreso")
            .reduce((acc, t) => acc + t.monto, 0);

        const totalGastos = transacciones
            .filter(t => t.tipo === "Gasto")
            .reduce((acc, t) => acc + t.monto, 0);

        const totalAportes = transacciones
            .filter(t => t.tipo === "Aporte")
            .reduce((acc, t) => acc + t.monto, 0);

        const balance = totalIngresos - totalGastos;
        const horasTotales = registroHoras.reduce((acc, rh) => acc + rh.horas, 0);

        const utilidadesDistribuidas = distribucionUtilidades
            .reduce((acc, du) => acc + du.utilidadTotal, 0);

        return {
            totalIngresos,
            totalGastos,
            totalAportes,
            balance,
            horasTotales,
            utilidadesDistribuidas,
            transaccionesCount: transacciones.length,
            personasActivas: DataManager.getAll('personasData').length,
            campanasActivas: DataManager.getAll('campanasData').length
        };
    },

    // Filtrar por fechas
    filtrarPorFechas(data, filtroFechas) {
        return data.filter(item => {
            const fecha = Utils.parseDate(item.fecha);
            if (!fecha) return false;

            if (filtroFechas.startDate && fecha < filtroFechas.startDate) return false;
            if (filtroFechas.endDate && fecha > filtroFechas.endDate) return false;

            return true;
        });
    },

    // ✅ IMPLEMENTACIÓN COMPLETA: Repartir utilidad automática con WeightedInversion
    repartirUtilidadAutomatica(distribucionId) {
        const dist = DataManager.getById('distribucionUtilidadesData', distribucionId);
        if (!dist) {
            throw new Error("No se encontró la distribución con ID: " + distribucionId);
        }

        const utilidadTotal = dist.utilidadTotal;
        if (!utilidadTotal || utilidadTotal <= 0) {
            throw new Error("La utilidad total de esta distribución es 0 o está vacía.");
        }

        // Calculamos WeightedInversion para cada persona (ALGORITMO ORIGINAL)
        const personas = DataManager.getAll('personasData');
        const roles = DataManager.getAll('rolesData');

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

        // Sumar todas las WeightedInversion
        const sumWeighted = arrayWeighted.reduce((acc, obj) => acc + obj.weighted, 0);

        if (sumWeighted <= 0) {
            throw new Error("No hay WeightedInversion > 0. Verifica que las personas tengan horas/aportes y roles con importancia > 0.");
        }

        // Eliminar detalles previos para esta distribución
        const detallesExistentes = DataManager.getAll('distribucionDetalleData')
            .filter(dd => dd.distribucionId === distribucionId);

        detallesExistentes.forEach(detalle => {
            DataManager.delete('distribucionDetalleData', detalle.id);
        });

        // Crear nuevos registros en distribucionDetalleData
        arrayWeighted.forEach(obj => {
            if (obj.weighted > 0) { // Solo incluir personas con weighted > 0
                const porcentaje = (obj.weighted / sumWeighted) * 100;
                const montoRecibir = (porcentaje / 100) * utilidadTotal;

                const nuevoDetalle = {
                    distribucionId: distribucionId,
                    personaId: obj.personaId,
                    participacionPorc: +porcentaje.toFixed(2),  // ✅ CORREGIDO: Campo correcto
                    montoRecibir: +montoRecibir.toFixed(0),     // ✅ CORREGIDO: Campo correcto
                    fecha: dist.fecha,
                    notas: `Auto distribuido - Weighted: ${obj.weighted.toFixed(2)}`
                };

                DataManager.add('distribucionDetalleData', nuevoDetalle);
            }
        });

        // Marcar distribución como completa
        DataManager.update('distribucionUtilidadesData', distribucionId, {
            estado: 'Distribuida',
            fechaDistribucion: new Date().toISOString().split('T')[0]
        });

        // Recalcular distribución
        this.recalcularDistribucion();

        console.log(`Distribución automática completada para distribución ID ${distribucionId}`, {
            utilidadTotal,
            sumWeighted,
            personasIncluidas: arrayWeighted.filter(a => a.weighted > 0).length
        });

        return {
            distribucionId,
            utilidadTotal,
            personasIncluidas: arrayWeighted.filter(a => a.weighted > 0).length,
            detalles: arrayWeighted.filter(a => a.weighted > 0)
        };
    },

    // Calcular gastos por categoría para gráficos
    calcularGastosPorCategoria(filtroFechas = null) {
        let transacciones = DataManager.getAll('transaccionesData')
            .filter(t => t.tipo === "Gasto");

        if (filtroFechas && (filtroFechas.startDate || filtroFechas.endDate)) {
            transacciones = this.filtrarPorFechas(transacciones, filtroFechas);
        }

        const gastosPorCategoria = {};
        transacciones.forEach(t => {
            const categoria = t.categoria || 'Otros';
            gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + t.monto;
        });

        return gastosPorCategoria;
    },

    // Calcular estadísticas de rendimiento por persona
    calcularRendimientoPersonas() {
        const personas = DataManager.getAll('personasData');
        const transacciones = DataManager.getAll('transaccionesData');
        const registroHoras = DataManager.getAll('registroHorasData');

        return personas.map(p => {
            const horasPersona = registroHoras
                .filter(rh => rh.personaId === p.id)
                .reduce((acc, rh) => acc + rh.horas, 0);

            const aportesPersona = transacciones
                .filter(t => t.tipo === "Aporte" && t.personaId === p.id)
                .reduce((acc, t) => acc + t.monto, 0);

            const roi = p.inversionTotal > 0 ?
                ((p.aportesTotales - p.inversionTotal) / p.inversionTotal) * 100 : 0;

            return {
                ...p,
                horasReales: horasPersona,
                aportesReales: aportesPersona,
                roi: roi,
                eficiencia: horasPersona > 0 ? p.valorHora * horasPersona / p.inversionTotal : 0
            };
        });
    },

    // Validar integridad de datos
    validarIntegridadDatos() {
        const errores = [];

        // Validar personas
        const personas = DataManager.getAll('personasData');
        personas.forEach(p => {
            if (!p.nombre || p.nombre.trim() === '') {
                errores.push(`Persona ID ${p.id}: Nombre vacío`);
            }
            if (p.rolId && !DataManager.getById('rolesData', p.rolId)) {
                errores.push(`Persona ID ${p.id}: Rol inexistente (${p.rolId})`);
            }
        });

        // Validar transacciones
        const transacciones = DataManager.getAll('transaccionesData');
        transacciones.forEach(t => {
            if (!t.tipo || !['Ingreso', 'Gasto', 'Aporte'].includes(t.tipo)) {
                errores.push(`Transacción ID ${t.id}: Tipo inválido (${t.tipo})`);
            }
            if (!t.monto || t.monto <= 0) {
                errores.push(`Transacción ID ${t.id}: Monto inválido (${t.monto})`);
            }
            if (t.personaId && !DataManager.getById('personasData', t.personaId)) {
                errores.push(`Transacción ID ${t.id}: Persona inexistente (${t.personaId})`);
            }
        });

        // Validar distribuciones
        const distribuciones = DataManager.getAll('distribucionDetalleData');
        distribuciones.forEach(d => {
            if (!DataManager.getById('distribucionUtilidadesData', d.distribucionId)) {
                errores.push(`Distribución detalle ID ${d.id}: Distribución inexistente (${d.distribucionId})`);
            }
            if (!DataManager.getById('personasData', d.personaId)) {
                errores.push(`Distribución detalle ID ${d.id}: Persona inexistente (${d.personaId})`);
            }
        });

        return errores;
    }
};
