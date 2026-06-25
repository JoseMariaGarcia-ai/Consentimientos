import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export async function handleClinic(method: string, body: any, clinicId: string) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  if (method === "GET") {
    const { data, error } = await supabase.from("clinics").select("*").eq("id", clinicId).single();
    if (error) throw error;
    return { status: 200, body: data };
  }
  if (method === "PUT") {
    const { data, error } = await supabase.from("clinics").update(body).eq("id", clinicId).select().single();
    if (error) throw error;
    return { status: 200, body: data };
  }
  return { status: 404, body: { error: "Not found" } };
}

export const handler: Handler = async (event) => {
  try {
    const token = event.headers.authorization?.replace("Bearer ", "");
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const result = await handleClinic(event.httpMethod, JSON.parse(event.body || "{}"), token);
    return { statusCode: result.status, body: JSON.stringify(result.body) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
