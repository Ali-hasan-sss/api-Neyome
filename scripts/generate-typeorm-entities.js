#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function toPascalCase(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function toSafeTable(nameParts) {
  return nameParts.join('_').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function toCamelCase(name) {
  const pas = toPascalCase(name);
  return pas.length ? pas.charAt(0).toLowerCase() + pas.slice(1) : pas;
}

function inferType(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') {
    if (value.__datatype === 'timestamp' && typeof value.value === 'string') return 'timestamp';
    if (value.__datatype === 'geopoint') return 'geopoint';
    if (value.__datatype === 'document_reference') return 'docref';
    return 'object';
  }
  return typeof value;
}

function mergeSchemaFields(schema, data) {
  for (const [k, v] of Object.entries(data || {})) {
    const t = inferType(v);
    const entry = schema[k] || { types: new Set() };
    entry.types.add(t);
    schema[k] = entry;
  }
}

function collectSchemas(exportData) {
  const schemas = new Map();
  const children = new Map(); // parentKey -> Set(childKey)
  const parentOf = new Map(); // childKey -> parentKey
  const root = exportData.__collections || {};

  function ensureSchema(pathParts) {
    const key = pathParts.join('/');
    if (!schemas.has(key)) schemas.set(key, {});
    return schemas.get(key);
  }

  function link(parentParts, childParts) {
    const pKey = parentParts.join('/');
    const cKey = childParts.join('/');
    if (!children.has(pKey)) children.set(pKey, new Set());
    children.get(pKey).add(cKey);
    parentOf.set(cKey, pKey);
  }

  async function walkCollections(pathParts, colObj) {
    const schema = ensureSchema(pathParts);
    for (const [, docObj] of Object.entries(colObj || {})) {
      const docData = docObj.__doc || {};
      mergeSchemaFields(schema, docData);
      const sub = docObj.__subcollections || {};
      for (const [subColName, subColObj] of Object.entries(sub)) {
        const childParts = [...pathParts, subColName];
        link(pathParts, childParts);
        await walkCollections(childParts, subColObj);
      }
    }
  }

  for (const [colName, colObj] of Object.entries(root)) {
    walkCollections([colName], colObj);
  }

  return { schemas, children, parentOf };
}

function columnDefForTypes(types) {
  if (types.has('timestamp')) return { tsType: 'Date', colType: "timestamptz", transform: 'timestamp' };
  if (types.has('boolean') && types.size === 1) return { tsType: 'boolean', colType: 'boolean' };
  if (types.has('number') && types.size === 1) return { tsType: 'number', colType: 'double precision' };
  if (types.has('array')) return { tsType: 'any', colType: 'jsonb' };
  if (types.has('object')) return { tsType: 'any', colType: 'jsonb' };
  if (types.has('geopoint')) return { tsType: 'any', colType: 'jsonb' };
  if (types.has('docref')) return { tsType: 'string', colType: 'text' };
  return { tsType: 'string', colType: 'text' };
}

function generateEntitySource(entityName, tableName, schema, relationInfo) {
  const lines = [];
  lines.push("import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';");
  const importSet = new Set();
  // Parent import
  if (relationInfo.parentEntity && relationInfo.parentImport) {
    importSet.add(`import { ${relationInfo.parentEntity} } from '${relationInfo.parentImport}';`);
  }
  // Children imports
  for (const child of relationInfo.children || []) {
    if (child.entityName && child.importPath) {
      importSet.add(`import { ${child.entityName} } from '${child.importPath}';`);
    }
  }
  lines.push(...Array.from(importSet));
  lines.push("");
  lines.push(`@Entity({ name: '${tableName}' })`);
  lines.push(`export class ${entityName} {`);
  lines.push(`  @PrimaryColumn({ type: 'text' })`);
  lines.push(`  id: string;`);

  // Parent relation (ManyToOne)
  if (relationInfo.parentEntity) {
    const parentEntity = relationInfo.parentEntity;
    const parentProp = toCamelCase(relationInfo.parentName || 'parent');
    lines.push(`  @Column({ type: 'text', nullable: true })`);
    lines.push(`  ${parentProp}Id?: string;`);
    lines.push(``);
    lines.push(`  @ManyToOne(() => ${parentEntity}, (parent) => parent.${toCamelCase(relationInfo.childCollectionName)}s, { onDelete: 'CASCADE', nullable: true })`);
    lines.push(`  @JoinColumn({ name: '${parentProp}Id' })`);
    lines.push(`  ${parentProp}?: ${parentEntity};`);
  }
  for (const [field, info] of Object.entries(schema)) {
    const { tsType, colType } = columnDefForTypes(info.types);
    const optional = true;
    const safeField = field.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) ? field : `f_${Buffer.from(field).toString('hex').slice(0, 12)}`;
    lines.push(`  @Column({ type: '${colType}', nullable: true })`);
    lines.push(`  ${safeField}${optional ? '?' : ''}: ${tsType};`);
  }

  // Children relations (OneToMany)
  for (const child of relationInfo.children || []) {
    const childEntity = child.entityName;
    const prop = toCamelCase(child.collectionName) + 's';
    lines.push(``);
    lines.push(`  @OneToMany(() => ${childEntity}, (child) => child.${toCamelCase(child.parentName || 'parent')}, { cascade: false })`);
    lines.push(`  ${prop}?: ${childEntity}[];`);
  }
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function writeEntities(outDir, graph) {
  const { schemas, children, parentOf } = graph;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  for (const [key, schema] of schemas.entries()) {
    const parts = key.split('/');
    const tableName = toSafeTable(parts);
    const entityName = toPascalCase(parts.join('_'));
    // Build relation info for this entity
    const relationInfo = { children: [], parentEntity: null, parentName: null, childCollectionName: parts[parts.length - 1], parentImport: null };
    const pKey = parentOf.get(key);
    if (pKey) {
      const pParts = pKey.split('/');
      relationInfo.parentEntity = toPascalCase(pParts.join('_'));
      relationInfo.parentName = pParts[pParts.length - 1];
      relationInfo.parentImport = `./${toSafeTable(pParts)}.entity`;
    }
    const childSet = children.get(key) || new Set();
    for (const cKey of childSet) {
      const cParts = cKey.split('/');
      relationInfo.children.push({
        entityName: toPascalCase(cParts.join('_')),
        collectionName: cParts[cParts.length - 1],
        parentName: parts[parts.length - 1],
        importPath: `./${toSafeTable(cParts)}.entity`,
      });
    }
    const src = generateEntitySource(entityName, tableName, schema, relationInfo);
    const filePath = path.join(outDir, `${tableName}.entity.ts`);
    fs.writeFileSync(filePath, src, 'utf8');
  }
}

function main() {
  const args = process.argv.slice(2);
  const schemaPathIdx = Math.max(args.indexOf('-i'), args.indexOf('--input'));
  const outIdx = Math.max(args.indexOf('-o'), args.indexOf('--out'));
  const input = (schemaPathIdx >= 0 && args[schemaPathIdx + 1]) || 'schema.json';
  const outDir = (outIdx >= 0 && args[outIdx + 1]) || path.join('src', 'entities');

  const resolvedIn = path.resolve(input);
  if (!fs.existsSync(resolvedIn)) {
    console.error(`Input file not found: ${resolvedIn}`);
    process.exit(1);
  }
  const exportData = readJSON(resolvedIn);
  const graph = collectSchemas(exportData);
  const resolvedOut = path.resolve(outDir);
  writeEntities(resolvedOut, graph);
  console.log(`Generated ${graph.schemas.size} entities in ${resolvedOut}`);
}

if (require.main === module) {
  main();
}
