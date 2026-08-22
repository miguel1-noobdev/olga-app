import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function findLevelTwoSection(markdown: string, heading: RegExp): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => heading.test(normalize(line)));

  if (start === -1) {
    return '';
  }

  const nextSection = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return lines.slice(start, nextSection === -1 ? undefined : nextSection).join('\n');
}

function expectHierarchyEntry(
  section: string,
  anchor: RegExp,
  concepts: RegExp[]
): void {
  const entry = normalize(section)
    .split('\n')
    .find((line) => anchor.test(line));

  expect(entry, `Missing authority entry matching ${anchor}`).toBeDefined();
  for (const concept of concepts) {
    expect(entry).toMatch(concept);
  }
}

function noticePreamble(markdown: string): string {
  return normalize(markdown).split(/\n##\s+/)[0];
}

describe('project authority policy', () => {
  it('defines a concise authority hierarchy in AGENTS.md', () => {
    const agents = readProjectFile('AGENTS.md');
    const hierarchy = findLevelTwoSection(agents, /^##\s+.*(?:authority|autoridad)/);

    expect(hierarchy, 'AGENTS.md must contain a project authority section').not.toBe('');
    expectHierarchyEntry(hierarchy, /(?:\bcode\b|\bcodigo\b).*\btests?\b|\btests?\b.*(?:\bcode\b|\bcodigo\b)/, [
      /(?:implemented behavior|comportamiento implementado|conducta implementada)/,
    ]);
    expectHierarchyEntry(hierarchy, /\bopenspec\b/, [
      /\b(?:active|activos?|activas?)\b/,
      /\b(?:approved|aprobados?|aprobadas?)\b/,
      /\b(?:accepted|aceptados?|aceptadas?)\b/,
      /\b(?:change|cambio)\b/,
      /\b(?:contract|contrato)\b/,
    ]);
    expectHierarchyEntry(hierarchy, /\bgithub\b.*\bissues?\b|\bissues?\b.*\bgithub\b/, [
      /\b(?:pending|pendiente|pendientes)\b/,
      /\b(?:work|trabajo|dependency|dependencies|dependencia|dependencias)\b/,
    ]);
    expectHierarchyEntry(hierarchy, /\bdocs\/runbook\.md\b/, [
      /\b(?:production|produccion)\b/,
      /\b(?:operations|operation|operaciones|operacion|operativa)\b/,
    ]);
    expectHierarchyEntry(hierarchy, /\bideas\//, [
      /(?:non[- ]canonical|not canonical|no (?:es )?canonico)/,
      /\b(?:exploratory|exploratorio|exploratoria)\b/,
      /(?:changeable|cambiable|mutable|subject to change|sujeto a cambios?|puede cambiar)/,
    ]);
  });

  it.each(['ideas/README.md', 'ideas/designUI/CONTEXTO_PLATAFORMA.md'])(
    'marks %s as non-canonical and exploratory near the top',
    (path) => {
      const notice = noticePreamble(readProjectFile(path));

      expect(notice).toMatch(/(?:non[- ]canonical|not canonical|no (?:es )?canonico)/);
      expect(notice).toMatch(/\b(?:exploratory|exploratorio|exploratoria)\b/);
    }
  );

  it('describes CONTEXTO_PLATAFORMA.md in the root README as planning history', () => {
    const contextReferences = normalize(readProjectFile('README.md'))
      .split('\n')
      .filter((line) => line.includes('ideas/designui/contexto_plataforma.md'));
    const planningHistoryReference = contextReferences.find(
      (line) => /\b(?:planning|planificacion)\b/.test(line) && /\b(?:history|historical|historia|historico|historica)\b/.test(line)
    );

    expect(planningHistoryReference).toBeDefined();
    expect(planningHistoryReference).not.toMatch(
      /(?:current implementation status|estado actual de (?:la )?implementacion|fuente de verdad)/
    );
  });
});
