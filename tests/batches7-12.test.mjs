import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ATLAS_DATA as data} from '../public/assets/data.js';
import {parseCsv} from '../scripts/sync-audit.mjs';
test('all six received batches retain their 72 stations, 1296 judgments and photo credits',()=>{
 const slugs=new Set();let count=0;
 for(let n=7;n<=12;n++){
  const dir=new URL(`../research/station-research-result-batch-${String(n).padStart(3,'0')}/`,import.meta.url);
  const profiles=JSON.parse(fs.readFileSync(new URL('station_profiles.json',dir))).stations;
  const photos=JSON.parse(fs.readFileSync(new URL('photos.json',dir)));
  const rows=parseCsv(fs.readFileSync(new URL('station_research_result.csv',dir),'utf8'));
  for(const p of profiles){assert(!slugs.has(p.slug));slugs.add(p.slug);const s=data.stations.find(s=>s.slug===p.slug);assert(s,p.slug);assert.equal(s.rent1k,p.rent.valueManYen);assert(s.images.length>=3);}
  for(const r of rows){assert.equal(data.stations.find(s=>s.slug===r.station_slug).tags.includes(r.condition_id),r.research_judgment==='該当',r.record_id);count++;}
  for(const p of photos){const s=data.sources[p.key];assert(s);for(const k of ['author','license','sourceUrl','changes'])assert.equal(s[k],p[k]);}
 }
 assert.equal(slugs.size,72);assert.equal(count,1296);
});
