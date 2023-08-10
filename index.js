const btnEl = document.getElementById("btn");
const budget_El = document.getElementById("budget");
const maxT_El = document.getElementById("maxT");
const minT_El = document.getElementById("minT");
const ScanItvl_El = document.getElementById("ScanItvl");
const CostTime_El = document.getElementById("CostTime");
const psScanTime_El = document.getElementById("psScanTime");
const otScanTime_El = document.getElementById("otScanTime");
const PptCost_El = document.getElementById("PptCost_El");
const SsnCost_El = document.getElementById("SsnCost_El");
const maxS_El = document.getElementById("maxS_El");
const resultEl = document.getElementById("result");

function getParams() {
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

  if (budgetValue === "") {
    alert("Please enter a budget");
  } 
  else if (maxTValue === "") {
    alert("Please enter a budget");
  } 
  else if (minTValue === "") {
    alert("Please enter a budget");
  } 
  else if (ScanItvlValue === "") {
    alert("Please enter a budget");
  } 
  else if (CostTimeValue === "") {
    alert("Please enter a budget");
  } 
  else if (psScanTimeValue === "") {
    alert("Please enter a budget");
  } 
  else if (otScanTimeValue === "") {
    alert("Please enter a budget");
  } 
  else if (PptCostValue === "") {
    alert("Please enter a budget");
  } 
  else if (SsnCostValue === "") {
    alert("Please enter a budget");
  } 
  else if (SsnCostValue === "") {
    alert("Please enter a budget");
  } 
  else {
    resultEl.innerText = `Buget is ${budgetValue} and max_t is ${max_tValue}`;
  }
}

function getOptimalParams(birthdayValue) {
  const currentDate = new Date();
  const birthdayDate = new Date(birthdayValue);
  let age = currentDate.getFullYear() - birthdayDate.getFullYear();
  const month = currentDate.getMonth() - birthdayDate.getMonth();

  if (
    month < 0 ||
    (month === 0 && currentDate.getDate() < birthdayDate.getDate())
  ) {
    age--;
  }

  return age;
}

btnEl.addEventListener("click", getParams);