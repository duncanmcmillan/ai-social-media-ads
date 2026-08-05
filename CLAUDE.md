# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`ai-social-media-ads` — AI-powered social media ad generation/management tool. Currently in early setup; no build system, dependencies, or source code have been added yet.

## Claude Code Permissions

`.claude/settings.local.json` currently restricts allowed bash commands to `ls` only. If you need to run additional commands (e.g., `npm`, `python`, package managers), the user will need to update the `allow` list in that file or approve commands interactively.
