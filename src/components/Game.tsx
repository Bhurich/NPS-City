'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { Tool } from '@/types/game';
import { useMobile } from '@/hooks/useMobile';
import { MobileToolbar } from '@/components/mobile/MobileToolbar';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { msg, useMessages, useGT } from 'gt-next';

// Import shadcn components
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCheatCodes } from '@/hooks/useCheatCodes';
import { VinnieDialog } from '@/components/VinnieDialog';
import { CommandMenu } from '@/components/ui/CommandMenu';
import { TipToast } from '@/components/ui/TipToast';
import { useTipSystem } from '@/hooks/useTipSystem';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import { useCopyRoomLink } from '@/hooks/useCopyRoomLink';
import { useMultiplayerOptional } from '@/context/MultiplayerContext';
import { ShareModal } from '@/components/multiplayer/ShareModal';
import { Check, Copy, HelpCircle, Trophy, Zap } from 'lucide-react';

// Import game components
import { OverlayMode } from '@/components/game/types';
import { getOverlayForTool } from '@/components/game/overlays';
import { OverlayModeToggle } from '@/components/game/OverlayModeToggle';
import { Sidebar } from '@/components/game/Sidebar';
import {
  BudgetPanel,
  StatisticsPanel,
  SettingsPanel,
  AdvisorsPanel,
  NpsChallengePanel,
} from '@/components/game/panels';
import { MiniMap } from '@/components/game/MiniMap';
import { TopBar, StatsPanel } from '@/components/game/TopBar';
import { CanvasIsometricGrid } from '@/components/game/CanvasIsometricGrid';

// Cargo type names for notifications
const CARGO_TYPE_NAMES = [msg('containers'), msg('bulk materials'), msg('oil')];
const STARTER_GUIDE_KEY = 'nps-city-starter-guide-seen-v3';
const POWER_PLANT_QUESTION_KEY = 'nps-city-power-question-seen-v1';

function StarterGuideDialog({
  open,
  onOpenChange,
  onCreateStarterCity,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStarterCity: () => void;
}) {
  const handleChooseSelfBuild = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STARTER_GUIDE_KEY, 'true');
    }
    onOpenChange(false);
  };

  const handleCreateStarter = () => {
    onCreateStarterCity();
    handleChooseSelfBuild();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (nextOpen) onOpenChange(true);
    }}>
      <DialogContent
        className="max-h-[92vh] max-w-[720px] overflow-y-auto rounded-[28px] border-white/70 bg-white/95 shadow-[0_24px_70px_rgba(79,128,166,0.22)]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            เริ่มเล่น NPS City ปี 2026
          </DialogTitle>
          <DialogDescription>
            เป้าหมายคือสร้างเมืองอุตสาหกรรมและพลังงานให้โตไว สมดุล และน่าอยู่ ภายในแคมเปญ 14 วัน
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-blue-950">
            <div className="flex items-center gap-2 font-semibold">
              <Zap className="h-4 w-4" />
              วิธีเริ่มให้ไม่งง
            </div>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-blue-900/85">
              <li>วางถนนเป็นแกนหลักของเมืองก่อน</li>
              <li>วางโซนที่อยู่อาศัย พาณิชย์ และอุตสาหกรรมให้ติดถนน</li>
              <li>เพิ่มโรงไฟฟ้า ถังน้ำ สวน และบริการพื้นฐาน</li>
              <li>กดปุ่มเล่นเวลา บ้าน โรงงาน คน งาน และรายได้จะเกิดขึ้นเอง</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-950">
            <div className="flex items-center gap-2 font-semibold">
              <Trophy className="h-4 w-4" />
              เงื่อนไขผู้ชนะ
            </div>
            <div className="mt-2 space-y-1.5 text-emerald-900/85">
              <div>แข่ง 14 วันในเกม วัดจากคะแนน NPS City Score สูงสุด</div>
              <div>คะแนนคิดจากเศรษฐกิจ พลังงาน สิ่งแวดล้อม ชุมชน และความปลอดภัย</div>
              <div>ภารกิจ NPS ให้เงินรางวัลและคะแนนเสริมสำหรับคนที่วางแผนดี</div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-amber-950">
            <div className="font-semibold">หาเงินให้ทันใน 2 สัปดาห์</div>
            <div className="mt-2 space-y-1.5 text-amber-900/85">
              <div>รายได้มาจากประชากร งาน และโซนที่พัฒนาแล้ว</div>
              <div>ทำภารกิจให้สำเร็จเพื่อรับเงินก้อนและเร่งการขยายเมือง</div>
              <div>อย่าสร้างอุตสาหกรรมอย่างเดียวจนมลพิษสูง เพราะคะแนนชุมชนจะตก</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-slate-950">
            <div className="font-semibold">คำถามสุ่มจากโรงไฟฟ้า</div>
            <div className="mt-2 space-y-1.5 text-slate-700">
              <div>เมื่อผู้เล่นสร้างโรงไฟฟ้า เกมจะแสดงคำถามสั้นๆ เกี่ยวกับพลังงาน</div>
              <div>ตอนนี้ผมเตรียมช่องไว้ก่อน คุณส่งชุดคำถามจริงมาเมื่อไรก็ใส่ต่อได้ทันที</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleChooseSelfBuild}>
            สร้างเอง
          </Button>
          <Button onClick={handleCreateStarter}>
            สร้างให้
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PowerPlantQuestionDialog({
  open,
  onOpenChange,
  onAnswer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnswer: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] rounded-[28px] border-white/70 bg-white/95 shadow-[0_24px_70px_rgba(79,128,166,0.22)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            คำถามจากโรงไฟฟ้า
          </DialogTitle>
          <DialogDescription>
            ตัวอย่างระบบคำถามสุ่ม เมื่อได้ชุดคำถามจริงจาก NPS แล้ว ผมจะเปลี่ยนข้อความและตัวเลือกตรงนี้ให้ครบ
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="font-semibold">โรงไฟฟ้ามีบทบาทสำคัญกับเมืองอย่างไร?</div>
          <div className="mt-2 text-amber-900/80">
            เลือกคำตอบเพื่อรับทราบ ระบบนี้จะต่อยอดเป็นคะแนนความรู้หรือโบนัสภารกิจได้
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onAnswer}>
            ไว้ตอบทีหลัง
          </Button>
          <Button onClick={onAnswer}>
            ช่วยให้เมืองมีไฟฟ้ามั่นคง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Game({ onExit }: { onExit?: () => void }) {
  const gt = useGT();
  const m = useMessages();
  const { state, setTool, setActivePanel, addMoney, addNotification, setSpeed, createStarterCity } = useGame();
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [showStarterGuide, setShowStarterGuide] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STARTER_GUIDE_KEY) !== 'true';
  });
  const [showPowerPlantQuestion, setShowPowerPlantQuestion] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState<{ offset: { x: number; y: number }; zoom: number; canvasSize: { width: number; height: number } } | null>(null);
  const isInitialMount = useRef(true);
  const { isMobileDevice, isSmallScreen } = useMobile();
  const isMobile = isMobileDevice || isSmallScreen;
  const [showShareModal, setShowShareModal] = useState(false);
  const multiplayer = useMultiplayerOptional();
  
  // Cheat code system
  const {
    triggeredCheat,
    showVinnieDialog,
    setShowVinnieDialog,
    clearTriggeredCheat,
  } = useCheatCodes();
  
  // Tip system for helping new players
  const {
    currentTip,
    isVisible: isTipVisible,
    onContinue: onTipContinue,
    onSkipAll: onTipSkipAll,
  } = useTipSystem(state);
  
  // Multiplayer sync
  const {
    isMultiplayer,
    isHost,
    playerCount,
    roomCode,
    players,
    broadcastPlace,
    leaveRoom,
  } = useMultiplayerSync();
  
  const { copied: copiedRoomLink, handleCopyRoomLink } = useCopyRoomLink(roomCode, 'coop');
  const initialSelectedToolRef = useRef<Tool | null>(null);
  const previousSelectedToolRef = useRef<Tool | null>(null);
  const hasCapturedInitialTool = useRef(false);
  const currentSelectedToolRef = useRef<Tool>(state.selectedTool);
  const hasPowerPlant = useMemo(
    () => state.grid.some(row => row.some(tile => tile.building.type === 'power_plant')),
    [state.grid]
  );
  
  // Keep currentSelectedToolRef in sync with state
  useEffect(() => {
    currentSelectedToolRef.current = state.selectedTool;
  }, [state.selectedTool]);

  useEffect(() => {
    if (!hasPowerPlant || typeof window === 'undefined') return;
    if (localStorage.getItem(POWER_PLANT_QUESTION_KEY) === 'true') return;

    const timeoutId = window.setTimeout(() => {
      setShowPowerPlantQuestion(true);
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [hasPowerPlant]);

  const handlePowerPlantQuestionAnswer = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(POWER_PLANT_QUESTION_KEY, 'true');
    }
    setShowPowerPlantQuestion(false);
    addNotification(
      'ตอบคำถามโรงไฟฟ้าแล้ว',
      'ระบบคำถามพร้อมใช้เป็นกิจกรรมความรู้เพิ่มเติม เมื่อมีชุดคำถามจริงจะใส่ให้ครบ',
      'power'
    );
  }, [addNotification]);
  
  // Track the initial selectedTool after localStorage loads (with a small delay to allow state to load)
  useEffect(() => {
    if (!hasCapturedInitialTool.current) {
      // Use a timeout to ensure localStorage state has loaded
      const timeoutId = setTimeout(() => {
        initialSelectedToolRef.current = currentSelectedToolRef.current;
        previousSelectedToolRef.current = currentSelectedToolRef.current;
        hasCapturedInitialTool.current = true;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Only run once on mount
  
  // Auto-set overlay when selecting utility tools (but not on initial page load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Select tool always resets overlay to none (user is explicitly switching to select)
    if (state.selectedTool === 'select') {
      setTimeout(() => {
        setOverlayMode('none');
      }, 0);
      previousSelectedToolRef.current = state.selectedTool;
      return;
    }
    
    // Subway tool sets overlay when actively selected (not on page load)
    if (state.selectedTool === 'subway' || state.selectedTool === 'subway_station') {
      setTimeout(() => {
        setOverlayMode('subway');
      }, 0);
      previousSelectedToolRef.current = state.selectedTool;
      return;
    }
    
    // Don't auto-set overlay until we've captured the initial tool
    if (!hasCapturedInitialTool.current) {
      return;
    }
    
    // Don't auto-set overlay if this matches the initial tool from localStorage
    if (initialSelectedToolRef.current !== null && 
        initialSelectedToolRef.current === state.selectedTool) {
      return;
    }
    
    // Don't auto-set overlay if tool hasn't changed
    if (previousSelectedToolRef.current === state.selectedTool) {
      return;
    }
    
    // Update previous tool reference
    previousSelectedToolRef.current = state.selectedTool;
    
    setTimeout(() => {
      setOverlayMode(getOverlayForTool(state.selectedTool));
    }, 0);
  }, [state.selectedTool]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        if (overlayMode !== 'none') {
          setOverlayMode('none');
        } else if (state.activePanel !== 'none') {
          setActivePanel('none');
        } else if (selectedTile) {
          setSelectedTile(null);
        } else if (state.selectedTool !== 'select') {
          setTool('select');
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setTool('bulldoze');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        // Toggle pause/unpause: if paused (speed 0), resume to normal (speed 1)
        // If running, pause (speed 0)
        setSpeed(state.speed === 0 ? 1 : 0);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.activePanel, state.selectedTool, state.speed, selectedTile, setActivePanel, setTool, setSpeed, overlayMode]);

  // Handle cheat code triggers
  useEffect(() => {
    if (!triggeredCheat) return;

    switch (triggeredCheat.type) {
      case 'konami':
        addMoney(triggeredCheat.amount);
        addNotification(
          gt('Retro Cheat Activated!'),
          gt('Your accountants are confused but not complaining. You received $50,000!'),
          'trophy'
        );
        clearTriggeredCheat();
        break;

      case 'motherlode':
        addMoney(triggeredCheat.amount);
        addNotification(
          gt('Motherlode!'),
          gt('Your treasury just got a lot heavier. You received $1,000,000!'),
          'trophy'
        );
        clearTriggeredCheat();
        break;

      case 'vinnie':
        // Vinnie dialog is handled by VinnieDialog component
        clearTriggeredCheat();
        break;
    }
  }, [triggeredCheat, addMoney, addNotification, clearTriggeredCheat, gt]);
  
  // Track barge deliveries to show occasional notifications
  const bargeDeliveryCountRef = useRef(0);
  
  // Handle barge cargo delivery - adds money to the city treasury
  const handleBargeDelivery = useCallback((cargoValue: number, cargoType: number) => {
    addMoney(cargoValue);
    bargeDeliveryCountRef.current++;

    // Show a notification every 5 deliveries to avoid spam
    if (bargeDeliveryCountRef.current % 5 === 1) {
      const cargoName = CARGO_TYPE_NAMES[cargoType] || msg('cargo');
      addNotification(
        gt('Cargo Delivered'),
        gt('A shipment of {cargoName} has arrived at the marina. +${cargoValue} trade revenue.', { cargoName: m(cargoName), cargoValue }),
        'ship'
      );
    }
  }, [addMoney, addNotification, gt, m]);

  // Mobile layout
  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="w-full h-full overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 flex flex-col">
          {/* Mobile Top Bar */}
          <MobileTopBar 
            selectedTile={selectedTile && state.selectedTool === 'select' ? state.grid[selectedTile.y][selectedTile.x] : null}
            services={state.services}
            onCloseTile={() => setSelectedTile(null)}
            onShare={() => setShowShareModal(true)}
            onExit={onExit}
          />
          
          {/* Share Modal for mobile co-op */}
          {multiplayer && (
            <ShareModal
              open={showShareModal}
              onOpenChange={setShowShareModal}
            />
          )}
          
          {/* Main canvas area - fills remaining space, with padding for top/bottom bars */}
          <div className="flex-1 relative overflow-hidden" style={{ paddingTop: '72px', paddingBottom: '76px' }}>
            <CanvasIsometricGrid 
              overlayMode={overlayMode} 
              selectedTile={selectedTile} 
              setSelectedTile={setSelectedTile}
              isMobile={true}
              onBargeDelivery={handleBargeDelivery}
            />
            
            {/* Multiplayer Players Indicator - Mobile */}
            {isMultiplayer && (
              <div className="absolute top-2 right-2 z-20">
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs text-white">
                    {roomCode && (
                      <>
                        <span className="font-mono tracking-wider">{roomCode}</span>
                        <button
                          onClick={handleCopyRoomLink}
                          className="p-0.5 hover:bg-white/10 rounded transition-colors"
                          title="Copy invite link"
                        >
                          {copiedRoomLink ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  {players.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {players.map((player) => (
                        <div key={player.id} className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {player.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Bottom Toolbar */}
          <MobileToolbar 
            onOpenPanel={(panel) => setActivePanel(panel)}
            overlayMode={overlayMode}
            setOverlayMode={setOverlayMode}
          />
          
          {/* Panels - render as fullscreen modals on mobile */}
          {state.activePanel === 'budget' && <BudgetPanel />}
          {state.activePanel === 'statistics' && <StatisticsPanel />}
          {state.activePanel === 'advisors' && <AdvisorsPanel />}
          {state.activePanel === 'challenge' && <NpsChallengePanel />}
          {state.activePanel === 'settings' && <SettingsPanel />}
          
          <VinnieDialog open={showVinnieDialog} onOpenChange={setShowVinnieDialog} />

          <StarterGuideDialog
            open={showStarterGuide}
            onOpenChange={setShowStarterGuide}
            onCreateStarterCity={createStarterCity}
          />
          <PowerPlantQuestionDialog
            open={showPowerPlantQuestion}
            onOpenChange={setShowPowerPlantQuestion}
            onAnswer={handlePowerPlantQuestionAnswer}
          />
          
          {/* Tip Toast for helping new players */}
          <TipToast
            message={currentTip || ''}
            isVisible={isTipVisible}
            onContinue={onTipContinue}
            onSkipAll={onTipSkipAll}
          />
        </div>
      </TooltipProvider>
    );
  }

  // Desktop layout
  return (
    <TooltipProvider>
      <div className="w-full h-full min-h-[720px] overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 flex">
        <Sidebar onExit={onExit} />
        
        <div className="flex-1 flex flex-col ml-56">
          <TopBar />
          <StatsPanel />
          <div className="flex-1 relative overflow-visible">
            <CanvasIsometricGrid 
              overlayMode={overlayMode} 
              selectedTile={selectedTile} 
              setSelectedTile={setSelectedTile}
              navigationTarget={navigationTarget}
              onNavigationComplete={() => setNavigationTarget(null)}
              onViewportChange={setViewport}
              onBargeDelivery={handleBargeDelivery}
            />
            <OverlayModeToggle overlayMode={overlayMode} setOverlayMode={setOverlayMode} />
            <MiniMap onNavigate={(x, y) => setNavigationTarget({ x, y })} viewport={viewport} />
            
            {/* Multiplayer Players Indicator */}
            {isMultiplayer && (
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 shadow-lg min-w-[120px]">
                  <div className="flex items-center gap-2 text-sm text-white">
                    {roomCode && (
                      <>
                        <span className="font-mono font-medium tracking-wider">{roomCode}</span>
                        <button
                          onClick={handleCopyRoomLink}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copy invite link"
                        >
                          {copiedRoomLink ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  {players.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {players.map((player) => (
                        <div key={player.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          {player.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {state.activePanel === 'budget' && <BudgetPanel />}
        {state.activePanel === 'statistics' && <StatisticsPanel />}
        {state.activePanel === 'advisors' && <AdvisorsPanel />}
        {state.activePanel === 'challenge' && <NpsChallengePanel />}
        {state.activePanel === 'settings' && <SettingsPanel />}
        
        <VinnieDialog open={showVinnieDialog} onOpenChange={setShowVinnieDialog} />
        <StarterGuideDialog
          open={showStarterGuide}
          onOpenChange={setShowStarterGuide}
          onCreateStarterCity={createStarterCity}
        />
        <PowerPlantQuestionDialog
          open={showPowerPlantQuestion}
          onOpenChange={setShowPowerPlantQuestion}
          onAnswer={handlePowerPlantQuestionAnswer}
        />
        <CommandMenu />
        
        {/* Tip Toast for helping new players */}
        <TipToast
          message={currentTip || ''}
          isVisible={isTipVisible}
          onContinue={onTipContinue}
          onSkipAll={onTipSkipAll}
        />
      </div>
    </TooltipProvider>
  );
}
