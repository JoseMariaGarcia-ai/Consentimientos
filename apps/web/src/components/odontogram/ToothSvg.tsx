import type { OdontogramTooth, ToothFaceName } from '@consentspro/shared-types'
import { FACE_CONDITION_COLOR, TOOTH_STATUS_BADGE } from './toothMeta'

interface Props {
  tooth: OdontogramTooth
  size?: number
  changed?: boolean
  onFaceClick?: (face: ToothFaceName) => void
  onToothClick?: () => void
}

// Diente representado como un cuadrado dividido en 5 zonas clicables: 4
// triángulos (formados por las diagonales del cuadrado, división exacta sin
// huecos) para vestibular/lingual-palatina/mesial/distal, más un círculo
// central superpuesto para oclusal/incisal. Simplificación deliberada: la
// orientación mesial/distal es fija (izquierda=mesial, derecha=distal) en
// vez de reflejarse según el lado de la arcada — suficiente para marcar y
// visualizar el estado de cada cara, aunque no sea anatómicamente exacta.
export function ToothSvg({ tooth, size = 44, changed, onFaceClick, onToothClick }: Props) {
  const isAbsent = tooth.status === 'ausente' || tooth.status === 'extraido'
  const badge = TOOTH_STATUS_BADGE[tooth.status]

  const faceFill = (face: ToothFaceName) =>
    isAbsent ? '#CBD5E1' : FACE_CONDITION_COLOR[tooth.faces[face]?.condition ?? 'sana']

  const handleFaceClick = (face: ToothFaceName) => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAbsent) onFaceClick?.(face)
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        width={size} height={size} viewBox="0 0 60 60"
        onClick={() => onToothClick?.()}
        onContextMenu={e => { e.preventDefault(); onToothClick?.() }}
        className="cursor-pointer"
      >
        <rect x={1} y={1} width={58} height={58}
          fill="none" stroke={changed ? '#F59E0B' : '#94A3B8'} strokeWidth={changed ? 3 : 1} rx={4} />
        <polygon points="0,0 60,0 30,30" fill={faceFill('vestibular')} stroke="#94A3B8" strokeWidth={0.5}
          onClick={handleFaceClick('vestibular')} />
        <polygon points="60,0 60,60 30,30" fill={faceFill('distal')} stroke="#94A3B8" strokeWidth={0.5}
          onClick={handleFaceClick('distal')} />
        <polygon points="60,60 0,60 30,30" fill={faceFill('lingual_palatina')} stroke="#94A3B8" strokeWidth={0.5}
          onClick={handleFaceClick('lingual_palatina')} />
        <polygon points="0,60 0,0 30,30" fill={faceFill('mesial')} stroke="#94A3B8" strokeWidth={0.5}
          onClick={handleFaceClick('mesial')} />
        <circle cx={30} cy={30} r={10} fill={faceFill('oclusal_incisal')} stroke="#94A3B8" strokeWidth={0.5}
          onClick={handleFaceClick('oclusal_incisal')} />
        {badge && (
          <>
            <circle cx={50} cy={10} r={9} fill={badge.color} stroke="#fff" strokeWidth={1.5} />
            <text x={50} y={13} fontSize={8} fontWeight="bold" fill="#fff" textAnchor="middle">{badge.text}</text>
          </>
        )}
        {isAbsent && <line x1={4} y1={4} x2={56} y2={56} stroke="#64748B" strokeWidth={2} />}
      </svg>
      <span
        onClick={() => onToothClick?.()}
        className="text-[10px] font-semibold text-slate-500 cursor-pointer hover:text-blue-600"
      >
        {tooth.number}
      </span>
    </div>
  )
}
