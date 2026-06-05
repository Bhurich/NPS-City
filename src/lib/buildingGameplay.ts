import { BuildingType, Tile } from '@/types/game';

export type GameplayBuildingCategory =
  | 'terrain'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'service'
  | 'park'
  | 'transport'
  | 'utility'
  | 'energy'
  | 'water'
  | 'special';

export interface BuildingGameplayStats {
  category: GameplayBuildingCategory;
  powerDemand: number;
  powerSupply: number;
  jobs: number;
  income: number;
  maintenanceCost: number;
  environmentImpact: number;
  happinessImpact: number;
  healthImpact: number;
  educationImpact: number;
  safetyImpact: number;
  communityTrustImpact: number;
  esgImpact: number;
  logisticsEfficiency: number;
  waterDemand: number;
  wastewaterLoad: number;
  dustLevel: number;
  smokeLevel: number;
  odorLevel: number;
  ashOutput: number;
  waterQualityImpact: number;
  waterEcologyImpact: number;
  biomassStock: number;
  biomassConsumptionRate: number;
  fuelQualityEffect: number;
  fuelMoistureEffect: number;
  boilerEfficiencyEffect: number;
  turbineConditionEffect: number;
  generatorConditionEffect: number;
  machineAvailabilityEffect: number;
  batteryCapacity: number;
  powerReliabilityBonus: number;
}

const zero = (category: GameplayBuildingCategory): BuildingGameplayStats => ({
  category,
  powerDemand: 0,
  powerSupply: 0,
  jobs: 0,
  income: 0,
  maintenanceCost: 0,
  environmentImpact: 0,
  happinessImpact: 0,
  healthImpact: 0,
  educationImpact: 0,
  safetyImpact: 0,
  communityTrustImpact: 0,
  esgImpact: 0,
  logisticsEfficiency: 0,
  waterDemand: 0,
  wastewaterLoad: 0,
  dustLevel: 0,
  smokeLevel: 0,
  odorLevel: 0,
  ashOutput: 0,
  waterQualityImpact: 0,
  waterEcologyImpact: 0,
  biomassStock: 0,
  biomassConsumptionRate: 0,
  fuelQualityEffect: 0,
  fuelMoistureEffect: 0,
  boilerEfficiencyEffect: 0,
  turbineConditionEffect: 0,
  generatorConditionEffect: 0,
  machineAvailabilityEffect: 0,
  batteryCapacity: 0,
  powerReliabilityBonus: 0,
});

const stat = (category: GameplayBuildingCategory, values: Partial<BuildingGameplayStats>): BuildingGameplayStats => ({
  ...zero(category),
  ...values,
});

export const BUILDING_GAMEPLAY_STATS: Record<BuildingType, BuildingGameplayStats> = {
  empty: zero('terrain'),
  grass: zero('terrain'),
  water: stat('water', { environmentImpact: 0.2, waterQualityImpact: 0.1, waterEcologyImpact: 0.15 }),
  road: stat('transport', { powerDemand: 0.05, maintenanceCost: 20, environmentImpact: -0.08, logisticsEfficiency: 0.15, dustLevel: 0.05 }),
  bridge: stat('transport', { powerDemand: 0.04, maintenanceCost: 35, logisticsEfficiency: 0.18 }),
  rail: stat('transport', { powerDemand: 0.08, maintenanceCost: 30, logisticsEfficiency: 0.35, environmentImpact: 0.03 }),
  tree: stat('park', { environmentImpact: 0.8, happinessImpact: 0.12, dustLevel: -0.25 }),
  house_small: stat('residential', { powerDemand: 2, income: 450, maintenanceCost: 20, happinessImpact: 0.05, waterDemand: 0.5, wastewaterLoad: 0.25 }),
  house_medium: stat('residential', { powerDemand: 3.5, income: 900, maintenanceCost: 35, happinessImpact: 0.08, waterDemand: 0.8, wastewaterLoad: 0.4 }),
  mansion: stat('residential', { powerDemand: 5, income: 1500, maintenanceCost: 80, happinessImpact: 0.15, waterDemand: 1.2, wastewaterLoad: 0.55 }),
  apartment_low: stat('residential', { powerDemand: 16, income: 5500, maintenanceCost: 220, environmentImpact: -0.08, waterDemand: 4, wastewaterLoad: 2.4 }),
  apartment_high: stat('residential', { powerDemand: 30, income: 11000, maintenanceCost: 430, environmentImpact: -0.16, waterDemand: 7, wastewaterLoad: 4 }),
  shop_small: stat('commercial', { powerDemand: 5, jobs: 10, income: 1600, maintenanceCost: 55, happinessImpact: 0.08, waterDemand: 0.7, wastewaterLoad: 0.4 }),
  shop_medium: stat('commercial', { powerDemand: 8, jobs: 28, income: 3200, maintenanceCost: 90, happinessImpact: 0.1, waterDemand: 1.1, wastewaterLoad: 0.7 }),
  office_low: stat('commercial', { powerDemand: 18, jobs: 90, income: 9000, maintenanceCost: 260, waterDemand: 2, wastewaterLoad: 0.8 }),
  office_high: stat('commercial', { powerDemand: 34, jobs: 210, income: 19000, maintenanceCost: 520, waterDemand: 3.5, wastewaterLoad: 1.4 }),
  mall: stat('commercial', { powerDemand: 45, jobs: 260, income: 24000, maintenanceCost: 800, happinessImpact: 0.35, waterDemand: 6, wastewaterLoad: 2.5 }),
  factory_small: stat('industrial', { powerDemand: 12, jobs: 40, income: 7000, maintenanceCost: 420, environmentImpact: -0.55, communityTrustImpact: -0.05, waterDemand: 2.2, wastewaterLoad: 2.5, dustLevel: 1.2, smokeLevel: 0.8 }),
  factory_medium: stat('industrial', { powerDemand: 26, jobs: 90, income: 15000, maintenanceCost: 900, environmentImpact: -1.1, communityTrustImpact: -0.12, waterDemand: 4.5, wastewaterLoad: 5, dustLevel: 2.4, smokeLevel: 1.8 }),
  factory_large: stat('industrial', { powerDemand: 56, jobs: 180, income: 34000, maintenanceCost: 1800, environmentImpact: -2.2, communityTrustImpact: -0.25, waterDemand: 9, wastewaterLoad: 10, dustLevel: 5, smokeLevel: 3.8 }),
  warehouse: stat('industrial', { powerDemand: 9, jobs: 60, income: 9000, maintenanceCost: 500, logisticsEfficiency: 0.55, environmentImpact: -0.45, dustLevel: 1.1 }),
  police_station: stat('service', { powerDemand: 3, jobs: 20, maintenanceCost: 450, safetyImpact: 1.2, communityTrustImpact: 0.18 }),
  fire_station: stat('service', { powerDemand: 3, jobs: 20, maintenanceCost: 450, safetyImpact: 1.0, communityTrustImpact: 0.15 }),
  hospital: stat('service', { powerDemand: 8, jobs: 80, maintenanceCost: 1200, healthImpact: 1.8, safetyImpact: 0.25, communityTrustImpact: 0.25, waterDemand: 4, wastewaterLoad: 1.8 }),
  school: stat('service', { powerDemand: 4, jobs: 25, maintenanceCost: 550, educationImpact: 1.2, happinessImpact: 0.25, communityTrustImpact: 0.2 }),
  university: stat('service', { powerDemand: 12, jobs: 100, income: 4000, maintenanceCost: 1400, educationImpact: 2.2, happinessImpact: 0.35, communityTrustImpact: 0.35 }),
  park: stat('park', { powerDemand: 0.3, jobs: 2, maintenanceCost: 120, environmentImpact: 1.2, happinessImpact: 0.55, dustLevel: -0.35 }),
  park_large: stat('park', { powerDemand: 0.8, jobs: 6, maintenanceCost: 350, environmentImpact: 3.2, happinessImpact: 1.2, dustLevel: -0.9 }),
  tennis: stat('park', { powerDemand: 1.5, jobs: 1, maintenanceCost: 160, happinessImpact: 0.35 }),
  power_plant: stat('energy', { powerDemand: 5, powerSupply: 60, jobs: 30, income: 8000, maintenanceCost: 1600, environmentImpact: -1.5, smokeLevel: 2.5, ashOutput: 1.8, powerReliabilityBonus: 4 }),
  water_tower: stat('water', { powerDemand: 1.2, jobs: 5, maintenanceCost: 450, waterQualityImpact: 0.4, communityTrustImpact: 0.08 }),
  subway_station: stat('transport', { powerDemand: 5, jobs: 15, maintenanceCost: 420, logisticsEfficiency: 0.45, environmentImpact: 0.08 }),
  rail_station: stat('transport', { powerDemand: 6, jobs: 25, income: 3000, maintenanceCost: 650, logisticsEfficiency: 0.8, dustLevel: 0.25 }),
  stadium: stat('special', { powerDemand: 18, jobs: 50, income: 9000, maintenanceCost: 1200, happinessImpact: 0.8, communityTrustImpact: 0.18 }),
  museum: stat('special', { powerDemand: 7, jobs: 40, income: 5000, maintenanceCost: 650, happinessImpact: 0.55, educationImpact: 0.35, communityTrustImpact: 0.18 }),
  airport: stat('transport', { powerDemand: 55, jobs: 200, income: 42000, maintenanceCost: 4200, logisticsEfficiency: 2.5, environmentImpact: -1.6, dustLevel: 1.8, smokeLevel: 1.2 }),
  space_program: stat('special', { powerDemand: 42, jobs: 150, income: 26000, maintenanceCost: 3600, educationImpact: 0.8, communityTrustImpact: 0.3 }),
  city_hall: stat('service', { powerDemand: 5, jobs: 60, maintenanceCost: 900, safetyImpact: 0.25, communityTrustImpact: 0.9 }),
  amusement_park: stat('special', { powerDemand: 34, jobs: 100, income: 18000, maintenanceCost: 2400, happinessImpact: 1.5, waterDemand: 6, wastewaterLoad: 2 }),
  basketball_courts: stat('park', { powerDemand: 0.8, jobs: 2, maintenanceCost: 80, happinessImpact: 0.25 }),
  playground_small: stat('park', { maintenanceCost: 60, happinessImpact: 0.25, environmentImpact: 0.35 }),
  playground_large: stat('park', { powerDemand: 0.3, jobs: 2, maintenanceCost: 90, happinessImpact: 0.38, environmentImpact: 0.55 }),
  baseball_field_small: stat('park', { powerDemand: 0.6, jobs: 4, maintenanceCost: 130, happinessImpact: 0.45, environmentImpact: 0.75 }),
  soccer_field_small: stat('park', { powerDemand: 0.5, jobs: 2, maintenanceCost: 100, happinessImpact: 0.35, environmentImpact: 0.45 }),
  football_field: stat('park', { powerDemand: 1.2, jobs: 8, maintenanceCost: 190, happinessImpact: 0.55, environmentImpact: 0.45 }),
  baseball_stadium: stat('special', { powerDemand: 16, jobs: 60, income: 8000, maintenanceCost: 1100, happinessImpact: 0.75 }),
  community_center: stat('service', { powerDemand: 3, jobs: 10, maintenanceCost: 280, happinessImpact: 0.45, healthImpact: 0.25, educationImpact: 0.2, communityTrustImpact: 0.45 }),
  office_building_small: stat('commercial', { powerDemand: 6, jobs: 25, income: 2600, maintenanceCost: 140 }),
  swimming_pool: stat('park', { powerDemand: 2.5, jobs: 5, maintenanceCost: 180, happinessImpact: 0.45, healthImpact: 0.35, waterDemand: 2.5, wastewaterLoad: 1.2 }),
  skate_park: stat('park', { powerDemand: 0.6, jobs: 2, maintenanceCost: 90, happinessImpact: 0.35 }),
  mini_golf_course: stat('park', { powerDemand: 1, jobs: 6, income: 900, maintenanceCost: 160, happinessImpact: 0.35 }),
  bleachers_field: stat('park', { powerDemand: 0.8, jobs: 3, maintenanceCost: 110, happinessImpact: 0.25 }),
  go_kart_track: stat('special', { powerDemand: 5, jobs: 10, income: 1600, maintenanceCost: 250, happinessImpact: 0.35, environmentImpact: -0.3, smokeLevel: 0.4 }),
  amphitheater: stat('park', { powerDemand: 2, jobs: 15, income: 1800, maintenanceCost: 260, happinessImpact: 0.65, communityTrustImpact: 0.25 }),
  greenhouse_garden: stat('park', { powerDemand: 2, jobs: 8, income: 900, maintenanceCost: 180, environmentImpact: 1.6, esgImpact: 0.45, dustLevel: -0.4 }),
  animal_pens_farm: stat('industrial', { powerDemand: 1.2, jobs: 4, income: 650, maintenanceCost: 120, odorLevel: 0.45, biomassStock: 1 }),
  cabin_house: stat('residential', { powerDemand: 1.2, income: 300, maintenanceCost: 25, happinessImpact: 0.12 }),
  campground: stat('park', { powerDemand: 0.4, jobs: 3, income: 450, maintenanceCost: 80, happinessImpact: 0.25, environmentImpact: 0.25 }),
  marina_docks_small: stat('transport', { powerDemand: 3, jobs: 8, income: 1800, maintenanceCost: 250, logisticsEfficiency: 0.55, waterEcologyImpact: -0.15 }),
  pier_large: stat('transport', { powerDemand: 1.5, jobs: 12, income: 1200, maintenanceCost: 180, logisticsEfficiency: 0.35, waterEcologyImpact: -0.1 }),
  roller_coaster_small: stat('special', { powerDemand: 14, jobs: 20, income: 5000, maintenanceCost: 700, happinessImpact: 0.8 }),
  community_garden: stat('park', { powerDemand: 0.2, jobs: 2, income: 200, maintenanceCost: 50, environmentImpact: 1.1, happinessImpact: 0.35, esgImpact: 0.35, dustLevel: -0.25 }),
  pond_park: stat('park', { powerDemand: 0.2, jobs: 2, maintenanceCost: 70, environmentImpact: 1.35, happinessImpact: 0.4, waterQualityImpact: 0.2 }),
  park_gate: stat('park', { maintenanceCost: 25, happinessImpact: 0.08 }),
  mountain_lodge: stat('special', { powerDemand: 3.5, jobs: 15, income: 2600, maintenanceCost: 280, happinessImpact: 0.35, environmentImpact: 0.2 }),
  mountain_trailhead: stat('park', { powerDemand: 0.2, jobs: 2, maintenanceCost: 90, environmentImpact: 1.1, happinessImpact: 0.4 }),
  biomass_power_plant: stat('energy', { powerDemand: 8, powerSupply: 80, jobs: 75, income: 18000, maintenanceCost: 3600, environmentImpact: -1.0, communityTrustImpact: 0.15, esgImpact: 0.65, biomassConsumptionRate: 28, fuelQualityEffect: 4, boilerEfficiencyEffect: 2, turbineConditionEffect: -0.8, generatorConditionEffect: -0.6, machineAvailabilityEffect: -0.8, smokeLevel: 1.6, odorLevel: 0.8, ashOutput: 2.4, powerReliabilityBonus: 10 }),
  solar_farm: stat('energy', { powerDemand: 0.8, powerSupply: 20, jobs: 8, income: 4200, maintenanceCost: 420, environmentImpact: 1.2, esgImpact: 1.4, communityTrustImpact: 0.25, powerReliabilityBonus: 2 }),
  floating_solar: stat('energy', { powerDemand: 0.7, powerSupply: 25, jobs: 10, income: 5200, maintenanceCost: 520, environmentImpact: 1.1, esgImpact: 1.8, communityTrustImpact: 0.3, waterEcologyImpact: -0.45, powerReliabilityBonus: 2.5 }),
  battery_storage: stat('energy', { powerDemand: 0, jobs: 6, income: 1200, maintenanceCost: 500, batteryCapacity: 40, powerReliabilityBonus: 14, esgImpact: 0.7 }),
  wood_chipping_plant: stat('industrial', { powerDemand: 14, jobs: 55, income: 9000, maintenanceCost: 1100, logisticsEfficiency: 0.45, biomassStock: 8, fuelQualityEffect: 8, fuelMoistureEffect: -4, dustLevel: 2.2, smokeLevel: 0.3, odorLevel: 0.5, communityTrustImpact: -0.08 }),
  biomass_plantation: stat('park', { powerDemand: 0.2, jobs: 18, income: 2600, maintenanceCost: 260, environmentImpact: 2.4, esgImpact: 1.1, biomassStock: 18, fuelQualityEffect: 5, fuelMoistureEffect: 2, dustLevel: -0.6, waterDemand: 1.5 }),
  harvested_plantation: stat('industrial', { powerDemand: 0.2, jobs: 10, income: 1800, maintenanceCost: 180, environmentImpact: -0.6, biomassStock: 26, fuelQualityEffect: -2, dustLevel: 0.8, communityTrustImpact: -0.05 }),
};

export const FLOATING_SOLAR_BUILDINGS = new Set<BuildingType>(['floating_solar']);
export const POWER_SERVICE_BUILDINGS = new Set<BuildingType>([
  'power_plant',
  'biomass_power_plant',
  'solar_farm',
  'floating_solar',
  'battery_storage',
]);

export interface NpsOperationalMetrics {
  totalPowerDemand: number;
  totalPowerSupply: number;
  powerBalance: number;
  powerReliability: number;
  blackoutRisk: number;
  batteryCapacity: number;
  batteryStored: number;
  biomassStock: number;
  biomassConsumptionRate: number;
  fuelQuality: number;
  fuelMoisture: number;
  boilerEfficiency: number;
  steamPressure: number;
  turbineCondition: number;
  generatorCondition: number;
  machineAvailability: number;
  maintenanceCost: number;
  sparePartsStock: number;
  dustLevel: number;
  smokeLevel: number;
  odorLevel: number;
  wastewaterLoad: number;
  ashStock: number;
  waterLevel: number;
  waterQuality: number;
  waterEcologyScore: number;
  communityTrust: number;
  esgScore: number;
  logisticsEfficiency: number;
  incomeBonus: number;
  happinessBonus: number;
  healthBonus: number;
  educationBonus: number;
  safetyBonus: number;
  environmentBonus: number;
}

export function calculateNpsOperationalMetrics(grid: Tile[][], hour = 12): NpsOperationalMetrics {
  let totalPowerDemand = 0;
  let rawPowerSupply = 0;
  let biomassBaseSupply = 0;
  let maintenanceCost = 0;
  let batteryCapacity = 0;
  let biomassStock = 80;
  let biomassConsumptionRate = 0;
  let fuelQualityDelta = 0;
  let fuelMoistureDelta = 0;
  let boilerEfficiencyDelta = 0;
  let turbineDelta = 0;
  let generatorDelta = 0;
  let machineDelta = 0;
  let dustLevel = 0;
  let smokeLevel = 0;
  let odorLevel = 0;
  let wastewaterLoad = 0;
  let ashStock = 0;
  let waterQualityDelta = 0;
  let waterEcologyDelta = 0;
  let communityTrustDelta = 0;
  let esgDelta = 0;
  let logisticsEfficiency = 50;
  let incomeBonus = 0;
  let happinessBonus = 0;
  let healthBonus = 0;
  let educationBonus = 0;
  let safetyBonus = 0;
  let environmentBonus = 0;
  let reliabilityBonus = 0;

  for (const row of grid) {
    for (const tile of row) {
      const type = tile.building.type;
      if (type === 'empty') continue;
      const stats = BUILDING_GAMEPLAY_STATS[type];
      const level = Math.max(1, tile.building.level || 1);
      const complete = tile.building.constructionProgress === undefined || tile.building.constructionProgress >= 100;
      if (!complete && type !== 'road' && type !== 'rail' && type !== 'bridge') continue;

      totalPowerDemand += stats.powerDemand * level;
      maintenanceCost += stats.maintenanceCost * level;
      batteryCapacity += stats.batteryCapacity * level;
      biomassStock += stats.biomassStock * level;
      biomassConsumptionRate += stats.biomassConsumptionRate * level;
      fuelQualityDelta += stats.fuelQualityEffect * level;
      fuelMoistureDelta += stats.fuelMoistureEffect * level;
      boilerEfficiencyDelta += stats.boilerEfficiencyEffect * level;
      turbineDelta += stats.turbineConditionEffect * level;
      generatorDelta += stats.generatorConditionEffect * level;
      machineDelta += stats.machineAvailabilityEffect * level;
      dustLevel += stats.dustLevel * level;
      smokeLevel += stats.smokeLevel * level;
      odorLevel += stats.odorLevel * level;
      wastewaterLoad += stats.wastewaterLoad * level;
      ashStock += stats.ashOutput * level;
      waterQualityDelta += stats.waterQualityImpact * level;
      waterEcologyDelta += stats.waterEcologyImpact * level;
      communityTrustDelta += stats.communityTrustImpact * level;
      esgDelta += stats.esgImpact * level;
      logisticsEfficiency += stats.logisticsEfficiency * level;
      incomeBonus += stats.income * level;
      happinessBonus += stats.happinessImpact * level;
      healthBonus += stats.healthImpact * level;
      educationBonus += stats.educationImpact * level;
      safetyBonus += stats.safetyImpact * level;
      environmentBonus += stats.environmentImpact * level;
      reliabilityBonus += stats.powerReliabilityBonus * level;

      if (type === 'biomass_power_plant') {
        biomassBaseSupply += stats.powerSupply * level;
      } else if (type === 'solar_farm' || type === 'floating_solar') {
        const daylightFactor = hour >= 7 && hour <= 17 ? 1 : hour >= 6 && hour <= 19 ? 0.35 : 0.08;
        rawPowerSupply += stats.powerSupply * level * daylightFactor;
      } else {
        rawPowerSupply += stats.powerSupply * level;
      }
    }
  }

  const fuelQuality = clamp(80 + fuelQualityDelta - Math.max(0, biomassConsumptionRate - biomassStock) * 0.25, 30, 100);
  const fuelMoisture = clamp(30 + fuelMoistureDelta, 5, 75);
  const boilerEfficiency = clamp(88 + boilerEfficiencyDelta - Math.max(0, fuelMoisture - 35) * 0.35, 35, 100);
  const turbineCondition = clamp(92 + turbineDelta - ashStock * 0.15, 35, 100);
  const generatorCondition = clamp(93 + generatorDelta - ashStock * 0.12, 35, 100);
  const machineAvailability = clamp(95 + machineDelta - Math.max(0, dustLevel + smokeLevel - 20) * 0.25, 35, 100);
  const biomassSupply = biomassBaseSupply * (fuelQuality / 100) * (boilerEfficiency / 100) * (machineAvailability / 100);
  const totalPowerSupply = rawPowerSupply + biomassSupply;
  const powerBalance = totalPowerSupply - totalPowerDemand;
  const batteryStored = clamp(Math.max(0, powerBalance), 0, batteryCapacity);
  const reserveRatio = totalPowerDemand > 0 ? (powerBalance + batteryStored) / totalPowerDemand : 1;
  const powerReliability = clamp(60 + reserveRatio * 45 + reliabilityBonus - Math.max(0, fuelMoisture - 40) * 0.3, 0, 100);
  const blackoutRisk = clamp(100 - powerReliability + (powerBalance < 0 ? Math.abs(powerBalance) * 1.4 : 0), 0, 100);
  const waterQuality = clamp(80 + waterQualityDelta - wastewaterLoad * 0.65 - odorLevel * 0.5, 0, 100);
  const waterEcologyScore = clamp(82 + waterEcologyDelta - Math.max(0, wastewaterLoad - 12) * 0.5, 0, 100);
  const communityTrust = clamp(65 + communityTrustDelta + happinessBonus * 0.15 - blackoutRisk * 0.18 - odorLevel * 0.35, 0, 100);
  const esgScore = clamp(55 + esgDelta + environmentBonus * 0.45 + powerReliability * 0.12 - smokeLevel * 0.45 - dustLevel * 0.25, 0, 100);

  return {
    totalPowerDemand: Math.round(totalPowerDemand),
    totalPowerSupply: Math.round(totalPowerSupply),
    powerBalance: Math.round(powerBalance),
    powerReliability: Math.round(powerReliability),
    blackoutRisk: Math.round(blackoutRisk),
    batteryCapacity: Math.round(batteryCapacity),
    batteryStored: Math.round(batteryStored),
    biomassStock: Math.round(biomassStock),
    biomassConsumptionRate: Math.round(biomassConsumptionRate),
    fuelQuality: Math.round(fuelQuality),
    fuelMoisture: Math.round(fuelMoisture),
    boilerEfficiency: Math.round(boilerEfficiency),
    steamPressure: Math.round(clamp(45 + boilerEfficiency * 0.7 - fuelMoisture * 0.25, 20, 120)),
    turbineCondition: Math.round(turbineCondition),
    generatorCondition: Math.round(generatorCondition),
    machineAvailability: Math.round(machineAvailability),
    maintenanceCost: Math.round(maintenanceCost),
    sparePartsStock: Math.round(clamp(80 - maintenanceCost / 1000 + logisticsEfficiency * 0.25, 0, 100)),
    dustLevel: Math.round(clamp(dustLevel, 0, 100)),
    smokeLevel: Math.round(clamp(smokeLevel, 0, 100)),
    odorLevel: Math.round(clamp(odorLevel, 0, 100)),
    wastewaterLoad: Math.round(clamp(wastewaterLoad, 0, 100)),
    ashStock: Math.round(clamp(ashStock, 0, 100)),
    waterLevel: Math.round(clamp(80 - wastewaterLoad * 0.15, 0, 100)),
    waterQuality: Math.round(waterQuality),
    waterEcologyScore: Math.round(waterEcologyScore),
    communityTrust: Math.round(communityTrust),
    esgScore: Math.round(esgScore),
    logisticsEfficiency: Math.round(clamp(logisticsEfficiency, 0, 100)),
    incomeBonus: Math.round(incomeBonus),
    happinessBonus,
    healthBonus,
    educationBonus,
    safetyBonus,
    environmentBonus,
  };
}

export const NPS_OPERATION_EVENTS = [
  'วัตถุดิบชีวมวลไม่พอ',
  'ความชื้นเชื้อเพลิงสูง',
  'ราคาวัตถุดิบพุ่ง',
  'เชื้อเพลิงปนหิน/ดิน',
  'รถขนเชื้อเพลิงติดหน้าโรงงาน',
  'Boiler efficiency ลดลง',
  'Steam pressure แกว่ง',
  'Turbine vibration สูง',
  'Generator temperature สูง',
  'ระบบลำเลียงเชื้อเพลิงติดขัด',
  'ฝุ่นในลานวัตถุดิบสูง',
  'กลิ่นจากกองชีวมวล',
  'ควันเกินมาตรฐาน',
  'น้ำเสียจากโรงงานเพิ่ม',
  'เถ้าชีวมวลล้นพื้นที่',
  'ชุมชนร้องเรียนเสียงดัง',
  'ไฟฟ้าพีคตอนเย็น',
  'เมฆมาก Solar ผลิตตก',
  'Floating Solar กระทบระบบนิเวศน้ำ',
  'Battery Storage เสื่อม',
  'อะไหล่สำรองไม่พอ',
  'ฝนตกหนักกระทบลานตาก',
  'คุณภาพน้ำในบ่อพักลดลง',
  'รถบรรทุกเพิ่มฝุ่นถนน',
  'Supplier ส่งของล่าช้า',
  'ความต้องการไฟจากนิคมเพิ่ม',
  'พนักงานต้องการอบรมความปลอดภัย',
  'ลูกค้าเรียกร้อง ESG report',
  'พื้นที่ปลูกไม้โตไม่ทัน',
  'Blackout risk สูงช่วงกลางคืน',
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
