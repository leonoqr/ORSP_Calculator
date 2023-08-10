const btnEl = document.getElementById("btn");
const budgetEl = document.getElementById("budget");
const max_tEl = document.getElementById("max_t");
const resultEl = document.getElementById("result");

function getParams() {
  const bugetValue = budgetEl.value;
  const max_tValue = max_tEl.value;
  if (bugetValue === "") {
    alert("Please enter a budget");
  } else {
    resultEl.innerText = `Buget is ${budget} and max_t is ${max_t}`;
  }
}

function getAge(birthdayValue) {
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