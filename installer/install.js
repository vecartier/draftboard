#!/usr/bin/env node
// `npx draftboard`: adds the Draftboard plugin to Claude Code, using Claude Code's own plugin commands.
import { spawnSync } from 'node:child_process'

const run = (args) => spawnSync('claude', args, { stdio: 'inherit' })

const check = spawnSync('claude', ['--version'], { stdio: 'ignore' })
if (check.error || check.status !== 0) {
  console.error('Draftboard needs Claude Code. Install it from https://claude.com/claude-code, then run `npx draftboard` again.')
  console.error('Or, inside Claude Code: /plugin marketplace add vecartier/draftboard, then /plugin install draftboard@draftboard')
  process.exit(1)
}

console.log('Adding the Draftboard marketplace…')
const added = run(['plugin', 'marketplace', 'add', 'vecartier/draftboard'])
if (added.status !== 0) console.log('(It may already be added; carrying on.)')
run(['plugin', 'marketplace', 'update', 'draftboard'])

console.log('Installing the Draftboard plugin…')
const installed = run(['plugin', 'install', 'draftboard@draftboard'])
if (installed.status !== 0) {
  console.error('Install failed. Inside Claude Code you can run: /plugin install draftboard@draftboard')
  process.exit(installed.status ?? 1)
}

console.log('\nDraftboard is installed. Start a new Claude Code session and type:')
console.log('  /draftboard a login screen with email and Apple sign-in')
console.log('The first board takes a few minutes while Claude sets up your private copy of the editor; after that, boards open at once.')
