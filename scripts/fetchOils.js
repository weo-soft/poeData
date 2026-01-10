import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://www.poewiki.net/wiki/Oil';
const OUTPUT_JSON = path.join(__dirname, '../public/data/oils/oils.json');
const IMAGES_DIR = path.join(__dirname, '../public/assets/images/oils');

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
 * Download an image from a URL
 * @param {string} url - Image URL
 * @param {string} filepath - Destination filepath
 */
async function downloadImage(url, filepath) {
  try {
    // Handle relative URLs
    if (url.startsWith('/')) {
      url = `https://www.poewiki.net${url}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(filepath, buffer);
    console.log(`  ✓ Downloaded: ${path.basename(filepath)}`);
  } catch (error) {
    console.error(`  ✗ Failed to download ${url}:`, error.message);
  }
}

/**
 * Extract number from text (e.g., "_10_" -> 10, "_1_" -> 1)
 * @param {string} text - Text containing number
 * @returns {number} Extracted number
 */
function extractNumber(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Clean and format text
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links, keep text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/\n+/g, '\n') // Replace multiple newlines with single
    .trim();
}

/**
 * Extract image URL and convert to 59px version
 * @param {cheerio.Cheerio} $cell - Cheerio object for the cell containing images
 * @returns {string|null} Image URL (59px version)
 */
function extractImageUrl($cell) {
  // Look for thumbnail images first
  const thumbImg = $cell.find('img').first();
  if (thumbImg.length > 0) {
    let thumbSrc = thumbImg.attr('src') || thumbImg.attr('data-src');
    
    if (thumbSrc && thumbSrc.includes('/thumb/')) {
      // Convert thumbnail URL to 59px version
      // Pattern: /images/thumb/2/21/Clear_Oil_inventory_icon.png/16px-Clear_Oil_inventory_icon.png
      // Target: /images/thumb/2/21/Clear_Oil_inventory_icon.png/59px-Clear_Oil_inventory_icon.png
      thumbSrc = thumbSrc.replace(/\d+px-/, '59px-');
      return thumbSrc;
    }
    
    // If no thumbnail pattern, try to get full image
    if (thumbSrc && !thumbSrc.includes('/thumb/')) {
      return thumbSrc;
    }
  }
  
  // Fallback: look for full-size images in the cell
  const fullImg = $cell.find('img').last();
  if (fullImg.length > 0) {
    const fullSrc = fullImg.attr('src') || fullImg.attr('data-src');
    if (fullSrc) {
      // If it's a thumbnail, convert to 59px
      if (fullSrc.includes('/thumb/')) {
        return fullSrc.replace(/\d+px-/, '59px-');
      }
      return fullSrc;
    }
  }
  
  return null;
}

/**
 * Parse oil data from a table row
 * @param {cheerio.Cheerio} $ - Cheerio instance
 * @param {cheerio.Cheerio} $row - Cheerio object for the table row
 * @param {number} defaultTier - Default tier if not found in the row
 * @returns {Object|null} Oil data object or null if parsing fails
 */
function parseOilRow($, $row, defaultTier = null) {
  const cells = $row.find('td');
  
  if (cells.length === 0) {
    return null;
  }
  
  // First cell contains the oil name and image
  const $firstCell = $(cells[0]);
  
  // Extract oil name from the link
  const nameLink = $firstCell.find('a[title]').first();
  let name = nameLink.attr('title') || nameLink.text().trim();
  
  // Fallback: try to get name from text content
  if (!name || name === '') {
    name = $firstCell.find('a').first().text().trim();
  }
  
  // Extract image URL (59px version)
  const imageSrc = extractImageUrl($firstCell);
  
  // Extract tier from the cell HTML/text (look for "Oil Tier: _X_")
  let tier = defaultTier;
  const cellHtml = $firstCell.html() || '';
  const cellText = $firstCell.text();
  
  // Try to match tier in HTML first (more reliable)
  const tierMatchHtml = cellHtml.match(/Oil Tier:\s*_(\d+)_/);
  if (tierMatchHtml) {
    tier = parseInt(tierMatchHtml[1], 10);
  } else {
    // Fallback to text matching
    const tierMatchText = cellText.match(/Oil Tier:\s*_(\d+)_/);
    if (tierMatchText) {
      tier = parseInt(tierMatchText[1], 10);
    }
  }
  
  // For standard oils, if no tier found and we're in standard oils section, assign sequential tiers
  // This is a fallback - the HTML should have the tier info
  
  // Extract stack size (always 10 for oils, but check anyway)
  const stackSizeMatch = cellText.match(/Stack Size:\s*_(\d+)_/);
  const stackSize = stackSizeMatch ? parseInt(stackSizeMatch[1], 10) : 10;
  
  // Extract drop level from the second cell (Droplevel column)
  let dropLevel = null;
  if (cells.length > 1) {
    const dropLevelText = $(cells[1]).text().trim();
    const dropLevelMatch = dropLevelText.match(/_(\d+)_/);
    if (dropLevelMatch) {
      dropLevel = parseInt(dropLevelMatch[1], 10);
    }
  }
  
  // Extract help text from the cell text
  // Help text usually comes after "Can be combined" or similar
  let helpText = '';
  const helpTextMatch = cellText.match(/Can be combined[^!]*/);
  if (helpTextMatch) {
    helpText = cleanText(helpTextMatch[0]);
  }
  
  // If no help text found, try to get it from the full cell text
  if (!helpText) {
    // Remove the name and other metadata, keep the description
    let remainingText = cellText
      .replace(/Stack Size:.*?Oil Tier:.*?/g, '')
      .replace(name, '')
      .trim();
    
    if (remainingText && remainingText.length > 10) {
      helpText = cleanText(remainingText);
    }
  }
  
  if (!name || name === '') {
    return null;
  }
  
  // Generate ID from name
  const id = toKebabCase(name);
  
  return {
    id,
    name,
    helpText: helpText || undefined,
    stackSize,
    tier: tier !== null ? tier : undefined,
    dropLevel: dropLevel !== null ? dropLevel : undefined,
    imageUrl: imageSrc
  };
}

/**
 * Main function to fetch and process oils
 */
async function fetchOils() {
  console.log('Fetching oils from PoE Wiki...\n');
  
  try {
    // Fetch the wiki page
    console.log(`Fetching: ${WIKI_URL}`);
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wiki page: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const oils = [];
    
    // Find "Standard oils" section
    console.log('Parsing standard oils table...\n');
    $('h3, h2').each((index, heading) => {
      const headingText = $(heading).text().trim();
      if (headingText === 'Standard oils' || headingText.includes('Standard oils')) {
        // Find the next table after this heading
        let nextElement = $(heading).next();
        while (nextElement.length > 0) {
          if (nextElement.is('table')) {
            const table = nextElement;
            let rowIndex = 0;
            table.find('tbody tr').each((idx, row) => {
              // Assign tier 1-13 sequentially for standard oils if not found
              const defaultTier = rowIndex + 1;
              const oil = parseOilRow($, $(row), defaultTier);
              if (oil) {
                // If tier wasn't found, use the sequential tier
                if (oil.tier === undefined || oil.tier === null) {
                  oil.tier = defaultTier;
                }
                oils.push(oil);
                console.log(`  ✓ Found: ${oil.name} (Tier ${oil.tier})`);
                rowIndex++;
              }
            });
            return false; // Break the loop
          }
          nextElement = nextElement.next();
        }
      }
    });
    
    // Find "Special purpose oils" section
    console.log('\nParsing special purpose oils table...\n');
    $('h3, h2').each((index, heading) => {
      const headingText = $(heading).text().trim();
      if (headingText === 'Special purpose oils' || headingText.includes('Special purpose oils')) {
        // Find the next table after this heading
        let nextElement = $(heading).next();
        while (nextElement.length > 0) {
          if (nextElement.is('table')) {
            const table = nextElement;
            table.find('tbody tr').each((rowIndex, row) => {
              const oil = parseOilRow($, $(row), 0); // Special oils have tier 0
              if (oil) {
                // Ensure tier 0 is set for special oils
                if (oil.tier === undefined || oil.tier === null) {
                  oil.tier = 0;
                }
                oils.push(oil);
                console.log(`  ✓ Found: ${oil.name} (Tier ${oil.tier})`);
              }
            });
            return false; // Break the loop
          }
          nextElement = nextElement.next();
        }
      }
    });
    
    console.log(`\nFound ${oils.length} oils\n`);
    
    // Ensure images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    
    // Download images
    console.log('Downloading oil images (59px)...\n');
    for (const oil of oils) {
      if (oil.imageUrl) {
        const imageFilename = `${oil.id}.png`;
        const imagePath = path.join(IMAGES_DIR, imageFilename);
        await downloadImage(oil.imageUrl, imagePath);
      } else {
        console.warn(`  ⚠ No image URL for: ${oil.name}`);
      }
    }
    
    // Remove imageUrl from final JSON (not needed in output)
    const oilsForJson = oils.map(({ imageUrl, ...rest }) => {
      // Remove undefined fields
      const cleaned = {};
      if (rest.helpText) cleaned.helpText = rest.helpText;
      if (rest.stackSize !== undefined) cleaned.stackSize = rest.stackSize;
      if (rest.tier !== undefined) cleaned.tier = rest.tier;
      if (rest.dropLevel !== undefined) cleaned.dropLevel = rest.dropLevel;
      cleaned.id = rest.id;
      cleaned.name = rest.name;
      return cleaned;
    });
    
    // Save JSON file
    console.log(`\nSaving oils data to: ${OUTPUT_JSON}`);
    await fs.writeFile(
      OUTPUT_JSON,
      JSON.stringify(oilsForJson, null, 4),
      'utf-8'
    );
    
    console.log(`\n✓ Successfully saved ${oils.length} oils to ${OUTPUT_JSON}`);
    console.log(`✓ Images saved to ${IMAGES_DIR}\n`);
    
  } catch (error) {
    console.error('\n✗ Error fetching oils:', error);
    process.exit(1);
  }
}

// Run the script
fetchOils();
