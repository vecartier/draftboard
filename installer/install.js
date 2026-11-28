#!/usr/bin/env node
// Installs the Draftboard plugin into Claude Code: npx github:vecartier/draftboard
const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const REPO = 'vecartier/draftboard'
const PLUGIN = 'draftboard@draftboard'
const WIN = process.platform === 'win32'
const HOME = os.homedir()
const PLUGINS_DIR = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude'), 'plugins')
const MUST_HAVE = [['skills', 'board', 'SKILL.md'], ['skills', 'board', 'engine', 'draftboard.js'], ['skills', 'build', 'SKILL.md'], ['hooks', 'register.ts']]

const isFile = (p) => { try { return fs.statSync(p).isFile() } catch { return false } }
const isDir = (p) => { try { return fs.statSync(p).isDirectory() } catch { return false } }
const mtime = (p) => { try { return fs.statSync(p).mtimeMs } catch { return 0 } }

function findClaude() {
  const onPath = spawnSync(WIN ? 'where' : 'which', ['claude'], { encoding: 'utf8' })
  if (onPath.status === 0 && onPath.stdout) {
    const hits = onPath.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    // On Windows `where` also lists npm's extensionless shell script, which Windows can't run.
    const usable = WIN ? hits.filter((p) => /\.(exe|cmd|bat)$/i.test(p)) : hits
    if (usable.length) return usable.sort((a, b) => /\.exe$/i.test(b) - /\.exe$/i.test(a))[0]
  }
  const exe = WIN ? 'claude.exe' : 'claude'
  const known = [
    path.join(HOME, '.local', 'bin', exe),
    path.join(HOME, '.claude', 'local', exe),
    ...(WIN ? [path.join(process.env.APPDATA || '', 'npm', 'claude.cmd')] : ['/opt/homebrew/bin/claude', '/usr/local/bin/claude']),
  ].filter(isFile)
  if (known.length) return known[0]
  // The Claude desktop app keeps its own copy of Claude Code.
  const roots = process.platform === 'darwin'
    ? [path.join(HOME, 'Library', 'Application Support', 'Claude', 'claude-code')]
    : WIN
      ? [process.env.APPDATA, process.env.LOCALAPPDATA].filter(Boolean).flatMap((d) => [path.join(d, 'Claude', 'claude-code'), path.join(d, 'AnthropicClaude')])
      : [path.join(HOME, '.config', 'Claude', 'claude-code')]
  const found = []
  const walk = (dir, depth) => {
    let names = []
    try { names = fs.readdirSync(dir) } catch { return }
    for (const name of names) {
      const p = path.join(dir, name)
      if (/^claude(\.exe)?$/i.test(name) && isFile(p)) found.push(p)
      else if (depth < 6 && isDir(p)) walk(p, depth + 1)
    }
  }
  for (const root of roots) walk(root, 0)
  found.sort((a, b) => mtime(b) - mtime(a))
  return found[0]
}

function hasGit() {
  // A Mac without the developer tools has a /usr/bin/git that only offers to install them.
  if (process.platform === 'darwin') {
    const where = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim()
    if (where === '/usr/bin/git' && spawnSync('xcode-select', ['-p']).status !== 0) return false
  }
  return spawnSync('git', ['--version']).status === 0
}

/** The newest plugin from GitHub as a folder, or null. Uses curl and tar, which macOS and Windows 10+ both have. */
function downloadLatest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'draftboard-'))
  const archive = path.join(tmp, 'main.tar.gz')
  const got = spawnSync('curl', ['-fsSL', '-o', archive, `https://codeload.github.com/${REPO}/tar.gz/refs/heads/main`])
  if (got.status !== 0 || spawnSync('tar', ['-xzf', archive, '-C', tmp]).status !== 0) return null
  const dir = fs.readdirSync(tmp).map((n) => path.join(tmp, n)).find((p) => isFile(path.join(p, '.claude-plugin', 'marketplace.json')))
  return dir || null
}

/** Without git, Claude Code can't fetch the marketplace, so it's added from a downloaded copy. */
function localMarketplace() {
  // npx keeps reusing its first download of a tarball link, so fetch the newest copy, and use npx's only if that fails.
  const from = downloadLatest() || path.join(__dirname, '..')
  const to = path.join(HOME, '.claude', 'draftboard', 'marketplace')
  if (!isFile(path.join(from, '.claude-plugin', 'marketplace.json'))) return null
  fs.rmSync(to, { recursive: true, force: true })
  fs.cpSync(from, to, { recursive: true, filter: (p) => !path.relative(from, p).split(path.sep).includes('node_modules') })
  return to
}

function run(claude, args) {
  // Node refuses to start .cmd/.bat files without a shell (since the 2024 security fix).
  const viaShell = WIN && /\.(cmd|bat)$/i.test(claude)
  const r = viaShell
    ? spawnSync(`"${claude}" ${args.join(' ')}`, { encoding: 'utf8', shell: true })
    : spawnSync(claude, args, { encoding: 'utf8' })
  const out = `${r.stdout || ''}${r.stderr || ''}${r.error ? r.error.message : ''}`.trim()
  return { ok: r.status === 0, out }
}

/** Moves aside a plugin settings file Claude Code can't read, so it starts that file fresh. */
function setAsideIfBroken(file) {
  if (!fs.existsSync(file)) return false
  try { JSON.parse(fs.readFileSync(file, 'utf8')); return false } catch {}
  const aside = `${file}.broken-${Date.now()}`
  fs.renameSync(file, aside)
  console.log(`Moved a damaged ${path.basename(file)} to ${aside}`)
  return true
}

/** The folder Claude Code loads the plugin from, if it has every file Draftboard needs. */
function installedOk() {
  try {
    const entries = JSON.parse(fs.readFileSync(path.join(PLUGINS_DIR, 'installed_plugins.json'), 'utf8')).plugins[PLUGIN] || []
    return entries.some((e) => e.installPath && MUST_HAVE.every((parts) => isFile(path.join(e.installPath, ...parts))))
  } catch { return false }
}

function fail(message) {
  console.error(`\n${message}\n\nIf this keeps happening, run these inside Claude Code instead:\n  /plugin marketplace add ${REPO}\n  /plugin install ${PLUGIN}`)
  process.exit(1)
}

const claude = findClaude()
if (!claude) fail('Could not find Claude Code. Install the Claude desktop app or Claude Code (https://claude.com/claude-code), then run this again.')
const version = run(claude, ['--version'])
if (!version.ok) fail(`Found Claude Code at ${claude}, but it didn't start:\n${version.out}`)
console.log(`Using Claude Code ${version.out.split(/\r?\n/)[0]} (${claude})`)

setAsideIfBroken(path.join(PLUGINS_DIR, 'known_marketplaces.json'))
setAsideIfBroken(path.join(PLUGINS_DIR, 'installed_plugins.json'))

const source = hasGit() ? REPO : localMarketplace()
if (!source) fail('Git is not installed, and Claude Code needs it to download plugins. On a Mac, run: xcode-select --install. On Windows, install Git from https://git-scm.com. Then run this again.')
const known = (() => { try { return JSON.parse(fs.readFileSync(path.join(PLUGINS_DIR, 'known_marketplaces.json'), 'utf8')).draftboard } catch { return null } })()
if (source !== REPO || (known && known.source && known.source.repo !== REPO)) {
  if (source !== REPO) console.log('Git is not installed, so Draftboard is added from this download. Run this command again to update it.')
  run(claude, ['plugin', 'marketplace', 'remove', 'draftboard'])
}

console.log('Adding the Draftboard marketplace…')
let r = run(claude, ['plugin', 'marketplace', 'add', source])
if (!r.ok && source === REPO) {
  // Already added, or an old cached copy: refresh it, and start clean if that fails.
  r = run(claude, ['plugin', 'marketplace', 'update', 'draftboard'])
  if (!r.ok) {
    run(claude, ['plugin', 'marketplace', 'remove', 'draftboard'])
    fs.rmSync(path.join(PLUGINS_DIR, 'marketplaces', 'draftboard'), { recursive: true, force: true })
    r = run(claude, ['plugin', 'marketplace', 'add', REPO])
  }
}
if (!r.ok) fail(`Adding the marketplace failed:\n${r.out}`)

console.log('Installing Draftboard…')
r = run(claude, ['plugin', 'install', PLUGIN])
if (r.ok) run(claude, ['plugin', 'update', PLUGIN])
else {
  r = run(claude, ['plugin', 'update', PLUGIN])
  if (!r.ok) fail(`Installing failed:\n${r.out}`)
}

if (!installedOk()) {
  // A copy with missing files (an interrupted download, or a cleaned-up cache): install it fresh.
  console.log('Some plugin files were missing. Reinstalling…')
  run(claude, ['plugin', 'uninstall', PLUGIN])
  fs.rmSync(path.join(PLUGINS_DIR, 'cache', 'draftboard'), { recursive: true, force: true })
  r = run(claude, ['plugin', 'install', PLUGIN])
  if (!r.ok || !installedOk()) fail(`Reinstalling failed:\n${r.out}`)
}

console.log('\nDraftboard is installed. Fully quit the Claude app (or Claude Code) and open it again, then type /draftboard:board in a new chat.')
