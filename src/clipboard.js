import { spawn } from 'node:child_process';
import os from 'node:os';

/**
 * Copies text content directly to the operating system clipboard
 */
export function copyToClipboard(text) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    let args = [];

    if (platform === 'darwin') {
      command = 'pbcopy';
    } else if (platform === 'win32') {
      command = 'clip';
    } else {
      // Linux: test wl-copy or xclip
      command = process.env.WAYLAND_DISPLAY ? 'wl-copy' : 'xclip';
      args = process.env.WAYLAND_DISPLAY ? [] : ['-selection', 'clipboard'];
    }

    try {
      const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
      
      child.on('error', () => {
        // Fallback silently if clipboard binary is unavailable
        resolve(false);
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.stdin.write(text);
      child.stdin.end();
    } catch {
      resolve(false);
    }
  });
}
