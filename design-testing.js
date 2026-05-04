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
      <h2>Ticket Photo</h2>
      <figure>
        <img src="${report.ticketPhotoDataUrl}" alt="Attached ticket photo">
        <figcaption>${escapeHtml(report.ticketPhotoName || "Attached ticket photo")}</figcaption>
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
        <p class="eyebrow dark">CESYK Concrete Tools</p>
        <h1>Water-Cement and Mix Design Report</h1>
      </div>
    </header>

    <section>
      <h2>Report Details</h2>
      <div class="print-grid">
        ${article("Project Name", report.projectName)}
        ${article("Date", designReportDate.value || report.date)}
        ${article("Time", designReportTime.value || report.time)}
        ${article("Nearest Address", designReportLocation.value || report.location)}
        ${article("Address Lookup", "OpenStreetMap Nominatim")}
      </div>
    </section>

    ${ticketPhotoSection(report)}

    <section>
      <h2>Water-Cement Calculator</h2>
      <div class="print-grid">
        ${article("Calculation Units", report.unitSystemLabel)}
        ${article("Quantity Delivered", report.quantity)}
        ${article("Cement", report.cement)}
        ${article("Fly Ash", report.flyAsh)}
        ${article("Other SCM", report.otherScm)}
        ${article("Total Cement", report.cementTotal)}
        ${article("Plant Water", report.plantWater)}
        ${article("Site Water", report.siteWater)}
        ${article("Batch Water Weight", report.plantWaterWeight)}
        ${article("Site Water Weight", report.siteWaterWeight)}
        ${article("Total Water", report.totalWater)}
        ${article("Water-Cement Ratio", report.ratio)}
        ${article("Water Per Volume", report.waterPerVolume)}
        ${article("Cement Per Volume", report.cementPerVolume)}
      </div>
    </section>

    <section>
      <h2>Mix Design</h2>
      <div class="print-grid">
        ${article("Supplier Name", design.supplierName)}
        ${article("Mix Design Number", design.mixDesignNumber)}
        ${article("Design Water Cement Ratio", design.designWaterCementRatio)}
        ${article("Design Air", design.designAir)}
        ${article("Design Slump", design.designSlump)}
        ${article("Design Unit Weight", design.designUnitWeight)}
        ${article("Design Strength", design.designStrength)}
      </div>
    </section>

    <section>
      <h2>Test Results</h2>
      <div class="print-grid">
        ${article("Agency Name", design.agencyName)}
        ${article("Tester Name", design.testerName)}
        ${article("Test Slump", design.testSlump)}
        ${article("Test Air", design.testAir)}
        ${article("Test Unit Weight", design.testUnitWeight)}
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
