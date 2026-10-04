/**
 * Ribbed gold sphere as a standalone SVG document (data URI). Shared by the landing page and the
 * signed-in app; has no animation-library dependency.
 */
const R = 94; const C = 100; const TILT = 0.32; // sin of the camera tilt: how much the ribs curve

export function buildRibs(count) {
  const ribs = [];
  for (let i = 1; i < count; i += 1) {
    const lat = -Math.PI / 2 + (Math.PI * i) / count;       // -90°..90°
    const rx = R * Math.cos(lat);
    const y = C + R * Math.sin(lat) * Math.sqrt(1 - TILT * TILT);
    const ry = rx * TILT;
    const w = 1.2 + 3.6 * Math.cos(lat);                    // thinner near the poles
    ribs.push({ rx, ry, y, w, key: i });
  }
  return ribs;
}

/** The sphere as a standalone SVG document (rasterised once by the browser when used as an <img>). */
export function sphereSvg(ribs) {
  const ribMarkup = ribs.map((r) => (
    `<path d="M ${C - r.rx} ${r.y} A ${r.rx} ${r.ry} 0 0 0 ${C + r.rx} ${r.y}" fill="none" stroke="#1a0d02" stroke-opacity="0.55" stroke-width="${r.w.toFixed(2)}"/>`
    + `<path d="M ${C - r.rx} ${(r.y + r.w * 0.9).toFixed(2)} A ${r.rx} ${r.ry} 0 0 0 ${C + r.rx} ${(r.y + r.w * 0.9).toFixed(2)}" fill="none" stroke="#ffe9a8" stroke-opacity="0.34" stroke-width="${(r.w * 0.35).toFixed(2)}"/>`
  )).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>
<radialGradient id="b" cx="34%" cy="28%" r="88%"><stop offset="0" stop-color="#fff2b8"/><stop offset=".22" stop-color="#f2b51a"/><stop offset=".52" stop-color="#a8650a"/><stop offset=".8" stop-color="#3d1f04"/><stop offset="1" stop-color="#120a02"/></radialGradient>
<radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>
<linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a" stop-opacity=".9"/><stop offset=".55" stop-color="#CA8A04" stop-opacity=".15"/><stop offset="1" stop-color="#38bdf8" stop-opacity=".55"/></linearGradient>
<radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#CA8A04" stop-opacity=".35"/><stop offset="1" stop-color="#CA8A04" stop-opacity="0"/></radialGradient>
<radialGradient id="p" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="c"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
</defs>
<circle cx="${C}" cy="${C}" r="${R + 24}" fill="url(#g)"/>
<circle cx="${C}" cy="${C}" r="${R}" fill="url(#b)"/>
<g clip-path="url(#c)">${ribMarkup}<circle cx="${C}" cy="${C}" r="${R}" fill="url(#s)"/><ellipse cx="68" cy="56" rx="34" ry="20" fill="url(#p)" transform="rotate(-32 68 56)"/></g>
<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="url(#r)" stroke-width="1.6"/>
</svg>`;
}


export function sphereDataUri(ribCount = 26) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sphereSvg(buildRibs(ribCount)))}`;
}
