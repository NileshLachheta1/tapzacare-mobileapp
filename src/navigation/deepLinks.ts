export type CareLink = { kind: 'doctor' | 'prescription'; id: string };
export function parseCareLink(url: string): CareLink | null {
  const match = /^tapzacare:\/\/(doctor|prescription)\/([^/?#]+)\/?$/.exec(url);
  if (!match) return null;
  try {
    const id = decodeURIComponent(match[2] ?? '');
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
    return { kind: match[1] as CareLink['kind'], id };
  } catch {
    return null;
  }
}
