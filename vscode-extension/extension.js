// Reads the snapshot the usage-limits Claude Code plugin writes and shows it in
// the bottom-right of the status bar.
const fs = require('fs')
const os = require('os')
const path = require('path')
const vscode = require('vscode')

const SNAPSHOT = path.join(os.homedir(), '.claude', 'usage-limits.json')
const LABELS = { five_hour: '5h', seven_day: 'Wk', spend_limit: 'Spend' }
const NAMES = { five_hour: '5-hour session', seven_day: 'Weekly', spend_limit: 'Spend limit' }

function untilReset(resetsAt, now) {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!(ms > 0)) return 'reset'
  const minutes = Math.round(ms / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function ago(iso, now) {
  const minutes = Math.round((now - Date.parse(iso)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}

function render(item) {
  let snapshot
  try {
    snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
  } catch {
    item.text = '$(pulse) Claude: no data'
    item.tooltip = 'No usage reading yet. Send a message in a Claude Code session.'
    item.backgroundColor = undefined
    return
  }

  const now = Date.now()
  const limits = snapshot.limits || []
  // A window whose reset time has passed has started over.
  const used = l => (l.resetsAt && Date.parse(l.resetsAt) <= now ? 0 : l.percentUsed)

  item.text = '$(pulse) ' + limits
    .map(l => `${LABELS[l.kind] || l.kind} ${Math.round(used(l))}%`)
    .join(' · ')

  const tooltip = new vscode.MarkdownString()
  tooltip.appendMarkdown('**Claude usage**\n\n')
  for (const l of limits) {
    const reset = untilReset(l.resetsAt, now)
    const when = reset === 'reset' ? 'has reset' : reset ? `resets in ${reset}` : ''
    tooltip.appendMarkdown(`- ${NAMES[l.kind] || l.kind}: **${Math.round(used(l))}%** ${when}\n`)
  }
  tooltip.appendMarkdown(`\n_Updated ${ago(snapshot.updatedAt, now)}_`)
  item.tooltip = tooltip

  const worst = Math.max(0, ...limits.map(used))
  item.backgroundColor = worst >= 90
    ? new vscode.ThemeColor('statusBarItem.errorBackground')
    : worst >= 75
      ? new vscode.ThemeColor('statusBarItem.warningBackground')
      : undefined
}

function activate(context) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000)
  item.command = 'claudeUsage.refresh'
  render(item)
  item.show()

  const refresh = () => render(item)
  fs.watchFile(SNAPSHOT, { interval: 5000 }, refresh)
  const timer = setInterval(refresh, 60000)

  context.subscriptions.push(
    item,
    vscode.commands.registerCommand('claudeUsage.refresh', refresh),
    { dispose: () => { fs.unwatchFile(SNAPSHOT, refresh); clearInterval(timer) } },
  )
}

function deactivate() {}

module.exports = { activate, deactivate }
