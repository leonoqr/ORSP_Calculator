// Define all factors
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
const AccEl = document.getElementById("Acc_Results");
const uniEl = document.getElementById("uniRel_Results");
const multiEl = document.getElementById("multiRel_Results");
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
      const [acc, ABCD_names, HCP_names] = ReadExcel(workbook, 0, 3,NValue,TValue,'Acc')
      const [mean_pa, margin_pa, median_pa] = get_averages(acc)
      // Update text and graphs
      AccEl.innerText = `Mean prediction accuracy: ${mean_pa} ± ${margin_pa}
        Median prediction accuracy: ${median_pa}`;
      plotHist('PredHist', acc)
      drawTable('ABCD_accTable', acc, 'ABCD', ABCD_names)
      drawTable('HCP_accTable', acc, 'HCP', HCP_names)

      // univariate BWAS
      const [u_rel, , ] = ReadExcel(workbook, 1, 4,NValue,TValue,'Rel')
      const [mean_urel, margin_urel, median_urel] = get_averages(u_rel)
      // Update text and graphs
      uniEl.innerText = `Mean univariate BWAS reliability: ${mean_urel} ± ${margin_urel}
        Median univariate BWAS reliability: ${median_urel}`;
      plotHist('uRelHist', u_rel)
      drawTable('ABCD_uRelTable', u_rel, 'ABCD', ABCD_names)
      drawTable('HCP_uRelTable', u_rel, 'HCP', HCP_names)

      // multivariate BWAS
      const [m_rel, , ] = ReadExcel(workbook, 2, 5,NValue,TValue,'Rel')
      const [mean_mrel, margin_mrel, median_mrel] = get_averages(m_rel)
      // Update values
      multiEl.innerText = `Mean multivariate BWAS reliability: ${mean_mrel} ± ${margin_mrel}
        Median multivariate BWAS reliability: ${median_mrel}`;

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

function ReadExcel(workbook, ABCDSheet, HCPSheet,NValue,TValue,type) {
  let ABCD_names = [];
  let HCP_names = [];
  let vec = [];

  // Loop through each row (2 to 18) for ABCD
  {
    let sheetName = workbook.SheetNames[ABCDSheet];
    let worksheet = workbook.Sheets[sheetName];
    for (let row = 2; row <= 18; row++) {
        // calculate formula
        const K0 = worksheet[`B${row}`]
        const K1 = worksheet[`C${row}`]
        const K2 = worksheet[`D${row}`]
        if (type === 'Acc') {
            vec.push(calcAcc(K1.v, K2.v, NValue, TValue));
        } else if (type === 'Rel') {
            vec.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue));
        } 
        // get phenotype names
        const name = worksheet[`A${row}`]
        ABCD_names.push(name.v)
    }
  }
  // Loop through each row (2 to 20) for HCP
  { 
    let sheetName = workbook.SheetNames[HCPSheet];
    let worksheet = workbook.Sheets[sheetName];
    for (let row = 2; row <= 20; row++) {
        // calculate formula
        const K0 = worksheet[`B${row}`]
        const K1 = worksheet[`C${row}`]
        const K2 = worksheet[`D${row}`]
        if (type === 'Acc') {
            vec.push(calcAcc(K1.v, K2.v, NValue, TValue));
        } else if (type === 'Rel') {
            vec.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue));
        } 
        // get phenotype names
        const name = worksheet[`A${row}`]
        HCP_names.push(name.v)
    }
  }
  return [vec,ABCD_names,HCP_names]
}

function get_averages(vec) {
  // get mean
  let mean = vec.length > 0 ? vec.reduce((a, b) => a + b) / vec.length : 0;
  let rounded_mean = parseFloat(mean.toPrecision(2)); // Round off to 2 significant figures

  // Calculate confidence interval (assuming a 95% confidence level)
  let standardDeviation = Math.sqrt(vec.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (vec.length - 1));
  let marginOfError = 1.96 * (standardDeviation / Math.sqrt(vec.length));
  let rounded_margin  = parseFloat(marginOfError.toPrecision(2));
      
  // Calculate median
  let sorted = vec.slice().sort((a, b) => a - b);
  let median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  let rounded_median  = parseFloat(median.toPrecision(2));

  return [rounded_mean, rounded_margin, rounded_median]
}

function calculateKDE(data, bandwidth) {
  const n = data.length;
  return data.map(x =>
    (1 / (n * bandwidth)) * data.reduce((sum, xi) => sum + gaussianKernel(x - xi, bandwidth), 0)
  );
}

function plotHist(html_el, vec) {
  // Update histogram
  var histTrace = { x: vec, type: 'histogram', opacity: 0.7,
      marker: {color: 'blue',}, histfunc: 'density',
      xbins: {start: 0, end: 1, size: (1/100)},
      histnorm: 'probability density'};
      //xbins: {start: Math.min(...acc), end: Math.max(...acc), size: (1/50)},
  // Line plot for KDE
  var sortedX = vec.slice().sort((a, b) => a - b);
  var lineTrace = {x: [0].concat(sortedX, [1]), // Add points at the boundaries
      y: calculateKDE(sortedX, 0.18), mode: 'lines', line: { color: 'green' }};
  var data_v = [histTrace, lineTrace];
  var layout = {xaxis: {title: 'Accuracy (Normalized by K0)', range: [0, 1]},
        yaxis: {title: 'PDF'}, height: 300, width: 1000};
  var config = {displayModeBar: false};
  // The 'histogram' ID corresponds to the HTML element where the plot will be rendered
  Plotly.newPlot(html_el, data_v, layout, config);
}

function drawTable(div_el, vec, dataset, dataset_names) {
  // define table contents
  var tableDiv = document.getElementById(div_el);
  var new_vec;
  if (dataset === 'HCP') {
    new_vec = vec.slice(17, 37).map(value => parseFloat(value.toPrecision(2)));
  } else {
    new_vec = vec.slice(0, 17).map(value => parseFloat(value.toPrecision(2)));
  }
  var new_vec_indices = new_vec.map((_, index) => index + 1);
  // Define your table data
var tableData = [{
  type: 'table',
  header: {
    values: ['Index', 'Phenotype', 'Accuracy (Normalized by K0)'],
    align: 'center',
    line: { width: 1, color: 'black' },
    fill: { color: '#333333' },
    font: { family: "Arial", size: 12, color: "white" },
    height: 20, // Adjust the header row height as needed
    widths: [1, 2, 2], // Adjust the width of columns aeded
  },
  cells: {
    values: [new_vec_indices, dataset_names, new_vec],
    align: 'center',
    line: { color: "black", width: 0 },
    font: { family: "Arial", size: 10, color: ["black"] },
    height: 15, // Adjust the data row height as needed
    widths: [1, 2, 2], // Adjust the width of columns a
    fill: {
      color: Array.from({ length: new_vec_indices.length }, (v, i) => i % 2 === 0 ? 'white' : 'lightgrey'),
    },
  }
}];

  // Define the layout
  var layout = { height: 300, width: 500,
    margin: { l: 0, r: 0, b: 0, t: 0 }};
  var config = {displayModeBar: false};
  // Plot the table
  Plotly.newPlot(tableDiv, tableData, layout, config);
}

function gaussianKernel(x, bandwidth) {
  return Math.exp((-0.5 * x * x) / (bandwidth * bandwidth)) / (bandwidth * Math.sqrt(2 * Math.PI));
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

function openContainer(containerId, clickedTab) {
    // Hide all containers
    var containers = document.getElementsByClassName('container-content');
    for (var i = 0; i < containers.length; i++) {
        containers[i].style.display = 'none';
    }

    // Display the selected container
    document.getElementById(containerId).style.display = 'block';
    // Set the active tab
    setActiveTab(clickedTab);
}

function setActiveTab(tab) {
  // Reset all tabs to inactive state
  document.querySelectorAll('.tabs button').forEach(function (otherTab) {
  otherTab.style.backgroundColor = '#444';
  });
  // Set the clicked tab to active state
  tab.style.backgroundColor = '#8b0000';
}

// Variables to be set on startup
// Press PredAcc tab when page loads
document.addEventListener("DOMContentLoaded", function() {
    openContainer('PredAcc');
});
// Calculate NT param graph
getNTParams()

// Add all event listeners
//B1.addEventListener("click", getNTParams);
B2.addEventListener("click", getBudgetParams);
