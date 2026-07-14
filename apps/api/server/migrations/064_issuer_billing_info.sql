-- Datos fiscales de ConsentsPro como emisor de sus propias facturas de
-- suscripción, configurados a mano en el propio sistema en vez de leerse en
-- vivo de la API de Stripe. Sustituye a la llamada a GET /v1/account
-- (Stripe no garantiza tener siempre nombre/dirección correctos ni permite
-- leer el NIF/CIF real por API) — así el superadmin controla exactamente
-- lo que sale en la factura desde Configuración → Claves.

INSERT INTO system_settings (key, value) VALUES
  ('consentspro_issuer_legal_name', ''),
  ('consentspro_issuer_address', '')
ON CONFLICT (key) DO NOTHING;
-- consentspro_issuer_tax_id ya existía desde la migración 062.
