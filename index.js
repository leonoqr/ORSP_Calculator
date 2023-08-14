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
      alert("Please enter minimum fMRI scan time");
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
  } 
  // Display error message if any values are implausible
  else if (parseFloat(budgetValue) < parseFloat(CostTimeValue)) {
      alert(`ERROR: Budget ($${budgetValue}) is less than cost of 1 scan session ($${CostTimeValue})`); 
  } else if (parseFloat(maxTValue) < parseFloat(minTValue)) {
      alert(`ERROR: Maximum fMRI scan time (${maxTValue} min) is less than minimum fMRI scan time (${minTValue} min)`);
  } else if (parseFloat(maxSValue) < parseFloat(ScanItvlValue)) {
      alert(`ERROR: Maximum scan time per session (${maxSValue} min) is less than scan time interval (${ScanItvlValue} min). Please set maximum scan time to be same as scan time interval (We understand that you don't need to use the whole session but this causes a bug in the code.`);
  } else if (parseFloat(maxSValue) < parseFloat(psScanTimeValue)) {
      alert(`ERROR: Maximum scan time per session (${maxSValue} min) is less than per-session overhead scan time (${psScanTimeValue} min)`);
  } else {
      // calculate effective scan time
      const [num_Ppt, effScanTime, NumSessions, TotalDuration, fMRITime, unusedTime, revised_Cost] =
                          getOptimalParams(budgetValue, maxTValue, minTValue, ScanItvlValue,
                          CostTimeValue, psScanTimeValue, otScanTimeValue,
                          PptCostValue, SsnCostValue, maxSValue);
      resultEl.innerText = `Number of participants: ${num_Ppt}
                            fMRI scan time per participant (across all sessions): ${fMRITime} mins
                            Effective fMRI total scan time: ${effScanTime} mins

                            Optimal study design: 
                            ${NumSessions} session(s)
                            ${TotalDuration} min of scanning per participant (across all sessions)
                            ${unusedTime} min of unused scan time
                            $${revised_Cost} is the revised cost estimate`;
  }
}

function getOptimalParams(budgetValue, maxTValue, minTValue, ScanItvlValue,
                          CostTimeValue, psScanTimeValue, otScanTimeValue,
                          PptCostValue, SsnCostValue, maxSValue) {
  // initialize variables
  let num_Ppt = 0; 
  let num_Ppt_sav = 0; 
  let effScanTime = 0;
  let effScanTime_sav = 0;
  let NumSessions = 0;
  let NumSessions_sav = 0;
  let ScanDuration = 0;
  let ScanDuration_sav = 0;
  let TotalDuration = 0;
  let SessionDuration_Needed = 0;
  let Itvls_Needed = 0;
  let Itvls_Scanned = 0;
  let PxperPpt = 0;
  let revised_Cost = 0;
  let revised_Cost_sav = 0;
  let fMRITime = parseFloat(minTValue); // start with minimum scan time 
  let fMRITime_sav = fMRITime;
  let efffMRITime = parseFloat(minTValue);
  let unusedTime = 0;
  let unusedTime_sav = 0;

  // find the number of intervals a participant can handle
  let maxItvl = Math.floor((parseFloat(maxSValue) / parseFloat(ScanItvlValue))); 

  while (effScanTime >= effScanTime_sav) {
      // start with one session      
      NumSessions = 1;

      // find total time and number of scan intervals needed per participant
      TotalDuration = (parseFloat(psScanTimeValue) * NumSessions) + fMRITime
                    + parseFloat(otScanTimeValue);
      SessionDuration_Needed = TotalDuration;
      Itvls_Needed = Math.ceil((SessionDuration_Needed / parseFloat(ScanItvlValue)));
      Itvls_Scanned = Itvls_Needed;

      // if you need more intervals than participant can handle, increase NumSessions
      while (Itvls_Needed > maxItvl) {
          NumSessions++;
          // update total time needed per participant using minimum scan time
          TotalDuration = (parseFloat(psScanTimeValue) * NumSessions) + fMRITime
                        + parseFloat(otScanTimeValue);
         // assume you scan maximum permissble time for previous sessions, calculate how much additional time is needed
          SessionDuration_Needed = TotalDuration - ((NumSessions - 1) * maxItvl * parseFloat(ScanItvlValue));
          // find remaining number of intervals needed
          Itvls_Needed = Math.ceil(SessionDuration_Needed / parseFloat(ScanItvlValue));
          Itvls_Scanned = (((NumSessions - 1) * maxItvl) + Itvls_Needed);
      }

      // find cost per participant in terms of all participant costs and session costs
      PxperPpt = (Itvls_Scanned * parseFloat(CostTimeValue)) + parseFloat(PptCostValue)
               + (parseFloat(SsnCostValue) * NumSessions);

      // find number of participants you can afford 
      num_Ppt = Math.floor(parseFloat(budgetValue) / PxperPpt);
      revised_Cost = num_Ppt * PxperPpt;

      // calculate other values based on the calculated num_Ppt
      ScanDuration = Itvls_Scanned * parseFloat(ScanItvlValue);
      efffMRITime = fMRITime + ScanDuration - TotalDuration; // assume extra time used for fMRI
      if (efffMRITime >= parseFloat(maxTValue)) { // check if fMRI time has hit ceiling
          efffMRITime = parseFloat(maxTValue); 
      }
      effScanTime = efffMRITime * num_Ppt;
      unusedTime = ScanDuration - ((parseFloat(psScanTimeValue) * NumSessions)
                 + efffMRITime + parseFloat(otScanTimeValue));

      // save values if this effective scan time is the new highest
      if (effScanTime > effScanTime_sav) {
          num_Ppt_sav = num_Ppt
          effScanTime_sav = effScanTime;
          NumSessions_sav = NumSessions;
          ScanDuration_sav = ScanDuration;
          fMRITime_sav = efffMRITime;
          revised_Cost_sav = revised_Cost;
          unusedTime_sav = unusedTime;
      } else {
          break;
      }

      // check if scan time can be increased
      if (efffMRITime < parseFloat(maxTValue)) { 
          fMRITime = efffMRITime + parseFloat(ScanItvlValue) - psScanTimeValue; // add one scan interval
      } 

  }

  return [num_Ppt_sav, effScanTime_sav, NumSessions_sav, ScanDuration_sav, fMRITime_sav, unusedTime_sav, revised_Cost_sav];
}

btnEl.addEventListener("click", getParams);