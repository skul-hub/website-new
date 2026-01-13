// ==========================
// SUPABASE CONFIG (JANGAN DIUBAH)
// ==========================
const SUPABASE_URL = 'https://xwhksbwefnsmwmomplkz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uXSNXioJWX1Y5nAoTv1uLQ_cqYXEcdp';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================
// HELPER
// ==========================
async function loadProducts(category = '') {
    let q = supabase.from('products').select('*');
    if (category) q = q.eq('category', category);
    const { data } = await q;
    return data || [];
}

async function loadTransactions(status = '') {
    let q = supabase
        .from('transactions')
        .select('*, products(name, price)');
    if (status) q = q.eq('status', status);
    const { data } = await q;
    return data || [];
}

// ======================================================
// USER / INDEX
// ======================================================
if (location.pathname === '/' || location.pathname === '/index.html') {
    document.addEventListener('DOMContentLoaded', async () => {

        const productsEl = document.getElementById('products');
        const trxDoneEl = document.getElementById('trxDone');
        const statsEl = document.getElementById('stats');
        const doneList = document.getElementById('doneTransactions');

        const navProducts = document.getElementById('navProducts');
        const navHistory = document.getElementById('navHistory');
        const navStats = document.getElementById('navStats');

        const search = document.getElementById('searchProduct');
        const filter = document.getElementById('categoryFilter');

        let products = [];

        async function refreshProducts() {
            products = await loadProducts(filter.value);
            renderProducts(products);
        }

        function renderProducts(list) {
            productsEl.innerHTML = '';
            list.forEach(p => {
                productsEl.innerHTML += `
                    <div class="product">
                        <h3>${p.name}</h3>
                        <p>${p.details}</p>
                        <p><b>Rp${p.price}</b></p>
                        <button onclick="buyProduct('${p.id}','${p.name}',${p.price})">BUY</button>
                    </div>
                `;
            });
        }

        async function loadDone() {
            const trx = await loadTransactions('done');
            doneList.innerHTML = '';
            let total = 0;

            trx.forEach(t => {
                total += t.products.price;
                doneList.innerHTML += `
                    <div class="trx">
                        <p><b>${t.products.name}</b></p>
                        <p>Rp${t.products.price}</p>
                        <p>${new Date(t.created_at).toLocaleString()}</p>
                    </div>
                `;
            });

            document.getElementById('totalSales').innerText =
                `Total Penjualan: Rp${total}`;
            document.getElementById('totalTrx').innerText =
                `Total Transaksi: ${trx.length}`;
        }

        await refreshProducts();

        // REALTIME PRODUK
        supabase.channel('products')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                refreshProducts
            ).subscribe();

        // REALTIME TRX DONE
        supabase.channel('trx')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'transactions' },
                p => p.new.status === 'done' && loadDone()
            ).subscribe();

        search.addEventListener('input', () => {
            const f = products.filter(p =>
                p.name.toLowerCase().includes(search.value.toLowerCase())
            );
            renderProducts(f);
        });

        filter.addEventListener('change', refreshProducts);

        navProducts.onclick = e => {
            e.preventDefault();
            productsEl.style.display = 'block';
            trxDoneEl.style.display = 'none';
            statsEl.style.display = 'none';
        };

        navHistory.onclick = async e => {
            e.preventDefault();
            productsEl.style.display = 'none';
            trxDoneEl.style.display = 'block';
            statsEl.style.display = 'none';
            await loadDone();
        };

        navStats.onclick = async e => {
            e.preventDefault();
            productsEl.style.display = 'none';
            trxDoneEl.style.display = 'none';
            statsEl.style.display = 'block';
            await loadDone();
        };
    });
}

// ======================================================
// BUY + QRIS PAKASIR (TIDAK DIUBAH)
// ======================================================
async function buyProduct(productId, name, price) {
    const email = prompt('Masukkan email:');
    if (!email) return;

    const fee = 400;
    const total = price + fee;

    const { data } = await supabase.from('transactions').insert({
        product_id: productId,
        buyer_email: email,
        status: 'pending'
    }).select().single();

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
    alert(`Scan QRIS:\n${q.qr_code_url}`);

    setTimeout(async () => {
        await supabase.from('transactions')
            .update({ status: 'done' })
            .eq('id', data.id);
    }, 5000);
}

// ======================================================
// ADMIN
// ======================================================
if (location.pathname === '/admindashboard.html') {
    document.addEventListener('DOMContentLoaded', async () => {

        const form = document.getElementById('productForm');
        const list = document.getElementById('productList');

        async function loadAdmin() {
            const p = await loadProducts();
            list.innerHTML = '';
            p.forEach(i => {
                list.innerHTML += `
                    <div>
                        <b>${i.name}</b> - Rp${i.price}
                        <button onclick="deleteProduct('${i.id}')">X</button>
                    </div>
                `;
            });
        }

        await loadAdmin();

        form.onsubmit = async e => {
            e.preventDefault();
            await supabase.from('products').insert({
                name: productName.value,
                price: productPrice.value,
                details: productDetails.value,
                category: productCategory.value
            });
            form.reset();
            loadAdmin();
        };
    });
}

async function deleteProduct(id) {
    if (confirm('Hapus produk?')) {
        await supabase.from('products').delete().eq('id', id);
        location.reload();
    }
}
