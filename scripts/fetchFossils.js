import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://www.poewiki.net/wiki/List_of_fossils';
const OUTPUT_JSON = path.join(__dirname, '../public/data/fossils/fossils.json');
const IMAGES_DIR = path.join(__dirname, '../public/assets/images/fossils');

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
 * Main function to fetch and process fossils
 */
async function fetchFossils() {
  console.log('Fetching fossils from PoE Wiki...\n');
  
  try {
    // Fetch the wiki page
    console.log(`Fetching: ${WIKI_URL}`);
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wiki page: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the fossils table
    const fossils = [];
    const table = $('table.wikitable').first();
    
    if (table.length === 0) {
      throw new Error('Could not find fossils table on the page');
    }
    
    console.log('Parsing fossils table...\n');
    
    // Iterate through table rows (skip header row)
    table.find('tbody tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length < 2) {
        return; // Skip rows that don't have enough cells
      }
      
      // First cell contains the fossil name and image
      const $firstCell = $(cells[0]);
      
      // Extract fossil name from the link
      const nameLink = $firstCell.find('a[title]').first();
      let name = nameLink.attr('title') || nameLink.text().trim();
      
      // Fallback: try to get name from text content
      if (!name || name === '') {
        name = $firstCell.find('a').first().text().trim();
      }
      
      // Extract image URL
      const img = $firstCell.find('img').first();
      const imageSrc = img.attr('src') || img.attr('data-src');
      
      // Second cell contains the description
      let description = $(cells[1]).html() || $(cells[1]).text();
      // Convert <br> tags to newlines
      description = description.replace(/<br\s*\/?>/gi, '\n');
      // Remove HTML tags but preserve structure
      description = description.replace(/<[^>]+>/g, '');
      // Clean up the text
      description = cleanText(description);
      
      // Fifth cell (index 4) contains additional drop restrictions
      let dropRestrictions = '';
      if (cells.length > 4) {
        const dropRestrictionsHtml = $(cells[4]).html() || $(cells[4]).text();
        dropRestrictions = cleanDropRestrictions(dropRestrictionsHtml);
      }
      
      // Fallback: if no drop restrictions in 5th cell, check 3rd cell (drop areas)
      if (!dropRestrictions && cells.length > 2) {
        const dropAreasHtml = $(cells[2]).html() || $(cells[2]).text();
        const dropAreas = cleanDropRestrictions(dropAreasHtml);
        if (dropAreas && dropAreas !== '—' && dropAreas !== '') {
          dropRestrictions = dropAreas;
        }
      }
      
      if (!name || name === '') {
        console.warn(`  ⚠ Skipping row ${index + 1}: No name found`);
        return;
      }
      
      // Generate ID from name
      const id = toKebabCase(name);
      
      fossils.push({
        id,
        name,
        description,
        dropRestrictions: dropRestrictions || undefined,
        imageUrl: imageSrc
      });
      
      console.log(`  ✓ Found: ${name}`);
    });
    
    console.log(`\nFound ${fossils.length} fossils\n`);
    
    // Ensure images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    
    // Download images
    console.log('Downloading fossil images...\n');
    for (const fossil of fossils) {
      if (fossil.imageUrl) {
        const imageFilename = `${fossil.id}.png`;
        const imagePath = path.join(IMAGES_DIR, imageFilename);
        await downloadImage(fossil.imageUrl, imagePath);
      } else {
        console.warn(`  ⚠ No image URL for: ${fossil.name}`);
      }
    }
    
    // Remove imageUrl from final JSON (not needed in output)
    const fossilsForJson = fossils.map(({ imageUrl, ...rest }) => {
      // Remove dropRestrictions if it's empty/undefined
      if (!rest.dropRestrictions) {
        const { dropRestrictions, ...restWithoutDrop } = rest;
        return restWithoutDrop;
      }
      return rest;
    });
    
    // Save JSON file
    console.log(`\nSaving fossils data to: ${OUTPUT_JSON}`);
    await fs.writeFile(
      OUTPUT_JSON,
      JSON.stringify(fossilsForJson, null, 4),
      'utf-8'
    );
    
    console.log(`\n✓ Successfully saved ${fossils.length} fossils to ${OUTPUT_JSON}`);
    console.log(`✓ Images saved to ${IMAGES_DIR}\n`);
    
  } catch (error) {
    console.error('\n✗ Error fetching fossils:', error);
    process.exit(1);
  }
}

// Run the script
fetchFossils();
