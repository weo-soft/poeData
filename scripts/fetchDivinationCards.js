import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://www.poewiki.net/wiki/List_of_divination_cards';
const OUTPUT_JSON = path.join(__dirname, '../public/data/divinationCards/divinationCards.json');

/**
 * Convert a string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} Kebab-case string
 */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Extract number from text (e.g., "_10_" -> 10)
 * @param {string} text - Text containing number
 * @returns {number} Extracted number
 */
function extractNumber(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Convert wiki description HTML to formatted explicitModifiers text
 * Handles items, gems, corrupted, fractured, etc.
 * @param {string} descriptionHtml - HTML from the description column
 * @returns {string} Formatted text with proper tags
 */
function formatDescription(descriptionHtml) {
  if (!descriptionHtml) return '';
  
  const $ = cheerio.load(descriptionHtml);
  
  // Remove images
  $('img').remove();
  
  // Process links to identify unique items
  $('a').each((i, link) => {
    const $link = $(link);
    const href = $link.attr('href') || '';
    const text = $link.text().trim();
    
    if (href.includes('/wiki/') && text) {
      // Check for unique items (usually have "The" prefix or specific patterns)
      if (text.match(/^The [A-Z]/) || text.match(/^[A-Z][a-z]+'s [A-Z]/) || 
          text.match(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z]/)) {
        $link.replaceWith(`<uniqueitem>{${text}}`);
      } else {
        // For other links, just keep the text (remove the link wrapper)
        $link.replaceWith(text);
      }
    } else if (text) {
      // Links without href, just keep text
      $link.replaceWith(text);
    }
  });
  
  // Get the text content - try to preserve structure
  // First, get all text nodes in order
  let text = '';
  
  // Process all nodes to get text in order
  const walkNodes = (node) => {
    if (node.type === 'text') {
      const nodeText = node.data.trim();
      if (nodeText) {
        text += nodeText + ' ';
      }
    } else if (node.type === 'tag') {
      const $elem = $(node);
      // Skip images
      if (node.name === 'img') {
        return;
      }
      // For links, get the text
      if (node.name === 'a') {
        const linkText = $elem.text().trim();
        if (linkText) {
          text += linkText + ' ';
        }
      } else {
        // For other elements, process children
        $elem.contents().each((i, child) => {
          walkNodes(child);
        });
      }
    }
  };
  
  $('body').contents().each((i, node) => {
    walkNodes(node);
  });
  
  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  // Clean up the text
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Add newlines before common patterns to separate different parts
  text = text
    .replace(/\s+(Level \d+)/g, '\n$1')
    .replace(/\s+(Quality:)/g, '\n$1')
    .replace(/\s+(Item Level:)/g, '\n$1')
    .replace(/\s+(\[Corrupted\])/gi, '\n$1')
    .replace(/\s+(\[Fractured\])/gi, '\n$1')
    .replace(/\s+(Corrupted)(?=\s|$)/gi, '\n$1')
    .replace(/\s+(Fractured)(?=\s|$)/gi, '\n$1')
    .replace(/\s+(Synthesised)(?=\s|$)/gi, '\n$1')
    .replace(/\s+(Three-Implicit)(?=\s|$)/gi, '\n$1')
    .trim();
  
  // Split into lines for processing
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    
    // Skip if already formatted (contains tags)
    if (line.includes('<') && line.includes('>') && line.includes('{')) {
      result.push(line);
      continue;
    }
    
    // Handle gem patterns: "Level X Vaal Gem Name"
    if (line.match(/^Level \d+/)) {
      // Match gem pattern - capture everything up to Quality or end
      const gemMatch = line.match(/Level (\d+)\s+(Vaal\s+)?([A-Z][^Q]+?)(?:\s+Quality:|$)/);
      if (gemMatch) {
        const [, level, vaal, gemName] = gemMatch;
        const gem = vaal ? `Vaal ${gemName.trim()}` : gemName.trim();
        result.push(`<gemitem>{Level ${level} ${gem}}`);
        
        // Check for Quality in next line
        if (nextLine.match(/Quality:\s*\+?\d+%/)) {
          const qualityMatch = nextLine.match(/Quality:\s*\+?(\d+)%/);
          if (qualityMatch) {
            result.push(`<default>{Quality:} <augmented>{+${qualityMatch[1]}%}`);
            i++; // Skip quality line
          }
        }
        
        // Check for Corrupted in next line
        if (nextLine.match(/Corrupted|\[Corrupted\]/i)) {
          result.push('<corrupted>{Corrupted}');
          i++;
        }
        continue;
      }
    }
    
    // Handle Quality standalone
    if (line.match(/Quality:\s*\+?\d+%/)) {
      const qualityMatch = line.match(/Quality:\s*\+?(\d+)%/);
      if (qualityMatch) {
        result.push(`<default>{Quality:} <augmented>{+${qualityMatch[1]}%}`);
        continue;
      }
    }
    
    // Handle Item Level
    if (line.match(/Item Level:\s*\d+/)) {
      const ilvlMatch = line.match(/Item Level:\s*(\d+)/);
      if (ilvlMatch) {
        result.push(`<default>{Item Level:} <normal>{${ilvlMatch[1]}}`);
        continue;
      }
    }
    
    // Handle Corrupted
    if (line.match(/\[Corrupted\]/i) || line === 'Corrupted') {
      result.push('<corrupted>{Corrupted}');
      continue;
    }
    
    // Handle Fractured
    if (line.match(/\[Fractured\]/i) || line === 'Fractured') {
      result.push('<fractured>{Fractured}');
      continue;
    }
    
    // Handle Synthesised
    if (line === 'Synthesised') {
      result.push('<synthesised>{Synthesised}');
      continue;
    }
    
    // Handle Three-Implicit
    if (line === 'Three-Implicit') {
      result.push('<default>{Three-Implicit}');
      continue;
    }
    
    // Handle Shaper/Elder combinations
    if (line.match(/(Shaper|Elder|Hunter|Warlord|Crusader|Redeemer)\s*\+\s*(Shaper|Elder|Hunter|Warlord|Crusader|Redeemer)\s+Item/i)) {
      const match = line.match(/(Shaper|Elder|Hunter|Warlord|Crusader|Redeemer)\s*\+\s*(Shaper|Elder|Hunter|Warlord|Crusader|Redeemer)\s+Item/i);
      result.push(`<default>{${match[1]} + ${match[2]} Item}`);
      continue;
    }
    
    if (line.match(/(Shaper|Elder|Hunter|Warlord|Crusader|Redeemer)\s+Item/i)) {
      const match = line.match(/(Shaper|Elder|Hunter|Warlord|Crusader|Redeemer)\s+Item/i);
      result.push(`<default>{${match[1]} Item}`);
      continue;
    }
    
    // Handle generic "Item" when followed by Item Level
    if (line === 'Item' && nextLine.match(/Item Level:/)) {
      result.push('<rareitem>{Item}');
      continue;
    }
    
    // Handle item types like "Jewellery of Farrul" when followed by Item Level
    if (line.match(/^[A-Z][^\.]+$/) && nextLine.match(/Item Level:/)) {
      result.push(`<rareitem>{${line}}`);
      continue;
    }
    
    // Handle "Dictator's Weapon" type patterns
    if (line.match(/^[A-Z][a-z]+'s [A-Z]/) && nextLine.match(/Item Level:/)) {
      result.push(`<rareitem>{${line}}`);
      continue;
    }
    
    // Skip common item-related keywords that appear alone
    if (line.match(/^(Level|Quality|Item Level|Corrupted|Fractured|Synthesised|Three-Implicit)$/i)) {
      continue;
    }
    
    // Handle unique items that weren't caught by link processing
    // Check if line is wrapped in {} but missing the tag
    if (line.match(/^\{[^}]+\}$/) && !line.includes('<')) {
      const content = line.replace(/[{}]/g, '');
      if (content.match(/^The [A-Z]/) || content.match(/^[A-Z][a-z]+'s [A-Z]/)) {
        result.push(`<uniqueitem>{${content}}`);
        continue;
      }
    }
    
    if ((line.match(/^The [A-Z]/) || line.match(/^[A-Z][a-z]+'s [A-Z]/)) && !line.includes('<')) {
      result.push(`<uniqueitem>{${line}}`);
      continue;
    }
    
    // Keep other meaningful lines
    if (line.length > 0) {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * Extract reward item name from formatted description
 * @param {string} formattedDescription - Formatted description text
 * @param {string} rawDescription - Raw description HTML/text for currency patterns
 * @returns {string|null} Reward item name or null
 */
function extractRewardItemName(formattedDescription, rawDescription) {
  if (!formattedDescription) return null;
  
  // Look for patterns like <uniqueitem>{Item Name}, <gemitem>{...}, <rareitem>{Item Name}
  const uniqueMatch = formattedDescription.match(/<uniqueitem>\{([^}]+)\}/);
  if (uniqueMatch) {
    return uniqueMatch[1].trim();
  }
  
  const rareMatch = formattedDescription.match(/<rareitem>\{([^}]+)\}/);
  if (rareMatch) {
    return rareMatch[1].trim();
  }
  
  // For gems, extract the gem name
  const gemMatch = formattedDescription.match(/<gemitem>\{Level \d+ (?:Vaal )?([^}]+)\}/);
  if (gemMatch) {
    return gemMatch[1].trim();
  }
  
  // Check for currency patterns like "13x Orb of Alteration" in raw description
  if (rawDescription) {
    const currencyMatch = rawDescription.match(/(\d+)x\s+([A-Z][^\.]+?)(?:\s|$|\.)/);
    if (currencyMatch) {
      return currencyMatch[2].trim();
    }
    // Also try without number: "x Orb of Alteration"
    const currencyMatch2 = rawDescription.match(/x\s+([A-Z][^\.]+?)(?:\s|$|\.)/);
    if (currencyMatch2) {
      return currencyMatch2[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract flavour text from the first cell (card tooltip)
 * The flavour text is usually at the end of the first cell, after the description
 * @param {string} firstCellText - Text from the first cell
 * @param {string} cardName - Name of the card (to filter it out)
 * @param {number} stackSize - Stack size (to filter it out)
 * @param {string} rewardItemName - Reward item name (to filter it out)
 * @returns {string|null} Flavour text or null
 */
function extractFlavourText(firstCellText, cardName, stackSize, rewardItemName) {
  if (!firstCellText) return null;
  
  let allText = firstCellText;
  
  // Remove the card name if it appears (might appear multiple times)
  if (cardName) {
    const escapedName = cardName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    allText = allText.replace(new RegExp(escapedName, 'gi'), '');
  }
  
  // Remove stack size (as number at start of line or standalone)
  if (stackSize) {
    const stackSizeStr = stackSize.toString();
    // Remove standalone number
    allText = allText.replace(new RegExp(`^${stackSizeStr}\\s+`, 'gm'), '');
    allText = allText.replace(new RegExp(`\\s+${stackSizeStr}\\s+`, 'g'), ' ');
    // Remove number at start of concatenated text (e.g., "9The Poet's Pen")
    allText = allText.replace(new RegExp(`^${stackSizeStr}(?=[A-Z])`, 'gm'), '');
  }
  
  // Remove reward item name if it appears
  if (rewardItemName) {
    const escapedItemName = rewardItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove item name (might appear multiple times)
    allText = allText.replace(new RegExp(escapedItemName, 'gi'), '');
    // Also handle cases where item name might be concatenated (e.g., "The Poet's PenThe Poet's blood")
    // Look for pattern where item name is followed by the same item name or different text
    const repeatedPattern = new RegExp(`(${escapedItemName})\\1`, 'gi');
    allText = allText.replace(repeatedPattern, '');
    
    // Handle partial matches where part of the item name was removed
    // For example, "Orb of Alteration" might become "b of Alteration" if "Or" was removed
    if (rewardItemName.includes(' ')) {
      const parts = rewardItemName.split(' ');
      if (parts.length > 1) {
        const restOfName = parts.slice(1).join(' ');
        const escapedRest = restOfName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Remove patterns like "b of Alteration", "of Alteration", etc.
        // Match: 1-2 lowercase letters + " of " + rest of name (to avoid matching actual flavour text)
        allText = allText.replace(new RegExp(`[a-z]{1,2}\\s+of\\s+${escapedRest}`, 'gi'), '');
        allText = allText.replace(new RegExp(`of\\s+${escapedRest}`, 'gi'), '');
      }
    }
  }
  
  // Split by newlines and process
  const lines = allText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Item-related keywords to skip
  const itemKeywords = ['Level', 'Quality', 'Item Level', 'Corrupted', 'Fractured', 'Stack Size', 
    'Vaal', 'Item', 'Shaper', 'Elder', 'Hunter', 'Warlord', 'Crusader', 'Redeemer', 
    'Synthesised', 'Three-Implicit', 'File:', 'card_art', 'inventory_icon'];
  
  // Look for flavour text - usually the last meaningful text that's not item-related
  // Flavour text can span multiple lines, so we need to collect consecutive lines
  const flavourLines = [];
  const lastLines = lines.slice(-12); // Check last 12 lines to be safe
  
  // Collect potential flavour text lines from the end, going backwards
  for (let i = lastLines.length - 1; i >= 0; i--) {
    let line = lastLines[i];
    const originalLine = line;
    
    // Skip if it contains item keywords (but be less strict - only skip if it's clearly item-related)
    const hasItemKeyword = itemKeywords.some(keyword => {
      // Only skip if the keyword appears as a standalone word
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(line);
    });
    if (hasItemKeyword) {
      // If we've already collected some flavour lines, stop here
      if (flavourLines.length > 0) break;
      continue;
    }
    
    // Skip if it's just a number (stack size)
    if (/^\d+$/.test(line)) {
      if (flavourLines.length > 0) break;
      continue;
    }
    
    // Skip if it looks like a file name or technical text
    if (line.includes('.png') || line.includes('File:') || line.match(/^[a-z_]+$/)) {
      if (flavourLines.length > 0) break;
      continue;
    }
    
    // Skip if it's the card name repeated (exact match)
    if (cardName && line.toLowerCase() === cardName.toLowerCase()) {
      if (flavourLines.length > 0) break;
      continue;
    }
    
    // Skip if it's the reward item name (exact match or starts with it)
    if (rewardItemName) {
      const lowerLine = line.toLowerCase();
      const lowerItem = rewardItemName.toLowerCase();
      if (lowerLine === lowerItem || lowerLine.startsWith(lowerItem + ' ')) {
        if (flavourLines.length > 0) break;
        continue;
      }
    }
    
    // Clean up any remaining numbers or item names at the start
    line = line.replace(/^\d+\s*/, '').trim();
    line = line.replace(/^x\s+[A-Z][^\.]+?\s*/i, '').trim();
    
    // Handle partial currency/item name patterns
    if (rewardItemName && rewardItemName.includes(' ')) {
      const parts = rewardItemName.split(' ');
      if (parts.length > 1) {
        const restOfName = parts.slice(1).join(' ');
        const fragmentPatterns = [
          new RegExp(`^[a-z]{1,2}\\s+of\\s+${restOfName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
          new RegExp(`^of\\s+${restOfName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
        ];
        
        for (const pattern of fragmentPatterns) {
          if (pattern.test(line)) {
            const match = line.match(pattern);
            if (match) {
              line = line.substring(match[0].length).trim();
              break;
            }
          }
        }
      }
    }
    
    // Remove any remaining item name patterns at the start
    if (rewardItemName) {
      const escapedItemName = rewardItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      line = line.replace(new RegExp(`^${escapedItemName}\\s*`, 'i'), '').trim();
    }
    
    // If line is empty after cleanup, skip it
    if (!line || line.length === 0) {
      if (flavourLines.length > 0) break;
      continue;
    }
    
    // Check if this looks like flavour text
    // Be less restrictive - accept lines that look like prose/poetry
    const wordCount = line.split(/\s+/).filter(w => w.length > 0).length;
    const looksLikeFlavour = line.length > 3 && (
      wordCount >= 2 || 
      line.includes("'") || 
      line.includes('"') || 
      line.includes(',') ||
      line.includes('.') ||
      /[A-Z][a-z]+ [a-z]+/.test(line) || // Has capital letter followed by lowercase (sentence-like)
      line.match(/^[A-Z][a-z]+/) // Starts with capital letter (likely a sentence)
    );
    
    if (looksLikeFlavour) {
      flavourLines.unshift(line); // Add to beginning (we're going backwards)
    } else {
      // If we've collected some flavour lines and hit a non-flavour line, stop
      if (flavourLines.length > 0) break;
    }
  }
  
  // Return collected flavour text, joining multiple lines with \n
  if (flavourLines.length > 0) {
    return flavourLines.join('\n').trim();
  }
  
  // Fallback: if no flavour text found in last lines, try to find any prose-like text
  // Look through all lines for text that looks like flavour text
  for (let i = lines.length - 1; i >= 0; i--) {
    let line = lines[i].trim();
    
    // Skip obvious non-flavour text
    if (line.length < 3 || 
        /^\d+$/.test(line) ||
        line.includes('.png') ||
        line.includes('File:') ||
        itemKeywords.some(kw => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(line))) {
      continue;
    }
    
    // Check if it looks like flavour text
    const wordCount = line.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount >= 2 && /[A-Z][a-z]+/.test(line)) {
      // Clean up the line
      line = line.replace(/^\d+\s*/, '').trim();
      line = line.replace(/^x\s+[A-Z][^\.]+?\s*/i, '').trim();
      
      if (line.length > 5) {
        return line;
      }
    }
  }
  
  return null;
}

/**
 * Main function to fetch and update divination cards
 */
async function fetchDivinationCards() {
  console.log('Fetching divination cards from PoE Wiki...\n');
  
  try {
    // Load existing data
    let existingCards = [];
    try {
      const existingData = await fs.readFile(OUTPUT_JSON, 'utf-8');
      existingCards = JSON.parse(existingData);
      console.log(`Loaded ${existingCards.length} existing cards\n`);
    } catch (error) {
      console.log('No existing data found, starting fresh\n');
    }
  
    // Create a map of existing cards by ID for quick lookup
    const existingCardsMap = new Map();
    existingCards.forEach(card => {
      existingCardsMap.set(card.id || toKebabCase(card.name), card);
    });
    
    // Fetch the wiki page
    console.log(`Fetching: ${WIKI_URL}`);
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wiki page: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the divination cards table
    const table = $('table.wikitable').first();
    
    if (table.length === 0) {
      throw new Error('Could not find divination cards table on the page');
    }
    
    console.log('Parsing divination cards table...\n');
    
    const updatedCards = [];
    let processedCount = 0;
    let newCount = 0;
    let updatedCount = 0;
    
    // Iterate through table rows (skip header row)
    table.find('tbody tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length < 3) {
        return; // Skip rows that don't have enough cells
      }
      
      // First cell contains the card name, image, and flavour text
      const $firstCell = $(cells[0]);
      
      // Extract card name from the link
      const nameLink = $firstCell.find('a[title]').first();
      let name = nameLink.attr('title') || nameLink.text().trim();
      
      // Fallback: try to get name from text content
      if (!name || name === '') {
        name = $firstCell.find('a').first().text().trim();
      }
      
      if (!name || name === '') {
        return; // Skip if no name found
      }
      
      const id = toKebabCase(name);
      
      // Second cell contains stack size
      const stackSizeText = $(cells[1]).text().trim();
      const stackSize = extractNumber(stackSizeText);
      
      // Third cell contains description
      const descriptionHtml = $(cells[2]).html() || $(cells[2]).text();
      const formattedDescription = formatDescription(descriptionHtml);
      
      // Extract reward item name from description (to filter it out from flavour text)
      const rewardItemName = extractRewardItemName(formattedDescription, descriptionHtml);
      
      // Extract flavour text from first cell
      // The flavour text is usually the last text in the first cell, after all item info
      // Get both HTML and text to better extract flavour text
      const firstCellText = $firstCell.text();
      const firstCellHtml = $firstCell.html() || '';
      
      // Try to extract flavour text - if not found, try a more aggressive approach
      let flavourText = extractFlavourText(firstCellText, name, stackSize, rewardItemName);
      
      // If no flavour text found, try extracting from HTML structure
      // Flavour text is often in the last text node or after the last image
      if (!flavourText) {
        // Get all text nodes in order
        const textNodes = [];
        try {
          $firstCell.find('*').addBack().contents().each((i, node) => {
            if (node.type === 'text') {
              const text = $(node).text().trim();
              if (text && text.length > 0) {
                textNodes.push(text);
              }
            }
          });
        } catch (e) {
          // If there's an error, just use the text extraction we already have
        }
        
        // Try to find flavour text in the last few text nodes
        // Collect multiple text nodes that look like flavour text
        if (textNodes.length > 0) {
          const itemKeywords = ['Level', 'Quality', 'Item Level', 'Corrupted', 'Fractured', 'Stack Size', 
            'Vaal', 'Item', 'Shaper', 'Elder', 'Hunter', 'Warlord', 'Crusader', 'Redeemer', 
            'Synthesised', 'Three-Implicit', 'File:', 'card_art', 'inventory_icon'];
          const lastTextNodes = textNodes.slice(-8); // Check more nodes
          const collectedFlavourText = [];
          
          for (let i = lastTextNodes.length - 1; i >= 0; i--) {
            const text = lastTextNodes[i];
            // Clean up the text
            let cleanText = text;
            if (name) {
              const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              cleanText = cleanText.replace(new RegExp(escapedName, 'gi'), '');
            }
            if (stackSize) {
              cleanText = cleanText.replace(new RegExp(`^${stackSize}\\s*`, 'g'), '');
            }
            if (rewardItemName) {
              const escapedItem = rewardItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              cleanText = cleanText.replace(new RegExp(escapedItem, 'gi'), '');
            }
            cleanText = cleanText.trim();
            
            // Check if it looks like flavour text
            if (cleanText.length > 5) {
              const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
              // Be more permissive - accept text that looks like prose
              if (wordCount >= 2 && (
                /[A-Z][a-z]+/.test(cleanText) || 
                cleanText.includes(',') || 
                cleanText.includes('.') ||
                cleanText.match(/^[A-Z]/)
              )) {
                // Skip if it's clearly not flavour text
                if (!cleanText.match(/^\d+$/) && 
                    !cleanText.includes('.png') && 
                    !cleanText.includes('File:') &&
                    !itemKeywords.some(kw => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleanText))) {
                  collectedFlavourText.unshift(cleanText); // Add to beginning
                }
              } else {
                // If we've collected some flavour text and hit non-flavour text, stop
                if (collectedFlavourText.length > 0) break;
              }
            } else {
              // If we've collected some flavour text and hit very short text, stop
              if (collectedFlavourText.length > 0) break;
            }
          }
          
          if (collectedFlavourText.length > 0) {
            flavourText = collectedFlavourText.join('\n').trim();
          }
        }
      }
      
      // Fourth cell contains drop level
      const dropLevelText = $(cells[3]) ? $(cells[3]).text().trim() : '';
      const dropLevel = dropLevelText ? extractNumber(dropLevelText) : null;
      
      // Get or create card entry
      let card = existingCardsMap.get(id);
      
      if (!card) {
        // Create new card
        card = {
          id,
          name,
          dropAreas: [],
          dropMonsters: [],
          stackSize,
          dropLevel: dropLevel || undefined
        };
        newCount++;
      } else {
        updatedCount++;
      }
      
      // Update card data
      card.name = name;
      if (stackSize > 0) {
        card.stackSize = stackSize;
      }
      if (dropLevel !== null && dropLevel > 0) {
        card.dropLevel = dropLevel;
      }
      
      // Update explicitModifiers from description
      if (formattedDescription) {
        card.explicitModifiers = [
          {
            text: formattedDescription,
            optional: false
          }
        ];
      }
      
      // Update flavourText
      if (flavourText) {
        card.flavourText = flavourText;
      }
      
      updatedCards.push(card);
      processedCount++;
      
      if (processedCount % 50 === 0) {
        console.log(`  Processed ${processedCount} cards...`);
      }
    });
    
    console.log(`\nProcessed ${processedCount} cards (${newCount} new, ${updatedCount} updated)\n`);
    
    // Sort cards by name for consistency
    updatedCards.sort((a, b) => a.name.localeCompare(b.name));
    
    // Save updated JSON file
    console.log(`Saving divination cards data to: ${OUTPUT_JSON}`);
    await fs.writeFile(
      OUTPUT_JSON,
      JSON.stringify(updatedCards, null, 2),
      'utf-8'
    );
    
    console.log(`\n✓ Successfully saved ${updatedCards.length} divination cards to ${OUTPUT_JSON}\n`);
    
  } catch (error) {
    console.error('\n✗ Error fetching divination cards:', error);
    process.exit(1);
  }
}

// Run the script
fetchDivinationCards();
