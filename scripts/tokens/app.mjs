import fs from 'fs'
import {
  getFileStyles,
  getFileVariables,
  KEY_PREFIX_COLLECTION,
} from './fromFigma.mjs'

import { log } from '../utils/logging.mjs'

// Constants
const FILE_KEY = process.env.FIGMA_FILE_KEY
const SKIP_REST_API = process.argv.includes('--skip-rest-api')
const WRITE_DIR = '../../src'
const CONVERT_TO_REM = true
const NAMESPACE = 'com.skon.msd'
const TOKEN_PREFIX = 'msd-'

// Collection configuration
const COLLECTION_DATA = {
  color_primitives: {
    settings: { prefix: 'color' },
  },
  color_semantics: {
    settings: {
      prefix: 'color',
      colorSchemes: ['light'],
      colorSchemesDark: ['dark'],
      colorSchemeLightRemove: 'light',
      colorSchemeDarkRemove: 'dark',
      replacements: {
        color_primitives: 'color',
      },
    },
  },
}

// Utilities
const readJSONFile = (path) => {
  log.debug(`Reading JSON file: ${path}`)
  try {
    const data = JSON.parse(fs.readFileSync(path))
    log.success(`Successfully read JSON file: ${path}`)
    return data
  } catch (error) {
    log.error(`Failed to read JSON file: ${path}`, error.message)
    throw error
  }
}

const writeJSONFile = (path, data) => {
  log.debug(`Writing JSON file: ${path}`)
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
    log.success(`Successfully wrote JSON file: ${path}`)
  } catch (error) {
    log.error(`Failed to write JSON file: ${path}`, error.message)
    throw error
  }
}

const writeTextFile = (path, content) => {
  log.debug(`Writing text file: ${path}`)
  try {
    fs.writeFileSync(path, content)
    log.success(
      `Successfully wrote text file: ${path} (${content.length} characters)`
    )
  } catch (error) {
    log.error(`Failed to write text file: ${path}`, error.message)
    throw error
  }
}

const applyReplacements = (replacements) => (value) => {
  if (typeof value !== 'string') return value
  const originalValue = value
  const result = Object.entries(replacements)
    .reduce((acc, [find, replace]) => acc.replace(find, replace), value)
    .toLowerCase()

  if (originalValue !== result) {
    log.debug(`Applied replacements: "${originalValue}" → "${result}"`)
  }

  return result
}

const sanitizeName = (name) =>
  name
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .replace(/ +/g, '-')
    .toLowerCase()

const createProperty = (keys) => `--${keys.join('-')}`

const createPropertyName = (keys) => {
  const propertyNameFull = keys
    .map((key) =>
      key
        .split(/[^\dA-Za-z]/)
        .map((k) => `${k.charAt(0).toUpperCase()}${k.slice(1)}`)
        .join('')
    )
    .join('')
  return propertyNameFull.charAt(0).toLowerCase() + propertyNameFull.slice(1)
}

// Add this helper to convert a @tailwind reference to a CSS var
const tailwindRefToCSSVar = (ref) => {
  // Example: {@tailwind.colors.neutral.100} → var(--color-neutral-100)
  const match = ref.match(
    /^\{@tailwind\.colors\.([a-zA-Z0-9_-]+)(?:\.([0-9]+))?\}$/
  )
  if (match) {
    const color = match[1]
    const shade = match[2]
    return `var(--color-${color}${shade ? '-' + shade : ''})`
  }
  // fallback: just return the original
  return ref
}

// Patch valueToCSS to handle @tailwind references
const valueToCSS = (
  property,
  value,
  definitionsKey,
  convertPixelToRem,
  prefix = ''
) => {
  // Handle @tailwind references
  if (typeof value === 'string' && value.startsWith('{@tailwind.colors.')) {
    return tailwindRefToCSSVar(value)
  }
  // Handle references to your own primitives, e.g. {@color_primitives.brand.500}
  if (typeof value === 'string' && value.startsWith('{@color_primitives.')) {
    // Extract color and shade
    const match = value.match(
      /^\{@color_primitives\.([a-zA-Z0-9_-]+)\.([0-9]+)\}$/
    )
    if (match) {
      const color = match[1]
      const shade = match[2]
      return `var(--msd-color-${color}-${shade})`
    }
  }
  if (value.toString().charAt(0) === '{')
    return `var(--${value
      .replace(`${definitionsKey}`, prefix)
      .replace(/[\. ]/g, '-')
      .replace(/^\{/, '')
      .replace(/\}$/, '')})`

  const valueIsDigits = value.toString().match(/^-?\d+(\.\d+)?$/)
  const isRatio = property.match(/(ratio-)/)
  const isNumeric =
    valueIsDigits && !property.match(/(weight|ratio-)/) && !isRatio

  if (isNumeric) {
    return convertPixelToRem ? `${parseInt(value) / 16}rem` : `${value}px`
  } else if (isRatio) {
    return Math.round(value * 10000) / 10000
  }

  if (property.match('family-mono')) {
    return `"${value}", monospace`
  } else if (property.match('family-sans')) {
    return `"${value}", sans-serif`
  } else if (property.match('family-serif')) {
    return `"${value}", serif`
  }

  return value
}

const processTokenValue = (
  object,
  property,
  propertyName,
  definitionsKey,
  convertPixelToRem,
  prefix,
  valueWithReplacements
) => {
  const type = object.$type || ''
  const description = object.$description || ''

  if ('$extensions' in object && NAMESPACE in object.$extensions) {
    const figmaId = object.$extensions[NAMESPACE].figmaId
    return Object.entries(object.$extensions[NAMESPACE].modes).map(
      ([mode, modeValue]) => ({
        mode,
        token: {
          property,
          propertyName,
          figmaId,
          description,
          value: valueWithReplacements(
            valueToCSS(
              property,
              modeValue,
              definitionsKey,
              convertPixelToRem,
              prefix
            )
          ),
          type,
        },
      })
    )
  } else {
    const figmaId =
      '$extensions' in object && NAMESPACE in object.$extensions
        ? object.$extensions[NAMESPACE].figmaId
        : 'UNDEFINED'
    return [
      {
        mode: 'default',
        token: {
          property,
          propertyName,
          description,
          figmaId,
          value: valueWithReplacements(
            valueToCSS(
              property,
              object.$value,
              definitionsKey,
              convertPixelToRem,
              ''
            )
          ),
          type,
        },
      },
    ]
  }
}

const traverseTokens = (
  object,
  replacements,
  definitionsKey,
  prefix,
  convertPixelToRem,
  currentType,
  keys
) => {
  const property = createProperty(keys)
  const propertyName = createPropertyName(keys)
  const valueWithReplacements = applyReplacements(replacements)
  const type = object.$type || currentType

  if ('$value' in object) {
    return processTokenValue(
      object,
      property,
      propertyName,
      definitionsKey,
      convertPixelToRem,
      prefix,
      valueWithReplacements
    )
  } else {
    return Object.entries(object)
      .filter(([key]) => key.charAt(0) !== '$')
      .flatMap(([key, value]) =>
        traverseTokens(
          value,
          replacements,
          definitionsKey,
          prefix,
          convertPixelToRem,
          type,
          [...keys, key]
        )
      )
  }
}

const processCollection = (data, collectionSettings, definitionsKey) => {
  log.step(`Processing collection: ${definitionsKey}`)

  const {
    replacements = {},
    convertPixelToRem = CONVERT_TO_REM,
    prefix,
  } = collectionSettings.settings

  const fullPrefix = `${TOKEN_PREFIX}${prefix}`
  log.debug(
    `Collection settings - Prefix: ${fullPrefix}, Convert to REM: ${convertPixelToRem}`
  )

  if (Object.keys(replacements).length > 0) {
    log.debug('Replacements configured:')
    Object.entries(replacements).forEach(([find, replace]) => {
      log.debug(`  "${find}" → "${replace}"`)
    })
  }

  const tokens = traverseTokens(
    data[definitionsKey],
    replacements,
    definitionsKey,
    fullPrefix,
    convertPixelToRem,
    '',
    fullPrefix ? [fullPrefix] : undefined
  )

  const definitions = tokens.reduce((definitions, { mode, token }) => {
    definitions[mode] = definitions[mode] || []
    definitions[mode].push(token)
    return definitions
  }, {})

  const tokenCount = Object.values(definitions).reduce(
    (sum, tokens) => sum + tokens.length,
    0
  )
  const modeCount = Object.keys(definitions).length

  log.success(
    `Processed ${tokenCount} tokens across ${modeCount} mode(s) for collection: ${definitionsKey}`
  )
  log.debug(`Modes: ${Object.keys(definitions).join(', ')}`)

  return definitions
}

// CSS generation functions
const drawCSSPropLines = (lines = [], indent = '  ') => {
  if (!lines || lines.length === 0) {
    log.warning(`No CSS properties to generate - skipping empty rule block`)
    return ''
  }

  return (
    lines
      .sort((a, b) => (a.property > b.property ? 1 : -1))
      .map((l) => `${indent}${l.property}: ${l.value}`)
      .join(';\n') + ';'
  )
}

const generateColorSchemeCSS = (definitions, settings, key) => {
  log.debug(`Generating color scheme CSS for: ${key}`)
  log.debug(
    `Available modes in definitions: ${Object.keys(definitions).join(', ')}`
  )
  log.debug(`Expected light schemes: ${settings.colorSchemes.join(', ')}`)
  if (settings.colorSchemesDark) {
    log.debug(`Expected dark schemes: ${settings.colorSchemesDark.join(', ')}`)
  }

  // Debug: Check what's actually in each mode
  Object.entries(definitions).forEach(([mode, tokens]) => {
    log.debug(`Mode "${mode}" contains ${tokens.length} tokens`)
  })

  const lines = []

  settings.colorSchemes.forEach((scheme, i) => {
    const tokens = definitions[scheme]
    log.debug(
      `Looking for scheme "${scheme}", found ${tokens ? tokens.length : 0} tokens`
    )
    if (!tokens || tokens.length === 0) {
      log.warning(`No tokens found for scheme: ${scheme} - skipping`)
      return
    }

    const cssProps = drawCSSPropLines(tokens, '  ')

    // Only generate CSS rule if there are properties to include
    if (cssProps) {
      if (i === 0) {
        lines.push(`/* ${key}: ${scheme} (default) */`, ':root {')
        log.debug(`Generated default root styles for scheme: ${scheme}`)
      } else {
        lines.push(
          `/* ${key}: ${scheme} */`,
          `.${TOKEN_PREFIX}scheme-${key}-${scheme.replace(settings.colorSchemeLightRemove, '')} {`
        )
        log.debug(`Generated class styles for scheme: ${scheme}`)
      }
      lines.push(cssProps, '}')
    } else {
      log.warning(`Skipping empty CSS rule block for scheme: ${scheme}`)
    }
  })

  if (settings.colorSchemesDark) {
    const darkModeLines = []

    settings.colorSchemesDark.forEach((scheme, i) => {
      const cssProps = drawCSSPropLines(definitions[scheme], '    ')

      // Only generate CSS rule if there are properties to include
      if (cssProps) {
        if (i === 0) {
          darkModeLines.push(`  /* ${key}: ${scheme} (default) */`, '  .dark {')
          log.debug(
            `Generated dark mode default root styles for scheme: ${scheme}`
          )
        } else {
          darkModeLines.push(
            `  /* ${key}: ${scheme} */`,
            `  .${TOKEN_PREFIX}scheme-${key}-${scheme.replace(settings.colorSchemeDarkRemove, '')} {`
          )
          log.debug(`Generated dark mode class styles for scheme: ${scheme}`)
        }
        darkModeLines.push(cssProps, '  }')
      } else {
        log.warning(
          `Skipping empty dark mode CSS rule block for scheme: ${scheme}`
        )
      }
    })

    // Only add media query if there are dark mode rules to include
    if (darkModeLines.length > 0) {
      log.debug('Adding dark mode media query', darkModeLines)
      lines.push(
        // '@media (prefers-color-scheme: dark) {'
        // '.dark {',
        ...darkModeLines
        // '}'
      )
    } else {
      log.warning(`No dark mode CSS rules generated - skipping media query`)
    }
  }

  log.success(`Generated ${lines.length} CSS lines for color scheme: ${key}`)
  return lines
}

const generateDefaultCSS = (definitions, key) => {
  log.debug(`Generating default CSS for: ${key}`)

  const lines = []
  let first = true

  Object.entries(definitions).forEach(([modeName, tokens]) => {
    if (first) {
      first = false
      lines.push(`/* ${key}: ${modeName} (default) */`, ':root {')
      log.debug(
        `Generated default root styles for mode: ${modeName} (${tokens.length} tokens)`
      )
    } else {
      lines.push(
        `/* ${key}: ${modeName} */`,
        `.${TOKEN_PREFIX}theme-${key}-${modeName} {`
      )
      log.debug(
        `Generated class styles for mode: ${modeName} (${tokens.length} tokens)`
      )
    }
    lines.push(drawCSSPropLines(tokens, '  '), '}')
  })

  log.success(`Generated ${lines.length} CSS lines for collection: ${key}`)
  return lines
}

const generateTailwindThemeBlock = (processed) => {
  log.step('Generating Tailwind theme block')

  const themeVars = []

  Object.entries(processed).forEach(([collectionKey, collectionData]) => {
    const { definitions, settings } = collectionData

    // Get the first mode's tokens (usually 'default' or 'light')
    const firstModeKey = Object.keys(definitions)[0]
    const tokens = definitions[firstModeKey] || []

    log.debug(
      `Processing ${tokens.length} tokens from collection: ${collectionKey}`
    )

    tokens.forEach((token) => {
      // Convert CSS custom property to Tailwind theme variable
      // --msd-color-brand-500 becomes --color-msd-brand-500
      const tailwindVar = token.property.replace('--msd-color', '--color-msd')
      const cssVar = `var(${token.property})`

      themeVars.push(`  ${tailwindVar}: ${cssVar};`)
    })
  })

  if (themeVars.length === 0) {
    log.warning('No theme variables generated for Tailwind block')
    return []
  }

  // Sort the variables for consistent output
  themeVars.sort()

  const themeBlock = ['@theme inline static {', ...themeVars, '}']

  log.success(
    `Generated Tailwind theme block with ${themeVars.length} variables`
  )
  return themeBlock
}

const fileStringCSSFromProcessedObject = (data, key) => {
  const { definitions, settings } = data

  return settings.colorSchemes
    ? generateColorSchemeCSS(definitions, settings, key)
    : generateDefaultCSS(definitions, key)
}

const generateVariableSyntaxSnippet = (processed) => {
  const drawVariableSyntaxAndDescription = (linesObject = { default: [] }) => {
    const lines = linesObject[Object.keys(linesObject)[0]]
    return lines
      .map(
        (l) =>
          `  ["${l.figmaId}", "var(${l.property})", "${l.description || ''}"]`
      )
      .sort()
      .join(',\n')
  }

  return `
  // This file is automatically generated by scripts/tokens/app.mjs!
  // It contains a snippet to update Figma variable syntax and descriptions via the Figma Plugin API.
  // To use, copy the contents of this file and run it in the Figma console (F12) on a file with the relevant variables.
  // Make sure to run it in a file that has the variables already created, otherwise it won't find them.
  // You can get the variable IDs by inspecting the variable in Figma and looking at the URL (the part after "variables/").

  Promise.all([
${Object.keys(processed)
  .map((key) => drawVariableSyntaxAndDescription(processed[key].definitions))
  .sort()
  .join(',\n')},
].map(async ([variableId, webSyntax, description]) => {
  const variable = await figma.variables.getVariableByIdAsync(variableId);
  if (variable) {
    variable.setVariableCodeSyntax("WEB", webSyntax);
    variable.description = description;
  }
  return;
})).then(() => console.log("DONE!")).catch(console.error)`
}

const processTokenJSON = (data) => {
  log.step('Processing token collections')

  const availableCollections = Object.keys(data)
  const configuredCollections = Object.keys(COLLECTION_DATA)

  log.debug('Available collections in data:')
  availableCollections.forEach((collection) => {
    log.debug(`  • ${collection}`)
  })

  log.debug('Configured collections:')
  configuredCollections.forEach((collection) => {
    const isAvailable = availableCollections.includes(
      `${KEY_PREFIX_COLLECTION}${collection}`
    )
    log.debug(`  ${isAvailable ? '✓' : '✗'} ${collection}`)
  })

  // Remove @tailwind from data so it's never processed
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== '@tailwind')
  )

  const processed = Object.entries(COLLECTION_DATA).reduce(
    (acc, [key, collectionData]) => {
      // Don't process tailwind collection
      if (key === 'tailwind') return acc
      acc[key] = {
        ...collectionData,
        definitions: processCollection(
          filteredData,
          collectionData,
          `${KEY_PREFIX_COLLECTION}${key}`
        ),
      }
      return acc
    },
    {}
  )

  log.step('Generating CSS output')
  const fileStringCSSLines = [
    '/*',
    ' * This file is automatically generated by scripts/tokens/app.mjs!',
    ' */',
  ]

  Object.entries(processed).forEach(([key, processedData]) => {
    log.debug(`Generating CSS for collection: ${key}`)
    const cssLines = fileStringCSSFromProcessedObject(processedData, key)
    fileStringCSSLines.push(...cssLines)
    log.debug(`Added ${cssLines.length} CSS lines for collection: ${key}`)
  })

  log.step('Generating Figma variable syntax snippet')
  const syntaxSnippet = generateVariableSyntaxSnippet(processed)
  writeTextFile('./tokenVariableSyntaxAndDescriptionSnippet.js', syntaxSnippet)
  log.success('Generated Figma variable syntax snippet')

  const totalCSSLines = fileStringCSSLines.length
  log.success(`Generated ${totalCSSLines} total CSS lines from all collections`)

  return { processed, themeCSS: fileStringCSSLines }
}

// Style processing functions
const valueFromPossibleVariable =
  (variablesLookup) =>
  (item = '') => {
    if (typeof item === 'object') {
      const variable = variablesLookup[item.id]
      return variable ? `var(${variable.property})` : JSON.stringify(item)
    } else if (item.match(/^[1-9]00$/)) {
      const variable = Object.values(variablesLookup).find(
        ({ value }) => value === item
      )
      return variable ? `var(${variable.property})` : item
    }
    return item
  }

const formatEffect =
  (valueFromVar) =>
  ({ type, ...effect }) => {
    if (type === 'DROP_SHADOW' || type === 'INNER_SHADOW') {
      const {
        radius,
        offset: { x, y },
        spread,
        hex,
        boundVariables,
      } = effect
      const numbers = [
        boundVariables.offsetX
          ? valueFromVar(boundVariables.offsetX)
          : `${x}px`,
        boundVariables.offsetY
          ? valueFromVar(boundVariables.offsetY)
          : `${y}px`,
        boundVariables.radius
          ? valueFromVar(boundVariables.radius)
          : `${radius}px`,
        boundVariables.spread
          ? valueFromVar(boundVariables.spread)
          : `${spread}px`,
        boundVariables.color ? valueFromVar(boundVariables.color) : `${hex}px`,
      ]
      return `${type === 'INNER_SHADOW' ? 'inset ' : ''}${numbers.join(' ')}`
    } else if (type === 'LAYER_BLUR' || type === 'BACKGROUND_BLUR') {
      const { radius, boundVariables } = effect
      return `blur(${boundVariables.radius ? valueFromVar(boundVariables.radius) : `${radius}px`})`
    }
  }

const processTextStyle =
  (valueFromVar) =>
  ({ name, fontSize, fontFamily, fontWeight, fontStyle = 'normal' }) => {
    const css = [
      valueFromVar(fontStyle),
      valueFromVar(fontWeight),
      valueFromVar(fontSize),
      valueFromVar(fontFamily),
    ].join(' ')

    return `--${TOKEN_PREFIX}font-${sanitizeName(name)}: ${css};`
  }

const processEffectStyle =
  (valueFromVar) =>
  ({ name, effects }) => {
    const safeName = sanitizeName(name)
    const shadows = []
    const filters = []
    const backdropFilters = []

    effects.forEach((effect) => {
      if (effect.visible) {
        const formatted = formatEffect(valueFromVar)(effect)
        if (effect.type.match('SHADOW')) shadows.push(formatted)
        if (effect.type.match('LAYER_BLUR')) filters.push(formatted)
        if (effect.type.match('BACKGROUND_BLUR'))
          backdropFilters.push(formatted)
      }
    })

    const result = []
    if (shadows.length) {
      result.push(
        `--${TOKEN_PREFIX}effects-shadows-${safeName}: ${shadows.join(', ')};`
      )
    }
    if (filters.length) {
      result.push(`--${TOKEN_PREFIX}effects-filter-${safeName}: ${filters[0]};`)
    }
    if (backdropFilters.length) {
      result.push(
        `--${TOKEN_PREFIX}effects-backdrop-filter-${safeName}: ${backdropFilters[0]};`
      )
    }

    return result
  }

const processStyleJSON = (data, variablesLookup) => {
  log.step('Processing style definitions')
  log.debug(`Processing ${data.length} style definitions`)
  log.debug(
    `Variables lookup contains ${Object.keys(variablesLookup).length} variables`
  )

  const valueFromVar = valueFromPossibleVariable(variablesLookup)
  const effectDefs = []
  const text = []

  data.forEach(({ type, ...style }) => {
    if (type === 'TEXT') {
      const textStyle = processTextStyle(valueFromVar)(style)
      text.push(textStyle)
      log.debug(`Processed TEXT style: ${style.name}`)
    } else if (type === 'EFFECT') {
      const effectStyles = processEffectStyle(valueFromVar)(style)
      effectDefs.push(...effectStyles)
      log.debug(
        `Processed EFFECT style: ${style.name} (${effectStyles.length} definitions)`
      )
    }
  })

  log.success(
    `Processed ${text.length} text styles and ${effectDefs.length} effect definitions`
  )

  return [
    '/* styles */',
    ':root {',
    '  ' + [...text, ...effectDefs].join('\n  '),
    '}',
  ]
}

const createVariableLookups = (processed) => {
  log.step('Creating variable lookups for style processing')

  const lookups = Object.keys(processed)
    .flatMap((key) => Object.values(processed[key].definitions)[0])
    .reduce((into, item) => {
      into[item.figmaId] = item
      return into
    }, {})

  log.success(
    `Created variable lookups for ${Object.keys(lookups).length} variables`
  )
  return lookups
}

// Main application flow
const fetchAndWriteData = async () => {
  if (!SKIP_REST_API) {
    log.step('Fetching data from Figma API')
    log.info('Environment check:')
    log.debug(`FIGMA_FILE_KEY: ${FILE_KEY ? '✓ Set' : '✗ Missing'}`)
    log.debug(`NAMESPACE: ${NAMESPACE}`)

    if (!FILE_KEY) {
      log.error('Missing FIGMA_FILE_KEY environment variable!')
      log.info('Please set FIGMA_FILE_KEY in your .env file')
      process.exit(1)
    }

    try {
      log.debug('Making parallel requests to Figma API...')
      const [stylesJSON, tokensJSON] = await Promise.all([
        getFileStyles(FILE_KEY),
        getFileVariables(FILE_KEY, NAMESPACE),
      ])

      log.success('Successfully fetched data from Figma API')
      log.debug(
        `Styles data contains ${Array.isArray(stylesJSON) ? stylesJSON.length : 'unknown'} items`
      )
      log.debug(
        `Tokens data contains ${Object.keys(tokensJSON || {}).length} collections`
      )

      writeJSONFile('./styles.json', stylesJSON)
      writeJSONFile('./tokens.json', tokensJSON)
    } catch (error) {
      log.error('Failed to fetch data from Figma API:', error.message)
      throw error
    }
  } else {
    log.info('Skipping Figma API - using cached data')
  }
}

const processAndWriteCSS = () => {
  log.step('Processing tokens and generating CSS')

  const tokensData = readJSONFile('./tokens.json')
  const { processed, themeCSS } = processTokenJSON(tokensData)

  // Generate Tailwind theme block
  const tailwindTheme = generateTailwindThemeBlock(processed)

  // const variableLookups = createVariableLookups(processed)
  // const stylesData = readJSONFile('./styles.json')
  // const stylesCSS = processStyleJSON(stylesData, variableLookups)

  log.step('Writing final CSS output')
  const finalCSS = [
    ...tailwindTheme,
    ...themeCSS,
    // ...stylesCSS
  ].join('\n')
  const outputPath = `${WRITE_DIR}/theme.css`

  writeTextFile(outputPath, finalCSS)

  log.success('Token processing completed successfully!')
  log.info(`Final CSS written to: ${outputPath}`)
  log.debug(`Total CSS output: ${finalCSS.length} characters`)
  log.debug(`Theme CSS lines: ${themeCSS.length}`)
  log.debug(`Tailwind theme variables: ${tailwindTheme.length - 2}`) // Subtract opening and closing lines
  log.debug(`Theme CSS lines: ${themeCSS.length}`)
  // log.debug(`Style CSS lines: ${stylesCSS.length}`)
}

const initialize = async () => {
  log.header('Figma Design Tokens Processor')

  log.info('Configuration:')
  log.debug(`Token prefix: ${TOKEN_PREFIX}`)
  log.debug(`Write directory: ${WRITE_DIR}`)
  log.debug(`Convert to REM: ${CONVERT_TO_REM}`)
  log.debug(`Skip REST API: ${SKIP_REST_API}`)
  log.debug(`Collections configured: ${Object.keys(COLLECTION_DATA).length}`)

  try {
    await fetchAndWriteData()
    processAndWriteCSS()

    log.header('Process Complete')
    log.success('All design tokens have been successfully processed!')
  } catch (error) {
    log.error('Script failed:', error.message)
    if (error.stack) {
      log.debug('Stack trace:')
      console.log(colors.gray + error.stack + colors.reset)
    }
    process.exit(1)
  }
}

initialize()
