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

  const filePath = 'https://raw.githubusercontent.com/leonoqr/ORSP_Calculator/main/Ooi_ScanTime_suppl_TheoreticalCalc_240109.xlsx';
  fetch(filePath)
      .then(response => {
      if (!response.ok) {
          throw new Error(`Failed to fetch file (HTTP ${response.status})`);
      }
      return response.arrayBuffer();
      })
      .then(buffer => {
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: 'array' });

      // calculate values for each phenotype
      // Prediction accuracy
      let acc = []; {
          // Loop through each row (2 to 18) for ABCD
          let sheetName = workbook.SheetNames[0];
          let worksheet = workbook.Sheets[sheetName];
          for (let row = 2; row <= 18; row++) {
              const K1 = worksheet[`C${row}`]
              const K2 = worksheet[`D${row}`]
              acc.push(calcAcc(K1.v,K2.v,NValue,TValue))
          }
      }{
          // Loop through each row (2 to 20) for HCP
          let sheetName = workbook.SheetNames[3];
          let worksheet = workbook.Sheets[sheetName];
          for (let row = 2; row <= 20; row++) {
              const K1 = worksheet[`C${row}`]
              const K2 = worksheet[`D${row}`]
              acc.push(calcAcc(K1.v,K2.v,NValue,TValue))
          }
      }

      const mean_pa = acc.length > 0 ? acc.reduce((a, b) => a + b) / acc.length : 0;
      // Round off the mean accuracy to 2 significant figures
      const rounded_mean_pa  = parseFloat(mean_pa.toPrecision(2));
      // Calculate confidence interval (assuming a 95% confidence level)
      const standardDeviation = Math.sqrt(acc.reduce((sum, value) => sum + (value - mean_pa) ** 2, 0) / (acc.length - 1));
      const marginOfError = 1.96 * (standardDeviation / Math.sqrt(acc.length));
      const rounded_margin  = parseFloat(marginOfError.toPrecision(2));
      // Calculate median
      const sortedAcc = acc.slice().sort((a, b) => a - b);
      const median = sortedAcc.length % 2 === 0
      ? (sortedAcc[sortedAcc.length / 2 - 1] + sortedAcc[sortedAcc.length / 2]) / 2
      : sortedAcc[Math.floor(sortedAcc.length / 2)];
      const rounded_median  = parseFloat(median.toPrecision(2));

      // univariate BWAS
      let u_rel = []; {
          // Loop through each row (2 to 18) for ABCD
          let sheetName = workbook.SheetNames[1];
          let worksheet = workbook.Sheets[sheetName];
          for (let row = 2; row <= 18; row++) {
              const K0 = worksheet[`B${row}`]
              const K1 = worksheet[`C${row}`]
              const K2 = worksheet[`D${row}`]
              u_rel.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue))
          }
      }{
          // Loop through each row (2 to 20) for HCP
          let sheetName = workbook.SheetNames[4];
          let worksheet = workbook.Sheets[sheetName];
          for (let row = 2; row <= 20; row++) {
              const K0 = worksheet[`B${row}`]
              const K1 = worksheet[`C${row}`]
              const K2 = worksheet[`D${row}`]
              u_rel.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue))
          }
      }

      const mean_u_rel = u_rel.length > 0 ? u_rel.reduce((a, b) => a + b) / u_rel.length : 0;
      // Round off the mean accuracy to 2 significant figures
      const rounded_mean_u_rel  = parseFloat(mean_u_rel.toPrecision(2));
      // Calculate confidence interval (assuming a 95% confidence level)
      const standardDeviation_ub = Math.sqrt(u_rel.reduce((sum, value) => sum + (value - mean_u_rel) ** 2, 0) / (u_rel.length - 1));
      const marginOfError_ub = 1.96 * (standardDeviation_ub / Math.sqrt(u_rel.length));
      const rounded_margin_ub  = parseFloat(marginOfError_ub.toPrecision(2));
      // Calculate median
      const sorted_u_rel = u_rel.slice().sort((a, b) => a - b);
      const median_u_rel = sorted_u_rel.length % 2 === 0
      ? (sorted_u_rel[sorted_u_rel.length / 2 - 1] + sorted_u_rel[sorted_u_rel.length / 2]) / 2
      : sorted_u_rel[Math.floor(sorted_u_rel.length / 2)];
      const rounded_median_u_rel  = parseFloat(median_u_rel.toPrecision(2));

      // multivariate BWAS
      let m_rel = []; {
          // Loop through each row (2 to 18) for ABCD
          let sheetName = workbook.SheetNames[2];
          let worksheet = workbook.Sheets[sheetName];
          for (let row = 2; row <= 18; row++) {
              const K0 = worksheet[`B${row}`]
              const K1 = worksheet[`C${row}`]
              const K2 = worksheet[`D${row}`]
              m_rel.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue))
          }
      }{
          // Loop through each row (2 to 20) for HCP
          let sheetName = workbook.SheetNames[5];
          let worksheet = workbook.Sheets[sheetName];
          for (let row = 2; row <= 20; row++) {
              const K0 = worksheet[`B${row}`]
              const K1 = worksheet[`C${row}`]
              const K2 = worksheet[`D${row}`]
              m_rel.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue))
          }
      }

      const mean_m_rel = m_rel.length > 0 ? m_rel.reduce((a, b) => a + b) / m_rel.length : 0;
      // Round off the mean accuracy to 2 significant figures
      const rounded_mean_m_rel  = parseFloat(mean_m_rel.toPrecision(2));
      // Calculate confidence interval (assuming a 95% confidence level)
      const standardDeviation_mb = Math.sqrt(m_rel.reduce((sum, value) => sum + (value - mean_m_rel) ** 2, 0) / (m_rel.length - 1));
      const marginOfError_mb = 1.96 * (standardDeviation_mb / Math.sqrt(m_rel.length));
      const rounded_margin_mb  = parseFloat(marginOfError_mb.toPrecision(2));
      // Calculate median
      const sorted_m_rel = m_rel.slice().sort((a, b) => a - b);
      const median_m_rel = sorted_m_rel.length % 2 === 0
      ? (sorted_m_rel[sorted_m_rel.length / 2 - 1] + sorted_m_rel[sorted_m_rel.length / 2]) / 2
      : sorted_m_rel[Math.floor(sorted_m_rel.length / 2)];
      const rounded_median_m_rel  = parseFloat(median_m_rel.toPrecision(2));
      
      // Update values
      AccRelEl.innerText = `Mean prediction accuracy: ${rounded_mean_pa} ± ${rounded_margin}
        Median prediction accuracy: ${rounded_median}
        Mean univariate BWAS reliability: ${rounded_mean_u_rel} ± ${rounded_margin_ub}
        Median univariate BWAS reliability: ${rounded_median_u_rel}
        Mean multivariate BWAS reliability: ${rounded_mean_m_rel} ± ${rounded_margin_mb}
        Median multivariate BWAS reliability: ${rounded_median_m_rel}`;
    })
      .catch(error => {
        console.error('Error reading Excel file:', error.message);
      });
}

function calcAcc(K1,K2,N,T) {
  // initialize variables
  let acc = 0; 
  acc = Math.sqrt(1/(1 + (K1/N) + ((K2)/(N*T))))
  return acc
}

function calcRel(K0,K1,K2,N,T) {
  // initialize variables
  let rel = 0; 
  rel = K0 / (K0 + (1/(N/2)) * (1 - ((2*K1)/(1+(K2/T)))))
  return rel
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
