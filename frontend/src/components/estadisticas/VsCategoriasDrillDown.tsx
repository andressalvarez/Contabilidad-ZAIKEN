'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { useTransacciones, useResumenPorCategorias } from '@/hooks/useTransacciones';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useCategorias } from '@/hooks/useCategorias';
import { VSCategoriasService, type VSCarpeta, type VSGrupo, type DatosGrafico } from '@/services/vs-categorias.service';
import { Transaccion, Usuario } from '@/types';
import { toast } from 'sonner';
import {
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  FolderOpen,
  FolderClosed,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Palette,
  Save,
  X,
  Plus,
  Edit3,
  Trash2,
  FileText,
  BarChart,
  List,
  Grid3X3,
  Search,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  PieChart,
  Tags
} from 'lucide-react';

// Importar Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { Chart } from 'chart.js';

// Registrar componentes de Chart.js
// Plugin para fondo blanco en exportación
const WhiteBg = {
  id: 'whiteBg',
  beforeDraw(chart: any, _args: any, opts: any) {
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = opts?.color ?? '#ffffff';
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.restore();
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  WhiteBg
);

// Interfaces
interface VsCategoriasDrillDownProps {
  filters: any;
  config: any;
  onConfigChange: (config: any) => void;
}

interface VsCategoriasDrillDownRef {
  renderChart: () => void;
  collapseDetails: () => void;
}

// ===== NORMALIZACIÓN DE TIPOS =====
type TipoTx = 'GASTO' | 'INGRESO' | 'APORTE' | ''; // '' = sin filtro

const normalizeTipo = (v?: string): TipoTx => {
  const k = (v || '').toLowerCase();
  if (k === 'gasto') return 'GASTO';
  if (k === 'ingreso') return 'INGRESO';
  if (k === 'aporte') return 'APORTE';
  return '';
};

type SegmentKind = 'group' | 'category';
interface SegmentMeta {
  kind: SegmentKind;
  id: number;
  label: string;
  color: string;
  value: number;
}

interface ChartQuery {
  tipo: TipoTx;
  fechaDesde?: string;
  fechaHasta?: string;
  groupIds?: number[];
  categoryIds?: number[];
}

interface GrupoNorm {
  id: number;
  nombre: string;
  color: string;
  visible: boolean;
  carpetaId?: number;
  categoriaIds: number[];       // ✅ nuevo: fuente de verdad
  categoriaNames?: string[];    // (opcional) sólo para UI/retrocompat
}

interface Carpeta {
  id: number;
  nombre: string;
  color: string;
  visible: boolean;
  carpetaPadreId?: number;
}

interface VSConfig {
  grupos: Record<number, GrupoNorm>;
  carpetas: Record<number, Carpeta>;
  colores: Record<number /*categoryId*/, string>;
  filtros: {
    tipo: TipoTx;
    fechaDesde: string;
    fechaHasta: string;
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    gruposSeleccionados: number[];      // ✅ IDs
    carpetasSeleccionadas: number[];    // ✅ IDs
  };
  version?: '2';
}

// Usar la interfaz del servicio en lugar de redefinir

// Wrapper interno que verifica el QueryClient
const VsCategoriasDrillDownInternal = forwardRef<VsCategoriasDrillDownRef, VsCategoriasDrillDownProps>(
  ({ filters, config, onConfigChange }, ref) => {
    // Verificar si hay QueryClient disponible
    let queryClient;
    try {
      queryClient = useQueryClient();
    } catch (error) {
      console.warn('QueryClient no disponible, creando uno temporal', error);
    }

    // Estados del módulo
    const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
    const [currentTransactions, setCurrentTransactions] = useState<Transaccion[]>([]);
    const [currentView, setCurrentView] = useState<'list' | 'chart'>('list');

    // Estado del segmento actual para DetailContent
    const [currentSegmentInfo, setCurrentSegmentInfo] = useState<{
      label: string;
      value: number;
      color: string;
    } | null>(null);
    const [showGroupsModal, setShowGroupsModal] = useState(false);
    const [showCarpetasModal, setShowCarpetasModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
  const [showEditCarpetaModal, setShowEditCarpetaModal] = useState(false);
  const [showEditGrupoModal, setShowEditGrupoModal] = useState(false);
  const [editingCarpeta, setEditingCarpeta] = useState<{id: number, carpeta: Carpeta} | null>(null);
  const [editingGrupo, setEditingGrupo] = useState<{id: number, grupo: GrupoNorm} | null>(null);

    // Estados para VS Categorías avanzado
    const [vsConfig, setVsConfig] = useState<VSConfig>({
      grupos: {},
      carpetas: {},
      colores: {},
      filtros: {
        tipo: 'GASTO',
        fechaDesde: '',
        fechaHasta: '',
        chartType: 'bar',
        gruposSeleccionados: [],
        carpetasSeleccionadas: []
      },
      version: '2'
    });

    const [detailFilters, setDetailFilters] = useState({
      search: '',
      tipo: '',
      persona: '',
      sortField: 'monto',
      sortDirection: 'desc' as 'asc' | 'desc'
    });

    // Referencias
    const chartRef = useRef<Chart | null>(null);
    const detailsContainerRef = useRef<HTMLDivElement>(null);
    const chartMetaRef = useRef<SegmentMeta[]>([]);
    const lastReq = useRef(0);



    // Hooks de datos
    const { data: resumenCategorias = [] } = useResumenPorCategorias(filters);
    const { data: usuarios = [] } = useUsuarios();
    const { data: categorias = [] } = useCategorias();
    const { data: transacciones = [] } = useTransacciones(filters);

    // Mapas de categorías (para resolver nombres↔IDs)
    const byCatId = useMemo(() => new Map(categorias.map(c => [c.id, c.nombre])), [categorias]);
    const catIdByName = useMemo(() => new Map(categorias.map(c => [c.nombre, c.id])), [categorias]);

    // MIGRACIÓN al cargar configuración guardada
    const migrateConfigV1toV2 = (oldCfg: any): VSConfig => {
      const grupos: Record<number, GrupoNorm> = {};
      Object.entries(oldCfg.grupos || {}).forEach(([id, g]: any) => {
        const categoriaIds = (g.categoriaIds || []).filter(Boolean);
        grupos[+id] = {
          id: +id,
          nombre: g.nombre,
          color: g.color,
          visible: g.visible !== false,
          carpetaId: g.carpetaId,
          categoriaIds,
          categoriaNames: g.categoriaNames, // opcional
        };
      });
      return { ...oldCfg, grupos, version: '2' };
    };

    // ===== SELECTORES DERIVADOS =====
    const selectVisibleFolderIds = (s: VSConfig) =>
      Object.entries(s.carpetas).filter(([_, c]) => c.visible !== false).map(([id]) => +id);

    const selectVisibleGroupIds = (s: VSConfig) => {
      const visibleFolders = new Set(selectVisibleFolderIds(s));
      return Object.entries(s.grupos)
        .filter(([_, g]) => g.visible !== false && (!g.carpetaId || visibleFolders.has(g.carpetaId)))
        .map(([id]) => +id);
    };

    const selectEffectiveGroupIds = (s: VSConfig) => {
      const visibles = new Set(selectVisibleGroupIds(s));
      return (s.filtros.gruposSeleccionados || []).filter(id => visibles.has(id));
    };

    const selectCategoryIdsFromGroupIds = (s: VSConfig, groupIds: number[]) => {
      const out = new Set<number>();
      groupIds.forEach(id => s.grupos[id]?.categoriaIds.forEach(cid => out.add(cid)));
      return [...out];
    };

    // ===== QUERY BUILDER =====
    const buildChartQuery = (s: VSConfig): ChartQuery => {
      const selectedTipo = normalizeTipo(s.filtros.tipo as any);
      const q: ChartQuery = {
        // Si el usuario no escogió tipo, no mandamos tipo para que el backend sume todo
        tipo: selectedTipo || undefined as any,
        fechaDesde: s.filtros.fechaDesde || undefined,
        fechaHasta: s.filtros.fechaHasta || undefined
      } as any;
      const effGroups = selectEffectiveGroupIds(s);
      if (effGroups.length) {
        q.groupIds = effGroups;
      } else {
        q.categoryIds = undefined; // backend decide por categorías
      }
      return q;
    };

    const buildSegmentQuery = (s: VSConfig, seg: SegmentMeta): any => {
      const selectedTipo = normalizeTipo(s.filtros.tipo as any);
      const base: any = {
        fechaInicio: s.filtros.fechaDesde || undefined,
        fechaFin: s.filtros.fechaHasta || undefined,
      };
      if (selectedTipo) base.tipo = selectedTipo;

      if (seg.kind === 'group') {
        const catIds = s.grupos[seg.id]?.categoriaIds ?? [];
        return { ...base, categoriasIds: catIds };
      } else {
        return { ...base, categoriaId: seg.id };
      }
    };

    // ===== CHART MODEL CON METADATOS =====
    const buildChartModel = (s: VSConfig, resumenCategorias: any[], datosBackend: {datos: Record<string, number>, esGrupo: boolean}) => {
      const labels: string[] = [];
      const values: number[] = [];
      const meta: SegmentMeta[] = [];
      const colors: string[] = [];

      if (datosBackend.esGrupo) {
        // resultado agregado por grupo
        Object.entries(datosBackend.datos).forEach(([groupName, value]) => {
          const group = Object.values(s.grupos).find(g => g.nombre === groupName);
          if (!group) return;
          labels.push(group.nombre);
          values.push(value as number);
          meta.push({ kind: 'group', id: group.id, label: group.nombre, color: group.color, value: value as number });
          colors.push(group.color);
        });
      } else {
        // agregado por categoría - Fix #2: Usar IDs para colores
        Object.entries(datosBackend.datos).forEach(([catName, value], idx) => {
          const catId = catIdByName.get(catName);
          if (!catId) return;
          labels.push(catName);
          values.push(value as number);
          const existing = s.colores[catId];
          const colorAsignado = existing || coloresBase[idx % coloresBase.length];
          if (!existing && catId) {
            setVsConfig(prev => ({
              ...prev,
              colores: { ...prev.colores, [catId]: colorAsignado } // 👈 Fix #2: llave numérica
            }));
          }
          meta.push({ kind: 'category', id: catId, label: catName, color: colorAsignado, value: value as number });
          colors.push(colorAsignado);
        });
      }

      chartMetaRef.current = meta; // ✅ guarda metadatos para clicks
      return { labels, values, colors, meta };
    };

    // ===== FETCH CON CONTROL DE CONCURRENCIA =====
    const fetchSegmentTransactions = async (seg: SegmentMeta) => {
      const payload = buildSegmentQuery(vsConfig, seg);
      try {
        const res = await VSCategoriasService.getTransaccionesPorSegmento(payload);
        // adapta: res.data?.data || res.data || res
        const arr = Array.isArray(res?.data?.data) ? res.data.data :
                    Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        return transformApiTransactions(arr); // tu mapper a Transaccion
      } catch {
        return fallbackLocalTransactions(seg); // usa IDs, no nombres
      }
    };

    const transformApiTransactions = (apiData: any[]): Transaccion[] => {
      return apiData.map((t: any) => {
        let personaId = null;
        let personaNombre = '';
        if (t.persona) {
          personaId = t.persona.id || t.personaId;
          personaNombre = t.persona.nombre || t.persona.name || '';
        } else if (t.personaId) {
          personaId = t.personaId;
        }

        return {
          id: t.id,
          tipoId: t.tipoId || 0,
          monto: t.monto || 0,
          concepto: t.concepto || 'Sin concepto',
          fecha: t.fecha ? new Date(t.fecha).toISOString().split('T')[0] : '',
          categoriaId: t.categoriaId,
          categoria: t.categoria?.nombre ? t.categoria : (t.categoria ? { nombre: t.categoria } as any : undefined),
          personaId: personaId,
          persona: t.persona || (personaId ? { id: personaId, nombre: personaNombre } as any : undefined),
          campanaId: t.campanaId,
          campana: t.campana,
          moneda: t.moneda || 'COP',
          notas: t.notas || '',
          comprobante: t.comprobante,
          aprobado: t.aprobado || false,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
          tipo: t.tipo?.nombre ? t.tipo : (t.tipo ? { nombre: t.tipo } as any : undefined)
        };
      });
    };

    const fallbackLocalTransactions = (seg: SegmentMeta): Transaccion[] => {
      let rows = [...transacciones];

      // tipo
      const tipo = vsConfig.filtros.tipo;
      if (tipo) {
        rows = rows.filter(t => (typeof t.tipo === 'string' ? t.tipo : t.tipo?.nombre) === tipo);
      }

      // fechas
      if (vsConfig.filtros.fechaDesde) rows = rows.filter(t => t.fecha >= vsConfig.filtros.fechaDesde);
      if (vsConfig.filtros.fechaHasta) rows = rows.filter(t => t.fecha <= vsConfig.filtros.fechaHasta);

      if (seg.kind === 'group') {
        const catIds = vsConfig.grupos[seg.id]?.categoriaIds ?? [];
        return rows.filter(t => (t.categoriaId && catIds.includes(t.categoriaId)));
      } else {
        return rows.filter(t => t.categoriaId === seg.id);
      }
    };

    // Colores base para el sistema - Paleta con máxima distinción visual
    const coloresBase = [
      '#e74c3c',  // Rojo vibrante
      '#3498db',  // Azul brillante
      '#2ecc71',  // Verde esmeralda
      '#f39c12',  // Naranja dorado
      '#9b59b6',  // Púrpura real
      '#1abc9c',  // Turquesa
      '#34495e',  // Azul oscuro
      '#f1c40f',  // Amarillo sol
      '#e67e22',  // Naranja quemado
      '#8e44ad',  // Violeta oscuro
      '#16a085',  // Verde azulado
      '#2c3e50',  // Gris azulado oscuro
      '#d35400',  // Rojo naranja
      '#7f8c8d',  // Gris medio
      '#c0392b',  // Rojo oscuro
      '#2980b9',  // Azul océano
      '#27ae60',  // Verde bosque
      '#f4d03f',  // Amarillo pastel
      '#af7ac5',  // Lila
      '#5dade2'   // Azul cielo
    ];

    // Cargar configuración al inicializar
    useEffect(() => {
      applySavedConfig();
    }, []);

    // Auto-guardar configuración cuando cambie vsConfig
    useEffect(() => {
      // Solo guardar si no es la configuración inicial vacía
      if (Object.keys(vsConfig.grupos).length > 0 || Object.keys(vsConfig.carpetas).length > 0) {
        console.log('💾 Auto-guardando configuración por cambio de estado');
        saveConfig();
      }
    }, [vsConfig]);

    // Debug: Monitorear cambios en currentView
    useEffect(() => {
      console.log('🔄 useEffect: currentView cambió a:', currentView);
    }, [currentView]);

    // Debug: Monitorear cambios en currentSegmentInfo
    useEffect(() => {
      console.log('🔄 useEffect: currentSegmentInfo cambió a:', currentSegmentInfo);
    }, [currentSegmentInfo]);

    // Cargar datos iniciales de VS Categorías desde el backend
    useEffect(() => {
      const cargarDatosIniciales = async () => {
        try {
          console.log('Cargando datos iniciales de VS Categorías...');

          // NO limpiar configuración - preservar estado del usuario
          // localStorage.removeItem('vsCategoriasConfig');

          const datos = await VSCategoriasService.getVSCategoriasData();

          // Cargar estado previo del localStorage
          const savedConfigStr = localStorage.getItem('vsCategoriasConfig');
          let savedConfig: any = {};
          if (savedConfigStr) {
            try {
              savedConfig = JSON.parse(savedConfigStr);
              console.log('📚 Configuración previa encontrada:', savedConfig);
            } catch (e) {
              console.warn('⚠️ Error parseando configuración guardada:', e);
            }
          }

          // Actualizar carpetas preservando estado de visibilidad
          const carpetasActualizadas: Record<number, Carpeta> = {};
          datos.carpetas.forEach(carpeta => {
            // Usar estado guardado si existe, sino usar estado del backend
            const estadoGuardado = savedConfig.carpetas?.[carpeta.id];
            carpetasActualizadas[carpeta.id] = {
              id: carpeta.id,
              nombre: carpeta.nombre,
              color: carpeta.color,
              visible: estadoGuardado?.visible !== undefined ? estadoGuardado.visible : carpeta.visible
            };
          });

          // Actualizar grupos preservando estado de visibilidad
          const gruposActualizados: Record<number, Grupo> = {};
          datos.grupos.forEach(grupo => {
            // Usar estado guardado si existe, sino usar estado del backend
            const estadoGuardado = savedConfig.grupos?.[grupo.id];
            gruposActualizados[grupo.id] = {
              id: grupo.id,
              nombre: grupo.nombre,
              color: grupo.color,
              categoriaIds: grupo.categoriaIds || [],
              visible: estadoGuardado?.visible !== undefined ? estadoGuardado.visible : grupo.visible,
              carpetaId: grupo.carpetaId || undefined
            };
          });

          setVsConfig(prev => ({
            ...prev,
            carpetas: carpetasActualizadas,
            grupos: gruposActualizados,
            filtros: {
              ...prev.filtros,
              // Preservar selecciones previas si existen
              gruposSeleccionados: savedConfig.filtros?.gruposSeleccionados || [],
              carpetasSeleccionadas: savedConfig.filtros?.carpetasSeleccionadas || []
            }
          }));

          console.log('Datos cargados desde backend:', { carpetas: carpetasActualizadas, grupos: gruposActualizados });
          console.log('Cantidad de carpetas:', Object.keys(carpetasActualizadas).length);
          console.log('Cantidad de grupos:', Object.keys(gruposActualizados).length);
        } catch (error) {
          console.error('Error al cargar datos iniciales:', error);
        }
      };

      cargarDatosIniciales();
    }, []);

    // Sincronizar selección automática con grupos visibles después de cargar datos
    useEffect(() => {
      // Solo ejecutar si hay grupos cargados y no es la configuración inicial vacía
      const totalGrupos = Object.keys(vsConfig.grupos).length;
      if (totalGrupos === 0) return;

      console.log('🔄 Sincronizando selección automática...');

      const gruposVisibles = Object.entries(vsConfig.grupos).filter(([id, grupo]) => {
        // El grupo debe estar visible
        if (grupo.visible === false) return false;

        // Si el grupo está en una carpeta, la carpeta también debe estar visible
        if (grupo.carpetaId) {
          const carpeta = vsConfig.carpetas[grupo.carpetaId];
          if (carpeta && carpeta.visible === false) return false;
        }

        return true;
      });

      const idsGruposVisibles = gruposVisibles.map(([id]) => +id);
      const gruposSeleccionadosActuales = vsConfig.filtros.gruposSeleccionados;

      // Verificar si hay grupos visibles que no están seleccionados
      const gruposVisiblesNoSeleccionados = idsGruposVisibles.filter(id =>
        !gruposSeleccionadosActuales.includes(id)
      );

      if (gruposVisiblesNoSeleccionados.length > 0) {
        console.log(`✅ Auto-seleccionando ${gruposVisiblesNoSeleccionados.length} grupos visibles:`, gruposVisiblesNoSeleccionados);

        setVsConfig(prev => ({
          ...prev,
          filtros: {
            ...prev.filtros,
            gruposSeleccionados: [...prev.filtros.gruposSeleccionados, ...gruposVisiblesNoSeleccionados]
          }
        }));
      }
    }, [vsConfig.grupos, vsConfig.carpetas]); // Se ejecuta cuando cambian grupos o carpetas

    // Actualizar filtros desde formulario
    const updateFiltrosFromForm = () => {
      // Esta función se llamará cuando sea necesario sincronizar filtros del UI
      // Por ahora, los filtros ya se actualizan automáticamente con onChange
    };

    // Guardar configuración en localStorage con validación robusta
    const saveConfig = () => {
      try {
        // Actualizar filtros con valores actuales del formulario
        updateFiltrosFromForm();

        // Crear configuración completa y validada - Fix #7: versión y normalización
        const config: VSConfig = {
          // Filtros básicos
          filtros: {
            // categorias removido - usar categoriaIds en su lugar
            tipo: normalizeTipo(vsConfig.filtros.tipo as any), // 👈 Fix #7: Normalizar tipo
            fechaDesde: vsConfig.filtros.fechaDesde || '',
            fechaHasta: vsConfig.filtros.fechaHasta || '',
            chartType: vsConfig.filtros.chartType || 'bar',
            gruposSeleccionados: Array.isArray(vsConfig.filtros.gruposSeleccionados) ? vsConfig.filtros.gruposSeleccionados : [],
            carpetasSeleccionadas: Array.isArray(vsConfig.filtros.carpetasSeleccionadas) ? vsConfig.filtros.carpetasSeleccionadas : [],
          },
          // Metadatos - Fix #7: versión correcta
          version: '2',

          // Configuraciones de colores - Fix #2: usar IDs
          colores: vsConfig.colores || {},

          // Estructuras de organización
          grupos: vsConfig.grupos || {},
          carpetas: vsConfig.carpetas || {},
        };

        // Guardar en localStorage con validación
        localStorage.setItem('vsCategoriasConfig', JSON.stringify(config));

        // Notificar éxito
        toast.success('✅ Configuración guardada correctamente');
        console.log('Configuración guardada:', config);

      } catch (error) {
        console.error('Error al guardar configuración:', error);
        toast.error('❌ Error al guardar configuración');
      }
    };

    // Aplicar configuración guardada - Fix #7: normalización al cargar
    const applySavedConfig = () => {
      try {
        // Cargar configuración desde localStorage
        const savedConfigStr = localStorage.getItem('vsCategoriasConfig');
        if (!savedConfigStr) {
          console.log('No hay configuración guardada para VS de Categorías');
          return;
        }

        const savedConfig = JSON.parse(savedConfigStr);
        console.log('Configuración cargada:', savedConfig);

        // Migrar si es necesario
        const v2 = savedConfig.version === '2' ? savedConfig : migrateConfigV1toV2(savedConfig);

        // Fix #7: Normalizar tipo al cargar
        if (v2.filtros?.tipo) {
          v2.filtros.tipo = normalizeTipo(v2.filtros.tipo as any);
        }

        console.log('Configuración migrada:', v2);

        // Aplicar configuración migrada
        setVsConfig(prev => ({ ...prev, ...v2 }));

        // Notificar éxito
        toast.success('✅ Configuración cargada correctamente');
        console.log('Configuración aplicada exitosamente');

      } catch (error) {
        console.error('Error al cargar configuración:', error);
        toast.error('⚠️ Error al cargar configuración guardada');

        // En caso de error, inicializar con valores por defecto
        setVsConfig(prev => ({
          ...prev,
          filtros: {
            ...prev.filtros,
            gruposSeleccionados: [],
            carpetasSeleccionadas: [],
          }
        }));
      }
    };

    // Generar colores
    const generateColors = (count: number) => {
      return coloresBase.slice(0, count);
    };

    // Crear gráfico responsivo
    const createResponsiveChart = (canvasId: string, chartConfig: any) => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return null;

      // Destruir chart existente
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Configuración base
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 10,
            right: 10
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            bodySpacing: 6
          }
        }
      };

      chartConfig.options = { ...defaultOptions, ...chartConfig.options };

      const chart = new Chart(canvas, chartConfig);
      chartRef.current = chart;
      return chart;
    };

        // Función para obtener datos filtrados desde el backend
    const getDatosFiltrados = async (): Promise<DatosGrafico> => {
      console.log('🔍 Obteniendo datos filtrados para VS Categorías...');
      console.log('📊 Configuración actual:', vsConfig);

      try {
        // Usar query builder para construir el payload
        const effGroups = selectEffectiveGroupIds(vsConfig);
        console.log('👥 Grupos efectivos:', effGroups);

        const payload = effGroups.length
          ? {
            tipo: normalizeTipo(vsConfig.filtros.tipo as any),
            fechaDesde: vsConfig.filtros.fechaDesde,
            fechaHasta: vsConfig.filtros.fechaHasta,
              groupIds: effGroups
        }
          : {
            tipo: normalizeTipo(vsConfig.filtros.tipo as any),
          fechaDesde: vsConfig.filtros.fechaDesde,
              fechaHasta: vsConfig.filtros.fechaHasta
            };

        console.log('📤 Payload para backend:', payload);

        // Llamar al backend con el payload
        const resultado = await VSCategoriasService.getDatosParaGrafico(payload);
        console.log('📥 Respuesta del backend:', resultado);

        // Guardar metadatos de segmento para cada label
        const segmentMeta = new Map<string, { kind: 'group'|'category', id: number }>();

        if (resultado.esGrupo && resultado.grupos) {
          for (const g of resultado.grupos) {
            segmentMeta.set(g.nombre, { kind: 'group', id: g.id });
          }
        } else {
          for (const label of Object.keys(resultado.datos)) {
            const id = catIdByName.get(label);
            if (id) {
              segmentMeta.set(label, { kind: 'category', id });
            }
          }
        }

        // Guardar metadatos para uso en clicks
        chartMetaRef.current = Array.from(segmentMeta.entries()).map(([label, meta]) => ({
          kind: meta.kind,
          id: meta.id,
          label,
          color: resultado.esGrupo ?
            vsConfig.grupos[meta.id]?.color || coloresBase[0] :
            vsConfig.colores[meta.id] || coloresBase[0],
          value: resultado.datos[label] || 0
        }));

        return resultado;

      } catch (error) {
        console.error('❌ Error al obtener datos filtrados:', error);
        toast.error('Error al obtener datos para el gráfico');
        return {
          datos: {},
          esGrupo: false
        };
      }
    };

    // Renderizar gráfico principal con lógica corregida
    const renderChart = async () => {
      if (!transacciones || transacciones.length === 0) {
        console.log('No hay transacciones disponibles');
        return;
      }

      // Obtener datos filtrados desde el backend
      const resultado = await getDatosFiltrados();
      const labels = Object.keys(resultado.datos);
      const values = Object.values(resultado.datos);
      const total = values.reduce((a, b) => a + b, 0) || 1;

      console.log('Datos filtrados:', resultado);
      console.log('Labels:', labels);
      console.log('Values:', values);
      console.log('Total:', total);

      if (labels.length === 0 || values.every(v => v === 0)) {
        const container = document.getElementById('vsCategoriasContainer');
        if (container) {
          // Quitar canvas si existe, pero no borrar el resto del contenido
          const existingCanvas = container.querySelector('canvas');
          if (existingCanvas) existingCanvas.remove();

          // Crear/actualizar placeholder interno de "sin datos"
          let noData = container.querySelector('.vs-no-data');
          if (!noData) {
            noData = document.createElement('div');
            noData.className = 'vs-no-data text-center text-gray-400 py-8';
            container.appendChild(noData);
          }
          noData.textContent = 'No hay datos para mostrar para las categorías seleccionadas.';
        }
        return; // ✅ sin afectar otros elementos (botonera Gestionar permanece)
      }

      // Recrear el canvas si fue removido y limpiar placeholder de "sin datos"
      const container = document.getElementById('vsCategoriasContainer');
      if (container) {
        const noData = container.querySelector('.vs-no-data');
        if (noData) noData.remove();
        const existingCanvas = container.querySelector('canvas');
        if (!existingCanvas) {
          const newCanvas = document.createElement('canvas');
          newCanvas.id = 'vsCategoriasChart';
          newCanvas.height = 300;
          container.prepend(newCanvas);
        }
      }

      const canvas = document.getElementById('vsCategoriasChart') as HTMLCanvasElement;
      if (!canvas) return;

      // Destruir chart existente
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Determinar colores
      let backgroundColor: string[], borderColor: string[];
      if (resultado.esGrupo) {
        // Modo grupos: usar colores específicos de cada grupo
        backgroundColor = labels.map(label => {
          const grupo = resultado.grupos?.find(g => g.nombre === label);
          return grupo ? grupo.color : coloresBase[0];
        });
        borderColor = backgroundColor;
      } else {
        // Modo categorías por defecto: asignar colores distintos automáticamente
        backgroundColor = labels.map((catLabel, index) => {
          const catId = catIdByName.get(catLabel);
          const existing = catId ? vsConfig.colores[catId] : undefined;
          if (existing) return existing;

          const colorAsignado = coloresBase[index % coloresBase.length];
          if (catId) {
          setVsConfig(prev => ({
            ...prev,
              colores: { ...prev.colores, [catId]: colorAsignado }
          }));
          }

          console.log(`🎨 Color auto-asignado a categoría ${catLabel} (ID: ${catId}): ${colorAsignado}`);
          return colorAsignado;
        });
        borderColor = backgroundColor;
      }

      // Crear leyenda externa antes del gráfico
      if (container) {
        // Eliminar CUALQUIER leyenda previa
        const existingLegends = container.querySelectorAll('.vs-categorias-legend');
        existingLegends.forEach((el) => el.remove());

        // Crear elementos para la leyenda
        const legendItems = labels.map((label, index) => ({
          label,
          value: values[index] || 0,
          color: backgroundColor[index] || coloresBase[0]
        }));

        const legendContainer = document.createElement('div');
        legendContainer.className = 'vs-categorias-legend'; // ✅ clave para no duplicar
        container.appendChild(legendContainer);
        const root = createRoot(legendContainer);
        root.render(
          <Legend
            items={legendItems}
            onClick={(label) => {
              const meta = chartMetaRef.current.find(m => m.label === label);
              if (meta) {
                handleSegmentClick(meta);
              }
            }}
          />
        );
      }

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2,
        plugins: {
          legend: { display: false }, // Siempre usar leyenda externa
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: function(context: any) {
                const valor = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                const porcentaje = ((valor / total) * 100).toFixed(1) + '%';
                return `${context.label}: $${valor.toLocaleString()} (${porcentaje})`;
              }
            }
          },

        },
        scales: ['pie', 'doughnut'].includes(vsConfig.filtros.chartType) ? {} : {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      };

      const chart = new Chart(canvas, {
        type: vsConfig.filtros.chartType as any,
        data: {
          labels,
          datasets: [{
            label: 'Monto',
            data: values,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: ['pie', 'doughnut'].includes(vsConfig.filtros.chartType) ? 3 : 2,
            fill: vsConfig.filtros.chartType === 'bar',
            tension: 0.3
          }]
        },
        options: chartOptions
      });

      chartRef.current = chart;

      // Ajuste asíncrono de tamaño del gráfico tras montar
      requestAnimationFrame(() => {
        const current = chartRef.current;
        try {
          if (current && (current as any).canvas && (current as any).ctx) {
            current.resize();
          }
        } catch (e) {
          console.warn('Skip resize: chart not ready/detached');
        }
      });
    };

    // Componente Legend en React
    const Legend = ({ items, onClick }: {
      items: { label: string; value: number; color: string }[];
      onClick: (label: string) => void
    }) => {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {items.map((item, index) => (
                <button
              key={index}
              onClick={() => {
                const meta = chartMetaRef.current.find(m => m.label === item.label);
                if (meta) handleSegmentClick(meta); // 👈 Fix #8: usar meta
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-sm"
                >
                  <div
                className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
              <span className="text-gray-700">{item.label}</span>
              <span className="text-gray-500 font-normal">
                ${item.value.toLocaleString()}
              </span>
                </button>
          ))}
        </div>
      );
    };

    // Renderizar chips de grupos y carpetas
    const renderGruposYCarpetas = () => {
      const carpetasArray = Object.entries(vsConfig.carpetas);
      const gruposSinCarpeta = Object.entries(vsConfig.grupos).filter(([id, grupo]) => !grupo.carpetaId);
      const hayContenido = carpetasArray.length > 0 || gruposSinCarpeta.length > 0;

      if (!hayContenido) {
        return (
          <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FolderOpen className="mx-auto mb-3 text-4xl text-gray-300" size={48} />
            <div className="text-lg font-medium mb-2">No hay grupos ni carpetas creados</div>
            <div className="text-sm">Organiza tus métricas creando carpetas y grupos</div>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Renderizar carpetas */}
          {carpetasArray.map(([carpetaId, carpeta]) => (
            <CarpetaCard key={carpetaId} carpetaId={+carpetaId} carpeta={carpeta} />
          ))}

          {/* Renderizar grupos sin carpeta */}
          {gruposSinCarpeta.map(([grupoId, grupo]) => (
            <GrupoCard key={grupoId} grupoId={+grupoId} grupo={grupo} />
          ))}
        </div>
      );
    };

    // Componente Carpeta Card
    const CarpetaCard = ({ carpetaId, carpeta }: { carpetaId: number; carpeta: Carpeta }) => {
      const gruposEnCarpeta = Object.entries(vsConfig.grupos).filter(([id, grupo]) => grupo.carpetaId === carpetaId);

      return (
        <div className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
          carpeta.visible ? 'border-gray-200' : 'border-gray-100 opacity-60'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded" style={{ background: carpeta.color }}></div>
                <div>
                  <div className="font-semibold text-gray-900">{carpeta.nombre}</div>
                  <div className="text-xs text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FolderOpen className="mr-1" size={12} />
                      {gruposEnCarpeta.length} grupos
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleCarpetaVisibility(carpetaId)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={carpeta.visible ? 'Ocultar carpeta' : 'Mostrar carpeta'}
              >
                {carpeta.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            {carpeta.visible && gruposEnCarpeta.length > 0 && (
              <div className="space-y-2">
                {gruposEnCarpeta.map(([grupoId, grupo]) => (
                  <GrupoEnCarpeta key={grupoId} grupoId={+grupoId} grupo={grupo} />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };

    // Componente Grupo en Carpeta
    const GrupoEnCarpeta = ({ grupoId, grupo }: { grupoId: number; grupo: GrupoNorm }) => {
      const isSelected = vsConfig.filtros.gruposSeleccionados.includes(grupoId);
      const count = (grupo.categoriaIds || []).length;

      return (
        <div
          className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 hover:shadow-sm ${
            isSelected ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          } ${grupo.visible ? '' : 'opacity-50'}`}
          onClick={() => toggleGrupoSelection(grupoId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: grupo.color }}></div>
              <span className="text-sm font-medium text-gray-700 truncate">{grupo.nombre}</span>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                {count}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGrupoVisibility(grupoId);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              title={grupo.visible ? 'Ocultar grupo' : 'Mostrar grupo'}
            >
              {grupo.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </div>
        </div>
      );
    };

    // Componente Grupo Card
    const GrupoCard = ({ grupoId, grupo }: { grupoId: number; grupo: GrupoNorm }) => {
      const isSelected = vsConfig.filtros.gruposSeleccionados.includes(grupoId);
      const count = (grupo.categoriaIds || []).length;

      return (
        <div
          className={`cursor-pointer bg-white rounded-xl shadow-sm border-2 p-4 transition-all duration-200 hover:shadow-md ${
            isSelected ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200' : 'border-gray-200 hover:border-gray-300'
          } ${grupo.visible ? '' : 'opacity-50'}`}
          onClick={() => toggleGrupoSelection(grupoId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: grupo.color }}></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{grupo.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    <Tags className="mr-1" size={10} />
                    {count} categorías
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGrupoVisibility(grupoId);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={grupo.visible ? 'Ocultar grupo' : 'Mostrar grupo'}
            >
              {grupo.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>
      );
    };

        // Función de debug mejorada
    const debugVSCategorias = () => {
      console.log('🔍 DEBUG VS CATEGORÍAS REACT');
      console.log('=============================');
      console.log('📊 Estado vsConfig:', vsConfig);
      console.log('👥 Grupos:', vsConfig.grupos);
      console.log('📁 Carpetas:', vsConfig.carpetas);
      console.log('⚙️ Filtros:', vsConfig.filtros);
      console.log('🎨 Colores:', vsConfig.colores);
      console.log('📈 Transacciones:', transacciones.length);
      console.log('📋 Categorías:', categorias.length);
      console.log('=============================');

      // Analizar grupos visibles
      const gruposVisibles = Object.entries(vsConfig.grupos).filter(([id, grupo]) => {
        if (grupo.visible === false) {
          console.log(`❌ Grupo ${grupo.nombre} no visible`);
          return false;
        }
        if (grupo.carpetaId) {
          const carpeta = vsConfig.carpetas[grupo.carpetaId];
          if (carpeta && carpeta.visible === false) {
            console.log(`❌ Grupo ${grupo.nombre} en carpeta no visible`);
            return false;
          }
        }
        console.log(`✅ Grupo ${grupo.nombre} es visible`);
        return true;
      });

      // Analizar lógica de selección
      const gruposSeleccionados = vsConfig.filtros.gruposSeleccionados;
      const gruposSeleccionadosVisibles = gruposSeleccionados.filter(id =>
        gruposVisibles.some(([grupoId]) => +grupoId === id)
      );

      let gruposQueSeUsaran: number[] = [];
      if (gruposVisibles.length > 0) {
        if (gruposSeleccionados.length > 0) {
          gruposQueSeUsaran = gruposSeleccionadosVisibles;
          console.log(`🎯 LÓGICA: Hay selección específica - usando grupos seleccionados visibles`);
        } else {
          gruposQueSeUsaran = gruposVisibles.map(([id]) => +id);
          console.log(`🌟 LÓGICA: Sin selección específica - usando TODOS los grupos visibles`);
        }
      }

            console.log(`👥 Total grupos visibles: ${gruposVisibles.length}`);
      console.log(`🎯 Grupos seleccionados: ${gruposSeleccionados.length}`);
      console.log(`✅ Grupos seleccionados visibles: ${gruposSeleccionadosVisibles.length}`);
      console.log(`📊 GRUPOS QUE SE USARÁN EN EL GRÁFICO: ${gruposQueSeUsaran.length}`, gruposQueSeUsaran);

      // Análisis de sincronización ojito-selección
      const gruposVisiblesNoSeleccionados = gruposVisibles.filter(([id]) =>
        !gruposSeleccionados.includes(+id)
      );
      const gruposSeleccionadosNoVisibles = gruposSeleccionados.filter(id =>
        !gruposVisibles.some(([grupoId]) => +grupoId === id)
      );

      console.log('🔄 ANÁLISIS DE SINCRONIZACIÓN BIDIRECCIONAL:');
      console.log(`⚠️ Grupos visibles NO seleccionados: ${gruposVisiblesNoSeleccionados.length}`, gruposVisiblesNoSeleccionados.map(([id, g]) => g.nombre));
      console.log(`⚠️ Grupos seleccionados NO visibles: ${gruposSeleccionadosNoVisibles.length}`, gruposSeleccionadosNoVisibles);

      const sincronizacionPerfecta = gruposVisiblesNoSeleccionados.length === 0 && gruposSeleccionadosNoVisibles.length === 0;
      console.log(`🎯 SINCRONIZACIÓN BIDIRECCIONAL: ${sincronizacionPerfecta ? '✅ PERFECTA' : '⚠️ NECESITA AJUSTE'}`);

      if (!sincronizacionPerfecta) {
        console.log('💡 SUGERENCIA: Para lograr sincronización perfecta:');
        if (gruposVisiblesNoSeleccionados.length > 0) {
          console.log('  - Selecciona los grupos visibles no seleccionados');
        }
        if (gruposSeleccionadosNoVisibles.length > 0) {
          console.log('  - Activa el ojito de los grupos seleccionados no visibles');
        }
      }

      return {
        vsConfig,
        gruposVisibles,
        gruposSeleccionados,
        gruposSeleccionadosVisibles,
        gruposQueSeUsaran,
        gruposVisiblesNoSeleccionados,
        gruposSeleccionadosNoVisibles,
        carpetasVisibles: Object.entries(vsConfig.carpetas).filter(([id, c]) => c.visible !== false),
        logicaActual: gruposSeleccionados.length > 0 ? 'Selección específica' : 'Todos los visibles',
        sincronizacionPerfecta
      };
    };

    // Exponer función de debug globalmente
    useEffect(() => {
      (window as any).debugVSCategoriasReact = debugVSCategorias;
    }, [vsConfig, transacciones, categorias]);

    // Funciones de toggle mejoradas
    const toggleCarpetaVisibility = async (carpetaId: number) => {
      console.log(`🔄 Toggle carpeta ${carpetaId}`);

      setVsConfig(prev => {
        const nuevaVisibilidad = !prev.carpetas[carpetaId].visible;
        console.log(`📁 Carpeta ${prev.carpetas[carpetaId].nombre}: ${prev.carpetas[carpetaId].visible} → ${nuevaVisibilidad}`);

        const newConfig = {
        ...prev,
        carpetas: {
          ...prev.carpetas,
          [carpetaId]: {
            ...prev.carpetas[carpetaId],
              visible: nuevaVisibilidad
            }
          }
        };

        // Sincronizar selección con visibilidad de carpeta
        const gruposEnCarpeta = Object.entries(prev.grupos)
          .filter(([id, grupo]) => grupo.carpetaId === carpetaId)
          .map(([id]) => parseInt(id));

        if (nuevaVisibilidad) {
          // Carpeta se activa: seleccionar automáticamente todos sus grupos
          const gruposASeleccionar = gruposEnCarpeta.filter(id =>
            !newConfig.filtros.gruposSeleccionados.includes(id)
          );

          newConfig.filtros = {
            ...newConfig.filtros,
            gruposSeleccionados: [...newConfig.filtros.gruposSeleccionados, ...gruposASeleccionar]
          };

          console.log(`✅ Grupos seleccionados de carpeta activada:`, gruposASeleccionar);
        } else {
          // Carpeta se desactiva: deseleccionar todos sus grupos
          newConfig.filtros = {
            ...newConfig.filtros,
            gruposSeleccionados: newConfig.filtros.gruposSeleccionados.filter(
              id => !gruposEnCarpeta.includes(id)
            )
          };

          console.log(`🚫 Grupos deseleccionados de carpeta desactivada:`, gruposEnCarpeta);
        }

        return newConfig;
      });

      // Actualizar backend
      try {
        await VSCategoriasService.updateCarpeta(carpetaId, {
          visible: !vsConfig.carpetas[carpetaId].visible
        });
        console.log(`✅ Carpeta ${carpetaId} actualizada en backend`);
      } catch (error) {
        console.error(`❌ Error actualizando carpeta ${carpetaId}:`, error);
      }
    };

    const toggleGrupoVisibility = async (grupoId: number) => {
      console.log(`🔄 Toggle grupo ${grupoId}`);

      setVsConfig(prev => {
        const nuevaVisibilidad = !prev.grupos[grupoId].visible;
        console.log(`👥 Grupo ${prev.grupos[grupoId].nombre}: ${prev.grupos[grupoId].visible} → ${nuevaVisibilidad}`);

        const newConfig = {
        ...prev,
        grupos: {
          ...prev.grupos,
          [grupoId]: {
            ...prev.grupos[grupoId],
              visible: nuevaVisibilidad
            }
          }
        };

        // Sincronizar selección con visibilidad de grupo
        if (nuevaVisibilidad) {
          // Grupo se activa: seleccionarlo automáticamente si no está seleccionado
          if (!newConfig.filtros.gruposSeleccionados.includes(grupoId)) {
            newConfig.filtros = {
              ...newConfig.filtros,
              gruposSeleccionados: [...newConfig.filtros.gruposSeleccionados, grupoId]
            };
            console.log(`✅ Grupo ${grupoId} seleccionado automáticamente al activar ojito`);
          }
        } else {
          // Grupo se desactiva: deseleccionarlo automáticamente
          newConfig.filtros = {
            ...newConfig.filtros,
            gruposSeleccionados: newConfig.filtros.gruposSeleccionados.filter(
              id => id !== grupoId
            )
          };
          console.log(`🚫 Grupo ${grupoId} deseleccionado automáticamente al desactivar ojito`);
        }

        return newConfig;
      });

      // Actualizar backend
      try {
        await VSCategoriasService.updateGrupo(grupoId, {
          visible: !vsConfig.grupos[grupoId].visible
        });
        console.log(`✅ Grupo ${grupoId} actualizado en backend`);
      } catch (error) {
        console.error(`❌ Error actualizando grupo ${grupoId}:`, error);
      }
    };

    const toggleGrupoSelection = async (grupoId: number) => {
      console.log(`🎯 Toggle selección grupo ${grupoId}`);

      setVsConfig(prev => {
        const gruposSeleccionados = [...prev.filtros.gruposSeleccionados];
        const index = gruposSeleccionados.indexOf(grupoId);
        const estaSeleccionado = index !== -1;

        let newConfig = { ...prev };

        if (!estaSeleccionado) {
          // Seleccionar grupo: también activar ojito si no está visible
          gruposSeleccionados.push(grupoId);

          if (prev.grupos[grupoId] && prev.grupos[grupoId].visible === false) {
            newConfig.grupos = {
              ...prev.grupos,
              [grupoId]: {
                ...prev.grupos[grupoId],
                visible: true
              }
            };
            console.log(`👁️ Grupo ${grupoId} activado automáticamente al seleccionar`);

            // Actualizar backend de forma asíncrona
            VSCategoriasService.updateGrupo(grupoId, { visible: true })
              .then(() => console.log(`✅ Grupo ${grupoId} actualizado en backend (visible=true)`))
              .catch(error => console.error(`❌ Error actualizando grupo ${grupoId}:`, error));
          }
        } else {
          // Deseleccionar grupo: también desactivar ojito
          gruposSeleccionados.splice(index, 1);

          if (prev.grupos[grupoId] && prev.grupos[grupoId].visible !== false) {
            newConfig.grupos = {
              ...prev.grupos,
              [grupoId]: {
                ...prev.grupos[grupoId],
                visible: false
              }
            };
            console.log(`👁️‍🗨️ Grupo ${grupoId} desactivado automáticamente al deseleccionar`);

            // Actualizar backend de forma asíncrona
            VSCategoriasService.updateGrupo(grupoId, { visible: false })
              .then(() => console.log(`✅ Grupo ${grupoId} actualizado en backend (visible=false)`))
              .catch(error => console.error(`❌ Error actualizando grupo ${grupoId}:`, error));
          }
        }

        newConfig.filtros = {
          ...newConfig.filtros,
          gruposSeleccionados
        };

        console.log(`🎯 Grupo ${grupoId}: ${estaSeleccionado ? 'deseleccionado' : 'seleccionado'}`);
        return newConfig;
      });
    };

        // Función para obtener el siguiente color disponible
    const getNextAvailableColor = (tipoElemento: 'carpeta' | 'grupo' = 'grupo') => {
      // Obtener colores ya en uso
      const coloresEnUso = new Set([
        ...Object.values(vsConfig.carpetas).map(c => c.color),
        ...Object.values(vsConfig.grupos).map(g => g.color),
        ...Object.values(vsConfig.colores)
      ]);

      // Encontrar el primer color no usado
      const colorDisponible = coloresBase.find(color => !coloresEnUso.has(color));

      // Si todos están en uso, usar uno aleatorio de la paleta
      const colorFinal = colorDisponible || coloresBase[Math.floor(Math.random() * coloresBase.length)];

      console.log(`🎨 Color sugerido para ${tipoElemento}: ${colorFinal} (colores en uso: ${coloresEnUso.size})`);
      return colorFinal;
    };

        // Crear nueva carpeta
    const crearCarpeta = async (nombre: string, color?: string) => {
      try {
        // Si no se proporciona color, asignar automáticamente
        const colorFinal = color || getNextAvailableColor('carpeta');

        const nuevaCarpeta = await VSCategoriasService.createCarpeta({
          nombre,
          color: colorFinal,
          visible: true
        });

        console.log('Carpeta creada:', nuevaCarpeta);

        setVsConfig(prev => ({
          ...prev,
          carpetas: {
            ...prev.carpetas,
            [nuevaCarpeta.id]: {
              id: nuevaCarpeta.id,
              nombre: nuevaCarpeta.nombre,
              color: nuevaCarpeta.color,
              visible: nuevaCarpeta.visible
            }
          }
        }));

        setShowCarpetasModal(false);
        toast.success('Carpeta creada exitosamente');
      } catch (error) {
        console.error('Error al crear carpeta:', error);
        toast.error('Error al crear carpeta');
      }
    };

    // Crear nuevo grupo - Fix #5: enviar/guardar categoriaIds
        const crearGrupo = async (nombre: string, color: string, categoriasSeleccionadas: string[], carpetaId?: string) => {
      try {
        // Si no se proporciona color, asignar automáticamente
        const colorFinal = color || getNextAvailableColor('grupo');

        // Obtener IDs de categorías - Fix #5: usar IDs
        const categoriasIds = categorias
          .filter(cat => categoriasSeleccionadas.includes(cat.nombre))
          .map(cat => cat.id);

        console.log('Creando grupo con categorías:', categoriasIds);
        console.log('Color asignado al grupo:', colorFinal);

        const nuevoGrupo = await VSCategoriasService.createGrupo({
          nombre,
          color: colorFinal,
          categorias: categoriasIds,
          carpetaId: carpetaId ? +carpetaId : undefined,
          visible: true
        });

        console.log('Grupo creado:', nuevoGrupo);

        setVsConfig(prev => ({
          ...prev,
          grupos: {
            ...prev.grupos,
            [nuevoGrupo.id]: {
              id: nuevoGrupo.id,
              nombre: nuevoGrupo.nombre,
              color: nuevoGrupo.color,
              visible: nuevoGrupo.visible,
              carpetaId: nuevoGrupo.carpetaId,
              categoriaIds: categoriasIds,              // 👈 Fix #5: fuente de verdad
              categoriaNames: categoriasSeleccionadas,  // 👈 Fix #5: opcional para UI
            }
          },
          filtros: {
            ...prev.filtros,
            gruposSeleccionados: prev.filtros.gruposSeleccionados.includes(nuevoGrupo.id)
              ? prev.filtros.gruposSeleccionados
              : [...prev.filtros.gruposSeleccionados, nuevoGrupo.id]
          }
        }));

        setShowGroupsModal(false);
        toast.success('Grupo creado exitosamente');
      } catch (error) {
        console.error('Error al crear grupo:', error);
        toast.error('Error al crear grupo');
      }
    };

    // Agregar estilos CSS dinámicos para VS Categorías
    useEffect(() => {
      if (!document.getElementById('vs-categorias-styles')) {
        const style = document.createElement('style');
        style.id = 'vs-categorias-styles';
        style.textContent = `
          .vs-grupos-container {
            display: grid;
            gap: 1rem;
          }

          .vs-grupo-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 1rem;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .vs-grupo-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .vs-grupo-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.75rem;
          }

          .vs-grupo-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
            min-width: 0;
          }

          .vs-grupo-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .vs-grupo-name {
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }

          .vs-grupo-meta {
            font-size: 0.75rem;
            color: #6b7280;
            margin: 0.25rem 0 0 0;
          }

          .vs-grupo-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .vs-categoria-tag {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.5rem;
            background: #f3f4f6;
            color: #374151;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .vs-empty-state {
            text-align: center;
            padding: 3rem 1rem;
            background: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 12px;
            color: #6b7280;
          }

          .vs-empty-icon {
            font-size: 3rem;
            color: #d1d5db;
            margin-bottom: 1rem;
          }

          .vs-empty-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
          }

          .vs-empty-description {
            font-size: 0.875rem;
            color: #6b7280;
          }

          .vs-animate-in {
            animation: slideInUp 0.3s ease-out;
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .btn-action {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            font-size: 0.875rem;
            border: 2px solid transparent;
            transition: all 0.2s ease;
            cursor: pointer;
            text-decoration: none;
            min-height: 2.75rem;
          }

          .btn-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .btn-action:active {
            transform: translateY(0);
          }

          .vs-management-tab {
            padding: 0.5rem 1rem;
            border-bottom: 2px solid transparent;
            font-weight: 500;
            font-size: 0.875rem;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .vs-management-tab:hover {
            color: #374151;
            border-color: #d1d5db;
          }

          .vs-management-tab.active {
            color: #3b82f6;
            border-color: #3b82f6;
            background: #eff6ff;
          }
        `;
        document.head.appendChild(style);
      }
    }, []);

    // Editar carpeta existente
    const editarCarpeta = (carpetaId: number) => {
      const carpeta = vsConfig.carpetas[carpetaId];
      if (carpeta) {
        setEditingCarpeta({ id: carpetaId, carpeta });
        setShowEditCarpetaModal(true);
      }
    };

    // Guardar edición de carpeta
    const guardarEdicionCarpeta = (nombre: string, color: string) => {
      if (!editingCarpeta) return;

      setVsConfig(prev => ({
        ...prev,
        carpetas: {
          ...prev.carpetas,
          [editingCarpeta.id]: {
            ...prev.carpetas[editingCarpeta.id],
            nombre,
            color
          }
        }
      }));

      setShowEditCarpetaModal(false);
      setEditingCarpeta(null);
      toast.success('Carpeta actualizada exitosamente');
    };

    // Editar grupo existente
    const editarGrupo = (grupoId: number) => {
      const grupo = vsConfig.grupos[grupoId];
      if (grupo) {
        setEditingGrupo({ id: grupoId, grupo });
        setShowEditGrupoModal(true);
      }
    };

    // Guardar edición de grupo (persistente)
    const guardarEdicionGrupo = async (nombre: string, color: string, categoriaIds: number[], carpetaId?: string) => {
      if (!editingGrupo) return;
      try {
        const updated = await VSCategoriasService.updateGrupo(editingGrupo.id, {
          nombre,
          color,
          categorias: categoriaIds,
          carpetaId: carpetaId ? +carpetaId : undefined
        });

      setVsConfig(prev => ({
        ...prev,
        grupos: {
          ...prev.grupos,
          [editingGrupo.id]: {
            ...prev.grupos[editingGrupo.id],
              nombre: updated.nombre,
              color: updated.color,
              carpetaId: updated.carpetaId,
              categoriaIds: categoriaIds,
              categoriaNames: updated.categoriaNames || undefined
          }
        }
      }));

      setShowEditGrupoModal(false);
      setEditingGrupo(null);
      toast.success('Grupo actualizado exitosamente');
      } catch (error) {
        console.error('Error al actualizar grupo:', error);
        toast.error('Error al actualizar grupo');
      }
    };

    // Exportar imagen
    const exportImg = () => {
      if (!chartRef.current) return;
              const url = chartRef.current.toBase64Image('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vs-categorias.png';
      a.click();
      toast.success('Imagen exportada');
    };

    // Exportar CSV - Fix #9: desde lo que está en pantalla
    const exportCsv = () => {
      // Usa chartMetaRef + labels visibles
      if (!chartMetaRef.current || chartMetaRef.current.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const rows = chartMetaRef.current.map(m => [m.label, m.value]);
      const csv = 'Etiqueta,Monto\n' + rows.map(r => `${r[0]},${r[1]}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vs-categorias.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('CSV exportado');
    };

        // Manejar clic en segmento con metadatos
    const handleSegmentClick = async (seg: SegmentMeta) => {
      if (expandedSegment === seg.label) {
        collapseDetails();
        return;
      }

      console.log('🎯 Iniciando obtención de transacciones para:', seg.label);
      setExpandedSegment(seg.label);
      setCurrentTransactions([]); // loading
      setCurrentSegmentInfo({ label: seg.label, value: seg.value, color: seg.color });

      const reqId = ++lastReq.current;
      const data = await fetchSegmentTransactions(seg);
      if (reqId !== lastReq.current) return; // llegó tarde, descarta

      setCurrentTransactions(data);
      setCurrentView('list'); // o recuerda la última vista del usuario
      console.log('✅ handleSegmentClick completado exitosamente');
    };

    // Fix #6: Eliminar funciones legacy por label (ya no necesarias)
    // Las funciones getSegmentTransactions y getSegmentTransactionsLocal por segmentLabel
    // han sido reemplazadas por fetchSegmentTransactions y fallbackLocalTransactions
    // que usan SegmentMeta con IDs en lugar de labels

    // Componente DetailContent reutilizable
    const DetailContent = ({ segmentLabel, segmentValue, segmentColor, transactions, forceView }: {
      segmentLabel: string;
      segmentValue: number;
      segmentColor: string;
      transactions?: Transaccion[];
      forceView?: 'list' | 'chart';
    }) => {
      // Usar transacciones pasadas como parámetro o currentTransactions como fallback
      const transactionsToShow = transactions || currentTransactions;

      console.log('🎨 DetailContent renderizando con:', {
        transactionsLength: transactionsToShow.length,
        isArray: Array.isArray(transactionsToShow),
        currentView,
        usingPassedTransactions: !!transactions
      });

        return (
          <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded" style={{ background: segmentColor }}></div>
                <h3 className="text-xl font-semibold text-gray-800">{segmentLabel}</h3>
                <span className="text-lg font-medium text-gray-600">${segmentValue.toLocaleString()}</span>
            </div>
              <button
                onClick={collapseDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
            </button>
          </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                onClick={() => switchView('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  (forceView || currentView) === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                <List size={16} />
                Lista
              </button>
                <button
                onClick={() => switchView('chart')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  (forceView || currentView) === 'chart'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                <BarChart size={16} />
                Gráficos
              </button>
            </div>

              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar transacciones..."
                    value={detailFilters.search}
                    onChange={(e) => setDetailFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                <div className="flex-1">
                <select
                    value={detailFilters.tipo}
                    onChange={(e) => setDetailFilters(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="INGRESO">Ingresos</option>
                  <option value="GASTO">Gastos</option>
                    <option value="APORTE">Aportes</option>
                </select>
              </div>
                <div className="flex-1">
                <select
                    value={detailFilters.persona}
                    onChange={(e) => setDetailFilters(prev => ({ ...prev, persona: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los usuarios</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id.toString()}>{u.nombre}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

            <div>
            {(() => {
              const viewToUse = forceView || currentView;
              console.log('🎨 Renderizando vista:', viewToUse, 'tipo:', typeof viewToUse);
              console.log('🔍 Comparación viewToUse === "list":', viewToUse === 'list');
              console.log('🔍 Comparación viewToUse === "chart":', viewToUse === 'chart');
              console.log('🔍 forceView:', forceView, 'currentView:', currentView);
              return viewToUse === 'list' ? (
                <DrillDownListView transactions={transactionsToShow} usuarios={usuarios} />
              ) : (
                <DrillDownChartView transactions={transactionsToShow} segmentColor={segmentColor} />
              );
            })()}
          </div>
        </div>
        );
      };

    // Mostrar detalles
    const showDetails = (segmentLabel: string, segmentValue: number, segmentColor: string, transactions?: Transaccion[]) => {
      console.log('🎯 showDetails llamado con:', { segmentLabel, segmentValue, segmentColor, transactionsLength: transactions?.length });

      // Guardar información del segmento actual
      const segmentInfo = {
        label: segmentLabel,
        value: segmentValue,
        color: segmentColor
      };
      setCurrentSegmentInfo(segmentInfo);
      console.log('💾 currentSegmentInfo guardado:', segmentInfo);

      // Actualizar transacciones si se proporcionan
      if (transactions && transactions.length > 0) {
        setCurrentTransactions(transactions);
        console.log('💾 currentTransactions actualizado:', { length: transactions.length });
      }

      // Scroll suave al contenedor de detalles
      if (detailsContainerRef.current) {
      detailsContainerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Obtener transacciones filtradas para drill-down
    const getFilteredTransactions = (): Transaccion[] => {
      let filtered = currentTransactions;

      if (detailFilters.search) {
        filtered = filtered.filter(t =>
          t.concepto.toLowerCase().includes(detailFilters.search.toLowerCase()) ||
          (t.categoria && t.categoria.toLowerCase().includes(detailFilters.search.toLowerCase()))
        );
      }

      if (detailFilters.tipo) {
        filtered = filtered.filter(t => t.tipo === detailFilters.tipo);
      }

      if (detailFilters.persona) {
        filtered = filtered.filter(t => t.personaId?.toString() === detailFilters.persona);
      }

      // Ordenar
      filtered.sort((a, b) => {
        const aValue = a[detailFilters.sortField as keyof Transaccion];
        const bValue = b[detailFilters.sortField as keyof Transaccion];

        if (detailFilters.sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return filtered;
    };

    // Cambiar vista
    const switchView = (viewType: 'list' | 'chart') => {
      console.log('🔄 Cambiando vista a:', viewType);
      console.log('📊 Estado actual currentView antes del cambio:', currentView);
      console.log('📋 currentSegmentInfo actual:', currentSegmentInfo);
      console.log('📊 currentTransactions antes del cambio:', {
        length: currentTransactions.length,
        isArray: Array.isArray(currentTransactions),
        sample: currentTransactions.slice(0, 2)
      });

      setCurrentView(viewType);
      console.log('✅ setCurrentView ejecutado, nuevo valor:', viewType);
    };

    // Renderizar gráficos de detalles
    const renderDetailCharts = () => {
      const filteredTransactions = getFilteredTransactions();

      // Gráfico por usuario
      const usuarioData = analyzeByUser(filteredTransactions);
      if (usuarioData.labels.length > 0) {
        createTransactionDetailChart('usuarioChart', usuarioData);
      }

      // Gráfico temporal
      const temporalData = analyzeByMonth(filteredTransactions);
      if (temporalData.labels.length > 0) {
        createTemporalChart('temporalChart', temporalData);
      }
    };

    // Analizar por usuario
    const analyzeByUser = (transactions: Transaccion[]) => {
      const usuarioMap = new Map<string, number>();

      transactions.forEach(t => {
        const usuario = usuarios.find(u => u.id === (t.usuarioId || t.personaId));
        const nombre = usuario?.nombre || 'Sin usuario';
        usuarioMap.set(nombre, (usuarioMap.get(nombre) || 0) + t.monto);
      });

      const sorted = Array.from(usuarioMap.entries()).sort((a, b) => b[1] - a[1]);

      return {
        labels: sorted.map(([label]) => label),
        data: sorted.map(([, value]) => value),
        colors: generateColors(sorted.length)
      };
    };

    // Analizar por mes
    const analyzeByMonth = (transactions: Transaccion[]) => {
      const monthMap = new Map<string, number>();

      transactions.forEach(t => {
        const date = new Date(t.fecha);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + t.monto);
      });

      const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      return {
        labels: sorted.map(([label]) => {
          const [year, month] = label.split('-');
          return `${month}/${year}`;
        }),
        data: sorted.map(([, value]) => value),
        colors: generateColors(sorted.length)
      };
    };

    // Crear gráfico de transacciones detallado
    const createTransactionDetailChart = (canvasId: string, chartData: any) => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [{
            data: chartData.data,
            backgroundColor: chartData.colors,
            borderColor: chartData.colors,
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context: any) => `$${context.parsed.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => `$${value.toLocaleString()}`
              }
            }
          }
        }
      });
    };

    // Crear gráfico temporal
    const createTemporalChart = (canvasId: string, chartData: any) => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;

      new Chart(canvas, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [{
            data: chartData.data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context: any) => `$${context.parsed.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => `$${value.toLocaleString()}`
              }
            }
          }
        }
      });
    };

    // Colapsar detalles
    const collapseDetails = () => {
      setExpandedSegment(null);
      setCurrentTransactions([]);
      setCurrentSegmentInfo(null);
      if (detailsContainerRef.current) {
        detailsContainerRef.current.innerHTML = '';
      }
    };

    // Ordenar tabla
    const sortTable = (field: string) => {
      setDetailFilters(prev => ({
        ...prev,
        sortField: field,
        sortDirection: prev.sortField === field && prev.sortDirection === 'desc' ? 'asc' : 'desc'
      }));
    };

    // Exponer métodos al ref
    useImperativeHandle(ref, () => ({
      renderChart,
      collapseDetails
    }));

    // Renderizar gráfico cuando cambien los datos
    useEffect(() => {
      const timeoutId = setTimeout(async () => {
        await renderChart();
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [transacciones, vsConfig.filtros.gruposSeleccionados, vsConfig.filtros.chartType, vsConfig.filtros.tipo, vsConfig.filtros.fechaDesde, vsConfig.filtros.fechaHasta]);

    // Exponer funciones globalmente para eventos
    useEffect(() => {
      (window as any).handleSegmentClick = handleSegmentClick;
      (window as any).collapseDetails = collapseDetails;
      (window as any).switchView = switchView;
      (window as any).sortTable = sortTable;
      (window as any).setDetailFilters = setDetailFilters;
      (window as any).crearCarpeta = crearCarpeta;
      (window as any).crearGrupo = crearGrupo;
      (window as any).exportImg = exportImg;
      (window as any).exportCsv = exportCsv;

      return () => {
        delete (window as any).handleSegmentClick;
        delete (window as any).collapseDetails;
        delete (window as any).switchView;
        delete (window as any).sortTable;
        delete (window as any).setDetailFilters;
        delete (window as any).crearCarpeta;
        delete (window as any).crearGrupo;
        delete (window as any).exportImg;
        delete (window as any).exportCsv;
      };
    }, [detailFilters]);

    // Exponer apertura del modal de gestión para debug rápido
    useEffect(() => {
      (window as any).__openManage = () => setShowManageModal(true);
      return () => { delete (window as any).__openManage; };
    }, []);

    return (
      <div className="space-y-6">
        {/* VS Categorías Principal */}
        <div id="vsCategoriasContainer" className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-purple-600" size={24} />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">VS Categorías - Sistema Avanzado</h3>
                <p className="text-sm text-gray-600">Análisis comparativo por grupos y carpetas organizadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={renderChart}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Recargar
              </button>
              <button
                onClick={saveConfig}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Save size={16} />
                Guardar
              </button>
              <button
                onClick={applySavedConfig}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download size={16} />
                Cargar
              </button>
            </div>
          </div>

          {/* Gestión de Grupos y Carpetas */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FolderOpen className="text-blue-600" size={20} />
              Organización de Métricas
            </h4>
            <div className="mb-6">
              {renderGruposYCarpetas()}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 sticky top-0 bg-white z-20 py-3">
              <button
                onClick={() => setShowCarpetasModal(true)}
                className="btn-action bg-blue-600 text-white hover:bg-blue-700"
                title="Crear una nueva carpeta para organizar grupos"
              >
                <FolderPlus size={16} />
                Crear Carpeta
              </button>
              <button
                onClick={() => setShowGroupsModal(true)}
                className="btn-action bg-green-600 text-white hover:bg-green-700"
                title="Crear un nuevo grupo de categorías"
              >
                <Tags size={16} />
                Crear Grupo
              </button>
              <button
                onClick={() => setShowManageModal(true)}
                className="btn-action bg-gray-600 text-white hover:bg-gray-700"
                title="Gestionar carpetas y grupos existentes"
              >
                <Settings size={16} />
                Gestionar
              </button>
              <button
                onClick={saveConfig}
                className="btn-action bg-purple-600 text-white hover:bg-purple-700"
                title="Guardar la configuración actual"
              >
                <Save size={16} />
                Guardar Config
              </button>
              <button
                onClick={() => {
                  const resultado = debugVSCategorias();
                  console.log('🎯 Debug ejecutado desde UI:', resultado);
                  toast.info('🔍 Debug ejecutado - revisa la consola');
                }}
                className="btn-action bg-orange-600 text-white hover:bg-orange-700"
                title="Ejecutar diagnóstico completo del sistema"
              >
                <Search size={16} />
                Debug
              </button>
              <button
                onClick={async () => {
                  console.log('🎨 Regenerando colores con paleta mejorada...');

                  try {
                    // Regenerar colores de carpetas
                    const carpetasActualizadas = { ...vsConfig.carpetas };
                    const carpetasEntries = Object.entries(carpetasActualizadas);

                    for (let i = 0; i < carpetasEntries.length; i++) {
                      const [id, carpeta] = carpetasEntries[i];
                      const nuevoColor = coloresBase[i % coloresBase.length];
                      carpetasActualizadas[+id] = { ...carpeta, color: nuevoColor };

                      await VSCategoriasService.updateCarpeta(+id, { color: nuevoColor });
                      console.log(`✅ Carpeta ${carpeta.nombre}: ${nuevoColor}`);
                    }

                    // Regenerar colores de grupos
                    const gruposActualizados = { ...vsConfig.grupos };
                    const gruposEntries = Object.entries(gruposActualizados);

                    for (let i = 0; i < gruposEntries.length; i++) {
                      const [id, grupo] = gruposEntries[i];
                      const nuevoColor = coloresBase[i % coloresBase.length];
                      gruposActualizados[+id] = { ...grupo, color: nuevoColor };

                      await VSCategoriasService.updateGrupo(+id, { color: nuevoColor });
                      console.log(`✅ Grupo ${grupo.nombre}: ${nuevoColor}`);
                    }

                    // Regenerar colores de categorías
                    const coloresActualizados: Record<string, string> = {};
                    categorias.forEach((cat, index) => {
                      coloresActualizados[cat.nombre] = coloresBase[index % coloresBase.length];
                    });

                    // Actualizar estado local
                    setVsConfig(prev => ({
                      ...prev,
                      carpetas: carpetasActualizadas,
                      grupos: gruposActualizados,
                      colores: coloresActualizados
                    }));

                    toast.success('🎨 Colores regenerados con paleta mejorada');
                    console.log('🎨 Regeneración completada');

                  } catch (error) {
                    console.error('❌ Error regenerando colores:', error);
                    toast.error('❌ Error al regenerar colores');
                  }
                }}
                className="btn-action bg-rose-600 text-white hover:bg-rose-700"
                title="Regenerar colores"
              >
                <Palette size={16} />
                Regenerar Colores
              </button>
            </div>
          </div>

          {/* Filtros Avanzados */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="text-blue-600" size={20} />
              </div>
              🎛️ Filtros de Análisis Avanzado
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  Tipo de Transacción
                </label>
                <select
                  value={vsConfig.filtros.tipo}
                  onChange={(e) => setVsConfig(prev => ({
                    ...prev,
                    filtros: { ...prev.filtros, tipo: e.target.value as TipoTx }
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                >
                  <option value="GASTO">💸 Gastos</option>
                  <option value="INGRESO">💰 Ingresos</option>
                  <option value="APORTE">🤝 Aportes</option>
                  <option value="">📊 Todos</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={vsConfig.filtros.fechaDesde}
                  onChange={(e) => setVsConfig(prev => ({
                    ...prev,
                    filtros: { ...prev.filtros, fechaDesde: e.target.value }
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={vsConfig.filtros.fechaHasta}
                  onChange={(e) => setVsConfig(prev => ({
                    ...prev,
                    filtros: { ...prev.filtros, fechaHasta: e.target.value }
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-600" />
                  Tipo de Gráfica
                </label>
                <select
                  value={vsConfig.filtros.chartType}
                  onChange={(e) => setVsConfig(prev => ({
                    ...prev,
                    filtros: { ...prev.filtros, chartType: e.target.value }
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                >
                  <option value="bar">📊 Barras</option>
                  <option value="line">📈 Líneas</option>
                  <option value="pie">🥧 Circular</option>
                  <option value="doughnut">🍩 Dónut</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Download size={16} className="text-orange-600" />
                  Exportar Datos
                </label>
                <div className="space-y-2">
                <button
                  onClick={exportImg}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                    title="Exportar gráfico como imagen PNG"
                >
                  📸 Imagen
                </button>
                <button
                  onClick={exportCsv}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                    title="Exportar datos como archivo CSV"
                >
                  📄 CSV
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tip sobre funcionalidad drill-down */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                  ✨ Funcionalidad Interactiva Avanzada
                </h4>
                <div className="space-y-2">
                <p className="text-sm text-blue-800">
                    <strong className="text-blue-900">🎯 Haz clic en cualquier segmento del gráfico</strong> para acceder al sistema de drill-down:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>📋 <strong>Lista detallada</strong> de transacciones del segmento</li>
                    <li>📊 <strong>Análisis estadístico</strong> por persona y período</li>
                    <li>📈 <strong>Gráficos específicos</strong> del segmento seleccionado</li>
                    <li>🔍 <strong>Filtros avanzados</strong> y búsqueda en tiempo real</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Área del Gráfico */}
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-inner">
            <div className="relative w-full h-auto min-h-96 p-4">
              <canvas id="vsCategoriasChart" className="w-full h-auto min-h-96"></canvas>
            </div>
          </div>
        </div>

        {/* Contenedor para detalles del drill-down */}
        <div ref={detailsContainerRef}></div>

        {/* Renderizado condicional del DetailContent */}
        {currentSegmentInfo && (
          <DetailContent
            segmentLabel={currentSegmentInfo.label}
            segmentValue={currentSegmentInfo.value}
            segmentColor={currentSegmentInfo.color}
            transactions={currentTransactions}
            forceView={currentView}
          />
        )}

        {/* MODALES */}

        {/* Modal Crear Carpeta */}
        {showCarpetasModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Crear Nueva Carpeta</h3>
                  <button
                    onClick={() => setShowCarpetasModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <CarpetaForm
                  onSubmit={crearCarpeta}
                  onCancel={() => setShowCarpetasModal(false)}
                  colorSugerido={getNextAvailableColor('carpeta')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear Grupo */}
        {showGroupsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Crear Nuevo Grupo</h3>
                  <button
                    onClick={() => setShowGroupsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <GrupoForm
                  categorias={categorias}
                  carpetas={vsConfig.carpetas}
                  onSubmit={crearGrupo}
                  onCancel={() => setShowGroupsModal(false)}
                  colorSugerido={getNextAvailableColor('grupo')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Gestionar */}
        {showManageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Gestionar Carpetas y Grupos</h3>
                  <button
                    onClick={() => setShowManageModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <ManageModal
                  vsConfig={vsConfig}
                  setVsConfig={setVsConfig}
                  categorias={categorias}
                  editarCarpeta={editarCarpeta}
                  editarGrupo={editarGrupo}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Carpeta */}
        {showEditCarpetaModal && editingCarpeta && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Editar Carpeta</h3>
                  <button
                    onClick={() => {
                      setShowEditCarpetaModal(false);
                      setEditingCarpeta(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <EditCarpetaForm
                  carpeta={editingCarpeta.carpeta}
                  onSubmit={guardarEdicionCarpeta}
                  onCancel={() => {
                    setShowEditCarpetaModal(false);
                    setEditingCarpeta(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Grupo */}
        {showEditGrupoModal && editingGrupo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Editar Grupo</h3>
                  <button
                    onClick={() => {
                      setShowEditGrupoModal(false);
                      setEditingGrupo(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <EditGrupoForm
                  grupo={editingGrupo.grupo}
                  categorias={categorias}
                  carpetas={vsConfig.carpetas}
                  onSubmit={guardarEdicionGrupo}
                  onCancel={() => {
                    setShowEditGrupoModal(false);
                    setEditingGrupo(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VsCategoriasDrillDownInternal.displayName = 'VsCategoriasDrillDownInternal';

// Componente wrapper principal con QueryClient
const VsCategoriasDrillDown = forwardRef<VsCategoriasDrillDownRef, VsCategoriasDrillDownProps>(
  (props, ref) => {
    // Verificar si ya tenemos un QueryClient
    let hasQueryClient = true;
    try {
      useQueryClient();
    } catch (error) {
      hasQueryClient = false;
    }

    // Si ya hay QueryClient, usar el componente directamente
    if (hasQueryClient) {
      return <VsCategoriasDrillDownInternal {...props} ref={ref} />;
    }

    // Si no hay QueryClient, crear uno temporal
    const [queryClient] = useState(() => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          refetchOnWindowFocus: false,
          retry: 2,
        },
      },
    }));

    return (
      <QueryClientProvider client={queryClient}>
        <VsCategoriasDrillDownInternal {...props} ref={ref} />
      </QueryClientProvider>
    );
  }
);

VsCategoriasDrillDown.displayName = 'VsCategoriasDrillDown';

export default VsCategoriasDrillDown;

// Componente Formulario para Carpetas
const CarpetaForm = ({ onSubmit, onCancel, colorSugerido }: {
  onSubmit: (nombre: string, color: string) => void;
  onCancel: () => void;
  colorSugerido?: string;
}) => {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(colorSugerido || '#e74c3c');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim()) {
      onSubmit(nombre.trim(), color);
      setNombre('');
      setColor('#3b82f6');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de la carpeta
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Ventas, Marketing..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Color de la carpeta
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear Carpeta
        </button>
      </div>
    </form>
  );
};

// Componente Formulario para Grupos
const GrupoForm = ({
  categorias,
  carpetas,
  onSubmit,
  onCancel,
  colorSugerido
}: {
  categorias: any[];
  carpetas: Record<string, Carpeta>;
  onSubmit: (nombre: string, color: string, categoriasSeleccionadas: string[], carpetaId?: string) => void;
  onCancel: () => void;
  colorSugerido?: string;
}) => {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(colorSugerido || '#3498db');
  const [carpetaId, setCarpetaId] = useState('');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim() && categoriasSeleccionadas.length > 0) {
      onSubmit(nombre.trim(), color, categoriasSeleccionadas, carpetaId || undefined);
      setNombre('');
      setColor('#10b981');
      setCarpetaId('');
      setCategoriasSeleccionadas([]);
    }
  };

  const toggleCategoria = (categoriaNombre: string) => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(categoriaNombre)
        ? prev.filter(c => c !== categoriaNombre)
        : [...prev, categoriaNombre]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre del grupo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Gastos operativos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Carpeta</label>
          <select
            value={carpetaId}
            onChange={(e) => setCarpetaId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sin carpeta</option>
            {Object.entries(carpetas).map(([id, carpeta]) => (
              <option key={id} value={id}>{carpeta.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Categorías del grupo ({categoriasSeleccionadas.length} seleccionadas)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {categorias.map((categoria) => (
            <label
              key={categoria.id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <input
                type="checkbox"
                checked={categoriasSeleccionadas.includes(categoria.nombre)}
                onChange={() => toggleCategoria(categoria.nombre)}
                className="rounded"
              />
              <span className="text-sm">{categoria.nombre}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim() || categoriasSeleccionadas.length === 0}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Crear Grupo
        </button>
      </div>
    </form>
  );
};

// Componente Modal de Gestión
const ManageModal = ({
  vsConfig,
  setVsConfig,
  categorias,
  editarCarpeta,
  editarGrupo
}: {
  vsConfig: VSConfig;
  setVsConfig: React.Dispatch<React.SetStateAction<VSConfig>>;
  categorias: any[];
  editarCarpeta: (carpetaId: number) => void;
  editarGrupo: (grupoId: number) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'carpetas' | 'grupos'>('carpetas');

  // Mapa local de categorias id->nombre para evitar ReferenceError
  const byCatId = useMemo(() => new Map(categorias.map((c: any) => [c.id, c.nombre])), [categorias]);

  const eliminarCarpeta = async (carpetaId: number) => {
    const carpeta = vsConfig.carpetas[carpetaId];
    const gruposEnCarpeta = Object.entries(vsConfig.grupos).filter(([id, grupo]) => grupo.carpetaId === carpetaId);

    let mensaje = `¿Estás seguro de eliminar la carpeta "${carpeta.nombre}"?`;
    if (gruposEnCarpeta.length > 0) {
      mensaje += `\n\nLos ${gruposEnCarpeta.length} grupos dentro de esta carpeta quedarán sin carpeta.`;
    }

    if (confirm(mensaje)) {
      try {
        // Eliminar de la base de datos
        await VSCategoriasService.deleteCarpeta(carpetaId);

        // Actualizar estado local
        setVsConfig(prev => {
          const newConfig = { ...prev };

          // Remover carpetaId de grupos que estaban en esta carpeta
          gruposEnCarpeta.forEach(([grupoId, grupo]) => {
            if (newConfig.grupos[grupoId]) {
              delete newConfig.grupos[grupoId].carpetaId;
            }
          });

          // Eliminar la carpeta
          delete newConfig.carpetas[carpetaId];

          return newConfig;
        });

        toast.success('Carpeta eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar carpeta:', error);
        toast.error('Error al eliminar carpeta');
      }
    }
  };

  const eliminarGrupo = async (grupoId: number) => {
    const grupo = vsConfig.grupos[grupoId];
    if (confirm(`¿Estás seguro de eliminar el grupo "${grupo.nombre}"?`)) {
      try {
        // Eliminar de la base de datos
        await VSCategoriasService.deleteGrupo(grupoId);

        // Actualizar estado local
        setVsConfig(prev => {
          const newConfig = { ...prev };
          delete newConfig.grupos[grupoId];

          // Remover de gruposSeleccionados si estaba seleccionado
          newConfig.filtros.gruposSeleccionados = newConfig.filtros.gruposSeleccionados.filter(id => id !== grupoId);

          return newConfig;
        });

        toast.success('Grupo eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar grupo:', error);
        toast.error('Error al eliminar grupo');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('carpetas')}
            className={`vs-management-tab ${activeTab === 'carpetas' ? 'active' : ''}`}
          >
            <FolderOpen size={16} />
            Carpetas
          </button>
          <button
            onClick={() => setActiveTab('grupos')}
            className={`vs-management-tab ${activeTab === 'grupos' ? 'active' : ''}`}
          >
            <Tags size={16} />
            Grupos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'carpetas' && (
        <div className="space-y-4">
          {Object.keys(vsConfig.carpetas).length === 0 ? (
            <div className="vs-empty-state vs-animate-in">
              <FolderOpen className="vs-empty-icon mx-auto" size={48} />
              <div className="vs-empty-title">No hay carpetas creadas</div>
              <div className="vs-empty-description">Las carpetas te ayudan a organizar tus grupos de métricas</div>
            </div>
          ) : (
            <div className="vs-grupos-container">
              {Object.entries(vsConfig.carpetas).map(([carpetaId, carpeta]) => {
                const carpetaIdNum = +carpetaId;
                const gruposEnCarpeta = Object.entries(vsConfig.grupos)
                  .filter(([id, grupo]) => grupo.carpetaId === carpetaIdNum);
                console.debug('[ManageModal] Carpeta', carpeta.nombre, 'id=', carpetaIdNum, 'grupos=', gruposEnCarpeta.length);

              return (
                  <div key={carpetaId} className="vs-grupo-card vs-animate-in">
                    <div className="vs-grupo-header">
                      <div className="vs-grupo-title">
                        <div className="vs-grupo-color" style={{ background: carpeta.color }}></div>
                      <div>
                          <h4 className="vs-grupo-name">{carpeta.nombre}</h4>
                          <p className="vs-grupo-meta">
                            <FolderOpen className="inline mr-1" size={12} />
                            {gruposEnCarpeta.length} grupos
                          </p>
                      </div>
                    </div>
                      <div className="vs-grupo-actions">
                        <button
                          onClick={() => editarCarpeta(carpetaIdNum)}
                          className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition-colors"
                          title="Editar carpeta"
                        >
                          <Edit3 size={16} />
                        </button>
                      <button
                          onClick={() => eliminarCarpeta(carpetaIdNum)}
                          className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                        title="Eliminar carpeta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {gruposEnCarpeta.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs font-medium text-gray-700 mb-2">Grupos en esta carpeta:</div>
                      <div className="flex flex-wrap gap-1">
                        {gruposEnCarpeta.map(([grupoId, grupo]) => (
                            <span key={grupoId} className="vs-categoria-tag">
                            <div className="w-2 h-2 rounded-full mr-1" style={{ background: grupo.color }}></div>
                            {grupo.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grupos' && (
        <div className="space-y-4">
          {Object.keys(vsConfig.grupos).length === 0 ? (
            <div className="vs-empty-state vs-animate-in">
              <Tags className="vs-empty-icon mx-auto" size={48} />
              <div className="vs-empty-title">No hay grupos creados</div>
              <div className="vs-empty-description">Los grupos te permiten analizar múltiples categorías juntas</div>
            </div>
          ) : (
            <div className="vs-grupos-container">
              {Object.entries(vsConfig.grupos).map(([grupoId, grupo]) => {
              const carpetaNombre = grupo.carpetaId ? vsConfig.carpetas[grupo.carpetaId]?.nombre : 'Sin carpeta';

              return (
                  <div key={grupoId} className="vs-grupo-card vs-animate-in">
                    <div className="vs-grupo-header">
                      <div className="vs-grupo-title">
                        <div className="vs-grupo-color" style={{ background: grupo.color }}></div>
                      <div>
                          <h4 className="vs-grupo-name">{grupo.nombre}</h4>
                          <p className="vs-grupo-meta">
                            <FolderOpen className="inline mr-1" size={12} />
                          {carpetaNombre} • {(grupo.categoriaIds || []).length} categorías
                        </p>
                      </div>
                    </div>
                      <div className="vs-grupo-actions">
                        <button
                          onClick={() => editarGrupo(grupoId)}
                          className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition-colors"
                          title="Editar grupo"
                        >
                          <Edit3 size={16} />
                        </button>
                      <button
                        onClick={() => eliminarGrupo(grupoId)}
                          className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                        title="Eliminar grupo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-2">Categorías:</div>
                    <div className="flex flex-wrap gap-1">
                      {(grupo.categoriaIds || []).map(cid => (
                          <span key={cid} className="vs-categoria-tag">
                          {byCatId.get(cid) || `Cat ${cid}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente Lista de Drill-down
const DrillDownListView = ({ transactions, usuarios: usuariosProp }: { transactions: Transaccion[], usuarios?: any[] }) => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [sortField, setSortField] = useState<keyof Transaccion>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Usar usuarios del prop o array vacío
  const usuarios = usuariosProp || [];

  useEffect(() => {
    setMounted(true);
    console.log('🎨 DrillDownListView mounted, transactions:', {
      length: transactions.length,
      isArray: Array.isArray(transactions),
      firstTransaction: transactions[0]
    });
  }, []);

  useEffect(() => {
    console.log('🔄 DrillDownListView - transactions updated:', {
      length: transactions.length,
      isArray: Array.isArray(transactions),
      mounted
    });
  }, [transactions, mounted]);

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

    // Debug: mostrar información detallada cuando está en loading
  if (transactions.length === 0 && mounted) {
    console.log('🔄 DrillDownListView: Mostrando estado de loading');
    console.log('📊 Estado actual:', {
      transactionsLength: transactions.length,
      transactionsType: typeof transactions,
      transactionsIsArray: Array.isArray(transactions),
      mounted,
      usuarios: usuarios.length
    });

    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">🌐 Obteniendo transacciones del servidor...</p>
        <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>

        {/* Debug info */}
        <div className="mt-4 text-xs text-gray-400 bg-gray-100 p-2 rounded max-w-md mx-auto">
          <div>Transacciones: {transactions.length}</div>
          <div>Tipo: {typeof transactions}</div>
          <div>Array: {Array.isArray(transactions).toString()}</div>
          <div>Mounted: {mounted.toString()}</div>
        </div>

        <button
          onClick={() => {
            console.log('🔄 Forzando reload...');
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          🔄 Recargar si se queda atascado
        </button>
      </div>
    );
  }

  // Mensaje especial si mounted pero aún no hay transacciones
  if (mounted && transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-lg font-medium mb-2">No hay transacciones disponibles</p>
        <p className="text-sm">Este segmento no contiene transacciones o hubo un problema al cargarlas</p>
        <div className="mt-4 text-xs text-gray-400 bg-gray-100 p-2 rounded max-w-md mx-auto">
          <div>Debug: transactions.length = {transactions.length}</div>
          <div>Debug: mounted = {mounted.toString()}</div>
        </div>
      </div>
    );
  }

    // Filtrar transacciones (basado en lógica legacy getFilteredTransactions)
  const filteredTransactions = transactions.filter(transaction => {
    // Filtro de búsqueda (equivalente al legacy que busca en concepto, usuario y notas)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const usuario = usuarios.find(u => u.id === (transaction.usuarioId || transaction.personaId));
      const userName = usuario ? usuario.nombre.toLowerCase() : '';

      const matchesSearch =
        (transaction.concepto || '').toLowerCase().includes(searchLower) ||
        (transaction.categoria?.nombre || '').toLowerCase().includes(searchLower) ||
        userName.includes(searchLower) ||
        (transaction.notas || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Filtro por tipo
    if (selectedTipo && transaction.tipo?.nombre !== selectedTipo) {
      return false;
    }

    // Filtro por usuario (comparar con nombre de usuario, no ID)
    if (selectedUsuario) {
      const usuario = usuarios.find(u => u.id === (transaction.usuarioId || transaction.personaId));
      const userName = usuario ? usuario.nombre : 'Sin usuario';
      if (userName !== selectedUsuario) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    let valueA: any, valueB: any;

    switch (sortField) {
      case 'fecha':
        valueA = a.fecha || '';
        valueB = b.fecha || '';
        break;
      case 'concepto':
        valueA = (a.concepto || '').toLowerCase();
        valueB = (b.concepto || '').toLowerCase();
        break;
      case 'tipo':
        valueA = a.tipo?.nombre || '';
        valueB = b.tipo?.nombre || '';
        break;
      case 'monto':
        valueA = a.monto || 0;
        valueB = b.monto || 0;
        break;
      case 'categoria':
        valueA = (a.categoria?.nombre || '').toLowerCase();
        valueB = (b.categoria?.nombre || '').toLowerCase();
        break;
      default:
        valueA = a.monto || 0;
        valueB = b.monto || 0;
    }

    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  const handleSort = (field: keyof Transaccion) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Estadísticas rápidas
  const totalMonto = filteredTransactions.reduce((sum, t) => sum + (t.monto || 0), 0);
  const ingresos = filteredTransactions.filter(t => t.tipo?.nombre === 'INGRESO').reduce((sum, t) => sum + (t.monto || 0), 0);
  const gastos = filteredTransactions.filter(t => t.tipo?.nombre === 'GASTO').reduce((sum, t) => sum + (t.monto || 0), 0);

  return (
    <div className="space-y-6">
      {/* Controles de filtros */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los tipos</option>
              {/* Mostrar tipos únicos de las transacciones actuales (basado en legacy) */}
              {(() => {
                const tiposEnTransacciones = new Set<string>();
                transactions.forEach(t => {
                  if (t.tipo?.nombre) {
                    tiposEnTransacciones.add(t.tipo.nombre);
                  }
                });

                return Array.from(tiposEnTransacciones).sort().map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo === 'INGRESO' ? 'Ingresos' :
                     tipo === 'GASTO' ? 'Gastos' :
                     tipo === 'APORTE' ? 'Aportes' : tipo}
                  </option>
                ));
              })()}
            </select>
          </div>

          {/* Filtro por usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los usuarios</option>
              {/* Mostrar usuarios únicos de las transacciones actuales */}
              {(() => {
                const usuariosEnTransacciones = new Set<string>();

                console.log('🔍 Analizando usuarios en transacciones:', {
                  totalTransactions: transactions.length,
                  sampleUsuarios: transactions.slice(0, 3).map(t => ({
                    id: t.id,
                    usuario: t.usuario,
                    usuarioId: t.usuarioId,
                    personaId: t.personaId
                  }))
                });

                transactions.forEach(t => {
                  if (t.usuario?.nombre) {
                    usuariosEnTransacciones.add(t.usuario.nombre);
                  } else if (t.usuarioId || t.personaId) {
                    // Fallback: buscar en el array de usuarios si no viene el objeto completo
                    const usuario = usuarios.find(u => u.id === (t.usuarioId || t.personaId));
                    if (usuario) {
                      usuariosEnTransacciones.add(usuario.nombre);
                    } else {
                      usuariosEnTransacciones.add('Sin usuario');
                    }
                  } else {
                    usuariosEnTransacciones.add('Sin usuario');
                  }
                });

                const usuariosList = Array.from(usuariosEnTransacciones).sort();
                console.log('👥 Usuarios encontrados en transacciones:', usuariosList);

                return usuariosList.map(userName => (
                  <option key={userName} value={userName}>
                    {userName}
                  </option>
                ));
              })()}
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTipo('');
                setSelectedUsuario('');
              }}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Total transacciones</div>
            <div className="text-lg font-bold text-gray-900">{filteredTransactions.length}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Monto total</div>
            <div className="text-lg font-bold text-blue-600">${totalMonto.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Ingresos</div>
            <div className="text-lg font-bold text-green-600">${ingresos.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Gastos</div>
            <div className="text-lg font-bold text-red-600">${gastos.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Mensaje si no hay transacciones */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto mb-4 opacity-50" size={48} />
          <p>No se encontraron transacciones con los filtros aplicados</p>
          <p className="text-sm mt-2">
            {transactions.length > 0
              ? `${transactions.length} transacciones disponibles sin filtros`
              : 'No hay transacciones en esta categoría'
            }
          </p>
        </div>
      )}

      {/* Tabla de transacciones */}
      {filteredTransactions.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg border">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
                <th
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fecha')}
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    {sortField === 'fecha' && (
                      <span className={`transform transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>
                        ↓
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('concepto')}
                >
                  <div className="flex items-center gap-1">
                    Concepto
                    {sortField === 'concepto' && (
                      <span className={`transform transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>
                        ↓
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('monto')}
                >
                  <div className="flex items-center gap-1">
                    Monto
                    {sortField === 'monto' && (
                      <span className={`transform transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>
                        ↓
                      </span>
                    )}
                  </div>
                </th>
            <th className="px-6 py-3">Usuario</th>
            <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Categoría</th>
          </tr>
        </thead>
        <tbody>
              {filteredTransactions.map((transaction, index) => {
            const usuario = usuarios.find(u => u.id === (transaction.usuarioId || transaction.personaId));

            return (
              <tr key={transaction.id || index} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium">{transaction.concepto}</div>
                       <div className="text-xs text-gray-500">{transaction.categoria?.nombre || 'Sin categoría'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                         transaction.tipo?.nombre === 'INGRESO' ? 'text-green-600' :
                         transaction.tipo?.nombre === 'APORTE' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                         {transaction.tipo?.nombre === 'INGRESO' ? '+' : transaction.tipo?.nombre === 'APORTE' ? '+' : '-'}
                    ${transaction.monto.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {transaction.usuario?.nombre || usuario?.nombre || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         transaction.tipo?.nombre === 'INGRESO' ? 'bg-green-100 text-green-800' :
                         transaction.tipo?.nombre === 'APORTE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}>
                         {transaction.tipo?.nombre || 'N/A'}
                  </span>
                    </td>
                                         <td className="px-6 py-4">
                       <span className="text-sm text-gray-600">{transaction.categoria?.nombre || 'Sin categoría'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      )}
    </div>
  );
};

// Componente Formulario para Editar Carpetas
const EditCarpetaForm = ({
  carpeta,
  onSubmit,
  onCancel
}: {
  carpeta: Carpeta;
  onSubmit: (nombre: string, color: string) => void;
  onCancel: () => void;
}) => {
  const [nombre, setNombre] = useState(carpeta.nombre);
  const [color, setColor] = useState(carpeta.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim()) {
      onSubmit(nombre.trim(), color);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de la carpeta
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Ventas, Marketing..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Color de la carpeta
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

// Componente Formulario para Editar Grupos
const EditGrupoForm = ({
  grupo,
  categorias,
  carpetas,
  onSubmit,
  onCancel
}: {
  grupo: GrupoNorm;
  categorias: any[];
  carpetas: Record<string, Carpeta>;
  onSubmit: (nombre: string, color: string, categoriaIds: number[], carpetaId?: string) => void;
  onCancel: () => void;
}) => {
  const [nombre, setNombre] = useState(grupo.nombre);
  const [color, setColor] = useState(grupo.color);
  const [carpetaId, setCarpetaId] = useState(grupo.carpetaId ? String(grupo.carpetaId) : '');
  const defaultSelectedIds = (grupo.categoriaIds && grupo.categoriaIds.length > 0)
    ? grupo.categoriaIds
    : (grupo.categoriaNames || [])
        .map((nm) => categorias.find((c: any) => c.nombre === nm)?.id)
        .filter(Boolean) as number[];
  const [selectedIds, setSelectedIds] = useState<number[]>(defaultSelectedIds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim() && selectedIds.length > 0) {
      onSubmit(nombre.trim(), color, selectedIds, carpetaId || undefined);
    }
  };

  const toggleCategoria = (categoriaId: number) => {
    setSelectedIds(prev => prev.includes(categoriaId)
      ? prev.filter(id => id !== categoriaId)
      : [...prev, categoriaId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre del grupo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Gastos operativos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Carpeta</label>
          <select
            value={carpetaId}
            onChange={(e) => setCarpetaId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sin carpeta</option>
            {Object.entries(carpetas).map(([id, carpeta]) => (
              <option key={id} value={id}>{carpeta.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Categorías del grupo ({selectedIds.length} seleccionadas)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {categorias.map((categoria) => (
            <label
              key={categoria.id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(categoria.id)}
                onChange={() => toggleCategoria(categoria.id)}
                className="rounded"
              />
              <span className="text-sm">{categoria.nombre}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim() || selectedIds.length === 0}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

// Componente Gráficos de Drill-down (basado en legacy vs-categorias-drill-down.js)
const DrillDownChartView = ({
  transactions,
  segmentColor
}: {
  transactions: Transaccion[];
  segmentColor: string;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Analizar transacciones por usuario (basado en legacy)
  const analyzeByUser = () => {
    const userData: Record<string, number> = {};
    transactions.forEach(t => {
      const userName = t.usuario?.nombre || 'Sin usuario';
      if (!userData[userName]) {
        userData[userName] = 0;
      }
      userData[userName] += t.monto || 0;
    });

    return Object.entries(userData).map(([name, amount]) => ({ name, amount }));
  };

  // Analizar transacciones por mes (basado en legacy)
  const analyzeByMonth = () => {
    const monthData: Record<string, number> = {};
    transactions.forEach(t => {
      if (!t.fecha) return;

      const monthKey = t.fecha.substring(0, 7); // YYYY-MM
      if (!monthData[monthKey]) {
        monthData[monthKey] = 0;
      }
      monthData[monthKey] += t.monto || 0;
    });

    return Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
  };

  // Generar colores para gráficos (basado en legacy)
  const generateColors = (count: number) => {
    const detailColors = [
      '#6366f1', '#f59e42', '#10b981', '#ef4444', '#fbbf24',
      '#3b82f6', '#a21caf', '#eab308', '#0ea5e9', '#f472b6'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(detailColors[i % detailColors.length]);
    }
    return colors;
  };

  // Analizar detalles de transacciones individuales para visualización granular (basado en legacy)
  const analyzeTransactionDetails = (transactions: Transaccion[]) => {
    return transactions.map((t, index) => {
      const userName = t.usuario?.nombre || 'Sin usuario';

      return {
        id: index,
        concepto: t.concepto || 'Sin concepto',
        monto: t.monto || 0,
        fecha: t.fecha || '',
        usuario: userName,
        tipo: t.tipo?.nombre || 'N/A',
        categoria: t.categoria?.nombre || '',
        notas: t.notas || ''
      };
    }).sort((a, b) => b.monto - a.monto); // Ordenar por monto descendente
  };

  // Renderizar análisis estadístico (basado en legacy)
  const renderStatisticalAnalysis = (transactions: Transaccion[]) => {
    const amounts = transactions.map(t => t.monto || 0);
    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    const avg = total / amounts.length;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);

    // Calcular mediana
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const median = sortedAmounts.length % 2 === 0
      ? (sortedAmounts[sortedAmounts.length/2 - 1] + sortedAmounts[sortedAmounts.length/2]) / 2
      : sortedAmounts[Math.floor(sortedAmounts.length/2)];

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${total.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${Math.round(avg).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Promedio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${Math.round(median).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Mediana</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${max.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Máximo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${min.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Mínimo</div>
        </div>
      </div>
    );
  };

  // Crear gráfico visual de transacciones individuales (basado en legacy)
  const createTransactionDetailChart = (canvasId: string, transactionData: any[]) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calcular tamaños de puntos basados en el monto
    const montos = transactionData.map(t => t.monto);
    const minMonto = Math.min(...montos);
    const maxMonto = Math.max(...montos);
    const rangeMonto = maxMonto - minMonto || 1;

    // Preparar datos para visualización directa de transacciones
    const scatterData = transactionData.map((t, index) => {
      // Calcular tamaño del punto basado en el monto (entre 4 y 20)
      const normalizedSize = ((t.monto - minMonto) / rangeMonto);
      const pointSize = 4 + (normalizedSize * 16);

      // Color basado en el tipo de transacción
      let color;
      switch (t.tipo) {
        case 'INGRESO':
          color = '#10b981'; // Verde
          break;
        case 'GASTO':
          color = '#ef4444'; // Rojo
          break;
        case 'APORTE':
          color = '#3b82f6'; // Azul
          break;
        default:
          color = '#6b7280'; // Gris
      }

      return {
        x: index + 1, // Número de transacción en orden
        y: t.monto,
        pointRadius: pointSize,
        pointHoverRadius: pointSize + 3,
        backgroundColor: color + '80', // 50% transparencia
        borderColor: color,
        borderWidth: 2,
        // Datos adicionales para tooltip
        concepto: t.concepto,
        fecha: t.fecha,
        tipo: t.tipo,
        persona: t.persona,
        notas: t.notas
      };
    });

    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Transacciones',
          data: scatterData,
          backgroundColor: scatterData.map(d => d.backgroundColor),
          borderColor: scatterData.map(d => d.borderColor),
          borderWidth: 2,
          pointRadius: scatterData.map(d => d.pointRadius),
          pointHoverRadius: scatterData.map(d => d.pointHoverRadius)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Ocultar leyenda ya que cada punto es único
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const point = context[0];
                return `Transacción #${point.parsed.x}`;
              },
              label: function(context) {
                const point = context.raw;
                return [
                  `Monto: $${point.y.toLocaleString()}`,
                  `Concepto: ${point.concepto}`,
                  `Tipo: ${point.tipo}`,
                  `Usuario: ${point.usuario}`,
                  `Fecha: ${point.fecha}`,
                  ...(point.notas ? [`Notas: ${point.notas}`] : [])
                ];
              }
            },
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Orden de Transacción',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return '#' + Math.floor(value);
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Valor de Transacción ($)',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
            }
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
          }
          }
        },
        interaction: {
          intersect: false,
          mode: 'point'
        }
      }
    });
  };

  // Crear gráfico temporal (basado en legacy)
  const createTemporalChart = (canvasId: string, monthData: any[]) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthData.map(m => m.month),
        datasets: [{
          label: 'Monto',
          data: monthData.map(m => m.amount),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `$${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  };

  // Renderizar gráficos después de que el componente se monte
  useEffect(() => {
    if (mounted && transactions.length > 0) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const transactionAnalysis = analyzeTransactionDetails(transactions);
        const monthAnalysis = analyzeByMonth(transactions);

        // Crear gráfico de transacciones
        createTransactionDetailChart('drill-chart-transacciones', transactionAnalysis);

        // Crear gráfico temporal
        createTemporalChart('drill-chart-temporal', monthAnalysis);
      }, 100);
    }
  }, [mounted, transactions]);

  // Renderizar contenido de gráficos (basado en legacy)
  const renderDetailCharts = () => {
    if (transactions.length === 0) {
  return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg font-medium text-gray-900 mb-2">No hay datos para graficar</div>
          <div className="text-gray-500">No se encontraron transacciones para este segmento</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Gráfico visual de transacciones */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Visualización de Transacciones</h4>
          <p className="text-sm text-gray-600 mb-3">Vista gráfica de la información de la lista para identificación rápida de patrones</p>

          {/* Leyenda visual */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 border">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Ingresos</span>
      </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-700">Gastos</span>
        </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-700">Aportes</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="text-gray-600">•</div>
                <span className="text-gray-600 text-xs">Tamaño del punto = Valor de la transacción</span>
              </div>
            </div>
          </div>

          <div className="h-80">
            <canvas id="drill-chart-transacciones"></canvas>
          </div>
        </div>

        {/* Gráfico temporal */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Evolución Temporal</h4>
          <div className="h-64">
            <canvas id="drill-chart-temporal"></canvas>
          </div>
        </div>

        {/* Análisis estadístico */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Análisis Estadístico</h4>
          {renderStatisticalAnalysis(transactions)}
      </div>
    </div>
  );
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return renderDetailCharts();
};
