import fs from 'fs'

import { log } from '../utils/logging.mjs'

// run with node --env-file=.env app.mjs
const TOKEN = process.env.FIGMA_ACCESS_TOKEN
const FILE_KEY = process.env.FIGMA_FILE_KEY
const URL_BASE = 'https://api.figma.com/v1/files'
const URL_BASE_IMAGES = 'https://api.figma.com/v1/images'
// The name of the variant for each icon you want to export.
// If you dont have variants, you'll need to modify this script.
const ICON_VARIANT_NAME = 'size=16'
// The node ids from root to icon component parent.
const ROOT_TRAVERSE_IDS = ['28:2', '10:965'] // Page ID > Section ID
// Skipping REST API allows you to run this script using ./icons.json, icons-index.txt, and icons.figma.txt in their current state.
const SKIP_REST_API = process.argv.includes('--skip-rest-api')

/**
 * Get icon data from Figma and write data to disk (unless skipping REST API)
 * Create Code Connect docs (single file), create icon React component files, and create index file export.
 */
async function go() {
  log.header('Figma Icon Export Tool')

  if (SKIP_REST_API) {
    log.info('Skipping Figma REST API - using cached data')
  } else {
    log.info('Environment check:')
    log.debug(`FIGMA_ACCESS_TOKEN: ${TOKEN ? '✓ Set' : '✗ Missing'}`)
    log.debug(`FIGMA_FILE_KEY: ${FILE_KEY ? '✓ Set' : '✗ Missing'}`)

    if (!TOKEN || !FILE_KEY) {
      log.error('Missing required environment variables!')
      log.info(
        'Please set FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY in your .env file'
      )
      process.exit(1)
    }
  }

  // Writing the data files to disk based on icons in Figma.
  // Storing data to disk allows us to parse it later, independent of REST API requests if we want to change the output.
  if (!SKIP_REST_API) {
    log.step('Fetching icon data from Figma API...')
    // Get icon data from Figma
    const data = await getIconComponents()
    const names = data.map((a) => a[0]).sort()
    log.success(`Found ${names.length} icons to process`)

    log.step('Writing temporary files to disk...')
    // Write Figma code connect file import statement to disk (".txt" extension prevents unnecessary parsing)
    // This file is not complete yet and only includes the imports. We will write the actual docs to it later.
    fs.writeFileSync(
      './icons.figma.txt',
      `import figma from "@figma/code-connect";\nimport {${names.join(', ')}} from "icons";`
    )
    log.debug('Created icons.figma.txt')

    // Write index export file to disk (".txt" extension prevents unnecessary parsing)
    fs.writeFileSync(
      './icons-index.txt',
      names.map((n) => `export { ${n} } from "./${n}.tsx";`).join('\n')
    )
    log.debug('Created icons-index.txt')

    // Write icon component JSON data file to disk (used for both code connect docs and React component file gen)
    fs.writeFileSync('./icons.json', JSON.stringify(data, null, 2))
    log.debug('Created icons.json')
    log.success('Temporary files written successfully')
  }

  log.step('Processing icon components...')
  // Parse the JSON icon component data
  const json = JSON.parse(fs.readFileSync('./icons.json'))
  log.info(`Processing ${json.length} icon components`)

  // Copy the index file over to the src and change extension to TypeScript.
  fs.copyFileSync('./icons-index.txt', '../../src/ui/icons/index.ts')
  log.debug('Copied index file to src/ui/icons/index.ts')

  // Loading up the Figma file with the imports already written to it
  const figmaStarter = fs.readFileSync('./icons.figma.txt')
  // Writing the official Code Connect Figma doc with the Code Connect from the JSON data appended to it.
  fs.writeFileSync(
    '../../src/figma/icons/icons.figma.tsx',
    `${figmaStarter}\n${json.map((a) => a[2]).join('\n')}`
  )
  log.debug('Generated Figma Code Connect file')

  log.step('Generating React component files...')
  // Writing each Icon React component file to disk. Additive only, does not delete old icons.
  await Promise.all(
    json.map(
      ([fileName, fileContents]) =>
        new Promise((resolve, reject) => {
          fs.writeFile(
            `../../src/ui/icons/${fileName}.tsx`,
            fileContents,
            (err) => {
              if (err) {
                log.error(`Failed to write ${fileName}.tsx:`, err.message)
                reject(err)
              } else {
                log.debug(`Generated ${fileName}.tsx`)
                resolve()
              }
            }
          )
        })
    )
  )

  log.success('Icon export completed successfully!')
  log.info(`Generated ${json.length} React icon components`)
}

go().catch((error) => {
  log.error('Script failed:', error.message)
  if (error.stack) {
    log.debug('Stack trace:')
    console.log(colors.gray + error.stack + colors.reset)
  }
  process.exit(1)
})

/**
 * Getting all file data from Figma, then parsing it into icon component data
 * @link https://www.figma.com/developers/api#get-files-endpoint
 * @returns {Promise<string[][]>}
 */
async function getIconComponents() {
  try {
    log.debug('Making request to Figma API...')
    const fileResponse = await fetch(`${URL_BASE}/${FILE_KEY}`, {
      method: 'GET',
      headers: { 'X-FIGMA-TOKEN': TOKEN },
    })

    if (!fileResponse.ok) {
      throw new Error(
        `Figma API request failed: ${fileResponse.status} ${fileResponse.statusText}`
      )
    }

    const data = await fileResponse.json()

    log.success('Successfully fetched file data from Figma')

    return await fileRESTResponseToIconComponentsJSON(data)
  } catch (e) {
    log.error('Failed to get icon components:', e.message)
    throw e
  }
}

/**
 * Getting image urls from figma for each icon component
 * @link https://www.figma.com/developers/api#get-images-endpoint
 * @param {string[]} nodeIds - array of node ids to export as svg.
 * @returns {{err: string, images: Map<string, string>, status: number}}
 */
async function getSVGImages(nodeIds) {
  try {
    log.debug(`Requesting SVG exports for ${nodeIds.length} icons...`)
    const fileResponse = await fetch(
      `${URL_BASE_IMAGES}/${FILE_KEY}?format=svg&ids=${nodeIds.join(',')}`,
      {
        method: 'GET',
        headers: { 'X-FIGMA-TOKEN': TOKEN },
      }
    )

    if (!fileResponse.ok) {
      throw new Error(
        `Figma Images API request failed: ${fileResponse.status} ${fileResponse.statusText}`
      )
    }

    const result = await fileResponse.json()
    log.success('Successfully requested SVG exports from Figma')
    return result
  } catch (e) {
    log.error('Failed to get SVG images:', e.message)
    throw e
  }
}

/**
 * Traverse a Figma file response for all icons, get their svg image data,
 *   and transform it into the data we're storing locally.
 * @param {{document: Node}} response Figma GET file response
 * @returns {Promise<string[][]>} - Array<[IconName, IconSVGString, IconCodeConnectString]>
 */
async function fileRESTResponseToIconComponentsJSON(response) {
  log.step('Processing Figma file structure...')

  // Function to traverse to the parent node containing icons
  const traverseToParentNode = async () => {
    // Starting parent node is the document. Will traverse children to find icons' parent.
    let parentNode = response.document

    // Traversing from root to the icon parent node (likely a page or section)
    // This constant is an array of ids to follow to get to the icons.
    ROOT_TRAVERSE_IDS.forEach((id) => {
      const nextNode = parentNode.children.find((page) => page.id === id)
      if (!nextNode) {
        throw new Error(`Could not find node with ID: ${id}`)
      }
      parentNode = nextNode
    })

    log.debug(`Traversed to parent node: ${parentNode.id}`)
    return parentNode
  }

  const parentNode = await traverseToParentNode()

  const idsToNameAndComponentSetId = {}
  if (parentNode) {
    // For each child of the parent node, find the icons (variant or main component)
    parentNode.children.forEach((component) => {
      // The icon. Is either a child of a component set or the component itself.
      // Any other node type we ignore.
      const icon =
        component.type === 'COMPONENT_SET'
          ? component.children.find((child) => child.name === ICON_VARIANT_NAME)
          : component.type === 'COMPONENT'
            ? component
            : null
      if (icon) {
        const iconName =
          'Icon' +
          component.name
            .split(/[^a-zA-Z0-9]+/)
            .map((a) => a.charAt(0).toUpperCase() + a.substring(1))
            .join('')
        idsToNameAndComponentSetId[icon.id] = [iconName, component.id]
      }
    })
  }

  const nodeIds = Object.keys(idsToNameAndComponentSetId)
  log.success(`Found ${nodeIds.length} icons to process`)

  // SVG export for all the icon nodes we found.
  const { images } = await getSVGImages(nodeIds)

  // Waiting a bit for the images to exist on S3. Rarely, it can take a second.
  log.info('Waiting 10 seconds for Figma to process SVG exports...')
  await new Promise((resolve) => setTimeout(resolve, 10000))
  log.success('Proceeding with SVG processing')

  // We ultimately write three files to disk. Our result holds the data.
  const result = []
  // We occasionally fail due to assets not existing on S3.
  // We store those here and revisit a second time.
  const fails = []

  log.step('Processing SVG exports (first attempt)...')
  // Initial attempt to get all node images
  await Promise.all(
    nodeIds.map(async (nodeId) => {
      try {
        await processNodeId(nodeId)
      } catch (e) {
        fails.push(nodeId)
        log.warning(
          `Failed to process ${idsToNameAndComponentSetId[nodeId][0]} (will retry)`
        )
      }
    })
  )

  if (fails.length > 0) {
    log.warning(`Retrying ${fails.length} failed icon(s)...`)
    // Second attempt for failed attempts.
    await Promise.all(
      fails.map(async (nodeId) => {
        try {
          await processNodeId(nodeId)
        } catch (e) {
          log.error(
            `Failed to process ${idsToNameAndComponentSetId[nodeId][0]} after retry:`,
            e.message
          )
          log.debug(`Node ID: ${nodeId}, URL: ${images[nodeId]}`)
        }
      })
    )
  } else {
    log.success('All icons processed successfully on first attempt')
  }

  /**
   * Get the component name, svg code strings, and code connect doc strings
   * @param {string} nodeId
   */
  async function processNodeId(nodeId) {
    const [name, componentSetId] = idsToNameAndComponentSetId[nodeId]

    // Fetch the S3 url
    const fileResponse = await fetch(images[nodeId], { method: 'GET' })

    if (!fileResponse.ok) {
      throw new Error(
        `Failed to fetch SVG for ${name}: ${fileResponse.status} ${fileResponse.statusText}`
      )
    }

    // Get the raw SVG string from the response
    const svg = await fileResponse.text()

    if (!svg || svg.trim() === '') {
      throw new Error(`Empty SVG response for ${name}`)
    }

    // Get the name and component set node id
    const figmaString = []
    // Building out an svg React component string...
    const svgString = [
      'import { type IconProps, Icon } from "primitives";',
      `export const ${name} = (props: IconProps) => (`,
    ]
    // Clean the raw SVG response up (SVG children only, <svg> tag handled by wrapping Icon component)
    const cleanSvg = svg
      .replace(/<svg[^>]+>/, '')
      .replace(/<\/svg>/, '')
      // Remove fill and stroke attributes entirely
      .replace(/\s*fill="[^"]*"/g, '')
      .replace(/\s*stroke="[^"]*"/g, '')
      // Convert SVG attributes to React props AFTER removing fill/stroke
      .replace(
        /(fill|stroke|line|clip)-(.)/g,
        (_, p1, p2) => p1 + p2.toUpperCase()
      )
      .replace(/\n/g, '')

    // Wrap the cleaned svg in our Icon component (paths only)
    svgString.push(`  <Icon {...props}>${cleanSvg}</Icon>`)
    svgString.push(');')
    // Code Connect doc code
    figmaString.push(
      `figma.connect(${name}, "<FIGMA_ICONS_BASE>?node-id=${componentSetId}", { props: { size: figma.enum("Size", { "20": "20", "24": "24", "32": "32", "40": "40", "48": "48" }) }, example: ({ size }) => <${name} size={size} /> });`
    )
    // Add the strings for this component into our result.
    result.push([name, svgString.join('\n'), figmaString.join('\n')])
    log.debug(`✓ Processed ${name}`)
  }

  const successCount = result.length
  const failCount = nodeIds.length - successCount

  if (successCount > 0) {
    log.success(
      `Successfully processed ${successCount} icon${successCount !== 1 ? 's' : ''}`
    )
  }
  if (failCount > 0) {
    log.warning(
      `${failCount} icon${failCount !== 1 ? 's' : ''} failed to process`
    )
  }

  return result
}
