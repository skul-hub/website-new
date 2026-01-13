let currentTrx = null;

function openBuy(product) {
  selectedProduct = product;
  document.getElementById("modal-product").innerText = product.name;
  document.getElementById("modal-price").innerText =
    "Rp " + product.price.toLocaleString();
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

async function createTransaction() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;

  if (!username || !email) return alert("Lengkapi data!");

  const { data } = await supabase.from("transactions").insert([{
    product_id: selectedProduct.id,
    product_name: selectedProduct.name,
    price: selectedProduct.price,
    username,
    email,
    status: "PENDING"
  }]).select().single();

  currentTrx = data;

  document.getElementById("modal").classList.add("hidden");
  document.getElementById("detail").classList.remove("hidden");

  document.getElementById("detail-content").innerHTML = `
    Produk: ${data.product_name}<br>
    Harga: Rp ${data.price.toLocaleString()}<br>
    Tanggal: ${new Date(data.created_at).toLocaleString()}
  `;
}

async function confirmTrx() {
  // nanti di tahap 4 kita sambungkan ke PAKASIR
  alert("QRIS akan muncul di tahap berikutnya");

  await supabase.from("transactions")
    .update({ status: "WAITING_PAYMENT" })
    .eq("id", currentTrx.id);
}

async function cancelTrx() {
  await supabase.from("transactions")
    .update({ status: "CANCELLED" })
    .eq("id", currentTrx.id);

  document.getElementById("detail").classList.add("hidden");
}
