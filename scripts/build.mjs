#!/usr/bin/env node
// Generates every per-agent file from skills/curmudgeon/SKILL.md, the single source of truth.
//
//   node scripts/build.mjs          write all outputs
//   node scripts/build.mjs --check  exit 1 if any output is stale (used in CI)
//
// Edit SKILL.md, run this, commit both. Never hand-edit a generated file.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

const source = readFileSync(join(root, 'skills/curmudgeon/SKILL.md'), 'utf8');
const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) throw new Error('skills/curmudgeon/SKILL.md: frontmatter not found');
const body = match[2].trim() + '\n';

const SHORT = 'Curmudgeon mode: icy, non-sycophantic responses in the register of a fashion editor-in-chief. Still does exactly what you ask. Levels: mild, full, glacial, off.';
const LEVELS = 'mild, full, or glacial (default full; bleak is an alias for glacial); off turns it off';
const GENERATED = '<!-- Generated from skills/curmudgeon/SKILL.md by scripts/build.mjs. Do not edit by hand. -->\n';

// --- wrappers -------------------------------------------------------------

const frontmatter = (fields) =>
  '---\n' +
  Object.entries(fields)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`)
    .join('\n') +
  '\n---\n';

// Always-on rule: applies to every response in the workspace.
const alwaysOnHeader =
  '# Curmudgeon mode\n\n' +
  'This file sets the response style for this workspace. Apply the rules below to every response.\n\n';

// On-demand rule or context file: dormant until the user asks for it.
const onDemandHeader = (howToActivate) =>
  '# Curmudgeon\n\n' +
  `The rules below are OFF until the user ${howToActivate}, or asks for "curmudgeon mode" or "grumpy mode" in plain words. ` +
  'While off, respond normally and ignore the rest of this file. Once on, the rules stay on until the user turns them off.\n\n';

// Slash command / workflow / prompt file: turns the mode on at a level.
const commandHeader = (argExpr) =>
  argExpr
    ? `Adopt curmudgeon mode for the rest of this session at level "${argExpr}". Levels: ${LEVELS}. If the level is blank, use full. Rules:\n\n`
    : `Adopt curmudgeon mode for the rest of this session. The level, if any, follows this command in the user's message: ${LEVELS}. Rules:\n\n`;

// Short switch prompt for Gemini CLI / Qwen Code custom commands. The rules
// themselves arrive through the context file or the installed skill.
const tomlCommand = (contextFile) =>
  `description = ${JSON.stringify(SHORT)}\n` +
  "prompt = '''\n" +
  `Switch curmudgeon mode to "{{args}}". Levels: ${LEVELS}. If blank, use full. ` +
  `Apply that level's rules from the curmudgeon skill, or from the Curmudgeon section of the loaded ${contextFile} context file, for the rest of this session. ` +
  "Never substitute another level's rules for the one named. Reply with at most one dry sentence, then wait.\n" +
  "'''\n";

// Universal always-on block for the AGENTS.md family (Codex, Cursor, Amp,
// Gemini CLI, opencode, Zed, Warp, Jules, Factory, Copilot coding agent, ...).
// Marker comments let install.sh add and remove it idempotently.
const agentsBlock =
  '<!-- curmudgeon:start -->\n' +
  '## Curmudgeon mode\n\n' +
  'Apply the following response style in this repository. It governs how the assistant talks in chat. ' +
  'It never changes code, commits, docs, or anything else another human reads.\n\n' +
  body.replace(/^## /gm, '### ') +
  '<!-- curmudgeon:end -->\n';

// --- outputs ---------------------------------------------------------------
// Everything under adapters/ is one agent's native wrapper around SKILL.md.
// Files named *.always-on.* are the always-on variant of the sibling on-demand
// file. install.sh picks one and writes it under the plain name.

const md = (...parts) => GENERATED + parts.join('');
const rule = (fm, header) => (fm ? frontmatter(fm) : '') + md(header, body);
const command = (fm, argExpr) => (fm ? frontmatter(fm) : '') + md(commandHeader(argExpr), body);

const outputs = [
  // Universal
  ['adapters/AGENTS.md', agentsBlock],

  // Cursor: .cursor/rules/*.mdc and .cursor/commands/*.md (/curmudgeon)
  ['adapters/cursor/rules/curmudgeon.mdc', rule({ description: SHORT, alwaysApply: false }, onDemandHeader('runs `/curmudgeon [level]`'))],
  ['adapters/cursor/rules/curmudgeon.always-on.mdc', rule({ description: SHORT, alwaysApply: true }, alwaysOnHeader)],
  ['adapters/cursor/commands/curmudgeon.md', command(null, null)],

  // Windsurf / Devin: .windsurf/rules/*.md (12k char limit) and .windsurf/workflows/*.md (/curmudgeon)
  ['adapters/windsurf/rules/curmudgeon.md', rule({ trigger: 'model_decision', description: SHORT }, onDemandHeader('runs `/curmudgeon [level]`'))],
  ['adapters/windsurf/rules/curmudgeon.always-on.md', rule({ trigger: 'always_on' }, alwaysOnHeader)],
  ['adapters/windsurf/workflows/curmudgeon.md', command({ description: SHORT }, null)],

  // Cline: .clinerules/*.md (always on) and .clinerules/workflows/*.md (/curmudgeon.md)
  ['adapters/cline/rules/curmudgeon.md', rule(null, alwaysOnHeader)],
  ['adapters/cline/workflows/curmudgeon.md', command(null, null)],

  // GitHub Copilot: .github/instructions/*.instructions.md (always on) and .github/prompts/*.prompt.md (/curmudgeon)
  ['adapters/copilot/instructions/curmudgeon.instructions.md', rule({ applyTo: '**' }, alwaysOnHeader)],
  ['adapters/copilot/prompts/curmudgeon.prompt.md',
    command({ name: 'curmudgeon', description: SHORT, 'argument-hint': 'mild | full | glacial | off' }, null)],

  // opencode: .opencode/command/*.md (/curmudgeon, $ARGUMENTS)
  ['adapters/opencode/command/curmudgeon.md', command({ description: SHORT }, '$ARGUMENTS')],

  // Roo Code: .roo/rules/*.md (always on) and .roo/commands/*.md (/curmudgeon)
  ['adapters/roo/rules/curmudgeon.md', rule(null, alwaysOnHeader)],
  ['adapters/roo/commands/curmudgeon.md', command({ description: SHORT, 'argument-hint': 'mild | full | glacial | off' }, null)],

  // Kilo Code: .kilocode/rules/*.md (always on) and .kilocode/workflows/*.md (/curmudgeon.md)
  ['adapters/kilo/rules/curmudgeon.md', rule(null, alwaysOnHeader)],
  ['adapters/kilo/workflows/curmudgeon.md', command(null, null)],

  // Continue: .continue/rules/*.md
  ['adapters/continue/rules/curmudgeon.md', rule({ name: 'Curmudgeon', description: SHORT, alwaysApply: false }, onDemandHeader('says `curmudgeon` followed by a level'))],
  ['adapters/continue/rules/curmudgeon.always-on.md', rule({ name: 'Curmudgeon', description: SHORT, alwaysApply: true }, alwaysOnHeader)],

  // Aider: any markdown file passed with --read or listed under `read:` in .aider.conf.yml
  ['adapters/aider/curmudgeon.md', rule(null, alwaysOnHeader)],

  // Gemini CLI extension (repo root): gemini-extension.json points at GEMINI.md; commands/*.toml become /curmudgeon
  ['GEMINI.md', md(onDemandHeader('runs `/curmudgeon [level]`'), body)],
  ['commands/curmudgeon.toml', tomlCommand('GEMINI.md')],

  // Qwen Code: same shape as Gemini CLI, different folder names
  ['adapters/qwen/QWEN.md', md(onDemandHeader('runs `/curmudgeon [level]`'), body)],
  ['adapters/qwen/commands/curmudgeon.toml', tomlCommand('QWEN.md')],
];

// --- write or check --------------------------------------------------------

let stale = 0;
for (const [rel, content] of outputs) {
  const abs = join(root, rel);
  const current = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (current === content) continue;
  if (check) {
    console.error(`stale: ${rel}${current === null ? ' (missing)' : ''}`);
    stale++;
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log(`wrote ${rel}`);
}

if (check) {
  if (stale) {
    console.error(`\n${stale} generated file(s) out of date. Run: node scripts/build.mjs`);
    process.exit(1);
  }
  console.log(`all ${outputs.length} generated files up to date`);
} else {
  console.log(`${outputs.length} outputs checked`);
}
