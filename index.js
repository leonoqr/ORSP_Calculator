// Define all factors
const btnEl = document.getElementById("btn");
const budget_El = document.getElementById("budget");
const maxT_El = document.getElementById("maxT");
const minT_El = document.getElementById("minT");
const ScanItvl_El = document.getElementById("ScanItvl");
const CostTime_El = document.getElementById("CostTime");
const psScanTime_El = document.getElementById("psScanTime");
const otScanTime_El = document.getElementById("otScanTime");
const PptCost_El = document.getElementById("PptCost");
const SsnCost_El = document.getElementById("SsnCost");
const maxS_El = document.getElementById("maxS");
const resultEl = document.getElementById("result");

// Define functions
function getParams() {
  // load function values from form
  const budgetValue = budget_El.value;
  const maxTValue = maxT_El.value;
  const minTValue = minT_El.value;
  const ScanItvlValue = ScanItvl_El.value;
  const CostTimeValue = CostTime_El.value;
  const psScanTimeValue = psScanTime_El.value;
  const otScanTimeValue = otScanTime_El.value;
  const PptCostValue = PptCost_El.value;
  const SsnCostValue = SsnCost_El.value;
  const maxSValue = maxS_El.value;
  // Display error message if any values are blank
  if (budgetValue === "") {
    alert("Please enter a budget");
  } else if (maxTValue === "") {
    alert("Please enter maximum fMRI scan time");
  } else if (minTValue === "") {
    alert("Please enter minimum FMRI scan time");
  } else if (ScanItvlValue === "") {
    alert("Please enter intervals which scans are priced at");
  } else if (CostTimeValue === "") {
    alert("Please the cost per interval");
  } else if (psScanTimeValue === "") {
    alert("Please enter per-session overhead scan time");
  } else if (otScanTimeValue === "") {
    alert("Please enter one-time overhead scan time");
  } else if (PptCostValue === "") {
    alert("Please cost per participant");
  } else if (SsnCostValue === "") {
    alert("Please cost per session");
  } else if (maxSValue === "") {
    alert("Please enter maximum scan time per session");
  } else {
    const [effScanTime, NumSessions, SessionDuration, fMRITime] = getOptimalParams();
    resultEl.innerText = `Effective total scan time: ${effScanTime}

            Optimal study design: 
            ${NumSessions} session(s)
            ${SessionDuration} min of scanning per session
            ${fMRITime} min of fMRI per session`;
  }
}

function getOptimalParams() {
  const effScanTime = 1;
  const NumSessions = 2;
  const SessionDuration = 3;
  const fMRITime = 4;
  return [effScanTime, NumSessions, SessionDuration, fMRITime];
}

btnEl.addEventListener("click", getParams);