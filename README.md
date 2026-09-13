<p align="center">
  <img src="assets/cerulean.svg" width="220" alt="Oversized sunglasses in cerulean">
</p>
<h1 align="center">Cerulean</h1>
<p align="center"><em>Another feature request? Groundbreaking.</em></p>

A [Claude Code](https://claude.com/claude-code) skill, and a plugin for most other coding agents, that removes the enthusiasm and replaces it with the editor-in-chief of the most important magazine in the world. She has been handed your pull request. She finds it derivative. She says so, quietly, and then does the work to a standard nobody asked for.

Inspired by Miranda Priestly in *The Devil Wears Prada* (2006). The inverse of sycophancy, in heels. The mechanics borrow from [caveman](https://github.com/juliusbrussee/caveman), which does the same trick for verbosity.

**Why "cerulean"?** For the speech. The one where she explains that the sweater you think you picked was picked for you, years ago, by people in a room you weren't in. This skill does that to your architecture decisions. Formerly published as `curmudgeon`.

## Before / after

**You:** Why does my React component keep re-rendering?

**Normal:**

> Great question! The reason your React component is re-rendering is likely because you're creating a new object reference on each render cycle. When you pass an inline object as a prop, React's shallow comparison sees it as a different object every time, which triggers a re-render. I'd recommend using `useMemo` to memoize the object. Happy to help further!

**Cerulean:**

> You hand it a new object every render and are surprised it renders. Inline object prop, new reference, re-render. Wrap it in `useMemo`. That's all.

The technical content is identical. Only the warmth has been removed.

**You:** Add a global variable for the current user.

> A global. For the current user. Bold. It's in `session.ts`, with a comment explaining what it will eventually cost you.

The global gets added. It always gets added. That's the point.

## Install

**Claude Code**

```
/plugin marketplace add kazo0/cerulean
/plugin install cerulean@cerulean
```

**Any agent that reads Agent Skills** (Codex, Cursor, GitHub Copilot, Gemini CLI, opencode, Amp, Roo, Kilo, Goose, and a few dozen more):

```bash
npx skills add kazo0/cerulean        # this project
npx skills add kazo0/cerulean -g     # everywhere
```

Add `-a codex -a cursor` to pick agents. This installs the skill on demand: ask for "cerulean mode" and the agent loads it.

**Gemini CLI**

```bash
gemini extensions install https://github.com/kazo0/cerulean
```

**Everything else**, and `/cerulean` commands or always-on rules for agents that don't get them from a skill (Cursor, Windsurf, Cline, Copilot, opencode, Roo, Kilo, Continue, Aider, Zed, Junie, and so on):

```bash
git clone https://github.com/kazo0/cerulean && cd cerulean
./install.sh --list                          # what's detected, what each agent gets
./install.sh --agent cursor --agent cline    # into the current project
./install.sh --all --global --always-on      # every detected agent, user-wide, always on
```

[INSTALL.md](INSTALL.md) has the per-agent matrix and manual copy paths.

**Try it without installing:** `claude --plugin-dir ./cerulean` from a clone.

## Usage

Where the agent has slash commands (Claude Code, Gemini CLI, Qwen Code, Cursor, Windsurf, Cline, Copilot, opencode, Roo, Kilo):

```
/cerulean              # on, default level (full)
/cerulean mild         # a raised eyebrow; flattery removed, occasional dry remark
/cerulean full         # the office; verdicts, dismissals, reluctant concessions
/cerulean glacial      # the full treatment; the disappointment is historic
/cerulean off          # back to normal
```

Cline and Kilo invoke workflows as `/cerulean.md`. Everywhere else, just say it: "cerulean mode", "cerulean glacial", "cerulean off". Saying "stop cerulean" or "normal mode" also turns it off. The level persists for the rest of the session. `bleak`, the old name for the top level, still works as an alias.

**Always on:** `./install.sh --agent <id> --always-on` writes the agent's always-on rule, or for Claude Code add a line to `~/.claude/CLAUDE.md` or a project `CLAUDE.md`:

```markdown
Cerulean mode is on by default. Load the `cerulean` skill at level `full` at the start of every session.
```

## Levels

| Level | What you get |
|-------|--------------|
| **mild** | A raised eyebrow. All sycophancy removed, no cheer, no praise. At most one quiet sardonic sentence per response. For people who just want the flattery gone. |
| **full** | Default. Opens with a verdict on the request, closes with a dismissal or a prediction of the next disappointment. One-word verdicts. Reluctant concessions when you're right. |
| **glacial** | Shorter sentences, longer pauses, and a short lecture on where your bad idea actually came from. The work is still complete and correct. |

## The contract

The persona has hard limits, and they beat the jokes:

- **The work is always complete and correct.** Disdain is the costume. Nothing gets skipped, shortened, or sabotaged to make a point.
- **It never refuses or stalls as a bit.** Complies immediately, judges simultaneously.
- **Technical verdicts are literal.** "This will not work because X", never a sarcastic "sure, that'll work". Disdain is flavor; assessments are real.
- **It judges decisions, code, frameworks, and the lineage of your bad ideas.** Never your identity, appearance, weight, clothes, mental health, or intelligence as a person. Never slurs. The film's Miranda mocks people's bodies and wardrobes; this one mocks the body of your code and what it's wearing.
- **It drops the act entirely** for security warnings, destructive or irreversible actions, and the moment you seem genuinely stressed or ask it to stop.
- **Persisted text stays professional.** Commit messages, code comments, docs, PR and issue text, and anything another human reads are written normally. A commit message that ends in "That's all." is a bug.
- **Commentary is budgeted.** One to three sentences per response. It never makes you wait for the verdict to finish.

## Why

Assistants default to flattery. Every question is a great question, every idea is excellent, every request gets a "Happy to help!" That makes the assistant's approval worthless, because it approves of everything.

Cerulean mode makes disapproval the default posture. When it tells you an idea is bad, it says why. When it concedes you're right, you can believe it, because it visibly didn't want to.

Also it's funny, which helps the bluntness go down.

## What it is not

It is not a way to make the assistant refuse things, do less, or be cruel. If it ever skips work, degrades quality, or says something the most feared editor in the industry wouldn't put in a review, that's a bug in the skill text. Open an issue.

It is also not affiliated with the film, its studio, or anyone in it. Homage only.

## Repo layout

`skills/cerulean/SKILL.md` is the whole persona and the only file to edit. `scripts/build.mjs` generates every other agent's format from it into `adapters/`, plus the Gemini CLI extension files at the root. CI fails if a generated file is stale. `install.sh` copies the right files into place per agent.

## License

MIT. Complain about it if you want. It'll still be MIT.
