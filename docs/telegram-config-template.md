---
title: Telegram Channel Configuration Template
description: Comprehensive template for Telegram bot configuration in OpenClaw
updated: 2026-05-18
---

# Telegram Configuration Template

This document provides a comprehensive template for configuring Telegram channels in OpenClaw. It covers the full range of available options with explanations.

## Table of Contents

- [Full Configuration Template](#full-configuration-template)
- [Configuration Reference](#configuration-reference)
  - [DM Policy Options](#dm-policy-options)
  - [Group Policy Options](#group-policy-options)
  - [Group Configuration Options](#group-configuration-options)
  - [Forum Topics (Supergroups)](#forum-topics-supergroups)
- [Appendix A: Multi-Agent Multi-Bot Configuration](#appendix-a-multi-agent-multi-bot-configuration)
  - [Per-Agent Channel Overrides](#per-agent-channel-overrides)
  - [Per-Account Configuration](#per-account-configuration)
- [Appendix B: Security Implications](#appendix-b-security-implications)
  - [DM Policy Security](#dm-policy-security)
  - [Group Policy Security](#group-policy-security)
  - [Best Practices Summary](#best-practices-summary)
- [Appendix C: Group Chat Deep Dive](#appendix-c-group-chat-deep-dive)
  - [Multiple Bots in the Same Group](#multiple-bots-in-the-same-group)
  - [Binding Agents to Group Topics](#binding-agents-to-group-topics)
  - [Group Role-Based Access Control](#group-role-based-access-control)
  - [Per-Group Skill Restrictions](#per-group-skill-restrictions)
  - [Group-Specific System Prompts](#group-specific-system-prompts)
  - [Finding Your Group ID](#finding-your-group-id)
  - [Topic IDs in Forum Groups](#topic-ids-in-forum-groups)
  - [Group Configuration Summary](#group-configuration-summary)
- [Quick Start Templates](#quick-start-templates)
  - [Minimal Secure Config](#minimal-secure-config)
  - [Public Bot Config](#public-bot-config)
  - [Maximum Security Config](#maximum-security-config)

---

## Full Configuration Template

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token", // or use TELEGRAM_BOT_TOKEN env var
      // tokenFile: "/path/to/token/file", // alternative to botToken

      // DM Policy: pairing | allowlist | open | disabled
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"], // Telegram user IDs

      // Group chat configuration
      // Wildcard "*" applies to all groups; specific group IDs override
      groups: {
        "*": { 
          requireMention: true,  // Only respond when @mentioned
          // allowFrom: ["@admin", "tg:123456789"],  // Who can trigger in this group
          // systemPrompt: "Keep answers brief.",  // Override system prompt for this group
          // skills: ["search", "wiki"],  // Restrict skills available in this group
          // typing: true,  // Show typing indicator while responding
          // ignoreOtherMentions: false,  // Ignore if other users are mentioned but not the bot
          // historyLimit: 30,  // Override default history limit for this group
        },
        // Specific group configuration by chat ID
        // Get group ID by forwarding a message from the group to @userinfobot
        // "-1001234567890": {
        //   requireMention: false,  // Respond to any message in this group
        //   allowFrom: ["@admin"],  // Only allow admins to trigger
        //   systemPrompt: "You are a helpful assistant for the admin team.",
        //   skills: ["github", "docs"],
        //   // Forum topic / channel configuration (Telegram supergroups)
        //   topics: {
        //     "99": {  // Topic ID from Telegram
        //       requireMention: false,
        //       skills: ["search"],
        //       systemPrompt: "You are the search specialist for this topic.",
        //       allowFrom: ["@librarian"],
        //     },
        //     "100": {
        //       requireMention: true,
        //       skills: ["docs"],
        //       systemPrompt: "You are the docs specialist.",
        //     },
        //   },
        // },
      },
      groupPolicy: "allowlist", // open | allowlist | disabled
      // groupAllowFrom: ["+15551234567"],  // Who can trigger in any allowed group

      // Custom Telegram bot menu commands
      // customCommands: [
      //   { command: "backup", description: "Git backup" },
      //   { command: "generate", description: "Create an image" },
      // ],

      // History & messaging
      historyLimit: 50,
      // dmHistoryLimit: 30, // per-DM override
      replyToMode: "first", // off | first | all | batched

      // Media & links
      linkPreview: true,
      mediaMaxMb: 100,

      // Streaming (preview edits while generating)
      // streaming: "partial", // off | partial | block | progress
      // (default off; avoids preview-edit rate limits)

      // Actions
      actions: { 
        reactions: true, 
        sendMessage: true 
      },
      // reactionNotifications: "off | own | all"
      // allowFrom: ["tg:123456789"], // per-DM overrides

      // Retry policy
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },

      // Network
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },

      // API & proxy
      apiRoot: "https://api.telegram.org",
      // proxy: "socks5://localhost:9050",

      // Webhook (optional)
      // webhookUrl: "https://example.com/telegram-webhook",
      // webhookSecret: "secret",
      // webhookPath: "/telegram-webhook",

      // Config writes
      // configWrites: false, // block Telegram-initiated config writes
    },
  },
}
```

## Configuration Reference

### DM Policy Options

| Value | Behavior | Use Case |
|-------|----------|----------|
| `pairing` (default) | Unknown senders get a one-time pairing code; owner must approve | Most secure — you control who can message |
| `allowlist` | Only senders in `allowFrom` can message | Known users only |
| `open` | Allow all inbound DMs | Requires `allowFrom: ["*"]` — use with caution |
| `disabled` | Ignore all DMs | Bot-only mode |

### Group Policy Options

| Value | Behavior |
|-------|----------|
| `allowlist` (default) | Only groups matching the configured allowlist |
| `open` | Bypass group allowlists (mention-gating still applies) |
| `disabled` | Block all group messages |

### Group Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `requireMention` | boolean | Only respond when @mentioned (default: true for `*`) |
| `allowFrom` | array | List of user IDs or usernames who can trigger the bot |
| `systemPrompt` | string | Override system prompt for this group |
| `skills` | array | Restrict which skills are available in this group |
| `typing` | boolean | Show typing indicator while generating response |
| `ignoreOtherMentions` | boolean | Ignore messages that mention other users but not the bot |
| `historyLimit` | number | Override message history limit for this group |
| `topics` | object | Per-forum-topic configuration (supergroups only) |

### Forum Topics (Supergroups)

Telegram supergroups with forum topics can be configured per-topic:

```json5
groups: {
  "-1001234567890": {
    topics: {
      "99": {
        requireMention: false,
        skills: ["search"],
        systemPrompt: "Search-focused responses only.",
        allowFrom: ["@librarian"],
      },
      "100": {
        requireMention: true,
        skills: ["docs"],
        systemPrompt: "Docs specialist for this topic.",
      },
    },
  },
}
```

Topic IDs can be found in the Telegram client URL or via the Bot API.

---

## Appendix C: Group Chat Deep Dive

### Multiple Bots in the Same Group

You can run multiple OpenClaw bots in the same Telegram group, each handling different aspects:

```json5
{
  channels: {
    telegram: {
      accounts: {
        assistant: { botToken: "BOT_TOKEN_1" },
        coder: { botToken: "BOT_TOKEN_2" },
        researcher: { botToken: "BOT_TOKEN_3" },
      },
      defaultAccount: "assistant",
      groups: {
        "-1001234567890": {
          // Each bot can have different settings
          // Use bindings to route to different agents
        },
      },
    },
  },
  bindings: [
    {
      match: { peer: { id: "-1001234567890" } },
      // Default agent for the group
      agent: "assistant",
    },
  ],
}
```

### Binding Agents to Group Topics

Route different agents to different topics within the same group:

```json5
{
  bindings: [
    {
      match: { peer: { id: "-1001234567890:topic:99" } },
      agent: "coder",
      session: {
        model: "anthropic/claude-opus-4-5",
        skills: ["github"],
      },
    },
    {
      match: { peer: { id: "-1001234567890:topic:100" } },
      agent: "researcher",
      session: {
        model: "openai/gpt-4.1",
        skills: ["tavily"],
      },
    },
    {
      match: { peer: { id: "-1001234567890" } },
      agent: "assistant",
    },
  ],
}
```

### Group Role-Based Access Control

Restrict bot access within groups based on Telegram user roles:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          // Only admins and specific users can invoke
          allowFrom: [
            "@admin_username",
            "@mod_username",
            "tg:123456789",  // Specific user ID
          ],
          requireMention: false,
          // But still require mention for non-admin users
          allowFromWithMention: {
            "*": true,  // Everyone can trigger with @mention
          },
        },
      },
    },
  },
}
```

### Per-Group Skill Restrictions

Limit what skills are available in different groups:

```json5
{
  channels: {
    telegram: {
      groups: {
        // Public group — limited skills
        "-1001111111111": {
          requireMention: true,
          skills: ["weather", "search"],
        },
        // Admin group — full access
        "-1002222222222": {
          requireMention: false,
          // No skills array = all skills available
        },
        // Project group — specific toolset
        "-1003333333333": {
          requireMention: false,
          skills: ["github", "docs", "memory-focus"],
        },
      },
    },
  },
}
```

### Group-Specific System Prompts

Customize bot behavior per group:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          systemPrompt: "You are CodeReviewBot. Focus on code quality, security, and best practices. Keep reviews concise.",
        },
        "-1009876543210": {
          systemPrompt: "You are MeetingBot. Always summarize discussions and action items. Format responses as bullet points.",
        },
        "-1005555555555": {
          systemPrompt: "You are CustomerSupportBot. Be friendly, patient, and helpful. Always verify information before responding.",
        },
      },
    },
  },
}
```

### Finding Your Group ID

To find a Telegram group's chat ID:

1. **Forward a message** from the group to @userinfobot (a Telegram bot)
2. **Use the Bot API**: Send a message to the group, then call `getUpdates` on the Bot API
3. **Check the URL**: In Telegram desktop, right-click the group → "Copy Link" — the link contains the ID

Group IDs typically start with `-100` followed by digits (e.g., `-1001234567890`).

### Topic IDs in Forum Groups

Forum topic IDs can be found:

1. **URL inspection** in Telegram desktop/web
2. **Bot API**: Use `getForumTopic` or inspect message objects in `getUpdates`
3. **Client inspection**: Some Telegram clients display topic IDs in developer tools

Use format `chatId:topic:topicId` in bindings (e.g., `-1001234567890:topic:99`).

### Group Configuration Summary

| Scenario | Key Settings |
|----------|---------------|
| **Quiet group** | `requireMention: true`, `groupPolicy: "allowlist"` |
| **Active group** | `requireMention: false`, specific `allowFrom` |
| **Multi-bot group** | `accounts` + `bindings` with `agent` routing |
| **Topic-based routing** | `topics` config + binding with `chatId:topic:ID` |
| **Role-restricted** | `allowFrom` with specific user IDs/usernames |
| **Public group** | `requireMention: true`, minimal skills, `configWrites: false` |

### Reply Mode Options

| Value | Behavior |
|-------|----------|
| `off` | Don't reply to any thread replies |
| `first` | Reply to the first message in a thread |
| `all` | Reply to all messages in a thread |
| `batched` | Batch multiple replies together |

### Streaming Options

| Value | Behavior |
|-------|----------|
| `off` (default) | No streaming — send complete message at once |
| `partial` | Show preview while generating (uses editMessageText) |
| `block` | Block until complete, then send |
| `progress` | Show progress indicator |

---

## Appendix A: Multi-Agent Multi-Bot Configuration

Running multiple agents on the same gateway, each with their own Telegram bot:

```json5
{
  agents: {
    list: [
      { id: "enid" },
      { id: "todd" },
      { id: "assistant" },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        enid: {
          botToken: "BOT_TOKEN_FOR_ENID",
        },
        todd: {
          botToken: "BOT_TOKEN_FOR_TODD",
        },
        assistant: {
          botToken: "BOT_TOKEN_FOR_ASSISTANT",
        },
      },
      // Explicitly set default to avoid fallback routing
      defaultAccount: "enid",
    },
  },
}
```

### Per-Agent Channel Overrides

You can bind specific agents to specific Telegram chats:

```json5
{
  bindings: [
    {
      match: { peer: { id: "8665004004" } },
      agent: "enid",
      // Optional: session configuration
      session: {
        model: "anthropic/claude-sonnet-4-6",
      },
    },
    {
      match: { peer: { id: "9876543210" } },
      agent: "todd",
    },
  ],
}
```

### Per-Account Configuration

Each Telegram account can have its own settings:

```json5
{
  channels: {
    telegram: {
      accounts: {
        enid: {
          botToken: "BOT_TOKEN_FOR_ENID",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
        public_bot: {
          botToken: "BOT_TOKEN_FOR_PUBLIC",
          dmPolicy: "open",
          allowFrom: ["*"],
          groups: {
            "*": { requireMention: true },
          },
        },
      },
      defaultAccount: "enid",
    },
  },
}
```

### Key Multi-Bot Notes

- Each bot needs its own bot token from @BotFather
- Use `channels.telegram.accounts.<id>` for per-bot config
- Always set `channels.telegram.defaultAccount` when using multiple accounts (2+)
- The `openclaw doctor` command will warn if no default is set
- Outbound commands default to account `default` if present; otherwise the first account id (sorted)

---

## Appendix B: Security Implications

### DM Policy Security

| Setting | Risk Level | Implications |
|---------|------------|--------------|
| `pairing` | Low | Unknown users must be manually approved — protects against spam/abuse |
| `allowlist` | Low-Medium | Only pre-approved users can message — good for trusted circles |
| `open` | **High** | Anyone can message — potential for spam, abuse, or prompt injection attacks |
| `disabled` | Very Low | No DMs accepted — bot only responds in groups where mentioned |

### Group Policy Security

| Setting | Risk Level | Implications |
|---------|------------|--------------|
| `allowlist` | Low | Only explicitly allowed groups can interact — prevents unauthorized access |
| `open` | **High** | Any group can invoke the bot — may expose functionality unexpectedly |
| `disabled` | Very Low | No group interactions — limits bot visibility/utility |

### Require Mention

- `requireMention: true` (default for groups): Reduces noise, ensures intentional interaction
- `requireMention: false`: Bot responds to any message in group — higher exposure, more potential for abuse

### AllowFrom Patterns

```json5
// Secure: specific user IDs
allowFrom: ["tg:123456789", "tg:987654321"]

// Less secure: wildcards
allowFrom: ["@admin", "@mod"] // Can be spoofed; Telegram IDs are more reliable

// Insecure: allow all
allowFrom: ["*"] // Use only with dmPolicy: "open" if intentionally desired
```

### Config Writes

```json5
configWrites: false // RECOMMENDED: Blocks Telegram-initiated config changes
```

This prevents malicious actors from modifying your gateway configuration via Telegram commands.

### Webhook Security

If using webhooks:

```json5
webhookSecret: "your-secret-string" // Validate incoming requests
webhookPath: "/telegram-webhook" // Non-obvious path helps avoid probing
```

### Proxy Considerations

```json5
proxy: "socks5://localhost:9050" // Tor proxy example
```

- Proxies can provide anonymity but add complexity
- Ensure proxy is trusted — proxy operator can see all traffic
- May impact message delivery reliability

### Media Handling

```json5
mediaMaxMb: 100 // Limit upload size
```

- Large files could be used for DoS
- Consider scanning uploaded media if relevant to your threat model

### Bot Token Security

| Method | Security | Notes |
|--------|----------|-------|
| `botToken` in config | Medium | Encrypted at rest, but visible in config file |
| `tokenFile` | Medium | Slightly better — file can have restricted permissions |
| Env var `TELEGRAM_BOT_TOKEN` | Best | Not stored in config file, managed by system |

### Best Practices Summary

1. **Start restrictive** — use `pairing` or `allowlist` for DMs
2. **Require mentions in groups** — don't auto-respond to everything
3. **Use Telegram IDs over usernames** — IDs are harder to spoof
4. **Disable config writes** — `configWrites: false` unless needed
5. **Set explicit defaults** in multi-bot setups
6. **Limit media sizes** to prevent resource abuse
7. **Use env vars for tokens** rather than hardcoding

---

## Quick Start Templates

### Minimal Secure Config

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
    },
  },
}
```

### Public Bot Config

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_PUBLIC_BOT_TOKEN",
      dmPolicy: "open",
      allowFrom: ["*"],
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      configWrites: false,
      mediaMaxMb: 25,
    },
  },
}
```

### Maximum Security Config

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
      dmPolicy: "allowlist",
      allowFrom: ["tg:123456789"], // Your ID only
      groupPolicy: "disabled",
      configWrites: false,
      mediaMaxMb: 10,
    },
  },
}
```

---

_This template was compiled from OpenClaw documentation. Last updated: 2026-05-18_