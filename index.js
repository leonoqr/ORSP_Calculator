// Define all factors
const jump2Cont2 = document.getElementById('buttonContainer2');
const jump2Cont4 = document.getElementById('buttonContainer4');
const B1 = document.getElementById("B1");
const B2 = document.getElementById("B2");
const N_El = document.getElementById("N");
const T_El = document.getElementById("T");
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
const AccRelEl = document.getElementById("AccRel_Results");
const resultEl = document.getElementById("Budget_Results");

// Define functions
function getNTParams() {
  // load function values from accuracy calculator form
  const NValue = N_El.value;
  const TValue = T_El.value;
  // Display error message if any values are blank
  if (NValue == "") {
      alert("Please enter N");
  } else if (TValue == "") {
      alert("Please enter T");
  } 

    //const filePath = 'Ooi_ScanTime_suppl_TheoreticalCalc_240109.xlsx';
    const filePath = 'https://raw.githubusercontent.com/leonoqr/ORSP_Calculator/main/Ooi_ScanTime_suppl_TheoreticalCalc_240109.xlsx';

    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Access and use the values from specific cells
        const cellA1Value = worksheet['A1'] ? worksheet['A1'].v : 'Cell A1 not found';
        const cellB2Value = worksheet['B2'] ? worksheet['B2'].v : 'Cell B2 not found';

        // Use the values as needed
        console.log('Value in A1:', cellA1Value);
        console.log('Value in B2:', cellB2Value);
      })
      .catch(error => {
        console.error('Error reading Excel file:', error.message);
      });

  // Update values
  AccRelEl.innerText = `Mean prediction accuracy: ${NValue}
            Median prediction accuracy: ${TValue}
            Mean univariate BWAS reliability: Uncalculated
            Median univariate BWAS reliability: Uncalculated
            Mean multivariate BWAS reliability: Uncalculated
            Median multivariate BWAS reliability: Uncalculated`;
}

function getBudgetParams() {
  // load function values from budget calculator form
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

function jumpToSection(containerId) {
    // Function to scroll to a specific container
    var container = document.getElementById(containerId);

    if (container) {
        // Scroll to the top of the container smoothly
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add all event listeners
jump2Cont2.addEventListener('click', function () {
    jumpToSection('container2');
});

jump2Cont4.addEventListener('click', function () {
    jumpToSection('container4');
});
B1.addEventListener("click", getNTParams);
B2.addEventListener("click", getBudgetParams);
