// ============================================================
//  network.js  –  P2P multiplayer via PeerJS (free, no server)
//  Host shares a 6-char code. Guest connects with that code.
//  All game state is broadcast from the current-turn player.
// ============================================================

const Network = (() => {

  let peer       = null;
  let conn       = null;       // host: connection to guest | guest: connection to host
  let isHost     = false;
  let myName     = '';
  let guestName  = '';
  let gameCode   = '';

  // ── Host ──────────────────────────────────────────────────

  function hostGame(name) {
    myName  = name;
    isHost  = true;
    gameCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    peer = new Peer('mono-' + gameCode, { debug: 0 });

    peer.on('open', id => {
      document.getElementById('host-code-display').textContent = gameCode;
      document.getElementById('host-waiting').style.display = 'block';
      console.log('Hosting as', id);
    });

    peer.on('connection', c => {
      conn = c;
      conn.on('open', () => {
        conn.on('data', onData);
        // Ask guest for their name
        conn.send({ type: 'request_name' });
      });
      conn.on('error', err => console.error('Conn error', err));
    });

    peer.on('error', err => {
      alert('Network error: ' + err.message);
    });
  }

  // ── Guest ─────────────────────────────────────────────────

  function joinGame(code, name) {
    myName   = name;
    isHost   = false;
    gameCode = code;

    peer = new Peer({ debug: 0 });

    peer.on('open', () => {
      conn = peer.connect('mono-' + code, { reliable: true });

      conn.on('open', () => {
        conn.on('data', onData);
        console.log('Connected to host');
      });

      conn.on('error', err => {
        alert('Could not connect. Check the game code.');
        console.error(err);
      });
    });

    peer.on('error', err => {
      alert('Network error: ' + err.message);
    });
  }

  // ── Messaging ─────────────────────────────────────────────

  function send(data) {
    if (conn && conn.open) conn.send(data);
  }

  function broadcast(gameState) {
    send({ type: 'state', state: gameState });
  }

  function onData(msg) {
    switch (msg.type) {

      case 'request_name':
        // Guest sends their name back
        send({ type: 'player_name', name: myName });
        break;

      case 'player_name':
        // Host receives guest name and starts game
        guestName = msg.name;
        document.getElementById('host-waiting').style.display = 'none';
        UI.onGameStart([myName, guestName], 0);  // host is player 0
        send({ type: 'game_start', hostName: myName, guestName });
        break;

      case 'game_start':
        // Guest starts the game
        UI.onGameStart([msg.hostName, msg.guestName], 1);  // guest is player 1
        break;

      case 'state':
        // Receive updated game state from peer
        UI.onNetworkState(msg.state);
        break;
    }
  }

  return { hostGame, joinGame, broadcast };

})();
