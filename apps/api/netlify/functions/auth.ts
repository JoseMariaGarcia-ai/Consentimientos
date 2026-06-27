import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET!;

export const handler = async (event: any) => {
  try {
    const path = event.path.replace(/.*\/auth/, "");
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    // POST /auth/magic-link
    if (method === "POST" && path.includes("magic-link")) {
      const email = body.email?.trim();
      if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Email requerido" }) };

      // Buscar o crear usuario en app_users
      let { data: user } = await supabase
        .from("app_users")
        .select("id, email, clinic_id")
        .eq("email", email)
        .single();

      if (!user) {
        const { data: newUser } = await supabase
          .from("app_users")
          .insert({ email, full_name: email, role: "clinica" })
          .select()
          .single();
        user = newUser;
      }

      if (!user) return { statusCode: 500, body: JSON.stringify({ error: "No se pudo crear el usuario" }) };

      // Generar token y guardarlo
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await supabase.from("magic_tokens").insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

      // Enviar email con Resend
      const appUrl = process.env.APP_URL ?? process.env.URL ?? "https://consentimientos.netlify.app";
      const link = `${appUrl}/auth/verify?token=${rawToken}`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "ConsentsPro <noreply@consentspro.com>",
        to: email,
        subject: "Tu enlace de acceso a ConsentsPro",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#2563eb">ConsentsPro</h2>
            <p>Haz clic en el enlace para acceder. Caduca en 15 minutos.</p>
            <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Entrar en ConsentsPro
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">Si no solicitaste este enlace, ignora este email.</p>
          </div>
        `,
      });

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // GET /auth/verify?token=xxx
    if (method === "GET" && path.includes("verify")) {
      const token = event.queryStringParameters?.token;
      if (!token) return { statusCode: 400, body: JSON.stringify({ error: "Token requerido" }) };

      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const { data: row } = await supabase
        .from("magic_tokens")
        .select("id, user_id, expires_at, used_at")
        .eq("token_hash", tokenHash)
        .single();

      if (!row) return { statusCode: 400, body: JSON.stringify({ error: "Token inválido" }) };
      if (row.used_at) return { statusCode: 400, body: JSON.stringify({ error: "Token ya usado" }) };
      if (new Date() > new Date(row.expires_at)) return { statusCode: 400, body: JSON.stringify({ error: "Token expirado" }) };

      await supabase.from("magic_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);

      const { data: user } = await supabase
        .from("app_users")
        .select("id, email, clinic_id")
        .eq("id", row.user_id)
        .single();

      if (!user) return { statusCode: 400, body: JSON.stringify({ error: "Usuario no encontrado" }) };

      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email, clinicId: user.clinic_id },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return { statusCode: 200, body: JSON.stringify({ token: jwtToken, email: user.email }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
