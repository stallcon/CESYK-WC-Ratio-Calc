const WATER_WEIGHT_PER_GALLON = 8.333;
const REPORT_STORAGE_KEY = "cesykWaterCementReport";

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
  flyAsh: document.querySelector("#flyAsh"),
  otherScm: document.querySelector("#otherScm"),
  plantWater: document.querySelector("#plantWater"),
  siteWater: document.querySelector("#siteWater"),
};

const outputs = {
  ratio: document.querySelector("#ratio"),
  cementTotal: document.querySelector("#cementTotal"),
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
const designTestingLink = document.querySelector("#designTestingLink");
const reportDate = document.querySelector("#reportDate");
const reportTime = document.querySelector("#reportTime");
const reportLocation = document.querySelector("#reportLocation");
const combinedPrintReport = document.querySelector("#combinedPrintReport");
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
        saveReportValues();
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
  const flyAsh = readNumber(fields.flyAsh);
  const otherScm = readNumber(fields.otherScm);
  const plantWater = readNumber(fields.plantWater);
  const siteWater = readNumber(fields.siteWater);

  const cementTotal = cement + flyAsh + otherScm;
  const plantWaterWeight = plantWater * system.waterWeightFactor;
  const siteWaterWeight = siteWater * system.waterWeightFactor;
  const totalWater = plantWaterWeight + siteWaterWeight;
  const ratio = cementTotal > 0 ? totalWater / cementTotal : 0;
  const waterPerYard = quantity > 0 ? totalWater / quantity : 0;
  const cementPerYard = quantity > 0 ? cementTotal / quantity : 0;

  updateUnitLabels(system);
  outputs.ratio.value = ratio.toFixed(3);
  outputs.cementTotal.value = formatWeight(cementTotal, system.mass);
  outputs.plantWaterWeight.value = formatWeight(plantWaterWeight, system.mass);
  outputs.siteWaterWeight.value = formatWeight(siteWaterWeight, system.mass);
  outputs.totalWater.value = formatWeight(totalWater, system.mass);
  outputs.waterPerYard.value = formatPerVolume(waterPerYard, system.mass, system.volume);
  outputs.cementPerYard.value = formatPerVolume(cementPerYard, system.mass, system.volume);
  saveReportValues();
}

function saveReportValues() {
  const report = {
    unitSystem: fields.unitSystem.value,
    unitSystemLabel: fields.unitSystem.options[fields.unitSystem.selectedIndex]?.text || "",
    date: reportDate.value,
    time: reportTime.value,
    location: reportLocation.value,
    ratio: outputs.ratio.value,
    quantity: `${readNumber(fields.quantity)} ${getUnitSystem().quantity}`,
    cement: formatWeight(readNumber(fields.cement), getUnitSystem().mass),
    flyAsh: formatWeight(readNumber(fields.flyAsh), getUnitSystem().mass),
    otherScm: formatWeight(readNumber(fields.otherScm), getUnitSystem().mass),
    cementTotal: outputs.cementTotal.value,
    plantWater: `${readNumber(fields.plantWater)} ${getUnitSystem().water}`,
    siteWater: `${readNumber(fields.siteWater)} ${getUnitSystem().water}`,
    plantWaterWeight: outputs.plantWaterWeight.value,
    siteWaterWeight: outputs.siteWaterWeight.value,
    totalWater: outputs.totalWater.value,
    waterPerVolume: outputs.waterPerYard.value,
    cementPerVolume: outputs.cementPerYard.value,
  };

  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
}

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function reportItem(label, value) {
  return `<article><span>${label}</span><strong>${value || "--"}</strong></article>`;
}

function reportInput(label) {
  return `<article class="print-fill-field"><span>${label}</span><div></div></article>`;
}

function buildCombinedPrintReport() {
  saveReportValues();
  const report = readStoredJson(REPORT_STORAGE_KEY) || {};
  const design = readStoredJson("cesykDesignTestingReport") || {};

  combinedPrintReport.innerHTML = `
    <header class="print-report-header">
      <img src="./assets/logo.png" alt="Concrete Everything Share Your Knowledge">
      <div>
        <p class="eyebrow dark">CESYK Concrete Tools</p>
        <h1>Water-Cement and Mix Design Report</h1>
      </div>
    </header>

    <section>
      <h2>Report Details</h2>
      <div class="print-grid">
        ${reportItem("Date", report.date)}
        ${reportItem("Time", report.time)}
        ${reportItem("Location", report.location)}
      </div>
    </section>

    <section>
      <h2>Water-Cement Calculator</h2>
      <div class="print-grid">
        ${reportItem("Calculation Units", report.unitSystemLabel)}
        ${reportItem("Quantity Delivered", report.quantity)}
        ${reportItem("Cement", report.cement)}
        ${reportItem("Fly Ash", report.flyAsh)}
        ${reportItem("Other SCM", report.otherScm)}
        ${reportItem("Total Cement", report.cementTotal)}
        ${reportItem("Plant Water", report.plantWater)}
        ${reportItem("Site Water", report.siteWater)}
        ${reportItem("Batch Water Weight", report.plantWaterWeight)}
        ${reportItem("Site Water Weight", report.siteWaterWeight)}
        ${reportItem("Total Water", report.totalWater)}
        ${reportItem("Water-Cement Ratio", report.ratio)}
        ${reportItem("Water Per Volume", report.waterPerVolume)}
        ${reportItem("Cement Per Volume", report.cementPerVolume)}
      </div>
    </section>

    <section>
      <h2>Mix Design</h2>
      <div class="print-grid">
        ${reportItem("Agency Name", design.agencyName)}
        ${reportItem("Tester Name", design.testerName)}
        ${reportItem("Mix Design Number", design.mixDesignNumber)}
        ${reportItem("Design Water Cement Ratio", design.designWaterCementRatio)}
        ${reportItem("Design Air", design.designAir)}
        ${reportItem("Design Slump", design.designSlump)}
        ${reportItem("Design Unit Weight", design.designUnitWeight)}
        ${reportItem("Design Strength", design.designStrength)}
      </div>
    </section>

    <section>
      <h2>Test Results</h2>
      <div class="print-grid">
        ${reportItem("Test Slump", design.testSlump)}
        ${reportItem("Test Air", design.testAir)}
        ${reportItem("Test Unit Weight", design.testUnitWeight)}
      </div>
    </section>

    <section>
      <h2>Strength and Modulus Results</h2>
      <div class="print-grid print-fill-grid">
        ${reportInput("7 Day Break")}
        ${reportInput("28 Day Break")}
        ${reportInput("56 Day Break")}
        ${reportInput("Modulus Rupture Results")}
      </div>
    </section>
  `;
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

designTestingLink.addEventListener("click", () => {
  updateReportDateTime();
  saveReportValues();
});

printReportButton.addEventListener("click", async () => {
  updateReportDateTime();
  saveReportValues();

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

  buildCombinedPrintReport();
  window.print();
});

window.addEventListener("beforeprint", updateReportDateTime);
window.addEventListener("beforeprint", saveReportValues);
window.addEventListener("beforeprint", buildCombinedPrintReport);

updateReportDateTime();
requestLocation();
calculate();
