'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { msg, useMessages } from 'gt-next';
import { useLocale } from 'gt-next/client';
import { useGame } from '@/context/GameContext';
import { Tool, TOOL_INFO } from '@/types/game';

// Translatable category labels
const CATEGORY_LABELS: Record<string, unknown> = {
  TOOLS: msg('Tools'),
  ZONES: msg('Zones'),
  tools: msg('Tools'),
  zones: msg('Zones'),
  zoning: msg('Zoning'),
  expandCity: msg('Expand City'),
  services: msg('Services'),
  parks: msg('Parks'),
  sports: msg('Sports'),
  waterfront: msg('Waterfront'),
  community: msg('Community'),
  utilities: msg('Utilities'),
  special: msg('Special'),
};

// UI labels for translation
const UI_LABELS = {
  budget: msg('Budget'),
  statistics: msg('Statistics'),
  advisors: msg('Advisors'),
  challenge: msg('NPS Challenge'),
  settings: msg('Settings'),
  buildings: msg('Buildings'),
  exitToMainMenu: msg('Exit to Main Menu'),
  exitDescription: msg('Would you like to save your city before exiting?'),
  exitWithoutSaving: msg('Exit Without Saving'),
  saveAndExit: msg('Save & Exit'),
};
import {
  BudgetIcon,
  ChartIcon,
  AdvisorIcon,
  TrophyIcon,
  SettingsIcon,
} from '@/components/ui/Icons';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { openCommandMenu } from '@/components/ui/CommandMenu';
import { Users } from 'lucide-react';
import { ShareModal } from '@/components/multiplayer/ShareModal';
import { useMultiplayerOptional } from '@/context/MultiplayerContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const THAI_TOOL_NAMES: Partial<Record<Tool, string>> = {
  select: 'เลือก',
  bulldoze: 'รื้อถอน',
  road: 'ถนน',
  rail: 'รางรถไฟ',
  subway: 'รถไฟใต้ดิน',
  expand_city: 'ขยายเมือง',
  shrink_city: 'ลดขนาดเมือง',
  zone_residential: 'ที่อยู่อาศัย',
  zone_commercial: 'พาณิชย์',
  zone_industrial: 'อุตสาหกรรม',
  zone_dezone: 'ลบโซน',
  zone_water: 'ปรับพื้นที่เป็นน้ำ',
  zone_land: 'ปรับพื้นที่เป็นดิน',
  tree: 'ต้นไม้',
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
  bleachers_field: 'สนามพร้อมอัฒจันทร์',
  go_kart_track: 'สนามโกคาร์ต',
  amphitheater: 'ลานการแสดง',
  greenhouse_garden: 'เรือนกระจก',
  animal_pens_farm: 'คอกสัตว์',
  cabin_house: 'บ้านไม้',
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

// Hover Submenu Component for collapsible tool categories
// Implements triangle-rule safe zone for forgiving cursor navigation
const HoverSubmenu = React.memo(function HoverSubmenu({
  label,
  tools,
  selectedTool,
  money,
  onSelectTool,
  forceOpenUpward = false,
}: {
  label: unknown; // Message object from msg() for translation
  tools: Tool[];
  selectedTool: Tool;
  money: number;
  onSelectTool: (tool: Tool) => void;
  forceOpenUpward?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, buttonHeight: 0, openUpward: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const m = useMessages();
  const locale = useLocale();
  const isThai = locale?.toLowerCase().startsWith('th');
  
  const hasSelectedTool = tools.includes(selectedTool);
  const SUBMENU_GAP = 12; // Gap between sidebar and submenu
  const SUBMENU_MAX_HEIGHT = 220; // Approximate max height of submenu
  
  const clearCloseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const handleMouseEnter = useCallback(() => {
    clearCloseTimeout();
    // Calculate position based on button location
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Check if opening downward would overflow the screen
      const spaceBelow = viewportHeight - rect.top;
      const openUpward = forceOpenUpward || (spaceBelow < SUBMENU_MAX_HEIGHT && rect.top > SUBMENU_MAX_HEIGHT);
      
      setMenuPosition({
        top: openUpward ? rect.bottom : rect.top,
        left: rect.right + SUBMENU_GAP,
        buttonHeight: rect.height,
        openUpward,
      });
    }
    setIsOpen(true);
  }, [clearCloseTimeout, forceOpenUpward]);
  
  // Triangle rule: Check if cursor is moving toward the submenu
  const isMovingTowardSubmenu = useCallback((e: React.MouseEvent) => {
    if (!lastMousePos.current || !submenuRef.current) return false;
    
    const submenuRect = submenuRef.current.getBoundingClientRect();
    const currentX = e.clientX;
    const currentY = e.clientY;
    const lastX = lastMousePos.current.x;
    const lastY = lastMousePos.current.y;
    
    // Check if moving rightward (toward submenu)
    const movingRight = currentX > lastX;
    
    // Check if cursor is within vertical bounds of submenu (with generous padding)
    const padding = 50;
    const withinVerticalBounds = 
      currentY >= submenuRect.top - padding && 
      currentY <= submenuRect.bottom + padding;
    
    return movingRight && withinVerticalBounds;
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);
  
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    // If moving toward submenu, use a longer delay
    const delay = isMovingTowardSubmenu(e) ? 300 : 100;
    
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, delay);
  }, [clearCloseTimeout, isMovingTowardSubmenu]);

  const handleButtonClick = useCallback(() => {
    clearCloseTimeout();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.top;
      const openUpward = forceOpenUpward || (spaceBelow < SUBMENU_MAX_HEIGHT && rect.top > SUBMENU_MAX_HEIGHT);

      setMenuPosition({
        top: openUpward ? rect.bottom : rect.top,
        left: rect.right + SUBMENU_GAP,
        buttonHeight: rect.height,
        openUpward,
      });
    }
    setIsOpen(true);
  }, [clearCloseTimeout, forceOpenUpward, isOpen]);
  
  const handleSubmenuEnter = useCallback(() => {
    clearCloseTimeout();
  }, [clearCloseTimeout]);
  
  const handleSubmenuLeave = useCallback(() => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  }, [clearCloseTimeout]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Category Header Button */}
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        variant={hasSelectedTool ? 'default' : 'ghost'}
        className={`w-full justify-between gap-2 px-3 py-2.5 h-auto text-sm rounded-2xl group transition-all duration-200 ${
          hasSelectedTool ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-[0_8px_18px_rgba(56,149,220,0.22)]' : 'hover:bg-sky-50 text-slate-600 hover:text-slate-900'
        } ${isOpen && !hasSelectedTool ? 'bg-sky-50' : ''}`}
      >
        <span className="font-medium">{m(label as Parameters<typeof m>[0])}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
      
      {/* Invisible bridge/safe-zone between button and submenu for triangle rule */}
      {isOpen && (
        <div
          className="fixed"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left - SUBMENU_GAP}px`,
            width: `${SUBMENU_GAP + 8}px`, // Overlap slightly with submenu
            height: `${Math.max(menuPosition.buttonHeight, 200)}px`, // Tall enough to cover path
            zIndex: 9998,
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        />
      )}
      
      {/* Flyout Submenu - uses fixed positioning to escape all parent containers */}
      {isOpen && (
        <div 
          ref={submenuRef}
          className="fixed w-52 nps-glass-panel rounded-2xl overflow-hidden animate-submenu-in"
          style={{ 
            zIndex: 9999,
            ...(menuPosition.openUpward 
              ? { bottom: `${window.innerHeight - menuPosition.top}px` }
              : { top: `${menuPosition.top}px` }),
            left: `${menuPosition.left}px`,
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="px-4 py-3 border-b border-sidebar-border/50 bg-sky-50/70">
            <span className="nps-soft-label">{m(label as Parameters<typeof m>[0])}</span>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {tools.map(tool => {
              const info = TOOL_INFO[tool];
              if (!info) return null;
              const isSelected = selectedTool === tool;
              const canAfford = money >= info.cost;
              
              return (
                <Button
                  key={tool}
                  onClick={() => {
                    onSelectTool(tool);
                    setIsOpen(false);
                  }}
                  disabled={!canAfford && info.cost > 0}
                  variant={isSelected ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-2 px-3 py-2 h-auto text-sm rounded-xl transition-all duration-150 ${
                    isSelected ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-sm' : 'hover:bg-sky-50'
                  }`}
                  title={`${m(info.description)} - Cost: $${info.cost.toLocaleString()}`}
                >
                  <span className="flex-1 text-left truncate">
                    {isThai && THAI_TOOL_NAMES[tool] ? THAI_TOOL_NAMES[tool] : String(m(info.name))}
                  </span>
                  <span className={`text-xs ${isSelected ? 'opacity-80' : 'opacity-50'}`}>${info.cost.toLocaleString()}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// Action Submenu Component for executing actions (like expand/shrink city)
const ActionSubmenu = React.memo(function ActionSubmenu({
  label,
  actions,
}: {
  label: unknown;
  actions: { key: string; name: unknown; description: string; onClick: () => void }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, buttonHeight: 0, openUpward: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const m = useMessages();
  const locale = useLocale();
  const isThai = locale?.toLowerCase().startsWith('th');
  
  const SUBMENU_GAP = 12;
  const SUBMENU_MAX_HEIGHT = 220;
  
  const clearCloseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const handleMouseEnter = useCallback(() => {
    clearCloseTimeout();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.top;
      const openUpward = spaceBelow < SUBMENU_MAX_HEIGHT && rect.top > SUBMENU_MAX_HEIGHT;
      
      setMenuPosition({
        top: openUpward ? rect.bottom : rect.top,
        left: rect.right + SUBMENU_GAP,
        buttonHeight: rect.height,
        openUpward,
      });
    }
    setIsOpen(true);
  }, [clearCloseTimeout]);
  
  const isMovingTowardSubmenu = useCallback((e: React.MouseEvent) => {
    if (!lastMousePos.current || !submenuRef.current) return false;
    
    const submenuRect = submenuRef.current.getBoundingClientRect();
    const currentX = e.clientX;
    const currentY = e.clientY;
    const lastX = lastMousePos.current.x;
    
    const movingRight = currentX > lastX;
    const padding = 50;
    const withinVerticalBounds = 
      currentY >= submenuRect.top - padding && 
      currentY <= submenuRect.bottom + padding;
    
    return movingRight && withinVerticalBounds;
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);
  
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const delay = isMovingTowardSubmenu(e) ? 300 : 100;
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, delay);
  }, [clearCloseTimeout, isMovingTowardSubmenu]);

  const handleButtonClick = useCallback(() => {
    clearCloseTimeout();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.top;
      const openUpward = spaceBelow < SUBMENU_MAX_HEIGHT && rect.top > SUBMENU_MAX_HEIGHT;

      setMenuPosition({
        top: openUpward ? rect.bottom : rect.top,
        left: rect.right + SUBMENU_GAP,
        buttonHeight: rect.height,
        openUpward,
      });
    }
    setIsOpen(true);
  }, [clearCloseTimeout, isOpen]);
  
  const handleSubmenuEnter = useCallback(() => {
    clearCloseTimeout();
  }, [clearCloseTimeout]);
  
  const handleSubmenuLeave = useCallback(() => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  }, [clearCloseTimeout]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        variant="ghost"
        className={`w-full justify-between gap-2 px-3 py-2.5 h-auto text-sm rounded-2xl group transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-sky-50 ${isOpen ? 'bg-sky-50' : ''}`}
      >
        <span className="font-medium">{m(label as Parameters<typeof m>[0])}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
      
      {isOpen && (
        <div
          className="fixed"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left - SUBMENU_GAP}px`,
            width: `${SUBMENU_GAP + 8}px`,
            height: `${Math.max(menuPosition.buttonHeight, 200)}px`,
            zIndex: 9998,
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        />
      )}
      
      {isOpen && (
        <div 
          ref={submenuRef}
          className="fixed w-52 nps-glass-panel rounded-2xl overflow-hidden animate-submenu-in"
          style={{ 
            zIndex: 9999,
            ...(menuPosition.openUpward 
              ? { bottom: `${window.innerHeight - menuPosition.top}px` }
              : { top: `${menuPosition.top}px` }),
            left: `${menuPosition.left}px`,
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="px-4 py-3 border-b border-sidebar-border/50 bg-sky-50/70">
            <span className="nps-soft-label">{m(label as Parameters<typeof m>[0])}</span>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {actions.map(action => (
                <Button
                  key={action.key}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                variant="ghost"
                className="w-full justify-start gap-2 px-3 py-2 h-auto text-sm rounded-xl transition-all duration-150 hover:bg-sky-50"
                title={action.description}
              >
                <span className="flex-1 text-left truncate">
                  {isThai && THAI_TOOL_NAMES[action.key as Tool]
                    ? THAI_TOOL_NAMES[action.key as Tool]
                    : m(action.name as Parameters<typeof m>[0])}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Exit confirmation dialog component
function ExitDialog({ 
  open, 
  onOpenChange, 
  onSaveAndExit, 
  onExitWithoutSaving 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
}) {
  const m = useMessages();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m(UI_LABELS.exitToMainMenu)}</DialogTitle>
          <DialogDescription>
            {m(UI_LABELS.exitDescription)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onExitWithoutSaving}
            className="w-full sm:w-auto"
          >
            {m(UI_LABELS.exitWithoutSaving)}
          </Button>
          <Button
            onClick={onSaveAndExit}
            className="w-full sm:w-auto"
          >
            {m(UI_LABELS.saveAndExit)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Memoized Sidebar Component
export const Sidebar = React.memo(function Sidebar({ onExit }: { onExit?: () => void }) {
  const { state, setTool, setActivePanel, saveCity, expandCity, shrinkCity } = useGame();
  const { selectedTool, stats, activePanel } = state;
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const multiplayer = useMultiplayerOptional();
  const locale = useLocale();
  const isThai = locale?.toLowerCase().startsWith('th');
  const m = useMessages();
  const getToolName = useCallback((tool: Tool) => {
    const fallback = THAI_TOOL_NAMES[tool];
    return isThai && fallback ? fallback : String(m(TOOL_INFO[tool].name));
  }, [isThai, m]);
  
  const handleSaveAndExit = useCallback(() => {
    saveCity();
    setShowExitDialog(false);
    onExit?.();
  }, [saveCity, onExit]);
  
  const handleExitWithoutSaving = useCallback(() => {
    setShowExitDialog(false);
    onExit?.();
  }, [onExit]);
  
  // Direct tool categories (shown inline)
  const directCategories = useMemo(() => ({
    'TOOLS': ['select', 'bulldoze', 'road', 'rail', 'subway'] as Tool[],
    'ZONES': ['zone_residential', 'zone_commercial', 'zone_industrial'] as Tool[],
  }), []);
  
  // Zoning submenu (shown under ZONES section, before BUILDINGS)
  const zoningSubmenu = useMemo(() => ({
    key: 'zoning',
    label: CATEGORY_LABELS.zoning,
    tools: ['zone_dezone', 'zone_water', 'zone_land'] as Tool[]
  }), []);
  
  // Expand City submenu (shown under TOOLS section)
  const expandCityActions = useMemo(() => [
    {
      key: 'expand_city',
      name: TOOL_INFO['expand_city'].name,
      description: 'Add 15 tiles to each edge of the city',
      onClick: expandCity,
    },
    {
      key: 'shrink_city',
      name: TOOL_INFO['shrink_city'].name,
      description: 'Remove 15 tiles from each edge of the city',
      onClick: shrinkCity,
    },
  ], [expandCity, shrinkCity]);
  
  // Submenu categories (hover to expand) - includes all new assets from main
  const submenuCategories = useMemo(() => [
    { 
      key: 'services', 
      label: CATEGORY_LABELS.services, 
      tools: ['police_station', 'fire_station', 'hospital', 'school', 'university'] as Tool[]
    },
    { 
      key: 'parks', 
      label: CATEGORY_LABELS.parks, 
      tools: ['tree', 'park', 'park_large', 'tennis', 'playground_small', 'playground_large', 'community_garden', 'pond_park', 'park_gate', 'greenhouse_garden', 'mini_golf_course', 'go_kart_track', 'amphitheater', 'roller_coaster_small', 'campground', 'cabin_house', 'mountain_lodge', 'mountain_trailhead'] as Tool[]
    },
    { 
      key: 'sports', 
      label: CATEGORY_LABELS.sports, 
      tools: ['basketball_courts', 'soccer_field_small', 'baseball_field_small', 'football_field', 'baseball_stadium', 'swimming_pool', 'skate_park', 'bleachers_field'] as Tool[]
    },
    { 
      key: 'waterfront', 
      label: CATEGORY_LABELS.waterfront, 
      tools: ['marina_docks_small', 'pier_large'] as Tool[]
    },
    { 
      key: 'community', 
      label: CATEGORY_LABELS.community, 
      tools: ['community_center', 'animal_pens_farm', 'office_building_small'] as Tool[]
    },
    { 
      key: 'utilities', 
      label: CATEGORY_LABELS.utilities, 
      tools: ['power_plant', 'water_tower', 'subway_station', 'rail_station'] as Tool[],
      forceOpenUpward: true
    },
    { 
      key: 'special', 
      label: CATEGORY_LABELS.special, 
      tools: ['stadium', 'museum', 'airport', 'space_program', 'city_hall', 'amusement_park'] as Tool[],
      forceOpenUpward: true
    },
  ], []);
  
  return (
    <div className="w-56 nps-glass-panel rounded-r-[28px] border-l-0 flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden">
      <div className="px-4 py-4 border-b border-sidebar-border/70 bg-gradient-to-br from-white via-sky-50/70 to-cyan-50/70">
        <div className="flex items-center justify-between">
          <span className="text-sidebar-foreground font-extrabold tracking-tight text-lg">NPS City</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={openCommandMenu}
              title="Search (⌘K)"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-white hover:text-sky-600"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>
            {/* Invite button - only show if in multiplayer context */}
            {multiplayer && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowShareModal(true)}
                title="Invite Players"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-white hover:text-sky-600"
              >
                <Users className="w-4 h-4" />
              </Button>
            )}
            {onExit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowExitDialog(true)}
                title="Exit to Main Menu"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-white hover:text-sky-600"
              >
                <svg 
                  className="w-4 h-4 -scale-x-100" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 py-2">
        {/* Direct categories (TOOLS, ZONES) */}
        {Object.entries(directCategories).map(([category, tools]) => (
          <div key={category} className="mb-1">
            {/* Separator above ZONES */}
            {category === 'ZONES' && (
              <div className="mx-4 my-3 h-px bg-sidebar-border/60" />
            )}
            <div className="px-4 py-2 nps-soft-label">
              {m((CATEGORY_LABELS[category] || category) as Parameters<typeof m>[0])}
            </div>
            <div className="px-2 flex flex-col gap-1">
              {tools.map(tool => {
                const info = TOOL_INFO[tool];
                if (!info) return null;
                const isSelected = selectedTool === tool;
                const canAfford = stats.money >= info.cost;
                
                return (
                  <Button
                    key={tool}
                    onClick={() => setTool(tool)}
                    disabled={!canAfford && info.cost > 0}
                    variant={isSelected ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm rounded-2xl font-semibold ${
                      isSelected ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-[0_8px_18px_rgba(56,149,220,0.24)]' : 'hover:bg-sky-50 text-slate-600 hover:text-slate-900'
                    }`}
                    title={`${m(info.description)}${info.cost > 0 ? ` - Cost: $${info.cost}` : ''}`}
                  >
                    <span className="flex-1 text-left truncate">{getToolName(tool)}</span>
                    {info.cost > 0 && (
                      <span className="text-xs opacity-60">${info.cost}</span>
                    )}
                  </Button>
                );
              })}
              {/* Expand City submenu - appears after TOOLS category */}
              {category === 'TOOLS' && (
                <ActionSubmenu
                  key="expandCity"
                  label={CATEGORY_LABELS.expandCity}
                  actions={expandCityActions}
                />
              )}
              {/* Zoning submenu - appears after ZONES category */}
              {category === 'ZONES' && (
                <HoverSubmenu
                  key={zoningSubmenu.key}
                  label={zoningSubmenu.label}
                  tools={zoningSubmenu.tools}
                  selectedTool={selectedTool}
                  money={stats.money}
                  onSelectTool={setTool}
                />
              )}
            </div>
          </div>
        ))}
        
        {/* Separator */}
        <div className="mx-4 my-3 h-px bg-sidebar-border/60" />
        
        {/* Buildings header */}
        <div className="px-4 py-2 nps-soft-label">
          {isThai ? 'อาคาร' : m(UI_LABELS.buildings)}
        </div>
        
        {/* Submenu categories */}
        <div className="px-2 flex flex-col gap-1">
          {submenuCategories.map(({ key, label, tools, forceOpenUpward }) => (
            <HoverSubmenu
              key={key}
              label={label}
              tools={tools}
              selectedTool={selectedTool}
              money={stats.money}
              onSelectTool={setTool}
              forceOpenUpward={forceOpenUpward}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="border-t border-sidebar-border/70 bg-white/70 p-2">
        <div className="grid grid-cols-5 gap-1">
          {[
            { panel: 'budget' as const, icon: <BudgetIcon size={16} />, labelKey: 'budget' as const },
            { panel: 'statistics' as const, icon: <ChartIcon size={16} />, labelKey: 'statistics' as const },
            { panel: 'advisors' as const, icon: <AdvisorIcon size={16} />, labelKey: 'advisors' as const },
            { panel: 'challenge' as const, icon: <TrophyIcon size={16} />, labelKey: 'challenge' as const },
            { panel: 'settings' as const, icon: <SettingsIcon size={16} />, labelKey: 'settings' as const },
          ].map(({ panel, icon, labelKey }) => (
            <Button
              key={panel}
              onClick={() => setActivePanel(activePanel === panel ? 'none' : panel)}
              variant={activePanel === panel ? 'default' : 'ghost'}
              size="icon-sm"
              className="w-full rounded-2xl"
              title={String(m(UI_LABELS[labelKey]))}
            >
              {icon}
            </Button>
          ))}
        </div>
      </div>
      
      <ExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
      />
      
      {multiplayer && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
        />
      )}
    </div>
  );
});

export default Sidebar;
