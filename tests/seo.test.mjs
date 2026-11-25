import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { ATLAS_DATA } from '../public/assets/data.js';
import { stationGuide, pilotStationSlugs, relatedGuideStations } from '../public/assets/station-guide.js';
const root = path.resolve(import.meta.dirname, '../public');
const files = fs.readdirSync(root, {recursive:true}).filter(f => f.endsWith('.html'));
test('all pages have consistent identity, metadata and social image; indexable titles/descriptions are unique', () => {
 const titles=new Set(), descriptions=new Set();
 for (const file of files) {
  const html=fs.readFileSync(path.join(root,file),'utf8'), d=new JSDOM(html).window.document;
  assert(!/駅まち図譜|わたしのみやこ/.test(html),file);
  assert.equal(d.querySelectorAll('link[rel="canonical"]').length,1,file);
  assert.equal(d.querySelectorAll('meta[name="description"]').length,1,file);
  assert.equal(d.querySelectorAll('h1').length,1,file);
  const canonical=d.querySelector('link[rel="canonical"]').href;
  const schema=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(schema.url,canonical,file);
  assert.equal(d.querySelector('meta[property="og:url"]').content,canonical,file);
  const img=new URL(d.querySelector('meta[property="og:image"]').content);
  assert(fs.existsSync(path.join(root,img.pathname)),file);
  if (d.querySelector('meta[name="robots"]').content.includes('noindex')) continue;
  const desc=d.querySelector('meta[name="description"]').content;
  assert(!titles.has(d.title),'duplicate title: '+file); titles.add(d.title);
  assert(!descriptions.has(desc),'duplicate description: '+file);descriptions.add(desc);
 }
});
test('contact page links to the supplied Google Form and does not rely on a contact Worker', () => {
 const html=fs.readFileSync(path.join(root,'contact/index.html'),'utf8');
 const d=new JSDOM(html).window.document;
 const link=d.querySelector('a[href="https://forms.gle/n291N3gCkJ53yYA27"]');
 assert(link, 'Google Form link is present');
 assert.equal(link.target, '_blank');
 assert.equal(link.rel, 'noopener noreferrer');
 assert(!html.includes('/api/contact'));
 const wrangler=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../wrangler.jsonc'),'utf8'));
 assert.equal(wrangler.main, 'worker/domain-redirect.mjs');
 assert.equal(wrangler.assets.binding, 'ASSETS');
 assert.equal(wrangler.assets.run_worker_first, true);
});
test('sitemap contains canonical indexable HTML only, with no query variants',()=>{
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 for(const [,url] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)){
  const u=new URL(url);assert.equal(u.search,'');
  const d=new JSDOM(fs.readFileSync(path.join(root,u.pathname,'index.html'),'utf8')).window.document;
  assert.equal(d.querySelector('link[rel="canonical"]').href,url);
  assert(!d.querySelector('meta[name="robots"]').content.includes('noindex'));
 }
});

test('home and directory station counts follow the published station data', () => {
 const {stationCount}=JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8'));
 const d=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8')).window.document;
 const listing=new JSDOM(fs.readFileSync(path.join(root,'stations/index.html'),'utf8')).window.document;
 assert.equal(listing.querySelectorAll('.directory-list > li').length,stationCount);
 assert.equal(d.querySelector('.panel-head > p').textContent,`東京・神奈川・千葉・${stationCount}駅`);
 assert.equal(d.querySelector('#result-count').textContent,`${stationCount}駅`);
 const expected=`東京・神奈川・千葉の${stationCount}駅`;
 for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) assert(d.querySelector(selector).content.includes(expected));
 assert(JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent).description.includes(expected));
 assert(listing.querySelector('.directory-title > p').textContent.includes(expected));
 assert(listing.querySelector('.site-footer').textContent.includes(expected));
});

test('all station pages have matching static copy, metadata and crawlable related links', () => {
 assert.equal(pilotStationSlugs.length,10);
 for(const {slug} of ATLAS_DATA.stations){
  const station=ATLAS_DATA.stations.find(s=>s.slug===slug); assert(station,slug);
  const guide=stationGuide(station);
  const d=new JSDOM(fs.readFileSync(path.join(root,'station',slug,'index.html'),'utf8')).window.document;
  assert.equal(d.title,guide.title,slug);
  assert.equal(d.querySelector('meta[name="description"]').content,guide.description,slug);
  assert.equal(d.querySelector('meta[property="og:description"]').content,guide.description,slug);
  assert.equal(d.querySelector('.static-seo-lead').textContent,guide.intro,slug);
  assert(guide.intro.length>20,slug);
  if(!pilotStationSlugs.includes(slug)) {
   assert(station.editorialSummary && guide.intro.startsWith(station.editorialSummary.trim()),slug);
   assert(!guide.intro.includes('施設名・アクセス・確認日は各条件の根拠で確認できます。'),slug);
  }
  assert.equal(d.querySelector('h1').textContent,station.name+'駅の住みやすさ',slug);
  assert(d.querySelector('.static-seo-content').textContent.includes(station.rent1k.toFixed(2)+'万円'),slug);
  assert.deepEqual([...d.querySelectorAll('#related a')].map(a=>a.getAttribute('href')),relatedGuideStations(station,ATLAS_DATA.stations).map(s=>`/station/${s.slug}/`));
  assert.equal(new Set([...d.querySelectorAll('#related a')].map(a=>a.getAttribute('href'))).size,3);
 }
});

test('Sobu rapid guide compares every listed candidate with sourced rent and links',()=>{
 const id='line-7cd84b30a1';
 const d=new JSDOM(fs.readFileSync(path.join(root,'routes',id,'index.html'),'utf8')).window.document;
 const rows=ATLAS_DATA.stations.filter(s=>s.routes.includes(id)).sort((a,b)=>a.rent1k-b.rent1k);
 assert(rows.length>0);
 assert(d.title.includes('住みやすさ・家賃比較'));
 assert.equal(d.querySelector('link[rel="canonical"]').href,'https://machierabi.3f7735.org/routes/'+id+'/');
 assert(!d.querySelector('meta[name="robots"]').content.includes('noindex'));
 const entries=[...d.querySelectorAll('#route-living-guide [data-route-guide-station]')];
 assert.deepEqual(entries.map(e=>e.dataset.routeGuideStation),rows.map(s=>s.slug));
 for(let i=0;i<rows.length;i++){
  const s=rows[i],e=entries[i];
  assert(e.textContent.includes(s.rent1k.toFixed(2)+'万円'));
  assert([...e.querySelectorAll('a')].some(a=>a.getAttribute('href')===s.rentSourceUrl));
  assert(e.querySelector('a[href="/station/'+s.slug+'/"]'));
 }
});
