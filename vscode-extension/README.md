# Usage Status for Claude Code

Shows your Claude Code 5-hour and weekly usage limits in the bottom-right of the status bar:

```
$(pulse) 5h 23% · Wk 41%
```

Hover over it to see when each limit resets. It turns yellow at 75% and red at 90%.

## Requirements

This extension displays readings saved by the **usage-limits** Claude Code plugin. Install the plugin once,
from a Claude Code session:

```
/plugin install usage-limits --marketplace otabek-rizakulov-cntxt/claude-code-usage-status
```

The plugin saves the latest readings to `~/.claude/usage-limits.json` after each message and every minute
while a Claude Code session is open. Until the first reading, the status bar shows `Claude: no data`.

Limits are only reported for Claude subscription plans (Pro, Max), not for API-key billing.

## Privacy

The extension reads that one local file. It never reads your Claude credentials and makes no network requests.

## Disclaimer

This is a community project. It is not made by or affiliated with Anthropic.
