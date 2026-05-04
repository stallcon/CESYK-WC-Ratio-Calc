const WATER_WEIGHT_PER_GALLON = 8.333;
const CEMENT_FACTOR = 0.32;

const unitSystems = {
  imperial: {
    quantity: "yds",
    cement: "lbs",
    water: "gal",
    mass: "lb",
    volume: "yd",
    waterWeightFactor: WATER_WEIGHT_PER_GALLON,
    waterPerVolumeLabel: "Water Per Yard",
    cementPerVolumeLabel: "Cement Per Yard",
  },
  metric: {
    quantity: "m3",
    cement: "kg",
    water: "L",
    mass: "kg",
    volume: "m3",
    waterWeightFactor: 1,
    waterPerVolumeLabel: "Water Per Cubic Meter",
    cementPerVolumeLabel: "Cement Per Cubic Meter",
  },
};

const fields = {
  unitSystem: document.querySelector("#unitSystem"),
  quantity: document.querySelector("#quantity"),
  cement: document.querySelector("#cement"),
  plantWater: document.querySelector("#plantWater"),
  siteWater: document.querySelector("#siteWater"),
};

const outputs = {
  ratio: document.querySelector("#ratio"),
  cementFactor: document.querySelector("#cementFactor"),
  plantWaterWeight: document.querySelector("#plantWaterWeight"),
  siteWaterWeight: document.querySelector("#siteWaterWeight"),
  totalWater: document.querySelector("#totalWater"),
  waterPerYard: document.querySelector("#waterPerYard"),
  cementPerYard: document.querySelector("#cementPerYard"),
  waterPerVolumeLabel: document.querySelector("#waterPerVolumeLabel"),
  cementPerVolumeLabel: document.querySelector("#cementPerVolumeLabel"),
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function readNumber(input) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function formatWeight(value, unit) {
  return `${numberFormatter.format(value)} ${unit}`;
}

function formatPerVolume(value, massUnit, volumeUnit) {
  return `${numberFormatter.format(value)} ${massUnit}/${volumeUnit}`;
}

function getUnitSystem() {
  return unitSystems[fields.unitSystem.value] || unitSystems.imperial;
}

function updateUnitLabels(system) {
  document.querySelectorAll("[data-unit='quantity']").forEach((unit) => {
    unit.textContent = system.quantity;
  });
  document.querySelectorAll("[data-unit='cement']").forEach((unit) => {
    unit.textContent = system.cement;
  });
  document.querySelectorAll("[data-unit='water']").forEach((unit) => {
    unit.textContent = system.water;
  });
  outputs.waterPerVolumeLabel.textContent = system.waterPerVolumeLabel;
  outputs.cementPerVolumeLabel.textContent = system.cementPerVolumeLabel;
}

function calculate() {
  const system = getUnitSystem();
  const quantity = readNumber(fields.quantity);
  const cement = readNumber(fields.cement);
  const plantWater = readNumber(fields.plantWater);
  const siteWater = readNumber(fields.siteWater);

  const cementFactor = cement * CEMENT_FACTOR;
  const plantWaterWeight = plantWater * system.waterWeightFactor;
  const siteWaterWeight = siteWater * system.waterWeightFactor;
  const totalWater = plantWaterWeight + siteWaterWeight;
  const ratio = cement > 0 ? totalWater / cement : 0;
  const waterPerYard = quantity > 0 ? totalWater / quantity : 0;
  const cementPerYard = quantity > 0 ? cement / quantity : 0;

  updateUnitLabels(system);
  outputs.ratio.value = ratio.toFixed(3);
  outputs.cementFactor.value = formatWeight(cementFactor, system.mass);
  outputs.plantWaterWeight.value = formatWeight(plantWaterWeight, system.mass);
  outputs.siteWaterWeight.value = formatWeight(siteWaterWeight, system.mass);
  outputs.totalWater.value = formatWeight(totalWater, system.mass);
  outputs.waterPerYard.value = formatPerVolume(waterPerYard, system.mass, system.volume);
  outputs.cementPerYard.value = formatPerVolume(cementPerYard, system.mass, system.volume);
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", calculate);
  field.addEventListener("change", calculate);
});

calculate();
