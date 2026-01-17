/**
 * JAGS execution logic via child_process
 * Executes JAGS model and returns posterior samples
 */

import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const JAGS_PATH = process.env.JAGS_PATH || 'jags';

/**
 * Execute JAGS model and return posterior samples
 * @param {Object} modelData - JAGS model data structure
 * @param {Object} options - Execution options
 * @param {number} options.numSamples - MCMC samples per chain (default: 5000)
 * @param {number} options.numChains - Number of MCMC chains (default: 4)
 * @param {number} options.burnIn - Burn-in iterations (default: 1000)
 * @returns {Promise<Object>} Posterior samples and diagnostics
 */
export async function executeJags(modelData, options = {}) {
  const {
    numSamples = 5000,
    numChains = 4,
    burnIn = 1000
  } = options;

  const tempDir = tmpdir();
  const timestamp = Date.now();
  const modelFile = join(tempDir, `jags_model_${timestamp}.jags`);
  const dataFile = join(tempDir, `jags_data_${timestamp}.R`);
  const scriptFile = join(tempDir, `jags_script_${timestamp}.txt`);
  const codaFile = join(tempDir, `jags_coda_${timestamp}`);

  try {
    // Write model file
    await writeFile(modelFile, modelData.model, 'utf8');

    // Write data file (R format for JAGS)
    await writeFile(dataFile, modelData.data, 'utf8');

    // Write JAGS script
    const jagsScript = `
model in "${modelFile}"
data in "${dataFile}"
compile, nchains(${numChains})
initialize
update ${burnIn}
monitor weights
update ${numSamples}
coda *, stem("${codaFile}")
exit
`;
    await writeFile(scriptFile, jagsScript, 'utf8');

    // Execute JAGS
    const jagsProcess = spawn(JAGS_PATH, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // Send script to JAGS stdin
    jagsProcess.stdin.write(jagsScript);
    jagsProcess.stdin.end();

    let stdout = '';
    let stderr = '';

    jagsProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    jagsProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for JAGS to complete (with timeout)
  const timeout = options.timeout || 60000; // 60 seconds default
  const executionPromise = new Promise((resolve, reject) => {
    jagsProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`JAGS execution failed with code ${code}: ${stderr || 'Unknown error'}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    jagsProcess.on('error', (err) => {
      if (err.code === 'ENOENT') {
        const errorMsg = `JAGS executable not found. Please ensure JAGS is installed and available in PATH.
        
Installation instructions:
- Windows: Download from https://sourceforge.net/projects/mcmc-jags/files/JAGS/4.x/
- macOS: Install via Homebrew: brew install jags
- Linux: Install via package manager: sudo apt-get install jags (Ubuntu/Debian) or sudo yum install jags (RHEL/CentOS)

After installation, verify with: jags --version

If JAGS is installed but not in PATH, set the JAGS_PATH environment variable:
- Windows: set JAGS_PATH=C:\\Program Files\\JAGS\\JAGS-4.3.0\\x64\\bin\\jags-terminal.exe
- Unix/Linux/macOS: export JAGS_PATH=/usr/local/bin/jags

Current JAGS_PATH setting: ${JAGS_PATH}`;
        reject(new Error(errorMsg));
      } else {
        reject(new Error(`JAGS execution error: ${err.message}`));
      }
    });
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      jagsProcess.kill('SIGTERM');
      reject(new Error(`JAGS execution timeout after ${timeout}ms`));
    }, timeout);
  });

    await Promise.race([executionPromise, timeoutPromise]);

    // Parse CODA output files
    const posteriorSamples = await parseCodaFiles(codaFile, modelData.itemIds);

    // Clean up temporary files
    await cleanupFiles([modelFile, dataFile, scriptFile, `${codaFile}1.txt`, `${codaFile}2.txt`, `${codaFile}Index.txt`]);

    return posteriorSamples;
  } catch (error) {
    // Clean up on error
    await cleanupFiles([modelFile, dataFile, scriptFile, `${codaFile}1.txt`, `${codaFile}2.txt`, `${codaFile}Index.txt`]).catch(() => {});
    throw error;
  }
}

/**
 * Parse JAGS CODA output files
 * @param {string} codaFilePrefix - Prefix for CODA files
 * @param {Array<string>} itemIds - Array of item IDs
 * @returns {Promise<Object>} Posterior samples per item
 */
async function parseCodaFiles(codaFilePrefix, itemIds) {
  const indexFile = `${codaFilePrefix}Index.txt`;
  const chainFiles = [];

  // Find all chain files
  for (let chain = 1; chain <= 4; chain++) {
    const chainFile = `${codaFilePrefix}${chain}.txt`;
    try {
      await readFile(chainFile, 'utf8');
      chainFiles.push(chainFile);
    } catch (err) {
      // Chain file doesn't exist, skip
    }
  }

  if (chainFiles.length === 0) {
    throw new Error('No CODA chain files found');
  }

  // Parse index file to get parameter names
  const indexContent = await readFile(indexFile, 'utf8');
  const parameterMap = {};
  const lines = indexContent.trim().split('\n');
  
  for (const line of lines) {
    const [name, start, end] = line.trim().split(/\s+/);
    if (name && name.startsWith('weights')) {
      const match = name.match(/weights\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]) - 1; // Convert to 0-based
        if (index < itemIds.length) {
          parameterMap[name] = itemIds[index];
        }
      }
    }
  }

  // Parse chain files and combine samples
  const samples = {};
  for (const itemId of itemIds) {
    samples[itemId] = [];
  }

  for (const chainFile of chainFiles) {
    const chainContent = await readFile(chainFile, 'utf8');
    const chainLines = chainContent.trim().split('\n');
    
    for (const line of chainLines) {
      const [paramName, value] = line.trim().split(/\s+/);
      if (paramName && parameterMap[paramName]) {
        const itemId = parameterMap[paramName];
        samples[itemId].push(parseFloat(value));
      }
    }
  }

  return samples;
}

/**
 * Clean up temporary files
 * @param {Array<string>} files - Array of file paths to delete
 */
async function cleanupFiles(files) {
  await Promise.all(
    files.map(file => 
      unlink(file).catch(() => {
        // Ignore errors if file doesn't exist
      })
    )
  );
}
