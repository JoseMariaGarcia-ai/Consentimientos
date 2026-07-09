// Envío de registros de facturación a la AEAT (modalidad VERI*FACTU).
//
// ⚠️ NO CONECTADO A LA AEAT TODAVÍA. El documento de requisitos indica
// expresamente: "antes de implementar el envío a la AEAT, verificar la
// última versión de la documentación técnica en la Sede Electrónica de la
// AEAT" (esquema XSD del registro de facturación y el endpoint SOAP/REST
// vigente). Esa comprobación no se ha hecho en esta sesión — implementar
// aquí una llamada real sin haber contrastado el esquema/endpoint actuales
// generaría envíos que la AEAT rechazaría (o, peor, que pareciesen
// aceptados sin estarlo), dejando a la clínica en la creencia de que
// cumple VERI*FACTU cuando no es así.
//
// Lo que SÍ hace esta función: deja preparado el punto de integración
// (misma firma que tendría la llamada real), y registra honestamente el
// resultado como "pendiente_conexion_aeat" en invoice_records / invoice_events,
// en vez de simular un envío satisfactorio. Cuando se conecte de verdad:
// 1. Consultar el esquema XSD y el endpoint vigentes en la Sede Electrónica
//    (Sistemas informáticos de facturación VERI*FACTU).
// 2. Construir el XML del registro con ese esquema.
// 3. Sustituir el cuerpo de esta función por la llamada SOAP/REST real,
//    firmando con el certificado de la clínica o el de representante.
// 4. Mantener el reintento y el registro en invoice_events en caso de fallo.

export interface AeatSubmissionInput {
  nifEmisor: string
  invoiceNumber: string
  issueDate: string
  recordType: 'alta' | 'anulacion'
  totalAmount: number
  recordHash: string
  previousHash: string | null
}

export interface AeatSubmissionResult {
  status: 'pendiente_conexion_aeat'
  sentAt: null
  raw: { note: string }
}

export async function submitToAeat(_input: AeatSubmissionInput): Promise<AeatSubmissionResult> {
  return {
    status: 'pendiente_conexion_aeat',
    sentAt: null,
    raw: {
      note:
        'Integración con el servicio web de la AEAT no implementada todavía — ' +
        'requiere validar el esquema XSD y el endpoint vigentes en la Sede ' +
        'Electrónica antes de enviar registros reales.',
    },
  }
}
