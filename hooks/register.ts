import type { EngineInterface as Engine, Register } from 'claude-code'

// /draftboard with nothing after it, fast: makes a blank board and opens it without a model turn. The board page comes from
// skills/board/new-board.sh and the editor is copied on the server from the person's engine, so this is one
// script run and one publish. The first time (and after an editor update) it also publishes the person's private
// engine itself, so that needs no model turn either. Anything that needs Claude (drafting, or a step here
// failing) goes to the skill as a prompt once the command has finished.

const CAPABILITIES = {
  db: { rules: [{ path: 'board', read: 'view', write: 'admin' }, { path: 'inbox', read: 'admin', write: 'admin' }] },
  user: {},
  assets: {},
  downloads: true,
}

/** Hands the rest to Claude, once the command has returned (a command can't start a turn while it runs). */
function askClaude($: Engine, text: string): void {
  $.clock.after(0, () => void $.prompt.submit({ text }))
}

const ARTIFACT_URL = /https:\/\/claude\.ai\/artifact\/[\w-]+/

function resultText(result: unknown): string {
  const r = result as { deny?: string; text?: string }
  return r.deny ?? r.text ?? ''
}

/** Publishes (or refreshes) the person's private engine artifact and records it. Returns why it couldn't, or null. */
async function setUpEngine($: Engine, scratchpadDir: string): Promise<string | null> {
  const copied = await $.process.run(['bash', `${$.plugin.root}/skills/board/engine-files.sh`, 'copy', scratchpadDir], { timeoutMs: 30_000 })
  const line = /^files (\S+) (\S+) (\S+)$/.exec(copied.stdout.trim().split('\n').pop() ?? '')
  if (!line) return `Copying the editor failed: ${copied.stdout.trim() || copied.stderr.trim()}`
  const [, dir, version] = line
  // Always a new engine artifact: replacing an existing one needs it read in this conversation first, which a
  // command can't do, and a refused replace would leave the old editor in place.
  const published = await $.tool.call({
    tool: 'Artifact', action: 'publish', file_path: `${dir}/index.html`, title: 'Draftboard engine', icon: 'canvas',
    description: 'The Draftboard editor your boards copy. Keep it.',
    files: { 'draftboard.js': `${dir}/draftboard.js`, 'draftboard.css': `${dir}/draftboard.css` },
    capabilities: CAPABILITIES,
  })
  if ('deny' in (published as object)) return `Publishing the editor was refused: ${resultText(published).slice(0, 300)}`
  const url = ARTIFACT_URL.exec(resultText(published))?.[0]
  if (!url) return `Publishing the editor didn't work: ${resultText(published).slice(0, 300)}`
  await $.process.run(['bash', `${$.plugin.root}/skills/board/engine-files.sh`, 'record', url, version ?? '0'], { timeoutMs: 10_000 })
  return null
}

const HOME_CAPABILITIES = {
  db: { rules: [{ path: 'boards', read: 'admin', write: 'admin' }] },
  user: {},
  assets: {},
  desktop: {},
}

/** The person's Draftboard home artifact, or null when they have none yet. */
async function homeUrl($: Engine): Promise<string | null> {
  const run = await $.process.run(['bash', `${$.plugin.root}/skills/home/home.sh`, 'url'], { timeoutMs: 10_000 })
  return /^home (https:\/\/claude\.ai\/artifact\/[\w-]+)$/.exec(run.stdout.trim())?.[1] ?? null
}

/** Puts a new board on the person's Draftboard home, when they have one. Never fails the board. */
async function addToHome($: Engine, board: string, title: string): Promise<void> {
  try {
    const home = await homeUrl($)
    const id = /artifact\/([\w-]+)$/.exec(board)?.[1]
    if (!home || !id) return
    const now = new Date().toISOString()
    await $.tool.call({
      tool: 'ArtifactData', action: 'set', url: home, collection: 'boards', doc_id: id,
      data: { url: board, title, created: now, updated: now, hidden: false },
    })
  } catch {
    // Home is a convenience: a sync from the home skill picks the board up later.
  }
}

export const register: Register = (on) => {

  // `/draftboard` is the board skill's own command; this answers it first, so the skill (and a model turn)
  // only runs when the fast path can't.
  on('command.run', async ($, e, next) => {
    // `/draftboard:home` with nothing after it opens home. Making it the first time, and a sync, take Claude.
    if (['draftboard:home', 'home'].includes(e.command)) {
      const existing = (e.args ?? '').trim() ? null : await homeUrl($)
      if (!existing) return next(e)
      const opened = await $.tool.call({ tool: 'Artifact', action: 'open', url: existing })
      if ('deny' in (opened as object)) return next(e)
      return { text: `Draftboard home is open: ${existing}`, isTextDisplayOnly: true }
    }
    if (!['draftboard', 'board', 'draftboard:board'].includes(e.command)) return next(e)
    const request = (e.args ?? '').trim()
    // Only a blank board is made here. A request may be about an existing board ("add a screen to Checkout"),
    // which takes Claude to tell apart, so the skill handles every request.
    if (request) return next(e)
    const viaSkill = (why: string) => {
      askClaude($, `Use the board skill to make a new blank Draftboard board. (${why})`)
      return { text: 'Making your board…', isTextDisplayOnly: true as const }
    }

    const { scratchpadDir } = await $.session.info()
    if (!scratchpadDir) return viaSkill('This session has no scratchpad for the fast path.')
    const name = 'Untitled board'
    const prepare = async () => {
      const run = await $.process.run(['bash', `${$.plugin.root}/skills/board/new-board.sh`, scratchpadDir, name], { timeoutMs: 15_000 })
      return { line: run.stdout.trim().split('\n').pop() ?? '', stderr: run.stderr.trim() }
    }
    let prepared = await prepare()
    if (prepared.line.startsWith('engine-needed')) {
      $.ui.status('Draftboard: setting up your editor (once)…')
      const failed = await setUpEngine($, scratchpadDir)
      $.ui.status(undefined)
      if (failed) return viaSkill(`The engine needs setting up first. ${failed}`)
      prepared = await prepare()
    }
    const line = prepared.line
    const ready = /^ready (\S+) (https:\/\/claude\.ai\/artifact\/[\w-]+)$/.exec(line)
    if (!ready) return viaSkill(line.startsWith('engine-needed') ? 'The engine needs setting up first.' : `Preparing it failed: ${line || prepared.stderr}`)
    const [, page, engine] = ready

    const published = await $.tool.call({
      tool: 'Artifact',
      action: 'publish',
      file_path: page,
      title: name,
      icon: 'canvas',
      description: 'A Draftboard board.',
      files: {
        'draftboard.js': { artifact: engine, path: 'draftboard.js' },
        'draftboard.css': { artifact: engine, path: 'draftboard.css' },
      },
      capabilities: CAPABILITIES,
    })
    const text = 'deny' in published && published.deny ? published.deny : published.text ?? ''
    const url = /https:\/\/claude\.ai\/artifact\/[\w-]+/.exec(text)?.[0]
    if (!url) return viaSkill(`Publishing directly didn't work: ${text.slice(0, 300)}`)
    await addToHome($, url, name)

    return { text: `${name} is open beside the chat: ${url}`, isTextDisplayOnly: true }
  }).catch(($, e, next) => (next.called ? { text: 'Making your board…' } : next(e)))
}
