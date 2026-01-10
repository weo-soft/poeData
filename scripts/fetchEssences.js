import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://www.poewiki.net/wiki/List_of_essences';
const OUTPUT_JSON = path.join(__dirname, '../public/data/essences/essences.json');
const IMAGES_DIR = path.join(__dirname, '../public/assets/images/essences');

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
 * Extract tier number from tier text
 * @param {string} tierText - Tier text (e.g., "_2_", "2")
 * @returns {number} Tier number
 */
function extractTier(tierText) {
  const match = tierText.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Clean and format description text
 * @param {string} text - Raw description text
 * @returns {string} Cleaned description
 */
function cleanDescription(text) {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links, keep text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    // Add newlines before property lines (lines starting with capital letter after lowercase, colon, or specific patterns)
    .replace(/([a-z0-9%\)])([A-Z][a-z]+:)/g, '$1\n$2') // Pattern: "belowBow:" -> "below\nBow:"
    .replace(/([a-z0-9%\)])(Two Handed|Other Weapon|Other Armour|Other Jewellery|Body Armour)/g, '$1\n$2') // Specific multi-word patterns
    .replace(/\n+/g, '\n') // Replace multiple newlines with single
    .trim();
}

/**
 * Main function to fetch and process essences
 */
async function fetchEssences() {
  console.log('Fetching essences from PoE Wiki...\n');
  
  try {
    // Fetch the wiki page
    console.log(`Fetching: ${WIKI_URL}`);
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wiki page: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the essences table
    const essences = [];
    const table = $('table.wikitable').first();
    
    if (table.length === 0) {
      throw new Error('Could not find essences table on the page');
    }
    
    console.log('Parsing essences table...\n');
    
    // Iterate through table rows (skip header row)
    table.find('tbody tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length < 3) {
        return; // Skip rows that don't have enough cells
      }
      
      // First cell contains the essence name and image
      const $firstCell = $(cells[0]);
      
      // Extract essence name from the link
      const nameLink = $firstCell.find('a[title]').first();
      let name = nameLink.attr('title') || nameLink.text().trim();
      
      // Fallback: try to get name from text content
      if (!name || name === '') {
        name = $firstCell.find('a').first().text().trim();
      }
      
      // Extract image URL
      const img = $firstCell.find('img').first();
      const imageSrc = img.attr('src') || img.attr('data-src');
      
      // Second cell contains the tier
      const tierText = $(cells[1]).text().trim();
      const tier = extractTier(tierText);
      
      // Third cell contains the description
      // Try to preserve line breaks from the HTML structure
      let description = $(cells[2]).html() || $(cells[2]).text();
      // Convert <br> tags to newlines
      description = description.replace(/<br\s*\/?>/gi, '\n');
      // Remove HTML tags but preserve structure
      description = description.replace(/<[^>]+>/g, '');
      // Clean up the text
      description = cleanDescription(description);
      
      if (!name || name === '') {
        console.warn(`  ⚠ Skipping row ${index + 1}: No name found`);
        return;
      }
      
      // Generate ID from name
      const id = toKebabCase(name);
      
      essences.push({
        id,
        name,
        description,
        tier,
        imageUrl: imageSrc
      });
      
      console.log(`  ✓ Found: ${name} (Tier ${tier})`);
    });
    
    console.log(`\nFound ${essences.length} essences\n`);
    
    // Ensure images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    
    // Download images
    console.log('Downloading essence images...\n');
    for (const essence of essences) {
      if (essence.imageUrl) {
        const imageFilename = `${essence.id}.png`;
        const imagePath = path.join(IMAGES_DIR, imageFilename);
        await downloadImage(essence.imageUrl, imagePath);
      } else {
        console.warn(`  ⚠ No image URL for: ${essence.name}`);
      }
    }
    
    // Remove imageUrl from final JSON (not needed in output)
    const essencesForJson = essences.map(({ imageUrl, ...rest }) => rest);
    
    // Save JSON file
    console.log(`\nSaving essences data to: ${OUTPUT_JSON}`);
    await fs.writeFile(
      OUTPUT_JSON,
      JSON.stringify(essencesForJson, null, 4),
      'utf-8'
    );
    
    console.log(`\n✓ Successfully saved ${essences.length} essences to ${OUTPUT_JSON}`);
    console.log(`✓ Images saved to ${IMAGES_DIR}\n`);
    
  } catch (error) {
    console.error('\n✗ Error fetching essences:', error);
    process.exit(1);
  }
}

// Run the script
fetchEssences();
