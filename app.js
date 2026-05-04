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
    waterPerVolumeLabelKey: "waterPerYard",
    cementPerVolumeLabelKey: "cementPerYard",
  },
  metric: {
    quantity: "m3",
    cement: "kg",
    water: "L",
    mass: "kg",
    volume: "m3",
    waterWeightFactor: 1,
    waterPerVolumeLabelKey: "waterPerCubicMeter",
    cementPerVolumeLabelKey: "cementPerCubicMeter",
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
const projectNameInput = document.querySelector("#projectName");
const reportDate = document.querySelector("#reportDate");
const reportTime = document.querySelector("#reportTime");
const reportLocation = document.querySelector("#reportLocation");
const combinedPrintReport = document.querySelector("#combinedPrintReport");
let ticketPhotoAttached = false;
let ticketPhotoUrl = "";
let ticketPhotoDataUrl = "";
let ticketPhotoName = "";
let locationLogged = false;

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function translate(key, fallback = "") {
  return window.cesykTranslate ? window.cesykTranslate(key, fallback) : fallback || key;
}

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

function formatCoordinates(latitude, longitude, accuracy) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${Math.round(accuracy)} m ${translate("accuracy", "accuracy")})`;
}

async function findNearestAddress(latitude, longitude) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    zoom: "18",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Address lookup failed");
  }

  const place = await response.json();
  return place.display_name || "";
}

function requestLocation() {
  updateReportDateTime();
  reportLocation.value = translate("requestingLocation", "Requesting location...");

  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      locationLogged = false;
      reportLocation.value = translate("locationUnavailable", "Location services unavailable");
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coordinates = formatCoordinates(latitude, longitude, accuracy);
        locationLogged = true;
        reportLocation.value = coordinates;
        updateReportDateTime();

        const shouldFindAddress = window.confirm(
          translate(
            "addressLookupPrompt",
            "To identify the nearest address, this app will send the logged GPS coordinates to OpenStreetMap Nominatim. Continue with nearest address lookup?"
          )
        );

        if (!shouldFindAddress) {
          saveReportValues();
          resolve(true);
          return;
        }

        reportLocation.value = translate("findingNearestAddress", "Finding nearest address...");

        try {
          const nearestAddress = await findNearestAddress(latitude, longitude);
          reportLocation.value = nearestAddress
            ? `${nearestAddress} | GPS: ${coordinates}`
            : `${coordinates} | ${translate("nearestAddressUnavailable", "Nearest address unavailable")}`;
        } catch {
          reportLocation.value = `${coordinates} | ${translate("nearestAddressUnavailable", "Nearest address unavailable")}`;
        }

        updateReportDateTime();
        saveReportValues();
        resolve(true);
      },
      (error) => {
        locationLogged = false;
        reportLocation.value =
          error.code === error.PERMISSION_DENIED
            ? translate("locationDenied", "Location permission denied")
            : translate("locationCouldNotBeLogged", "Location could not be logged");
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
  outputs.waterPerVolumeLabel.textContent = translate(system.waterPerVolumeLabelKey, "");
  outputs.cementPerVolumeLabel.textContent = translate(system.cementPerVolumeLabelKey, "");
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
  const previousReport = readStoredJson(REPORT_STORAGE_KEY) || {};
  const report = {
    unitSystem: fields.unitSystem.value,
    unitSystemLabel: fields.unitSystem.options[fields.unitSystem.selectedIndex]?.text || "",
    projectName: projectNameInput.value.trim(),
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
    ticketPhotoName: ticketPhotoName || previousReport.ticketPhotoName || "",
    ticketPhotoDataUrl: ticketPhotoDataUrl || previousReport.ticketPhotoDataUrl || "",
  };

  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    report.ticketPhotoDataUrl = "";
    report.ticketPhotoName = "";
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
    ticketPhotoStatus.textContent = translate("photoTooLarge", "Photo too large for saved PDF");
  }
}

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function reportItem(label, value) {
  return `<article><span>${escapeHtml(label)}</span><strong>${value ? escapeHtml(value) : "--"}</strong></article>`;
}

function reportInput(label) {
  return `<article class="print-fill-field"><span>${escapeHtml(label)}</span><div></div></article>`;
}

function ticketPhotoSection(report) {
  if (!report.ticketPhotoDataUrl) {
    return "";
  }

  return `
    <section class="print-ticket-section">
      <h2>${translate("ticketPhoto", "Ticket Photo")}</h2>
      <figure>
        <img src="${report.ticketPhotoDataUrl}" alt="Attached ticket photo">
        <figcaption>${escapeHtml(report.ticketPhotoName || translate("attachedTicketPhoto", "Attached ticket photo"))}</figcaption>
      </figure>
    </section>
  `;
}

function buildCombinedPrintReport() {
  saveReportValues();
  const report = readStoredJson(REPORT_STORAGE_KEY) || {};
  const design = readStoredJson("cesykDesignTestingReport") || {};
  const logoSrc = typeof CESYK_LOGO_SRC === "string" ? CESYK_LOGO_SRC : "./assets/logo.png";

  combinedPrintReport.innerHTML = `
    <header class="print-report-header">
      <img src="${logoSrc}" alt="Concrete Everything Share Your Knowledge">
      <div>
        <p class="eyebrow dark">${translate("eyebrow", "CESYK Concrete Tools")}</p>
        <h1>${translate("combinedPrintTitle", "Water-Cement and Mix Design Report")}</h1>
      </div>
    </header>

    <section>
      <h2>${translate("reportDetails", "Report Details")}</h2>
      <div class="print-grid">
        ${reportItem(translate("projectName", "Project Name"), report.projectName)}
        ${reportItem(translate("date", "Date"), report.date)}
        ${reportItem(translate("time", "Time"), report.time)}
        ${reportItem(translate("nearestAddress", "Nearest Address"), report.location)}
        ${reportItem(translate("addressLookup", "Address Lookup"), translate("addressLookupService", "OpenStreetMap Nominatim"))}
      </div>
    </section>

    ${ticketPhotoSection(report)}

    <section>
      <h2>${translate("waterCementCalculator", "Water-Cement Calculator")}</h2>
      <div class="print-grid">
        ${reportItem(translate("calculationUnits", "Calculation Units"), report.unitSystemLabel)}
        ${reportItem(translate("quantityDelivered", "Quantity Delivered"), report.quantity)}
        ${reportItem(translate("cement", "Cement"), report.cement)}
        ${reportItem(translate("flyAsh", "Fly Ash"), report.flyAsh)}
        ${reportItem(translate("otherScmShort", "Other SCM"), report.otherScm)}
        ${reportItem(translate("totalCement", "Total Cement"), report.cementTotal)}
        ${reportItem(translate("plantWater", "Plant Water"), report.plantWater)}
        ${reportItem(translate("siteWater", "Site Water"), report.siteWater)}
        ${reportItem(translate("batchWaterWeight", "Batch Water Weight"), report.plantWaterWeight)}
        ${reportItem(translate("siteWaterWeight", "Site Water Weight"), report.siteWaterWeight)}
        ${reportItem(translate("totalWater", "Total Water"), report.totalWater)}
        ${reportItem(translate("waterCementRatio", "Water-Cement Ratio"), report.ratio)}
        ${reportItem(translate("waterPerVolume", "Water Per Volume"), report.waterPerVolume)}
        ${reportItem(translate("cementPerVolume", "Cement Per Volume"), report.cementPerVolume)}
      </div>
    </section>

    <section>
      <h2>${translate("mixDesign", "Mix Design")}</h2>
      <div class="print-grid">
        ${reportItem(translate("supplierName", "Supplier Name"), design.supplierName)}
        ${reportItem(translate("mixDesignNumber", "Mix Design Number"), design.mixDesignNumber)}
        ${reportItem(translate("designWaterCementRatio", "Design Water Cement Ratio"), design.designWaterCementRatio)}
        ${reportItem(translate("designAir", "Design Air"), design.designAir)}
        ${reportItem(translate("designSlump", "Design Slump"), design.designSlump)}
        ${reportItem(translate("designUnitWeight", "Design Unit Weight"), design.designUnitWeight)}
        ${reportItem(translate("designStrength", "Design Strength"), design.designStrength)}
      </div>
    </section>

    <section>
      <h2>${translate("testResults", "Test Results")}</h2>
      <div class="print-grid">
        ${reportItem(translate("agencyName", "Agency Name"), design.agencyName)}
        ${reportItem(translate("testerName", "Tester Name"), design.testerName)}
        ${reportItem(translate("testSlump", "Test Slump"), design.testSlump)}
        ${reportItem(translate("testAir", "Test Air"), design.testAir)}
        ${reportItem(translate("testUnitWeight", "Test Unit Weight"), design.testUnitWeight)}
      </div>
    </section>

    <section>
      <h2>${translate("strengthAndModulus", "Strength and Modulus Results")}</h2>
      <div class="print-grid print-fill-grid">
        ${reportInput(translate("sevenDayBreak", "7 Day Break"))}
        ${reportInput(translate("twentyEightDayBreak", "28 Day Break"))}
        ${reportInput(translate("fiftySixDayBreak", "56 Day Break"))}
        ${reportInput(translate("modulusRuptureResults", "Modulus Rupture Results"))}
      </div>
    </section>
  `;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = dataUrl;
  });
}

async function createPdfReadyTicketPhoto(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const maxSize = 1400;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", calculate);
  field.addEventListener("change", calculate);
});

projectNameInput.addEventListener("input", saveReportValues);

window.addEventListener("cesyk-language-change", () => {
  if (!ticketPhotoAttached) {
    ticketPhotoStatus.textContent = translate("takeOrAttachPhoto", "Take or attach photo");
    ticketPreview.innerHTML = `<span>${translate("noTicketPhoto", "No ticket photo attached")}</span>`;
  }
  calculate();
  saveReportValues();
});

ticketPhotoInput.addEventListener("change", async () => {
  const [file] = ticketPhotoInput.files;
  ticketPhotoAttached = Boolean(file);

  if (ticketPhotoUrl) {
    URL.revokeObjectURL(ticketPhotoUrl);
    ticketPhotoUrl = "";
  }

  if (!file) {
    ticketPhotoDataUrl = "";
    ticketPhotoName = "";
    ticketPhotoStatus.textContent = translate("takeOrAttachPhoto", "Take or attach photo");
    ticketPreview.innerHTML = `<span>${translate("noTicketPhoto", "No ticket photo attached")}</span>`;
    saveReportValues();
    return;
  }

  ticketPhotoUrl = URL.createObjectURL(file);
  ticketPhotoName = file.name || translate("ticketPhotoAttached", "Ticket photo attached");
  ticketPhotoStatus.textContent = ticketPhotoName;
  ticketPreview.innerHTML = `<img src="${ticketPhotoUrl}" alt="Attached ticket photo">`;

  try {
    ticketPhotoDataUrl = await createPdfReadyTicketPhoto(file);
    ticketPreview.innerHTML = `<img src="${ticketPhotoDataUrl}" alt="Attached ticket photo">`;
    saveReportValues();
  } catch {
    ticketPhotoDataUrl = "";
    ticketPhotoStatus.textContent = translate("photoCouldNotBeAdded", "Photo could not be added to PDF");
    saveReportValues();
  }
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
      translate(
        "missingTicketPrompt",
        "Please take or attach a photo of the ticket before saving the report. Continue to print without a ticket photo?"
      )
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
const savedReport = readStoredJson(REPORT_STORAGE_KEY) || {};
if (savedReport.projectName) {
  projectNameInput.value = savedReport.projectName;
}
if (savedReport.ticketPhotoDataUrl) {
  ticketPhotoAttached = true;
  ticketPhotoDataUrl = savedReport.ticketPhotoDataUrl;
  ticketPhotoName = savedReport.ticketPhotoName || translate("attachedTicketPhoto", "Attached ticket photo");
  ticketPhotoStatus.textContent = ticketPhotoName;
  ticketPreview.innerHTML = `<img src="${ticketPhotoDataUrl}" alt="Attached ticket photo">`;
}

window.addEventListener("beforeprint", buildCombinedPrintReport);

updateReportDateTime();
requestLocation();
calculate();
