const name = document.getElementById("name");
const price = document.getElementById("price");
const desc = document.getElementById("desc");
const cat = document.getElementById("cat");

const productAdmin = document.getElementById("product-admin");
const trxAdmin = document.getElementById("trx-admin");

async function addProduct() {
  const res = await fetch("/api/admin-products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.value,
      price: Number(price.value),
      description: desc.value,
      category: cat.value
    })
  });

  const data = await res.json();
  console.log(data);

  loadAdminProducts();
}

async function loadAdminProducts() {
  const res = await fetch("/api/admin-products");
  const data = await res.json();

  productAdmin.innerHTML = data.map(p => `
    <div>
      ${p.name} - Rp ${p.price}
      <button onclick="delProduct('${p.id}')">DELETE</button>
    </div>
  `).join("");
}

async function delProduct(id) {
  await fetch("/api/admin-products", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  loadAdminProducts();
}

loadAdminProducts();
