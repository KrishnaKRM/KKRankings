/* ============================================================
   rankings.js — shared rendering logic for International Player
   Rankings (board theme: Test / ODI / Women's ODI). Fills the
   existing #<prefix>-battersA/B, #<prefix>-bowlersA/B, etc. IDs
   that already live in index.html (and in each standalone file).
   ============================================================ */

function playerFlagURL(code) {
  return `https://flagcdn.com/w40/${code}.png`;
}

function playerMoveHTML(chg) {
  if (chg === null || chg === undefined) return "";
  if (chg > 0) return `<span class="move up">▲ ${chg}</span>`;
  if (chg < 0) return `<span class="move down">▼ ${Math.abs(chg)}</span>`;
  return `<span class="move flat">—</span>`;
}

function playerNoteItemHTML(row) {
  const flag = row.svg || playerFlagURL(row.code);
  return `
    <span class="note-item">
      <span class="n-rank">#${row.rank}</span>
      <img class="n-flag" src="${flag}" alt="">
      <span class="n-name">${row.name}</span>
      <span class="n-tag">${row.tag}</span>
    </span>`;
}

function playerBuildRow(row) {
  const tr = document.createElement("tr");
  if (row.rank === 1) tr.classList.add("r1");
  if (row.rank === 2) tr.classList.add("r2");
  if (row.rank === 3) tr.classList.add("r3");
  if (row.chg > 0) tr.classList.add("row-up");
  if (row.chg < 0) tr.classList.add("row-down");

  const nameClass = row.tag ? (row.tag === "Retired" ? "name retired" : "name inactive") : "name";
  const tagHTML = row.tag ? `<span class="tag">${row.tag}</span>` : "";
  const flag = row.svg || playerFlagURL(row.code);

  tr.innerHTML = `
    <td style="width:54px;">${playerMoveHTML(row.chg)}</td>
    <td style="width:39px;"><span class="badge">${row.rank}</span></td>
    <td style="width:34px;"><img class="flag" src="${flag}" alt=""></td>
    <td><span class="${nameClass}">${row.name}</span>${tagHTML}</td>
  `;
  return tr;
}

/* Splits a flat 20-row array into two 10-row halves (batters/bowlers
   are always displayed as two side-by-side columns of 10). */
function playerSplitRows(rows) {
  const mid = Math.ceil(rows.length / 2);
  return [rows.slice(0, mid), rows.slice(mid)];
}

function playerFill(id, rows) {
  const body = document.getElementById(id);
  if (!body) return;
  rows.forEach(r => body.appendChild(playerBuildRow(r)));
}

/* prefix = "test" | "odi" | "wodi" (matches the IDs already present
   in the markup, split across two panels: <prefix>-batting-* and
   <prefix>-bowling-*). data = { title, battingTitle, bowlingTitle,
   asOf, footerDate, batters, bowlers, footnotesBatting, footnotesBowling } */
function renderFormatData(prefix, data) {
  const [battersA, battersB] = playerSplitRows(data.batters || []);
  const [bowlersA, bowlersB] = playerSplitRows(data.bowlers || []);

  playerFill(`${prefix}-battersA`, battersA);
  playerFill(`${prefix}-battersB`, battersB);
  playerFill(`${prefix}-bowlersA`, bowlersA);
  playerFill(`${prefix}-bowlersB`, bowlersB);

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
  };

  // Fall back to splitting the combined title if battingTitle/bowlingTitle
  // aren't provided, so older data files without those fields still work.
  const battingTitle = data.battingTitle || (data.title ? data.title.replace(/\s*&\s*Bowlers?$/i, "").trim() : null);
  const bowlingTitle = data.bowlingTitle || (data.title ? data.title.replace(/^.*Batters?\s*&\s*/i, "").trim() : null);

  setText(`${prefix}-batting-title`, battingTitle);
  setText(`${prefix}-bowling-title`, bowlingTitle);
  setText(`${prefix}-batting-asof`, data.asOf);
  setText(`${prefix}-bowling-asof`, data.asOf);
  setText(`${prefix}-batting-footerdate`, data.footerDate);
  setText(`${prefix}-bowling-footerdate`, data.footerDate);

  const battingNotes = document.getElementById(`${prefix}-notesBatting`);
  if (battingNotes) battingNotes.innerHTML = (data.footnotesBatting || []).map(playerNoteItemHTML).join("");

  const bowlingNotes = document.getElementById(`${prefix}-notesBowling`);
  if (bowlingNotes) bowlingNotes.innerHTML = (data.footnotesBowling || []).map(playerNoteItemHTML).join("");
}

/* Standalone auto-render: if this page has its own #rankingsData
   block with a data-prefix, render it using that prefix. */
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("rankingsData");
  if (!el) return;
  const prefix = el.dataset.prefix;
  if (!prefix || !document.getElementById(`${prefix}-battersA`)) return;
  const data = JSON.parse(el.textContent);
  renderFormatData(prefix, data);
});
