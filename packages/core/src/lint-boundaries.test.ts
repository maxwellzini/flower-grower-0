import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

describe('ESLint boundary rules', () => {
  const eslint = new ESLint();

  it('blocks three imports in packages/core', async () => {
    const results = await eslint.lintText(
      "import * as THREE from 'three';\nconsole.log(THREE);",
      {
        filePath: 'packages/core/src/violating-import.ts',
      },
    );
    const messages = results[0]?.messages.map((m) => m.message) ?? [];
    expect(
      messages.some((msg) =>
        msg.includes('Importing three.js in core or species is strictly prohibited.'),
      ),
    ).toBe(true);
  });

  it('blocks three imports in packages/species', async () => {
    const results = await eslint.lintText(
      "import * as THREE from 'three';\nconsole.log(THREE);",
      {
        filePath: 'packages/species/src/violating-import.ts',
      },
    );
    const messages = results[0]?.messages.map((m) => m.message) ?? [];
    expect(
      messages.some((msg) =>
        msg.includes('Importing three.js in core or species is strictly prohibited.'),
      ),
    ).toBe(true);
  });

  it('blocks DOM package imports in packages/core', async () => {
    const results = await eslint.lintText(
      "import { Overlay } from '@flower-grower/dom';\nconsole.log(Overlay);",
      {
        filePath: 'packages/core/src/violating-dom-import.ts',
      },
    );
    const messages = results[0]?.messages.map((m) => m.message) ?? [];
    expect(
      messages.some((msg) =>
        msg.includes('Importing DOM package in core or species is strictly prohibited.'),
      ),
    ).toBe(true);
  });

  it('blocks Math.random() and Date.now() in packages/core', async () => {
    const results = await eslint.lintText(
      'export const x = Math.random();\nexport const y = Date.now();',
      {
        filePath: 'packages/core/src/violating-random.ts',
      },
    );
    const messages = results[0]?.messages.map((m) => m.message) ?? [];
    expect(
      messages.some((msg) => msg.includes('Math.random is prohibited in core.')),
    ).toBe(true);
    expect(messages.some((msg) => msg.includes('Date.now is prohibited in core.'))).toBe(
      true,
    );
  });
});
