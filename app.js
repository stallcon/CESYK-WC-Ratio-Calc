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

const ticketPhotoInput = document.querySelector("#ticketPhoto");
const ticketPhotoStatus = document.querySelector("#ticketPhotoStatus");
const ticketPreview = document.querySelector("#ticketPreview");
const printReportButton = document.querySelector("#printReport");
const logLocationButton = document.querySelector("#logLocation");
const reportDate = document.querySelector("#reportDate");
const reportTime = document.querySelector("#reportTime");
const reportLocation = document.querySelector("#reportLocation");
let ticketPhotoAttached = false;
let ticketPhotoUrl = "";
let locationLogged = false;

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

function updateReportDateTime() {
  const now = new Date();

  reportDate.value = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(now);

  reportTime.value = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);
}

function requestLocation() {
  updateReportDateTime();
  reportLocation.value = "Requesting location...";

  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      locationLogged = false;
      reportLocation.value = "Location services unavailable";
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        locationLogged = true;
        reportLocation.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${Math.round(accuracy)} m accuracy)`;
        updateReportDateTime();
        resolve(true);
      },
      (error) => {
        locationLogged = false;
        reportLocation.value =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied"
            : "Location could not be logged";
        resolve(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      }
    );
  });
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

ticketPhotoInput.addEventListener("change", () => {
  const [file] = ticketPhotoInput.files;
  ticketPhotoAttached = Boolean(file);

  if (ticketPhotoUrl) {
    URL.revokeObjectURL(ticketPhotoUrl);
    ticketPhotoUrl = "";
  }

  if (!file) {
    ticketPhotoStatus.textContent = "Take or attach photo";
    ticketPreview.innerHTML = "<span>No ticket photo attached</span>";
    return;
  }

  ticketPhotoUrl = URL.createObjectURL(file);
  ticketPhotoStatus.textContent = file.name || "Ticket photo attached";
  ticketPreview.innerHTML = `<img src="${ticketPhotoUrl}" alt="Attached ticket photo">`;
});

logLocationButton.addEventListener("click", () => {
  requestLocation();
});

printReportButton.addEventListener("click", async () => {
  updateReportDateTime();

  if (!ticketPhotoAttached) {
    const shouldContinue = window.confirm(
      "Please take or attach a photo of the ticket before saving the report. Continue to print without a ticket photo?"
    );

    if (!shouldContinue) {
      ticketPhotoInput.click();
      return;
    }
  }

  if (!locationLogged) {
    await requestLocation();
  }

  window.print();
});

window.addEventListener("beforeprint", updateReportDateTime);

updateReportDateTime();
requestLocation();
calculate();
