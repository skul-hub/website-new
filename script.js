/* ===============================
   SUPABASE CONFIG (JANGAN DIUBAH)
================================ */
const SUPABASE_URL = 'https://xwhksbwefnsmwmomplkz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uXSNXioJWX1Y5nAoTv1uLQ_cqYXEcdp';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===============================
   HELPER
================================ */
async function loadProducts(category = '') {
    let q = sb.from('products').select('*').order('created_at', { ascending: false });
    if (category) q = q.eq('category', category);
    const { data, error } = await q;
    if (error) console.error(error);
    return data || [];
}

async function loadDoneTransactions() {
    const { data, error } = await sb
        .from('transactions')
        .select('*, products(name, price)')
        .eq('status', 'done')
        .order('created_at', { ascending: false });
    if (error) console.error(error);
    return data || [];
}

/* ===============================
   USER PAGE
================================ */
if (location.pathname === '/' || location.pathname === '/index.html') {
    document.addEventListener('DOMContentLoaded', async () => {

        const productsEl = document.getElementById('products');
        const trxDoneEl = document.getElementById('trxDone');
        const doneList = document.getElementById('doneTransactions');

        const navProducts = document.getElementById('navProducts');
        const navHistory = document.getElementById('navHistory');
        const search = document.getElementById('searchProduct');
        const filter = document.getElementById('categoryFilter');

        let products = [];

        async function refreshProducts() {
            products = await loadProducts(filter.value);
            renderProducts(products);
        }

        function renderProducts(list) {
            productsEl.innerHTML = '';
            if (!list.length) {
                productsEl.innerHTML = '<p>Produk belum tersedia</p>';
                return;
            }
            list.forEach(p => {
                productsEl.innerHTML += `
                    <div class="product">
                        <h3>${p.name}</h3>
                        <p>${p.details}</p>
                        <p class="price">Rp${p.price}</p>
                        <button onclick="buyProduct('${p.id}','${p.name}',${p.price})">BUY</button>
                    </div>
                `;
            });
        }

        async function showHistory() {
            const trx = await loadDoneTransactions();
            doneList.innerHTML = '';
            trx.forEach(t => {
                doneList.innerHTML += `
                    <div class="trx">
                        <b>${t.products.name}</b>
                        <p>Rp${t.products.price}</p>
                        <small>${new Date(t.created_at).toLocaleString()}</small>
                    </div>
                `;
            });
        }

        await refreshProducts();

        // REALTIME PRODUCTS
        sb.channel('products-live')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                refreshProducts
            ).subscribe();

        search.oninput = () => {
            const f = products.filter(p =>
                p.name.toLowerCase().includes(search.value.toLowerCase())
            );
            renderProducts(f);
        };

        filter.onchange = refreshProducts;

        navProducts.onclick = e => {
            e.preventDefault();
            productsEl.style.display = 'grid';
            trxDoneEl.style.display = 'none';
        };

        navHistory.onclick = async e => {
            e.preventDefault();
            productsEl.style.display = 'none';
            trxDoneEl.style.display = 'block';
            await showHistory();
        };
    });
}

/* ===============================
   BUY + QRIS PAKASIR
================================ */
async function buyProduct(productId, name, price) {
    const email = prompt('Masukkan email:');
    if (!email) return;

    const fee = 400;
    const total = price + fee;

    const { data, error } = await sb.from('transactions')
        .insert({ product_id: productId, buyer_email: email })
        .select().single();

    if (error) return alert(error.message);

    const PAKASIR_SLUG = 'skull-hosting';
    const PAKASIR_APIKEY = '7Fn6ugz0vDWynofsTGeRMd5VwZT12e3j';

    const res = await fetch(`https://api.pakasir.com/${PAKASIR_SLUG}/create-qris`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAKASIR_APIKEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: total, reference: data.id })
    });

    const q = await res.json();
    alert('Scan QRIS:\n' + q.qr_code_url);

    setTimeout(async () => {
        await sb.from('transactions').update({ status: 'done' }).eq('id', data.id);
    }, 5000);
}

/* ===============================
   ADMIN PAGE
================================ */
if (location.pathname === '/admindashboard.html') {
    document.addEventListener('DOMContentLoaded', async () => {

        const form = document.getElementById('productForm');
        const list = document.getElementById('productList');

        async function loadAdminProducts() {
            const p = await loadProducts();
            list.innerHTML = '';
            p.forEach(i => {
                list.innerHTML += `
                    <div class="admin-item">
                        ${i.name} - Rp${i.price}
                        <button onclick="deleteProduct('${i.id}')">X</button>
                    </div>
                `;
            });
        }

        await loadAdminProducts();

        form.onsubmit = async e => {
            e.preventDefault();
            await sb.from('products').insert({
                name: productName.value,
                price: productPrice.value,
                details: productDetails.value,
                category: productCategory.value
            });
            form.reset();
            loadAdminProducts();
        };
    });
}

async function deleteProduct(id) {
    if (confirm('Hapus produk?')) {
        await sb.from('products').delete().eq('id', id);
        location.reload();
    }
}
