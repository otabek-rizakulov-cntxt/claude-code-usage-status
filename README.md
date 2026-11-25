# Usage Status for Claude Code

See your Claude Code 5-hour and weekly usage limits without running `/usage`.

This repository has two parts that work together:

| Part | What it does |
| --- | --- |
| [`plugins/usage-limits`](plugins/usage-limits) | A Claude Code plugin. Pins a line under the prompt (`5h 23% · resets in 2h 14m \| Week 41% · resets in 3d 6h`), adds a `/limits` command, and saves the latest readings to `~/.claude/usage-limits.json`. |
| [`vscode-extension`](vscode-extension) | A VS Code / Cursor extension. Shows `5h 23% · Wk 41%` in the bottom-right of the status bar, read from that file. |

## Install

1. **The Claude Code plugin.** In a Claude Code session, run:

   ```
   /plugin install usage-limits --marketplace otabek-rizakulov-cntxt/claude-code-usage-status
   ```

   From a shell, the same is:

   ```
   claude plugin install usage-limits --marketplace otabek-rizakulov-cntxt/claude-code-usage-status
   ```

2. **The editor extension** (optional). Search for **Usage Status for Claude Code** in the VS Code
   Extensions view, or in Cursor or VSCodium through Open VSX.

The numbers appear after your next message in a Claude Code session.

## Notes

- Limits are only reported for Claude subscription plans (Pro, Max), not for API-key billing.
- Nothing here reads your Claude credentials or makes network requests. The plugin uses the readings
  Claude Code already has, and the extension reads one local file.
- This is a community project. It is not made by or affiliated with Anthropic.

## License

[MIT](LICENSE)
