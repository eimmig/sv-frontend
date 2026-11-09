import tokensSource from './_tokens.scss' with { loader: 'text' };
import paletteSource from '../theme-colors.scss' with { loader: 'text' };

type Rgb = readonly [number, number, number];
type Theme = 'light' | 'dark';

const WCAG_AA_NORMAL_TEXT = 4.5;

function parseHex(hex: string): Rgb {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => Number.parseInt(value.substring(i, i + 2), 16)) as unknown as Rgb;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function tint(color: Rgb, alpha: number, backdrop: Rgb): Rgb {
  return color.map((c, i) => alpha * c + (1 - alpha) * backdrop[i]) as unknown as Rgb;
}

function mixColors(a: Rgb, b: Rgb, weightOfA: number): Rgb {
  return a.map((c, i) => weightOfA * c + (1 - weightOfA) * b[i]) as unknown as Rgb;
}

function readTokens(theme: Theme): Map<string, string> {
  const block = new RegExp(String.raw`@mixin ${theme}-tokens \{([\s\S]*?)\n\}`).exec(tokensSource);
  if (!block) {
    throw new Error(`@mixin ${theme}-tokens not found in _tokens.scss`);
  }
  const raw = new Map<string, string>();
  for (const [, name, value] of block[1].matchAll(/(--color-[a-z-]+):\s*([^;]+);/g)) {
    raw.set(name, value.trim());
  }
  const resolved = new Map<string, string>();
  for (const [name, value] of raw) {
    const alias = /^var\((--color-[a-z-]+)\)$/.exec(value);
    resolved.set(name, alias ? (raw.get(alias[1]) ?? value) : value);
  }
  return resolved;
}

function readTone(palette: string, tone: number): string {
  const block = new RegExp(String.raw`\n  ${palette}: \(([\s\S]*?)\n  \),`).exec(paletteSource);
  const match = block && new RegExp(String.raw`\n\s+${tone}: (#[0-9a-f]{6}),`).exec(block[1]);
  if (!match) {
    throw new Error(`tone ${tone} of palette ${palette} not found in theme-colors.scss`);
  }
  return match[1];
}

interface Pair {
  readonly name: string;
  readonly ratio: number;
}

function pairsFor(theme: Theme): Pair[] {
  const tokens = readTokens(theme);
  const color = (name: string): Rgb => {
    const value = tokens.get(name);
    if (!value || !/^#[0-9a-f]{6}$/i.test(value)) {
      throw new Error(`${name} is not a hex color in ${theme} tokens: ${value}`);
    }
    return parseHex(value);
  };
  const backgrounds = ['--color-background', '--color-surface', '--color-surface-elevated'];
  const surface = color('--color-surface');
  const pairs: Pair[] = [];

  for (const text of [
    '--color-text-primary',
    '--color-text-secondary',
    '--color-brand',
    '--color-positive',
    '--color-negative',
    '--color-action-neutral',
  ]) {
    for (const bg of backgrounds) {
      pairs.push({ name: `${text} on ${bg}`, ratio: contrastRatio(color(text), color(bg)) });
    }
  }

  const ownTints: ReadonlyArray<readonly [string, number]> = [
    ['--color-positive', 0.16],
    ['--color-negative', 0.16],
    ['--color-action-neutral', 0.16],
    ['--color-brand', 0.12],
    ['--color-brand', 0.18],
    ['--color-positive', 0.1],
  ];
  for (const [token, alpha] of ownTints) {
    const backdrop = tint(color(token), alpha, surface);
    pairs.push({
      name: `${token} on ${token} ${alpha * 100}% over --color-surface`,
      ratio: contrastRatio(color(token), backdrop),
    });
  }
  // badges: texto = tom 80% com o texto principal, sobre o proprio tom a 16% sobre cada fundo
  for (const token of ['--color-positive', '--color-negative', '--color-action-neutral']) {
    const text = mixColors(color(token), color('--color-text-primary'), 0.8);
    for (const bg of backgrounds) {
      pairs.push({
        name: `badge ${token} on its 16% tint over ${bg}`,
        ratio: contrastRatio(text, tint(color(token), 0.16, color(bg))),
      });
    }
  }
  pairs.push({
    name: '--color-text-secondary on --color-positive 10% over --color-surface',
    ratio: contrastRatio(
      color('--color-text-secondary'),
      tint(color('--color-positive'), 0.1, surface),
    ),
  });

  const [roleTone, onRoleTone] = theme === 'light' ? [40, 100] : [80, 20];
  const primary = parseHex(readTone('primary', roleTone));
  const error = parseHex(readTone('error', roleTone));
  for (const bg of backgrounds) {
    pairs.push({ name: `M3 primary on ${bg}`, ratio: contrastRatio(primary, color(bg)) });
    pairs.push({ name: `M3 error on ${bg}`, ratio: contrastRatio(error, color(bg)) });
  }
  pairs.push({
    name: 'M3 on-primary on M3 primary',
    ratio: contrastRatio(parseHex(readTone('primary', onRoleTone)), primary),
  });

  return pairs;
}

describe('WCAG contrast ratio', () => {
  it('shouldMeasureBlackOnWhiteAsTwentyOne', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  });

  it('shouldMeasureEqualColorsAsOne', () => {
    expect(contrastRatio([46, 112, 160], [46, 112, 160])).toBe(1);
  });

  it('shouldBeSymmetric', () => {
    expect(contrastRatio([11, 22, 34], [242, 247, 245])).toBeCloseTo(
      contrastRatio([242, 247, 245], [11, 22, 34]),
      10,
    );
  });

  it('shouldCompositeTintOverBackdrop', () => {
    expect(tint([255, 0, 0], 0.16, [255, 255, 255])).toEqual([255, 214.2, 214.2]);
  });
});

describe.each<Theme>(['light', 'dark'])('%s theme color tokens', (theme) => {
  it('shouldResolvePositiveToBrand', () => {
    const tokens = readTokens(theme);
    expect(tokens.get('--color-positive')).toBe(tokens.get('--color-brand'));
  });

  it.each(pairsFor(theme).map((pair) => [pair.name, pair.ratio] as const))(
    'shouldKeep %s at or above WCAG AA 4.5:1',
    (_name, ratio) => {
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    },
  );
});
