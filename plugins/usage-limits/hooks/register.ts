import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: 'Week',
  spend_limit: 'Spend',
}

function untilReset(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!(ms > 0)) return ' · resetting'
  const minutes = Math.round(ms / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return ` · resets in ${days}d ${hours}h`
  if (hours > 0) return ` · resets in ${hours}h ${mins}m`
  return ` · resets in ${mins}m`
}

function line(limits: SessionRateLimit[], now: number): string | undefined {
  if (limits.length === 0) return undefined
  return limits
    .map(l => `${LABELS[l.kind] ?? l.kind} ${Math.round(l.percentUsed)}%${untilReset(l.resetsAt, now)}`)
    .join('   |   ')
}

// Read by the "Usage Status for Claude Code" editor extension's status bar item.
async function snapshotPath($: EngineInterface): Promise<string | undefined> {
  const home = (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE'))
  return home ? `${home}/.claude/usage-limits.json` : undefined
}

async function show(
  $: EngineInterface,
  limits: SessionRateLimit[],
  snapshot: string | undefined,
): Promise<void> {
  const now = await $.clock.now()
  $.ui.status(line(limits, now))
  if (limits.length === 0 || !snapshot) return
  await $.fs
    .write(snapshot, JSON.stringify({ updatedAt: new Date(now).toISOString(), limits }, null, 2))
    .catch(() => undefined)
}

export const register: Register = on => {
  let limits: SessionRateLimit[] = []
  let snapshot: string | undefined

  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    snapshot = await snapshotPath($)
    limits = (await $.session.usage()).rateLimits
    await show($, limits, snapshot)
    // Keep the countdown honest between turns.
    $.clock.every(60_000, async () => {
      limits = (await $.session.usage()).rateLimits
      await show($, limits, snapshot)
    })
    await $.command.register({
      name: 'limits',
      description: 'Show the 5-hour and weekly usage limits',
    })

    return ran
  })

  on('session.measure', async ($, e, next) => {
    limits = e.rateLimits
    await show($, limits, snapshot)

    return next(e)
  })

  on('command.run', { command: 'limits' }, async $ => {
    limits = (await $.session.usage()).rateLimits
    await show($, limits, snapshot)

    return {
      text: line(limits, await $.clock.now()) ?? 'No limit reading yet (send a message first, or this account has no subscription limits).',
    }
  })
}
