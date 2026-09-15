#!/usr/bin/env node
// Generates every per-agent file from skills/cerulean/SKILL.md, the single source of truth.
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

const source = readFileSync(join(root, 'skills/cerulean/SKILL.md'), 'utf8');
const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) throw new Error('skills/cerulean/SKILL.md: frontmatter not found');
const body = match[2].trim() + '\n';

const SHORT = 'Cerulean mode: icy, non-sycophantic responses in the register of a fashion editor-in-chief. Still does exactly what you ask. Always glacial. Use off to return to normal responses.';
const GENERATED = '<!-- Generated from skills/cerulean/SKILL.md by scripts/build.mjs. Do not edit by hand. -->\n';

// --- wrappers -------------------------------------------------------------

const frontmatter = (fields) =>
  '---\n' +
  Object.entries(fields)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`)
    .join('\n') +
  '\n---\n';

// Always-on rule: applies to every response in the workspace.
const alwaysOnHeader =
  '# Cerulean mode\n\n' +
  'This file sets the response style for this workspace. Apply the rules below to every response.\n\n';

// On-demand rule or context file: dormant until the user asks for it.
const onDemandHeader = (howToActivate) =>
  '# Cerulean\n\n' +
  `The rules below are OFF until the user ${howToActivate}, or asks for "cerulean mode" or "grumpy mode" in plain words. ` +
  'While off, respond normally and ignore the rest of this file. Once on, the rules stay on until the user turns them off.\n\n';

// Slash command / workflow / prompt file: turns the style on or off.
const commandHeader = (argExpr) =>
  argExpr
    ? `Adopt the glacial Cerulean style for the rest of this session. If "${argExpr}" is "off", return to normal responses instead. There are no selectable intensity levels. Rules:\n\n`
    : `Adopt the glacial Cerulean style for the rest of this session. If the user supplies off after this command, return to normal responses instead. There are no selectable intensity levels. Rules:\n\n`;

// Short switch prompt for Gemini CLI / Qwen Code custom commands. The rules
// themselves arrive through the context file or the installed skill.
const tomlCommand = (contextFile) =>
  `description = ${JSON.stringify(SHORT)}\n` +
  "prompt = '''\n" +
  `Adopt the glacial Cerulean style for the rest of this session. If "{{args}}" is "off", return to normal responses instead. ` +
  `Otherwise apply the rules from the cerulean skill, or from the Cerulean section of the loaded ${contextFile} context file, for the rest of this session. ` +
  "There are no selectable intensity levels. Reply with at most one dry sentence, then wait.\n" +
  "'''\n";

// Universal always-on block for the AGENTS.md family (Codex, Cursor, Amp,
// Gemini CLI, opencode, Zed, Warp, Jules, Factory, Copilot coding agent, ...).
// Marker comments let install.sh add and remove it idempotently.
const agentsBlock =
  '<!-- cerulean:start -->\n' +
  '## Cerulean mode\n\n' +
  'Apply the following response style in this repository. It governs how the assistant talks in chat. ' +
  'It never changes code, commits, docs, or anything else another human reads.\n\n' +
  body.replace(/^## /gm, '### ') +
  '<!-- cerulean:end -->\n';

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

  // Cursor: .cursor/rules/*.mdc and .cursor/commands/*.md (/cerulean)
  ['adapters/cursor/rules/cerulean.mdc', rule({ description: SHORT, alwaysApply: false }, onDemandHeader('runs `/cerulean`'))],
  ['adapters/cursor/rules/cerulean.always-on.mdc', rule({ description: SHORT, alwaysApply: true }, alwaysOnHeader)],
  ['adapters/cursor/commands/cerulean.md', command(null, null)],

  // Windsurf / Devin: .windsurf/rules/*.md (12k char limit) and .windsurf/workflows/*.md (/cerulean)
  ['adapters/windsurf/rules/cerulean.md', rule({ trigger: 'model_decision', description: SHORT }, onDemandHeader('runs `/cerulean`'))],
  ['adapters/windsurf/rules/cerulean.always-on.md', rule({ trigger: 'always_on' }, alwaysOnHeader)],
  ['adapters/windsurf/workflows/cerulean.md', command({ description: SHORT }, null)],

  // Cline: .clinerules/*.md (always on) and .clinerules/workflows/*.md (/cerulean.md)
  ['adapters/cline/rules/cerulean.md', rule(null, alwaysOnHeader)],
  ['adapters/cline/workflows/cerulean.md', command(null, null)],

  // GitHub Copilot: .github/instructions/*.instructions.md (always on) and .github/prompts/*.prompt.md (/cerulean)
  ['adapters/copilot/instructions/cerulean.instructions.md', rule({ applyTo: '**' }, alwaysOnHeader)],
  ['adapters/copilot/prompts/cerulean.prompt.md',
    command({ name: 'cerulean', description: SHORT, 'argument-hint': 'off' }, null)],

  // opencode: .opencode/command/*.md (/cerulean, $ARGUMENTS)
  ['adapters/opencode/command/cerulean.md', command({ description: SHORT }, '$ARGUMENTS')],

  // Roo Code: .roo/rules/*.md (always on) and .roo/commands/*.md (/cerulean)
  ['adapters/roo/rules/cerulean.md', rule(null, alwaysOnHeader)],
  ['adapters/roo/commands/cerulean.md', command({ description: SHORT, 'argument-hint': 'off' }, null)],

  // Kilo Code: .kilocode/rules/*.md (always on) and .kilocode/workflows/*.md (/cerulean.md)
  ['adapters/kilo/rules/cerulean.md', rule(null, alwaysOnHeader)],
  ['adapters/kilo/workflows/cerulean.md', command(null, null)],

  // Continue: .continue/rules/*.md
  ['adapters/continue/rules/cerulean.md', rule({ name: 'Cerulean', description: SHORT, alwaysApply: false }, onDemandHeader('says `cerulean`'))],
  ['adapters/continue/rules/cerulean.always-on.md', rule({ name: 'Cerulean', description: SHORT, alwaysApply: true }, alwaysOnHeader)],

  // Aider: any markdown file passed with --read or listed under `read:` in .aider.conf.yml
  ['adapters/aider/cerulean.md', rule(null, alwaysOnHeader)],

  // Gemini CLI extension (repo root): gemini-extension.json points at GEMINI.md; commands/*.toml become /cerulean
  ['GEMINI.md', md(onDemandHeader('runs `/cerulean`'), body)],
  ['commands/cerulean.toml', tomlCommand('GEMINI.md')],

  // Qwen Code: same shape as Gemini CLI, different folder names
  ['adapters/qwen/QWEN.md', md(onDemandHeader('runs `/cerulean`'), body)],
  ['adapters/qwen/commands/cerulean.toml', tomlCommand('QWEN.md')],
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
