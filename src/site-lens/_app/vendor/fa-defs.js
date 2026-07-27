// Stub for @fortawesome/pro-*-svg-icons. Real, statically-analyzable ESM named
// exports (Vite dev requires these — a CJS Proxy only works in the Rollup
// build). Each is a tiny descriptor the FontAwesomeIcon stub reads to pick a
// glyph. Covers every faX name used by the ported Site Lens source.
const d = (iconName) => ({iconName, __faStub: true});

export const faArrowsToDot = d('arrowstodot');
export const faCheckDouble = d('checkdouble');
export const faChevronDown = d('chevrondown');
export const faChevronLeft = d('chevronleft');
export const faChevronRight = d('chevronright');
export const faCircleCheck = d('circlecheck');
export const faCircleInfo = d('circleinfo');
export const faCog = d('cog');
export const faDownload = d('download');
export const faFilter = d('filter');
export const faListCheck = d('listcheck');
export const faMagnifyingGlassChart = d('magnifyingglasschart');
export const faMinus = d('minus');
export const faPlus = d('plus');
export const faRefresh = d('refresh');
export const faRotateLeft = d('rotateleft');
export const faSliders = d('sliders');
export const faSpinnerThird = d('spinnerthird');
export const faTrashCanXmark = d('trashcanxmark');
export const faXmark = d('xmark');
