import { BuildingType } from '@/types/game';
import { getBuildingSize } from '@/lib/simulation';
import { TILE_WIDTH, TILE_HEIGHT } from './types';

export type ObjectRenderCategory =
  | 'road'
  | 'rail'
  | 'bridge'
  | 'zone'
  | 'building'
  | 'utility'
  | 'service'
  | 'park'
  | 'tree'
  | 'decoration'
  | 'transport'
  | 'water'
  | 'future';

export type GridFootprint = {
  width: number;
  height: number;
};

export type VisualBase = {
  left: number;
  right: number;
  bottom: number;
};

export type ObjectRenderConfig = {
  id: string;
  category: ObjectRenderCategory;
  footprint?: GridFootprint;
  scale: number;
  anchor: { x: number; y: number };
  offset: { x: number; y: number };
  visualBase: VisualBase;
};

export type ObjectRenderCalibration = Partial<Pick<ObjectRenderConfig, 'scale' | 'anchor' | 'offset' | 'visualBase'>>;

export type FootprintPolygon = {
  top: { x: number; y: number };
  right: { x: number; y: number };
  bottom: { x: number; y: number };
  left: { x: number; y: number };
  center: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
};

export type SpritePlacement = {
  drawX: number;
  drawY: number;
  destWidth: number;
  destHeight: number;
  anchorPoint: { x: number; y: number };
  footprint: FootprintPolygon;
  config: ObjectRenderConfig;
};

const FLAT_TILE_CONFIG: ObjectRenderConfig = {
  id: 'flatTile',
  category: 'zone',
  scale: 1,
  anchor: { x: 0.5, y: 1 },
  offset: { x: 0, y: 0 },
  visualBase: { left: 0, right: 1, bottom: 1 },
};

const DEFAULT_BUILDING_CONFIG: ObjectRenderConfig = {
  id: 'defaultBuilding',
  category: 'building',
  scale: 1,
  anchor: { x: 0.5, y: 0.92 },
  offset: { x: 0, y: 0 },
  visualBase: { left: 0.12, right: 0.88, bottom: 0.92 },
};

const DIRECT_NPS_2X2_CONFIG: ObjectRenderConfig = {
  ...DEFAULT_BUILDING_CONFIG,
  id: 'directNpsAsset',
  category: 'utility',
  scale: 0.5,
  anchor: { x: 0.5, y: 1 },
  offset: { x: 0, y: 0 },
  visualBase: { left: 0, right: 1, bottom: 1 },
};

const DIRECT_NPS_1X1_CONFIG: ObjectRenderConfig = {
  ...DEFAULT_BUILDING_CONFIG,
  id: 'directNpsSingleTileAsset',
  category: 'park',
  footprint: { width: 1, height: 1 },
  scale: 1,
  anchor: { x: 0.5, y: 1 },
  offset: { x: 0, y: 0 },
  visualBase: { left: 0, right: 1, bottom: 1 },
};

export const OBJECT_RENDER_CONFIG: Record<string, Partial<ObjectRenderConfig>> = {
  road: { ...FLAT_TILE_CONFIG, id: 'road', category: 'road' },
  rail: { ...FLAT_TILE_CONFIG, id: 'rail', category: 'rail' },
  bridge: { ...FLAT_TILE_CONFIG, id: 'bridge', category: 'bridge' },
  water: { ...FLAT_TILE_CONFIG, id: 'water', category: 'water' },
  grass: { ...FLAT_TILE_CONFIG, id: 'grass', category: 'zone' },
  empty: { ...FLAT_TILE_CONFIG, id: 'empty', category: 'zone' },
  tree: {
    id: 'tree',
    category: 'tree',
    scale: 0.78,
    anchor: { x: 0.5, y: 0.94 },
    offset: { x: 0, y: 0 },
    visualBase: { left: 0.35, right: 0.65, bottom: 0.95 },
  },
  park: { id: 'park', category: 'park', scale: 0.9, visualBase: { left: 0.08, right: 0.92, bottom: 0.94 } },
  park_large: { id: 'park_large', category: 'park', scale: 0.92, visualBase: { left: 0.08, right: 0.92, bottom: 0.94 } },
  tennis: { id: 'tennis', category: 'park', scale: 0.9, visualBase: { left: 0.06, right: 0.94, bottom: 0.95 } },
  stadium: { id: 'stadium', category: 'transport', scale: 0.92, visualBase: { left: 0.06, right: 0.94, bottom: 0.94 } },
  airport: { id: 'airport', category: 'transport', scale: 0.96, visualBase: { left: 0.05, right: 0.95, bottom: 0.94 } },
  rail_station: { id: 'rail_station', category: 'transport', scale: 0.88, visualBase: { left: 0.08, right: 0.92, bottom: 0.93 } },
  subway_station: { id: 'subway_station', category: 'transport', scale: 0.82, visualBase: { left: 0.15, right: 0.85, bottom: 0.94 } },
  power_plant: { id: 'power_plant', category: 'utility', scale: 0.92, visualBase: { left: 0.08, right: 0.92, bottom: 0.94 } },
  water_tower: { id: 'water_tower', category: 'utility', scale: 0.82, visualBase: { left: 0.25, right: 0.75, bottom: 0.94 } },
  hospital: { id: 'hospital', category: 'service', scale: 0.9, visualBase: { left: 0.08, right: 0.92, bottom: 0.94 } },
  school: { id: 'school', category: 'service', scale: 0.92, visualBase: { left: 0.08, right: 0.92, bottom: 0.94 } },
  police_station: { id: 'police_station', category: 'service', scale: 0.92, visualBase: { left: 0.1, right: 0.9, bottom: 0.94 } },
  fire_station: { id: 'fire_station', category: 'service', scale: 0.92, visualBase: { left: 0.1, right: 0.9, bottom: 0.94 } },
  biomass_power_plant: { ...DIRECT_NPS_2X2_CONFIG, id: 'biomass_power_plant', category: 'utility' },
  floating_solar: { ...DIRECT_NPS_2X2_CONFIG, id: 'floating_solar', category: 'utility' },
  wood_chipping_plant: { ...DIRECT_NPS_2X2_CONFIG, id: 'wood_chipping_plant', category: 'utility' },
  biomass_plantation: { ...DIRECT_NPS_1X1_CONFIG, id: 'biomass_plantation', category: 'park' },
  harvested_plantation: { ...DIRECT_NPS_1X1_CONFIG, id: 'harvested_plantation', category: 'decoration' },
};

const CALIBRATION_STORAGE_KEY = 'nps-city-object-render-calibration';

function getRuntimeCalibration(objectType: string): ObjectRenderCalibration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const calibration = parsed?.[objectType];
    return calibration && typeof calibration === 'object' ? calibration : null;
  } catch {
    return null;
  }
}

function tileTopCorner(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2) + TILE_WIDTH / 2,
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

export function getFootprintForObject(objectType: string): GridFootprint {
  const size = getBuildingSize(objectType as BuildingType);
  const configured = OBJECT_RENDER_CONFIG[objectType]?.footprint;
  return configured ?? { width: size.width, height: size.height };
}

export function getFootprintPolygon(gridX: number, gridY: number, footprint: GridFootprint): FootprintPolygon {
  const top = tileTopCorner(gridX, gridY);
  const right = tileTopCorner(gridX + footprint.width, gridY);
  const bottom = tileTopCorner(gridX + footprint.width, gridY + footprint.height);
  const left = tileTopCorner(gridX, gridY + footprint.height);
  const points = [top, right, bottom, left];
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    top,
    right,
    bottom,
    left,
    center: {
      x: (top.x + right.x + bottom.x + left.x) / 4,
      y: (top.y + right.y + bottom.y + left.y) / 4,
    },
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

export function getObjectRenderConfig(objectType: string): ObjectRenderConfig {
  const override = OBJECT_RENDER_CONFIG[objectType] ?? {};
  const calibration = getRuntimeCalibration(objectType) ?? {};
  const base = objectType === 'road' || objectType === 'rail' || objectType === 'bridge' || objectType === 'water'
    ? FLAT_TILE_CONFIG
    : DEFAULT_BUILDING_CONFIG;
  const footprint = override.footprint ?? getFootprintForObject(objectType);

  return {
    ...base,
    ...override,
    ...calibration,
    id: override.id ?? objectType,
    footprint,
    anchor: { ...base.anchor, ...override.anchor, ...calibration.anchor },
    offset: { ...base.offset, ...override.offset, ...calibration.offset },
    visualBase: { ...base.visualBase, ...override.visualBase, ...calibration.visualBase },
  };
}

export function calculateSpritePlacement(
  objectType: string,
  gridX: number,
  gridY: number,
  sourceWidth: number,
  sourceHeight: number,
  renderScale = 1
): SpritePlacement {
  const config = getObjectRenderConfig(objectType);
  const footprint = getFootprintPolygon(gridX, gridY, config.footprint ?? getFootprintForObject(objectType));
  const visualBaseWidth = Math.max(0.05, config.visualBase.right - config.visualBase.left);
  const baseFitWidth = footprint.bounds.width / visualBaseWidth;
  const destWidth = baseFitWidth * config.scale * renderScale;
  const destHeight = destWidth * (sourceHeight / sourceWidth);
  const anchorPoint = {
    x: footprint.center.x + config.offset.x * TILE_WIDTH,
    y: footprint.bottom.y + config.offset.y * TILE_HEIGHT,
  };

  return {
    drawX: anchorPoint.x - destWidth * config.anchor.x,
    drawY: anchorPoint.y - destHeight * config.anchor.y,
    destWidth,
    destHeight,
    anchorPoint,
    footprint,
    config,
  };
}

export function drawFootprintPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: FootprintPolygon,
  options: { fill?: string; stroke?: string; lineWidth?: number; dash?: number[] } = {}
): void {
  const { fill, stroke = '#ffffff', lineWidth = 2, dash } = options;
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(polygon.top.x, polygon.top.y);
  ctx.lineTo(polygon.right.x, polygon.right.y);
  ctx.lineTo(polygon.bottom.x, polygon.bottom.y);
  ctx.lineTo(polygon.left.x, polygon.left.y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}
