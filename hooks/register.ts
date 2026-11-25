import type { EngineInterface as Engine, Register } from 'claude-code'

// /draftboard as a command: makes the board and opens it without a model turn. The board page comes from
// skills/draftboard/new-board.sh and the editor is copied on the server from the person's engine, so this is one
// script run and one publish. Anything that needs Claude (setting the engine up, drafting) goes to the
// draftboard skill as a prompt once the command has finished.

const CAPABILITIES = {
  db: { rules: [{ path: 'board', read: 'view', write: 'admin' }, { path: 'inbox', read: 'admin', write: 'admin' }] },
  user: {},
  assets: {},
  downloads: true,
}

/** A short board name from the request: its first few words, capitalised. */
function boardName(request: string): string {
  const words = request.replace(/[^\p{L}\p{N}\s'&-]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 4)
  if (words.length === 0) return 'Untitled board'
  const name = words.join(' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Hands the rest to Claude, once the command has returned (a command can't start a turn while it runs). */
function askClaude($: Engine, text: string): void {
  $.clock.after(0, () => void $.prompt.submit({ text }))
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'draftboard',
      description: 'New Draftboard board beside the chat, blank or with a first draft',
      argumentHint: '[what to wireframe]',
    })
    return next(e)
  })

  on('command.run', { command: 'draftboard' }, async ($, e) => {
    const request = (e.args ?? '').trim()
    const viaSkill = (why: string) => {
      askClaude($, `Use the draftboard skill to make a new Draftboard board${request ? ` for: ${request}` : ''}. (${why})`)
      return { text: 'Making your board…', isTextDisplayOnly: true as const }
    }

    const { scratchpadDir } = await $.session.info()
    if (!scratchpadDir) return viaSkill('This session has no scratchpad for the fast path.')
    const name = boardName(request)
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

    if (request) askClaude($, `Draft into the Draftboard board ${url} (named "${name}", already open beside the chat) with the draftboard skill: ${request}`)
    return { text: `${name} is open beside the chat: ${url}`, isTextDisplayOnly: true }
  })
}
