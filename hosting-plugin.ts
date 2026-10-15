/**
 * Dev-server-only image hosting through this project's GitHub repository.
 *
 * Email recipients can only see images that live at a public URL. While
 * `npm run dev` is running, the app can:
 *   POST /__hosting/upload   save a processed image to public/hosted/<hash>.<ext>
 *   GET  /__hosting/status   count hosted images that are not pushed yet
 *   POST /__hosting/publish  commit public/hosted and push it to GitHub
 *
 * Nothing here exists in a production build. Requests must come from the app's
 * own origin, so other websites can't write files or trigger a push.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const run = promisify(execFile);
const HOSTED_DIR = 'public/hosted';
const MAX_BYTES = 2 * 1024 * 1024;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BYTES * 1.4) {
        reject(new Error('Image too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  return !!origin && !!req.headers.host && new URL(origin).host === req.headers.host;
}

async function git(root: string, ...args: string[]) {
  return run('git', args, { cwd: root, windowsHide: true });
}

async function pendingFiles(root: string): Promise<string[]> {
  const { stdout } = await git(root, 'status', '--porcelain', '--untracked-files=all', '--', HOSTED_DIR);
  const local = stdout.split('\n').filter(Boolean).map((l) => l.slice(3));
  // Committed but not pushed yet also counts as pending.
  let unpushed: string[] = [];
  try {
    const { stdout: out } = await git(root, 'diff', '--name-only', '@{upstream}..HEAD', '--', HOSTED_DIR);
    unpushed = out.split('\n').filter(Boolean);
  } catch {
    /* no upstream configured */
  }
  return [...new Set([...local, ...unpushed])];
}

export function hostingPlugin(): Plugin {
  return {
    name: 'signature-studio-hosting',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use('/__hosting', async (req, res) => {
        try {
          if (req.method === 'GET' && req.url === '/status') {
            return send(res, 200, { pending: (await pendingFiles(root)).length });
          }
          if (req.method !== 'POST' || !sameOrigin(req)) return send(res, 403, { error: 'Forbidden' });

          if (req.url === '/upload') {
            const { dataUrl } = JSON.parse(await readBody(req)) as { dataUrl?: string };
            const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? '');
            if (!match) return send(res, 400, { error: 'Expected a PNG or JPEG data URL' });
            const bytes = Buffer.from(match[2], 'base64');
            if (bytes.length > MAX_BYTES) return send(res, 413, { error: 'Image too large' });
            // Content hash: re-uploading the same image reuses the same file and URL.
            const name = `${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.${match[1] === 'png' ? 'png' : 'jpg'}`;
            await mkdir(path.join(root, HOSTED_DIR), { recursive: true });
            await writeFile(path.join(root, HOSTED_DIR, name), bytes);
            return send(res, 200, { path: `hosted/${name}` });
          }

          if (req.url === '/publish') {
            await git(root, 'add', '--', HOSTED_DIR);
            const { stdout: staged } = await git(root, 'diff', '--cached', '--name-only', '--', HOSTED_DIR);
            if (staged.trim()) {
              // Commit only the hosted images, never other work in progress.
              await git(root, 'commit', '-m', 'Host signature images', '--', HOSTED_DIR);
            }
            await git(root, 'push');
            return send(res, 200, { pending: (await pendingFiles(root)).length });
          }
          return send(res, 404, { error: 'Not found' });
        } catch (err) {
          const e = err as { stderr?: string; message?: string };
          return send(res, 500, { error: (e.stderr || e.message || 'Failed').trim().split('\n').slice(-3).join('\n') });
        }
      });
    },
  };
}
