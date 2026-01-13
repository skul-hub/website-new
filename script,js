// Placeholder: Ganti dengan Supabase URL dan Anon Key Anda
const SUPABASE_URL = 'https://xwhksbwefnsmwmomplkz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uXSNXioJWX1Y5nAoTv1uLQ_cqYXEcdp';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi umum
async function loadProducts(category = '') {
    let query = supabase.from('products').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) console.error(error);
    return data || [];
}

async function loadTransactions(status = '') {
    let query = supabase.from('transactions').select('*, products(name, price)');
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) console.error(error);
    return data || [];
}

// Dashboard User
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    document.addEventListener('DOMContentLoaded', async () => {
        const productsSection = document.getElementById('products');
        const searchInput = document.getElementById('searchProduct');
        const categorySelect = document.getElementById('categoryFilter');
        const trxDoneSection = document.getElementById('trxDone');
        const doneTransactions = document.getElementById('doneTransactions');

        // Load semua produk di awal
        let products = await loadProducts();
        renderProducts(products);

        // Pencarian produk
        searchInput.addEventListener('input', () => {
            const filtered = products.filter(p => p.name.toLowerCase().includes(searchInput.value.toLowerCase()));
            renderProducts(filtered);
        });

        // Filter kategori
        categorySelect.addEventListener('change', async () => {
            products = await loadProducts(categorySelect.value);
            renderProducts(products);
        });

        // Load TRX DONE otomatis
        const doneTrx = await loadTransactions('done');
        if (doneTrx.length > 0) {
            trxDoneSection.style.display = 'block';
            renderDoneTrx(doneTrx);
        }

        function renderProducts(prods) {
            productsSection.innerHTML = '';
            prods.forEach(p => {
                const div = document.createElement('div');
                div.className = 'product';
                div.innerHTML = `
                    <h3>${p.name}</h3>
                    <p>Harga: Rp${p.price}</p>
                    <p>${p.details}</p>
                    <button onclick="buyProduct('${p.id}', '${p.name}', ${p.price})">BUY</button>
                `;
                productsSection.appendChild(div);
            });
        }

        function renderDoneTrx(trx) {
            doneTransactions.innerHTML = '';
            trx.forEach(t => {
                const div = document.createElement('div');
                div.className = 'trx';
                div.innerHTML = `
                    <p>Produk: ${t.products.name}</p>
                    <p>Harga: Rp${t.products.price}</p>
                    <p>Tanggal: ${new Date(t.created_at).toLocaleString()}</p>
                    <p>Status: ${t.status}</p>
                `;
                doneTransactions.appendChild(div);
            });
        }
    });

    // Fungsi BUY (Diperbarui dengan slug, apikey, dan fee)
    async function buyProduct(productId, name, price) {
        const email = prompt('Masukkan email Anda:');
        if (!email) return;

        // Hitung fee: 300 + 100 = 400 (sesuaikan jika formula berbeda)
        const fee = 300 + 100; // Fee tambahan
        const totalAmount = price + fee; // Total pembayaran = harga + fee

        // Simulasi detail trx
        const trxDetails = {
            product: name,
            price: price,
            fee: fee,
            total: totalAmount,
            date: new Date().toLocaleString(),
            payment: 'Pakasir QRIS'
        };
        const confirm = confirm(`Detail TRX:\nProduk: ${trxDetails.product}\nHarga: Rp${trxDetails.price}\nFee: Rp${trxDetails.fee}\nTotal: Rp${trxDetails.total}\nTanggal: ${trxDetails.date}\nPembayaran: ${trxDetails.payment}\n\nKonfirmasi?`);
        if (!confirm) return;

        // Buat trx di Supabase
        const { data, error } = await supabase.from('transactions').insert({
            product_id: productId,
            buyer_email: email,
            status: 'pending'
        }).select().single();
        if (error) return alert('Error: ' + error.message);

        // Placeholder: Ganti dengan Slug dan Apikey asli Anda dari dashboard Pakasir
        const PAKASIR_SLUG = 'skull-hosting'; // Slug merchant/store Anda
        const PAKASIR_APIKEY = '7Fn6ugz0vDWynofsTGeRMd5VwZT12e3j'; // Apikey Anda
        const PAKASIR_ENDPOINT = `https://api.pakasir.com/${PAKASIR_SLUG}/create-qris`; // Endpoint dengan slug (sesuaikan jika berbeda)

        // Buat QRIS via Pakasir dengan total amount (harga + fee)
        const qrisResponse = await fetch(PAKASIR_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${PAKASIR_APIKEY}`, // Menggunakan apikey di header
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                amount: totalAmount, // Total dengan fee
                reference: data.id // Reference trx
            })
        });
        const qrisData = await qrisResponse.json();
        if (qrisData.qr_code_url) {
            // Update trx dengan QRIS
            await supabase.from('transactions').update({ payment_id: qrisData.payment_id, qr_code_url: qrisData.qr_code_url }).eq('id', data.id);
            alert(`QRIS dibuat! Total pembayaran: Rp${totalAmount}. Scan: ${qrisData.qr_code_url}`);
            // Simulasi: Set status ke 'done' setelah pembayaran (dalam real, gunakan webhook Pakasir)
            setTimeout(async () => {
                await supabase.from('transactions').update({ status: 'done' }).eq('id', data.id);
                location.reload(); // Reload untuk update TRX DONE
            }, 5000); // Simulasi delay
        } else {
            alert('Gagal membuat QRIS: ' + JSON.stringify(qrisData));
        }
    }
}

// Dashboard Admin
if (window.location.pathname === '/admindashboard.html') {
    document.addEventListener('DOMContentLoaded', async () => {
        const form = document.getElementById('productForm');
        const productList = document.getElementById('productList');
        const trxHistory = document.getElementById('trxHistory');
        const navLinks = document.querySelectorAll('nav a');

        // Load produk
        loadAdminProducts();

        // Navigasi
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('section').forEach(s => s.style.display = 'none');
                document.getElementById(link.getAttribute('href').substring(1)).style.display = 'block';
                if (link.getAttribute('href') === '#historyTrx') loadTrxHistory();
            });
        });

        // Tambah produk
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { data, error } = await supabase.from('products').insert({
                name: document.getElementById('productName').value,
                price: document.getElementById('productPrice').value,
                details: document.getElementById('productDetails').value,
                category: document.getElementById('productCategory').value
            });
            if (error) alert('Error: ' + error.message);
            else {
                alert('Produk ditambah!');
                form.reset();
                loadAdminProducts();
            }
        });

        async function loadAdminProducts() {
            const products = await loadProducts();
            productList.innerHTML = '';
            products.forEach(p => {
                const div = document.createElement('div');
                div.className = 'product-admin';
                div.innerHTML = `
                    <h3>${p.name}</h3>
                    <p>Rp${p.price}</p>
                    <button onclick="editProduct('${p.id}')">Edit</button>
                    <button onclick="deleteProduct('${p.id}')">Delete</button>
                `;
                productList.appendChild(div);
            });
        }

        async function loadTrxHistory() {
            const trx = await loadTransactions();
            trxHistory.innerHTML = '';
            trx.forEach(t => {
                const div = document.createElement('div');
                div.className = 'trx-admin';
                div.innerHTML = `
                    <p>Produk: ${t.products?.name || 'N/A'}</p>
                    <p>Email: ${t.buyer_email}</p>
                    <p>Status: ${t.status}</p>
                    <p>Tanggal: ${new Date(t.created_at).toLocaleString()}</p>
                `;
                trxHistory.appendChild(div);
            });
        }
    });

    // Fungsi Edit/Delete
    async function editProduct(id) {
        const newName = prompt('Nama baru:');
        if (newName) {
            await supabase.from('products').update({ name: newName }).eq('id', id);
            location.reload();
        }
    }

    async function deleteProduct(id) {
        if (confirm('Hapus produk?')) {
            await supabase.from('products').delete().eq('id', id);
            location.reload();
        }
    }
}
