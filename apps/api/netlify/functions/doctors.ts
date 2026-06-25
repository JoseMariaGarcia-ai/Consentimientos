import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export async function handleDoctors(method: string, path: string, body: any, userId: string) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  if (method === "GET") {
    const { data, error } = await supabase.from("doctors").select("*").eq("clinic_id", userId);
    if (error) throw error;
    return { status: 200, body: data };
  }
  if (method === "POST") {
    const { data, error } = await supabase.from("doctors").insert({ ...body, clinic_id: userId }).select().single();
    if (error) throw error;
    return { status: 201, body: data };
  }
  if (method === "PUT") {
    const id = path.split("/").pop();
    const { data, error } = await supabase.from("doctors").update(body).eq("id", id).select().single();
    if (error) throw error;
    return { status: 200, body: data };
  }
  if (method === "DELETE") {
    const id = path.split("/").pop();
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) throw error;
    return { status: 204, body: null };
  }
  return { status: 404, body: { error: "Not found" } };
}

export const handler: Handler = async (event) => {
  try {
    const token = event.headers.authorization?.replace("Bearer ", "");
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const result = await handleDoctors(event.httpMethod, event.path, JSON.parse(event.body || "{}"), token);
    return { statusCode: result.status, body: JSON.stringify(result.body) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
