import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { LEGAL_FRAMEWORKS } from "../../../web/src/i18n/legalTexts/index";

const SUPPORTED_LANGUAGE_CODES = [
  "es-ES","es-MX","es-AR","en-GB","en-US","fr-FR","de-DE",
  "pt-PT","pt-BR","it-IT","zh-CN","ar-SA","ru-RU","ja-JP",
  "ko-KR","nl-NL","pl-PL","tr-TR","sv-SE","ro-RO","no-NO",
];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildFromFramework(fw: any) {
  return {
    jurisdiction: fw.jurisdiction, applicableLaw: fw.law,
    dataProtection: fw.dataProtection, signatureValidity: fw.signatureValidity,
    minAge: fw.minAge, witnessRequired: fw.witnessRequired,
    retentionYears: fw.retentionYears, introText: fw.consentIntroText,
    rightsText: fw.withdrawalRights, dataClause: fw.dataProtection,
    footerLegal: fw.signatureValidity,
  };
}

function buildPrompt(lang: string, fw: any, body: any): string {
  return `Eres experto en derecho sanitario y medicina estetica. Traduce Y adapta legalmente este consentimiento informado. IDIOMA: ${lang} | JURISDICCION: ${fw.jurisdiction} | LEY APLICABLE: ${fw.law} | EDAD MINIMA: ${fw.minAge} anios | TESTIGO REQUERIDO: ${fw.witnessRequired ? "Si" : "No"}. CONSENTIMIENTO BASE (es-ES) - Titulo: ${body.spanishTitle} | Texto: ${body.spanishBody}. Responde SOLO JSON sin markdown con esta estructura exacta: {"title":"...","body":"...COMPLETO con TODOS los riesgos...","legalClauses":{"jurisdiction":"...","applicableLaw":"...ley real vigente...","dataProtection":"...","signatureValidity":"...","minAge":0,"witnessRequired":false,"retentionYears":0,"introText":"...en idioma del pais...","rightsText":"...","dataClause":"...","footerLegal":"..."}}`;
}

export async function handleTranslate(body: any) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const contentJson: Record<string, any> = {};
  const legalClausesJson: Record<string, any> = {};

  contentJson["es-ES"] = { title: body.spanishTitle, body: body.spanishBody };
  legalClausesJson["es-ES"] = buildFromFramework(LEGAL_FRAMEWORKS["es-ES"]);

  for (const lang of SUPPORTED_LANGUAGE_CODES.filter(c => c !== "es-ES")) {
    const fw = (LEGAL_FRAMEWORKS as any)[lang] ?? LEGAL_FRAMEWORKS["es-ES"];
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: buildPrompt(lang, fw, body) }],
      });
      const text = (response.content[0] as any).text;
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      contentJson[lang] = { title: parsed.title, body: parsed.body };
      legalClausesJson[lang] = parsed.legalClauses;
    } catch {
      contentJson[lang] = { title: body.spanishTitle, body: body.spanishBody };
      legalClausesJson[lang] = buildFromFramework(fw);
    }
  }

  if (body.templateId) {
    await supabase
      .from("consent_templates")
      .update({ content_json: contentJson, legal_clauses_json: legalClausesJson })
      .eq("id", body.templateId);
  }

  return { contentJson, legalClausesJson };
}

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await handleTranslate(body);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
