'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameProvider } from '@/context/GameContext';
import { MultiplayerContextProvider } from '@/context/MultiplayerContext';
import Game from '@/components/Game';
import { CoopModal } from '@/components/multiplayer/CoopModal';
import { useMobile } from '@/hooks/useMobile';
import { getSpritePack, getSpriteCoords, DEFAULT_SPRITE_PACK_ID } from '@/lib/renderConfig';
import { loadGameRoom } from '@/lib/multiplayer/database';
import { NPS_EVENTS, NPS_MISSIONS } from '@/lib/npsChallenge';
import { SavedCityMeta, GameState } from '@/types/game';
import { decompressFromUTF16, compressToUTF16 } from 'lz-string';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { T } from 'gt-next';
import { Loader2, LogIn, LogOut, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'isocity-game-state';
const SAVED_CITIES_INDEX_KEY = 'isocity-saved-cities-index';
const OWNED_ROOM_CODES_KEY = 'nps-city-owned-room-codes';
const PLAYER_PROFILE_PREFIX = 'nps-city-player-profile-';
const READ_ONLY_VIEW_STORAGE_KEY = 'nps-city-read-only-view';
const READ_ONLY_EXAMPLE_STORAGE_KEY = 'nps-city-read-only-example-state';
const DELETED_CITIES_KEY = 'nps-city-deleted-cities';
const ADMIN_PASSCODE = 'Aa140844';

type DashboardCity = SavedCityMeta & {
  playerName?: string;
  gameState?: string;
  isGlobal?: boolean;
};

type LeaderboardRow = {
  city_id: string;
  player_name: string | null;
  city_name: string;
  room_code: string | null;
  money: number | string | null;
  happiness: number | null;
  environment: number | null;
  esg_score: number | null;
  power_reliability: number | null;
  population: number | null;
  game_state: string | null;
  updated_at: string | null;
};

// Background color to filter from sprite sheets (red)
const BACKGROUND_COLOR = { r: 255, g: 0, b: 0 };
const COLOR_THRESHOLD = 155;

// Filter red background from sprite sheet
function filterBackgroundColor(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const distance = Math.sqrt(
      Math.pow(r - BACKGROUND_COLOR.r, 2) +
      Math.pow(g - BACKGROUND_COLOR.g, 2) +
      Math.pow(b - BACKGROUND_COLOR.b, 2)
    );
    
    if (distance <= COLOR_THRESHOLD) {
      data[i + 3] = 0; // Make transparent
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if there's a saved game in localStorage
// Supports both compressed (lz-string) and uncompressed (legacy) formats
function decodeSavedGameState(saved: string): GameState | null {
  try {
    let jsonString = decompressFromUTF16(saved);
    if (!jsonString || !jsonString.startsWith('{')) {
      jsonString = saved.startsWith('{') ? saved : '';
    }
    if (!jsonString) return null;
    const parsed = JSON.parse(jsonString);
    if (parsed?.grid && parsed?.gridSize && parsed?.stats) {
      return parsed as GameState;
    }
  } catch {
    return null;
  }
  return null;
}

function clearLegacyReadOnlyExampleFromPlayableSave(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = decodeSavedGameState(saved);
    if (parsed?.cityName === 'StephCity' && (parsed.stats?.money ?? 0) >= 900000) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Startup should remain resilient even if a browser save is malformed.
  }
}

function hasSavedGame(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    clearLegacyReadOnlyExampleFromPlayableSave();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = decodeSavedGameState(saved);
      return parsed !== null && isOwnPlayableCity(parsed);
    }
  } catch {
    return false;
  }
  return false;
}

function getCityDeleteKey(city: Pick<SavedCityMeta, 'id' | 'roomCode'>): string {
  return city.roomCode ? `room:${city.roomCode.toUpperCase()}` : `id:${city.id}`;
}

function loadDeletedCityKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(DELETED_CITIES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function isCityMarkedDeleted(city: Pick<SavedCityMeta, 'id' | 'roomCode'>): boolean {
  const deletedKeys = new Set(loadDeletedCityKeys());
  return deletedKeys.has(getCityDeleteKey(city));
}

function markCityDeleted(city: Pick<SavedCityMeta, 'id' | 'roomCode'>): void {
  if (typeof window === 'undefined') return;
  try {
    const deletedKeys = new Set(loadDeletedCityKeys());
    deletedKeys.add(getCityDeleteKey(city));
    if (city.roomCode) {
      deletedKeys.add(`id:coop-${city.roomCode.toUpperCase()}`);
    }
    localStorage.setItem(DELETED_CITIES_KEY, JSON.stringify(Array.from(deletedKeys)));
  } catch {
    // Local delete markers are a convenience layer; cloud delete remains the source of truth.
  }
}

function loadOwnedRoomCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(OWNED_ROOM_CODES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function markOwnedRoomCode(roomCode?: string): void {
  if (typeof window === 'undefined' || !roomCode) return;
  try {
    const normalizedRoomCode = roomCode.toUpperCase();
    const ownedCodes = new Set(loadOwnedRoomCodes().map((code) => code.toUpperCase()));
    ownedCodes.add(normalizedRoomCode);
    localStorage.setItem(OWNED_ROOM_CODES_KEY, JSON.stringify(Array.from(ownedCodes)));
  } catch {
    // Ownership marker is local-only. A failed write should not block room creation.
  }
}

function isOwnedRoomCode(roomCode?: string): boolean {
  if (!roomCode) return false;
  return loadOwnedRoomCodes().some((code) => code.toUpperCase() === roomCode.toUpperCase());
}

function isOwnPlayableCity(state: GameState): boolean {
  const roomCode = state.currentRoomCode?.toUpperCase();
  return !roomCode || isOwnedRoomCode(roomCode);
}

// Load saved cities index from localStorage
function loadSavedCities(): SavedCityMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(SAVED_CITIES_INDEX_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const normalized = normalizeSavedCities(parsed as SavedCityMeta[]);
        hydrateMissingCitySnapshots(normalized);
        if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
          localStorage.setItem(SAVED_CITIES_INDEX_KEY, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
  } catch {
    return [];
  }
  return [];
}

function hydrateMissingCitySnapshots(cities: SavedCityMeta[]): void {
  try {
    const activeSave = localStorage.getItem(STORAGE_KEY);
    const activeState = activeSave ? decodeSavedGameState(activeSave) : null;
    if (!activeState) return;

    for (const city of cities) {
      const storageKey = SAVED_CITY_PREFIX + city.id;
      if (localStorage.getItem(storageKey)) continue;

      const activeRoom = activeState.currentRoomCode?.toUpperCase();
      const cityRoom = city.roomCode?.toUpperCase();
      const isSameRoom = Boolean(activeRoom && cityRoom && activeRoom === cityRoom);
      const isSameLocalCity = !cityRoom && activeState.id === city.id;
      const isLikelySameSnapshot =
        activeState.cityName === city.cityName &&
        activeState.stats?.money === city.money &&
        activeState.stats?.population === city.population;

      if (isSameRoom || isSameLocalCity || isLikelySameSnapshot) {
        localStorage.setItem(storageKey, compressToUTF16(JSON.stringify(activeState)));
      }
    }
  } catch {
    // Snapshot repair should never block the start screen.
  }
}

// Save a city to the saved cities index (for multiplayer cities)
function saveCityToIndex(state: GameState, roomCode?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normalizedRoomCode = roomCode?.toUpperCase();
    const cities = loadSavedCities();
    const cityId = normalizedRoomCode ? `coop-${normalizedRoomCode}` : (state.id || `city-${Date.now()}`);
    
    // Create city meta
    const cityMeta: SavedCityMeta = {
      id: cityId,
      cityName: state.cityName || 'Co-op City',
      population: state.stats.population,
      money: state.stats.money,
      happiness: state.stats.happiness,
      environment: state.stats.environment,
      health: state.stats.health,
      education: state.stats.education,
      safety: state.stats.safety,
      communityTrust: state.stats.communityTrust,
      esgScore: state.stats.esgScore,
      powerReliability: state.stats.powerReliability,
      blackoutRisk: state.stats.blackoutRisk,
      powerBalance: state.stats.powerBalance,
      income: state.stats.income,
      expenses: state.stats.expenses,
      year: state.year,
      month: state.month,
      gridSize: state.gridSize,
      savedAt: Date.now(),
      roomCode: normalizedRoomCode,
    };

    const snapshotState = normalizedRoomCode
      ? { ...state, currentRoomCode: normalizedRoomCode }
      : { ...state, id: cityId };
    localStorage.setItem(SAVED_CITY_PREFIX + cityId, compressToUTF16(JSON.stringify(snapshotState)));
    
    // Check if city already exists (by id or roomCode)
    const existingIndex = cities.findIndex(c => 
      c.id === cityMeta.id || (normalizedRoomCode && c.roomCode === normalizedRoomCode)
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      cities[existingIndex] = cityMeta;
    } else {
      // Add new entry at the beginning
      cities.unshift(cityMeta);
    }
    
    // Keep only the last 20 cities
    const trimmed = normalizeSavedCities(cities).slice(0, 20);
    
    localStorage.setItem(SAVED_CITIES_INDEX_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save city to index:', e);
  }
}

const PLACEHOLDER_CITY_NAMES = new Set(['NPS City', 'Co-op City', 'เมืองของทีม', 'My Co-op City']);

function isPlaceholderCityName(name?: string | null): boolean {
  return !name || PLACEHOLDER_CITY_NAMES.has(name.trim());
}

function chooseDisplayCityName(incoming: DashboardCity, existing?: DashboardCity): string {
  if (!existing) return incoming.cityName || 'NPS City';
  const incomingName = incoming.cityName || '';
  const existingName = existing.cityName || '';
  const incomingIsPlaceholder = isPlaceholderCityName(incomingName);
  const existingIsPlaceholder = isPlaceholderCityName(existingName);

  if (!incomingIsPlaceholder && existingIsPlaceholder) return incomingName;
  if (incomingIsPlaceholder && !existingIsPlaceholder) return existingName;
  return incoming.savedAt >= existing.savedAt ? incomingName || existingName || 'NPS City' : existingName || incomingName || 'NPS City';
}

function normalizeSavedCities(cities: SavedCityMeta[]): SavedCityMeta[] {
  const latestByKey = new Map<string, SavedCityMeta>();
  const coopSnapshots = new Set<string>();
  const localBySnapshot = new Map<string, SavedCityMeta>();

  for (const city of cities) {
    const snapshotKey = `${city.population}:${city.money}:${city.gridSize}`;
    if (city.roomCode) {
      coopSnapshots.add(snapshotKey);
    } else {
      const existing = localBySnapshot.get(snapshotKey);
      if (!existing || city.savedAt > existing.savedAt) {
        localBySnapshot.set(snapshotKey, city);
      }
    }
  }

  for (const city of cities) {
    const snapshotKey = `${city.population}:${city.money}:${city.gridSize}`;
    const isDuplicateLocalCoopSnapshot = !city.roomCode && coopSnapshots.has(snapshotKey);
    if (isDuplicateLocalCoopSnapshot) continue;

    const roomCode = city.roomCode?.toUpperCase();
    const key = roomCode ? `coop-${roomCode}` : city.id;
    const duplicateLocalCity = roomCode ? localBySnapshot.get(snapshotKey) : undefined;
    const shouldUseLocalName =
      duplicateLocalCity &&
      isPlaceholderCityName(city.cityName);
    const cityWithMetricFallbacks: SavedCityMeta = {
      ...city,
      communityTrust: city.communityTrust ?? city.happiness ?? 0,
      esgScore: city.esgScore ?? city.environment ?? 0,
      powerReliability: city.powerReliability ?? 0,
      blackoutRisk: city.blackoutRisk ?? 0,
      powerBalance: city.powerBalance ?? 0,
    };
    const normalizedCity = roomCode
      ? {
          ...cityWithMetricFallbacks,
          id: `coop-${roomCode}`,
          cityName: shouldUseLocalName ? duplicateLocalCity.cityName : city.cityName,
          roomCode,
        }
      : cityWithMetricFallbacks;
    const existing = latestByKey.get(key);
    if (!existing || normalizedCity.savedAt > existing.savedAt) {
      latestByKey.set(key, normalizedCity);
    }
  }

  return Array.from(latestByKey.values()).sort((a, b) => b.savedAt - a.savedAt);
}

function buildCityMetaFromState(state: GameState, roomCode?: string): SavedCityMeta {
  const normalizedRoomCode = roomCode?.toUpperCase() || state.currentRoomCode?.toUpperCase();
  const cityId = normalizedRoomCode ? `coop-${normalizedRoomCode}` : (state.id || `city-${Date.now()}`);

  return {
    id: cityId,
    cityName: state.cityName || 'NPS City',
    population: state.stats.population,
    money: state.stats.money,
    happiness: state.stats.happiness,
    environment: state.stats.environment,
    health: state.stats.health,
    education: state.stats.education,
    safety: state.stats.safety,
    communityTrust: state.stats.communityTrust,
    esgScore: state.stats.esgScore,
    powerReliability: state.stats.powerReliability,
    blackoutRisk: state.stats.blackoutRisk,
    powerBalance: state.stats.powerBalance,
    income: state.stats.income,
    expenses: state.stats.expenses,
    year: state.year,
    month: state.month,
    gridSize: state.gridSize,
    savedAt: Date.now(),
    roomCode: normalizedRoomCode,
  };
}

function leaderboardRowToCity(row: LeaderboardRow): DashboardCity {
  const savedAt = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
  const roomCode = row.room_code?.toUpperCase() || undefined;
  const cityId = row.city_id || (roomCode ? `coop-${roomCode}` : `global-${savedAt}`);

  return {
    id: roomCode ? `coop-${roomCode}` : cityId,
    cityName: row.city_name || 'NPS City',
    population: Number(row.population ?? 0),
    money: Number(row.money ?? 0),
    happiness: Number(row.happiness ?? 0),
    environment: Number(row.environment ?? 0),
    health: 0,
    education: 0,
    safety: 0,
    communityTrust: 0,
    esgScore: Number(row.esg_score ?? 0),
    powerReliability: Number(row.power_reliability ?? 0),
    blackoutRisk: 0,
    powerBalance: 0,
    income: 0,
    expenses: 0,
    year: 2026,
    month: 1,
    gridSize: 0,
    savedAt,
    roomCode,
    playerName: row.player_name || undefined,
    gameState: row.game_state || undefined,
    isGlobal: true,
  };
}

function mergeDashboardCities(localCities: SavedCityMeta[], globalCities: DashboardCity[]): DashboardCity[] {
  const byKey = new Map<string, DashboardCity>();
  const addCity = (city: DashboardCity) => {
    const key = city.roomCode ? `room:${city.roomCode.toUpperCase()}` : `id:${city.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, city);
      return;
    }

    const newest = city.savedAt >= existing.savedAt ? city : existing;
    const preferredGlobal = city.isGlobal ? city : existing.isGlobal ? existing : undefined;
    byKey.set(key, {
      ...existing,
      ...newest,
      cityName: chooseDisplayCityName(city, existing),
      roomCode: city.roomCode?.toUpperCase() || existing.roomCode?.toUpperCase(),
      playerName: preferredGlobal?.playerName || newest.playerName || existing.playerName,
      gameState: preferredGlobal?.gameState || newest.gameState || existing.gameState,
      isGlobal: Boolean(city.isGlobal || existing.isGlobal),
    });
  };

  localCities.forEach((city) => addCity(city));
  globalCities.forEach(addCity);

  return Array.from(byKey.values()).sort((a, b) => b.savedAt - a.savedAt);
}

async function loadGlobalDashboardCities(): Promise<DashboardCity[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('city_leaderboard')
      .select('city_id, player_name, city_name, room_code, money, happiness, environment, esg_score, power_reliability, population, game_state, updated_at')
      .eq('is_public', true)
      .order('money', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('[Dashboard] city_leaderboard is not ready:', error.message);
      return [];
    }

    return (data as LeaderboardRow[] | null)?.map(leaderboardRowToCity) ?? [];
  } catch (e) {
    console.warn('[Dashboard] Failed to load global leaderboard:', e);
    return [];
  }
}

async function publishCityToLeaderboard(
  state: GameState,
  user: User | null,
  profile: PlayerProfile | null,
  roomCode?: string
): Promise<void> {
  if (!supabase || !user) return;

  try {
    const cityMeta = buildCityMetaFromState(state, roomCode);
    const snapshotState = cityMeta.roomCode
      ? { ...state, currentRoomCode: cityMeta.roomCode }
      : { ...state, id: cityMeta.id };
    const publishedCityName = snapshotState.cityName || cityMeta.cityName || 'NPS City';

    const { error } = await supabase
      .from('city_leaderboard')
      .upsert({
        user_id: user.id,
        city_id: cityMeta.id,
        player_name: profile?.displayName || getDefaultPlayerName(user),
        city_name: publishedCityName,
        room_code: cityMeta.roomCode ?? null,
        money: Math.round(cityMeta.money),
        happiness: Math.round(cityMeta.happiness ?? 0),
        environment: Math.round(cityMeta.environment ?? 0),
        esg_score: Math.round(cityMeta.esgScore ?? 0),
        power_reliability: Math.round(cityMeta.powerReliability ?? 0),
        population: Math.round(cityMeta.population),
        game_state: compressToUTF16(JSON.stringify(snapshotState)),
        is_public: true,
      }, { onConflict: 'user_id,city_id' });

    if (error) {
      console.warn('[Dashboard] Failed to publish city:', error.message);
    }
  } catch (e) {
    console.warn('[Dashboard] Failed to publish city:', e);
  }
}

async function deleteCityFromLeaderboard(city: SavedCityMeta): Promise<boolean> {
  if (!supabase) return true;
  try {
    const normalizedRoomCode = city.roomCode?.toUpperCase();
    let failed = false;

    if (normalizedRoomCode) {
      const { error: hideError } = await supabase
        .from('city_leaderboard')
        .update({ is_public: false })
        .eq('room_code', normalizedRoomCode);
      if (hideError) {
        failed = true;
        console.warn('[Dashboard] Failed to hide leaderboard city by room:', hideError.message);
      }

      const { error: deleteError } = await supabase
        .from('city_leaderboard')
        .delete()
        .eq('room_code', normalizedRoomCode);
      if (deleteError) {
        failed = true;
        console.warn('[Dashboard] Failed to delete leaderboard city by room:', deleteError.message);
      }

      // Do not delete game_rooms from the public client. Without an owner column
      // on that table, deleting rooms here would let users remove rooms they do not own.
    } else {
      const { error: hideError } = await supabase
        .from('city_leaderboard')
        .update({ is_public: false })
        .eq('city_id', city.id);
      if (hideError) {
        failed = true;
        console.warn('[Dashboard] Failed to hide leaderboard city by id:', hideError.message);
      }

      const { error: deleteError } = await supabase
        .from('city_leaderboard')
        .delete()
        .eq('city_id', city.id);
      if (deleteError) {
        failed = true;
        console.warn('[Dashboard] Failed to delete leaderboard city by id:', deleteError.message);
      }
    }

    return !failed;
  } catch (e) {
    console.warn('[Dashboard] Failed to delete city from Supabase:', e);
    return false;
  }
}

// Sprite Gallery component that renders sprites using canvas (like SpriteTestPanel)
function SpriteGallery({ count = 16, cols = 4, cellSize = 120 }: { count?: number; cols?: number; cellSize?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filteredSheet, setFilteredSheet] = useState<HTMLCanvasElement | null>(null);
  const spritePack = useMemo(() => getSpritePack(DEFAULT_SPRITE_PACK_ID), []);
  
  // Get random sprite keys from the sprite order, pre-validated to have valid coords
  const randomSpriteKeys = useMemo(() => {
    // Filter to only sprites that have valid building type mappings
    const validSpriteKeys = spritePack.spriteOrder.filter(spriteKey => {
      // Check if this sprite key has a building type mapping
      const hasBuildingMapping = Object.values(spritePack.buildingToSprite).includes(spriteKey);
      return hasBuildingMapping;
    });
    const shuffled = shuffleArray([...validSpriteKeys]);
    return shuffled.slice(0, count);
  }, [spritePack.spriteOrder, spritePack.buildingToSprite, count]);
  
  // Load and filter sprite sheet
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const filtered = filterBackgroundColor(img);
      setFilteredSheet(filtered);
    };
    img.src = spritePack.src;
  }, [spritePack.src]);
  
  // Pre-compute sprite data with valid coords
  const spriteData = useMemo(() => {
    if (!filteredSheet) return [];
    
    const sheetWidth = filteredSheet.width;
    const sheetHeight = filteredSheet.height;
    
    return randomSpriteKeys.map(spriteKey => {
      const buildingType = Object.entries(spritePack.buildingToSprite).find(
        ([, value]) => value === spriteKey
      )?.[0] || spriteKey;
      
      const coords = getSpriteCoords(buildingType, sheetWidth, sheetHeight, spritePack);
      return coords ? { spriteKey, coords } : null;
    }).filter((item): item is { spriteKey: string; coords: { sx: number; sy: number; sw: number; sh: number } } => item !== null);
  }, [filteredSheet, randomSpriteKeys, spritePack]);
  
  // Draw sprites to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !filteredSheet || spriteData.length === 0) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rows = Math.ceil(spriteData.length / cols);
    const padding = 10;
    
    const canvasWidth = cols * cellSize;
    const canvasHeight = rows * cellSize;
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas (transparent)
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw each sprite
    spriteData.forEach(({ coords }, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cellX = col * cellSize;
      const cellY = row * cellSize;
      
      // Draw cell background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4, 4);
      ctx.fill();
      ctx.stroke();
      
      // Calculate destination size preserving aspect ratio
      const maxSize = cellSize - padding * 2;
      const aspectRatio = coords.sh / coords.sw;
      let destWidth = maxSize;
      let destHeight = destWidth * aspectRatio;
      
      if (destHeight > maxSize) {
        destHeight = maxSize;
        destWidth = destHeight / aspectRatio;
      }
      
      // Center sprite in cell
      const drawX = cellX + (cellSize - destWidth) / 2;
      const drawY = cellY + (cellSize - destHeight) / 2 + destHeight * 0.1; // Slight offset down
      
      // Draw sprite
      ctx.drawImage(
        filteredSheet,
        coords.sx, coords.sy, coords.sw, coords.sh,
        Math.round(drawX), Math.round(drawY),
        Math.round(destWidth), Math.round(destHeight)
      );
    });
  }, [filteredSheet, spriteData, cols, cellSize]);
  
  return (
    <canvas
      ref={canvasRef}
      className="opacity-80 hover:opacity-100 transition-opacity"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// Saved City Card Component
function SavedCityCard({ city, onLoad, onDelete }: { city: SavedCityMeta; onLoad: () => void; onDelete?: () => void }) {
  return (
    <div className="relative group">
      <button
        onClick={onLoad}
        className="w-full text-left p-3 pr-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-none transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium truncate group-hover:text-white/90 text-sm flex-1">
            {city.cityName}
          </h3>
          {city.roomCode && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded shrink-0">
              Co-op
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
          <span>Pop: {city.population.toLocaleString()}</span>
          <span>${city.money.toLocaleString()}</span>
        </div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1/2 -translate-y-1/2 right-1.5 p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded transition-all duration-200"
          title="Delete city"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function percentValue(value: number | undefined) {
  return Math.round(value ?? 0);
}

function CityDashboard({
  cities,
  onView,
  compact = false,
}: {
  cities: DashboardCity[];
  onView: (city: DashboardCity) => void;
  compact?: boolean;
}) {
  const rankedByMoney = [...cities].sort((a, b) => b.money - a.money);
  const rankedByHappiness = [...cities].sort((a, b) => percentValue(b.happiness) - percentValue(a.happiness));
  const rankedByEnvironment = [...cities].sort((a, b) => percentValue(b.environment) - percentValue(a.environment));
  const bestMoney = rankedByMoney[0];
  const bestHappiness = rankedByHappiness[0];
  const bestEnvironment = rankedByEnvironment[0];
  const avgEnvironment = cities.length
    ? Math.round(cities.reduce((sum, city) => sum + percentValue(city.environment), 0) / cities.length)
    : 0;
  const avgEsg = cities.length
    ? Math.round(cities.reduce((sum, city) => sum + percentValue(city.esgScore), 0) / cities.length)
    : 0;

  return (
    <section className={`${compact ? 'w-full max-w-xs' : 'w-full max-w-5xl'} rounded-[32px] border border-white/10 bg-white/[0.055] p-4 text-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Dashboard เมือง</h2>
          <p className="mt-1 text-xs text-white/45">ดูอันดับเมืองและเข้าไปชมเมืองแบบแก้ไขไม่ได้</p>
        </div>
        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
          {cities.length} เมือง
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-4'}`}>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-3">
          <div className="text-xs text-white/45">เงินสูงสุด</div>
          <div className="mt-1 text-xl font-semibold text-emerald-300">{bestMoney ? formatCurrency(bestMoney.money) : '-'}</div>
          <div className="mt-1 truncate text-xs text-white/50">{bestMoney?.cityName || '-'}</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-3">
          <div className="text-xs text-white/45">ความสุขสูงสุด</div>
          <div className="mt-1 text-xl font-semibold text-amber-200">{bestHappiness ? `${percentValue(bestHappiness.happiness)}%` : '-'}</div>
          <div className="mt-1 truncate text-xs text-white/50">{bestHappiness?.cityName || '-'}</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-3">
          <div className="text-xs text-white/45">สิ่งแวดล้อมสูงสุด</div>
          <div className="mt-1 text-xl font-semibold text-sky-200">{bestEnvironment ? `${percentValue(bestEnvironment.environment)}%` : '-'}</div>
          <div className="mt-1 truncate text-xs text-white/50">{bestEnvironment?.cityName || '-'}</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-3">
          <div className="text-xs text-white/45">สิ่งแวดล้อมเฉลี่ย</div>
          <div className="mt-1 text-xl font-semibold text-sky-200">{avgEnvironment}%</div>
          <div className="mt-1 text-xs text-white/50">ESG เฉลี่ย {avgEsg}%</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10">
        <div className="grid grid-cols-[1fr_auto] gap-2 bg-white/[0.06] px-3 py-2 text-xs uppercase tracking-wide text-white/45 sm:grid-cols-[1.35fr_.75fr_.6fr_.65fr_.6fr_.65fr_auto]">
          <span>เมือง</span>
          <span className="hidden sm:block">เงิน</span>
          <span className="hidden sm:block">สุข</span>
          <span className="hidden sm:block">สิ่งแวดล้อม</span>
          <span className="hidden sm:block">ESG</span>
          <span className="hidden sm:block">ไฟฟ้า</span>
          <span>ดู</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {rankedByMoney.map((city) => (
            <div
              key={`${city.id}-${city.roomCode || 'local'}`}
              className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-white/10 px-3 py-3 text-sm sm:grid-cols-[1.35fr_.75fr_.6fr_.65fr_.6fr_.65fr_auto]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-white/90">{city.cityName}</div>
                {city.playerName && (
                  <div className="mt-0.5 truncate text-xs text-white/35">{city.playerName}</div>
                )}
                <div className="mt-1 text-xs text-white/40 sm:hidden">
                  {formatCurrency(city.money)} · สุข {percentValue(city.happiness)}% · สิ่งแวดล้อม {percentValue(city.environment)}% · ESG {percentValue(city.esgScore)}%
                </div>
              </div>
              <div className="hidden text-emerald-300 sm:block">{formatCurrency(city.money)}</div>
              <div className="hidden text-amber-200 sm:block">{percentValue(city.happiness)}%</div>
              <div className="hidden text-sky-200 sm:block">{percentValue(city.environment)}%</div>
              <div className="hidden text-teal-200 sm:block">{percentValue(city.esgScore)}%</div>
              <div className="hidden text-cyan-200 sm:block">{percentValue(city.powerReliability)}%</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onView(city)}
                className="rounded-full border-white/15 bg-white/[0.04] px-3 text-white/70 hover:bg-white/15 hover:text-white"
              >
                ดูเมือง
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminAccessButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      className="fixed right-4 top-4 z-50 rounded-full border-amber-300/40 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100 shadow-lg backdrop-blur hover:bg-amber-300/15"
    >
      ADMIN
    </Button>
  );
}

function AdminDialog({
  open,
  unlocked,
  passcode,
  error,
  cities,
  isDeleting,
  onOpenChange,
  onPasscodeChange,
  onLogin,
  onLogout,
  onRefresh,
  onDeleteCity,
}: {
  open: boolean;
  unlocked: boolean;
  passcode: string;
  error: string | null;
  cities: DashboardCity[];
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onPasscodeChange: (value: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  onDeleteCity: (city: DashboardCity) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-hidden border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle>ADMIN Control Center</DialogTitle>
          <DialogDescription className="text-white/50">
            จัดการ Quest, Event และรายการเมืองที่เชื่อมกับ Dashboard
          </DialogDescription>
        </DialogHeader>

        {!unlocked ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-passcode">รหัสเข้าสู่ระบบ Admin</Label>
              <Input
                id="admin-passcode"
                type="password"
                value={passcode}
                onChange={(e) => onPasscodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onLogin();
                }}
                className="border-white/15 bg-white/10 text-white"
                autoFocus
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="button" onClick={onLogin}>
                เข้าสู่ระบบ
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3">
              <div>
                <div className="font-semibold text-emerald-100">Admin พร้อมใช้งาน</div>
                <div className="text-xs text-emerald-100/60">กดรีเฟรชเพื่อดึงข้อมูล Dashboard ล่าสุดจาก Supabase</div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onRefresh} className="border-white/15 bg-white/5 text-white hover:bg-white/15">
                  รีเฟรชข้อมูล
                </Button>
                <Button type="button" variant="outline" onClick={onLogout} className="border-red-300/30 bg-red-500/10 text-red-100 hover:bg-red-500/20">
                  ออกจาก Admin
                </Button>
              </div>
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">เมืองใน Dashboard</h3>
                  <p className="text-xs text-white/45">ลบตรงนี้จะลบจาก Supabase จริง รวมถึงห้อง Co-op ถ้ามี</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/65">{cities.length} เมือง</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[1.2fr_.7fr_.55fr_.55fr_auto] gap-2 bg-white/[0.06] px-3 py-2 text-xs text-white/45">
                  <span>เมือง</span>
                  <span>เงิน</span>
                  <span>สุข</span>
                  <span>สิ่งแวดล้อม</span>
                  <span>จัดการ</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {cities.map((city) => (
                    <div key={`${city.id}-${city.roomCode || 'local'}`} className="grid grid-cols-[1.2fr_.7fr_.55fr_.55fr_auto] items-center gap-2 border-t border-white/10 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate text-white/90">{city.cityName}</div>
                        <div className="truncate text-xs text-white/35">{city.playerName || 'Local / Unknown'}</div>
                      </div>
                      <div className="text-emerald-200">{formatCurrency(city.money)}</div>
                      <div className="text-amber-100">{percentValue(city.happiness)}%</div>
                      <div className="text-sky-100">{percentValue(city.environment)}%</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={() => onDeleteCity(city)}
                        className="rounded-full border-red-300/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                      >
                        ลบ
                      </Button>
                    </div>
                  ))}
                  {cities.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-white/40">ยังไม่มีข้อมูลเมือง</div>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-semibold text-white">รายการ Quest</h3>
                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {NPS_MISSIONS.map((mission) => (
                    <div key={mission.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white/90">Day {mission.day}: {mission.title}</div>
                          <p className="mt-1 text-xs leading-relaxed text-white/45">{mission.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
                          +{mission.reward.toLocaleString()}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-white/55">
                        {mission.checks.map((check) => (
                          <li key={check.label}>- {check.label}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-semibold text-white">รายการ Event</h3>
                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {NPS_EVENTS.map((event) => (
                    <div key={`${event.day}-${event.title}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="text-sm font-medium text-white/90">Day {event.day}: {event.title}</div>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">{event.description}</p>
                      <div className="mt-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                        {event.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const SAVED_CITY_PREFIX = 'isocity-city-';

type PlayerProfile = {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  updatedAt: string;
};

function getDefaultPlayerName(user: User) {
  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : '';

  return metadataName || user.email?.split('@')[0] || 'ผู้เล่น NPS City';
}

function getAvatarUrl(user: User) {
  return typeof user.user_metadata?.avatar_url === 'string'
    ? user.user_metadata.avatar_url
    : typeof user.user_metadata?.picture === 'string'
      ? user.user_metadata.picture
      : null;
}

function loadLocalPlayerProfile(userId: string): PlayerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PLAYER_PROFILE_PREFIX + userId);
    return saved ? (JSON.parse(saved) as PlayerProfile) : null;
  } catch {
    return null;
  }
}

function saveLocalPlayerProfile(profile: PlayerProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYER_PROFILE_PREFIX + profile.id, JSON.stringify(profile));
}

function AuthControls({
  user,
  profile,
  loading,
  onLogin,
  onLogout,
  onEditProfile,
  compact = false,
}: {
  user: User | null;
  profile: PlayerProfile | null;
  loading: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
  compact?: boolean;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="w-full max-w-xs text-xs text-white/40 border border-white/10 bg-white/[0.03] px-3 py-2">
        ยังไม่ได้เชื่อม Supabase
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-xs flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังตรวจสอบบัญชี...
      </div>
    );
  }

  if (!user) {
    return (
      <Button
        onClick={onLogin}
        variant="outline"
        className={`${compact ? 'w-full py-3 text-sm' : 'w-64 py-5 text-base'} font-light tracking-wide bg-white/[0.04] hover:bg-white/15 text-white/75 hover:text-white border border-white/15 rounded-none transition-all duration-300`}
      >
        <LogIn className="mr-2 h-4 w-4" />
        เข้าสู่ระบบด้วย Google
      </Button>
    );
  }

  return (
    <div className={`${compact ? 'w-full' : 'w-64'} border border-white/10 bg-white/[0.04] px-3 py-3 text-white/70`}>
      <div className="flex items-center gap-3">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-10 w-10 rounded-full border border-white/15"
          />
        ) : (
          <div className="h-10 w-10 rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-sm">
            {(profile?.displayName || user.email || 'N').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs text-white/40">บัญชีผู้เล่น</div>
          <div className="truncate text-sm font-medium text-white/85">
            {profile?.displayName || getDefaultPlayerName(user)}
          </div>
          <div className="truncate text-xs text-white/35">{user.email}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onEditProfile}
          className="text-xs text-blue-300/80 hover:text-blue-200 transition-colors"
        >
          แก้ชื่อผู้เล่น
        </button>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white/80 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showGame, setShowGame] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [savedCities, setSavedCities] = useState<SavedCityMeta[]>([]);
  const [dashboardCities, setDashboardCities] = useState<DashboardCity[]>([]);
  const [globalCities, setGlobalCities] = useState<DashboardCity[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [startFreshGame, setStartFreshGame] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(READ_ONLY_VIEW_STORAGE_KEY) === 'true';
  });
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [cityPendingDelete, setCityPendingDelete] = useState<DashboardCity | null>(null);
  const [isDeletingCity, setIsDeletingCity] = useState(false);
  const [deleteCityError, setDeleteCityError] = useState<string | null>(null);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('nps-city-admin-unlocked') === 'true';
  });
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const { isMobileDevice, isSmallScreen } = useMobile();
  const isMobile = isMobileDevice || isSmallScreen;

  const refreshDashboardCities = async () => {
    const localCities = loadSavedCities().filter((city) => !isCityMarkedDeleted(city));
    const remoteCities = (await loadGlobalDashboardCities()).filter((city) => !isCityMarkedDeleted(city));
    setGlobalCities(remoteCities);
    setSavedCities(localCities);
    setDashboardCities(mergeDashboardCities([], remoteCities).filter((city) => !isCityMarkedDeleted(city)));
    setHasSaved(hasSavedGame());
  };

  // Check for saved game and room code in URL after mount
  useEffect(() => {
    const checkSavedGame = () => {
      setIsChecking(false);
      clearLegacyReadOnlyExampleFromPlayableSave();
      const localCities = loadSavedCities().filter((city) => !isCityMarkedDeleted(city));
      const visibleGlobalCities = globalCities.filter((city) => !isCityMarkedDeleted(city));
      setSavedCities(localCities);
      setDashboardCities(mergeDashboardCities([], visibleGlobalCities).filter((city) => !isCityMarkedDeleted(city)));
      setHasSaved(hasSavedGame());
      
      // Check for room code in URL (legacy format) - redirect to new format
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get('room');
      if (roomCode && roomCode.length === 5) {
        // Redirect to new /coop/XXXXX format
        window.location.replace(`/coop/${roomCode.toUpperCase()}`);
        return;
      }
      // Always show landing page - don't auto-load into game
      // User can select from saved cities or start new
    };
    const timer = window.setTimeout(checkSavedGame, 0);
    return () => window.clearTimeout(timer);
  }, [globalCities]);

  useEffect(() => {
    refreshDashboardCities();
  }, []);

  useEffect(() => {
    refreshDashboardCities();
  }, [authUser?.id]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthUser(data.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      console.error('[Auth] Google login failed:', error);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setPlayerProfile(null);
    setShowProfileDialog(false);
  };

  useEffect(() => {
    if (!authUser) {
      setPlayerProfile(null);
      return;
    }

    const user = authUser;
    let cancelled = false;

    async function loadPlayerAccount() {
      const localProfile = loadLocalPlayerProfile(user.id);
      if (localProfile) {
        setPlayerProfile(localProfile);
        setProfileNameInput(localProfile.displayName);
      }

      let profile = localProfile;

      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url, updated_at')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled && !error && data?.display_name) {
          profile = {
            id: data.id,
            displayName: data.display_name,
            email: data.email,
            avatarUrl: data.avatar_url,
            updatedAt: data.updated_at,
          };
          saveLocalPlayerProfile(profile);
          setPlayerProfile(profile);
          setProfileNameInput(profile.displayName);
        }
      }

      if (cancelled) return;

      if (!profile?.displayName) {
        const defaultName = getDefaultPlayerName(user);
        setProfileNameInput(defaultName);
        setShowProfileDialog(true);
      }
    }

    loadPlayerAccount();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const savePlayerProfile = async () => {
    if (!authUser) return;
    const displayName = profileNameInput.trim() || getDefaultPlayerName(authUser);
    const profile: PlayerProfile = {
      id: authUser.id,
      displayName,
      email: authUser.email ?? null,
      avatarUrl: getAvatarUrl(authUser),
      updatedAt: new Date().toISOString(),
    };

    setIsSavingProfile(true);
    saveLocalPlayerProfile(profile);
    setPlayerProfile(profile);

    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          display_name: profile.displayName,
          email: profile.email,
          avatar_url: profile.avatarUrl,
          updated_at: profile.updatedAt,
        });

      if (error) {
        console.warn('[Profile] Saved locally, but Supabase profile table is not ready:', error.message);
      }
    }

    setIsSavingProfile(false);
    setShowProfileDialog(false);
  };

  const profileDialog = (
    <Dialog open={showProfileDialog} onOpenChange={(open) => {
      if (!open && !playerProfile?.displayName) return;
      setShowProfileDialog(open);
    }}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (!playerProfile?.displayName) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!playerProfile?.displayName) event.preventDefault();
        }}
        className="bg-slate-950 border-white/15 text-white"
      >
        <DialogHeader>
          <DialogTitle>ตั้งค่าบัญชีผู้เล่น</DialogTitle>
          <DialogDescription className="text-white/55">
            ชื่อนี้จะแสดงใน NPS City, ห้อง Co-op และ Dashboard ผู้เล่น
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="player-name" className="text-white/75">
            ชื่อผู้เล่น
          </Label>
          <Input
            id="player-name"
            value={profileNameInput}
            onChange={(event) => setProfileNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                savePlayerProfile();
              }
            }}
            maxLength={32}
            className="bg-white/10 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-blue-400"
            placeholder="เช่น Bhurich, ทีมโรงไฟฟ้า, ทีมนิคม"
            autoFocus
          />
          <div className="text-xs text-white/40">
            อีเมล: {authUser?.email}
          </div>
        </div>
        <DialogFooter>
          {playerProfile?.displayName && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProfileDialog(false)}
              className="border-white/15 bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
            >
              ยกเลิก
            </Button>
          )}
          <Button
            type="button"
            onClick={savePlayerProfile}
            disabled={isSavingProfile || profileNameInput.trim().length === 0}
            className="bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {isSavingProfile ? 'กำลังบันทึก...' : 'บันทึกบัญชีผู้เล่น'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Handle exit from game - refresh saved cities list
  const handleExitGame = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const latestState = saved ? decodeSavedGameState(saved) : null;
      if (latestState && isOwnPlayableCity(latestState)) {
        saveCityToIndex(latestState, latestState.currentRoomCode);
        await publishCityToLeaderboard(latestState, authUser, playerProfile, latestState.currentRoomCode);
      }
    } catch (e) {
      console.warn('[Dashboard] Failed to sync city on exit:', e);
    }

    setShowGame(false);
    setIsMultiplayer(false);
    setStartFreshGame(false);
    setReadOnlyMode(false);
    localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
    localStorage.removeItem(READ_ONLY_EXAMPLE_STORAGE_KEY);
    await refreshDashboardCities();
    // Clear room code from URL
    window.history.replaceState({}, '', '/');
  };

  // Load a saved city
  const loadSavedCity = (city: SavedCityMeta) => {
    // If it's a multiplayer city, navigate to the room
    if (city.roomCode) {
      window.history.replaceState({}, '', `/coop/${city.roomCode}`);
      setPendingRoomCode(city.roomCode);
      setShowCoopModal(true);
      return;
    }
    
    // Otherwise load from local storage
    try {
      const saved = localStorage.getItem(SAVED_CITY_PREFIX + city.id);
      if (saved) {
        localStorage.setItem(STORAGE_KEY, saved);
        localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
        localStorage.removeItem(READ_ONLY_EXAMPLE_STORAGE_KEY);
        setReadOnlyMode(false);
        setShowGame(true);
      }
    } catch {
      console.error('Failed to load saved city');
    }
  };

  const openReadOnlyState = (state: GameState) => {
    try {
      const viewerState: GameState = {
        ...state,
        speed: 0,
        selectedTool: 'select',
        activePanel: 'none',
        currentRoomCode: undefined,
      };
      const compressed = compressToUTF16(JSON.stringify(viewerState));
      localStorage.setItem(READ_ONLY_EXAMPLE_STORAGE_KEY, compressed);
      localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, 'true');
      setIsMultiplayer(false);
      setStartFreshGame(false);
      setReadOnlyMode(true);
      setShowGame(true);
    } catch (e) {
      console.error('Failed to open read-only city:', e);
    }
  };

  const viewSavedCity = async (city: DashboardCity) => {
    try {
      const saved = localStorage.getItem(SAVED_CITY_PREFIX + city.id);
      const localState = saved ? decodeSavedGameState(saved) : null;
      if (localState) {
        openReadOnlyState({
          ...localState,
          cityName: localState.cityName || city.cityName,
          currentRoomCode: city.roomCode?.toUpperCase() || localState.currentRoomCode,
        });
        return;
      }
    } catch (e) {
      console.error('Failed to view local city snapshot:', e);
    }

    if (city.gameState) {
      const globalState = decodeSavedGameState(city.gameState);
      if (globalState) {
        openReadOnlyState({
          ...globalState,
          cityName: globalState.cityName || city.cityName,
          currentRoomCode: city.roomCode?.toUpperCase() || globalState.currentRoomCode,
        });
        return;
      }
    }

    if (city.roomCode) {
      const room = await loadGameRoom(city.roomCode);
      if (room?.gameState) {
        const roomState = room.gameState as GameState;
        openReadOnlyState({
          ...roomState,
          cityName: room.cityName || roomState.cityName || city.cityName,
          currentRoomCode: city.roomCode.toUpperCase(),
        });
        return;
      }
    }
  };

  const requestDeleteCity = (city: DashboardCity) => {
    setDeleteCityError(null);
    setCityPendingDelete(city);
  };

  // Delete a saved city from local storage and Supabase.
  const confirmDeleteCity = async () => {
    if (!cityPendingDelete) return;
    setIsDeletingCity(true);
    setDeleteCityError(null);
    try {
      const city = cityPendingDelete;
      markCityDeleted(city);

      // Remove only the real local saved index. Do not write merged global rows back to localStorage.
      const normalizedRoomCode = city.roomCode?.toUpperCase();
      const updatedLocalCities = loadSavedCities().filter(c => {
        if (c.id === city.id) return false;
        if (normalizedRoomCode && c.roomCode?.toUpperCase() === normalizedRoomCode) return false;
        return true;
      });
      localStorage.setItem(SAVED_CITIES_INDEX_KEY, JSON.stringify(updatedLocalCities));
      setSavedCities((currentCities) => currentCities.filter(c => {
        if (c.id === city.id) return false;
        if (normalizedRoomCode && c.roomCode?.toUpperCase() === normalizedRoomCode) return false;
        return !isCityMarkedDeleted(c);
      }));
      setDashboardCities((currentCities) => currentCities.filter(c => {
        if (c.id === city.id) return false;
        if (normalizedRoomCode && c.roomCode?.toUpperCase() === normalizedRoomCode) return false;
        return !isCityMarkedDeleted(c);
      }));
      
      // Also remove the stored snapshot for both local and co-op cities.
      localStorage.removeItem(SAVED_CITY_PREFIX + city.id);
      if (normalizedRoomCode) {
        localStorage.removeItem(SAVED_CITY_PREFIX + `coop-${normalizedRoomCode}`);
      }
      const deletedFromCloud = await deleteCityFromLeaderboard(city);
      setCityPendingDelete(null);
      await refreshDashboardCities();

      if (!deletedFromCloud && isSupabaseConfigured) {
        setDeleteCityError('ลบในเครื่องแล้ว แต่ Supabase ยังลบไม่สำเร็จ ตรวจสอบ policy ของตาราง city_leaderboard/game_rooms');
      }
    } catch {
      setDeleteCityError('ลบเมืองไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsDeletingCity(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPasscodeInput === ADMIN_PASSCODE) {
      sessionStorage.setItem('nps-city-admin-unlocked', 'true');
      setAdminUnlocked(true);
      setAdminLoginError(null);
      setAdminPasscodeInput('');
      return;
    }
    setAdminLoginError('รหัส Admin ไม่ถูกต้อง');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('nps-city-admin-unlocked');
    setAdminUnlocked(false);
    setAdminPasscodeInput('');
  };

  const landingDialogs = (
    <>
      <AdminDialog
        open={showAdminDialog}
        unlocked={adminUnlocked}
        passcode={adminPasscodeInput}
        error={adminLoginError}
        cities={dashboardCities}
        isDeleting={isDeletingCity}
        onOpenChange={setShowAdminDialog}
        onPasscodeChange={setAdminPasscodeInput}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onRefresh={refreshDashboardCities}
        onDeleteCity={requestDeleteCity}
      />

      <Dialog open={Boolean(cityPendingDelete)} onOpenChange={(open) => {
        if (!open && !isDeletingCity) {
          setCityPendingDelete(null);
          setDeleteCityError(null);
        }
      }}>
        <DialogContent className="border-red-300/20 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบเมือง</DialogTitle>
            <DialogDescription className="text-white/55">
              การลบนี้จะลบเมืองออกจากรายการบันทึก และถ้าเมืองอยู่บน Supabase จะลบออกจาก Dashboard/ห้อง Co-op จริงด้วย
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm text-white/45">เมืองที่จะลบ</div>
            <div className="mt-1 text-xl font-semibold text-white">{cityPendingDelete?.cityName || '-'}</div>
            <div className="mt-2 text-sm text-white/50">
              เงิน {formatCurrency(cityPendingDelete?.money ?? 0)} · สุข {percentValue(cityPendingDelete?.happiness)}% · สิ่งแวดล้อม {percentValue(cityPendingDelete?.environment)}%
            </div>
          </div>
          {deleteCityError && (
            <div className="rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {deleteCityError}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingCity}
              onClick={() => {
                setCityPendingDelete(null);
                setDeleteCityError(null);
              }}
              className="border-white/15 bg-white/5 text-white hover:bg-white/15"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              disabled={isDeletingCity}
              onClick={confirmDeleteCity}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {isDeletingCity ? 'กำลังลบ...' : 'ยืนยันการลบเมือง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Handle co-op game start
  const handleCoopStart = (isHost: boolean, initialState?: GameState, roomCode?: string) => {
    setIsMultiplayer(true);
    setReadOnlyMode(false);
    localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
    localStorage.removeItem(READ_ONLY_EXAMPLE_STORAGE_KEY);
    
    if (isHost && initialState) {
      // Host starts with the state they created - save it so GameProvider loads it
      try {
        const stateWithRoom = roomCode ? { ...initialState, currentRoomCode: roomCode.toUpperCase() } : initialState;
        const compressed = compressToUTF16(JSON.stringify(stateWithRoom));
        localStorage.setItem(STORAGE_KEY, compressed);
        
        // Also save to saved cities index so it appears on homepage
        if (roomCode) {
          markOwnedRoomCode(roomCode);
          saveCityToIndex(stateWithRoom, roomCode);
          void publishCityToLeaderboard(stateWithRoom, authUser, playerProfile, roomCode);
        }
      } catch (e) {
        console.error('Failed to save co-op state:', e);
      }
      setStartFreshGame(false);
    } else if (isHost) {
      // Host without state - fallback to fresh game
      setStartFreshGame(true);
    } else if (initialState) {
      // Guest received state from host - save it so GameProvider loads it
      try {
        const stateWithRoom = roomCode ? { ...initialState, currentRoomCode: roomCode.toUpperCase() } : initialState;
        const compressed = compressToUTF16(JSON.stringify(stateWithRoom));
        localStorage.setItem(STORAGE_KEY, compressed);
        
        // Guests can collaborate in the room, but it is not saved as their own city.
      } catch (e) {
        console.error('Failed to save co-op state:', e);
      }
      setStartFreshGame(false);
    } else {
      // Guest without state - fallback to fresh game
      setStartFreshGame(true);
    }
    
    setShowGame(true);
  };

  const startPlayableGame = () => {
    localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
    localStorage.removeItem(READ_ONLY_EXAMPLE_STORAGE_KEY);
    clearLegacyReadOnlyExampleFromPlayableSave();
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? decodeSavedGameState(saved) : null;
    if (parsed && !isOwnPlayableCity(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReadOnlyMode(false);
    setShowGame(true);
  };

  const openCoopSetup = () => {
    localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
    localStorage.removeItem(READ_ONLY_EXAMPLE_STORAGE_KEY);
    setReadOnlyMode(false);
    setShowCoopModal(true);
  };

  const loadReadOnlyExample = async () => {
    if (window.location.search.includes('room=')) {
      window.history.replaceState({}, '', '/');
      setPendingRoomCode(null);
    }

    try {
      const response = await fetch('/example-states/example_state_9.json');
      const exampleState = (await response.json()) as GameState;
      const compressed = compressToUTF16(JSON.stringify({
        ...exampleState,
        cityName: 'เมืองตัวอย่าง',
        speed: 0,
        selectedTool: 'select',
        activePanel: 'none',
      }));
      localStorage.setItem(READ_ONLY_EXAMPLE_STORAGE_KEY, compressed);
      localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Failed to save example state:', e);
    }

    setIsMultiplayer(false);
    setStartFreshGame(false);
    setReadOnlyMode(true);
    setShowGame(true);
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white/60"><T>Loading...</T></div>
      </main>
    );
  }

  if (showGame) {
    const gameContent = (
      <main className="h-screen w-screen overflow-hidden">
        <Game onExit={handleExitGame} viewerMode={readOnlyMode} />
      </main>
    );

    // Always wrap in MultiplayerContextProvider so players can invite others from within the game
    return (
      <MultiplayerContextProvider>
        <GameProvider startFresh={startFreshGame} readOnly={readOnlyMode}>
          {gameContent}
        </GameProvider>
      </MultiplayerContextProvider>
    );
  }

  // Mobile landing page
  if (isMobile) {
    return (
      <MultiplayerContextProvider>
        <main className="h-[100dvh] max-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto">
          <AdminAccessButton onClick={() => setShowAdminDialog(true)} />
          {/* Spacer to push content down slightly from top */}
          <div className="flex-shrink-0 h-4 sm:h-8" />
          
          {/* Title - smaller on very small screens */}
          <h1 className="text-4xl sm:text-5xl font-light tracking-wider text-white/90 mb-4 sm:mb-6 flex-shrink-0">
            NPS City
          </h1>
          
          {/* Sprite Gallery - smaller on mobile, contained */}
          <div className="mb-4 sm:mb-6 flex-shrink-0">
            <SpriteGallery count={9} cols={3} cellSize={56} />
          </div>
          
          {/* Buttons - more compact */}
          <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-xs flex-shrink-0">
            <AuthControls
              user={authUser}
              profile={playerProfile}
              loading={authLoading}
              onLogin={handleGoogleLogin}
              onLogout={handleLogout}
              onEditProfile={() => {
                setProfileNameInput(playerProfile?.displayName || (authUser ? getDefaultPlayerName(authUser) : ''));
                setShowProfileDialog(true);
              }}
              compact
            />

            <Button 
              onClick={startPlayableGame}
              className="w-full py-4 sm:py-6 text-lg sm:text-xl font-light tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-none transition-all duration-300"
            >
              {hasSaved ? <T>Continue</T> : <T>New Game</T>}
            </Button>

            <Button
              onClick={openCoopSetup}
              variant="outline"
              className="w-full py-4 sm:py-6 text-lg sm:text-xl font-light tracking-wide bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/15 rounded-none transition-all duration-300"
            >
              <T>Co-op</T>
            </Button>

            <Button
              onClick={loadReadOnlyExample}
              variant="outline"
              className="w-full py-4 sm:py-6 text-lg sm:text-xl font-light tracking-wide bg-transparent hover:bg-white/10 text-white/40 hover:text-white/60 border border-white/10 rounded-none transition-all duration-300"
            >
              <T>Load Example</T>
            </Button>
            <div className="flex items-start justify-end w-full">
              <LanguageSelector variant="ghost" className="text-white/40 hover:text-white/70 hover:bg-white/10" />
            </div>
          </div>

          {savedCities.length > 0 && (
            <section className="mt-4 w-full max-w-xs flex-shrink-0">
              <div className="mb-2 text-sm font-medium text-white/65">เมืองที่บันทึกไว้</div>
              <div className="max-h-48 overflow-y-auto border border-white/10 bg-white/[0.035]">
                {savedCities.map((city) => (
                  <SavedCityCard
                    key={`${city.id}-${city.roomCode || 'local'}`}
                    city={city}
                    onLoad={() => loadSavedCity(city)}
                    onDelete={() => requestDeleteCity(city)}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Dashboard - read-only city viewer */}
          {dashboardCities.length > 0 && (
            <div className="mt-3 w-full flex-1">
              <CityDashboard cities={dashboardCities} onView={viewSavedCity} compact />
            </div>
          )}
          
          {/* Bottom spacer */}
          <div className="flex-shrink-0 h-2" />
          
          {/* Co-op Modal */}
          <CoopModal
            open={showCoopModal}
            onOpenChange={setShowCoopModal}
            onStartGame={handleCoopStart}
            pendingRoomCode={pendingRoomCode}
          />
          {profileDialog}
          {landingDialogs}
        </main>
      </MultiplayerContextProvider>
    );
  }

  // Desktop landing page
  return (
    <MultiplayerContextProvider>
      <main className="h-screen overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <AdminAccessButton onClick={() => setShowAdminDialog(true)} />
        <div className="mx-auto max-w-7xl w-full space-y-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Title and Start Button */}
            <div className="flex flex-col items-center lg:items-start justify-center space-y-12">
            <h1 className="text-8xl font-light tracking-wider text-white/90">
              NPS City
            </h1>
            <div className="flex flex-col gap-3">
              <AuthControls
                user={authUser}
                profile={playerProfile}
                loading={authLoading}
                onLogin={handleGoogleLogin}
                onLogout={handleLogout}
                onEditProfile={() => {
                  setProfileNameInput(playerProfile?.displayName || (authUser ? getDefaultPlayerName(authUser) : ''));
                  setShowProfileDialog(true);
                }}
              />

              <Button 
                onClick={startPlayableGame}
                className="w-64 py-8 text-2xl font-light tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-none transition-all duration-300"
              >
                {hasSaved ? <T>Continue</T> : <T>New Game</T>}
              </Button>
              <Button
                onClick={openCoopSetup}
                variant="outline"
                className="w-64 py-8 text-2xl font-light tracking-wide bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/15 rounded-none transition-all duration-300"
              >
                <T>Co-op</T>
              </Button>
              <Button
                onClick={loadReadOnlyExample}
                variant="outline"
                className="w-64 py-8 text-2xl font-light tracking-wide bg-transparent hover:bg-white/10 text-white/40 hover:text-white/60 border border-white/10 rounded-none transition-all duration-300"
              >
                <T>Load Example</T>
              </Button>
              <div className="flex items-start justify-end w-64">
                <LanguageSelector variant="ghost" className="text-white/40 hover:text-white/70 hover:bg-white/10" />
              </div>
            </div>

            {savedCities.length > 0 && (
              <section className="w-64">
                <div className="mb-2 text-sm font-medium text-white/65">เมืองที่บันทึกไว้</div>
                <div className="max-h-64 overflow-y-auto border border-white/10 bg-white/[0.035]">
                  {savedCities.map((city) => (
                    <SavedCityCard
                      key={`${city.id}-${city.roomCode || 'local'}`}
                      city={city}
                      onLoad={() => loadSavedCity(city)}
                      onDelete={() => requestDeleteCity(city)}
                    />
                  ))}
                </div>
              </section>
            )}
            </div>

            {/* Right - Sprite Gallery */}
            <div className="flex justify-center lg:justify-end">
              <SpriteGallery count={16} />
            </div>
          </div>

          {/* Dashboard */}
          {dashboardCities.length > 0 && (
            <CityDashboard cities={dashboardCities} onView={viewSavedCity} />
          )}
        </div>
        
        {/* Co-op Modal */}
        <CoopModal
          open={showCoopModal}
          onOpenChange={setShowCoopModal}
          onStartGame={handleCoopStart}
          pendingRoomCode={pendingRoomCode}
        />
        {profileDialog}
        {landingDialogs}
      </main>
    </MultiplayerContextProvider>
  );
}
