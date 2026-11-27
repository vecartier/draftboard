#!/usr/bin/env node
// Installs the Draftboard plugin into Claude Code: npx draftboard
const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const REPO = 'vecartier/draftboard'
const PLUGIN = 'draftboard@draftboard'

function findClaude() {
  const onPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['claude'], { encoding: 'utf8' })
  if (onPath.status === 0 && onPath.stdout.trim()) return onPath.stdout.trim().split(/\r?\n/)[0]
  // The Claude desktop app keeps its own copy of Claude Code.
  const roots = process.platform === 'darwin'
    ? [path.join(os.homedir(), 'Library/Application Support/Claude/claude-code')]
    : process.platform === 'win32'
      ? [path.join(process.env.APPDATA || '', 'Claude/claude-code'), path.join(process.env.LOCALAPPDATA || '', 'Claude/claude-code')]
      : [path.join(os.homedir(), '.config/Claude/claude-code')]
  const found = []
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    const walk = (dir, depth) => {
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name)
        if (/^claude(\.exe)?$/.test(name) && fs.statSync(p).isFile()) found.push(p)
        else if (depth < 6 && fs.statSync(p).isDirectory()) walk(p, depth + 1)
      }
    }
    try { walk(root, 0) } catch {}
  }
  found.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  return found[0]
}

function run(claude, args) {
  const r = spawnSync(claude, args, { encoding: 'utf8' })
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() }
}

const claude = findClaude()
if (!claude) {
  console.error('Could not find Claude Code. Install the Claude desktop app or Claude Code (https://claude.com/claude-code), then run this again.')
  process.exit(1)
}

console.log('Adding the Draftboard marketplace…')
let r = run(claude, ['plugin', 'marketplace', 'add', REPO])
if (!r.ok) {
  // Already added, or an old cached copy: refresh it, and start clean if that fails.
  r = run(claude, ['plugin', 'marketplace', 'update', 'draftboard'])
  if (!r.ok) {
    run(claude, ['plugin', 'marketplace', 'remove', 'draftboard'])
    r = run(claude, ['plugin', 'marketplace', 'add', REPO])
  }
}
if (!r.ok) { console.error(r.out); process.exit(1) }

console.log('Installing Draftboard…')
r = run(claude, ['plugin', 'install', PLUGIN])
if (r.ok) run(claude, ['plugin', 'update', PLUGIN])
else {
  r = run(claude, ['plugin', 'update', PLUGIN])
  if (!r.ok) { console.error(r.out); process.exit(1) }
}

console.log('\nDraftboard is installed. Start a new Claude Code chat and type /draftboard:board')
