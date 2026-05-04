const REPORT_STORAGE_KEY = "cesykWaterCementReport";
const DESIGN_STORAGE_KEY = "cesykDesignTestingReport";

const designReportDate = document.querySelector("#designReportDate");
const designReportTime = document.querySelector("#designReportTime");
const designReportLocation = document.querySelector("#designReportLocation");
const designProjectName = document.querySelector("#designProjectName");
const printCombinedReport = document.querySelector("#printCombinedReport");
const loadReportValues = document.querySelector("#loadReportValues");
const designFields = [...document.querySelectorAll("#designForm input")];
const combinedPrintReport = document.querySelector("#combinedPrintReport");

function translate(key, fallback = "") {
  return window.cesykTranslate ? window.cesykTranslate(key, fallback) : fallback || key;
}

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveDesignValues() {
  const values = {};
  designFields.forEach((field) => {
    values[field.id] = field.value;
  });
  localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(values));
}

function restoreDesignValues() {
  const values = readStoredJson(DESIGN_STORAGE_KEY);
  if (!values) {
    return;
  }

  designFields.forEach((field) => {
    field.value = values[field.id] || "";
  });
}

function updateReportDateTime() {
  const now = new Date();
  designReportDate.value = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(now);
  designReportTime.value = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);
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

function article(label, value) {
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

function loadSavedCalculatorValues() {
  const report = readStoredJson(REPORT_STORAGE_KEY);

  if (!report) {
    designProjectName.value = "";
    designReportLocation.value = "--";
    updateReportDateTime();
    return;
  }

  designProjectName.value = report.projectName || "";
  designReportLocation.value = report.location || "--";
  designReportDate.value = report.date || "--";
  designReportTime.value = report.time || "--";
}

function saveCalculatorReportDetails() {
  const report = readStoredJson(REPORT_STORAGE_KEY) || {};
  report.projectName = designProjectName.value.trim();
  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
}

function buildCombinedPrintReport() {
  saveDesignValues();
  saveCalculatorReportDetails();
  const report = readStoredJson(REPORT_STORAGE_KEY) || {};
  const design = readStoredJson(DESIGN_STORAGE_KEY) || {};
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
        ${article(translate("projectName", "Project Name"), report.projectName)}
        ${article(translate("date", "Date"), designReportDate.value || report.date)}
        ${article(translate("time", "Time"), designReportTime.value || report.time)}
        ${article(translate("nearestAddress", "Nearest Address"), designReportLocation.value || report.location)}
        ${article(translate("addressLookup", "Address Lookup"), translate("addressLookupService", "OpenStreetMap Nominatim"))}
      </div>
    </section>

    ${ticketPhotoSection(report)}

    <section>
      <h2>${translate("waterCementCalculator", "Water-Cement Calculator")}</h2>
      <div class="print-grid">
        ${article(translate("calculationUnits", "Calculation Units"), report.unitSystemLabel)}
        ${article(translate("quantityDelivered", "Quantity Delivered"), report.quantity)}
        ${article(translate("cement", "Cement"), report.cement)}
        ${article(translate("flyAsh", "Fly Ash"), report.flyAsh)}
        ${article(translate("otherScmShort", "Other SCM"), report.otherScm)}
        ${article(translate("totalCement", "Total Cement"), report.cementTotal)}
        ${article(translate("plantWater", "Plant Water"), report.plantWater)}
        ${article(translate("siteWater", "Site Water"), report.siteWater)}
        ${article(translate("batchWaterWeight", "Batch Water Weight"), report.plantWaterWeight)}
        ${article(translate("siteWaterWeight", "Site Water Weight"), report.siteWaterWeight)}
        ${article(translate("totalWater", "Total Water"), report.totalWater)}
        ${article(translate("waterCementRatio", "Water-Cement Ratio"), report.ratio)}
        ${article(translate("waterPerVolume", "Water Per Volume"), report.waterPerVolume)}
        ${article(translate("cementPerVolume", "Cement Per Volume"), report.cementPerVolume)}
      </div>
    </section>

    <section>
      <h2>${translate("mixDesign", "Mix Design")}</h2>
      <div class="print-grid">
        ${article(translate("supplierName", "Supplier Name"), design.supplierName)}
        ${article(translate("mixDesignNumber", "Mix Design Number"), design.mixDesignNumber)}
        ${article(translate("designWaterCementRatio", "Design Water Cement Ratio"), design.designWaterCementRatio)}
        ${article(translate("designAir", "Design Air"), design.designAir)}
        ${article(translate("designSlump", "Design Slump"), design.designSlump)}
        ${article(translate("designUnitWeight", "Design Unit Weight"), design.designUnitWeight)}
        ${article(translate("designStrength", "Design Strength"), design.designStrength)}
      </div>
    </section>

    <section>
      <h2>${translate("testResults", "Test Results")}</h2>
      <div class="print-grid">
        ${article(translate("agencyName", "Agency Name"), design.agencyName)}
        ${article(translate("testerName", "Tester Name"), design.testerName)}
        ${article(translate("testSlump", "Test Slump"), design.testSlump)}
        ${article(translate("testAir", "Test Air"), design.testAir)}
        ${article(translate("testUnitWeight", "Test Unit Weight"), design.testUnitWeight)}
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

designFields.forEach((field) => {
  field.addEventListener("input", saveDesignValues);
});

designProjectName.addEventListener("input", saveCalculatorReportDetails);

loadReportValues.addEventListener("click", () => {
  saveCalculatorReportDetails();
  loadSavedCalculatorValues();
});

printCombinedReport.addEventListener("click", () => {
  saveDesignValues();
  saveCalculatorReportDetails();
  updateReportDateTime();
  buildCombinedPrintReport();
  window.print();
});

window.addEventListener("beforeprint", () => {
  saveDesignValues();
  saveCalculatorReportDetails();
  updateReportDateTime();
  buildCombinedPrintReport();
});

restoreDesignValues();
loadSavedCalculatorValues();
if (designReportDate.value === "--") {
  updateReportDateTime();
}
