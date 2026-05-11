// ============================================================
//  board.js  –  Renders the Monopoly board into #board-canvas
// ============================================================

const Board = (() => {

  // Which board positions sit on which edge
  // Bottom row: 0–10 (right→left), Left col: 11–19 (bottom→top),
  // Top row: 20–30 (left→right), Right col: 31–39 (top→bottom)
  const CORNER_IDS = [0, 10, 20, 30];

  function getSpaceStyle(space) {
    if (space.type === 'property') {
      return `border-top: 6px solid ${PROPERTY_COLORS[space.group]}`;
    }
    return '';
  }

  function houseHTML(count) {
    if (count === 0) return '';
    if (count === 5) return '<div class="hotel">H</div>';
    return Array(count).fill('<div class="house"></div>').join('');
  }

  function renderSpace(space, state, index) {
    const prop   = state.properties[space.id];
    const owner  = prop ? state.players.find(p => p.id === prop.owner) : null;
    const houses = prop ? prop.houses || 0 : 0;
    const mortgaged = prop?.mortgaged;

    const players = state.players.filter(p => p.position === space.id && !p.bankrupt);
    const tokenHTML = players.map(p =>
      `<span class="token" style="background:${p.color}" title="${p.name}">${p.token}</span>`
    ).join('');

    const ownerDot = owner
      ? `<div class="owner-dot" style="background:${owner.color}" title="Owned by ${owner.name}"></div>`
      : '';

    const mortgageOverlay = mortgaged ? '<div class="mortgaged-label">MORT</div>' : '';

    let typeIcon = '';
    if (space.type === 'chance')          typeIcon = '<div class="space-icon chance">?</div>';
    else if (space.type === 'community_chest') typeIcon = '<div class="space-icon cc">📦</div>';
    else if (space.type === 'tax')        typeIcon = `<div class="space-icon tax">${space.icon}</div>`;
    else if (space.type === 'go')         typeIcon = '<div class="space-icon go">GO</div>';
    else if (space.type === 'jail')       typeIcon = '<div class="space-icon jail">⛓</div>';
    else if (space.type === 'go_to_jail') typeIcon = '<div class="space-icon gtj">👮</div>';
    else if (space.type === 'free_parking') typeIcon = '<div class="space-icon fp">🅿</div>';
    else if (space.type === 'railroad')   typeIcon = '<div class="space-icon rr">🚂</div>';
    else if (space.type === 'utility')    typeIcon = `<div class="space-icon util">${space.icon}</div>`;

    const priceTag = (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') && !prop
      ? `<div class="price-tag">$${space.price}</div>` : '';

    const colorBar = space.type === 'property'
      ? `<div class="color-bar" style="background:${PROPERTY_COLORS[space.group]}"></div>` : '';

    const isCurrentPos = state.players.find(p => p.id === state.currentPlayer)?.position === space.id;

    return `
      <div class="space ${space.type} ${isCurrentPos ? 'active-space' : ''} ${mortgaged ? 'mortgaged' : ''}"
           data-id="${space.id}"
           onclick="UI.onSpaceClick(${space.id})"
           title="${space.name}${space.price ? ' — $'+space.price : ''}">
        ${colorBar}
        <div class="space-name">${space.name}</div>
        ${typeIcon}
        ${priceTag}
        ${ownerDot}
        ${mortgageOverlay}
        <div class="houses-row">${houseHTML(houses)}</div>
        <div class="tokens-row">${tokenHTML}</div>
      </div>`;
  }

  function render(state) {
    const canvas = document.getElementById('board-canvas');
    if (!canvas) return;

    // Bottom row: spaces 0–10, displayed right-to-left
    const bottomSpaces = SPACES.slice(0, 11).reverse();
    // Left col: spaces 11–19, displayed bottom-to-top  
    const leftSpaces   = SPACES.slice(11, 20).reverse();
    // Top row: spaces 20–30, displayed left-to-right
    const topSpaces    = SPACES.slice(20, 31);
    // Right col: spaces 31–39, displayed top-to-bottom
    const rightSpaces  = SPACES.slice(31, 40);

    const renderRow = (spaces) => spaces.map((sp, i) => renderSpace(sp, state, i)).join('');

    canvas.innerHTML = `
      <div class="board-grid">

        <!-- Top row -->
        <div class="board-row top-row">
          ${renderRow(topSpaces)}
        </div>

        <!-- Middle section -->
        <div class="board-middle">

          <!-- Left column -->
          <div class="board-col left-col">
            ${renderRow(leftSpaces)}
          </div>

          <!-- Center -->
          <div class="board-center">
            <div class="board-logo">
              <div class="logo-top">MONOPOLY</div>
              <div class="logo-sub">Custom Edition</div>
            </div>
            <div class="center-info">
              <div class="turn-indicator">
                <span class="turn-dot" style="background:${state.players.find(p=>p.id===state.currentPlayer)?.color}"></span>
                <span>${state.players.find(p=>p.id===state.currentPlayer)?.name}'s turn</span>
              </div>
              ${state.dice[0] !== null ? `
              <div class="dice-display">
                <span class="die">${state.dice[0]}</span>
                <span class="die">${state.dice[1]}</span>
              </div>` : ''}
            </div>
          </div>

          <!-- Right column -->
          <div class="board-col right-col">
            ${renderRow(rightSpaces)}
          </div>

        </div>

        <!-- Bottom row -->
        <div class="board-row bottom-row">
          ${renderRow(bottomSpaces)}
        </div>

      </div>`;
  }

  return { render };

})();
