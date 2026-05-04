const REPORT_STORAGE_KEY = "cesykWaterCementReport";
const DESIGN_STORAGE_KEY = "cesykDesignTestingReport";

const designReportDate = document.querySelector("#designReportDate");
const designReportTime = document.querySelector("#designReportTime");
const designReportLocation = document.querySelector("#designReportLocation");
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

function article(label, value) {
  return `<article><span>${label}</span><strong>${value || "--"}</strong></article>`;
}

function reportInput(label) {
  return `<article class="print-fill-field"><span>${label}</span><div></div></article>`;
}

function loadSavedCalculatorValues() {
  const report = readStoredJson(REPORT_STORAGE_KEY);

  if (!report) {
    designReportLocation.value = "--";
    updateReportDateTime();
    return;
  }

  designReportLocation.value = report.location || "--";
  designReportDate.value = report.date || "--";
  designReportTime.value = report.time || "--";
}

function buildCombinedPrintReport() {
  saveDesignValues();
  const report = readStoredJson(REPORT_STORAGE_KEY) || {};
  const design = readStoredJson(DESIGN_STORAGE_KEY) || {};

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
        ${article("Date", designReportDate.value || report.date)}
        ${article("Time", designReportTime.value || report.time)}
        ${article("Location", designReportLocation.value || report.location)}
      </div>
    </section>

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
        ${article("Agency Name", design.agencyName)}
        ${article("Tester Name", design.testerName)}
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

loadReportValues.addEventListener("click", loadSavedCalculatorValues);

printCombinedReport.addEventListener("click", () => {
  saveDesignValues();
  updateReportDateTime();
  buildCombinedPrintReport();
  window.print();
});

window.addEventListener("beforeprint", () => {
  saveDesignValues();
  updateReportDateTime();
  buildCombinedPrintReport();
});

restoreDesignValues();
loadSavedCalculatorValues();
if (designReportDate.value === "--") {
  updateReportDateTime();
}
