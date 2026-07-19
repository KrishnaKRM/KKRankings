/* ============================================================
   domestic-rankings.js — shared rendering logic for Indian
   Domestic Rankings (ledger theme). Splits rows into 2 columns.
   ============================================================ */

function domesticDeltaClass(delta) {
  if (delta === "—" || delta === "-") return "";
  return delta.startsWith("+") ? "domestic-pos" : "domestic-neg";
}

function domesticBuildRow(row) {
  const tr = document.createElement("tr");
  if (row.rowClass) tr.classList.add(`domestic-${row.rowClass}`);

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

function domesticSplitRows(rows) {
  const chunkSize = Math.ceil(rows.length / 2);
  return [rows.slice(0, chunkSize), rows.slice(chunkSize)];
}

function domesticLegendItemHTML(item) {
  if (item.type === "dual") {
    return `<div class="domestic-legend-item"><div class="domestic-legend-box dual" style="background:${item.color};"></div> ${item.label}</div>`;
  }
  return `<div class="domestic-legend-item"><div class="domestic-legend-box" style="background:${item.color};"></div> ${item.label}</div>`;
}

/* containerId = id of an empty <div>. data = { title, subtitle, legend, rows, championBorder } */
function renderDomesticBoard(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const [left, right] = domesticSplitRows(data.rows);

  container.innerHTML = `
    <div class="domestic-standalone-note-slot"></div>
    <div class="domestic-container${data.championBorder ? " with-champion-border" : ""}">
      <div class="domestic-top-bar"></div>
      <div class="domestic-header-area">
        <div class="eyebrow">#KKRankings · @KrishnaKRM</div>
        <h1>${data.title}</h1>
      </div>
      <div class="domestic-body-area">
        <div class="domestic-legend">${(data.legend || []).map(domesticLegendItemHTML).join("")}</div>
        <div class="domestic-tables-wrapper">
          <div class="domestic-half"><table>
            <thead><tr><th colspan="2">Rank</th><th class="team-col">Team</th><th class="domestic-rating-col">Rating</th><th class="domestic-delta-col">Δ</th></tr></thead>
            <tbody id="${containerId}-left"></tbody>
          </table></div>
          <div class="domestic-half"><table>
            <thead><tr><th colspan="2">Rank</th><th class="team-col">Team</th><th class="domestic-rating-col">Rating</th><th class="domestic-delta-col">Δ</th></tr></thead>
            <tbody id="${containerId}-right"></tbody>
          </table></div>
        </div>
      </div>
      <div class="domestic-footer"><span>${data.subtitle}</span></div>
    </div>`;

  const leftBody = document.getElementById(`${containerId}-left`);
  const rightBody = document.getElementById(`${containerId}-right`);
  left.forEach(r => leftBody.appendChild(domesticBuildRow(r)));
  right.forEach(r => rightBody.appendChild(domesticBuildRow(r)));
}

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("rankingsData");
  if (!el || !document.getElementById("domesticboard")) return;
  const data = JSON.parse(el.textContent);
  renderDomesticBoard("domesticboard", data);
});
