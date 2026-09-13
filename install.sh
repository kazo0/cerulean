#!/usr/bin/env bash
# Curmudgeon installer. Copies the generated per-agent files into the right
# places. Run it from a clone of the repo. Bash 3.2+ (macOS default) is enough.
#
#   ./install.sh --list                        agents, what each gets, which are detected
#   ./install.sh --agent cursor --agent cline  install for specific agents (project scope: $PWD)
#   ./install.sh --all                         install for every detected agent
#   ./install.sh --global ...                  user scope (home directory) instead of project
#   ./install.sh --always-on ...               also install the always-on rule / AGENTS.md block
#   ./install.sh --dry-run ...                 print what would change, write nothing
#   ./install.sh --force ...                   overwrite existing files, refresh existing blocks
#   ./install.sh --uninstall ...               remove what the same flags would have installed
#
# Nothing is overwritten without --force. AGENTS.md-style files get a block
# between <!-- curmudgeon:start --> and <!-- curmudgeon:end --> markers; the
# rest of the file is left alone.
set -eu

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL="$ROOT/skills/curmudgeon"
A="$ROOT/adapters"
START='<!-- curmudgeon:start -->'
END='<!-- curmudgeon:end -->'
REPO_URL="https://github.com/kazo0/curmudgeon"

ALL_IDS="claude codex cursor windsurf cline copilot opencode gemini qwen roo kilo continue aider amp agents-md zed goose junie trae warp augment"

GLOBAL=""; DRY=""; FORCE=""; ALWAYS_ON=""; UNINSTALL=""; LIST=""; ALL=""; AGENTS=""

usage() { sed -n '2,/^set -eu/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --agent|-a)   [ $# -ge 2 ] || { echo "--agent needs an id" >&2; exit 2; }; AGENTS="$AGENTS $2"; shift 2 ;;
    --all)        ALL=1; shift ;;
    --global|-g)  GLOBAL=1; shift ;;
    --always-on)  ALWAYS_ON=1; shift ;;
    --dry-run)    DRY=1; shift ;;
    --force)      FORCE=1; shift ;;
    --uninstall)  UNINSTALL=1; shift ;;
    --list)       LIST=1; shift ;;
    -h|--help)    usage; exit 0 ;;
    *)            echo "unknown flag: $1" >&2; usage >&2; exit 2 ;;
  esac
done

for f in "$A/AGENTS.md" "$SKILL/SKILL.md"; do
  [ -f "$f" ] || { echo "missing $f. Run from a clone; regenerate with: node scripts/build.mjs" >&2; exit 1; }
done

# --- helpers ---------------------------------------------------------------

say() { printf '%s\n' "$*"; }
note() { printf '  note    %s\n' "$*"; }

# pick "$1" when --global, else "$2"
scope() { if [ -n "$GLOBAL" ]; then printf '%s' "$1"; else printf '%s' "$2"; fi; }

remove_path() {
  if [ -e "$1" ] || [ -L "$1" ]; then say "  remove  $1"; [ -n "$DRY" ] || rm -rf "$1"
  else say "  absent  $1"; fi
}

copy_file() { # src dst
  if [ -n "$UNINSTALL" ]; then remove_path "$2"; return 0; fi
  if [ -e "$2" ] && [ -z "$FORCE" ]; then say "  keep    $2  (exists; --force to overwrite)"; return 0; fi
  say "  write   $2"
  [ -n "$DRY" ] && return 0
  mkdir -p "$(dirname "$2")" && cp "$1" "$2"
}

copy_dir() { # src dst
  if [ -n "$UNINSTALL" ]; then remove_path "$2"; return 0; fi
  if [ -e "$2" ] && [ -z "$FORCE" ]; then say "  keep    $2/  (exists; --force to overwrite)"; return 0; fi
  say "  write   $2/"
  [ -n "$DRY" ] && return 0
  rm -rf "$2" && mkdir -p "$(dirname "$2")" && cp -R "$1" "$2"
}

has_block() { [ -f "$1" ] && grep -qF "$START" "$1"; }
strip_block() { # remove the block; trim trailing blank lines; delete the file if nothing else is left
  awk -v s="$START" -v e="$END" 'index($0,s){skip=1} !skip{print} index($0,e){skip=0}' "$1" > "$1.tmp"
  if grep -q '[^[:space:]]' "$1.tmp"; then printf '%s\n' "$(cat "$1.tmp")" > "$1"; rm -f "$1.tmp"
  else rm -f "$1.tmp" "$1"; say "  remove  $1  (nothing left but the block)"; fi
}

append_block() { # dst
  if [ -n "$UNINSTALL" ]; then
    if has_block "$1"; then say "  unblock $1"; [ -n "$DRY" ] || strip_block "$1"
    else say "  absent  $1  (no curmudgeon block)"; fi
    return 0
  fi
  if has_block "$1"; then
    if [ -z "$FORCE" ]; then say "  keep    $1  (block present; --force to refresh)"; return 0; fi
    say "  refresh $1"
    [ -n "$DRY" ] && return 0
    strip_block "$1"
  else
    say "  append  $1"
    [ -n "$DRY" ] && return 0
    mkdir -p "$(dirname "$1")"
  fi
  { if [ -s "$1" ]; then printf '\n'; fi; cat "$A/AGENTS.md"; } >> "$1"
}

skill_into() { copy_dir "$SKILL" "$1/curmudgeon"; }              # skill dir
rule_variant() { if [ -n "$ALWAYS_ON" ]; then printf '%s' "$1.always-on.$2"; else printf '%s' "$1.$2"; fi; }
if_always_on() { if [ -n "$ALWAYS_ON" ]; then "$@"; fi; }

# --- agent table -----------------------------------------------------------

detected() {
  case "$1" in
    claude)    command -v claude >/dev/null 2>&1 || [ -d "$HOME/.claude" ] ;;
    codex)     command -v codex >/dev/null 2>&1 || [ -d "$HOME/.codex" ] ;;
    cursor)    command -v cursor >/dev/null 2>&1 || [ -d "$HOME/.cursor" ] ;;
    windsurf)  [ -d "$HOME/.codeium/windsurf" ] || [ -d "$HOME/.devin" ] ;;
    cline)     [ -d "$HOME/Documents/Cline" ] || [ -d "$HOME/.cline" ] ;;
    copilot)   command -v copilot >/dev/null 2>&1 || [ -d "$HOME/.copilot" ] ;;
    opencode)  command -v opencode >/dev/null 2>&1 || [ -d "$HOME/.config/opencode" ] ;;
    gemini)    command -v gemini >/dev/null 2>&1 || [ -d "$HOME/.gemini" ] ;;
    qwen)      command -v qwen >/dev/null 2>&1 || [ -d "$HOME/.qwen" ] ;;
    roo)       [ -d "$HOME/.roo" ] ;;
    kilo)      [ -d "$HOME/.kilocode" ] || [ -d "$HOME/.kilo" ] ;;
    continue)  [ -d "$HOME/.continue" ] ;;
    aider)     command -v aider >/dev/null 2>&1 ;;
    amp)       command -v amp >/dev/null 2>&1 || [ -d "$HOME/.config/amp" ] ;;
    zed)       command -v zed >/dev/null 2>&1 || [ -d "$HOME/.config/zed" ] ;;
    goose)     command -v goose >/dev/null 2>&1 || [ -d "$HOME/.config/goose" ] ;;
    junie)     [ -d "$HOME/.junie" ] ;;
    trae)      [ -d "$HOME/.trae" ] ;;
    warp)      [ -d "$HOME/.warp" ] || [ -d "/Applications/Warp.app" ] ;;
    augment)   [ -d "$HOME/.augment" ] ;;
    *)         return 1 ;;   # agents-md is opt-in only
  esac
}

describe() {
  case "$1" in
    claude)    say "skill dir; /curmudgeon works natively. --always-on: CLAUDE.md block" ;;
    codex)     say "skill dir (.agents/skills | ~/.codex/skills). --always-on: AGENTS.md block" ;;
    cursor)    say ".cursor/commands + skill dir + .cursor/rules (on-demand, or always-on)" ;;
    windsurf)  say ".windsurf/workflows + .windsurf/rules (on-demand, or always-on). Project scope only" ;;
    cline)     say ".clinerules/workflows + skill dir. --always-on: .clinerules/curmudgeon.md" ;;
    copilot)   say ".github/prompts + skill dir. --always-on: .github/instructions. Global: ~/.copilot/skills" ;;
    opencode)  say ".opencode/command + skill dir. --always-on: AGENTS.md block" ;;
    gemini)    say "gemini extensions install (when gemini is on PATH), else commands toml + skill dir" ;;
    qwen)      say ".qwen/commands toml + skill dir. --always-on: QWEN.md block" ;;
    roo)       say ".roo/commands + skill dir. --always-on: .roo/rules" ;;
    kilo)      say ".kilocode/workflows + skill dir. --always-on: .kilocode/rules" ;;
    continue)  say ".continue/rules (on-demand, or always-on) + skill dir" ;;
    aider)     say "curmudgeon.md to pass with --read or list under read: in .aider.conf.yml" ;;
    amp)       say "skill dir. --always-on: AGENTS.md block" ;;
    agents-md) say "always-on block in AGENTS.md (Codex, Cursor, Amp, Jules, Factory, Zed, Warp, ...)" ;;
    zed)       say "always-on block in .rules" ;;
    goose)     say "always-on block in .goosehints" ;;
    junie)     say "always-on block in .junie/guidelines.md" ;;
    trae)      say "always-on block in .trae/rules/project_rules.md" ;;
    warp)      say "always-on block in WARP.md" ;;
    augment)   say ".augment/rules/curmudgeon.md (always on)" ;;
  esac
}

install_agent() {
  id="$1"
  say "$id"
  case "$id" in
    claude)
      skill_into "$(scope "$HOME/.claude/skills" .claude/skills)"
      if_always_on append_block "$(scope "$HOME/.claude/CLAUDE.md" CLAUDE.md)" ;;
    codex)
      skill_into "$(scope "$HOME/.codex/skills" .agents/skills)"
      if_always_on append_block "$(scope "$HOME/.codex/AGENTS.md" AGENTS.md)" ;;
    cursor)
      copy_file "$A/cursor/commands/curmudgeon.md" "$(scope "$HOME/.cursor/commands" .cursor/commands)/curmudgeon.md"
      skill_into "$(scope "$HOME/.cursor/skills" .agents/skills)"
      if [ -n "$GLOBAL" ]; then note "Cursor has no global rules file; user rules live in Cursor Settings > Rules"
      else copy_file "$A/cursor/rules/$(rule_variant curmudgeon mdc)" .cursor/rules/curmudgeon.mdc; fi ;;
    windsurf)
      if [ -n "$GLOBAL" ]; then
        note "Windsurf global rules are capped at 6,000 characters, which this rule exceeds. Use project scope"
      else
        copy_file "$A/windsurf/workflows/curmudgeon.md" .windsurf/workflows/curmudgeon.md
        copy_file "$A/windsurf/rules/$(rule_variant curmudgeon md)" .windsurf/rules/curmudgeon.md
        note "newer Devin-branded builds also read .devin/rules/ and .devin/workflows/"
      fi ;;
    cline)
      copy_file "$A/cline/workflows/curmudgeon.md" "$(scope "$HOME/Documents/Cline/Workflows" .clinerules/workflows)/curmudgeon.md"
      skill_into "$(scope "$HOME/.agents/skills" .agents/skills)"
      if_always_on copy_file "$A/cline/rules/curmudgeon.md" "$(scope "$HOME/Documents/Cline/Rules" .clinerules)/curmudgeon.md" ;;
    copilot)
      if [ -n "$GLOBAL" ]; then
        skill_into "$HOME/.copilot/skills"
        note "user-level prompt files live in your VS Code profile; use project scope for /curmudgeon in VS Code"
      else
        copy_file "$A/copilot/prompts/curmudgeon.prompt.md" .github/prompts/curmudgeon.prompt.md
        skill_into .agents/skills
        if_always_on copy_file "$A/copilot/instructions/curmudgeon.instructions.md" .github/instructions/curmudgeon.instructions.md
      fi ;;
    opencode)
      copy_file "$A/opencode/command/curmudgeon.md" "$(scope "$HOME/.config/opencode/command" .opencode/command)/curmudgeon.md"
      skill_into "$(scope "$HOME/.config/opencode/skills" .agents/skills)"
      if_always_on append_block "$(scope "$HOME/.config/opencode/AGENTS.md" AGENTS.md)" ;;
    gemini)
      if command -v gemini >/dev/null 2>&1 && [ -n "$GLOBAL" ]; then
        if [ -n "$UNINSTALL" ]; then say "  run     gemini extensions uninstall curmudgeon"; [ -n "$DRY" ] || gemini extensions uninstall curmudgeon
        else say "  run     gemini extensions install $REPO_URL"; [ -n "$DRY" ] || gemini extensions install "$REPO_URL"; fi
      else
        copy_file "$ROOT/commands/curmudgeon.toml" "$(scope "$HOME/.gemini/commands" .gemini/commands)/curmudgeon.toml"
        skill_into "$(scope "$HOME/.gemini/skills" .agents/skills)"
        if_always_on append_block "$(scope "$HOME/.gemini/GEMINI.md" GEMINI.md)"
        [ -n "$GLOBAL" ] || note "for a user-wide install with the extension manager: gemini extensions install $REPO_URL"
      fi ;;
    qwen)
      copy_file "$A/qwen/commands/curmudgeon.toml" "$(scope "$HOME/.qwen/commands" .qwen/commands)/curmudgeon.toml"
      skill_into "$(scope "$HOME/.qwen/skills" .qwen/skills)"
      if_always_on append_block "$(scope "$HOME/.qwen/QWEN.md" QWEN.md)" ;;
    roo)
      copy_file "$A/roo/commands/curmudgeon.md" "$(scope "$HOME/.roo/commands" .roo/commands)/curmudgeon.md"
      skill_into "$(scope "$HOME/.roo/skills" .roo/skills)"
      if_always_on copy_file "$A/roo/rules/curmudgeon.md" "$(scope "$HOME/.roo/rules" .roo/rules)/curmudgeon.md" ;;
    kilo)
      copy_file "$A/kilo/workflows/curmudgeon.md" "$(scope "$HOME/.kilocode/workflows" .kilocode/workflows)/curmudgeon.md"
      skill_into "$(scope "$HOME/.kilo/skills" .agents/skills)"
      if_always_on copy_file "$A/kilo/rules/curmudgeon.md" "$(scope "$HOME/.kilocode/rules" .kilocode/rules)/curmudgeon.md" ;;
    continue)
      copy_file "$A/continue/rules/$(rule_variant curmudgeon md)" "$(scope "$HOME/.continue/rules" .continue/rules)/curmudgeon.md"
      skill_into "$(scope "$HOME/.continue/skills" .continue/skills)" ;;
    aider)
      dst="$(scope "$HOME/.aider.curmudgeon.md" .aider.curmudgeon.md)"
      copy_file "$A/aider/curmudgeon.md" "$dst"
      [ -n "$UNINSTALL" ] || note "then: aider --read $dst   (or add it under read: in .aider.conf.yml)" ;;
    amp)
      skill_into "$(scope "$HOME/.config/agents/skills" .agents/skills)"
      if_always_on append_block "$(scope "$HOME/.config/AGENTS.md" AGENTS.md)" ;;
    agents-md)
      if [ -n "$GLOBAL" ]; then note "AGENTS.md is per project; drop --global (Codex users: --agent codex --global --always-on)"
      else append_block AGENTS.md; fi ;;
    zed)     if [ -n "$GLOBAL" ]; then note "project scope only"; else append_block .rules; fi ;;
    goose)   append_block "$(scope "$HOME/.config/goose/.goosehints" .goosehints)" ;;
    junie)   if [ -n "$GLOBAL" ]; then note "project scope only"; else append_block .junie/guidelines.md; fi ;;
    trae)    if [ -n "$GLOBAL" ]; then note "project scope only"; else append_block .trae/rules/project_rules.md; fi ;;
    warp)    if [ -n "$GLOBAL" ]; then note "project scope only"; else append_block WARP.md; fi ;;
    augment) if [ -n "$GLOBAL" ]; then note "project scope only"; else copy_file "$A/aider/curmudgeon.md" .augment/rules/curmudgeon.md; fi ;;
    *) echo "unknown agent: $id (see --list)" >&2; return 1 ;;
  esac
}

# --- main ------------------------------------------------------------------

if [ -n "$LIST" ]; then
  printf '%-10s %-9s %s\n' "agent" "detected" "what it installs"
  for id in $ALL_IDS; do
    if detected "$id"; then d="yes"; else d="-"; fi
    printf '%-10s %-9s %s\n' "$id" "$d" "$(describe "$id")"
  done
  exit 0
fi

if [ -n "$ALL" ]; then
  for id in $ALL_IDS; do if detected "$id"; then AGENTS="$AGENTS $id"; fi; done
  [ -n "$AGENTS" ] || { echo "no agents detected. Pick one with --agent <id>; see --list." >&2; exit 1; }
fi

[ -n "$AGENTS" ] || { usage >&2; exit 2; }

for id in $AGENTS; do
  for known in $ALL_IDS; do [ "$id" = "$known" ] && break; done
  [ "$id" = "$known" ] || { echo "unknown agent: $id (see --list)" >&2; exit 2; }
done

[ -n "$DRY" ] && say "(dry run: nothing will be written)"
say "scope: $( [ -n "$GLOBAL" ] && printf 'global (%s)' "$HOME" || printf 'project (%s)' "$PWD" )"
for id in $AGENTS; do install_agent "$id"; done
[ -n "$UNINSTALL" ] || say "done. Say \"curmudgeon mode\" or run /curmudgeon where the agent has the command."
