// Categorías View
window.CategoriasView = {
    table: null,

    // Inicializar vista
    init() {
        console.log('Inicializando vista Categorías...');
        this.initTable();
        console.log('Categorías vista inicializada');
    },

    // Inicializar tabla
    initTable() {
        const container = document.getElementById('categorias-table');
        if (!container) return;

        this.table = new Tabulator(container, {
            height: "400px",
            layout: "fitColumns",
            pagination: "local",
            paginationSize: 15,
            columns: [
                { title: "ID", field: "id", width: 60 },
                { title: "Nombre", field: "nombre", width: 200 },
                {
                    title: "Uso",
                    field: "uso",
                    width: 100,
                    formatter: (cell) => {
                        const categoriaId = cell.getRow().getData().id;
                        const transacciones = DataManager.getAll('transaccionesData');
                        const uso = transacciones.filter(t => t.categoria === cell.getRow().getData().nombre).length;
                        return uso + ' veces';
                    }
                },
                {
                    title: "Acciones",
                    field: "acciones",
                    width: 120,
                    formatter: () => {
                        return '<button class="btn btn-sm btn-danger" onclick="CategoriasView.eliminarCategoria(this)">Eliminar</button>';
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

    // Agregar nueva categoría
    agregarCategoria() {
        const nombre = document.getElementById('categoria-nombre').value.trim();

        // Validaciones
        if (!nombre) {
            Utils.showToast('Por favor ingrese el nombre de la categoría', 'error');
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
            nombre: nombre
        };

        DataManager.add('categoriasData', nuevaCategoria);
        this.loadData();
        this.limpiarFormulario();
        Utils.showToast('Categoría agregada exitosamente', 'success');
    },

    // Eliminar categoría
    eliminarCategoria(button) {
        const row = this.table.getRow(button.closest('tr'));
        const categoria = row.getData();

        // Verificar si está en uso
        const transacciones = DataManager.getAll('transaccionesData');
        const enUso = transacciones.some(t => t.categoria === categoria.nombre);

        if (enUso) {
            Utils.showToast('No se puede eliminar una categoría que está en uso', 'error');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)) {
            DataManager.delete('categoriasData', categoria.id);
            this.loadData();
            Utils.showToast('Categoría eliminada', 'success');
        }
    },

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('categoria-nombre').value = '';
    },

    // Cleanup
    cleanup() {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
        console.log('Categorías view cleanup completado');
    }
};

// Auto-inicializar
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
