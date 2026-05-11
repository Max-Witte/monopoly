// ============================================================
//  ui.js  –  UI layer: buttons, panels, modals, game loop
// ============================================================

const UI = (() => {

  let state = null;
  let myPlayerId = null; // for multiplayer: which player am I?
  let isMultiplayer = false;

  // ── Bootstrap ─────────────────────────────────────────────

  function init(playerNames, mpPlayerId = null) {
    state = Engine.createInitialState(playerNames);
    myPlayerId = mpPlayerId ?? 0;
    isMultiplayer = mpPlayerId !== null;
    render();
  }

  function setState(newState) {
    state = newState;
    render();
    if (isMultiplayer) Network.broadcast(state);
  }

  // ── Render ────────────────────────────────────────────────

  function render() {
    Board.render(state);
    renderPlayers();
    renderControls();
    renderLog();
    renderModal();
  }

  function renderPlayers() {
    const panel = document.getElementById('players-panel');
    if (!panel) return;
    panel.innerHTML = state.players.map(p => {
      const ownedCount = Object.values(state.properties).filter(pr => pr.owner === p.id).length;
      return `
        <div class="player-card ${p.bankrupt ? 'bankrupt' : ''} ${state.currentPlayer === p.id ? 'active' : ''}">
          <div class="player-header">
            <span class="player-token" style="background:${p.color}">${p.token}</span>
            <span class="player-name">${p.name}</span>
            ${p.inJail ? '<span class="badge jail-badge">JAIL</span>' : ''}
            ${p.bankrupt ? '<span class="badge bust-badge">BUST</span>' : ''}
          </div>
          <div class="player-money">$${p.money.toLocaleString()}</div>
          <div class="player-props">${ownedCount} propert${ownedCount === 1 ? 'y' : 'ies'}
            ${p.jailFreeCards > 0 ? `· ${p.jailFreeCards}🃏` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function renderControls() {
    const panel = document.getElementById('controls-panel');
    if (!panel) return;

    const isMyTurn = !isMultiplayer || myPlayerId === state.currentPlayer;
    const player   = state.players.find(p => p.id === state.currentPlayer);

    if (state.phase === 'game_over') {
      const winner = state.players.find(p => p.id === state.winner);
      panel.innerHTML = `<div class="game-over">🏆 ${winner.name} wins!</div>
        <button class="btn btn-primary" onclick="UI.restart()">Play Again</button>`;
      return;
    }

    if (!isMyTurn) {
      panel.innerHTML = `<div class="waiting">⏳ Waiting for ${player.name}...</div>`;
      return;
    }

    let html = `<div class="phase-label">Phase: <b>${state.phase.replace(/_/g,' ').toUpperCase()}</b></div>`;

    switch (state.phase) {
      case 'roll':
        if (player.inJail) {
          html += `<button class="btn btn-primary" onclick="UI.doRoll()">🎲 Roll (try doubles)</button>`;
          if (player.jailFreeCards > 0)
            html += `<button class="btn btn-secondary" onclick="UI.useJailFree()">🃏 Use Jail-Free Card</button>`;
          html += `<button class="btn btn-danger" onclick="UI.payJailFine()">💸 Pay $50 Fine</button>`;
        } else {
          html += `<button class="btn btn-primary" onclick="UI.doRoll()">🎲 Roll Dice</button>`;
        }
        break;

      case 'buy': {
        const space = SPACES[player.position];
        html += `
          <div class="buy-prompt">Buy <b>${space.name}</b> for <b>$${space.price}</b>?</div>
          <div class="btn-row">
            <button class="btn btn-primary" onclick="UI.doBuy()">✅ Buy</button>
            <button class="btn btn-secondary" onclick="UI.doPass()">❌ Pass</button>
          </div>`;
        break;
      }

      case 'pay_rent':
        html += `
          <div class="rent-prompt">Pay rent: <b>$${state.rentToPay?.amount}</b></div>
          <button class="btn btn-danger" onclick="UI.doPayRent()">💸 Pay Rent</button>`;
        break;

      case 'card_shown':
        html += `
          <div class="card-text">${state.pendingCard?.text}</div>
          <button class="btn btn-primary" onclick="UI.doResolveCard()">OK</button>`;
        break;

      case 'end_turn':
        html += `
          <div class="manage-section">
            <button class="btn btn-secondary" onclick="UI.openManage()">🏠 Manage Properties</button>
          </div>
          <button class="btn btn-primary" onclick="UI.doEndTurn()">➡️ End Turn</button>`;
        break;
    }

    panel.innerHTML = html;
  }

  function renderLog() {
    const logEl = document.getElementById('game-log');
    if (!logEl) return;
    logEl.innerHTML = [...state.log].reverse().map(msg =>
      `<div class="log-entry">${msg}</div>`
    ).join('');
  }

  function renderModal() {
    const modal = document.getElementById('modal');
    if (!modal || !modal.dataset.open) return;
  }

  // ── Actions ───────────────────────────────────────────────

  function doRoll()       { setState(Engine.processRoll(state)); }
  function doBuy()        { setState(Engine.buyProperty(state)); }
  function doPass()       { setState(Engine.passProperty(state)); }
  function doPayRent()    { setState(Engine.payRent(state)); }
  function doResolveCard(){ setState(Engine.resolveCard(state)); }
  function doEndTurn()    { setState(Engine.endTurn(state)); }
  function useJailFree()  { setState(Engine.useJailFreeCard(state)); }
  function payJailFine()  { setState(Engine.payJailFine(state)); }

  // ── Space Click ───────────────────────────────────────────

  function onSpaceClick(spaceId) {
    const space = SPACES[spaceId];
    const prop  = state.properties[spaceId];
    if (!space) return;

    let info = `<h3>${space.name}</h3>`;

    if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
      info += `<p>Price: <b>$${space.price}</b></p>`;
      if (prop) {
        const owner = state.players.find(p => p.id === prop.owner);
        info += `<p>Owner: <b style="color:${owner.color}">${owner.name}</b></p>`;
        info += `<p>Status: ${prop.mortgaged ? '🔴 Mortgaged' : '🟢 Active'}</p>`;
        if (space.type === 'property') {
          info += `<p>Buildings: ${prop.houses === 5 ? '🏨 Hotel' : '🏠'.repeat(prop.houses) || 'None'}</p>`;
          info += `<p>Rent: $${Engine.calculateRent(state, space, -1)}</p>`;
        }

        // Build/sell/mortgage buttons if current player owns it
        const isMyTurn = !isMultiplayer || myPlayerId === state.currentPlayer;
        if (prop.owner === state.currentPlayer && isMyTurn && state.phase === 'end_turn') {
          info += `<div class="btn-row" style="margin-top:12px">`;
          if (space.type === 'property' && prop.houses < 5)
            info += `<button class="btn btn-primary" onclick="UI.doBuildHouse(${spaceId})">🏠 Build ($${space.houseCost})</button>`;
          if (space.type === 'property' && prop.houses > 0)
            info += `<button class="btn btn-secondary" onclick="UI.doSellHouse(${spaceId})">💰 Sell</button>`;
          if (!prop.mortgaged && prop.houses === 0)
            info += `<button class="btn btn-danger" onclick="UI.doMortgage(${spaceId})">📋 Mortgage ($${space.mortgage})</button>`;
          if (prop.mortgaged)
            info += `<button class="btn btn-primary" onclick="UI.doUnmortgage(${spaceId})">✅ Lift Mortgage ($${Math.floor(space.mortgage*1.1)})</button>`;
          info += `</div>`;
        }
      } else {
        info += `<p>Unowned — available to buy</p>`;
        if (space.type === 'property') {
          info += `<table class="rent-table">
            <tr><th>Rent</th><th>Amount</th></tr>
            <tr><td>Base</td><td>$${space.rent[0]}</td></tr>
            <tr><td>Monopoly</td><td>$${space.rent[0]*2}</td></tr>
            <tr><td>1 House</td><td>$${space.rent[1]}</td></tr>
            <tr><td>2 Houses</td><td>$${space.rent[2]}</td></tr>
            <tr><td>3 Houses</td><td>$${space.rent[3]}</td></tr>
            <tr><td>4 Houses</td><td>$${space.rent[4]}</td></tr>
            <tr><td>Hotel</td><td>$${space.rent[5]}</td></tr>
          </table>`;
        }
      }
    } else {
      info += `<p>${space.icon || ''} ${space.type.replace(/_/g,' ')}</p>`;
    }

    showModal(info);
  }

  function doBuildHouse(spaceId)  { setState(Engine.buildHouse(state, spaceId));        closeModal(); }
  function doSellHouse(spaceId)   { setState(Engine.sellHouse(state, spaceId));          closeModal(); }
  function doMortgage(spaceId)    { setState(Engine.mortgageProperty(state, spaceId));   closeModal(); }
  function doUnmortgage(spaceId)  { setState(Engine.unmortgageProperty(state, spaceId)); closeModal(); }

  // ── Manage Properties Modal ───────────────────────────────

  function openManage() {
    const playerId = state.currentPlayer;
    const ownedSpaces = SPACES.filter(sp =>
      state.properties[sp.id]?.owner === playerId
    );

    if (ownedSpaces.length === 0) {
      showModal('<h3>My Properties</h3><p>You own no properties yet.</p>');
      return;
    }

    let html = '<h3>My Properties</h3><div class="manage-list">';
    ownedSpaces.forEach(space => {
      const prop = state.properties[space.id];
      const groupColor = space.group ? PROPERTY_COLORS[space.group] : '#ccc';
      html += `
        <div class="manage-row">
          <div class="manage-name">
            ${space.group ? `<span class="color-pip" style="background:${groupColor}"></span>` : ''}
            ${space.name}
          </div>
          <div class="manage-status">${prop.mortgaged ? '🔴' : '🟢'} ${prop.houses === 5 ? '🏨' : '🏠'.repeat(prop.houses)}</div>
          <div class="manage-actions btn-row">
            ${space.type === 'property' && !prop.mortgaged && prop.houses < 5
              ? `<button class="btn btn-sm btn-primary" onclick="UI.doBuildHouse(${space.id})">+🏠</button>` : ''}
            ${space.type === 'property' && prop.houses > 0
              ? `<button class="btn btn-sm btn-secondary" onclick="UI.doSellHouse(${space.id})">-🏠</button>` : ''}
            ${!prop.mortgaged && (prop.houses || 0) === 0
              ? `<button class="btn btn-sm btn-danger" onclick="UI.doMortgage(${space.id})">Mortg.</button>` : ''}
            ${prop.mortgaged
              ? `<button class="btn btn-sm btn-primary" onclick="UI.doUnmortgage(${space.id})">Lift</button>` : ''}
          </div>
        </div>`;
    });
    html += '</div>';
    showModal(html);
  }

  // ── Modal ─────────────────────────────────────────────────

  function showModal(html) {
    const modal = document.getElementById('modal');
    const body  = document.getElementById('modal-body');
    if (!modal || !body) return;
    body.innerHTML = html;
    modal.classList.add('open');
    modal.dataset.open = '1';
  }

  function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.remove('open');
    delete modal.dataset.open;
    render();
  }

  // ── Setup Screen ──────────────────────────────────────────

  function showSetup() {
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('game-screen').style.display  = 'none';
  }

  function startLocalGame() {
    const inputs = document.querySelectorAll('.player-name-input');
    const names  = [...inputs].map(i => i.value.trim()).filter(Boolean);
    if (names.length < 2) { alert('Enter at least 2 player names.'); return; }
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display  = 'grid';
    init(names);
  }

  function startOnlineHost() {
    const name = document.getElementById('host-name').value.trim();
    if (!name) { alert('Enter your name.'); return; }
    Network.hostGame(name);
  }

  function startOnlineJoin() {
    const name = document.getElementById('join-name').value.trim();
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (!name || !code) { alert('Enter your name and the game code.'); return; }
    Network.joinGame(code, name);
  }

  function restart() {
    showSetup();
  }

  // ── Network callbacks (called by network.js) ──────────────

  function onNetworkState(newState) {
    state = newState;
    render();
  }

  function onGameStart(playerNames, myId) {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display  = 'grid';
    init(playerNames, myId);
  }

  return {
    init, setState, render, onSpaceClick, onNetworkState, onGameStart,
    doRoll, doBuy, doPass, doPayRent, doResolveCard, doEndTurn,
    useJailFree, payJailFine, openManage, closeModal,
    doBuildHouse, doSellHouse, doMortgage, doUnmortgage,
    startLocalGame, startOnlineHost, startOnlineJoin, restart,
  };

})();
