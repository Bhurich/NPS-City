import {
  BUILDING_STATS,
  BuildingType,
  GameState,
  NpsChallengeState,
  Tile,
} from '@/types/game';

export const NPS_STARTING_MONEY = 1_500_000;
export const NPS_SEASON_LENGTH_DAYS = 14;

export type NpsScoreKey = 'economy' | 'energy' | 'environment' | 'community' | 'safety';

export type NpsMission = {
  id: string;
  day: number;
  title: string;
  description: string;
  reward: number;
  checks: { label: string; complete: (metrics: NpsCityMetrics, state: GameState) => boolean }[];
};

export type NpsEvent = {
  day: number;
  title: string;
  description: string;
  impact: string;
};

export type NpsCityMetrics = {
  roads: number;
  residentialZones: number;
  commercialZones: number;
  industrialZones: number;
  industrialBuildings: number;
  powerPlants: number;
  waterSystems: number;
  parks: number;
  communityBuildings: number;
  safetyBuildings: number;
  serviceBuildings: number;
  cleanEnergyBuildings: number;
  energySupply: number;
  energyDemand: number;
  energyReservePercent: number;
  monthlyNetIncome: number;
  allScoresAbove60: boolean;
};

export type NpsChallengeSummary = {
  challenge: NpsChallengeState;
  campaignDay: number;
  metrics: NpsCityMetrics;
  scores: Record<NpsScoreKey, number>;
  score: number;
  completedMissions: NpsMission[];
  availableMissions: NpsMission[];
  nextMissions: NpsMission[];
  activeEvent: NpsEvent | null;
  awardHints: string[];
  cityLevel: number;
};

const INDUSTRIAL_TYPES = new Set<BuildingType>(['factory_small', 'factory_medium', 'factory_large', 'warehouse']);
const PARK_TYPES = new Set<BuildingType>([
  'tree',
  'park',
  'park_large',
  'tennis',
  'basketball_courts',
  'playground_small',
  'playground_large',
  'baseball_field_small',
  'soccer_field_small',
  'football_field',
  'swimming_pool',
  'skate_park',
  'mini_golf_course',
  'bleachers_field',
  'amphitheater',
  'greenhouse_garden',
  'community_garden',
  'pond_park',
  'park_gate',
  'campground',
  'mountain_trailhead',
]);
const COMMUNITY_TYPES = new Set<BuildingType>(['community_center', 'school', 'university', 'hospital', 'city_hall']);
const SAFETY_TYPES = new Set<BuildingType>(['police_station', 'fire_station', 'hospital']);
const SERVICE_TYPES = new Set<BuildingType>([
  'police_station',
  'fire_station',
  'hospital',
  'school',
  'university',
  'water_tower',
  'power_plant',
  'subway_station',
  'rail_station',
]);

export const NPS_EVENTS: NpsEvent[] = [
  {
    day: 3,
    title: 'ไฟฟ้าพีค',
    description: 'ความต้องการใช้ไฟเพิ่มขึ้น เมืองที่มีไฟสำรองจะเดินหน้าต่อได้ดี',
    impact: 'พยายามมีพลังงานสำรองอย่างน้อย 10%',
  },
  {
    day: 6,
    title: 'ชุมชนจับตาสิ่งแวดล้อม',
    description: 'ชุมชนเริ่มให้ความสำคัญกับพื้นที่สีเขียวและระบบบำบัด',
    impact: 'คะแนนสิ่งแวดล้อมควรมากกว่า 65',
  },
  {
    day: 9,
    title: 'ต้นทุนพลังงานสูงขึ้น',
    description: 'เมืองที่พึ่งพาโรงไฟฟ้าอย่างเดียวจะกดดันด้านต้นทุน',
    impact: 'เพิ่มรายได้สุทธิและรักษาพลังงานสำรอง',
  },
  {
    day: 11,
    title: 'ลูกค้าต้องการนิคมสีเขียว',
    description: 'นิคมที่มีอุตสาหกรรมและสิ่งแวดล้อมดีจะได้เปรียบ',
    impact: 'มีอุตสาหกรรมอย่างน้อย 6 จุด และสิ่งแวดล้อมมากกว่า 75',
  },
  {
    day: 14,
    title: 'วันส่งเมืองเข้าประกวด',
    description: 'ล็อกคะแนนสุดท้ายของแคมเปญ และเลือกจุดเด่นของเมือง',
    impact: 'เป้าหมายหลักคือ NPS City Score มากกว่า 75',
  },
];

export const NPS_MISSIONS: NpsMission[] = [
  {
    id: 'day-1-foundation',
    day: 1,
    title: 'ตั้งเมืองเริ่มต้น',
    description: 'วางโครงเมืองให้พร้อมเติบโต',
    reward: 50_000,
    checks: [
      { label: 'สร้างถนนอย่างน้อย 5 ช่อง', complete: (m) => m.roads >= 5 },
      { label: 'วางเขตที่อยู่อาศัย 2 จุด', complete: (m) => m.residentialZones >= 2 },
      { label: 'วางเขตพาณิชย์ 1 จุด', complete: (m) => m.commercialZones >= 1 },
    ],
  },
  {
    id: 'day-2-economy',
    day: 2,
    title: 'เริ่มเศรษฐกิจ',
    description: 'สร้างงานและรายได้แรกของเมือง',
    reward: 60_000,
    checks: [
      { label: 'วางเขตอุตสาหกรรม 2 จุด', complete: (m) => m.industrialZones >= 2 },
      { label: 'รายได้สุทธิต่อเดือนมากกว่า 50,000', complete: (m) => m.monthlyNetIncome >= 50_000 },
    ],
  },
  {
    id: 'day-3-energy',
    day: 3,
    title: 'พลังงานต้องพอ',
    description: 'เมืองอุตสาหกรรมต้องมีไฟฟ้ามั่นคง',
    reward: 70_000,
    checks: [
      { label: 'สร้างโรงไฟฟ้า 1 แห่ง', complete: (m) => m.powerPlants >= 1 },
      { label: 'พลังงานสำรองอย่างน้อย 10%', complete: (m) => m.energyReservePercent >= 10 },
    ],
  },
  {
    id: 'day-4-industrial-estate',
    day: 4,
    title: 'นิคมอุตสาหกรรม',
    description: 'ขยายฐานการผลิตให้มีน้ำหนักจริง',
    reward: 80_000,
    checks: [
      { label: 'มีเขตอุตสาหกรรม 5 จุด', complete: (m) => m.industrialZones >= 5 },
      { label: 'มีอาคารอุตสาหกรรมอย่างน้อย 2 จุด', complete: (m) => m.industrialBuildings >= 2 },
    ],
  },
  {
    id: 'day-5-community',
    day: 5,
    title: 'ดูแลชุมชน',
    description: 'เมืองที่ดีต้องน่าอยู่ ไม่ใช่แค่ผลิตได้',
    reward: 80_000,
    checks: [
      { label: 'สร้างสวนหรือพื้นที่สีเขียว 1 จุด', complete: (m) => m.parks >= 1 },
      { label: 'คะแนนชุมชนมากกว่า 60', complete: (_m, state) => state.stats.happiness >= 60 },
    ],
  },
  {
    id: 'day-6-environment',
    day: 6,
    title: 'สิ่งแวดล้อม',
    description: 'รักษาคุณภาพพื้นที่รอบนิคม',
    reward: 90_000,
    checks: [
      { label: 'สร้างระบบน้ำหรือสาธารณูปโภค 1 จุด', complete: (m) => m.waterSystems >= 1 },
      { label: 'สิ่งแวดล้อมมากกว่า 65', complete: (_m, state) => state.stats.environment >= 65 },
    ],
  },
  {
    id: 'day-7-mid-score',
    day: 7,
    title: 'Mid Challenge',
    description: 'เมืองควรเริ่มนิ่งและมีกระแสเงินสดเหลือ',
    reward: 100_000,
    checks: [
      { label: 'NPS City Score มากกว่า 60', complete: (_m, state) => calculateNpsScores(state).score >= 60 },
      { label: 'เงินคงเหลือมากกว่า 100,000', complete: (_m, state) => state.stats.money >= 100_000 },
    ],
  },
  {
    id: 'day-8-power-growth',
    day: 8,
    title: 'ความต้องการไฟเพิ่ม',
    description: 'เพิ่มกำลังผลิตโดยไม่ทำลายสมดุลสิ่งแวดล้อม',
    reward: 100_000,
    checks: [
      { label: 'พลังงานสำรองมากกว่า 30%', complete: (m) => m.energyReservePercent >= 30 },
      { label: 'สิ่งแวดล้อมไม่ต่ำกว่า 55', complete: (_m, state) => state.stats.environment >= 55 },
    ],
  },
  {
    id: 'day-9-cost-control',
    day: 9,
    title: 'ลดต้นทุน',
    description: 'รักษากำไรให้พอสำหรับการเติบโตระยะยาว',
    reward: 110_000,
    checks: [
      { label: 'รายได้สุทธิต่อเดือนมากกว่า 100,000', complete: (m) => m.monthlyNetIncome >= 100_000 },
      { label: 'มีบริการพื้นฐานอย่างน้อย 2 จุด', complete: (m) => m.serviceBuildings >= 2 },
    ],
  },
  {
    id: 'day-10-community-feedback',
    day: 10,
    title: 'ชุมชนร้องเรียน',
    description: 'ฟื้นความเชื่อมั่นให้ชุมชนรอบนิคม',
    reward: 120_000,
    checks: [
      { label: 'คะแนนชุมชนมากกว่า 70', complete: (_m, state) => state.stats.happiness >= 70 },
      { label: 'มีสวนหรือศูนย์ชุมชนรวม 3 จุด', complete: (m) => m.parks + m.communityBuildings >= 3 },
    ],
  },
  {
    id: 'day-11-green-estate',
    day: 11,
    title: 'Green Industrial Estate',
    description: 'พิสูจน์ว่าอุตสาหกรรมและสิ่งแวดล้อมไปด้วยกันได้',
    reward: 130_000,
    checks: [
      { label: 'สิ่งแวดล้อมมากกว่า 75', complete: (_m, state) => state.stats.environment >= 75 },
      { label: 'มีอุตสาหกรรมอย่างน้อย 6 จุด', complete: (m) => m.industrialZones + m.industrialBuildings >= 6 },
    ],
  },
  {
    id: 'day-12-balanced-growth',
    day: 12,
    title: 'เติบโตอย่างสมดุล',
    description: 'ไม่มีคะแนนด้านไหนถูกทิ้งไว้ข้างหลัง',
    reward: 140_000,
    checks: [
      { label: 'ขยายเมืองอย่างน้อย 1 ครั้ง', complete: (_m, state) => state.gridSize > 70 },
      { label: 'คะแนนทุกด้านมากกว่า 60', complete: (m) => m.allScoresAbove60 },
    ],
  },
  {
    id: 'day-13-final-tune',
    day: 13,
    title: 'Final Optimization',
    description: 'จูนเมืองก่อนส่งประกวด',
    reward: 150_000,
    checks: [
      { label: 'รายได้สุทธิต่อเดือนมากกว่า 150,000', complete: (m) => m.monthlyNetIncome >= 150_000 },
      { label: 'พลังงานสำรองมากกว่า 20%', complete: (m) => m.energyReservePercent >= 20 },
      { label: 'ชุมชนมากกว่า 70', complete: (_m, state) => state.stats.happiness >= 70 },
    ],
  },
  {
    id: 'day-14-submit-city',
    day: 14,
    title: 'ส่งเมืองเข้าประกวด',
    description: 'ปิดแคมเปญด้วยเมืองที่บาลานซ์และมีเอกลักษณ์',
    reward: 200_000,
    checks: [
      { label: 'NPS City Score มากกว่า 75', complete: (_m, state) => calculateNpsScores(state).score >= 75 },
      { label: 'มีจุดเด่นอย่างน้อย 1 ด้านมากกว่า 85', complete: (_m, state) => Object.values(calculateNpsScores(state).scores).some((score) => score >= 85) },
    ],
  },
];

export function createInitialNpsChallenge(startedAt = Date.now()): NpsChallengeState {
  return {
    mode: 'season',
    seasonName: '14-Day Smart Land Challenge',
    startedAt,
    completedMissionIds: [],
  };
}

export function getNpsChallenge(state: GameState): NpsChallengeState {
  return state.npsChallenge ?? createInitialNpsChallenge();
}

export function countBuildings(grid: Tile[][], types: Set<BuildingType>): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (types.has(tile.building.type)) count++;
    }
  }
  return count;
}

export function getNpsMetrics(state: GameState): NpsCityMetrics {
  let roads = 0;
  let residentialZones = 0;
  let commercialZones = 0;
  let industrialZones = 0;
  let energyDemand = 0;
  let energySupply = 0;

  for (const row of state.grid) {
    for (const tile of row) {
      if (tile.building.type === 'road' || tile.building.type === 'bridge') roads++;
      if (tile.zone === 'residential') {
        residentialZones++;
        energyDemand += 5;
      }
      if (tile.zone === 'commercial') {
        commercialZones++;
        energyDemand += 8;
      }
      if (tile.zone === 'industrial') {
        industrialZones++;
        energyDemand += 18;
      }

      const buildingType = tile.building.type;
      const stats = BUILDING_STATS[buildingType];
      if (stats?.maxJobs) energyDemand += Math.ceil(stats.maxJobs / 12);
      if (stats?.maxPop) energyDemand += Math.ceil(stats.maxPop / 30);
      if (buildingType === 'power_plant') energySupply += 80;
      if (buildingType === 'greenhouse_garden' || buildingType === 'community_garden') energySupply += 6;
    }
  }

  const powerPlants = countBuildings(state.grid, new Set<BuildingType>(['power_plant']));
  const waterSystems = countBuildings(state.grid, new Set<BuildingType>(['water_tower']));
  const industrialBuildings = countBuildings(state.grid, INDUSTRIAL_TYPES);
  const parks = countBuildings(state.grid, PARK_TYPES);
  const communityBuildings = countBuildings(state.grid, COMMUNITY_TYPES);
  const safetyBuildings = countBuildings(state.grid, SAFETY_TYPES);
  const serviceBuildings = countBuildings(state.grid, SERVICE_TYPES);
  const cleanEnergyBuildings = countBuildings(state.grid, new Set<BuildingType>(['greenhouse_garden', 'community_garden']));
  const energyReservePercent = energyDemand === 0 ? (energySupply > 0 ? 100 : 0) : ((energySupply - energyDemand) / energyDemand) * 100;
  const monthlyNetIncome = state.stats.income - state.stats.expenses;
  const scoreData = calculateNpsScores(state);

  return {
    roads,
    residentialZones,
    commercialZones,
    industrialZones,
    industrialBuildings,
    powerPlants,
    waterSystems,
    parks,
    communityBuildings,
    safetyBuildings,
    serviceBuildings,
    cleanEnergyBuildings,
    energySupply,
    energyDemand,
    energyReservePercent,
    monthlyNetIncome,
    allScoresAbove60: Object.values(scoreData.scores).every((score) => score >= 60),
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateNpsScores(state: GameState): { scores: Record<NpsScoreKey, number>; score: number } {
  const metrics = getNpsMetricsWithoutScores(state);
  const economy = clampScore(
    Math.min(65, Math.max(0, metrics.monthlyNetIncome / 2_500)) +
    Math.min(25, state.stats.jobs / 40) +
    Math.min(10, state.stats.money / 100_000)
  );
  const reserve = metrics.energyReservePercent;
  const energy = clampScore(
    metrics.energySupply === 0
      ? 0
      : 55 + Math.min(35, Math.max(0, reserve)) - (reserve < 0 ? Math.min(55, Math.abs(reserve)) : 0) + Math.min(10, metrics.cleanEnergyBuildings * 5)
  );
  const environment = clampScore(state.stats.environment + Math.min(12, metrics.parks * 1.5) - Math.max(0, metrics.industrialBuildings - metrics.parks) * 2);
  const community = clampScore((state.stats.happiness * 0.75) + Math.min(25, (metrics.communityBuildings + metrics.parks) * 4));
  const safety = clampScore((state.stats.safety * 0.75) + Math.min(25, metrics.safetyBuildings * 8));
  const scores = { economy, energy, environment, community, safety };
  const score = clampScore(
    economy * 0.25 +
    energy * 0.25 +
    environment * 0.2 +
    community * 0.2 +
    safety * 0.1
  );

  return { scores, score };
}

function getNpsMetricsWithoutScores(state: GameState): Omit<NpsCityMetrics, 'allScoresAbove60'> {
  let roads = 0;
  let residentialZones = 0;
  let commercialZones = 0;
  let industrialZones = 0;
  let energyDemand = 0;
  let energySupply = 0;

  for (const row of state.grid) {
    for (const tile of row) {
      if (tile.building.type === 'road' || tile.building.type === 'bridge') roads++;
      if (tile.zone === 'residential') {
        residentialZones++;
        energyDemand += 5;
      }
      if (tile.zone === 'commercial') {
        commercialZones++;
        energyDemand += 8;
      }
      if (tile.zone === 'industrial') {
        industrialZones++;
        energyDemand += 18;
      }

      const buildingType = tile.building.type;
      const stats = BUILDING_STATS[buildingType];
      if (stats?.maxJobs) energyDemand += Math.ceil(stats.maxJobs / 12);
      if (stats?.maxPop) energyDemand += Math.ceil(stats.maxPop / 30);
      if (buildingType === 'power_plant') energySupply += 80;
      if (buildingType === 'greenhouse_garden' || buildingType === 'community_garden') energySupply += 6;
    }
  }

  return {
    roads,
    residentialZones,
    commercialZones,
    industrialZones,
    industrialBuildings: countBuildings(state.grid, INDUSTRIAL_TYPES),
    powerPlants: countBuildings(state.grid, new Set<BuildingType>(['power_plant'])),
    waterSystems: countBuildings(state.grid, new Set<BuildingType>(['water_tower'])),
    parks: countBuildings(state.grid, PARK_TYPES),
    communityBuildings: countBuildings(state.grid, COMMUNITY_TYPES),
    safetyBuildings: countBuildings(state.grid, SAFETY_TYPES),
    serviceBuildings: countBuildings(state.grid, SERVICE_TYPES),
    cleanEnergyBuildings: countBuildings(state.grid, new Set<BuildingType>(['greenhouse_garden', 'community_garden'])),
    energySupply,
    energyDemand,
    energyReservePercent: energyDemand === 0 ? (energySupply > 0 ? 100 : 0) : ((energySupply - energyDemand) / energyDemand) * 100,
    monthlyNetIncome: state.stats.income - state.stats.expenses,
  };
}

export function getCampaignDay(challenge: NpsChallengeState): number {
  const elapsed = Math.floor((Date.now() - challenge.startedAt) / 86_400_000) + 1;
  return Math.max(1, Math.min(NPS_SEASON_LENGTH_DAYS, elapsed));
}

export function getMissionProgress(mission: NpsMission, metrics: NpsCityMetrics, state: GameState) {
  const checks = mission.checks.map((check) => ({
    label: check.label,
    complete: check.complete(metrics, state),
  }));
  return {
    checks,
    complete: checks.every((check) => check.complete),
  };
}

export function getNpsChallengeSummary(state: GameState): NpsChallengeSummary {
  const challenge = getNpsChallenge(state);
  const campaignDay = challenge.mode === 'freebuild' ? NPS_SEASON_LENGTH_DAYS : getCampaignDay(challenge);
  const metrics = getNpsMetrics(state);
  const scoreData = calculateNpsScores(state);
  const availableMissions = NPS_MISSIONS.filter((mission) => mission.day <= campaignDay);
  const completedMissions = availableMissions.filter((mission) => getMissionProgress(mission, metrics, state).complete);
  const nextMissions = NPS_MISSIONS.filter((mission) => mission.day > campaignDay).slice(0, 3);
  const activeEvent = [...NPS_EVENTS].reverse().find((event) => event.day <= campaignDay) ?? null;
  const cityLevel = Math.max(1, Math.min(50, Math.floor((scoreData.score + completedMissions.length * 5 + state.stats.population / 200) / 8)));
  const awardHints = getAwardHints(state, metrics, scoreData.scores);

  return {
    challenge,
    campaignDay,
    metrics,
    scores: scoreData.scores,
    score: scoreData.score,
    completedMissions,
    availableMissions,
    nextMissions,
    activeEvent,
    awardHints,
    cityLevel,
  };
}

function getAwardHints(state: GameState, metrics: NpsCityMetrics, scores: Record<NpsScoreKey, number>) {
  const hints: string[] = [];
  if (scores.environment >= 80) hints.push('Greenest City');
  if (scores.energy >= 80) hints.push('Power Master');
  if (scores.community >= 80) hints.push('People’s City');
  if (scores.economy >= 80) hints.push('Best Industrial Estate');
  if (Object.values(scores).every((score) => score >= 75)) hints.push('Balanced City');
  if (state.gridSize > 70 && metrics.parks >= 5) hints.push('Smart Land Designer');
  return hints.length > 0 ? hints : ['Rising Smart Land'];
}
