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

async function loadTrxDone() {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("status", "DONE");

  document.getElementById("trx-done").innerHTML =
    data.map(t => `
      <div class="card">
        <b>${t.product_name}</b><br>
        Status: SELESAI<br>
        ${t.owner_message || ""}
      </div>
    `).join("");
}

async function confirmTrx() {
  const res = await fetch("/api/create-qris", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: currentTrx.price,
      trx_id: currentTrx.id,
      product: currentTrx.product_name
    })
  });

  const qris = await res.json();

  document.getElementById("qris").src = qris.qr_url;
  document.getElementById("qris").style.display = "block";

  await supabase.from("transactions")
    .update({ status: "WAITING_PAYMENT", payment_ref: qris.reference_id })
    .eq("id", currentTrx.id);
}

