import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

export async function startAppServer({ port = 3010 } = {}) {
  const env = { ...process.env, APP_PORT: String(port), NODE_ENV: 'test' };
  const child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  let resolvedPort = null;

  const waitForReady = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start. stdout=${stdout}\nstderr=${stderr}`));
    }, 20000);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      const match = text.match(/http:\/\/localhost:(\d+)/);
      if (match && !resolvedPort) {
        resolvedPort = Number(match[1]);
        clearTimeout(timeout);
        resolve(resolvedPort);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (!resolvedPort) {
        clearTimeout(timeout);
        reject(new Error(`Server exited before ready (${code}). stdout=${stdout}\nstderr=${stderr}`));
      }
    });
  });

  const actualPort = await waitForReady;
  await delay(500);

  return {
    baseUrl: `http://localhost:${actualPort}`,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) {
        return;
      }

      const exitPromise = new Promise((resolve) => {
        child.once('exit', resolve);
      });

      child.kill();
      await Promise.race([exitPromise, delay(2000)]);

      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await Promise.race([exitPromise, delay(2000)]);
      }
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}

export async function loginAndGetCookie(baseUrl, correo, clave) {
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ correo, clave }),
  });

  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);

  return {
    response,
    cookieHeader: cookies.map((value) => value.split(';')[0]).join('; '),
  };
}

export async function httpGet(baseUrl, path, cookieHeader = '') {
  return fetch(`${baseUrl}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

export async function httpPostForm(baseUrl, path, formData, cookieHeader = '') {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: new URLSearchParams(formData),
  });
}
