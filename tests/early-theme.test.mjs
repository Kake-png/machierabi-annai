import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('every page applies the saved or device theme before loading styles', () => {
  for (const page of ['public/index.html', 'public/stations/index.html', 'public/station/oimachi/index.html', 'public/404.html']) {
    const html = fs.readFileSync(page, 'utf8');
    const block = html.match(/<!--EARLY_THEME_START--><script>([\s\S]*?)<\/script>[\s\S]*?<!--EARLY_THEME_END-->/);
    assert(block, `${page}: missing early theme`);
    assert(html.indexOf('<!--EARLY_THEME_START-->') < html.indexOf('rel="stylesheet"'));
    for (const [saved, system, expected] of [[null,true,true],[null,false,false],['light',true,false],['dark',false,true],['auto',true,true],['invalid',false,false]]) {
      let active = null;
      const document = {documentElement: {classList: {toggle: (_name, value) => { active = value; }}, style: {}}};
      vm.runInNewContext(block[1], {document, localStorage: {getItem: () => saved}, window: {matchMedia: () => ({matches: system})}});
      assert.equal(active, expected, `${page}: ${saved}/${system}`);
      assert.equal(document.documentElement.style.colorScheme, expected ? 'dark' : 'light');
    }
  }
});
