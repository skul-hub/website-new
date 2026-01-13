export default async function handler(req, res) {
  const { amount, trx_id, product } = req.body;

  const response = await fetch("https://api.pakasir.com/qris", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAKASIR_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      description: product,
      reference_id: trx_id
    })
  });

  const data = await response.json();
  res.json(data);
}
