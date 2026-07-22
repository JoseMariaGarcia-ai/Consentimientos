-- Interruptor específico para que la clínica envíe también por WhatsApp
-- (además de por email) los avisos automáticos al paciente: bienvenida,
-- consentimiento generado, cita confirmada/reprogramada, recordatorio de
-- cita y documento disponible (presupuesto/factura). Deliberadamente
-- separado de wa_ai_enabled (que solo controla el agente de respuesta
-- automática) — una clínica puede querer avisos por WhatsApp sin querer un
-- agente de IA respondiendo, o viceversa. Por defecto desactivado: cada
-- mensaje de plantilla tiene un coste real, así que es opt-in explícito.
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS wa_patient_notifications_enabled BOOLEAN NOT NULL DEFAULT false;
