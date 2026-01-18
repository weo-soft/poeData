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

/**
 * Category-to-tab image mapping
 * Maps category identifiers to their corresponding stash tab image files and grid configuration keys
 */
export const CATEGORY_GRID_MAPPING = {
  'breach': {
    tabImagePath: '/assets/images/stashTabs/breach-tab.png',
    gridConfigKey: 'breach',
    imageDirectory: '/assets/images/breach/' // Will need to handle both subdirectories
  },
  'legion': {
    tabImagePath: '/assets/images/stashTabs/fragments-tab.png',
    gridConfigKey: 'fragments',
    imageDirectory: '/assets/images/legion/' // Will need to handle both subdirectories
  },
  'delirium-orbs': {
    tabImagePath: '/assets/images/stashTabs/delirium-orbs-tab.png',
    gridConfigKey: 'delirium-orbs',
    imageDirectory: '/assets/images/deliriumOrbs/'
  },
  'essences': {
    tabImagePath: '/assets/images/stashTabs/essence-tab.png',
    gridConfigKey: 'essence',
    imageDirectory: '/assets/images/essences/'
  },
  'fossils': {
    tabImagePath: '/assets/images/stashTabs/fossils-tab.png',
    gridConfigKey: 'fossils',
    imageDirectory: '/assets/images/fossils/'
  },
  'oils': {
    tabImagePath: '/assets/images/stashTabs/oils-tab.png',
    gridConfigKey: 'oils',
    imageDirectory: '/assets/images/oils/'
  },
  'catalysts': {
    tabImagePath: '/assets/images/stashTabs/catalysts-tab.png',
    gridConfigKey: 'catalysts',
    imageDirectory: '/assets/images/catalysts/'
  }
};

/**
 * Get stash tab image path for a category
 * @param {string} categoryId - Category identifier
 * @returns {string|null} Image path or null if category doesn't have grid view
 */
export function getCategoryTabImage(categoryId) {
  const mapping = CATEGORY_GRID_MAPPING[categoryId];
  return mapping ? mapping.tabImagePath : null;
}

/**
 * Get image directory path for category item images
 * @param {string} categoryId - Category identifier
 * @returns {string|null} Directory path or null if category doesn't have grid view
 */
export function getCategoryImageDirectory(categoryId) {
  const mapping = CATEGORY_GRID_MAPPING[categoryId];
  return mapping ? mapping.imageDirectory : null;
}

/**
 * Get grid configuration key for a category
 * @param {string} categoryId - Category identifier
 * @returns {string|null} Grid config key or null if category doesn't have grid view
 */
export function getGridConfigKey(categoryId) {
  const mapping = CATEGORY_GRID_MAPPING[categoryId];
  return mapping ? mapping.gridConfigKey : null;
}

/**
 * Grid configuration for breach-tab.png
 * Image dimensions: 840 x 794 pixels (measured)
 * NOTE: Cell positions need to be analyzed from the actual image
 * This is a placeholder configuration - cell positions must be determined by analyzing the image
 */
export const BREACH_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/breach-tab.png',
  imageDimensions: {
    width: 840,
    height: 794
  },
  cellGroups: [
    // TODO: Analyze breach-tab.png to determine actual cell positions
    // For now, using a simple layout as placeholder
    // Actual positions should match the visual layout in the image
    { x: 100, y: 50, count: 5, type: 'breachstone' },
    { x: 100, y: 110, count: 5, type: 'splinter' }
  ],
  defaultCellSize: {
    width: 49,
    height: 48
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'breachstone': [], // Will be populated based on item data or use default sorting
    'splinter': [] // Will be populated based on item data or use default sorting
  }
};

/**
 * Grid configuration for fragments-tab.png
 * Image dimensions: 842 x 792 pixels (measured)
 * NOTE: Cell positions need to be analyzed from the actual image
 * Used by: legion-splinters, legion-emblems
 */
export const FRAGMENTS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fragments-tab.png',
  imageDimensions: {
    width: 842,
    height: 792
  },
  cellGroups: [
    // TODO: Analyze fragments-tab.png to determine actual cell positions
    // For now, using a simple layout as placeholder
    // Splinters row
    { x: 100, y: 50, count: 5, type: 'splinter' },
    // Emblems row
    { x: 100, y: 110, count: 5, type: 'emblem' }
  ],
  defaultCellSize: {
    width: 49,
    height: 48
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'splinter': [],
    'emblem': []
  }
};

/**
 * Grid configuration for delirium-orbs-tab.png
 * Image dimensions: 839 x 841 pixels (measured)
 * NOTE: Cell positions need to be analyzed from the actual image
 */
export const DELIRIUM_ORBS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/delirium-orbs-tab.png',
  imageDimensions: {
    width: 839,
    height: 841
  },
  cellGroups: [
    // Row 1: First 8 delirium orbs
    { x: 100, y: 50, count: 8, type: 'delirium-orb' },
    // Row 2: Next 8 delirium orbs (assuming ~60px row height: 50 + 60 = 110)
    { x: 100, y: 110, count: 8, type: 'delirium-orb' }
  ],
  defaultCellSize: {
    width: 49,
    height: 48
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'delirium-orb': []
  }
};

/**
 * Grid configuration for essence-tab.png
 * Image dimensions: 842 x 840 pixels (measured)
 * Essences are organized in rows, each row containing different tiers of the same essence
 * Starting from center (lowest tier) moving outwards (highest tier)
 * Cells are 63x63 pixels
 * Top right corner of first cell of top row: (493, 27)
 */
export const ESSENCE_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/essence-tab.png',
  imageDimensions: {
    width: 842,
    height: 840
  },
  cellGroups: [
    // First 4 rows: 7 members each
    // Row 0: Rightmost cell top-right: (493, 27), top-left: (430, 27)
    // Leftmost cell (7 members): (430 - 6*63) = (430 - 378) = (52, 27)
    { x: 52, y: 27, count: 7, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 52, y: 90, count: 7, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 52, y: 153, count: 7, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 52, y: 216, count: 7, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    
    // Next 4 rows: 6 members each
    // Row 4: Rightmost cell top-right: (427, 290), top-left: (364, 290)
    // Leftmost cell (6 members): (364 - 5*63) = (364 - 315) = (49, 290)
    { x: 49, y: 290, count: 6, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 49, y: 353, count: 6, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 49, y: 416, count: 6, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 49, y: 479, count: 6, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    
    // Next 4 rows: 5 members each
    // Row 8: Rightmost cell top-right: (361, 553), top-left: (298, 553)
    // Leftmost cell (5 members): (298 - 4*63) = (298 - 252) = (46, 553)
    { x: 46, y: 553, count: 5, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 46, y: 616, count: 5, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 46, y: 679, count: 5, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    { x: 46, y: 742, count: 5, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence' },
    
    // Right-expanding rows: expand from center to the right
    // First 4 rows: 4 members each, top-left at (549, 27) as specified
    // Tiers are in the same columns conceptually, but positioned to the right to avoid overlap
    { x: 549, y: 27, count: 4, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    { x: 549, y: 90, count: 4, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    { x: 549, y: 153, count: 4, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    { x: 549, y: 216, count: 4, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    
    // Next 4 rows: 3 members each
    // Moved two columns (126 pixels) further right from previous position
    // Previous: x=486, new: x=486 + 126 = 612
    { x: 612, y: 279, count: 3, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    { x: 612, y: 342, count: 3, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    { x: 612, y: 405, count: 3, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    { x: 612, y: 468, count: 3, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-right' },
    
    // Special essences: each in their own row, same column
    // Top-left corner of first row: (745, 553)
    // Order: Insanity, Horror, Delirium, Hysteria
    { x: 745, y: 553, count: 1, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-special' },
    { x: 745, y: 616, count: 1, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-special' },
    { x: 745, y: 679, count: 1, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-special' },
    { x: 745, y: 742, count: 1, cellWidth: 63, cellHeight: 63, padding: 0, type: 'essence-special' }
  ],
  defaultCellSize: {
    width: 63,
    height: 63
  },
  defaultPadding: 0,
  itemOrderConfig: {
    'essence': []
  }
};

/**
 * Grid configuration for fossils-tab.png
 * Image dimensions: 839 x 839 pixels (measured)
 * NOTE: Cell positions need to be analyzed from the actual image
 */
export const FOSSILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fossils-tab.png',
  imageDimensions: {
    width: 839,
    height: 839
  },
  cellGroups: [
    // Row 1: First 5 fossils
    { x: 100, y: 50, count: 5, type: 'fossil' },
    // Row 2: Next 5 fossils (assuming ~60px row height: 50 + 60 = 110)
    { x: 100, y: 110, count: 5, type: 'fossil' },
    // Row 3: Next 5 fossils
    { x: 100, y: 170, count: 5, type: 'fossil' },
    // Row 4: Next 5 fossils
    { x: 100, y: 230, count: 5, type: 'fossil' },
    // Row 5: Last 5 fossils
    { x: 100, y: 290, count: 5, type: 'fossil' }
  ],
  defaultCellSize: {
    width: 49,
    height: 48
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'fossil': []
  }
};

/**
 * Grid configuration for oils-tab.png
 * Image dimensions: 843 x 842 pixels (measured)
 * NOTE: Cell positions need to be analyzed from the actual image
 */
export const OILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/oils-tab.png',
  imageDimensions: {
    width: 843,
    height: 842
  },
  cellGroups: [
    // Row 1: First 8 oils
    { x: 100, y: 50, count: 8, type: 'oil' },
    // Row 2: Next 8 oils (assuming ~60px row height: 50 + 60 = 110)
    { x: 100, y: 110, count: 8, type: 'oil' }
  ],
  defaultCellSize: {
    width: 49,
    height: 48
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'oil': []
  }
};

/**
 * Grid configuration for catalysts-tab.png
 * Image dimensions: 844 x 839 pixels (measured)
 * NOTE: Cell positions need to be analyzed from the actual image
 */
export const CATALYSTS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/catalysts-tab.png',
  imageDimensions: {
    width: 844,
    height: 839
  },
  cellGroups: [
    // Row 1: First 6 catalysts
    { x: 100, y: 50, count: 6, type: 'catalyst' },
    // Row 2: Next 5 catalysts (assuming ~60px row height: 50 + 60 = 110)
    { x: 100, y: 110, count: 5, type: 'catalyst' }
  ],
  defaultCellSize: {
    width: 49,
    height: 48
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'catalyst': []
  }
};

/**
 * Map of grid config keys to their configuration objects
 */
const GRID_CONFIGS = {
  'breach': BREACH_GRID_CONFIG,
  'fragments': FRAGMENTS_GRID_CONFIG,
  'delirium-orbs': DELIRIUM_ORBS_GRID_CONFIG,
  'essence': ESSENCE_GRID_CONFIG,
  'fossils': FOSSILS_GRID_CONFIG,
  'oils': OILS_GRID_CONFIG,
  'catalysts': CATALYSTS_GRID_CONFIG
};

/**
 * Get grid configuration for a category
 * @param {string} categoryId - Category identifier
 * @returns {Object|null} Grid configuration object or null if category doesn't have grid view
 */
export function getGridConfig(categoryId) {
  const configKey = getGridConfigKey(categoryId);
  if (!configKey) {
    return null;
  }
  return GRID_CONFIGS[configKey] || null;
}

/**
 * Create cell definitions from group configuration for a specific grid config
 * Supports per-group overrides for cell dimensions and padding
 * @param {Object} gridConfig - Grid configuration object with cellGroups array
 * @returns {Array<Object>} Array of cell definitions
 */
export function createCellsFromGroupsForCategory(gridConfig) {
  if (!gridConfig || !gridConfig.cellGroups) {
    return [];
  }
  
  const cells = [];
  let cellId = 0;
  let globalRow = 0;
  let lastY = -1;
  
  const defaultCellSize = gridConfig.defaultCellSize || CELL_SIZE;
  const defaultPadding = gridConfig.defaultPadding ?? CELL_PADDING;
  
  gridConfig.cellGroups.forEach((group, groupConfigIndex) => {
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
    const cellWidth = group.cellWidth ?? defaultCellSize.width;
    const cellHeight = group.cellHeight ?? defaultCellSize.height;
    const padding = group.padding ?? defaultPadding;
    
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
        groupType: group.type, // Type of group (e.g., 'breachstone', 'essence')
        groupConfigIndex: groupConfigIndex // Index of the group in cellGroups array
      });
    }
  });
  
  return cells;
}
