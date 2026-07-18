# Declaración Responsable — Sistema Informático de Facturación (VERI\*FACTU)

> **Plantilla, no documento final.** El Reglamento (RD 1007/2023) y la Orden
> HAC/1177/2024 (Cap. IV) no exigen autorización previa de la AEAT, sino que
> el fabricante del software autocertifique el cumplimiento mediante esta
> declaración, conservándola para poder presentarla ante una inspección. Los
> campos marcados como `[PENDIENTE — ...]` requieren datos legales reales de
> ConsentsPro (CIF, representante legal, firma) que Claude Code no puede
> rellenar por sí mismo — deben completarse manualmente antes de que este
> documento tenga valor probatorio. Hasta entonces, no debe presentarse como
> declaración firmada.

## 1. Identificación del fabricante

- Razón social: `[PENDIENTE — razón social exacta, p.ej. "ConsentsPro SaaS S.L."]`
- CIF: `[PENDIENTE]`
- Domicilio social: `[PENDIENTE]`
- Contacto: `[PENDIENTE — email/teléfono de contacto para la AEAT]`

## 2. Identificación del sistema informático de facturación (SIF)

- Nombre del producto: ConsentsPro — Módulo de Facturación VeriFactu
- Versión declarada: `1.0.0`
- Fecha de esta versión: 2026-07-18
- Modalidad de funcionamiento: **VERI\*FACTU** (comunicación inmediata de
  cada registro de facturación a la AEAT en el momento de su generación, sin
  necesidad de que el obligado tributario remita después el Suministro
  Inmediato de Información).

## 3. Declaración de cumplimiento

El fabricante identificado en el punto 1 declara, bajo su responsabilidad,
que el sistema informático descrito en el punto 2 cumple con lo dispuesto en
el Reglamento aprobado por el Real Decreto 1007/2023, de 5 de diciembre, y en
la Orden HAC/1177/2024, de 17 de octubre, en particular:

- **Integridad**: cada registro de facturación se genera con un hash
  SHA-256 encadenado al registro inmediatamente anterior de la misma
  clínica, de forma que cualquier alteración posterior de un registro rompe
  la cadena y es detectable (ver `apps/api/server/src/lib/invoiceHash.ts` y
  el endpoint de verificación `GET /api/invoices/integrity/check`).
- **Trazabilidad**: cada alta y anulación queda registrada en
  `invoice_events`, incluyendo el resultado del intento de comunicación a la
  AEAT.
- **Inalterabilidad**: las facturas emitidas no se editan ni se borran; una
  factura solo puede anularse mediante un nuevo registro encadenado de tipo
  `anulacion`, nunca modificando ni eliminando el original.
- **Comunicación VERI\*FACTU**: cada registro de alta o anulación se
  comunica a la AEAT de forma inmediata en el momento de su generación, a
  través del certificado digital propio de cada clínica (ver
  `apps/api/server/src/lib/aeatSubmission.ts` para el estado de esta
  integración en el momento de cada versión).
- **No intervención**: el sistema no permite generar, modificar ni
  eliminar registros de facturación fuera de los procedimientos descritos,
  ni ejecutar macros o código externo sobre los datos de facturación.

## 4. Firma

- Representante legal: `[PENDIENTE — nombre completo]`
- Cargo: `[PENDIENTE]`
- Fecha de firma: `[PENDIENTE]`
- Firma: `[PENDIENTE]`

## 5. Histórico de versiones

Cada versión con cambios funcionales relevantes en el módulo de facturación
debe añadir una fila aquí y actualizar el punto 2 con la nueva versión y
fecha — nunca sobrescribir ni borrar versiones anteriores.

| Versión | Fecha      | Cambios funcionales relevantes                                                    |
|---------|------------|-------------------------------------------------------------------------------------|
| 1.0.0   | 2026-07-18 | Versión inicial: hash encadenado, QR, certificado digital por clínica, `AEAT_MODE` test/producción. Envío real a la AEAT todavía pendiente de conexión (ver `aeatSubmission.ts`). |

## 6. Dónde debe conservarse

Este documento debe conservarse y ser accesible por el equipo de ConsentsPro
para poder presentarlo ante cualquier inspección de la AEAT. Se recomienda
además publicarlo en un lugar accesible del software o su documentación
pública una vez completados los campos pendientes.
