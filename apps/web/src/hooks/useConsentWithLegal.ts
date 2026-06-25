import { useMemo } from "react";
import { useLanguageStore } from "@/store/languageStore";
import { LEGAL_FRAMEWORKS } from "@/i18n/legalTexts";

interface ConsentTemplate {
  contentJson: Record<string, { title: string; body: string }>;
  legalClausesJson: Record<string, any>;
}

export function useConsentWithLegal(template: ConsentTemplate) {
  const { currentLanguage } = useLanguageStore();

  return useMemo(() => {
    const content =
      template.contentJson[currentLanguage] ??
      template.contentJson[currentLanguage.split("-")[0]] ??
      template.contentJson["es-ES"];

    const legalClauses =
      template.legalClausesJson?.[currentLanguage] ??
      template.legalClausesJson?.[currentLanguage.split("-")[0]] ??
      template.legalClausesJson?.["es-ES"];

    const framework =
      LEGAL_FRAMEWORKS[currentLanguage] ??
      LEGAL_FRAMEWORKS["es-ES"];

    return {
      title: content?.title ?? "",
      body: content?.body ?? "",
      jurisdiction: legalClauses?.jurisdiction ?? framework.jurisdiction,
      applicableLaw: legalClauses?.applicableLaw ?? framework.law,
      dataProtection: legalClauses?.dataProtection ?? framework.dataProtection,
      signatureValidity: legalClauses?.signatureValidity ?? framework.signatureValidity,
      minAge: legalClauses?.minAge ?? framework.minAge,
      witnessRequired: legalClauses?.witnessRequired ?? framework.witnessRequired,
      retentionYears: legalClauses?.retentionYears ?? framework.retentionYears,
      introText: legalClauses?.introText ?? framework.consentIntroText,
      rightsText: legalClauses?.rightsText ?? framework.withdrawalRights,
      dataClause: legalClauses?.dataClause ?? framework.dataProtection,
      footerLegal: legalClauses?.footerLegal ?? framework.signatureValidity,
      language: currentLanguage,
      generatedAt: new Date().toISOString(),
    };
  }, [template, currentLanguage]);
}
