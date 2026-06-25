import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

interface SignaturePayload {
  consentId: string;
  patientId: string;
  signatureDataUrl: string;
  biometricPoints: any[];
  documentContent: string;
  language: string;
}

export async function handleSignature(body: SignaturePayload) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  const { consentId, patientId, signatureDataUrl, biometricPoints, documentContent, language } = body;

  const documentHash = createHash("sha256")
    .update(JSON.stringify({ consentId, patientId, documentContent }))
    .digest("hex");

  const serverTimestamp = new Date().toISOString();

  const { data: consent, error } = await supabase
    .from("consent_records")
    .update({
      signature_data_url: signatureDataUrl,
      biometric_json: biometricPoints,
      document_hash: documentHash,
      server_timestamp: serverTimestamp,
      status: "signed",
      signed_at: serverTimestamp,
    })
    .eq("id", consentId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    consent_id: consentId,
    log_json: {
      action: "SIGNED",
      consentId,
      documentHash,
      serverTimestamp,
      language,
      biometricPointsCount: biometricPoints.length,
    },
  });

  return consent;
}

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await handleSignature(body);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
