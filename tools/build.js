/**
 * Build de déploiement : réassemble le projet en UN SEUL fichier HTML autonome.
 * CSS, scripts et polices (en base64) sont intégrés : la borne n'a besoin ni
 * de connexion ni d'aucun autre fichier.
 *
 * Usage :  node tools/build.js
 * Sortie : dist/securite-routiere-kiosk.html
 *
 * Aucune dépendance : Node.js seul suffit.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let html = read('index.html');

// 1. Feuilles de style : fonts.css (polices converties en base64) puis style.css
html = html.replace(/<link rel="stylesheet" href="([^"]+)">\n?/g, (_, href) => {
  let css = read(href);
  if (href.endsWith('fonts.css')) {
    css = css.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (__, file) => {
      const b64 = fs.readFileSync(path.join(ROOT, 'fonts', file)).toString('base64');
      return `url(data:font/woff2;base64,${b64})`;
    });
  }
  return `<style>\n${css}</style>\n`;
});

// 2. Scripts : intégrés dans l'ordre de index.html
html = html.replace(/<script src="([^"]+)"><\/script>\n?/g, (_, src) =>
  `<script>\n${read(src)}</script>\n`
);

// 3. Images des panneaux officiels : référencées comme chemins relatifs dans panneaux.js,
//    converties en base64 pour que le fichier de déploiement reste autonome.
html = html.replace(/panneaux\/([\w().-]+\.(?:webp|png))/g, (match, file) => {
  const ext = file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/webp';
  const b64 = fs.readFileSync(path.join(ROOT, 'panneaux', file)).toString('base64');
  return `data:${ext};base64,${b64}`;
});

// 4. Garde-fou : aucune ressource externe ne doit subsister
const external = html.match(/(?:src|href)="(?!data:)[^"#]+"/g);
if (external) {
  console.error('Ressources externes restantes :', external);
  process.exit(1);
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'securite-routiere-kiosk.html');
fs.writeFileSync(out, html);
console.log(`Build OK : ${path.relative(ROOT, out)} (${Math.round(html.length / 1024)} Ko)`);
