const supabaseAdmin = supabase.createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY
);

async function addProduct() {
  await supabaseAdmin.from("products").insert([{
    name: name.value,
    price: price.value,
    description: desc.value,
    category: cat.value
  }]);
  loadAdminProducts();
}

async function loadAdminProducts() {
  const { data } = await supabaseAdmin.from("products").select("*");
  productAdmin.innerHTML = data.map(p => `
    <div>
      ${p.name} - Rp ${p.price}
      <button onclick="del('${p.id}')">DELETE</button>
    </div>
  `).join("");
}

async function loadTrxAdmin() {
  const { data } = await supabaseAdmin.from("transactions").select("*");
  trxAdmin.innerHTML = data.map(t => `
    <div>
      ${t.product_name} | ${t.status}
      ${t.status === "PAID" ? 
        `<button onclick="done('${t.id}')">SELESAI</button>` : ""}
    </div>
  `).join("");
}

async function done(id) {
  await supabaseAdmin.from("transactions")
    .update({
      status: "DONE",
      owner_message: "Silahkan cek email anda",
      finished_at: new Date()
    })
    .eq("id", id);

  loadTrxAdmin();
}

loadAdminProducts();
loadTrxAdmin();
