import type { EngineInterface as Engine, Register } from 'claude-code'

// /draftboard (or /draftboard:flow for a flow chart) with nothing after it, fast: makes a blank board and opens it without a model turn. The board page comes from
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
  const [, dir, version, current] = line
  const existing = current && current !== '-' ? current : undefined
  // Updating needs the artifact read in this session first; a gone or unreadable engine is replaced by a new one.
  const readable = existing ? !('deny' in (await $.tool.call({ tool: 'Artifact', action: 'read', url: existing }) as object)) : false
  const published = await $.tool.call({
    tool: 'Artifact', action: 'publish', file_path: `${dir}/index.html`, title: 'Draftboard engine', icon: 'canvas',
    description: 'The Draftboard editor your boards copy. Keep it.',
    files: { 'draftboard.js': `${dir}/draftboard.js`, 'draftboard.css': `${dir}/draftboard.css` },
    capabilities: CAPABILITIES,
    ...(existing && readable ? { url: existing } : {}),
  })
  const url = ARTIFACT_URL.exec(resultText(published))?.[0]
  if (!url) return `Publishing the editor didn't work: ${resultText(published).slice(0, 300)}`
  await $.process.run(['bash', `${$.plugin.root}/skills/board/engine-files.sh`, 'record', url, version], { timeoutMs: 10_000 })
  return null
}

export const register: Register = (on) => {
  // `/draftboard` is the board skill's own command; this answers it first, so the skill (and a model turn)
  // only runs when the fast path can't.
  on('command.run', async ($, e, next) => {
    const flow = ['flow', 'draftboard:flow'].includes(e.command)
    if (!flow && !['draftboard', 'board', 'draftboard:board'].includes(e.command)) return next(e)
    const request = (e.args ?? '').trim()
    // Only a blank board is made here. A request may be about an existing board ("add a screen to Checkout"),
    // which takes Claude to tell apart, so the skill handles every request.
    if (request) return next(e)
    const viaSkill = (why: string) => {
      askClaude($, flow ? `Use the flow skill to make a new blank Draftboard flow chart. (${why})` : `Use the board skill to make a new blank Draftboard board. (${why})`)
      return { text: flow ? 'Making your flow chart…' : 'Making your board…', isTextDisplayOnly: true as const }
    }

    const { scratchpadDir } = await $.session.info()
    if (!scratchpadDir) return viaSkill('This session has no scratchpad for the fast path.')
    const name = flow ? 'Untitled flow chart' : 'Untitled board'
    const prepare = async () => {
      const run = await $.process.run(['bash', `${$.plugin.root}/skills/board/new-board.sh`, scratchpadDir, name, flow ? 'flow' : 'wireframe'], { timeoutMs: 15_000 })
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
      icon: flow ? 'flowchart' : 'canvas',
      description: flow ? 'A Draftboard flow chart.' : 'A Draftboard wireframe board.',
      files: {
        'draftboard.js': { artifact: engine, path: 'draftboard.js' },
        'draftboard.css': { artifact: engine, path: 'draftboard.css' },
      },
      capabilities: CAPABILITIES,
    })
    const text = 'deny' in published && published.deny ? published.deny : published.text ?? ''
    const url = /https:\/\/claude\.ai\/artifact\/[\w-]+/.exec(text)?.[0]
    if (!url) return viaSkill(`Publishing directly didn't work: ${text.slice(0, 300)}`)

    return { text: `${name} is open beside the chat: ${url}`, isTextDisplayOnly: true }
  }).catch(($, e, next) => (next.called ? { text: 'Making your board…' } : next(e)))
}
