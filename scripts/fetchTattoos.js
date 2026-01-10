import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://www.poewiki.net/wiki/List_of_tattoos';
const OUTPUT_JSON = path.join(__dirname, '../public/data/tattoos/tattos.json');
const IMAGES_DIR = path.join(__dirname, '../public/assets/images/tattoos');

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
    
    // Handle thumbnail URLs - extract the actual image path
    if (url.includes('/thumb/')) {
      // Extract path from thumbnail URL like /images/thumb/b/b5/Journey_Tattoo_%28resource%29_inventory_icon.png/78px-Journey_Tattoo_%28resource%29_inventory_icon.png
      // The actual image is at /images/b/b5/Journey_Tattoo_%28resource%29_inventory_icon.png
      const thumbMatch = url.match(/\/images\/thumb\/([^\/]+)\/([^\/]+)\/([^\/]+)\//);
      if (thumbMatch) {
        const [, dir1, dir2, filename] = thumbMatch;
        url = `https://www.poewiki.net/images/${dir1}/${dir2}/${filename}`;
      }
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
 * Extract number from text (e.g., "_10_" -> 10)
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
 * Clean drop restrictions text
 * @param {string} text - Raw drop restrictions text
 * @returns {string} Cleaned drop restrictions
 */
function cleanDropRestrictions(text) {
  if (!text || text.trim() === '' || text.trim() === '—' || text.trim() === '—') {
    return '';
  }
  
  // Convert <br> tags to newlines first
  let cleaned = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove HTML tags but keep text content
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Remove markdown-style links and keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove italic markers (underscores used for italics in wiki)
  cleaned = cleaned
    .replace(/^_/g, '') // Remove leading underscore
    .replace(/_$/g, '') // Remove trailing underscore
    .replace(/_/g, ''); // Remove all underscores
  
  // Normalize whitespace
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+/g, '\n')
    .trim();
  
  return cleaned;
}

/**
 * Extract "replaces" value from the first cell text
 * Looks for patterns like "Replaces a _+30 to Strength Notable_ Passive Skill"
 * or "Replaces a _Small Dexterity_ Passive Skill"
 * @param {string} text - Text from the first cell
 * @returns {string|null} The passive skill name that gets replaced
 */
function extractReplaces(text) {
  if (!text) return null;
  
  // Pattern 1: "Replaces a _+30 to Strength Notable_ Passive Skill"
  // Pattern 2: "Replaces a _Small Dexterity_ Passive Skill"
  // The key is to extract what's between the underscores after "Replaces a"
  
  // First, try the most specific pattern with underscores
  const underscorePattern = /Replaces a\s+_([^_]+)_\s+Passive Skill/i;
  let match = text.match(underscorePattern);
  if (match && match[1]) {
    let result = match[1].trim();
    result = result.replace(/<[^>]+>/g, ''); // Remove HTML tags
    result = result.replace(/&nbsp;/g, ' '); // Replace &nbsp;
    result = result.replace(/\s+/g, ' '); // Normalize whitespace
    if (result && result.length > 0) {
      return result;
    }
  }
  
  // Try pattern without "Passive Skill" at the end
  const simpleUnderscorePattern = /Replaces a\s+_([^_]+)_/i;
  match = text.match(simpleUnderscorePattern);
  if (match && match[1]) {
    let result = match[1].trim();
    result = result.replace(/<[^>]+>/g, '');
    result = result.replace(/&nbsp;/g, ' ');
    result = result.replace(/\s+/g, ' ');
    // Stop at "Passive Skill" if it appears in the result
    const passiveIndex = result.indexOf('Passive Skill');
    if (passiveIndex > 0) {
      result = result.substring(0, passiveIndex).trim();
    }
    if (result && result.length > 0) {
      return result;
    }
  }
  
  // Try pattern that captures up to "Passive Skill" (for cases without underscores)
  const passiveSkillPattern = /Replaces a\s+([^\.]+?)\s+Passive Skill/i;
  match = text.match(passiveSkillPattern);
  if (match && match[1]) {
    let result = match[1].trim();
    result = result.replace(/<[^>]+>/g, '');
    result = result.replace(/&nbsp;/g, ' ');
    result = result.replace(/\s+/g, ' ');
    // Remove leading "a " or "an " if present
    result = result.replace(/^(a|an)\s+/i, '');
    if (result && result.length > 0 && !result.match(/^(Passive|Skill)$/i)) {
      return result;
    }
  }
  
  return null;
}

/**
 * Main function to fetch and process tattoos
 */
async function fetchTattoos() {
  console.log('Fetching tattoos from PoE Wiki...\n');
  
  try {
    // Fetch the wiki page
    console.log(`Fetching: ${WIKI_URL}`);
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wiki page: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the tattoos table
    const tattoos = [];
    const table = $('table.wikitable').first();
    
    if (table.length === 0) {
      throw new Error('Could not find tattoos table on the page');
    }
    
    console.log('Parsing tattoos table...\n');
    
    // Iterate through table rows (skip header row)
    table.find('tbody tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length < 2) {
        return; // Skip rows that don't have enough cells
      }
      
      // First cell contains the tattoo name, image, and "replaces" info
      const $firstCell = $(cells[0]);
      
      // Extract tattoo name from the link
      const nameLink = $firstCell.find('a[title]').first();
      let name = nameLink.attr('title') || nameLink.text().trim();
      
      // Fallback: try to get name from text content
      if (!name || name === '') {
        name = $firstCell.find('a').first().text().trim();
      }
      
      // Extract image URL
      const img = $firstCell.find('img').first();
      let imageSrc = img.attr('src') || img.attr('data-src');
      
      // Extract stack size from the first cell text
      const firstCellText = $firstCell.text();
      const stackSizeMatch = firstCellText.match(/Stack Size:\s*_(\d+)_/);
      const stackSize = stackSizeMatch ? parseInt(stackSizeMatch[1], 10) : 10;
      
      // Extract "replaces" value from the first cell HTML/text
      // Try HTML first as it might have better formatting
      const firstCellHtml = $firstCell.html() || '';
      let replaces = extractReplaces(firstCellHtml);
      if (!replaces) {
        replaces = extractReplaces(firstCellText);
      }
      
      // Second cell contains the description
      let description = '';
      if (cells.length > 1) {
        let descriptionHtml = $(cells[1]).html() || $(cells[1]).text();
        // Convert <br> tags to newlines
        descriptionHtml = descriptionHtml.replace(/<br\s*\/?>/gi, '\n');
        // Remove HTML tags but preserve structure
        descriptionHtml = descriptionHtml.replace(/<[^>]+>/g, '');
        description = cleanText(descriptionHtml);
      }
      
      // Third cell contains additional drop restrictions
      let dropRequired = '';
      if (cells.length > 2) {
        const dropRestrictionsHtml = $(cells[2]).html() || $(cells[2]).text();
        dropRequired = cleanDropRestrictions(dropRestrictionsHtml);
      }
      
      if (!name || name === '') {
        console.warn(`  ⚠ Skipping row ${index + 1}: No name found`);
        return;
      }
      
      // Generate ID from name
      const id = toKebabCase(name);
      
      tattoos.push({
        id,
        name,
        description,
        dropRequired: dropRequired || undefined,
        replaces: replaces || undefined,
        stackSize,
        imageUrl: imageSrc
      });
      
      const replacesInfo = replaces ? ` (Replaces: ${replaces})` : ' (Replaces: not found)';
      console.log(`  ✓ Found: ${name}${replacesInfo}`);
    });
    
    console.log(`\nFound ${tattoos.length} tattoos\n`);
    
    // Ensure images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    
    // Download images
    console.log('Downloading tattoo images...\n');
    for (const tattoo of tattoos) {
      if (tattoo.imageUrl) {
        const imageFilename = `${tattoo.id}.png`;
        const imagePath = path.join(IMAGES_DIR, imageFilename);
        await downloadImage(tattoo.imageUrl, imagePath);
      } else {
        console.warn(`  ⚠ No image URL for: ${tattoo.name}`);
      }
    }
    
    // Remove imageUrl from final JSON (not needed in output)
    const tattoosForJson = tattoos.map(({ imageUrl, ...rest }) => {
      // Remove undefined fields
      const cleaned = {};
      cleaned.id = rest.id;
      cleaned.name = rest.name;
      if (rest.description) cleaned.description = rest.description;
      if (rest.dropRequired) cleaned.dropRequired = rest.dropRequired;
      if (rest.replaces) cleaned.replaces = rest.replaces;
      if (rest.stackSize !== undefined) cleaned.stackSize = rest.stackSize;
      return cleaned;
    });
    
    // Save JSON file
    console.log(`\nSaving tattoos data to: ${OUTPUT_JSON}`);
    await fs.writeFile(
      OUTPUT_JSON,
      JSON.stringify(tattoosForJson, null, 4),
      'utf-8'
    );
    
    console.log(`\n✓ Successfully saved ${tattoos.length} tattoos to ${OUTPUT_JSON}`);
    console.log(`✓ Images saved to ${IMAGES_DIR}\n`);
    
  } catch (error) {
    console.error('\n✗ Error fetching tattoos:', error);
    process.exit(1);
  }
}

// Run the script
fetchTattoos();
