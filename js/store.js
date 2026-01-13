let selectedProduct = null;

async function loadProducts(category = null) {
  let query = supabase.from("products").select("*");

  if (category) query = query.eq("category", category);

  const { data } = await query;

  const keyword = document.getElementById("search").value.toLowerCase();

  document.getElementById("product-list").innerHTML =
    data
      .filter(p => p.name.toLowerCase().includes(keyword))
      .map(p => `
        <div class="card">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <b>Rp ${p.price.toLocaleString()}</b><br>
          <button onclick='openBuy(${JSON.stringify(p)})'>BUY</button>
        </div>
      `).join("");
}

document.getElementById("search").onkeyup = () => loadProducts();

loadProducts();
loadTrxDone();
