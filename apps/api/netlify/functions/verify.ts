import { createClient } from "@supabase/supabase-js";

export async function handleVerify(consentUuid: string) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data, error } = await supabase
    .from("consent_records")
    .select("*, patient:patients(full_name), doctor:doctors(name), template:consent_templates(treatment_type)")
    .eq("consent_uuid", consentUuid)
    .single();
  if (error) throw error;
  return data;
}

export const handler = async (event: any) => {
  try {
    const id = event.path.split("/").pop();
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: "Missing ID" }) };
    const result = await handleVerify(id);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
