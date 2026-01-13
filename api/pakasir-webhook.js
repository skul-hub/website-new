import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { reference_id, status } = req.body;

  if (status !== "PAID") return res.end();

  const { data } = await supabase
    .from("transactions")
    .update({
      status: "PAID",
      paid_at: new Date()
    })
    .eq("id", reference_id)
    .select()
    .single();

  // Telegram notif
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `
🧾 PEMBAYARAN MASUK
Produk: ${data.product_name}
Harga: Rp ${data.price}
Username: ${data.username}
Email: ${data.email}
        `
      })
    }
  );

  res.end();
}
