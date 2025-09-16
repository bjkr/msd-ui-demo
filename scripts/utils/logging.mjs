// Console logging utilities
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
}

export const log = {
  info: (msg, ...args) =>
    console.log(`${colors.blue}ℹ ${colors.reset}${msg}`, ...args),
  success: (msg, ...args) =>
    console.log(`${colors.green}✓ ${colors.reset}${msg}`, ...args),
  warning: (msg, ...args) =>
    console.log(`${colors.yellow}⚠ ${colors.reset}${msg}`, ...args),
  error: (msg, ...args) =>
    console.log(`${colors.red}✗ ${colors.reset}${msg}`, ...args),
  step: (msg, ...args) =>
    console.log(
      `${colors.cyan}→ ${colors.reset}${colors.bright}${msg}${colors.reset}`,
      ...args
    ),
  debug: (msg, ...args) =>
    console.log(`${colors.gray}  ${msg}${colors.reset}`, ...args),
  header: (msg) => {
    console.log(
      `\n${colors.magenta}${colors.bright}╭${'─'.repeat(msg.length + 2)}╮${colors.reset}`
    )
    console.log(`${colors.magenta}${colors.bright}│ ${msg} │${colors.reset}`)
    console.log(
      `${colors.magenta}${colors.bright}╰${'─'.repeat(msg.length + 2)}╯${colors.reset}\n`
    )
  },
}
