const baseURL = document.URL;

const cliente = document.getElementById("cliente");
const cgcent = document.getElementById("cgcent");
const endercob = document.getElementById("endercob");
const numerocob = document.getElementById("numerocob");
const municcob = document.getElementById("municcob");
const bairrocob = document.getElementById("bairrocob");
const costumerCodeInput = document.getElementById("costumer-code");
const productsListInput = document.getElementById("products-list");
const generateTermBtn = document.getElementById("gen-term-btn");

costumerCodeInput.focus();

let costumer = {};

const searchCostumer = async (code) => {
  let res = await fetch(`${baseURL}costumers/${code}`);
  if (res.status !== 200) {
    let err = await res.json();
    throw err;
  }
  return await res.json();
};

const showCostumerDetails = () => {
  cliente.textContent = costumer.cliente;
  cgcent.textContent = costumer.cgcent;
  endercob.textContent = costumer.endercob;
  numerocob.textContent = costumer.numerocob;
  municcob.textContent = costumer.municcob;
  bairrocob.textContent = costumer.bairrocob;
};

costumerCodeInput.addEventListener("keydown", async (e) => {
  if (
    (e.code !== "Enter" && e.code !== "Tab") ||
    costumerCodeInput.value === ""
  ) {
    return;
  }

  try {
    costumer = await searchCostumer(costumerCodeInput.value);
    showCostumerDetails();
  } catch (err) {
    alert(err.message);
  }
});

let products = [];

const createProductsList = () => {
  products = [];

  let lines = productsListInput.value.split(";");

  lines.forEach((line) => {
    if (line === "") return;

    let lineValues = line
      .split(",")
      .filter((e) => e.trim() !== "")
      .map((e) => e.trim());

    products.push({
      productName: "",
      productCode: lineValues[0],
      quantity: lineValues[1],
      unit: lineValues[2],
      invoiceNumber: lineValues[3],
    });
  });
};

const searchProducts = async () => {
  for (let c = 0; c < products.length; c++) {
    let prod = products[c];

    let res = await fetch(`${baseURL}products/${prod.productCode}`);

    if (res.status !== 200) {
      let err = await res.json();
      throw err;
    }

    res = await res.json();
    products[c].productName = res.descricao;
  }
};

const toggleButtonState = () => {
  generateTermBtn.disabled = !generateTermBtn.disabled;

  generateTermBtn.textContent = generateTermBtn.disabled
    ? "Gerando..."
    : "Gerar termo";
};

generateTermBtn.onclick = async () => {
  toggleButtonState();

  createProductsList();

  try {
    await searchProducts();
  } catch (e) {
    alert(e.message);
  }

  toggleButtonState();
};
