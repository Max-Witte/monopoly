// ============================================================
//  engine.js  –  Pure game logic (no DOM access)
//  All functions return a new state object (immutable style).
// ============================================================

const Engine = (() => {

  // ── Helpers ──────────────────────────────────────────────

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function log(state, msg) {
    return { ...state, log: [...state.log, msg].slice(-80) };
  }

  function pmap(state, playerId, fn) {
    return { ...state, players: state.players.map(p => p.id === playerId ? fn(p) : p) };
  }

  function rollDice() {
    return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
  }

  // ── Initial State ─────────────────────────────────────────

  function createInitialState(playerNames) {
    return {
      players: playerNames.map((name, i) => ({
        id: i,
        name,
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        bankrupt: false,
        token: PLAYER_TOKENS[i],
        color: PLAYER_COLORS[i],
      })),
      currentPlayer: 0,
      // phases: 'roll' | 'buy' | 'pay_rent' | 'card_shown' | 'end_turn' | 'game_over' | 'jail_choice'
      phase: 'roll',
      dice: [null, null],
      doublesCount: 0,
      properties: {}, // { [spaceId]: { owner, houses, mortgaged } }
      log: ['🎲 Game started! ' + playerNames[0] + ' goes first.'],
      winner: null,
      pendingCard: null,
      rentToPay: null,
      chanceCards:    shuffle([...CHANCE_CARDS]),
      communityCards: shuffle([...COMMUNITY_CHEST_CARDS]),
      chanceIdx:    0,
      communityIdx: 0,
    };
  }

  // ── Movement ─────────────────────────────────────────────

  function advanceTo(state, playerId, targetPos, collectGo = true) {
    const player = state.players.find(p => p.id === playerId);
    const passed = targetPos !== player.position &&
                   (targetPos < player.position || targetPos === 0);
    let s = { ...state, players: state.players.map(p =>
      p.id === playerId ? { ...p, position: targetPos } : p
    )};
    if (collectGo && passed && targetPos !== 0) {
      s = pmap(s, playerId, p => ({ ...p, money: p.money + 200 }));
      s = log(s, `${player.name} passed GO and collected $200!`);
    }
    return s;
  }

  function moveBy(state, playerId, spaces) {
    const player = state.players.find(p => p.id === playerId);
    const newPos = (player.position + spaces) % 40;
    const passed = newPos < player.position;
    let s = { ...state, players: state.players.map(p =>
      p.id === playerId ? { ...p, position: newPos } : p
    )};
    if (passed) {
      s = pmap(s, playerId, p => ({ ...p, money: p.money + 200 }));
      s = log(s, `${player.name} passed GO and collected $200!`);
    }
    return s;
  }

  function sendToJail(state, playerId) {
    let s = pmap(state, playerId, p => ({ ...p, position: 10, inJail: true, jailTurns: 0 }));
    return log(s, `${state.players.find(p=>p.id===playerId).name} is sent to jail! 👮`);
  }

  // ── Roll ──────────────────────────────────────────────────

  function processRoll(state) {
    if (state.phase !== 'roll' && state.phase !== 'jail_choice') return state;

    const dice = rollDice();
    const [d1, d2] = dice;
    const isDoubles = d1 === d2;
    const total = d1 + d2;
    const playerId = state.currentPlayer;
    const player = state.players.find(p => p.id === playerId);

    let s = log({ ...state, dice }, `${player.name} rolled ${d1}+${d2}=${total}${isDoubles ? ' 🎰 DOUBLES!' : ''}`);

    // ── Jail handling ──
    if (player.inJail) {
      if (isDoubles) {
        s = pmap(s, playerId, p => ({ ...p, inJail: false, jailTurns: 0 }));
        s = log(s, `${player.name} rolled doubles and broke out of jail!`);
        // Fall through to normal move (but no extra turn for doubles from jail)
        s = { ...s, doublesCount: 0 };
      } else {
        const newJailTurns = player.jailTurns + 1;
        if (newJailTurns >= 3) {
          // Forced $50 payment
          s = pmap(s, playerId, p => ({ ...p, money: p.money - 50, inJail: false, jailTurns: 0 }));
          s = log(s, `${player.name} paid $50 fine to leave jail.`);
          // Fall through to move
        } else {
          s = pmap(s, playerId, p => ({ ...p, jailTurns: newJailTurns }));
          s = log(s, `${player.name} stays in jail. (${newJailTurns}/3 turns used)`);
          return { ...s, doublesCount: 0, phase: 'end_turn' };
        }
      }
    }

    // ── Doubles tracking ──
    const doublesCount = isDoubles && !player.inJail ? state.doublesCount + 1 : 0;

    if (isDoubles && doublesCount >= 3) {
      s = sendToJail(s, playerId);
      return { ...s, doublesCount: 0, phase: 'end_turn' };
    }

    s = { ...s, doublesCount };

    // ── Move player ──
    s = moveBy(s, playerId, total);

    // ── Handle landing ──
    s = processLanding(s);
    return s;
  }

  // ── Landing ───────────────────────────────────────────────

  function processLanding(state) {
    const playerId = state.currentPlayer;
    const player = state.players.find(p => p.id === playerId);
    const space = SPACES[player.position];

    let s = log(state, `${player.name} landed on ${space.name}.`);

    switch (space.type) {
      case 'go':
        return { ...s, phase: 'end_turn' };

      case 'property':
      case 'railroad':
      case 'utility': {
        const prop = s.properties[space.id];
        if (!prop) {
          // Unowned — offer to buy
          return { ...s, phase: 'buy' };
        }
        if (prop.owner === playerId) {
          return log({ ...s, phase: 'end_turn' }, `${player.name} owns this — no rent due.`);
        }
        if (prop.mortgaged) {
          return log({ ...s, phase: 'end_turn' }, `${space.name} is mortgaged — no rent.`);
        }
        // Pay rent
        const rent = calculateRent(s, space, playerId);
        const ownerName = s.players.find(p => p.id === prop.owner).name;
        s = log({ ...s, rentToPay: { amount: rent, to: prop.owner } },
          `${player.name} owes $${rent} rent to ${ownerName}.`);
        return { ...s, phase: 'pay_rent' };
      }

      case 'tax': {
        s = pmap(s, playerId, p => ({ ...p, money: p.money - space.amount }));
        s = log(s, `${player.name} paid $${space.amount} tax.`);
        s = checkBankruptcy(s, playerId);
        return s.phase === 'game_over' ? s : { ...s, phase: 'end_turn' };
      }

      case 'chance':
        return drawCard(s, 'chance');

      case 'community_chest':
        return drawCard(s, 'community_chest');

      case 'go_to_jail':
        s = sendToJail(s, playerId);
        return { ...s, phase: 'end_turn' };

      default: // jail, free_parking
        return { ...s, phase: 'end_turn' };
    }
  }

  // ── Rent Calculation ──────────────────────────────────────

  function calculateRent(state, space, tenantId) {
    const prop = state.properties[space.id];

    if (space.type === 'railroad') {
      const ownedRRs = [5,15,25,35].filter(id =>
        state.properties[id]?.owner === prop.owner && !state.properties[id]?.mortgaged
      ).length;
      return [25, 50, 100, 200][ownedRRs - 1] || 25;
    }

    if (space.type === 'utility') {
      const ownedUtils = [12,28].filter(id =>
        state.properties[id]?.owner === prop.owner && !state.properties[id]?.mortgaged
      ).length;
      const diceSum = state.dice[0] + state.dice[1];
      return diceSum * (ownedUtils === 2 ? 10 : 4);
    }

    // Standard property
    const houses = prop.houses || 0;
    if (houses > 0) return space.rent[houses];

    // Check monopoly (double rent with 0 houses)
    const groupSpaces = SPACES.filter(s => s.group === space.group);
    const hasMonopoly = groupSpaces.every(s =>
      state.properties[s.id]?.owner === prop.owner && !state.properties[s.id]?.mortgaged
    );
    return hasMonopoly ? space.rent[0] * 2 : space.rent[0];
  }

  // ── Cards ─────────────────────────────────────────────────

  function drawCard(state, deckType) {
    const isChance = deckType === 'chance';
    const deck  = isChance ? state.chanceCards    : state.communityCards;
    const idx   = isChance ? state.chanceIdx      : state.communityIdx;
    const card  = deck[idx % deck.length];
    const newIdx = idx + 1;

    let s = isChance
      ? { ...state, chanceIdx: newIdx }
      : { ...state, communityIdx: newIdx };

    s = log(s, `📋 ${isChance ? 'Chance' : 'Community Chest'}: "${card.text}"`);
    s = { ...s, pendingCard: card, phase: 'card_shown' };
    return s;
  }

  function resolveCard(state) {
    const card = state.pendingCard;
    if (!card) return { ...state, phase: 'end_turn' };

    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    let s = { ...state, pendingCard: null };

    switch (card.type) {
      case 'advance': {
        const passed = card.target < player.position && card.target !== 0;
        s = advanceTo(s, playerId, card.target, true);
        return processLanding(s);
      }

      case 'collect':
        s = pmap(s, playerId, p => ({ ...p, money: p.money + card.amount }));
        return { ...s, phase: 'end_turn' };

      case 'pay':
        s = pmap(s, playerId, p => ({ ...p, money: p.money - card.amount }));
        s = checkBankruptcy(s, playerId);
        return s.phase === 'game_over' ? s : { ...s, phase: 'end_turn' };

      case 'go_to_jail':
        s = sendToJail(s, playerId);
        return { ...s, phase: 'end_turn' };

      case 'jail_free':
        s = pmap(s, playerId, p => ({ ...p, jailFreeCards: (p.jailFreeCards||0) + 1 }));
        return log({ ...s, phase: 'end_turn' }, `${player.name} keeps a Get Out of Jail Free card!`);

      case 'back': {
        const newPos = ((player.position - card.spaces) + 40) % 40;
        s = { ...s, players: s.players.map(p =>
          p.id === playerId ? { ...p, position: newPos } : p
        )};
        return processLanding(s);
      }

      case 'pay_each': {
        const others = s.players.filter(p => p.id !== playerId && !p.bankrupt);
        const total = card.amount * others.length;
        s = { ...s, players: s.players.map(p => {
          if (p.id === playerId) return { ...p, money: p.money - total };
          if (!p.bankrupt)       return { ...p, money: p.money + card.amount };
          return p;
        })};
        s = checkBankruptcy(s, playerId);
        return s.phase === 'game_over' ? s : { ...s, phase: 'end_turn' };
      }

      case 'collect_each': {
        const others = s.players.filter(p => p.id !== playerId && !p.bankrupt);
        const total = card.amount * others.length;
        s = { ...s, players: s.players.map(p => {
          if (p.id === playerId) return { ...p, money: p.money + total };
          if (!p.bankrupt)       return { ...p, money: p.money - card.amount };
          return p;
        })};
        return { ...s, phase: 'end_turn' };
      }

      case 'nearest': {
        const targets = card.subtype === 'railroad' ? [5,15,25,35] : [12,28];
        const pos = player.position;
        const nearest = targets.find(t => t > pos) || targets[0];
        s = advanceTo(s, playerId, nearest, true);
        const prop = s.properties[nearest];
        if (prop && prop.owner !== playerId && !prop.mortgaged) {
          const space = SPACES[nearest];
          let rent;
          if (card.subtype === 'railroad') {
            rent = calculateRent(s, space, playerId) * card.multiplier;
          } else {
            rent = (s.dice[0] + s.dice[1]) * card.multiplier;
          }
          s = log({ ...s, rentToPay: { amount: rent, to: prop.owner } },
            `${player.name} owes $${rent} (special rate) to ${s.players.find(p=>p.id===prop.owner).name}.`);
          return { ...s, phase: 'pay_rent' };
        }
        return processLanding(s);
      }

      case 'repairs': {
        const ownedProps = SPACES.filter(sp =>
          s.properties[sp.id]?.owner === playerId && !s.properties[sp.id]?.mortgaged
        );
        const cost = ownedProps.reduce((sum, sp) => {
          const houses = s.properties[sp.id].houses || 0;
          return sum + (houses === 5 ? card.hotel : houses * card.house);
        }, 0);
        s = pmap(s, playerId, p => ({ ...p, money: p.money - cost }));
        s = log(s, `${player.name} paid $${cost} for property repairs.`);
        s = checkBankruptcy(s, playerId);
        return s.phase === 'game_over' ? s : { ...s, phase: 'end_turn' };
      }

      default:
        return { ...s, phase: 'end_turn' };
    }
  }

  // ── Buy / Pass ────────────────────────────────────────────

  function buyProperty(state) {
    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    const space    = SPACES[player.position];

    if (player.money < space.price) {
      return log(state, `${player.name} can't afford ${space.name} ($${space.price}).`);
    }

    let s = pmap(state, playerId, p => ({ ...p, money: p.money - space.price }));
    s = { ...s, properties: { ...s.properties,
      [space.id]: { owner: playerId, houses: 0, mortgaged: false }
    }};
    s = log(s, `${player.name} bought ${space.name} for $${space.price}! 🏠`);
    return { ...s, phase: 'end_turn' };
  }

  function passProperty(state) {
    const player = state.players.find(p => p.id === state.currentPlayer);
    return log({ ...state, phase: 'end_turn' }, `${player.name} passed on buying.`);
  }

  // ── Pay Rent ──────────────────────────────────────────────

  function payRent(state) {
    if (!state.rentToPay) return { ...state, phase: 'end_turn' };

    const { amount, to } = state.rentToPay;
    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    const actual   = Math.min(amount, player.money);

    let s = { ...state, players: state.players.map(p => {
      if (p.id === playerId) return { ...p, money: p.money - actual };
      if (p.id === to)       return { ...p, money: p.money + actual };
      return p;
    }), rentToPay: null };

    s = log(s, `${player.name} paid $${actual} to ${s.players.find(p=>p.id===to).name}.`);
    s = checkBankruptcy(s, playerId);
    return s.phase === 'game_over' ? s : { ...s, phase: 'end_turn' };
  }

  // ── Jail Choice ───────────────────────────────────────────

  function useJailFreeCard(state) {
    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    if (!player.inJail || player.jailFreeCards < 1) return state;

    let s = pmap(state, playerId, p => ({
      ...p, inJail: false, jailTurns: 0, jailFreeCards: p.jailFreeCards - 1
    }));
    s = log(s, `${player.name} used a Get Out of Jail Free card!`);
    return { ...s, phase: 'roll' };
  }

  function payJailFine(state) {
    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    if (!player.inJail || player.money < 50) return state;

    let s = pmap(state, playerId, p => ({ ...p, inJail: false, jailTurns: 0, money: p.money - 50 }));
    s = log(s, `${player.name} paid $50 to get out of jail.`);
    return { ...s, phase: 'roll' };
  }

  // ── Build Houses ──────────────────────────────────────────

  function buildHouse(state, spaceId) {
    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    const space    = SPACES[spaceId];

    if (!space || space.type !== 'property') return state;
    const prop = state.properties[spaceId];
    if (!prop || prop.owner !== playerId || prop.mortgaged) return state;
    if (prop.houses >= 5) return log(state, 'Already has a hotel.');

    // Owns all of group?
    const groupSpaces = SPACES.filter(s => s.group === space.group);
    if (!groupSpaces.every(s => state.properties[s.id]?.owner === playerId))
      return log(state, `You need the full ${space.group} group to build.`);

    // Even build rule: can't build on this if another in group has fewer
    const minHouses = Math.min(...groupSpaces.map(s => state.properties[s.id]?.houses || 0));
    if ((prop.houses || 0) > minHouses)
      return log(state, 'Build evenly across the color group first.');

    if (player.money < space.houseCost) return log(state, `Not enough money. Need $${space.houseCost}.`);

    const newHouses = (prop.houses || 0) + 1;
    const label = newHouses === 5 ? 'hotel' : `house #${newHouses}`;
    let s = pmap(state, playerId, p => ({ ...p, money: p.money - space.houseCost }));
    s = { ...s, properties: { ...s.properties, [spaceId]: { ...prop, houses: newHouses } } };
    return log(s, `${player.name} built a ${label} on ${space.name}. 🏠`);
  }

  function sellHouse(state, spaceId) {
    const playerId = state.currentPlayer;
    const player   = state.players.find(p => p.id === playerId);
    const space    = SPACES[spaceId];
    const prop = state.properties[spaceId];
    if (!prop || prop.owner !== playerId || (prop.houses || 0) < 1) return state;

    const sellValue = Math.floor(space.houseCost / 2);
    const newHouses = prop.houses - 1;
    let s = pmap(state, playerId, p => ({ ...p, money: p.money + sellValue }));
    s = { ...s, properties: { ...s.properties, [spaceId]: { ...prop, houses: newHouses } } };
    return log(s, `${player.name} sold a building on ${space.name} for $${sellValue}.`);
  }

  // ── Mortgage ──────────────────────────────────────────────

  function mortgageProperty(state, spaceId) {
    const playerId = state.currentPlayer;
    const space = SPACES[spaceId];
    const prop  = state.properties[spaceId];

    if (!prop || prop.owner !== playerId || prop.mortgaged) return state;
    if ((prop.houses || 0) > 0) return log(state, 'Sell houses before mortgaging.');

    let s = pmap(state, playerId, p => ({ ...p, money: p.money + space.mortgage }));
    s = { ...s, properties: { ...s.properties, [spaceId]: { ...prop, mortgaged: true } } };
    return log(s, `${player.name} mortgaged ${space.name} for $${space.mortgage}.`);
  }

  function unmortgageProperty(state, spaceId) {
    const playerId = state.currentPlayer;
    const space    = SPACES[spaceId];
    const prop     = state.properties[spaceId];

    if (!prop || prop.owner !== playerId || !prop.mortgaged) return state;

    const cost = Math.floor(space.mortgage * 1.1);
    const player = state.players.find(p => p.id === playerId);
    if (player.money < cost) return log(state, `Need $${cost} to lift mortgage.`);

    let s = pmap(state, playerId, p => ({ ...p, money: p.money - cost }));
    s = { ...s, properties: { ...s.properties, [spaceId]: { ...prop, mortgaged: false } } };
    return log(s, `${player.name} lifted mortgage on ${space.name} for $${cost}.`);
  }

  // ── End Turn ──────────────────────────────────────────────

  function endTurn(state) {
    if (state.phase !== 'end_turn') return state;

    const player = state.players.find(p => p.id === state.currentPlayer);
    const isDoubles = state.dice[0] === state.dice[1];

    // Roll again on doubles (unless went to jail)
    if (isDoubles && !player.inJail && state.doublesCount > 0) {
      return log({ ...state, phase: 'roll' }, `${player.name} rolls again for doubles!`);
    }

    // Advance to next active player
    const active = state.players.filter(p => !p.bankrupt);
    const idx = active.findIndex(p => p.id === state.currentPlayer);
    const next = active[(idx + 1) % active.length];

    let s = log({ ...state, currentPlayer: next.id, phase: 'roll', doublesCount: 0 },
      `— ${next.name}'s turn —`);
    return s;
  }

  // ── Bankruptcy ────────────────────────────────────────────

  function checkBankruptcy(state, playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (player.money >= 0) return state;

    // Check if they can sell/mortgage to cover
    const ownedProps = SPACES.filter(sp => state.properties[sp.id]?.owner === playerId);
    const liquidatable = ownedProps.reduce((sum, sp) => {
      const prop = state.properties[sp.id];
      return sum + (prop.houses * Math.floor(SPACES[sp.id].houseCost / 2)) +
             (!prop.mortgaged ? sp.mortgage : 0);
    }, 0);

    if (player.money + liquidatable >= 0) {
      // They can survive — just let them handle it manually
      return state;
    }

    // Bankrupt
    let s = log(state, `💸 ${player.name} has gone bankrupt!`);
    s = pmap(s, playerId, p => ({ ...p, bankrupt: true, money: 0 }));

    // Return properties to bank
    const newProps = { ...s.properties };
    Object.keys(newProps).forEach(id => {
      if (newProps[id].owner === playerId) delete newProps[id];
    });
    s = { ...s, properties: newProps };

    // Check winner
    const active = s.players.filter(p => !p.bankrupt);
    if (active.length === 1) {
      s = log(s, `🏆 ${active[0].name} wins the game!`);
      return { ...s, winner: active[0].id, phase: 'game_over' };
    }

    return { ...s, phase: 'end_turn' };
  }

  // ── Public API ────────────────────────────────────────────

  return {
    createInitialState,
    processRoll,
    resolveCard,
    buyProperty,
    passProperty,
    payRent,
    endTurn,
    buildHouse,
    sellHouse,
    mortgageProperty,
    unmortgageProperty,
    useJailFreeCard,
    payJailFine,
    rollDice,
    calculateRent,
  };

})();
