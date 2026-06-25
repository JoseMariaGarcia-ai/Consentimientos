import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export async function handleConsents(method: string, path: string, body: any, userId: string) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  if (method === "GET" && path.includes("/templates")) {
    const { data, error } = await supabase.from("consent_templates").select("*").eq("clinic_id", userId).eq("is_active", true);
    if (error) throw error;
    return { status: 200, body: data };
  }
  if (method === "GET") {
    const { data, error } = await supabase.from("consent_records").select("*, patient:patients(*), doctor:doctors(*), template:consent_templates(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return { status: 200, body: data };
  }
  if (method === "POST") {
    const { data, error } = await supabase.from("consent_records").insert(body).select().single();
    if (error) throw error;
    return { status: 201, body: data };
  }
  return { status: 404, body: { error: "Not found" } };
}

export const handler: Handler = async (event) => {
  try {
    const token = event.headers.authorization?.replace("Bearer ", "");
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const result = await handleConsents(event.httpMethod, event.path, JSON.parse(event.body || "{}"), token);
    return { statusCode: result.status, body: JSON.stringify(result.body) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
