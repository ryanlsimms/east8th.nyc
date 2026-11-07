// Simplified basement floor plan, traced from sheet A-101.00 "Proposed
// Basement Plan" (Jeff Balinnang Architect, issued 29 Oct 2026). Coordinates
// are pixels on a 4800px-wide render of that sheet (about 50px per foot);
// walls are drawn on their centerlines. Not to be used for construction.

const WALL = 18;

// Rooms are closed polygons; shared edges become the walls between them.
const rooms = [
  { name: 'Meter\nroom', label: [856, 1290], size: 40,
    points: [[868, 1005], [944, 1005], [944, 1580], [895, 1580], [766, 1449], [766, 1100]] },
  { name: 'Front entry', label: [765, 1770], size: 44,
    points: [[553, 1371], [703, 1371], [703, 1472], [854, 1623], [854, 1680], [925, 1680],
      [925, 1845], [604, 1845], [604, 1623], [580, 1623], [580, 1496], [553, 1496]] },
  { name: 'Recreation room', label: [1245, 1360],
    points: [[944, 1005], [1548, 1005], [1548, 1845], [925, 1845], [925, 1580], [944, 1580]] },
  { name: 'Half bath', label: [1684, 1100], size: 46,
    points: [[1548, 1005], [1820, 1005], [1820, 1188], [1548, 1188]] },
  { name: 'Full bath', label: [1684, 1420], size: 46,
    points: [[1548, 1188], [1820, 1188], [1820, 1570], [1548, 1570]] },
  { name: 'Bedroom', label: [2050, 1300],
    points: [[1820, 1005], [2405, 1005], [2405, 1180], [2281, 1180], [2281, 1570], [1820, 1570]] },
  { name: 'Closet', label: [2343, 1287], size: 32,
    points: [[2281, 1180], [2405, 1180], [2405, 1388], [2281, 1388]] },
  { name: 'Closet', label: [2343, 1482], size: 32,
    points: [[2281, 1388], [2405, 1388], [2405, 1570], [2281, 1570]] },
  { name: 'Family room', label: [2800, 1250],
    points: [[2405, 1005], [2408, 1005], [2580, 905], [2940, 905], [3109, 1005], [3515, 1005],
      [3515, 1570], [2405, 1570]] },
  { name: 'Hallway', label: [2150, 1715],
    points: [[1548, 1570], [3515, 1570], [3515, 1740], [2987, 1740], [2987, 1845], [1548, 1845]] },
];

// Openings: a gap in a wall. `x` or `y` is the wall's line, `from`/`to` the span.
const doors = [
  { x: 944, from: 1420, to: 1550 }, // rec room ↔ meter room
  { x: 925, from: 1695, to: 1830 }, // front entry ↔ rec room
  { x: 553, from: 1385, to: 1490, exterior: true }, // front door
  { x: 1548, from: 1600, to: 1735 }, // rec room ↔ hallway
  { x: 1820, from: 1065, to: 1180 }, // half bath ↔ bedroom
  { y: 1570, from: 1680, to: 1805 }, // full bath ↔ hallway
  { x: 2405, from: 1030, to: 1165 }, // bedroom ↔ family room
  { x: 2281, from: 1215, to: 1370 }, // closet ↔ bedroom
  { x: 2405, from: 1405, to: 1535 }, // storage ↔ family room
  { y: 1570, from: 2430, to: 2560 }, // family room ↔ hallway
];

const windows = [
  { y: 1005, from: 1310, to: 1505 }, // enlarged, airwell 1
  { y: 1005, from: 1843, to: 1993 }, // enlarged, airwell 2
  { y: 905, from: 2685, to: 2835 }, // existing, no change
];

const fmt = points => points.map(([x, y]) => `${x},${y}`).join(' ');

function opening({ x, y, from, to }, className) {
  const pad = WALL / 2 + 2;
  return x !== undefined
    ? `<rect class="${className}" x="${x - pad}" y="${from}" width="${pad * 2}" height="${to - from}"/>`
    : `<rect class="${className}" x="${from}" y="${y - pad}" width="${to - from}" height="${pad * 2}"/>`;
}

function windowGlyph(w) {
  return `${opening(w, 'plan-window')}<line class="plan-glass" x1="${w.from}" y1="${w.y}" x2="${w.to}" y2="${w.y}"/>`;
}

function treads(x1, y1, x2, y2, count, vertical) {
  const lines = [];
  for (let i = 1; i < count; i += 1) {
    if (vertical) {
      const x = x1 + ((x2 - x1) * i) / count;
      lines.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`);
    } else {
      const y = y1 + ((y2 - y1) * i) / count;
      lines.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`);
    }
  }
  return `<g class="plan-stair"><rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}"/>${lines.join('')}</g>`;
}

// A label is centred on its point; `\n` in a name splits it across lines.
function label(room) {
  const [x, y] = room.label;
  const size = room.size ?? 60;
  const lines = room.name.split('\n');
  const lineHeight = Math.round(size * 1.1);
  const firstBaseline = y + Math.round(size * 0.45) - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines.map((line, i) => `<tspan x="${x}" y="${firstBaseline + i * lineHeight}">${line}</tspan>`).join('');
  return `<text class="plan-room-name" font-size="${size}">${tspans}</text>`;
}

const outdoorLabel = (x, y, text) => `<text class="plan-outdoor" x="${x}" y="${y}">${text}</text>`;

export const planSvg = `<svg class="plan-svg" viewBox="260 660 3840 1230" role="img" aria-labelledby="plan-title">
<title id="plan-title">Simplified proposed basement floor plan</title>
<g class="plan-outside">
  <rect class="plan-patio" x="3515" y="1022" width="505" height="489"/>
  <path class="plan-retaining" d="M3570,997 H4045 V1536 H3570"/>
  <!-- Window wells end at the outside face of the foundation (y≈921); the
       recess through the foundation wall links them to the window. -->
  <path class="plan-retaining" d="M1264,921 V747 H1556 V921"/>
  <path class="plan-retaining" d="M1768,921 V747 H2065 V921"/>
  <rect class="plan-recess" x="1309" y="921" width="196" height="75"/>
  <rect class="plan-recess" x="1843" y="921" width="150" height="75"/>
  <line class="plan-foundation" x1="1245" y1="921" x2="2084" y2="921"/>
  ${treads(283, 1379, 553, 1491, 6, true)}
</g>
<g class="plan-rooms" stroke-width="${WALL}">
  ${rooms.map(room => `<polygon points="${fmt(room.points)}"/>`).join('\n  ')}
</g>
<g class="plan-openings">
  ${doors.map(door => opening(door, 'plan-door')).join('')}
  <rect class="plan-door" x="${3515 - WALL / 2 - 2}" y="1045" width="${WALL + 4}" height="365"/>
  <line class="plan-glass" x1="3515" y1="1045" x2="3515" y2="1410"/>
  ${windows.map(windowGlyph).join('')}
</g>
<g class="plan-fixtures">
  ${treads(3250, 1590, 3500, 1740, 6, true)}
  <rect x="3040" y="1450" width="465" height="110"/>
  <text class="plan-fixture-label" x="3272" y="1515">Kitchenette</text>
  <rect x="2502" y="1745" width="118" height="88"/>
  <rect x="2835" y="1714" width="116" height="118"/>
  <text class="plan-fixture-label" x="2726" y="1700">Laundry</text>
  <rect x="1563" y="1215" width="240" height="115"/>
  <circle cx="1615" cy="1789" r="36"/>
  <text class="plan-fixture-label" x="1720" y="1735">Water heater</text>
</g>
<g class="plan-labels">
  ${rooms.map(label).join('\n  ')}
  <text class="plan-room-name" x="3730" y="1225" font-size="52">Sunken patio</text>
  ${outdoorLabel(1660, 700, 'Side walkway · window wells')}
  ${outdoorLabel(418, 1340, 'Street')}
  ${outdoorLabel(3830, 960, 'Back yard')}
</g>
</svg>`;
