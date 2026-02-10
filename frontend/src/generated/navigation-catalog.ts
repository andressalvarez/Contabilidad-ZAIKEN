/* AUTO-GENERATED FILE. DO NOT EDIT MANUALLY. */

import type { NavigationCatalogItem } from '@/types/navigation';

export const NAVIGATION_CATALOG: NavigationCatalogItem[] = [
  {
    "path": "/",
    "itemKey": "dashboard",
    "title": "Dashboard",
    "icon": "bi-grid-1x2-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "Dashboard"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/estadisticas",
    "itemKey": "estadisticas",
    "title": "Estadisticas",
    "icon": "bi-bar-chart-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "Estadisticas"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/roles",
    "itemKey": "roles_negocio",
    "title": "Roles",
    "icon": "bi-person-badge-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "BusinessRole"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/valor-hora",
    "itemKey": "valor_hora",
    "title": "Valor Hora",
    "icon": "bi-clock-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "ValorHora"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/registro-horas",
    "itemKey": "registro_horas",
    "title": "Registro Horas",
    "icon": "bi-calendar2-check-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "RegistroHoras"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/horas-pendientes",
    "itemKey": "aprobar_horas",
    "title": "Aprobar Horas",
    "icon": "bi-clock-history",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "approve",
      "subject": "RegistroHoras"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/deuda-horas",
    "itemKey": "deuda_horas",
    "title": "Deuda de Horas",
    "icon": "bi-hourglass-split",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "HourDebt"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/campanas",
    "itemKey": "campanas",
    "title": "Campanas",
    "icon": "bi-receipt",
    "iconType": "bootstrap",
    "activeMatchers": [
      "/campanas",
      "/gastos"
    ],
    "defaultPermission": {
      "action": "read",
      "subject": "Campana"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/transacciones",
    "itemKey": "transacciones",
    "title": "Transacciones",
    "icon": "bi-wallet2",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "Transaccion"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/tipos-transaccion",
    "itemKey": "tipos_transaccion",
    "title": "Tipos de Transaccion",
    "icon": "bi-credit-card-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "Transaccion"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/categorias",
    "itemKey": "categorias",
    "title": "Categorias",
    "icon": "bi-tags-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "Categoria"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/distribucion-utilidades",
    "itemKey": "distribucion_utilidades",
    "title": "Distribucion Utilidades",
    "icon": "bi-pie-chart-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "DistribucionUtilidades"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/distribucion-detalle",
    "itemKey": "distribucion_detalle",
    "title": "Distribucion Detalle",
    "icon": "bi-list-check",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "DistribucionDetalle"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/usuarios",
    "itemKey": "usuarios",
    "title": "Usuarios",
    "icon": "bi-person-gear",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "Usuario"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/admin/seguridad/roles",
    "itemKey": "roles_permisos",
    "title": "Roles y Permisos",
    "icon": "bi-shield-lock-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "SecurityRole"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/admin/seguridad/auditoria",
    "itemKey": "auditoria",
    "title": "Auditoria",
    "icon": "bi-file-earmark-text-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "SecurityAuditLog"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/admin/seguridad/feedback",
    "itemKey": "feedback_bugs",
    "title": "Feedback Bugs",
    "icon": "bi-bug-fill",
    "iconType": "bootstrap",
    "defaultPermission": {
      "action": "read",
      "subject": "SecurityRole"
    },
    "isKnownCoreItem": true
  },
  {
    "path": "/configuracion",
    "itemKey": "configuracion",
    "title": "Configuracion",
    "icon": "bi-gear-fill",
    "iconType": "bootstrap",
    "activeMatchers": [
      "/configuracion",
      "/admin/seguridad/configuracion"
    ],
    "defaultPermission": {
      "action": "read",
      "subject": "Settings"
    },
    "isKnownCoreItem": true
  },
  {
    "itemKey": "perfil",
    "path": "/perfil",
    "title": "Perfil",
    "icon": "bi-circle-fill",
    "iconType": "bootstrap",
    "activeMatchers": [
      "/perfil"
    ],
    "isKnownCoreItem": false
  }
] as NavigationCatalogItem[];

export const NAVIGATION_CATALOG_BY_KEY: Record<string, NavigationCatalogItem> = Object.fromEntries(
  NAVIGATION_CATALOG.map((item) => [item.itemKey, item]),
);
