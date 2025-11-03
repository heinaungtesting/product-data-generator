#!/usr/bin/env node

/**
 * Lightweight helper used by the MCP integration for performing
 * repository operations. The original auto-commit flow accidentally
 * added `node_modules` to git history; this script adds guard rails.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DISALLOWED_PATTERNS = [/node_modules/];

async function runGit(args, options = {}) {
  return exec('git', args, { cwd: REPO_ROOT, env: process.env, ...options });
}

async function hasPendingChanges() {
  const { stdout } = await runGit(['status', '--porcelain']);
  return stdout.trim();
}

function guardPaths(statusOutput) {
  const lines = statusOutput.split('\n').filter(Boolean);
  const flagged = [];
  for (const line of lines) {
    if (DISALLOWED_PATTERNS.some((pattern) => pattern.test(line))) {
      flagged.push(line);
    }
  }
  if (flagged.length > 0) {
    const message = [
      'Refusing to commit because disallowed paths were detected:',
      ...flagged.map((l) => `  ${l}`),
      'Please clean the working tree manually and retry.',
    ].join('\n');
    throw new Error(message);
  }
}

export async function executeGitCommit(message) {
  const status = await hasPendingChanges();
  if (!status) {
    return { committed: false, reason: 'nothing_to_commit' };
  }

  guardPaths(status);

  await runGit(['add', '--all']);
  await runGit(['commit', '-m', message]);

  return { committed: true };
}

export async function executeGitPush(remote = 'origin', branch = 'main') {
  await runGit(['push', remote, branch]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    const message = process.argv[2] ?? 'mcp-auto-commit';
    const result = await executeGitCommit(message);
    if (result.committed) {
      console.log(`Committed changes with message: ${message}`);
    } else {
      console.log('No changes to commit.');
    }
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
