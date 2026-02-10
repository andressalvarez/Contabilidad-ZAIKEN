import { UpdateNavigationLayoutDto } from './dto/update-navigation-layout.dto';

export interface NavigationCatalogItem {
  itemKey: string;
  path: string;
  title: string;
  isKnownCoreItem: boolean;
  activeMatchers?: string[];
}

export const CORE_NAVIGATION_CATALOG: NavigationCatalogItem[] = [
  { itemKey: 'dashboard', path: '/', title: 'Dashboard', isKnownCoreItem: true },
  { itemKey: 'estadisticas', path: '/estadisticas', title: 'Estadisticas', isKnownCoreItem: true },
  { itemKey: 'roles_negocio', path: '/roles', title: 'Roles', isKnownCoreItem: true },
  { itemKey: 'valor_hora', path: '/valor-hora', title: 'Valor Hora', isKnownCoreItem: true },
  { itemKey: 'registro_horas', path: '/registro-horas', title: 'Registro Horas', isKnownCoreItem: true },
  { itemKey: 'aprobar_horas', path: '/horas-pendientes', title: 'Aprobar Horas', isKnownCoreItem: true },
  { itemKey: 'deuda_horas', path: '/deuda-horas', title: 'Deuda de Horas', isKnownCoreItem: true },
  {
    itemKey: 'campanas',
    path: '/campanas',
    title: 'Campanas',
    isKnownCoreItem: true,
    activeMatchers: ['/campanas', '/gastos'],
  },
  {
    itemKey: 'transacciones',
    path: '/transacciones',
    title: 'Transacciones',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'tipos_transaccion',
    path: '/tipos-transaccion',
    title: 'Tipos de Transaccion',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'categorias',
    path: '/categorias',
    title: 'Categorias',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'distribucion_utilidades',
    path: '/distribucion-utilidades',
    title: 'Distribucion Utilidades',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'distribucion_detalle',
    path: '/distribucion-detalle',
    title: 'Distribucion Detalle',
    isKnownCoreItem: true,
  },
  { itemKey: 'usuarios', path: '/usuarios', title: 'Usuarios', isKnownCoreItem: true },
  {
    itemKey: 'roles_permisos',
    path: '/admin/seguridad/roles',
    title: 'Roles y Permisos',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'auditoria',
    path: '/admin/seguridad/auditoria',
    title: 'Auditoria',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'feedback_bugs',
    path: '/admin/seguridad/feedback',
    title: 'Feedback Bugs',
    isKnownCoreItem: true,
  },
  {
    itemKey: 'configuracion',
    path: '/configuracion',
    title: 'Configuracion',
    isKnownCoreItem: true,
    activeMatchers: ['/configuracion', '/admin/seguridad/configuracion'],
  },
];

export const DEFAULT_NAVIGATION_LAYOUT: UpdateNavigationLayoutDto = {
  version: 1,
  worlds: [
    {
      id: 'negocio',
      name: 'Negocio',
      order: 1,
      enabled: true,
      sections: [
        {
          id: 'principal',
          title: 'Principal',
          order: 1,
          items: [
            { itemKey: 'dashboard', order: 1 },
            { itemKey: 'estadisticas', order: 2 },
          ],
        },
        {
          id: 'gestion_personal',
          title: 'Gestion de Personal',
          order: 2,
          items: [
            { itemKey: 'roles_negocio', order: 1 },
            { itemKey: 'valor_hora', order: 2 },
            { itemKey: 'registro_horas', order: 3 },
            { itemKey: 'aprobar_horas', order: 4 },
            { itemKey: 'deuda_horas', order: 5 },
          ],
        },
        {
          id: 'operaciones',
          title: 'Operaciones',
          order: 3,
          items: [
            { itemKey: 'campanas', order: 1 },
            { itemKey: 'transacciones', order: 2 },
            { itemKey: 'tipos_transaccion', order: 3 },
            { itemKey: 'categorias', order: 4 },
          ],
        },
        {
          id: 'distribucion',
          title: 'Distribucion',
          order: 4,
          items: [
            { itemKey: 'distribucion_utilidades', order: 1 },
            { itemKey: 'distribucion_detalle', order: 2 },
          ],
        },
      ],
    },
    {
      id: 'plataforma',
      name: 'Plataforma',
      order: 2,
      enabled: true,
      sections: [
        {
          id: 'administracion',
          title: 'Administracion',
          order: 1,
          items: [
            { itemKey: 'usuarios', order: 1 },
            { itemKey: 'roles_permisos', order: 2 },
            { itemKey: 'auditoria', order: 3 },
            { itemKey: 'feedback_bugs', order: 4 },
            { itemKey: 'configuracion', order: 5 },
          ],
        },
      ],
    },
    {
      id: 'ia',
      name: 'IA',
      order: 3,
      enabled: true,
      sections: [
        {
          id: 'sin_asignar',
          title: 'Sin asignar',
          order: 1,
          items: [],
        },
      ],
    },
  ],
};

export function cloneDefaultNavigationLayout(): UpdateNavigationLayoutDto {
  return JSON.parse(JSON.stringify(DEFAULT_NAVIGATION_LAYOUT)) as UpdateNavigationLayoutDto;
}
