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

test('/draftboard:flow publishes a blank flow chart', async ($, on) => {
  const published: Record<string, unknown>[] = []
  on('session.info', () => ({ value: { scratchpadDir: '/tmp/scratch', transcriptPath: '' } }))
  on('process.run', () => {
    return { value: { exitCode: 0, stdout: 'ready /tmp/scratch/draftboard-2/index.html https://claude.ai/artifact/ENGINE1\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('tool.call', (_: unknown, e: Record<string, unknown>) => {
    published.push(e)
    return { result: {}, text: 'Published at https://claude.ai/artifact/FLOW1 (Version 1)' }
  })
  on('clock.after', () => ({ value: undefined }))
  const ran = await $.command.run({ command: 'draftboard:flow', args: '' } as Parameters<typeof $.command.run>[0])
  expect(ran.text).toBe('Untitled flow chart is open beside the chat: https://claude.ai/artifact/FLOW1')
  expect(published[0]?.description).toBe('A Draftboard flow chart.')
})
