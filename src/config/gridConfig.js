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
 * Format: { x, y, count, cellWidth?, cellHeight?, padding?, type, layout? }
 * - x, y: top-left corner of the group
 * - count: number of cells in that group
 * - cellWidth (optional): override default cell width for this group
 * - cellHeight (optional): override default cell height for this group
 * - padding (optional): override default padding for this group
 * - type: scarab type identifier
 * - layout (optional): 'horizontal' (default) or 'vertical' — direction cells are laid out within the group
 */
export const CELL_GROUP_CONFIG = [
  // Row 1 (y=24)
  { x: 52, y: 20, count: 5, cellWidth: 49, padding: 4, type: 'cartography' }, // Cartography
  { x: 373, y: 20, count: 4, type: 'influencing' }, // Influencing

  { x: 52, y: 80, count: 3, type: 'divination' }, // Divination
  { x: 373, y: 80, count: 3, type: 'titanic' }, // Titanic

  { x: 52, y: 147, count: 4, type: 'bestiary' }, // Bestiary
  { x: 373, y: 147, count: 5, cellWidth: 49, padding: 4, type: 'abyss' }, // Abyss

  { x: 52, y: 210, count: 4, type: 'betrayal' }, // Betrayal
  { x: 373, y: 210, count: 4, cellWidth: 49, padding: 4, type: 'blight' }, // Blight

  { x: 53, y: 270, count: 4, type: 'incursion' }, // Incursion
  { x: 373, y: 270, count: 6, cellWidth: 49, padding: 4, type: 'breach' }, // Breach

  { x: 53, y: 336, count: 3, type: 'sulphite' }, // Sulphite
  { x: 373, y: 336, count: 5, cellWidth: 49, padding: 4, type: 'delirium' }, // Delirium

  { x: 53, y: 398, count: 5, cellWidth: 49, padding: 4, type: 'ambush' }, // Ambush
  { x: 373, y: 398, count: 5, cellWidth: 49, padding: 4, type: 'expedition' }, // Expedition

  // Row 2 (y=80)
  { x: 53, y: 460, count: 4, type: 'anarchy' }, // Anarchy
  { x: 373, y: 460, count: 3, type: 'harvest' }, // Harvest

  { x: 53, y: 523, count: 5, cellWidth: 49, padding: 4, type: 'beyond' }, // Beyond
  { x: 373, y: 523, count: 4, type: 'kalguuran' }, // Kalguuran

  { x: 53, y: 583, count: 4, type: 'domination' }, // Domination
  { x: 373, y: 583, count: 5, cellWidth: 49, padding: 4, type: 'legion' }, // Legion

  { x: 53, y: 646, count: 5, cellWidth: 49, padding: 4, type: 'essence' }, // Essence
  { x: 373, y: 646, count: 4, type: 'ritual' }, // Ritual

  { x: 53, y: 709, count: 4, type: 'torment' }, // Torment
  { x: 373, y: 709, count: 5, cellWidth: 49, padding: 4, type: 'ultimatum' }, // Ultimatum

  // Row 14–15: vertical groups (misc and horned columns)
  { x: 695, y: 178, count: 8, cellWidth: 50, padding: 5, type: 'misc', layout: 'vertical' }, // Misc column
  { x: 755, y: 203, count: 7, cellWidth: 51, padding: 5, type: 'horned', layout: 'vertical' }, // Horned column
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
    'sulphite-scarab-of-greed',
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
    'anarchy-scarab-of-partnership',
    'anarchy-scarab-of-the-exceptional'
  ],
  'ritual': [
    'ritual-scarab-of-selectiveness',
    'ritual-scarab-of-wisps',
    'ritual-scarab-of-abundance',
    'ritual-scarab-of-corpses'
  ],
  'harvest': [
    'harvest-scarab',
    'harvest-scarab-of-doubling',
    'harvest-scarab-of-cornucopia'
  ],
  'kalguuran': [
    'kalguuran-scarab',
    'kalguuran-scarab-of-guarded-riches',
    'kalguuran-scarab-of-refinement',
    'kalguuran-scarab-of-enriching'
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
    'bestiary-scarab-of-duplicating',
    'bestiary-scarab-of-shadowed-crow'
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
    'betrayal-scarab-of-reinforcements',
    'betrayal-scarab-of-unbreaking'
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
    'torment-scarab-of-possession',
    'torment-scarab-of-release'
  ],
  'cartography': [
    'cartography-scarab-of-escalation',
    'cartography-scarab-of-risk',
    'cartography-scarab-of-the-multitude',
    'cartography-scarab-of-corruption',
    'cartography-scarab-of-singularity'
  ],
  'beyond': [
    'beyond-scarab',
    'beyond-scarab-of-haemophilia',
    'beyond-scarab-of-resurgence',
    'beyond-scarab-of-the-invasion',
    'beyond-scarab-of-corruption'
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
    'expedition-scarab-of-infusion',
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
    'legion-scarab-of-treasures',
    'legion-scarab-of-eternal-conflict',
    'legion-scarab-of-sekhema',
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
    'abyss-scarab-of-decending',
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
    'scarab-of-the-dextral',
    'scarab-of-the-sinistral',
    'scarab-of-wisps',
    'scarab-of-radiant-storms',
    'scarab-of-stability'
  ],
  'breach': [
    'breach-scarab-of-the-hive',
    'breach-scarab-of-instability',
    'breach-scarab-of-the-marshal',
    'breach-scarab-of-the-incensed-swarm',
    'breach-scarab-of-resonant-cascade',
    'breach-scarab-of-the-dreamer'
  ],
  'horned': [
    'horned-scarab-of-bloodlines',
    'horned-scarab-of-nemeses',
    'horned-scarab-of-preservation',
    'horned-scarab-of-awakening',
    'horned-scarab-of-tradition',
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
    const layout = group.layout ?? 'horizontal';

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
      const cellX = layout === 'vertical'
        ? group.x
        : group.x + i * (cellWidth + padding);
      const cellY = layout === 'vertical'
        ? group.y + i * (cellHeight + padding)
        : group.y;
      const cellRow = layout === 'vertical' ? globalRow + i : globalRow;
      const cellCol = layout === 'vertical' ? 0 : colInRow++;

      const orderForType = SCARAB_ORDER_CONFIG[group.type];
      const scarabId = orderForType && orderForType[i] ? orderForType[i] : null;

      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        row: cellRow,
        col: cellCol,
        groupIndex: i, // Index within the group (0-based)
        groupType: group.type, // Type of scarab group (e.g., 'titanic', 'abyss')
        groupConfigIndex: groupConfigIndex, // Index of the group in CELL_GROUP_CONFIG
        scarabId // Scarab ID from SCARAB_ORDER_CONFIG for icon loading (no JSON dependency)
      });
    }

    // For vertical groups, advance lastY to the bottom of the column so next group gets correct row
    if (layout === 'vertical') {
      lastY = group.y + (group.count - 1) * (cellHeight + padding) + cellHeight;
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
  },
  'scarabs': {
    tabImagePath: '/assets/images/stashTabs/scarab-tab.png',
    gridConfigKey: 'scarab', // scarab layout uses CELL_GROUP_CONFIG, not GRID_CONFIGS
    imageDirectory: '/assets/images/scarabs/'
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
 * Cell positions based on measured coordinates from the image
 */
export const BREACH_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/breach-tab.png',
  imageDimensions: {
    width: 840,
    height: 794
  },
  cellGroups: [
    // Row 1 (Top row) - 5 cells (currently unused)
    { x: 207, y: 203, count: 1 },
    { x: 299, y: 203, count: 1 },
    { x: 390, y: 203, count: 1 },
    { x: 480, y: 203, count: 1 },
    { x: 571, y: 203, count: 1 },

    // Row 2 - Breach Splinters (order: Xoph, Tul, Esh, Uul-Netol, Chayula)
    { x: 207, y: 295, count: 1, type: 'splinter' },
    { x: 299, y: 295, count: 1, type: 'splinter' },
    { x: 390, y: 295, count: 1, type: 'splinter' },
    { x: 480, y: 295, count: 1, type: 'splinter' },
    { x: 571, y: 295, count: 1, type: 'splinter' },

    // Row 3 - Breachstones (order: Xoph, Tul, Esh, Uul-Netol, Chayula)
    { x: 207, y: 386, count: 1, type: 'breachstone' },
    { x: 299, y: 386, count: 1, type: 'breachstone' },
    { x: 390, y: 386, count: 1, type: 'breachstone' },
    { x: 480, y: 386, count: 1, type: 'breachstone' },
    { x: 571, y: 386, count: 1, type: 'breachstone' },

    // Row 4 (Bottom row) - 5 cells (currently unused)
    { x: 207, y: 477, count: 1 },
    { x: 299, y: 477, count: 1 },
    { x: 390, y: 477, count: 1 },
    { x: 480, y: 477, count: 1 },
    { x: 571, y: 477, count: 1 }
  ],
  defaultCellSize: {
    width: 60,
    height: 60
  },
  defaultPadding: 0,
  itemOrderConfig: {
    'splinter': [
      'splinter-of-xoph',
      'splinter-of-tul',
      'splinter-of-esh',
      'splinter-of-uul-netol',
      'splinter-of-chayula'
    ],
    'breachstone': [
      'xoph-s-breachstone',
      'tul-s-breachstone',
      'esh-s-breachstone',
      'uul-netol-s-breachstone',
      'chayula-s-breachstone'
    ],
    'breach': [] // For rows 1 and 4 if needed
  }
};

/**
 * Grid configuration for fragments-tab.png
 * Image dimensions: 842 x 792 pixels (measured)
 * Cell positions based on measured coordinates from the image
 * Used by: legion-splinters, legion-emblems
 */
export const FRAGMENTS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fragments-tab.png',
  imageDimensions: {
    width: 842,
    height: 792
  },
  cellGroups: [
    // Row 1 - 8 cells
    { x: 98, y: 39, count: 1 },
    { x: 175, y: 39, count: 1 },
    { x: 262, y: 39, count: 1 },
    { x: 345, y: 39, count: 1 },
    { x: 432, y: 39, count: 1 },
    { x: 513, y: 39, count: 1 },
    { x: 603, y: 39, count: 1 },
    { x: 680, y: 39, count: 1 },

    // Row 2 - 8 cells
    { x: 98, y: 118, count: 1 },
    { x: 175, y: 118, count: 1 },
    { x: 262, y: 118, count: 1 },
    { x: 345, y: 118, count: 1 },
    { x: 432, y: 118, count: 1 },
    { x: 515, y: 118, count: 1 },
    { x: 603, y: 118, count: 1 },
    { x: 680, y: 118, count: 1 },

    // Row 3 - 7 cells (Legion Splinters starting from second cell)
    { x: 130, y: 202, count: 1 },
    { x: 230, y: 202, count: 1, type: 'splinter' },
    { x: 310, y: 202, count: 1, type: 'splinter' },
    { x: 390, y: 202, count: 1, type: 'splinter' },
    { x: 473, y: 202, count: 1, type: 'splinter' },
    { x: 553, y: 202, count: 1, type: 'splinter' },
    { x: 650, y: 202, count: 1},

    // Row 4 - 7 cells (Emblems starting from second cell)
    { x: 130, y: 280, count: 1 },
    { x: 230, y: 280, count: 1, type: 'emblem' },
    { x: 310, y: 280, count: 1, type: 'emblem' },
    { x: 390, y: 280, count: 1, type: 'emblem' },
    { x: 473, y: 280, count: 1, type: 'emblem' },
    { x: 553, y: 280, count: 1, type: 'emblem' },
    { x: 650, y: 280, count: 1},

    // Row 5 - 6 cells
    { x: 130, y: 360, count: 1 },
    { x: 230, y: 360, count: 1 },
    { x: 310, y: 360, count: 1 },
    { x: 390, y: 360, count: 1 },
    { x: 473, y: 360, count: 1 },
    { x: 553, y: 360, count: 1 },

    // Row 6 - 5 cells (grouped)
    { x: 130, y: 447, count: 1 },
    { x: 285, y: 447, count: 1 },
    { x: 390, y: 447, count: 1 },
    { x: 495, y: 447, count: 1 },
    { x: 650, y: 447, count: 1 },

    // Row 7 - 6 cells (grouped)
    { x: 130, y: 530, count: 1 },
    { x: 215, y: 530, count: 1 },
    { x: 350, y: 530, count: 1 },
    { x: 430, y: 530, count: 1 },
    { x: 570, y: 530, count: 1 },
    { x: 650, y: 530, count: 1 },

    // Row 8 - 6 cells (grouped)
    { x: 130, y: 612, count: 1 },
    { x: 215, y: 612, count: 1 },
    { x: 350, y: 612, count: 1 },
    { x: 430, y: 612, count: 1 },
    { x: 570, y: 612, count: 1 },
    { x: 650, y: 612, count: 1 },

    // Bottom Row 9 - 10 cells (empty fragment slots)
    { x: 22, y: 700, count: 1 },
    { x: 105, y: 700, count: 1 },
    { x: 185, y: 700, count: 1 },
    { x: 265, y: 700, count: 1 },
    { x: 350, y: 700, count: 1 },
    { x: 430, y: 700, count: 1 },
    { x: 515, y: 700, count: 1 },
    { x: 595, y: 700, count: 1 },
    { x: 675, y: 700, count: 1 },
    { x: 755, y: 700, count: 1 }
  ],
  defaultCellSize: {
    width: 60,
    height: 60
  },
  defaultPadding: 0,
  itemOrderConfig: {
    'legion': [],
    'splinter': [],
    'emblem': []
  }
};

/**
 * Grid configuration for delirium-orbs-tab.png
 * Image dimensions: 839 x 841 pixels (measured)
 * Cell positions based on measured coordinates from the image
 */
export const DELIRIUM_ORBS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/delirium-orbs-tab.png',
  imageDimensions: {
    width: 839,
    height: 841
  },
  cellGroups: [
    // Top Row (4 cells)
    { x: 53, y: 40, count: 1, type: 'delirium-orb' },
    { x: 728, y: 40, count: 1, type: 'delirium-orb' },

    // Upper Left Block (3 × 3 = 9 cells)
    // Row 1
    { x: 53, y: 128, count: 1, type: 'delirium-orb' },
    { x: 145, y: 128, count: 1, type: 'delirium-orb' },
    //{ x: 270, y: 128, count: 1, type: 'delirium-orb' },
    // Row 2
    { x: 53, y: 220, count: 1, type: 'delirium-orb' },
    { x: 145, y: 220, count: 1, type: 'delirium-orb' },
    { x: 237, y: 220, count: 1, type: 'delirium-orb' },
    // Row 3
    { x: 53, y: 312, count: 1, type: 'delirium-orb' },
    { x: 145, y: 312, count: 1, type: 'delirium-orb' },
    { x: 237, y: 312, count: 1, type: 'delirium-orb' },

    // Upper Right Block (3 × 3 = 9 cells)
    // Row 1
    { x: 636, y: 130, count: 1, type: 'delirium-orb' },
    { x: 725, y: 130, count: 1, type: 'delirium-orb' },
    //{ x: 784, y: 155, count: 1, type: 'delirium-orb' },
    // Row 2
    { x: 545, y: 220, count: 1, type: 'delirium-orb' },
    { x: 636, y: 220, count: 1, type: 'delirium-orb' },
    { x: 725, y: 220, count: 1, type: 'delirium-orb' },
    // Row 3
    { x: 545, y: 313, count: 1, type: 'delirium-orb' },
    { x: 637, y: 313, count: 1, type: 'delirium-orb' },
    { x: 725, y: 313, count: 1, type: 'delirium-orb' },

    // Middle 
    { x: 276, y: 62, count: 1, type: 'delirium-orb' },
    { x: 503, y: 62, count: 1, type: 'delirium-orb' },
    { x: 390, y: 130, count: 1, type: 'delirium-orb' },
    { x: 390, y: 220, count: 1, type: 'delirium-orb' },
    { x: 390, y: 313, count: 1, type: 'delirium-orb' },
    { x: 390, y: 410, count: 1, type: 'delirium-orb' },

    // Bottom Storage Grid (12 × 5 = 60 cells)
    // Row 1
    { x: 50, y: 512, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Row 2 
    { x: 50, y: 575, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Row 3 
    { x: 50, y: 639, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Row 4 
    { x: 50, y: 701, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Row 5 
    { x: 50, y: 765, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
  ],
  defaultCellSize: {
    width: 61,
    height: 61
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'delirium-orb': [
      'fine-delirium-orb',
      'primal-delirium-orb',
      'singular-delirium-orb',
      'cartographers-delirium-orb',
      'skittering-delirium-orb',
      'armoursmiths-delirium-orb',
      'thaumaturges-delirium-orb',
      'jewellers-delirium-orb',
      'foreboding-delirium-orb',
      'whispering-delirium-orb',
      'fossilised-delirium-orb',
      'timeless-delirium-orb',
      'blacksmiths-delirium-orb',
      'abyssal-delirium-orb',
      'obscured-delirium-orb',
      'fragmented-delirium-orb',
      'diviners-delirium-orb',
      'blighted-delirium-orb',
    ]
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
    { x: 34, y: 29, count: 7, padding: 5, type: 'essence' },
    { x: 35, y: 94, count: 7, padding: 5, type: 'essence' },
    { x: 34, y: 159, count: 7, padding: 5, type: 'essence' },
    { x: 34, y: 225, count: 7, padding: 5, type: 'essence' },

    // Next 4 rows: 6 members each
    // Row 4: Rightmost cell top-right: (427, 290), top-left: (364, 290)
    // Leftmost cell (6 members): (364 - 5*63) = (364 - 315) = (49, 290)
    { x: 34, y: 290, count: 6, padding: 5, type: 'essence' },
    { x: 34, y: 358, count: 6, padding: 5, type: 'essence' },
    { x: 34, y: 423, count: 6, padding: 5, type: 'essence' },
    { x: 34, y: 489, count: 6, padding: 5, type: 'essence' },

    // Next 4 rows: 5 members each
    // Row 8: Rightmost cell top-right: (361, 553), top-left: (298, 553)
    // Leftmost cell (5 members): (298 - 4*63) = (298 - 252) = (46, 553)
    { x: 34, y: 553, count: 5, padding: 5, type: 'essence' },
    { x: 34, y: 619, count: 5, padding: 5, type: 'essence' },
    { x: 34, y: 685, count: 5, padding: 5, type: 'essence' },
    { x: 34, y: 755, count: 5, padding: 5, type: 'essence' },

    // Right-expanding rows: expand from center to the right
    // First 4 rows: 4 members each, top-left at (549, 27) as specified
    // Tiers are in the same columns conceptually, but positioned to the right to avoid overlap
    { x: 549, y: 29, count: 4, padding: 5, type: 'essence-right' },
    { x: 549, y: 94, count: 4, padding: 5, type: 'essence-right' },
    { x: 549, y: 159, count: 4, padding: 5, type: 'essence-right' },
    { x: 549, y: 225, count: 4, padding: 5, type: 'essence-right' },

    // Next 4 rows: 3 members each
    // Moved two columns (126 pixels) further right from previous position
    // Previous: x=486, new: x=486 + 126 = 612
    { x: 612, y: 291, count: 3, padding: 5, type: 'essence-right' },
    { x: 614, y: 358, count: 3, padding: 5, type: 'essence-right' },
    { x: 614, y: 423, count: 3, padding: 5, type: 'essence-right' },
    { x: 614, y: 489, count: 3, padding: 5, type: 'essence-right' },

    // Special essences: each in their own row, same column
    // Top-left corner of first row: (745, 553)
    // Order: Insanity, Horror, Delirium, Hysteria
    { x: 745, y: 553, count: 1, padding: 0, type: 'essence-special' },
    { x: 745, y: 619, count: 1, padding: 0, type: 'essence-special' },
    { x: 745, y: 685, count: 1, padding: 0, type: 'essence-special' },
    { x: 745, y: 755, count: 1, padding: 0, type: 'essence-special' }
  ],
  defaultCellSize: {
    width: 61,
    height: 60
  },
  defaultPadding: 0,
  itemOrderConfig: {
    'essence': []
  }
};

/**
 * Grid configuration for fossils-tab.png
 * Image dimensions: 839 x 839 pixels (measured)
 * Cell positions based on measured coordinates from the image
 */
export const FOSSILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fossils-tab.png',
  imageDimensions: {
    width: 839,
    height: 839
  },
  cellGroups: [
    // Top Row - 7 cells
    { x: 124, y: 67, count: 1, type: 'fossil' },
    { x: 212, y: 67, count: 1, type: 'fossil' },
    { x: 300, y: 67, count: 1, type: 'fossil' },
    { x: 388, y: 67, count: 1, type: 'fossil' },
    { x: 476, y: 67, count: 1, type: 'fossil' },
    { x: 565, y: 65, count: 1, type: 'fossil' },
    { x: 652, y: 64, count: 1, type: 'fossil' },

    // Second Row - 9 cells
    { x: 34, y: 155, count: 1, type: 'fossil' },
    { x: 124, y: 155, count: 1, type: 'fossil' },
    { x: 212, y: 155, count: 1, type: 'fossil' },
    { x: 299, y: 155, count: 1, type: 'fossil' },
    { x: 386, y: 155, count: 1, type: 'fossil' },
    { x: 475, y: 155, count: 1, type: 'fossil' },
    { x: 563, y: 155, count: 1, type: 'fossil' },
    { x: 652, y: 155, count: 1, type: 'fossil' },
    { x: 742, y: 155, count: 1, type: 'fossil' },

    // Third Row - 7 cells
    { x: 78, y: 244, count: 1, type: 'fossil' },
    { x: 167, y: 244, count: 1, type: 'fossil' },
    { x: 300, y: 244, count: 1, type: 'fossil' },
    { x: 387, y: 244, count: 1, type: 'fossil' },
    { x: 474, y: 244, count: 1, type: 'fossil' },
    { x: 610, y: 244, count: 1, type: 'fossil' },
    { x: 698, y: 244, count: 1, type: 'fossil' },

    // Fourth Row - 2 side cells only
    { x: 124, y: 332, count: 1, cellWidth: 62, cellHeight: 62, type: 'fossil' },
    { x: 654, y: 332, count: 1, cellWidth: 62, cellHeight: 62, type: 'fossil' },
  ],
  defaultCellSize: {
    width: 65,
    height: 65
  },
  defaultPadding: 0,
  itemOrderConfig: {
    'fossil': [
      // First row (7 cells): Jagged, Dense, Frigid, Aberrant, Scorched, Metallic, Pristine
      'jagged-fossil',
      'dense-fossil',
      'frigid-fossil',
      'aberrant-fossil',
      'scorched-fossil',
      'metallic-fossil',
      'pristine-fossil',
      // Second row (9 cells): Bound, Corroded, Opulent, Prismatic, Deft, Aetheric, Lucent, Serrated, Shuddering
      'bound-fossil',
      'corroded-fossil',
      'opulent-fossil',
      'prismatic-fossil',
      'deft-fossil',
      'aetheric-fossil',
      'lucent-fossil',
      'serrated-fossil',
      'shuddering-fossil',
      // Third row (7 cells): tangled, Bloodstained, gilded, fundamental, sanctified, Hollow, Fractured
      'tangled-fossil',
      'bloodstained-fossil',
      'gilded-fossil',
      'fundamental-fossil',
      'sanctified-fossil',
      'hollow-fossil',
      'fractured-fossil',
      // Fourth row (2 cells): Glyphic, Faceted
      'glyphic-fossil',
      'faceted-fossil'
    ]
  }
};

/**
 * Grid configuration for oils-tab.png
 * Image dimensions: 843 x 842 pixels (measured)
 * Cell positions based on measured coordinates from the image
 * Each cell is 80x80 pixels
 */
export const OILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/oils-tab.png',
  imageDimensions: {
    width: 843,
    height: 842
  },
  cellGroups: [
    // Row 1 - 8 cells
    { x: 45, y: 40, count: 1, type: 'oil' },
    { x: 128, y: 40, count: 1, type: 'oil' },
    { x: 210, y: 40, count: 1, type: 'oil' },
    { x: 292, y: 40, count: 1, type: 'oil' },
    { x: 374, y: 40, count: 1, type: 'oil' },
    { x: 456, y: 40, count: 1, type: 'oil' },
    { x: 538, y: 40, count: 1, type: 'oil' },
    { x: 657, y: 40, count: 1, type: 'oil' },

    // Row 2 - 8 cells
    { x: 86, y: 115, count: 1, type: 'oil' },
    { x: 170, y: 115, count: 1, type: 'oil' },
    { x: 252, y: 115, count: 1, type: 'oil' },
    { x: 335, y: 115, count: 1, type: 'oil' },
    { x: 420, y: 115, count: 1, type: 'oil' },
    { x: 505, y: 115, count: 1, type: 'oil' },
    { x: 658, y: 115, count: 1, type: 'oil' },
    { x: 748, y: 115, count: 1, type: 'oil' },

    // Bottom Storage Grid - Row 1 (12 cells)
    { x: 49, y: 500, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 2 (12 cells)
    { x: 49, y: 565, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 3 (12 cells)
    { x: 49, y: 630, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 4 (12 cells)
    { x: 49, y: 690, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 5 (12 cells)
    { x: 49, y: 755, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 }

  ],
  defaultCellSize: {
    width: 51,
    height: 51
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'oil': [
      // Cells 0-6: Tier 1-7 oils (ascending)
      'clear-oil',      // Cell 0 - tier 1
      'sepia-oil',      // Cell 1 - tier 2
      'amber-oil',      // Cell 2 - tier 3
      'verdant-oil',    // Cell 3 - tier 4
      'teal-oil',       // Cell 4 - tier 5
      'azure-oil',      // Cell 5 - tier 6
      'indigo-oil',     // Cell 6 - tier 7
      // Cell 7: Tainted Oil
      'tainted-oil',    // Cell 7
      // Cells 8-13: Tier 8-13 oils (ascending)
      'violet-oil',     // Cell 8 - tier 8
      'crimson-oil',    // Cell 9 - tier 9
      'black-oil',      // Cell 10 - tier 10
      'opalescent-oil', // Cell 11 - tier 11
      'silver-oil',     // Cell 12 - tier 12
      'golden-oil',     // Cell 13 - tier 13
      // Cell 14: Reflective Oil
      'reflective-oil', // Cell 14
      // Cell 15: Prismatic Oil
      'prismatic-oil'  // Cell 15
    ]
  }
};

/**
 * Grid configuration for catalysts-tab.png
 * Image dimensions: 844 x 839 pixels (measured)
 * Cell positions based on measured coordinates from the image
 */
export const CATALYSTS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/catalysts-tab.png',
  imageDimensions: {
    width: 844,
    height: 839
  },
  cellGroups: [
    // Top Symbol Slots
    // Topmost Slot (1 cell)
    { x: 391, y: 48, count: 1, type: 'catalyst' },

    // Second Row (4 cells)
    { x: 257, y: 135, count: 1, type: 'catalyst' },
    { x: 346, y: 135, count: 1, type: 'catalyst' },
    { x: 434, y: 135, count: 1, type: 'catalyst' },
    { x: 522, y: 135, count: 1, type: 'catalyst' },

    // Third Row (6 cells)
    { x: 97, y: 230, count: 1, type: 'catalyst' },
    { x: 185, y: 230, count: 1, type: 'catalyst' },
    { x: 272, y: 230, count: 1, type: 'catalyst' },
    { x: 508, y: 230, count: 1, type: 'catalyst' },
    { x: 593, y: 230, count: 1, type: 'catalyst' },
    { x: 680, y: 230, count: 1, type: 'catalyst' },

    // Bottom Storage Grid - Row 1 (12 cells)
    { x: 50, y: 494, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 2 (12 cells)
    { x: 50, y: 555, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 3 (12 cells)
    { x: 50, y: 621, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 4 (12 cells)
    { x: 50, y: 682, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Bottom Storage Grid - Row 5 (12 cells)
    { x: 50, y: 748, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    // Central Vertical Slot
    { x: 365, y: 230, cellHeight: 230, cellWidth: 110, count: 1 },
  ],
  defaultCellSize: {
    width: 60,
    height: 60
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'catalyst': [
      'tainted-catalyst',
      'abrasive-catalyst',
      'tempering-catalyst',
      'fertile-catalyst',
      'accelerating-catalyst',
      'unstable-catalyst',
      'turbulent-catalyst',
      'imbued-catalyst',
      'prismatic-catalyst',
      'intrinsic-catalyst',
      'noxious-catalyst',
    ]
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
 * Supports per-group overrides for cell dimensions and padding.
 * Set group.expectIconFromOrder = false for generic storage cells (no default icon from order config).
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
    const layout = group.layout ?? 'horizontal';

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

    // Order config: expected item ID per cell for icon loading (no JSON dependency)
    // Set expectIconFromOrder: false on groups that are generic storage (no default icon per slot)
    const orderConfig = gridConfig.itemOrderConfig || {};
    const orderForType = orderConfig[group.type];
    const useOrderForIcon = group.expectIconFromOrder !== false;

    // Create cells in this group
    let colInRow = 0;
    for (let i = 0; i < group.count; i++) {
      const cellX = layout === 'vertical'
        ? group.x
        : group.x + i * (cellWidth + padding);
      const cellY = layout === 'vertical'
        ? group.y + i * (cellHeight + padding)
        : group.y;
      const cellRow = layout === 'vertical' ? globalRow + i : globalRow;
      const cellCol = layout === 'vertical' ? 0 : colInRow++;
      const expectedItemId = useOrderForIcon && orderForType && orderForType[i] ? orderForType[i] : null;

      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        row: cellRow,
        col: cellCol,
        groupIndex: i, // Index within the group (0-based)
        groupType: group.type, // Type of group (e.g., 'breachstone', 'essence')
        groupConfigIndex: groupConfigIndex, // Index of the group in cellGroups array
        expectedItemId // Item ID from itemOrderConfig for icon from assets (same name as id)
      });
    }

    // For vertical groups, advance lastY to the bottom of the column so next group gets correct row
    if (layout === 'vertical') {
      lastY = group.y + (group.count - 1) * (cellHeight + padding) + cellHeight;
    }
  });

  return cells;
}
