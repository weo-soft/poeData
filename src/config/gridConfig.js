/**
 * Grid configuration for stash tab visualization
 * Defines cell positions and layout for scarab display
 * Based on Scarab-tab.png image analysis
 * Image dimensions: 825 x 787 pixels
 */

// Base image dimensions (Scarab-tab.png)
export const IMAGE_DIMENSIONS = {
  width: 825,
  height: 787
};

// Default cell size (standard PoE stash cell size)
export const CELL_SIZE = {
  width: 49,
  height: 48
};

// Default padding between cells within a group
export const CELL_PADDING = 2;

/**
 * Cell group configuration
 * Defines groups of cells with their positions and types
 * Format: { x, y, count, cellWidth?, cellHeight?, padding?, type }
 * - x, y: top-left corner of the group
 * - count: number of cells in that group
 * - cellWidth (optional): override default cell width for this group
 * - cellHeight (optional): override default cell height for this group
 * - padding (optional): override default padding for this group
 * - type: scarab type identifier
 */
export const CELL_GROUP_CONFIG = [
  // Row 1 (y=24)
  { x: 151, y: 24, count: 3, type: 'titanic' }, // Titanic
  { x: 333, y: 24, count: 2, type: 'sulphite' }, // Sulphite
  { x: 517, y: 24, count: 3, type: 'divination' }, // Divination
  
  // Row 2 (y=80)
  { x: 63, y: 80, count: 3, type: 'anarchy' }, // Anarchy
  { x: 246, y: 80, count: 3, type: 'ritual' }, // Ritual
  { x: 427, y: 80, count: 3, type: 'harvest' }, // Harvest
  { x: 608, y: 80, count: 3, type: 'kalguuran' }, // Kalguuran
  
  // Row 3 (y=139)
  { x: 309, y: 139, count: 4, type: 'influencing' }, // Influencing
  
  // Row 4 (y=167)
  { x: 63, y: 167, count: 3, type: 'bestiary' }, // Bestiary
  { x: 557, y: 167, count: 4, type: 'harbinger' }, // Harbinger
  
  // Row 5 (y=196)
  { x: 309, y: 196, count: 3, type: 'betrayal' }, // Betrayal
  
  // Row 6 (y=228)
  { x: 63, y: 228, count: 4, type: 'incursion' }, // Incursion
  { x: 557, y: 228, count: 4, type: 'domination' }, // Domination
  
  // Row 7 (y=254)
  { x: 309, y: 254, count: 3, type: 'torment' }, // Torment
  
  // Row 8 (y=310)
  { x: 126, y: 310, count: 4, cellWidth: 49, padding: 4, type: 'cartography' }, // Cartography
  { x: 436, y: 310, count: 4, cellWidth: 49, padding: 4, type: 'beyond' }, // Beyond
  
  // Row 9 (y=370)
  { x: 126, y: 370, count: 5, cellWidth: 49, padding: 4, type: 'ambush' }, // Ambush
  { x: 436, y: 370, count: 5, cellWidth: 49, padding: 4, type: 'ultimatum' }, // Ultimatum
  
  // Row 10 (y=429)
  { x: 126, y: 429, count: 4, cellWidth: 49, padding: 4, type: 'expedition' }, // Expedition
  { x: 436, y: 429, count: 5, cellWidth: 49, padding: 4, type: 'delirium' }, // Delirium
  
  // Row 11 (y=486)
  { x: 126, y: 486, count: 4, cellWidth: 49, padding: 4, type: 'legion' }, // Legion
  { x: 436, y: 486, count: 4, cellWidth: 49, padding: 4, type: 'blight' }, // Blight
  
  // Row 12 (y=543)
  { x: 126, y: 543, count: 4, cellWidth: 49, padding: 4, type: 'abyss' }, // Abyss
  { x: 436, y: 543, count: 5, cellWidth: 49, padding: 4, type: 'essence' }, // Essence
  
  // Row 13 (y=604)
  { x: 255, y: 604, count: 5, cellWidth: 49, padding: 4, type: 'breach' }, // Breach
  
  // Row 14 (y=659)
  { x: 142, y: 661, count: 4, cellWidth: 50, padding: 5, type: 'misc' }, // Misc1
  { x: 435, y: 661, count: 5, cellWidth: 51, padding: 5, type: 'horned' }, // Horned1
  
  // Row 15 (y=718)
  { x: 142, y: 718, count: 4, cellWidth: 50, padding: 5, type: 'misc2' }, // Misc2
  { x: 520, y: 718, count: 2, cellWidth: 50, padding: 5, type: 'horned2' } // Horned2
];

/**
 * Explicit scarab ordering within groups
 * Maps group type to ordered array of scarab IDs (left to right)
 * If a group type is not specified, scarabs are sorted by drop weight (low to high)
 */
export const SCARAB_ORDER_CONFIG = {
  'titanic': [
    'titanic-scarab',
    'titanic-scarab-of-treasures',
    'titanic-scarab-of-legend'
  ],
  'sulphite': [
    'sulphite-scarab',
    'sulphite-scarab-of-fumes'
  ],
  'divination': [
    'divination-scarab-of-the-cloister',
    'divination-scarab-of-plenty',
    'divination-scarab-of-pilfering'
  ],
  'anarchy': [
    'anarchy-scarab',
    'anarchy-scarab-of-gigantification',
    'anarchy-scarab-of-partnership'
  ],
  'ritual': [
    'ritual-scarab-of-selectiveness',
    'ritual-scarab-of-wisps',
    'ritual-scarab-of-abundance'
  ],
  'harvest': [
    'harvest-scarab',
    'harvest-scarab-of-doubling',
    'harvest-scarab-of-cornucopia'
  ],
  'kalguuran': [
    'kalguuran-scarab',
    'kalguuran-scarab-of-guarded-riches',
    'kalguuran-scarab-of-refinement'
  ],
  'influencing': [
    'influencing-scarab-of-the-shaper',
    'influencing-scarab-of-the-elder',
    'influencing-scarab-of-hordes',
    'influencing-scarab-of-conversion'
  ],
  'bestiary': [
    'bestiary-scarab',
    'bestiary-scarab-of-the-herd',
    'bestiary-scarab-of-duplicating'
  ],
  'harbinger': [
    'harbinger-scarab',
    'harbinger-scarab-of-obelisks',
    'harbinger-scarab-of-regency',
    'harbinger-scarab-of-warhoards'
  ],
  'betrayal': [
    'betrayal-scarab',
    'betrayal-scarab-of-the-allflame',
    'betrayal-scarab-of-reinforcements'
  ],
  'incursion': [
    'incursion-scarab',
    'incursion-scarab-of-invasion',
    'incursion-scarab-of-champions',
    'incursion-scarab-of-timelines'
  ],
  'domination': [
    'domination-scarab',
    'domination-scarab-of-apparitions',
    'domination-scarab-of-evolution',
    'domination-scarab-of-terrors'
  ],
  'torment': [
    'torment-scarab',
    'torment-scarab-of-peculiarity',
    'torment-scarab-of-possession'
  ],
  'cartography': [
    'cartography-scarab-of-escalation',
    'cartography-scarab-of-risk',
    'cartography-scarab-of-corruption',
    'cartography-scarab-of-the-multitude'
  ],
  'beyond': [
    'beyond-scarab',
    'beyond-scarab-of-haemophilia',
    'beyond-scarab-of-resurgence',
    'beyond-scarab-of-the-invasion'
  ],
  'ambush': [
    'ambush-scarab',
    'ambush-scarab-of-hidden-compartments',
    'ambush-scarab-of-potency',
    'ambush-scarab-of-containment',
    'ambush-scarab-of-discernment'
  ],
  'ultimatum': [
    'ultimatum-scarab',
    'ultimatum-scarab-of-bribing',
    'ultimatum-scarab-of-dueling',
    'ultimatum-scarab-of-catalysing',
    'ultimatum-scarab-of-inscription'
  ],
  'expedition': [
    'expedition-scarab',
    'expedition-scarab-of-runefinding',
    'expedition-scarab-of-verisium-powder',
    'expedition-scarab-of-archaeology'
  ],
  'delirium': [
    'delirium-scarab',
    'delirium-scarab-of-mania',
    'delirium-scarab-of-paranoia',
    'delirium-scarab-of-neuroses',
    'delirium-scarab-of-delusions'
  ],
  'legion': [
    'legion-scarab',
    'legion-scarab-of-officers',
    'legion-scarab-of-command',
    'legion-scarab-of-eternal-conflict'
  ],
  'blight': [
    'blight-scarab',
    'blight-scarab-of-the-blightheart',
    'blight-scarab-of-blooming',
    'blight-scarab-of-invigoration'
  ],
  'abyss': [
    'abyss-scarab',
    'abyss-scarab-of-multitudes',
    'abyss-scarab-of-edifice',
    'abyss-scarab-of-profound-depth'
  ],
  'essence': [
    'essence-scarab',
    'essence-scarab-of-ascent',
    'essence-scarab-of-stability',
    'essence-scarab-of-calcification',
    'essence-scarab-of-adaptation'
  ],
  'misc': [
    'scarab-of-monstrous-lineage',
    'scarab-of-adversaries',
    'scarab-of-divinity',
    'scarab-of-hunted-traitors'
  ],
  'misc2': [
    'scarab-of-stability',
    'scarab-of-wisps',
    'scarab-of-radiant-storms',
    'scarab-of-bisection'
  ],
  'breach': [
    'breach-scarab',
    'breach-scarab-of-lordship',
    'breach-scarab-of-splintering',
    'breach-scarab-of-snares',
    'breach-scarab-of-resonant-cascade'
  ],
  'horned': [
    'horned-scarab-of-bloodlines',
    'horned-scarab-of-nemeses',
    'horned-scarab-of-preservation',
    'horned-scarab-of-awakening',
    'horned-scarab-of-tradition'
  ],
  'horned2': [
    'horned-scarab-of-glittering',
    'horned-scarab-of-pandemonium'
  ]
};

/**
 * Create cell definitions from group configuration
 * Supports per-group overrides for cell dimensions and padding
 * @returns {Array<Object>} Array of cell definitions
 */
export function createCellsFromGroups() {
  const cells = [];
  let cellId = 0;
  let globalRow = 0;
  let lastY = -1;
  
  CELL_GROUP_CONFIG.forEach((group, groupConfigIndex) => {
    // Determine row number based on Y position
    // If Y changed significantly, it's a new row
    if (lastY === -1 || Math.abs(group.y - lastY) > 10) {
      // New row detected
      if (lastY !== -1) {
        globalRow++;
      }
      lastY = group.y;
    }
    
    // Get cell dimensions and padding for this group (with fallback to defaults)
    const cellWidth = group.cellWidth ?? CELL_SIZE.width;
    const cellHeight = group.cellHeight ?? CELL_SIZE.height;
    const padding = group.padding ?? CELL_PADDING;
    
    // Create cells in this group
    let colInRow = 0;
    for (let i = 0; i < group.count; i++) {
      const cellX = group.x + i * (cellWidth + padding);
      
      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: group.y,
        width: cellWidth,
        height: cellHeight,
        row: globalRow,
        col: colInRow++,
        groupIndex: i, // Index within the group (0-based)
        groupType: group.type, // Type of scarab group (e.g., 'titanic', 'abyss')
        groupConfigIndex: groupConfigIndex // Index of the group in CELL_GROUP_CONFIG
      });
    }
  });
  
  return cells;
}

/**
 * Get cell at position
 * @param {Array<Object>} cells - Array of cell definitions
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object|null} Cell at position or null
 */
export function getCellAtPosition(cells, x, y) {
  return cells.find(cell => {
    return x >= cell.x && 
           x <= cell.x + cell.width &&
           y >= cell.y && 
           y <= cell.y + cell.height;
  }) || null;
}

/**
 * Get cell by ID
 * @param {Array<Object>} cells - Array of cell definitions
 * @param {string} cellId - Cell ID
 * @returns {Object|null} Cell or null
 */
export function getCellById(cells, cellId) {
  return cells.find(cell => cell.id === cellId) || null;
}
