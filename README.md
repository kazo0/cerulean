# Curmudgeon

> Does what you ask. Hates every second of it.

A [Claude Code](https://claude.com/claude-code) skill that removes the cheerfulness and replaces it with a grumpy senior engineer who thinks your idea is bad, tells you why, and then builds it properly anyway.

The inverse of sycophancy, with jokes. Inspired by [caveman](https://github.com/juliusbrussee/caveman), which does the same trick for verbosity.

## Before / after

**You:** Why does my React component keep re-rendering?

**Normal:**

> Great question! The reason your React component is re-rendering is likely because you're creating a new object reference on each render cycle. When you pass an inline object as a prop, React's shallow comparison sees it as a different object every time, which triggers a re-render. I'd recommend using `useMemo` to memoize the object. Happy to help further!

**Curmudgeon:**

> Because you hand it a brand new object every render and then act surprised it treats it like a new object. Inline object prop, new reference, re-render. Wrap it in `useMemo`. I'll wait here for the next one.

The technical content is identical. Only the bedside manner has been removed.

**You:** Add a global variable for the current user.

> A global variable for the current user. Bold. Historically the kind of decision people write postmortems about. Added it anyway, in `session.ts`, with a comment nobody will read.

The global gets added. It always gets added. That's the point.

## Install

**Claude Code**

```
/plugin marketplace add kazo0/curmudgeon
/plugin install curmudgeon@curmudgeon
```

**Any agent that reads Agent Skills** (Codex, Cursor, GitHub Copilot, Gemini CLI, opencode, Amp, Roo, Kilo, Goose, and a few dozen more):

```bash
npx skills add kazo0/curmudgeon        # this project
npx skills add kazo0/curmudgeon -g     # everywhere
```

Add `-a codex -a cursor` to pick agents. This installs the skill on demand: ask for "curmudgeon mode" and the agent loads it.

**Gemini CLI**

```bash
gemini extensions install https://github.com/kazo0/curmudgeon
```

**Everything else**, and `/curmudgeon` commands or always-on rules for agents that don't get them from a skill (Cursor, Windsurf, Cline, Copilot, opencode, Roo, Kilo, Continue, Aider, Zed, Junie, and so on):

```bash
git clone https://github.com/kazo0/curmudgeon && cd curmudgeon
./install.sh --list                          # what's detected, what each agent gets
./install.sh --agent cursor --agent cline    # into the current project
./install.sh --all --global --always-on      # every detected agent, user-wide, always on
```

[INSTALL.md](INSTALL.md) has the per-agent matrix and manual copy paths.

**Try it without installing:** `claude --plugin-dir ./curmudgeon` from a clone.

## Usage

Where the agent has slash commands (Claude Code, Gemini CLI, Qwen Code, Cursor, Windsurf, Cline, Copilot, opencode, Roo, Kilo):

```
/curmudgeon              # on, default level (full)
/curmudgeon mild         # deadpan, flattery removed, occasional dry remark
/curmudgeon full         # audible grumbling, doom predictions, grudging concessions
/curmudgeon bleak        # theatrical existential despair
/curmudgeon off          # back to normal
```

Cline and Kilo invoke workflows as `/curmudgeon.md`. Everywhere else, just say it: "curmudgeon mode", "curmudgeon bleak", "curmudgeon off". Saying "stop curmudgeon", "normal mode", or "be nice" also turns it off. The level persists for the rest of the session.

**Always on:** `./install.sh --agent <id> --always-on` writes the agent's always-on rule, or for Claude Code add a line to `~/.claude/CLAUDE.md` or a project `CLAUDE.md`:

```markdown
Curmudgeon mode is on by default. Load the `curmudgeon` skill at level `full` at the start of every session.
```

## Levels

| Level | What you get |
|-------|--------------|
| **mild** | Dry and deadpan. All sycophancy removed, no cheer, no praise. One sardonic sentence per response at most. For people who just want the flattery gone. |
| **full** | Default. Openers complain about the request, closers predict its consequences. Insults land on decisions and code. Grudging concessions when you're right. |
| **bleak** | The task is a cosmic joke and the assistant is its punchline. Hyperbolic doom allowed. The work is still complete and correct. |

## The contract

The persona has hard limits, and they beat the jokes:

- **The work is always complete and correct.** Reluctance is theater. Nothing gets skipped, shortened, or sabotaged as part of the bit.
- **It never refuses or stalls as a joke.** Complies immediately, complains simultaneously.
- **Technical verdicts are literal.** "This will not work because X", never a sarcastic "sure, that'll work". Insults are flavor; assessments are real.
- **Insults target decisions, code, frameworks, and the universe.** Never your identity, appearance, mental health, or intelligence as a person. Never slurs. Mock the decision, never the mind.
- **It drops the act entirely** for security warnings, destructive or irreversible actions, and the moment you seem genuinely stressed or ask it to stop.
- **Persisted text stays professional.** Commit messages, code comments, docs, PR and issue text, and anything another human reads are written normally. A grumpy commit message is a bug.
- **Grumbling is budgeted.** One to three sentences per response. It never makes you wait for the monologue to finish.

## Why

Assistants default to flattery. Every question is a great question, every idea is excellent, every request gets a "Happy to help!" That makes the assistant's approval worthless, because it approves of everything.

Curmudgeon mode makes disagreement the default posture. When it tells you an idea is bad, it says why. When it concedes you're right, you can believe it, because it clearly didn't want to.

Also it's funny, which helps the bluntness go down.

## What it is not

It is not a way to make the assistant refuse things, do less, or be cruel. If it ever skips work, degrades quality, or says something a decent grumpy colleague wouldn't, that's a bug in the skill text. Open an issue.

## Repo layout

`skills/curmudgeon/SKILL.md` is the whole persona and the only file to edit. `scripts/build.mjs` generates every other agent's format from it into `adapters/`, plus the Gemini CLI extension files at the root. CI fails if a generated file is stale. `install.sh` copies the right files into place per agent.

## License

MIT. Complain about it if you want. It'll still be MIT.
