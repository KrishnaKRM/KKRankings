/* ============================================================
   team-rankings.js — shared rendering logic for Team Rankings
   (card theme). Builds the whole card from a JSON data object.

   Column count is recomputed from the container's actual rendered
   width (via ResizeObserver) rather than fixed at load time, and
   rows are re-chunked to match exactly — so there's never a lone
   "orphaned" column wrapping below with a duplicate header. Each
   column only gets its own header when it's genuinely displayed
   side-by-side with another.
   ============================================================ */

const TEAM_MIN_COL_WIDTH = 380; // keep in sync with team-theme.css
const TEAM_GRID_GAP = 1;

function teamFlagURL(code) {
  return `https://flagcdn.com/w40/${code}.png`;
}

function teamRankArrow(chg) {
  if (chg > 0) return `<span class="team-rank-change up">▲${chg}</span>`;
  if (chg < 0) return `<span class="team-rank-change down">▼${Math.abs(chg)}</span>`;
  return `<span class="team-rank-change neutral">—</span>`;
}

function teamBuildRow(row) {
  const changeClass = row.change.startsWith("+") ? "up" : row.change === "-" ? "neutral" : "down";

  let flagHTML;
  if (row.svg) {
    flagHTML = `<img class="team-flag-img" src="${row.svg}" alt="${row.team}">`;
  } else if (row.code === "np") {
    flagHTML = `<img class="team-flag-img np-flag" src="${teamFlagURL(row.code)}" alt="${row.team}">`;
  } else {
    flagHTML = `<img class="team-flag-img" src="${teamFlagURL(row.code)}" alt="${row.team}">`;
  }

  const tr = document.createElement("tr");
  tr.setAttribute("data-rank", row.rank);
  if (row.rank === 1) tr.classList.add("rank-gold");
  if (row.rank === 2) tr.classList.add("rank-silver");
  if (row.rank === 3) tr.classList.add("rank-bronze");
  if (row.highlight === "up")   tr.classList.add("highlight-up");
  if (row.highlight === "down") tr.classList.add("highlight-down");

  tr.innerHTML = `
    <td>${teamRankArrow(row.rankChg)}</td>
    <td><div class="team-rank-badge">${row.rank}</div></td>
    <td class="team-flag-cell">${flagHTML}</td>
    <td><span class="team-name">${row.team}</span></td>
    <td><span class="team-rating-num">${row.rating}</span></td>
    <td><span class="team-change ${changeClass}">${row.change}</span></td>`;
  return tr;
}

/* Splits rows into `cols` evenly-sized chunks (last chunk gets the remainder). */
function teamSplitRows(rows, cols) {
  const chunkSize = Math.ceil(rows.length / cols);
  const chunks = [];
  for (let i = 0; i < cols; i++) {
    chunks.push(rows.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return chunks.filter(c => c.length > 0);
}

function teamPickColumnCount(containerWidth, maxCols) {
  const fit = Math.floor((containerWidth + TEAM_GRID_GAP) / (TEAM_MIN_COL_WIDTH + TEAM_GRID_GAP));
  return Math.max(1, Math.min(maxCols, fit || 1));
}

/* containerId = id of an empty <div> to render the full card into.
   data = { title, subtitle, footerNote, cols, rows: [...], visibleCount } */
function renderTeamBoard(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxCols = data.cols || 1;
  const dateOnly = (data.subtitle || "").replace(/^Updated as on /, "");
  const hasMore = data.visibleCount && data.visibleCount < data.rows.length;
  let expanded = false;

  container.innerHTML = `
    <div class="team-card cols-${maxCols}">
      <div class="team-top-stripe"></div>
      <div class="team-header">
        <div>
          <div class="eyebrow">#KKRankings · @KrishnaKRM</div>
          <div class="team-title">${data.title}</div>
        </div>
        <div class="meta"><strong>${dateOnly}</strong></div>
      </div>
      <div class="team-tables-wrap"></div>
      ${hasMore ? `<div class="team-more-wrap"><button class="team-more-btn" type="button"></button></div>` : ""}
      <div class="team-footer"><div class="team-footer-note">Rankings as on <b>${dateOnly}</b>${data.footerNote ? " · " + data.footerNote : ""}</div></div>
    </div>`;

  const wrap = container.querySelector(".team-tables-wrap");
  const moreBtn = container.querySelector(".team-more-btn");
  let currentCols = 0;

  function visibleRows() {
    return (hasMore && !expanded) ? data.rows.slice(0, data.visibleCount) : data.rows;
  }

  function updateMoreBtn() {
    if (!moreBtn) return;
    moreBtn.textContent = expanded
      ? `Show top ${data.visibleCount} only ▲`
      : `Show all ${data.rows.length} teams ▼`;
  }

  function rerender(cols, force) {
    if (cols === currentCols && !force) return;
    currentCols = cols;

    wrap.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    wrap.innerHTML = "";

    const chunks = teamSplitRows(visibleRows(), cols);
    chunks.forEach((chunk, i) => {
      const half = document.createElement("div");
      half.className = "team-half";
      // The first column always gets a header (there's no repeat risk
      // with just one). Later columns only get one when genuinely
      // shown side-by-side — never when stacked below another.
      half.innerHTML = (i === 0 || cols > 1)
        ? `<table><thead><tr><th>↕</th><th>Rank</th><th></th><th>Team</th><th>Rating</th><th>Δ</th></tr></thead><tbody></tbody></table>`
        : `<table><tbody></tbody></table>`;
      const body = half.querySelector("tbody");
      chunk.forEach(row => body.appendChild(teamBuildRow(row)));
      wrap.appendChild(half);
    });
  }

  if (moreBtn) {
    updateMoreBtn();
    moreBtn.addEventListener("click", () => {
      expanded = !expanded;
      updateMoreBtn();
      rerender(currentCols, true);
    });
  }

  // Initial render + keep in sync with the container's actual width.
  rerender(teamPickColumnCount(wrap.getBoundingClientRect().width || container.getBoundingClientRect().width, maxCols));

  const ro = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    rerender(teamPickColumnCount(width, maxCols));
  });
  ro.observe(wrap);
}

/* Standalone auto-render: if this page has its own #rankingsData block,
   render it into #teamboard automatically. */
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("rankingsData");
  if (!el || !document.getElementById("teamboard")) return;
  const data = JSON.parse(el.textContent);
  renderTeamBoard("teamboard", data);
});
