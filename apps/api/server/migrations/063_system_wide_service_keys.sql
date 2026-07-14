-- Simplificación del panel de Configuración → Claves: YCloud, Anthropic y
-- Retell pasan de tener una clave por clínica a una única clave de sistema
-- para todas (Anthropic ya funcionaba así en la práctica, vía la variable
-- de entorno ANTHROPIC_API_KEY — nunca se leía clinic_api_config.anthropic_api_key
-- para las llamadas reales de IA). Make API Key se retira del todo: no lo
-- consumía ningún servicio, era un campo sin uso real.
--
-- Las columnas ycloud_api_key/anthropic_api_key/retell_api_key/make_api_key
-- de clinic_api_config NO se eliminan (para no perder datos históricos ni
-- complicar el rollback) — simplemente dejan de leerse y de mostrarse en el
-- panel. Solo quedan editables por clínica: knowledge_base, prompt (WhatsApp)
-- y retell_prompt.

INSERT INTO system_settings (key, value) VALUES ('system_retell_api_key', '')
ON CONFLICT (key) DO NOTHING;
