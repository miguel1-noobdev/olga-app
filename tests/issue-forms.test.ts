import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const formPath = resolve(process.cwd(), '.github/ISSUE_TEMPLATE/chore.yml');

type IssueFormField = {
  type: string;
  id: string;
  attributes: { label: string };
  validations: { required: boolean };
};

describe('canonical chore issue form', () => {
  it('defines the maintenance request contract without protected workflow labels', () => {
    const form = parse(readFileSync(formPath, 'utf8')) as {
      name: string;
      description: string;
      title: string;
      labels: string[];
      body: IssueFormField[];
    };

    expect(form.name).toMatch(/maintenance|operations/i);
    expect(form.description).toMatch(/maintenance|operations/i);
    expect(form.title).toBe('chore: ');
    expect(form.labels).toEqual(['type:chore']);
    expect(form.body.map(({ id }) => id)).toEqual([
      'requested_change',
      'motivation',
      'acceptance_criteria',
      'boundaries',
      'context',
    ]);

    const fields = Object.fromEntries(form.body.map((field) => [field.id, field]));

    for (const [id, label] of [
      ['requested_change', 'Requested change'],
      ['motivation', 'Motivation'],
      ['acceptance_criteria', 'Acceptance criteria'],
    ]) {
      expect(fields[id]).toMatchObject({
        type: 'textarea',
        attributes: { label },
        validations: { required: true },
      });
    }

    for (const [id, label] of [
      ['boundaries', 'Boundaries'],
      ['context', 'Additional context'],
    ]) {
      expect(fields[id]).toMatchObject({
        type: 'textarea',
        attributes: { label },
        validations: { required: false },
      });
    }

    expect(Object.keys(fields)).not.toContain('priority');
  });
});
