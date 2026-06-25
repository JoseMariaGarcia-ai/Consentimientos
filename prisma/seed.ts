import { PrismaClient } from "@prisma/client";
import { CONSENT_TEMPLATES } from "../packages/consent-templates/src/index";

const prisma = new PrismaClient();

const DEMO_CLINIC_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_DOCTOR_ID = "00000000-0000-0000-0000-000000000002";

async function main() {
  console.log("Seeding demo clinic and admin doctor...");

  // Demo clinic (idempotent)
  await (prisma as any).clinic.upsert({
    where: { id: DEMO_CLINIC_ID },
    update: {},
    create: {
      id: DEMO_CLINIC_ID,
      name: "Clínica ConsentsPro Demo",
      address: "Calle Mayor 1, 28001 Madrid",
      phone: "+34 91 000 0000",
      email: "demo@consentspro.es",
      taxId: "B00000001",
    },
  });

  // Admin doctor
  await (prisma as any).doctor.upsert({
    where: { id: DEMO_DOCTOR_ID },
    update: {},
    create: {
      id: DEMO_DOCTOR_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Dr. Admin Demo",
      specialty: "Medicina Estética",
      licenseNumber: "28000001",
      email: "admin@consentspro.es",
      role: "admin",
    },
  });

  console.log("✓ Demo clinic and admin doctor seeded.");
  console.log("Seeding consent templates...");

  for (const tmpl of CONSENT_TEMPLATES) {
    const spanishTitle = `Consentimiento Informado — ${tmpl.treatment}`;
    const spanishBody = `Este documento informa al paciente sobre el procedimiento de ${tmpl.treatment}.\n\nRiesgos principales: ${tmpl.risks}.\n\nEl paciente declara haber sido informado de los riesgos, beneficios y alternativas del tratamiento propuesto.`;

    await prisma.consentTemplate.upsert({
      where: { id: tmpl.code } as any,
      update: {},
      create: {
        treatmentType: tmpl.treatment,
        contentJson: {
          "es-ES": { title: spanishTitle, body: spanishBody },
        },
        legalClausesJson: {
          "es-ES": {
            jurisdiction: "España",
            applicableLaw: "Ley 41/2002, de 14 de noviembre",
            dataProtection: "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018",
            signatureValidity: "Reglamento eIDAS (UE) 910/2014",
            minAge: 16,
            witnessRequired: false,
            retentionYears: 5,
            introText: "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa sobre el procedimiento propuesto.",
            rightsText: "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del procedimiento.",
            dataClause: "Sus datos serán tratados conforme al RGPD con finalidad exclusiva de gestionar su historia clínica.",
            footerLegal: "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según eIDAS (UE) 910/2014.",
          },
        },
      },
    });
  }

  console.log(`✓ Seeded ${CONSENT_TEMPLATES.length} consent templates.`);
  console.log("\n✅ Seed completo. Credenciales demo:");
  console.log("   Clínica: Clínica ConsentsPro Demo");
  console.log("   Email admin: admin@consentspro.es");
  console.log("   (Autenticación vía Magic Link — Supabase Auth)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
