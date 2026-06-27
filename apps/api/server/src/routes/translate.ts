import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { queryOne, query } from '../lib/db'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Idiomas soportados (sin es-ES que es el origen)
const TARGET_LANGUAGES = [
  { code: 'en-US', name: 'English' }, { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' }, { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-PT', name: 'Português' }, { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'nl-NL', name: 'Nederlands' }, { code: 'pl-PL', name: 'Polski' },
  { code: 'ru-RU', name: 'Русский' }, { code: 'ar-SA', name: 'العربية' },
  { code: 'zh-CN', name: '中文 (简体)' }, { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' }, { code: 'tr-TR', name: 'Türkçe' },
  { code: 'ro-RO', name: 'Română' }, { code: 'sv-SE', name: 'Svenska' },
  { code: 'da-DK', name: 'Dansk' }, { code: 'fi-FI', name: 'Suomi' },
  { code: 'el-GR', name: 'Ελληνικά' }, { code: 'cs-CZ', name: 'Čeština' },
  { code: 'hu-HU', name: 'Magyar' }, { code: 'ca-ES', name: 'Català' },
  { code: 'uk-UA', name: 'Українська' }, { code: 'he-IL', name: 'עברית' },
  { code: 'hi-IN', name: 'हिन्दी' }, { code: 'vi-VN', name: 'Tiếng Việt' },
]

router.post('/', async (req, res) => {
  const { templateId } = req.body
  try {
    const template = await queryOne<{ id: string; content_json: any }>(
      'SELECT id, content_json FROM consent_templates WHERE id = $1', [templateId]
    )
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' })

    const source = template.content_json['es-ES']
    if (!source) return res.status(400).json({ error: 'Sin contenido en es-ES' })

    const updated = { ...template.content_json }

    for (const lang of TARGET_LANGUAGES) {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Translate this medical informed consent from Spanish to ${lang.name}. Preserve all HTML tags exactly. Return only valid JSON with keys "title" (string) and "body" (string with HTML).\n\nTitle: ${source.title}\n\nBody: ${source.body}`,
        }],
      })
      const text = (msg.content[0] as any).text as string
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try { updated[lang.code] = JSON.parse(match[0]) } catch { /* skip bad parse */ }
      }
    }

    await query(
      'UPDATE consent_templates SET content_json = $1 WHERE id = $2',
      [JSON.stringify(updated), templateId]
    )
    return res.json({ ok: true, languages: TARGET_LANGUAGES.length })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
