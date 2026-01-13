import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {

  if (req.method === "GET") {
    const { data, error } = await supabase.from("products").select("*");
    if (error) return res.status(500).json(error);
    return res.json(data);
  }

  if (req.method === "POST") {
    const { name, price, description, category } = req.body;

    const { error } = await supabase.from("products").insert([
      { name, price, description, category }
    ]);

    if (error) return res.status(500).json(error);
    return res.json({ success: true });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json(error);
    return res.json({ success: true });
  }

  res.status(405).end();
}
