// Stub for @fortawesome/react-fontawesome's FontAwesomeIcon. Renders a small
// unicode/text glyph based on the stubbed icon descriptor's name (from
// fa-defs.cjs), passing through className / style / onClick so layout and
// interactions in the ported Site Lens UI keep working without FA Pro.
const GLYPHS = {
  xmark: '✕',
  chevrondown: '▾',
  chevronleft: '‹',
  chevronright: '›',
  plus: '+',
  minus: '−',
  filter: '≡',
  sliders: '≡',
  cog: '⚙',
  download: '⤓',
  refresh: '↻',
  rotateleft: '↺',
  circleinfo: 'ⓘ',
  circlecheck: '✓',
  checkdouble: '✓',
  listcheck: '≣',
  magnifyingglasschart: '⌕',
  arrowstodot: '⌖',
  spinnerthird: '◌',
  trashcanxmark: '✗',
};

export function FontAwesomeIcon({ icon, className = '', style, onClick, spin, ...rest }) {
  const name = icon && icon.iconName ? String(icon.iconName).toLowerCase() : '';
  const glyph = GLYPHS[name] ?? '•';
  return (
    <span
      className={className}
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {glyph}
    </span>
  );
}

export default { FontAwesomeIcon };
