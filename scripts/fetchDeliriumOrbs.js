import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://www.poewiki.net/wiki/Delirium_orb';
const OUTPUT_JSON = path.join(__dirname, '../public/data/deliriumOrbs/deliriumOrbs.json');
const IMAGES_DIR = path.join(__dirname, '../public/assets/images/deliriumOrbs');

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
      // Extract path from thumbnail URL like /images/thumb/9/9a/Tainted_Catalyst_inventory_icon.png/78px-Tainted_Catalyst_inventory_icon.png
      // The actual image is at /images/9/9a/Tainted_Catalyst_inventory_icon.png
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
 * Main function to fetch and process delirium orbs
 */
async function fetchDeliriumOrbs() {
  console.log('Fetching delirium orbs from PoE Wiki...\n');
  
  try {
    // Fetch the wiki page
    console.log(`Fetching: ${WIKI_URL}`);
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wiki page: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the delirium orbs table - look for table with "List of delirium orbs" section
    const deliriumOrbs = [];
    
    // Find the table after "List of delirium orbs" heading
    let table = null;
    $('h2, h3').each((index, heading) => {
      const headingText = $(heading).text().trim();
      if (headingText.includes('List of delirium orbs') || headingText === 'List of delirium orbs') {
        // Find the next table after this heading
        let nextElement = $(heading).next();
        while (nextElement.length > 0) {
          if (nextElement.is('table')) {
            table = nextElement;
            return false; // Break the loop
          }
          nextElement = nextElement.next();
        }
      }
    });
    
    // Fallback: just get the first wikitable
    if (!table || table.length === 0) {
      table = $('table.wikitable').first();
    }
    
    if (table.length === 0) {
      throw new Error('Could not find delirium orbs table on the page');
    }
    
    console.log('Parsing delirium orbs table...\n');
    
    // Iterate through table rows (skip header row)
    table.find('tbody tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length < 2) {
        return; // Skip rows that don't have enough cells
      }
      
      // First cell contains the delirium orb name and image
      const $firstCell = $(cells[0]);
      
      // Extract delirium orb name from the link
      const nameLink = $firstCell.find('a[title]').first();
      let name = nameLink.attr('title') || nameLink.text().trim();
      
      // Fallback: try to get name from text content
      if (!name || name === '') {
        name = $firstCell.find('a').first().text().trim();
      }
      
      // Extract image URL
      const img = $firstCell.find('img').first();
      let imageSrc = img.attr('src') || img.attr('data-src');
      
      // Handle thumbnail images
      if (imageSrc && imageSrc.includes('/thumb/')) {
        // Keep the thumbnail URL, downloadImage will handle it
      }
      
      // Second cell contains the description/help text
      let helpText = '';
      if (cells.length > 1) {
        let helpTextHtml = $(cells[1]).html() || $(cells[1]).text();
        // Convert <br> tags to newlines
        helpTextHtml = helpTextHtml.replace(/<br\s*\/?>/gi, '\n');
        // Remove HTML tags but preserve structure
        helpTextHtml = helpTextHtml.replace(/<[^>]+>/g, '');
        helpText = cleanText(helpTextHtml);
      }
      
      if (!name || name === '') {
        console.warn(`  ⚠ Skipping row ${index + 1}: No name found`);
        return;
      }
      
      // Generate ID from name
      const id = toKebabCase(name);
      
      deliriumOrbs.push({
        id,
        name,
        helpText: helpText || undefined,
        imageUrl: imageSrc
      });
      
      console.log(`  ✓ Found: ${name}`);
    });
    
    console.log(`\nFound ${deliriumOrbs.length} delirium orbs\n`);
    
    // Ensure images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    
    // Download images
    console.log('Downloading delirium orb images...\n');
    for (const deliriumOrb of deliriumOrbs) {
      if (deliriumOrb.imageUrl) {
        const imageFilename = `${deliriumOrb.id}.png`;
        const imagePath = path.join(IMAGES_DIR, imageFilename);
        await downloadImage(deliriumOrb.imageUrl, imagePath);
      } else {
        console.warn(`  ⚠ No image URL for: ${deliriumOrb.name}`);
      }
    }
    
    // Remove imageUrl from final JSON (not needed in output)
    const deliriumOrbsForJson = deliriumOrbs.map(({ imageUrl, ...rest }) => {
      // Remove helpText if it's empty/undefined
      if (!rest.helpText) {
        const { helpText, ...restWithoutHelp } = rest;
        return restWithoutHelp;
      }
      return rest;
    });
    
    // Save JSON file
    console.log(`\nSaving delirium orbs data to: ${OUTPUT_JSON}`);
    await fs.writeFile(
      OUTPUT_JSON,
      JSON.stringify(deliriumOrbsForJson, null, 4),
      'utf-8'
    );
    
    console.log(`\n✓ Successfully saved ${deliriumOrbs.length} delirium orbs to ${OUTPUT_JSON}`);
    console.log(`✓ Images saved to ${IMAGES_DIR}\n`);
    
  } catch (error) {
    console.error('\n✗ Error fetching delirium orbs:', error);
    process.exit(1);
  }
}

// Run the script
fetchDeliriumOrbs();
