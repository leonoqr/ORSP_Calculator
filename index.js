// ------ Define all elements -------
// Get elements from the HTML for further calculations
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
const oAccEl = document.getElementById("oAcc_Results");
const rAccEl = document.getElementById("rAcc_Results");
const resultEl = document.getElementById("Budget_Results");
const OrderEl = document.getElementById('r_order')
var radioNormalized = document.getElementById("NormAcc");
var radioCorrelation = document.getElementById("Acc");
var AccK0 = document.getElementById('AccK0');
var AccK1 = document.getElementById('AccK1');
var AccK2 = document.getElementById('AccK2');
var ownAccRes = document.getElementById('ownAccresult');
var ownAccDisplay = document.getElementById('D_pheno');
var ownAccRemove = document.getElementById('removeD_pheno');
var radioOInputs = document.querySelectorAll('input[name="Ordertab"]');
var radioAInputs = document.querySelectorAll('input[name="Acctab"]');
var dispOwnAcc = 0;
// ----------------------------------

// ------ Define functions -------
// ------ 1. Functions to calculate accuracy and reliability -------
function calcAcc(K0,K1,K2,N,T) {
  // Calculate accuracy based on N and T
  let acc = 0; 
  acc = K0*Math.sqrt(1/(1 + (K1/N) + ((K2)/(N*T))))
  return acc
}

function calcNormAcc(K1,K2,N,T) {
  // Calculate normalized accuracy based on N and T
  let acc = 0; 
  acc = Math.sqrt(1/(1 + (K1/N) + ((K2)/(N*T))))
  return acc
}

function calcRel(K0,K1,K2,N,T) {
  // Calculate reliability based on N and T
  let rel = 0; 
  rel = K0 / (K0 + (1/(N/2)) * (1 - ((2*K1)/(1+(K2/T)))))
  return rel
}
// -----------------------------------------------------------------
// ------ 2. Functions to collate results or calculate distributions ------
function get_averages(vec) {
  // From a vector of values, get the mean, median and confidence inteval
  // Calculate mean
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

function calculateKDE(data, bandwidth, numBins) {
    // Sort a vector of data into bins and calculate its KDE
    // Step 1: Sort data into 250 bins
    const binWidth = 1 / numBins;
    var data_bin = sortDataIntoBins(data, numBins);

    // Step 2: Calculate KDE from data_bin
    var kdeValues = new Array(numBins).fill(0);

    for (let index = 0; index < numBins; index++) {
        for (let c = 0; c < numBins; c++) {
            var distance = Math.abs(c - index);
            var gaussianValue = gaussianKernel(distance, bandwidth) * data_bin[index];
            kdeValues[c] += gaussianValue;
        }
    }

    // Step 3: Return normalized KDE values
    return kdeValues.map(value => value * (bandwidth * Math.sqrt(2 * Math.PI)));
}

function sortDataIntoBins(data, numBins) {

    const binWidth = 1 / numBins;
    const binCounts = new Array(numBins).fill(0);

    data.forEach(x => {
        // Ensure the data point is within the valid range [0, 1]
        if (x >= 0 && x <= 1) {
            // Calculate the bin index and increment the count
            const binIndex = Math.floor(x * numBins);
            binCounts[binIndex]++;
        }
    });

    return binCounts;
}

function gaussianKernel(x, bandwidth) {
  return Math.exp((-0.5 * x * x) / (bandwidth * bandwidth)) / (bandwidth * Math.sqrt(2 * Math.PI));
}

function linspace(start, end, numPoints) {
    const step = (end - start) / Math.max(numPoints - 1, 1);
    return Array.from({ length: numPoints }, (_, i) => start + i * step);
}

// ------------------------------------------------------------------------
// ------ 3. Functions to read values from the excel sheets ------
function getNTParams(version,ownAcc) {
  // Calculate accuracies based on N and T for 3 cases
  // 1: Original run order
  // 2: Randomized run order
  // 3: Own K values are entered (only plot if values are entered)
  // Requires input of version which can be either "Acc" or "NormAcc"
 
  // load function values from accuracy calculator form
  const NValue = N_El.value;
  const TValue = T_El.value;
  // Display error message if any values are blank
  if (NValue == "") {
      alert("Please enter N");
  } else if (TValue == "") {
      alert("Please enter T");
  } 
  if (version == "Acc") {
      xtitle = "Pearson's Correlation"
  } else if (version == "NormAcc") {
      xtitle = "Normalized Accuracy"
  }

  // Plot original order values
  const o_filePath = 'https://raw.githubusercontent.com/leonoqr/ORSP_Calculator/main/Ooi_ScanTime_suppl_TheoreticalCalc_240109.xlsx';
  fetch(o_filePath)
      .then(response => {
      if (!response.ok) {
          throw new Error(`Failed to fetch file (HTTP ${response.status})`);
      }
      return response.arrayBuffer();
      })
      .then(buffer => {
      var data = new Uint8Array(buffer);
      var workbook = XLSX.read(data, { type: 'array' });

      // Prediction accuracy
      var [acc,ABCD_names,HCP_names,ABCD_K0,ABCD_K1,ABCD_K2,HCP_K0,HCP_K1,HCP_K2] = ReadExcel(workbook, 0, 3,NValue,TValue,version)
      var [mean_pa, margin_pa, median_pa] = get_averages(acc)
      // Update text and graphs
      oAccEl.innerText = `Mean prediction accuracy: ${mean_pa} ± ${margin_pa}
        Median prediction accuracy: ${median_pa}`;
      plotHist('oAccHist', acc, xtitle,ownAcc)
      drawTable('ABCD_oAccTable', acc, 'ABCD', ABCD_names,ABCD_K0,ABCD_K1,ABCD_K2)
      drawTable('HCP_oAccTable', acc, 'HCP', HCP_names,HCP_K0,HCP_K1,HCP_K2)

      })
      .catch(error => {
        console.error('Error reading Excel file:', error.message);
      });

  // Plot random order values
  const r_filePath = 'https://raw.githubusercontent.com/leonoqr/ORSP_Calculator/main/Ooi_ScanTime_suppl_TheoreticalCalc_randomized_240318.xlsx';
  fetch(r_filePath)
      .then(response => {
      if (!response.ok) {
          throw new Error(`Failed to fetch file (HTTP ${response.status})`);
      }
      return response.arrayBuffer();
      })
      .then(buffer => {
      var data = new Uint8Array(buffer);
      var workbook = XLSX.read(data, { type: 'array' });

      // Prediction accuracy
      var [acc,ABCD_names,HCP_names,ABCD_K0,ABCD_K1,ABCD_K2,HCP_K0,HCP_K1,HCP_K2] = ReadExcel(workbook, 0, 3,NValue,TValue,version)
      var [mean_pa, margin_pa, median_pa] = get_averages(acc)
      // Update text and graphs
      rAccEl.innerText = `Mean prediction accuracy: ${mean_pa} ± ${margin_pa}
        Median prediction accuracy: ${median_pa}`;
      plotHist('rAccHist', acc, xtitle, ownAcc)
      drawTable('ABCD_rAccTable', acc, 'ABCD', ABCD_names,ABCD_K0,ABCD_K1,ABCD_K2)
      drawTable('HCP_rAccTable', acc, 'HCP', HCP_names,HCP_K0,HCP_K1,HCP_K2)

      })
      .catch(error => {
        console.error('Error reading Excel file:', error.message);
      });
}

function updateNTParams() {
    // read current N and T values
    const NValue = N_El.value;
    const TValue = T_El.value;
    // Update based on whether normalized or unnormalized results
    // and whether own value should be plotted
    if (radioNormalized.checked) {
        if (dispOwnAcc === 1) {
            var own_acc = calcNormAcc(AccK1.value, AccK2.value, NValue, TValue);
            getNTParams("NormAcc", own_acc);
        } else {
            getNTParams("NormAcc", -2)
        }
    } else if (radioCorrelation.checked) {
        if (dispOwnAcc === 1) {
            var own_acc = calcAcc(AccK0.value, AccK1.value, AccK2.value, NValue, TValue);
            getNTParams("Acc", own_acc);
        }
        else {
            getNTParams("Acc", -2);
        }
    }
}

function updateInputBox(value, inputId, sliderId) {
    document.getElementById(inputId).value = value;
    document.getElementById(sliderId).value = value;
    if (inputId === 'N' || inputId === 'T') {
        updateNTParams();
    }
}

function updateSlider(value, inputId, sliderId) {
    document.getElementById(inputId).value = value;
    document.getElementById(sliderId).value = value;
    if (inputId === 'N' || inputId === 'T') {
        updateNTParams();
    }
}

function ReadExcel(workbook,ABCDSheet,HCPSheet,NValue,TValue,type) {
  // Read excel notebook and save params, as well as calculate the accuracy based
  // on the current N and T values.

  // Define variables to be saved
  let ABCD_names = [];
  let ABCD_K0 = [];
  let ABCD_K1 = [];
  let ABCD_K2 = [];
  let HCP_names = [];
  let HCP_K0 = [];
  let HCP_K1 = [];
  let HCP_K2 = [];
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
            vec.push(calcAcc(K0.v, K1.v, K2.v, NValue, TValue));
        } else if (type === 'NormAcc') {
            vec.push(calcNormAcc(K1.v, K2.v, NValue, TValue));
        } else if (type === 'Rel') {
            vec.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue));
        } 
        // get phenotype names
        const name = worksheet[`A${row}`]
        ABCD_names.push(name.v)
        ABCD_K0.push(Number(K0.v.toFixed(2)))
        ABCD_K1.push(Number(K1.v.toFixed(2)))
        ABCD_K2.push(Number(K2.v.toFixed(2)))
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
            vec.push(calcAcc(K0.v, K1.v, K2.v, NValue, TValue));
        } else if (type === 'NormAcc') {
            vec.push(calcNormAcc(K1.v, K2.v, NValue, TValue));
        } else if (type === 'Rel') {
            vec.push(calcRel(K0.v,K1.v,K2.v,NValue,TValue));
        }
        // get phenotype names
        const name = worksheet[`A${row}`]
        HCP_names.push(name.v)
        HCP_K0.push(Number(K0.v.toFixed(2)))
        HCP_K1.push(Number(K1.v.toFixed(2)))
        HCP_K2.push(Number(K2.v.toFixed(2)))
    }
  }
  return [vec,ABCD_names,HCP_names,ABCD_K0,ABCD_K1,ABCD_K2,HCP_K0,HCP_K1,HCP_K2]
}
// ---------------------------------------------------------------
// ------ 4. Functions to draw plots ------
function plotHist(html_el, vec, xtitle, ownAcc) {
      // Plot histrogram
      var histTrace = { x: vec, type: 'histogram', opacity: 0.4,
          marker: {color: 'blue',}, xbins: {start: 0, end: 1, size: (1/250)},};

      // Convert histogram to KDE and plot line plot (filled below line)
      var sortedX = vec.slice().sort((a, b) => a - b);
      const new_x = linspace(0, 1, 250);
      var lineTrace = {x: new_x, y: calculateKDE(vec, 3, 250), opacity: 0.7, 
            mode: 'lines', fill: 'tozeroy', line: { color: 'lightgreen' }};

      // Arrow trace
      var arrowTrace = {
          x: [ownAcc, ownAcc],
          y: [0, Math.max(...lineTrace.y)],
          mode: 'lines',
          line: {
          color: 'red',
          width: 2,
          dash: 'dashdot'
          }
      };

      if (ownAcc == -2) {
          var data_v = [histTrace, lineTrace];
      } else {
          var data_v = [histTrace, lineTrace, arrowTrace];
      }
      var layout = {xaxis: {title: xtitle, range: [0, 1]},
          yaxis: {title: 'Frequency'}, showlegend: false, height: 300, width: 1200};
      var config = {displayModeBar: false};

      // The 'histogram' ID corresponds to the HTML element where the plot will be rendered
      Plotly.newPlot(html_el, data_v, layout, config);
}

function drawTable(div_el, vec, dataset, dataset_names, K0, K1, K2) {
    // Define variables
    var tableDiv = document.getElementById(div_el);
    var new_vec;

    // split vector into HCP and ABCD
    if (dataset === 'HCP') {
       new_vec = vec.slice(17, 37).map(value => parseFloat(value.toPrecision(2)));
    } else {
      new_vec = vec.slice(0, 17).map(value => parseFloat(value.toPrecision(2)));
    }

  // Define your table data
    var new_vec_indices = new_vec.map((_, index) => index + 1);
    var tableData = [{
      type: 'table',
      columnwidth: [80, 250, 150, 150, 150, 100],
      header: {
        values: ['Index', 'Phenotype', 'K0', 'K1', 'K2', 'Accuracy'],
        align: 'center',
        line: { width: 1, color: 'black' },
        fill: { color: '#333333' },
        font: { family: "Arial", size: 12, color: "white" },
        height: 20, 
      },
      cells: {
        values: [new_vec_indices, dataset_names, K0, K1, K2, new_vec],
        align: 'center',
        line: { color: "black", width: 0 },
        font: { family: "Arial", size: 12, color: ["black"] },
        height: 20, 
        wrap: 'wrap',
        fill: {
          color: Array.from({ length: new_vec_indices.length }, (v, i) => i % 2 === 0 ? 'white' : 'lightgrey'),
        },
      }
    }];

    // Define the layout
    var layout = { height: 320, width: 500,
      margin: { l: 0, r: 0, b: 0, t: 0 }};
    var config = {displayModeBar: false};
    // Plot the table
    Plotly.newPlot(tableDiv, tableData, layout, config);
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

      // update text
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
  let N_list = [];
  let T_list = [];
  let NT_Acc = [];

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

      // calculate acc
      N_list.push(num_Ppt)
      T_list.push(fMRITime)
      const [acc, ABCD_names, HCP_names] = ReadExcel(workbook, 0, 3,NValue,TValue,'NormAcc')
      const [mean_pa, margin_pa, median_pa] = get_averages(acc)
      NT_Acc.push()

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

  // update plots
  var cost_p_t = parseFloat(CostTimeValue) / parseFloat(ScanItvlValue)
  var total_scantime_pp = Itvls_Scanned * parseFloat(ScanItvlValue)
  var MRI_overhead_t = (parseFloat(psScanTimeValue) * NumSessions) + parseFloat(otScanTimeValue)
  var fMRI_c = num_Ppt_sav * fMRITime_sav * cost_p_t;
  var MRI_overhead_c = num_Ppt_sav * (1 - (fMRITime_sav / total_scantime_pp)) * total_scantime_pp * cost_p_t;
  var nMRI_overhead_c = num_Ppt_sav * (parseFloat(PptCostValue) + (parseFloat(SsnCostValue) * NumSessions));
  plotBarPlot('BudgetBar', budgetValue, fMRI_c, MRI_overhead_c, nMRI_overhead_c, 'Money')
  plotBarPlot('TimeBar', ScanDuration_sav, fMRITime_sav, MRI_overhead_t, 0, 'Time')
  plotLinePlot('AccGraph')

  return [num_Ppt_sav, effScanTime_sav, NumSessions_sav, ScanDuration_sav, fMRITime_sav, unusedTime_sav, revised_Cost_sav];
}

function plotBarPlot(BarEl, t_v, f_v, moh_v, nmoh_v, mode) {
  if (mode == 'Money'){
      var categories = ['$'];
  } else if (mode == 'Time') {
      var categories = ['mins'];
  }

  // Create traces for each category
  var fMRI = {
      y: categories,
      x: [f_v],
      name: 'fMRI',
      type: 'bar',
      orientation: 'h',
      marker: {
          color: 'orange',
      },
  };

  var MRIoverHead = {
      y: categories,
      x: [moh_v],
      name: 'MRI overhead',
      type: 'bar',
      orientation: 'h',
      marker: {
          color: '#00274e',
      },
  };

  var nonMRIoverHead = {
      y: categories,
      x: [nmoh_v],
      name: 'non-MRI overhead',
      type: 'bar',
      orientation: 'h',
      marker: {
          color: '#800000',
      },
  };

  var Unused = {
      y: categories,
      x: [t_v - f_v - moh_v - nmoh_v],
      name: 'Unused',
      type: 'bar',
      orientation: 'h',
      marker: {
          color: '#333333',
      }, 
  };

  if (mode == 'Money'){
      var reqData = [fMRI, MRIoverHead, nonMRIoverHead, Unused];
      var Title = "Budget breakdown"
  } else if (mode == 'Time') {
      var reqData = [fMRI, MRIoverHead, Unused];
      var Title = "Scan breakdown"
  }

  // Define the layout
  var layout = {
      height: 200, width: 500,
      barmode: 'stack',  // Set the bar mode to 'stack'
      title: Title,
      legend: {
          y: 0.5, // Center the legend vertically
          orientation: 'v',
          traceorder: 'normal' // Explicitly set trace order to ensure horizontal legend
      },
      margin: { l: 30, r: 50, b: 15, t: 25 }
  };

  var config = {displayModeBar: false};

  // Plot the chart
  Plotly.newPlot(BarEl, reqData, layout, config);
}

function plotLinePlot(LineEl) {
    // Sample data
    var xValues = [1, 2];
    var yValues = [10, 20];

    // Create a trace for scatter points
    var scatterTrace = {
        x: xValues,
        y: yValues,
        mode: 'markers',
        type: 'scatter',
        name: 'Scatter Points',
        marker: {
            size: 10,
            color: 'green',  // Set the color for scatter points
        },
    };

    // Create a trace for the line
    var lineTrace = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        type: 'scatter',
        name: 'Line',
        line: {
            color: 'orange',  // Set the color for the line
            width: 2,
        },
    };

    // Define the layout
    var layout = {
        height: 280,
        width: 500,
        title: 'Line Plot with Scatter Points',
        showlegend: true,
        legend: {
            x: 0.85,
            y: 1,
        },
    };

    var config = { displayModeBar: false };

    // Plot the chart
    Plotly.newPlot(LineEl, [scatterTrace, lineTrace], layout, config);
}
// ----------------------------------------
// ------ 4. Functions to draw plots ------
function showSelectedContainer() {
    // Get the selected radio input
    var selectedRadio = document.querySelector('input[name="Ordertab"]:checked');
    
    // Get the ID of the container associated with the selected radio input
    var containerId = selectedRadio.getAttribute('data-container');
    
    // Hide all containers
    var containers = document.querySelectorAll('.container-content');
    containers.forEach(function(container) {
        container.style.display = 'none';
    });
    
    // Show the container associated with the selected radio input
    var containerToShow = document.getElementById(containerId);
    if (containerToShow) {
        containerToShow.style.display = 'block';
        updateNTParams()
    }
}

function checkAccCalcInputs() {
    // Get values from document
    var val1 = AccK0.value;
    var val2 = AccK1.value;
    var val3 = AccK2.value;
    const NValue = N_El.value;
    const TValue = T_El.value;

    // Check if all inputs have values
    if (val1 !== '' && val2 !== '' && val3 !== '') {
        // Display calculated accuracy
        ownAccRes.innerText = "Pearson's correlation: " + calcAcc(val1,val2,val3,NValue,TValue)
            + "\n" + "Normalized accuracy: " + calcNormAcc(val2,val3,NValue,TValue);
        ownAccRes.style.display = 'block';
        // Update graph if there is an existing display
        if (dispOwnAcc == 1) {
            updateNTParams()
        }
        // check if display button on graph is pressed
        ownAccDisplay.addEventListener('click', function() {
            // Set the value when the button is clicked
            dispOwnAcc = 1;
            updateNTParams()
        });

       // Add event listener to the remove button (if needed)
       ownAccRemove.addEventListener('click', function() {
           // Reset or remove the value when the button is clicked
           dispOwnAcc = 0;
           updateNTParams()
       });
    } else {
        // Hide the result if any input is empty
        ownAccRes.style.display = 'none';
        dispOwnAcc = 0;
        updateNTParams()
    }
}


// ------ Run these functions when script is called -------
// Plot bar plots
plotBarPlot('BudgetBar', 9999, 100, 100, 100, 'Money')
plotBarPlot('TimeBar', 60, 30, 10, 0, 'Time')
plotLinePlot('AccGraph')


// Call the function initially to show the initially selected container
showSelectedContainer();
// Calculate NT param graph
updateNTParams()

// ------ Add all event listeners ------
// Update budget calculator page
B2.addEventListener("click", getBudgetParams);
// Update accuracy calculator page
radioOInputs.forEach(function(input) {
    input.addEventListener('click', showSelectedContainer);
});
radioAInputs.forEach(function(input) {
    input.addEventListener('click', function() {
        updateNTParams();
    });
});
document.getElementById('NSlider').addEventListener('input', function () {
    updateInputBox(this.value, 'N', 'NSlider'); 
});
document.getElementById('N').addEventListener('input', function () {
    updateSlider(this.value, 'N', 'NSlider');
});
document.getElementById('TSlider').addEventListener('input', function () {
    updateInputBox(this.value, 'T', 'TSlider');
});
document.getElementById('T').addEventListener('input', function () {
    updateSlider(this.value, 'T', 'TSlider');
});
AccK0.addEventListener('input', checkAccCalcInputs);
AccK1.addEventListener('input', checkAccCalcInputs);
AccK2.addEventListener('input', checkAccCalcInputs);
