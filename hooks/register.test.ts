import { expect, test } from 'claude-code/testing'

test('/draftboard publishes the board itself, with no model turn', async ($, on) => {
  const published: unknown[] = []
  const prompts: string[] = []
  on('session.info', () => ({ value: { scratchpadDir: '/tmp/scratch', transcriptPath: '' } }))
  on('process.run', () => ({
    value: { exitCode: 0, stdout: 'ready /tmp/scratch/draftboard-1/index.html https://claude.ai/artifact/ENGINE1\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('tool.call', (_: unknown, e: Record<string, unknown>) => {
    published.push(e)
    return { result: {}, text: 'Published /tmp/scratch/draftboard-1/index.html at https://claude.ai/artifact/BOARD1 (Version 1)' }
  })
  on('clock.after', () => ({ value: undefined }))
  on('prompt.submit', (_: unknown, e: { text: string }) => { prompts.push(e.text); return { text: e.text } })

  for (const command of ['draftboard', 'draftboard:board']) {
    const ran = await $.command.run({ command, args: '' } as Parameters<typeof $.command.run>[0])
    expect(ran.text).toBe('Untitled board is open beside the chat: https://claude.ai/artifact/BOARD1')
  }
  expect((published[0] as { tool: string }).tool).toBe('Artifact')
  expect(prompts).toEqual([])
})

test('a request goes to the board skill', async ($, on) => {
  let skill = 0
  on('command.run', () => { skill += 1; return { text: 'skill' } })
  const ran = await $.command.run({ command: 'draftboard', args: 'add a settings screen to Checkout' } as Parameters<typeof $.command.run>[0])
  expect(ran.text).toBe('skill')
  expect(skill).toBe(1)
})

test('a missing engine is published by the command itself, with no model turn', async ($, on) => {
  const calls: Record<string, unknown>[] = []
  const prompts: string[] = []
  let engineReady = false
  on('session.info', () => ({ value: { scratchpadDir: '/tmp/scratch', transcriptPath: '' } }))
  on('process.run', (_: unknown, e: { readonly argv: readonly string[] }) => {
    const argv = e.argv
    const script = String(argv[1] ?? '')
    let stdout = ''
    if (script.endsWith('engine-files.sh') && argv[2] === 'copy') stdout = 'files /tmp/scratch/draftboard-engine-1 0.6.0 -\n'
    else if (script.endsWith('engine-files.sh')) { engineReady = true; stdout = 'recorded\n' }
    else stdout = engineReady ? 'ready /tmp/scratch/draftboard-3/index.html https://claude.ai/artifact/ENGINE2\n' : 'engine-needed no engine yet\n'
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('tool.call', (_: unknown, e: Record<string, unknown>) => {
    calls.push(e)
    return { result: {}, text: calls.length === 1 ? 'Published at https://claude.ai/artifact/ENGINE2 (Version 1)' : 'Published at https://claude.ai/artifact/FLOW2 (Version 1)' }
  })
  on('clock.after', () => ({ value: undefined }))
  on('prompt.submit', (_: unknown, e: { text: string }) => { prompts.push(e.text); return { text: e.text } })
  const ran = await $.command.run({ command: 'draftboard', args: '' } as Parameters<typeof $.command.run>[0])
  expect(ran.text).toBe('Untitled board is open beside the chat: https://claude.ai/artifact/FLOW2')
  expect(calls[0]?.title).toBe('Draftboard engine')
  expect(calls[0]?.url).toBeUndefined()
  expect(prompts).toEqual([])
})

test('a new board goes on Draftboard home when the person has one', async ($, on) => {
  const calls: Record<string, unknown>[] = []
  on('session.info', () => ({ value: { scratchpadDir: '/tmp/scratch', transcriptPath: '' } }))
  on('process.run', (_: unknown, e: { readonly argv: readonly string[] }) => {
    const home = String(e.argv[1] ?? '').endsWith('home.sh')
    const stdout = home ? 'home https://claude.ai/artifact/HOME1\n' : 'ready /tmp/scratch/draftboard-1/index.html https://claude.ai/artifact/ENGINE1\n'
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('tool.call', (_: unknown, e: Record<string, unknown>) => {
    calls.push(e)
    return { result: {}, text: e.tool === 'Artifact' ? 'Published at https://claude.ai/artifact/BOARD9 (Version 1)' : 'ok' }
  })
  on('clock.after', () => ({ value: undefined }))
  const ran = await $.command.run({ command: 'draftboard', args: '' } as Parameters<typeof $.command.run>[0])
  expect(ran.text).toBe('Untitled board is open beside the chat: https://claude.ai/artifact/BOARD9')
  const row = calls.find((c) => c.tool === 'ArtifactData')
  expect(row?.url).toBe('https://claude.ai/artifact/HOME1')
  expect(row?.doc_id).toBe('BOARD9')
  expect((row?.data as { title: string }).title).toBe('Untitled board')
})

test('/draftboard:home opens home when it exists, and leaves the first time to the skill', async ($, on) => {
  let has = true
  const calls: Record<string, unknown>[] = []
  let skill = 0
  on('process.run', () => ({ value: { exitCode: 0, stdout: has ? 'home https://claude.ai/artifact/HOME1\n' : 'none\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('tool.call', (_: unknown, e: Record<string, unknown>) => { calls.push(e); return { result: {}, text: 'Opened' } })
  on('command.run', () => { skill += 1; return { text: 'skill' } })
  const opened = await $.command.run({ command: 'draftboard:home', args: '' } as Parameters<typeof $.command.run>[0])
  expect(opened.text).toBe('Draftboard home is open: https://claude.ai/artifact/HOME1')
  expect(calls[0]?.action).toBe('open')
  has = false
  const first = await $.command.run({ command: 'draftboard:home', args: '' } as Parameters<typeof $.command.run>[0])
  expect(first.text).toBe('skill')
  expect(skill).toBe(1)
})
