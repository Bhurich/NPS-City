'use client';

import React, { useMemo } from 'react';
import { Tile, BuildingType, TOOL_INFO, Tool } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CloseIcon } from '@/components/ui/Icons';
import { useGame } from '@/context/GameContext';
import { 
  SERVICE_CONFIG, 
  SERVICE_BUILDING_TYPES,
  SERVICE_MAX_LEVEL,
  SERVICE_RANGE_INCREASE_PER_LEVEL,
  SERVICE_UPGRADE_COST_BASE,
} from '@/lib/simulation';

interface TileInfoPanelProps {
  tile: Tile;
  services: {
    police: number[][];
    fire: number[][];
    health: number[][];
    education: number[][];
    power: boolean[][];
    water: boolean[][];
  };
  onClose: () => void;
  isMobile?: boolean;
}

const BUILDING_LABELS: Partial<Record<BuildingType, string>> = {
  empty: 'ช่องว่าง',
  grass: 'พื้นหญ้า',
  water: 'น้ำ',
  road: 'ถนน',
  bridge: 'สะพาน',
  rail: 'รางรถไฟ',
  tree: 'ต้นไม้',
  house_small: 'บ้านเล็ก',
  house_medium: 'บ้านกลาง',
  mansion: 'คฤหาสน์',
  apartment_low: 'อพาร์ตเมนต์เตี้ย',
  apartment_high: 'อพาร์ตเมนต์สูง',
  shop_small: 'ร้านค้าเล็ก',
  shop_medium: 'ร้านค้ากลาง',
  office_low: 'สำนักงานเตี้ย',
  office_high: 'สำนักงานสูง',
  mall: 'ศูนย์การค้า',
  factory_small: 'โรงงานเล็ก',
  factory_medium: 'โรงงานกลาง',
  factory_large: 'โรงงานใหญ่',
  warehouse: 'คลังสินค้า',
  police_station: 'สถานีตำรวจ',
  fire_station: 'สถานีดับเพลิง',
  hospital: 'โรงพยาบาล',
  school: 'โรงเรียน',
  university: 'มหาวิทยาลัย',
  park: 'สวนเล็ก',
  park_large: 'สวนใหญ่',
  tennis: 'สนามเทนนิส',
  power_plant: 'โรงไฟฟ้า',
  water_tower: 'หอเก็บน้ำ',
  subway_station: 'สถานีรถไฟใต้ดิน',
  rail_station: 'สถานีรถไฟ',
  stadium: 'สนามกีฬา',
  museum: 'พิพิธภัณฑ์',
  airport: 'สนามบิน',
  space_program: 'ศูนย์อวกาศ',
  city_hall: 'ศาลากลาง',
  amusement_park: 'สวนสนุก',
  basketball_courts: 'สนามบาสเกตบอล',
  playground_small: 'สนามเด็กเล่นเล็ก',
  playground_large: 'สนามเด็กเล่นใหญ่',
  baseball_field_small: 'สนามเบสบอล',
  soccer_field_small: 'สนามฟุตบอล',
  football_field: 'สนามอเมริกันฟุตบอล',
  baseball_stadium: 'สนามเบสบอลใหญ่',
  community_center: 'ศูนย์ชุมชน',
  office_building_small: 'อาคารสำนักงาน',
  swimming_pool: 'สระว่ายน้ำ',
  skate_park: 'ลานสเก็ต',
  mini_golf_course: 'มินิกอล์ฟ',
  bleachers_field: 'อัฒจันทร์',
  go_kart_track: 'สนามโกคาร์ต',
  amphitheater: 'ลานการแสดง',
  greenhouse_garden: 'เรือนกระจก',
  animal_pens_farm: 'ฟาร์มสัตว์',
  cabin_house: 'บ้านพักไม้',
  campground: 'ลานตั้งแคมป์',
  marina_docks_small: 'ท่าเรือเล็ก',
  pier_large: 'สะพานท่าเรือ',
  roller_coaster_small: 'รถไฟเหาะ',
  community_garden: 'สวนชุมชน',
  pond_park: 'สวนบ่อน้ำ',
  park_gate: 'ประตูสวน',
  mountain_lodge: 'บ้านพักภูเขา',
  mountain_trailhead: 'ทางเดินเขา',
};

const ZONE_LABELS = {
  none: 'ไม่ได้กำหนดโซน',
  residential: 'ที่อยู่อาศัย',
  commercial: 'พาณิชย์',
  industrial: 'อุตสาหกรรม',
};

function getBuildingLabel(type: BuildingType) {
  return BUILDING_LABELS[type] ?? type.replace(/_/g, ' ');
}

export function TileInfoPanel({ 
  tile, 
  services, 
  onClose,
  isMobile = false
}: TileInfoPanelProps) {
  const { x, y } = tile;
  const { state, upgradeServiceBuilding } = useGame();
  
  // Check if this is a service building
  const isServiceBuilding = SERVICE_BUILDING_TYPES.has(tile.building.type);
  
  // Calculate upgrade cost and info for service buildings
  const upgradeInfo = useMemo(() => {
    if (!isServiceBuilding) return null;
    
    const buildingType = tile.building.type;
    // Service buildings are also Tools, so we can safely cast
    const baseCost = (TOOL_INFO as Record<string, { cost: number }>)[buildingType]?.cost ?? 0;
    const currentLevel = tile.building.level;
    
    if (currentLevel >= SERVICE_MAX_LEVEL) return null;
    
    const upgradeCost = baseCost * Math.pow(SERVICE_UPGRADE_COST_BASE, currentLevel);
    const canAfford = state.stats.money >= upgradeCost;
    const isUnderConstruction = tile.building.constructionProgress !== undefined && tile.building.constructionProgress < 100;
    const isAbandoned = tile.building.abandoned;
    
    // Get base range and calculate effective range
    const config = SERVICE_CONFIG[buildingType as keyof typeof SERVICE_CONFIG];
    const baseRange = config?.range ?? 0;
    const currentEffectiveRange = Math.floor(baseRange * (1 + (currentLevel - 1) * SERVICE_RANGE_INCREASE_PER_LEVEL));
    const nextEffectiveRange = Math.floor(baseRange * (1 + currentLevel * SERVICE_RANGE_INCREASE_PER_LEVEL));
    
    return {
      cost: upgradeCost,
      canAfford,
      isUnderConstruction,
      isAbandoned,
      currentLevel,
      maxLevel: SERVICE_MAX_LEVEL,
      baseRange,
      currentEffectiveRange,
      nextEffectiveRange,
    };
  }, [isServiceBuilding, tile.building, state.stats.money]);
  
  const handleUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!upgradeInfo || !upgradeInfo.canAfford) return;
    const success = upgradeServiceBuilding(x, y);
    if (success) {
      // Optionally add notification here
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <Card 
      className={`${isMobile ? 'fixed left-0 right-0 w-full rounded-none border-x-0 border-t border-b z-30' : 'absolute top-4 right-4 w-72 z-50'}`} 
      style={isMobile ? { top: 'calc(72px + env(safe-area-inset-top, 0px))' } : undefined}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-sans">ช่อง ({x}, {y})</CardTitle>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <CloseIcon size={14} />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">สิ่งปลูกสร้าง</span>
          <span>{getBuildingLabel(tile.building.type)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">โซน</span>
          <Badge variant={
            tile.zone === 'residential' ? 'default' :
            tile.zone === 'commercial' ? 'secondary' :
            tile.zone === 'industrial' ? 'outline' : 'secondary'
          } className={
            tile.zone === 'residential' ? 'bg-green-500/20 text-green-400' :
            tile.zone === 'commercial' ? 'bg-blue-500/20 text-blue-400' :
            tile.zone === 'industrial' ? 'bg-amber-500/20 text-amber-400' : ''
          }>
            {ZONE_LABELS[tile.zone]}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ระดับ</span>
          <span>{tile.building.level}/5</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ประชากร</span>
          <span>{tile.building.population}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">งาน</span>
          <span>{tile.building.jobs}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">ไฟฟ้า</span>
          <Badge variant={tile.building.powered ? 'default' : 'destructive'}>
            {tile.building.powered ? 'เชื่อมต่อแล้ว' : 'ไม่มีไฟฟ้า'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">น้ำ</span>
          <Badge variant={tile.building.watered ? 'default' : 'destructive'} className={tile.building.watered ? 'bg-cyan-500/20 text-cyan-400' : ''}>
            {tile.building.watered ? 'เชื่อมต่อแล้ว' : 'ไม่มีน้ำ'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">มูลค่าที่ดิน</span>
          <span>${tile.landValue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">มลพิษ</span>
          <span className={tile.pollution > 50 ? 'text-red-400' : tile.pollution > 25 ? 'text-amber-400' : 'text-green-400'}>
            {Math.round(tile.pollution)}%
          </span>
        </div>
        
        {tile.building.onFire && (
          <>
            <Separator />
            <div className="flex justify-between text-red-400">
              <span>ไฟไหม้!</span>
              <span>เสียหาย {Math.round(tile.building.fireProgress)}%</span>
            </div>
          </>
        )}
        
        <Separator />
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">พื้นที่บริการครอบคลุม</div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ตำรวจ</span>
            <span>{Math.round(services.police[y][x])}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ดับเพลิง</span>
            <span>{Math.round(services.fire[y][x])}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">สุขภาพ</span>
            <span>{Math.round(services.health[y][x])}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">การศึกษา</span>
            <span>{Math.round(services.education[y][x])}%</span>
          </div>
        </div>
        
        {upgradeInfo && (
          <>
            <Separator />
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">อัปเกรด</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ระยะครอบคลุม</span>
                <span className="font-mono">
                  {upgradeInfo.currentEffectiveRange} → {upgradeInfo.nextEffectiveRange} ช่อง
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ค่าอัปเกรด</span>
                <span className={`font-mono ${upgradeInfo.canAfford ? 'text-foreground' : 'text-red-400'}`}>
                  ${upgradeInfo.cost.toLocaleString()}
                </span>
              </div>
              <Button
                onClick={handleUpgrade}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={!upgradeInfo.canAfford || upgradeInfo.isUnderConstruction || upgradeInfo.isAbandoned}
                className="w-full"
                size="sm"
              >
                อัปเกรดเป็นระดับ {upgradeInfo.currentLevel + 1}
              </Button>
              {!upgradeInfo.canAfford && (
                <p className="text-xs text-muted-foreground text-center">
                  เงินไม่พอ
                </p>
              )}
              {upgradeInfo.isUnderConstruction && (
                <p className="text-xs text-muted-foreground text-center">
                  กำลังก่อสร้าง
                </p>
              )}
              {upgradeInfo.isAbandoned && (
                <p className="text-xs text-muted-foreground text-center">
                  อาคารถูกทิ้งร้าง
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
