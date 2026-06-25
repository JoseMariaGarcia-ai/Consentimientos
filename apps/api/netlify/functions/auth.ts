import { createClient } from "@supabase/supabase-js";

export async function handleAuth(method: string, body: any) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  if (method === "POST" && body.action === "magic-link") {
    const { error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: body.email,
    });
    if (error) throw error;
    return { message: "Magic link sent" };
  }
  return { status: 404, body: { error: "Not found" } };
}

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await handleAuth(event.httpMethod, body);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
