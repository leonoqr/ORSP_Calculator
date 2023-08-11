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
    alert("Please enter minimum FMRI scan time"); // must be less than max scan time
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
    alert("Please enter maximum scan time per session"); // cannot be less than min scan interval
  } else {
    // calculate effective scan time
    const [num_Ppt, effScanTime, NumSessions, TotalDuration, fMRITime] =
                          getOptimalParams(budgetValue, maxTValue, minTValue, ScanItvlValue,
                          CostTimeValue, psScanTimeValue, otScanTimeValue,
                          PptCostValue, SsnCostValue, maxSValue);
    resultEl.innerText = `Number of subjects: ${num_Ppt}
                          Effective fMRI total scan time: ${effScanTime}

                          Optimal study design: 
                          ${NumSessions} session(s)
                          ${TotalDuration} min of scanning per participant
                          ${fMRITime} min of fMRI across sessions`;
  }
}

function getOptimalParams(budgetValue, maxTValue, minTValue, ScanItvlValue,
                          CostTimeValue, psScanTimeValue, otScanTimeValue,
                          PptCostValue, SsnCostValue, maxSValue) {
  // start with one session
  let NumSessions = 1;
  // find total time needed per participant using minimum scan time
  let TotalDuration = (parseFloat(psScanTimeValue) * NumSessions) + parseFloat(minTValue)
                    + parseFloat(otScanTimeValue);
  let SessionDuration_Needed = TotalDuration;
  // find number of intervals needed
  let Itvls_Needed = Math.ceil((SessionDuration_Needed / parseFloat(ScanItvlValue)));
  let Itvls_Scanned = Itvls_Needed;
  // find the number of intervals a participant can handle
  let maxItvl = Math.floor((parseFloat(maxSValue) / parseFloat(ScanItvlValue)));

  // if you need more intervals than participant can handle, increase NumSessions
  while (Itvls_Needed > maxItvl) {
    NumSessions++;
    // update total time needed per participant using minimum scan time
    TotalDuration = (parseFloat(psScanTimeValue) * NumSessions) + parseFloat(minTValue)
                  + parseFloat(otScanTimeValue);
    // assume you scan maximum permissble time for previous sessions, calculate how much additional time is needed
    SessionDuration_Needed = TotalDuration - ((NumSessions - 1) * maxItvl * parseFloat(ScanItvlValue));
    // find remaining number of intervals needed
    Itvls_Needed = Math.ceil(SessionDuration_Needed / parseFloat(ScanItvlValue));
    Itvls_Scanned = (((NumSessions - 1) * maxItvl) + Itvls_Needed);
  }

  // find cost per participant in terms of all participant costs and session costs
  let PxperPpt = (Itvls_Scanned * parseFloat(CostTimeValue)) + parseFloat(PptCostValue)
               + (parseFloat(SsnCostValue) * NumSessions);

  // find number of participants you can afford using minimum scan time
  let num_Ppt = Math.floor(parseFloat(budgetValue) / PxperPpt);

  // calculate other values based on the calculated num_Ppt
  let ScanDuration = Itvls_Scanned * parseFloat(ScanItvlValue);
  let fMRITime = parseFloat(minTValue) + ScanDuration - TotalDuration;
  let effScanTime = fMRITime * num_Ppt;

  // find number of participants you can afford using maximum scan time

  return [num_Ppt, effScanTime, NumSessions, ScanDuration, fMRITime];
}

btnEl.addEventListener("click", getParams);