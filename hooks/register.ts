import type { EngineInterface as Engine, Register } from 'claude-code'

// /draftboard with nothing after it, fast: makes a blank board and opens it without a model turn. The board page comes from
// skills/draftboard/new-board.sh and the editor is copied on the server from the person's engine, so this is one
// script run and one publish. Anything that needs Claude (setting the engine up, drafting) goes to the
// draftboard skill as a prompt once the command has finished.

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

export const register: Register = (on) => {
  // `/draftboard` is the draftboard skill's own command; this answers it first, so the skill (and a model turn)
  // only runs when the fast path can't.
  on('command.run', async ($, e, next) => {
    if (e.command !== 'draftboard' && e.command !== 'draftboard:draftboard') return next(e)
    const request = (e.args ?? '').trim()
    // Only a blank board is made here. A request may be about an existing board ("add a screen to Checkout"),
    // which takes Claude to tell apart, so the skill handles every request.
    if (request) return next(e)
    const viaSkill = (why: string) => {
      askClaude($, `Use the draftboard skill to make a new blank Draftboard board. (${why})`)
      return { text: 'Making your board…', isTextDisplayOnly: true as const }
    }

    const { scratchpadDir } = await $.session.info()
    if (!scratchpadDir) return viaSkill('This session has no scratchpad for the fast path.')
    const name = 'Untitled board'
    const prepared = await $.process.run(['bash', `${$.plugin.root}/skills/draftboard/new-board.sh`, scratchpadDir, name], { timeoutMs: 15_000 })
    const line = prepared.stdout.trim().split('\n').pop() ?? ''
    const ready = /^ready (\S+) (https:\/\/claude\.ai\/artifact\/[\w-]+)$/.exec(line)
    if (!ready) return viaSkill(line.startsWith('engine-needed') ? 'The engine needs setting up first.' : `Preparing it failed: ${line || prepared.stderr.trim()}`)
    const [, page, engine] = ready

    const published = await $.tool.call({
      tool: 'Artifact',
      action: 'publish',
      file_path: page,
      title: name,
      icon: 'canvas',
      description: 'A Draftboard wireframe board.',
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
