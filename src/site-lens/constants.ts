/**
 * Constants for SiteVisualization components
 */

import type {IVisualizationInfo} from './types';

// Tooltip copy explaining that orphan counts are scoped to the Site Lens
// graph view (no incoming links in this graph) and may differ from Page
// Explorer, which uses the full-crawl `depth IS NULL` count.
export const ORPHAN_STATUS_TOOLTIP =
  'Orphan count is based on the visualization graph — pages with no incoming links in this view. ' +
  'It may differ from Page Explorer, which counts all crawled pages with no depth assigned.';

export const ORPHAN_BADGE_TOOLTIP =
  'Orphan count reflects pages with no incoming links in the visualization graph. ' +
  'This may differ from the orphaned pages count in Page Explorer, which is based on the full crawl.';

// =============================================================================
// COLOR CONSTANTS
// =============================================================================

// Depth-based colors for tree nodes
export const DEPTH_COLORS: Record<number, string> = {
  0: '#7F4EAD', // Root - Purple
  1: '#0BA5EC', // Depth 1 - Blue
  2: '#2AC155', // Depth 2 - Green
  3: '#F79009', // Depth 3 - Orange
  4: '#F44343', // Depth 4 - Red
  5: '#667085', // Depth 5+ - Gray
};

// Section colors for chord diagram
export const SECTION_COLORS = [
  '#7F4EAD', // purple (matching brand)
  '#2AC155', // green
  '#0BA5EC', // blue
  '#F79009', // orange
  '#F44343', // red
  '#667085', // gray
  '#2D9A8C', // teal
  '#E91E8C', // pink
  '#00CED1', // dark cyan
  '#9370DB', // medium purple
  '#FFD700', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // turquoise
  '#8B4513', // brown
];

// Topic colors for LDA diagram
export const TOPIC_COLORS = [
  '#7F56D9',
  '#2D6CDF',
  '#12B76A',
  '#F79009',
  '#F04438',
  '#06AED4',
  '#EE46BC',
  '#7A5AF8',
  '#16B364',
  '#FB6514',
];

// Health status colors
export const HEALTH_COLORS = {
  good: '#2AC155',
  warning: '#F79009',
  bad: '#F44343',
};

// =============================================================================
// GRAPH OPTIONS
// =============================================================================

/** When total graph nodes exceed this count, default max depth is 2 instead of 3 */
export const LARGE_GRAPH_NODE_THRESHOLD = 3000;
export const DEFAULT_MAX_DEPTH_LARGE_GRAPH = 2;
export const DEFAULT_MAX_DEPTH_SMALL_GRAPH = 3;

export const MAX_SCALE = 40;

export const SIZE_OPTIONS = [
  {value: 'depth', label: 'Level'},
  {value: 'issue', label: 'Open items'},
  {value: 'pageHealth', label: 'Proficiency'},
  {value: 'wordCount', label: 'Detail'},
];

export const COLOR_OPTIONS = [
  {value: 'pageHealth', label: 'Proficiency'},
  {value: 'indexable', label: 'Active / Archived'},
  {value: 'traffic', label: 'Usage'},
  {value: 'impressions', label: 'Reach'},
  {value: 'keywords', label: 'Related items'},
];

export const TREE_DIRECTION_OPTIONS = [
  {value: 'vertical', label: 'Direction: Vertical'},
  {value: 'horizontal', label: 'Direction: Horizontal'},
];

// =============================================================================
// LDA CLUSTER COLORS
// =============================================================================

export const CLUSTER_COLORS = [
  {bg: 'rgba(76, 175, 80, 0.3)', border: '#4CAF50'},
  {bg: 'rgba(244, 67, 54, 0.3)', border: '#F44336'},
  {bg: 'rgba(255, 193, 7, 0.3)', border: '#FFC107'},
  {bg: 'rgba(33, 150, 243, 0.3)', border: '#2196F3'},
  {bg: 'rgba(156, 39, 176, 0.3)', border: '#9C27B0'},
  {bg: 'rgba(255, 87, 34, 0.3)', border: '#FF5722'},
];

// =============================================================================
// STOP WORDS
// =============================================================================

export const STOP_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'https', 'www', 'com', 'null', 'undefined', 'freepik', 'html', 'htm',
];

// =============================================================================
// METRIC CONFIGURATIONS
// =============================================================================

export const METRICS = [
  {
    key: 'traffic',
    label: 'Usage',
    tooltip: 'How often I reach for this in real work',
    format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString(),
  },
  {
    key: 'impressions',
    label: 'Reach',
    tooltip: 'How broadly this shows up across my projects',
    format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString(),
  },
  {
    key: 'keywords',
    label: 'Related items',
    tooltip: 'How many related entries connect to this',
    format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString(),
  },
  {
    key: 'pageHealth',
    label: 'Proficiency',
    tooltip: 'How strong / polished this is (0–1000)',
    format: (v: number) => Math.round(v).toString(),
  },
];

// =============================================================================
// VISUALIZATION INFO
// =============================================================================

export const VISUALIZATION_INFO: Record<string, IVisualizationInfo> = {
  '3d-crawl-diagram': {
    title: '3D Crawl Diagram',
    description: 'An immersive three-dimensional visualization of your site architecture, allowing spatial exploration of page relationships.',
    whatItShows: [
      'Each sphere represents a page on your website',
      'Sphere size is uniform across all pages (use the global size slider to scale every sphere together)',
      'Sphere color represents depth level from the homepage',
      'Connecting lines show internal link relationships',
      'Spatial clustering reveals content structure in 3D space',
      'The homepage (gold sphere) is typically positioned at the center',
    ],
    howToUse: [
      'Left-click and drag to rotate the 3D view',
      'Right-click and drag to pan',
      'Scroll to zoom in and out',
      'Click a node to view detailed page information',
      'The graph auto-rotates slowly - interaction pauses rotation',
      'Use depth filters to focus on specific levels of your site',
      'Search for specific URLs to highlight them in the visualization',
    ],
    howCalculated: [
      'Uses the same crawl data as the 2D view but rendered in 3D space',
      '3D force simulation positions nodes in x, y, and z dimensions',
      'Repulsion forces prevent node overlap in all three axes',
      'Link forces pull connected pages together',
      'WebGL rendering via Three.js enables smooth 3D interaction',
    ],
    keyInsights: [
      'The 3D view can reveal clusters hidden in 2D projections',
      'Vertical spread often corresponds to site hierarchy depth',
      'Isolated nodes floating away from the main cluster need attention',
      'Dense regions indicate areas of high internal linking',
      'Use this view to get a holistic sense of your site\'s structure',
    ],
  },
  'node-cluster-diagram': {
    title: '2D Node Cluster',
    description: 'A force-directed graph showing your site\'s page structure as interconnected nodes in a 2D plane.',
    whatItShows: [
      'Each node represents a page on your website',
      'Node size indicates the selected metric (traffic, impressions, keywords, etc.)',
      'Node color represents the depth level from the homepage (0 = homepage, 1 = first level, etc.)',
      'Lines (edges) show internal links between pages',
      'Clustered nodes indicate closely related or heavily interlinked content',
      'Blue rings highlight hub nodes (depth 0-1) or other emphasized pages',
      'Red rings indicate pages flagged as prunable (low traffic/health)',
    ],
    howToUse: [
      'Scroll to zoom in and out of the visualization',
      'Click and drag to pan around the graph',
      'Click a node to see detailed page information in the tooltip',
      'Use the search bar to find and highlight specific URLs',
      'Adjust "Size by" dropdown to change what metric determines node size',
      'Use "Filter Pages" to show only specific sections of your site',
      'Toggle "Show Prunables" to highlight low-performing pages',
    ],
    howCalculated: [
      'Pages are discovered by crawling your site starting from the homepage',
      'Depth is calculated as the minimum number of clicks from the homepage',
      'Force simulation uses D3.js to position nodes - linked pages attract, unlinked repel',
      'Link strength is uniform, creating natural clusters based on link density',
      'Node positions stabilize after the force simulation reaches equilibrium',
    ],
    keyInsights: [
      'Orphan pages (isolated nodes with no incoming links in this graph view) may need better internal linking for SEO — note this count is scoped to the visualization, not the full crawl',
      'Large, dense clusters indicate content silos - consider cross-linking',
      'Pages far from the center may be hard for users and search engines to discover',
      'Hub nodes (blue rings) are your most connected pages - ensure they link to important content',
      'Red-ringed prunable pages should be reviewed for consolidation or improvement',
    ],
  },
  'tree-diagram': {
    title: 'Tree Diagram',
    description: 'A hierarchical tree visualization showing the parent-child relationships between pages based on URL structure.',
    whatItShows: [
      'Hierarchical structure of your website based on URL paths',
      'Parent-child relationships between sections and pages',
      'Node colors indicate depth level in the hierarchy',
      'Expandable/collapsible nodes for exploring sections',
      'Page count badges show the size of each section',
    ],
    howToUse: [
      'Click on nodes to expand or collapse their children',
      'Use depth buttons to show/hide specific depth levels',
      'Hover over nodes to see page details',
      'Click depth buttons to toggle visibility of that level',
      'Scroll to zoom, drag to pan the view',
    ],
    howCalculated: [
      'URL paths are parsed to determine hierarchy (e.g., /blog/post-1 is child of /blog)',
      'Each unique URL segment creates a node in the tree',
      'Depth is determined by the number of path segments',
      'Tree layout uses D3.js hierarchical positioning algorithm',
    ],
    keyInsights: [
      'Deep pages (many levels down) may have poor SEO visibility',
      'Wide sections with many children might benefit from subcategorization',
      'Orphaned branches disconnected from main navigation need review',
      'Balanced trees generally perform better for both users and SEO',
      'Consider flattening overly deep hierarchies',
    ],
  },
  'crawl-tree': {
    title: 'Crawl Tree',
    description: 'A D3-based collapsible tree showing the actual crawl path and link structure of your site.',
    whatItShows: [
      'The actual path a crawler takes through your site',
      'Internal link relationships as parent-child connections',
      'Node colors indicate crawl depth (clicks from homepage)',
      'Expandable branches for exploring site sections',
      'Red indicators highlight pages flagged as prunable',
    ],
    howToUse: [
      'Click depth buttons to toggle specific depth levels on/off',
      'Hover over nodes to see detailed page metrics',
      'Click nodes to open the actual page URL',
      'Use Reset View to return to the initial position',
      'Drag to pan, scroll to zoom the visualization',
      'The tree flows left-to-right, scroll right and down to explore',
    ],
    howCalculated: [
      'Based on actual crawl data following internal links',
      'Depth represents minimum clicks required from homepage',
      'Links are discovered by parsing anchor tags on each page',
      'Tree structure reflects the crawl order and link discovery',
    ],
    keyInsights: [
      'Pages requiring many clicks from homepage may rank poorly',
      'Identify important pages that are buried too deep',
      'Find sections with weak internal linking',
      'Discover unexpected crawl paths that differ from intended navigation',
      'Use to optimize your site\'s link architecture',
    ],
  },
  'lda-topics': {
    title: 'LDA Topic Analysis',
    description: 'Latent Dirichlet Allocation (LDA) topic modeling reveals the main themes and topics across your website content.',
    whatItShows: [
      'Discovered topics as circles (bubbles) in the visualization',
      'Topic size indicates prevalence across your content',
      'Topic distance shows semantic relationships between topics',
      'Word clouds display the most important terms per topic',
      'Topic relevance scores for individual pages',
    ],
    howToUse: [
      'Click on topic bubbles to see their top words',
      'Use the slider to adjust term relevance weighting',
      'Hover over terms to see their distribution across topics',
      'Switch between bubble view and pyLDAvis interface',
      'Click topics to see which pages belong to each theme',
    ],
    howCalculated: [
      'Page content is tokenized and preprocessed (stopwords removed, stemming)',
      'LDA algorithm discovers latent topics from word co-occurrence patterns',
      'Each topic is a probability distribution over words',
      'Each page has a probability distribution over topics',
      't-SNE or PCA reduces topic vectors to 2D for visualization',
    ],
    keyInsights: [
      'Topics reveal what your site is "about" from a content perspective',
      'Overlapping topics may indicate duplicate or redundant content',
      'Isolated topics might be underlinked from main content areas',
      'Missing expected topics suggest content gaps',
      'Use topic analysis to inform content strategy and organization',
    ],
  },
  'link-flow-diagram': {
    title: 'Link Flow Diagram',
    description: 'A chord diagram visualizing the distribution of internal links between different sections of your website.',
    whatItShows: [
      'Sections of your site as segments around the circle',
      'Ribbons connecting sections show link flow between them',
      'Ribbon thickness indicates the volume of links',
      'Section size reflects the total links to/from that section',
      'Color coding helps distinguish different site sections',
    ],
    howToUse: [
      'Hover over a section to highlight its connections',
      'Hover over ribbons to see exact link counts',
      'Thicker ribbons indicate stronger linking relationships',
      'Look for missing connections between related sections',
      'Click sections to filter the view',
    ],
    howCalculated: [
      'Internal links are categorized by source and target URL sections',
      'Link counts are aggregated by top-level URL paths',
      'Chord layout algorithm positions sections to minimize ribbon crossings',
      'Bidirectional links are shown as ribbons connecting both ways',
    ],
    keyInsights: [
      'Sections with thin or no ribbons may be siloed',
      'Identify opportunities to cross-link related content',
      'Detect if important sections receive enough internal links',
      'Find over-linked sections that might dilute link equity',
      'Balance link distribution across your site\'s main sections',
    ],
  },
};
