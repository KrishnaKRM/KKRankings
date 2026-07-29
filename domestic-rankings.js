/* ============================================================
   domestic-rankings.js — shared rendering logic for Indian
   Domestic Rankings (ledger theme).

   Column count is recomputed from the container's actual rendered
   width (via ResizeObserver) rather than fixed at load time, and
   rows are re-chunked to match exactly — so there's never a lone
   "orphaned" column wrapping below with a duplicate header. Each
   column only gets its own header when it's genuinely displayed
   side-by-side with another. Supports up to 3 columns when there's
   room (set via data.maxCols, default 3).
   ============================================================ */

const DOMESTIC_MIN_COL_WIDTH = 370; // keep in sync with domestic-theme.css
const DOMESTIC_GRID_GAP = 1;

function domesticDeltaClass(delta) {
  if (delta === "—" || delta === "-") return "";
  return delta.startsWith("+") ? "domestic-pos" : "domestic-neg";
}

function domesticBuildRow(row) {
  const tr = document.createElement("tr");
  if (row.rowClass) tr.classList.add(`domestic-${row.rowClass}`);
  // A champion/runner-up can *also* be a top gainer or loser — the gold/
  // silver background already shows the placement, so add a colored edge
  // accent (matching the gainer/loser blue/amber) to signal the second fact.
  if (row.also === "gainer") tr.classList.add("domestic-also-gainer");
  if (row.also === "loser") tr.classList.add("domestic-also-loser");

  let rankHTML;
  if (row.rank <= 3) {
    const cls = row.rank === 1 ? "domestic-rank-gold" : row.rank === 2 ? "domestic-rank-silver" : "domestic-rank-bronze";
    rankHTML = `<span class="domestic-rank-box ${cls}">${row.rank}</span>`;
  } else if (row.rowClass === "champion" || row.rowClass === "runner-up") {
    rankHTML = `<strong>${row.rank}</strong>`;
  } else {
    rankHTML = `${row.rank}`;
  }

  const teamHTML = (row.rowClass === "champion" || row.rowClass === "runner-up" || row.rank <= 2)
    ? `<strong>${row.team}</strong>` : row.team;
  const ratingHTML = (row.rowClass === "champion" || row.rowClass === "runner-up" || row.rank <= 2)
    ? `<strong>${row.rating}</strong>` : row.rating;

  const deltaClass = domesticDeltaClass(row.delta);

  tr.innerHTML = `
    <td class="domestic-arrow-col">${row.arrow || ""}</td>
    <td class="domestic-rank-col">${rankHTML}</td>
    <td class="team-col">${teamHTML}</td>
    <td class="domestic-rating-col">${ratingHTML}</td>
    <td class="domestic-delta-col ${deltaClass}">${row.delta}</td>`;
  return tr;
}

/* Splits rows into `cols` evenly-sized chunks (last chunk gets the remainder). */
function domesticSplitRows(rows, cols) {
  const chunkSize = Math.ceil(rows.length / cols);
  const chunks = [];
  for (let i = 0; i < cols; i++) {
    chunks.push(rows.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return chunks.filter(c => c.length > 0);
}

function domesticPickColumnCount(containerWidth, maxCols) {
  const fit = Math.floor((containerWidth + DOMESTIC_GRID_GAP) / (DOMESTIC_MIN_COL_WIDTH + DOMESTIC_GRID_GAP));
  return Math.max(1, Math.min(maxCols, fit || 1));
}

function domesticLegendItemHTML(item) {
  if (item.type === "dual") {
    return `<div class="domestic-legend-item"><div class="domestic-legend-box dual" style="background:${item.color};"></div> ${item.label}</div>`;
  }
  return `<div class="domestic-legend-item"><div class="domestic-legend-box" style="background:${item.color};"></div> ${item.label}</div>`;
}

/* containerId = id of an empty <div>. data = { title, subtitle, legend, rows,
   championBorder, maxCols } */
function renderDomesticBoard(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxCols = data.maxCols || 3;

  container.innerHTML = `
    <div class="domestic-standalone-note-slot"></div>
    <div class="domestic-container max-cols-${maxCols}">
      <div class="domestic-top-bar"></div>
      <div class="domestic-header-area">
        <div class="eyebrow">#KKRankings · @KrishnaKRM</div>
        <h1>${data.title}</h1>
      </div>
      <div class="domestic-body-area">
        <div class="domestic-legend">${(data.legend || []).map(domesticLegendItemHTML).join("")}</div>
        <div class="domestic-tables-wrapper"></div>
      </div>
      <div class="domestic-footer"><span>${data.subtitle}</span></div>
    </div>`;

  const wrap = container.querySelector(".domestic-tables-wrapper");
  let currentCols = 0;

  function rerender(cols) {
    if (cols === currentCols) return;
    currentCols = cols;

    wrap.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    wrap.innerHTML = "";

    const chunks = domesticSplitRows(data.rows, cols);
    chunks.forEach((chunk, i) => {
      const half = document.createElement("div");
      half.className = "domestic-half";
      // The first column always gets a header (there's no repeat risk
      // with just one). Later columns only get one when genuinely
      // shown side-by-side — never when stacked below another.
      half.innerHTML = (i === 0 || cols > 1)
        ? `<table><thead><tr><th class="domestic-arrow-col"></th><th class="domestic-rank-col">Rank</th><th class="team-col">Team</th><th class="domestic-rating-col">Rating</th><th class="domestic-delta-col">Δ</th></tr></thead><tbody></tbody></table>`
        : `<table><tbody></tbody></table>`;
      const body = half.querySelector("tbody");
      chunk.forEach(row => body.appendChild(domesticBuildRow(row)));
      wrap.appendChild(half);
    });
  }

  rerender(domesticPickColumnCount(wrap.getBoundingClientRect().width || container.getBoundingClientRect().width, maxCols));

  const ro = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    rerender(domesticPickColumnCount(width, maxCols));
  });
  ro.observe(wrap);
}

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("rankingsData");
  if (!el || !document.getElementById("domesticboard")) return;
  const data = JSON.parse(el.textContent);
  renderDomesticBoard("domesticboard", data);
});
