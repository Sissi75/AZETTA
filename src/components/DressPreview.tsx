export type PreviewProps = {
  color: string;
  length: 'knee' | 'long';
  sleeves: 'none' | 'half' | 'long';
  /** Couleur de chaque décoration choisie ; absent = aucune décoration à cet endroit */
  deco: { col?: string; bas?: string; manches?: string; ceinture?: string };
  label: string;
};

const INK = '#1B1F2A';

/** Aperçu schématique : il illustre les choix (couleur, longueur, manches, décorations), sans prétendre reproduire la robe. */
export default function DressPreview({ color, length, sleeves, deco, label }: PreviewProps) {
  const hemY = length === 'knee' ? 230 : 300;
  const hemL = length === 'knee' ? 56 : 46;
  const hemR = 200 - hemL;
  const leftEdge = (y: number) => 72 + (hemL - 72) * ((y - 130) / (hemY - 130));
  const bandY = hemY - 12;
  const bandX = leftEdge(bandY);

  const sleevePath = sleeves === 'half' ? 'M70 52 L36 80 L46 100 L72 82 Z' : 'M70 52 L26 124 L40 136 L74 86 Z';
  const cuff = sleeves === 'half' ? { x1: 36, y1: 80, x2: 46, y2: 100 } : { x1: 26, y1: 124, x2: 40, y2: 136 };

  const sleeve = (
    <g>
      <path d={sleevePath} fill={color} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      {deco.manches && <line x1={cuff.x1} y1={cuff.y1} x2={cuff.x2} y2={cuff.y2} stroke={deco.manches} strokeWidth="6" strokeLinecap="round" />}
    </g>
  );

  return (
    <svg viewBox="0 0 200 320" role="img" aria-label={label} className="mx-auto h-auto w-full max-w-xs">
      {sleeves !== 'none' && (
        <>
          {sleeve}
          <g transform="translate(200,0) scale(-1,1)">{sleeve}</g>
        </>
      )}
      <polygon points={`72,130 128,130 ${hemR},${hemY} ${hemL},${hemY}`} fill={color} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M70 50 Q100 62 130 50 L128 132 L72 132 Z" fill={color} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      {deco.bas && <polygon points={`${bandX},${bandY} ${200 - bandX},${bandY} ${hemR},${hemY} ${hemL},${hemY}`} fill={deco.bas} />}
      {deco.col && <path d="M84 52 Q100 76 116 52" fill="none" stroke={deco.col} strokeWidth="5" strokeLinecap="round" />}
      <rect x="70" y="122" width="60" height="14" rx="2" fill={color} stroke={INK} strokeWidth="1.5" />
      <rect x="70" y="122" width="60" height="14" rx="2" fill={INK} fillOpacity="0.25" />
      {deco.ceinture && <line x1="73" y1="129" x2="127" y2="129" stroke={deco.ceinture} strokeWidth="3" strokeDasharray="5 3" />}
    </svg>
  );
}
