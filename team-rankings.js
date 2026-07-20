/* ============================================================
   team-rankings.js — shared rendering logic for Team Rankings
   (card theme). Builds the whole card, including the variable
   1/2/3-column table layout, from a JSON data object.
   ============================================================ */

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

/* Splits data.rows into data.cols evenly-sized chunks (last chunk gets the
   remainder), matching the original per-file slicing behaviour. */
function teamSplitRows(rows, cols) {
  const chunkSize = Math.ceil(rows.length / cols);
  const chunks = [];
  for (let i = 0; i < cols; i++) {
    chunks.push(rows.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return chunks;
}

/* containerId = id of an empty <div> to render the full card into.
   data = { title, subtitleHTML, footerNote, cols, rows: [...] } */
function renderTeamBoard(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const chunks = teamSplitRows(data.rows, data.cols || 1);

  const halvesHTML = chunks.map((chunk, i) => {
    return `<div class="team-half"><table>
      <thead><tr><th>↕</th><th>Rank</th><th></th><th>Team</th><th>Rating</th><th>Δ</th></tr></thead>
      <tbody id="${containerId}-col${i}"></tbody>
    </table></div>`;
  }).join("");

  const dateOnly = (data.subtitle || "").replace(/^Updated as on /, "");

  container.innerHTML = `
    <div class="team-card cols-${data.cols || 1}">
      <div class="team-top-stripe"></div>
      <div class="team-header">
        <div>
          <div class="eyebrow">#KKRankings · @KrishnaKRM</div>
          <div class="team-title">${data.title}</div>
        </div>
        <div class="meta"><strong>${dateOnly}</strong></div>
      </div>
      <div class="team-tables-wrap">${halvesHTML}</div>
      <div class="team-footer"><div class="team-footer-note">Rankings as on <b>${dateOnly}</b> · ${data.footerNote}</div></div>
    </div>`;

  chunks.forEach((chunk, i) => {
    const body = document.getElementById(`${containerId}-col${i}`);
    chunk.forEach(row => body.appendChild(teamBuildRow(row)));
  });
}

/* Standalone auto-render: if this page has its own #rankingsData block,
   render it into #teamboard automatically. */
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("rankingsData");
  if (!el || !document.getElementById("teamboard")) return;
  const data = JSON.parse(el.textContent);
  renderTeamBoard("teamboard", data);
});
