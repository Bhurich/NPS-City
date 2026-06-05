/**
 * IsoCity Economy Types
 */

export interface Stats {
  population: number;
  jobs: number;
  money: number;
  income: number;
  expenses: number;
  happiness: number;
  health: number;
  education: number;
  safety: number;
  environment: number;
  communityTrust: number;
  esgScore: number;
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
  logisticsEfficiency: number;
  demand: {
    residential: number;
    commercial: number;
    industrial: number;
  };
}

export interface BudgetCategory {
  name: string;
  funding: number;
  cost: number;
}

export interface Budget {
  police: BudgetCategory;
  fire: BudgetCategory;
  health: BudgetCategory;
  education: BudgetCategory;
  transportation: BudgetCategory;
  parks: BudgetCategory;
  power: BudgetCategory;
  water: BudgetCategory;
}

export interface CityEconomy {
  population: number;
  jobs: number;
  income: number;
  expenses: number;
  happiness: number;
  lastCalculated: number;
}

export interface HistoryPoint {
  year: number;
  month: number;
  population: number;
  money: number;
  happiness: number;
}
