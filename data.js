// ============================================================
//  data.js  –  All board data (easy to customize!)
//  To personalize: change names, colors, card texts, etc.
// ============================================================

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const PLAYER_TOKENS  = ['🎩', '🚢', '🐶', '⛵'];

const PROPERTY_COLORS = {
  brown:    '#8B4513',
  lightblue:'#87CEEB',
  pink:     '#FF69B4',
  orange:   '#FF8C00',
  red:      '#DC143C',
  yellow:   '#FFD700',
  green:    '#228B22',
  darkblue: '#00008B',
};

const GROUP_SIZE = {
  brown: 2, lightblue: 3, pink: 3, orange: 3,
  red: 3, yellow: 3, green: 3, darkblue: 2,
};

// rent[0]=base, [1]=1 house, [2]=2 houses, [3]=3 houses, [4]=4 houses, [5]=hotel
const SPACES = [
  { id: 0,  name: 'GO',                    type: 'go',              icon: '→' },
  { id: 1,  name: 'Mediterranean Ave',     type: 'property', group: 'brown',    price: 60,  rent: [2,10,30,90,160,250],    houseCost: 50,  mortgage: 30  },
  { id: 2,  name: 'Community Chest',       type: 'community_chest', icon: '📦' },
  { id: 3,  name: 'Baltic Ave',            type: 'property', group: 'brown',    price: 60,  rent: [4,20,60,180,320,450],   houseCost: 50,  mortgage: 30  },
  { id: 4,  name: 'Income Tax',            type: 'tax',             amount: 200, icon: '💸' },
  { id: 5,  name: 'Reading Railroad',      type: 'railroad',        price: 200, mortgage: 100, icon: '🚂' },
  { id: 6,  name: 'Oriental Ave',          type: 'property', group: 'lightblue',price: 100, rent: [6,30,90,270,400,550],   houseCost: 50,  mortgage: 50  },
  { id: 7,  name: 'Chance',               type: 'chance',          icon: '?' },
  { id: 8,  name: 'Vermont Ave',           type: 'property', group: 'lightblue',price: 100, rent: [6,30,90,270,400,550],   houseCost: 50,  mortgage: 50  },
  { id: 9,  name: 'Connecticut Ave',       type: 'property', group: 'lightblue',price: 120, rent: [8,40,100,300,450,600],  houseCost: 50,  mortgage: 60  },
  { id: 10, name: 'Jail',                  type: 'jail',            icon: '⛓' },
  { id: 11, name: 'St. Charles Place',     type: 'property', group: 'pink',     price: 140, rent: [10,50,150,450,625,750], houseCost: 100, mortgage: 70  },
  { id: 12, name: 'Electric Company',      type: 'utility',         price: 150, mortgage: 75, icon: '⚡' },
  { id: 13, name: 'States Ave',            type: 'property', group: 'pink',     price: 140, rent: [10,50,150,450,625,750], houseCost: 100, mortgage: 70  },
  { id: 14, name: 'Virginia Ave',          type: 'property', group: 'pink',     price: 160, rent: [12,60,180,500,700,900], houseCost: 100, mortgage: 80  },
  { id: 15, name: 'Pennsylvania Railroad', type: 'railroad',        price: 200, mortgage: 100, icon: '🚂' },
  { id: 16, name: 'St. James Place',       type: 'property', group: 'orange',   price: 180, rent: [14,70,200,550,750,950], houseCost: 100, mortgage: 90  },
  { id: 17, name: 'Community Chest',       type: 'community_chest', icon: '📦' },
  { id: 18, name: 'Tennessee Ave',         type: 'property', group: 'orange',   price: 180, rent: [14,70,200,550,750,950], houseCost: 100, mortgage: 90  },
  { id: 19, name: 'New York Ave',          type: 'property', group: 'orange',   price: 200, rent: [16,80,220,600,800,1000],houseCost: 100, mortgage: 100 },
  { id: 20, name: 'Free Parking',          type: 'free_parking',    icon: '🅿' },
  { id: 21, name: 'Kentucky Ave',          type: 'property', group: 'red',      price: 220, rent: [18,90,250,700,875,1050],houseCost: 150, mortgage: 110 },
  { id: 22, name: 'Chance',               type: 'chance',          icon: '?' },
  { id: 23, name: 'Indiana Ave',           type: 'property', group: 'red',      price: 220, rent: [18,90,250,700,875,1050],houseCost: 150, mortgage: 110 },
  { id: 24, name: 'Illinois Ave',          type: 'property', group: 'red',      price: 240, rent: [20,100,300,750,925,1100],houseCost: 150, mortgage: 120 },
  { id: 25, name: 'B&O Railroad',          type: 'railroad',        price: 200, mortgage: 100, icon: '🚂' },
  { id: 26, name: 'Atlantic Ave',          type: 'property', group: 'yellow',   price: 260, rent: [22,110,330,800,975,1150],houseCost: 150, mortgage: 130 },
  { id: 27, name: 'Ventnor Ave',           type: 'property', group: 'yellow',   price: 260, rent: [22,110,330,800,975,1150],houseCost: 150, mortgage: 130 },
  { id: 28, name: 'Water Works',           type: 'utility',         price: 150, mortgage: 75, icon: '💧' },
  { id: 29, name: 'Marvin Gardens',        type: 'property', group: 'yellow',   price: 280, rent: [24,120,360,850,1025,1200],houseCost: 150, mortgage: 140 },
  { id: 30, name: 'Go to Jail',            type: 'go_to_jail',      icon: '👮' },
  { id: 31, name: 'Pacific Ave',           type: 'property', group: 'green',    price: 300, rent: [26,130,390,900,1100,1275],houseCost: 200, mortgage: 150 },
  { id: 32, name: 'North Carolina Ave',    type: 'property', group: 'green',    price: 300, rent: [26,130,390,900,1100,1275],houseCost: 200, mortgage: 150 },
  { id: 33, name: 'Community Chest',       type: 'community_chest', icon: '📦' },
  { id: 34, name: 'Pennsylvania Ave',      type: 'property', group: 'green',    price: 320, rent: [28,150,450,1000,1200,1400],houseCost: 200, mortgage: 160 },
  { id: 35, name: 'Short Line Railroad',   type: 'railroad',        price: 200, mortgage: 100, icon: '🚂' },
  { id: 36, name: 'Chance',               type: 'chance',          icon: '?' },
  { id: 37, name: 'Park Place',            type: 'property', group: 'darkblue', price: 350, rent: [35,175,500,1100,1300,1500],houseCost: 200, mortgage: 175 },
  { id: 38, name: 'Luxury Tax',            type: 'tax',             amount: 75, icon: '💎' },
  { id: 39, name: 'Boardwalk',             type: 'property', group: 'darkblue', price: 400, rent: [50,200,600,1400,1700,2000],houseCost: 200, mortgage: 200 },
];

// ── Chance Cards ──────────────────────────────────────────
const CHANCE_CARDS = [
  { text: 'Advance to GO. Collect $200.',                                            type: 'advance',     target: 0,  collect: 200 },
  { text: 'Advance to Illinois Ave. If you pass GO, collect $200.',                 type: 'advance',     target: 24 },
  { text: 'Advance to St. Charles Place. If you pass GO, collect $200.',            type: 'advance',     target: 11 },
  { text: 'Advance to the nearest Railroad and pay owner twice the rental.',        type: 'nearest',     subtype: 'railroad', multiplier: 2 },
  { text: 'Advance to the nearest Railroad and pay owner twice the rental.',        type: 'nearest',     subtype: 'railroad', multiplier: 2 },
  { text: 'Advance to nearest Utility. Pay owner 10× dice.',                        type: 'nearest',     subtype: 'utility', multiplier: 10 },
  { text: 'Bank pays you a dividend of $50.',                                        type: 'collect',     amount: 50 },
  { text: 'Get out of Jail free. Keep this card until you need it.',                type: 'jail_free' },
  { text: 'Go back three spaces.',                                                   type: 'back',        spaces: 3 },
  { text: 'Go to Jail. Do not pass GO.',                                             type: 'go_to_jail' },
  { text: 'Make general repairs: pay $25 per house, $100 per hotel.',               type: 'repairs',     house: 25, hotel: 100 },
  { text: 'Speeding fine. Pay $15.',                                                 type: 'pay',         amount: 15 },
  { text: 'Take a trip to Reading Railroad. If you pass GO, collect $200.',         type: 'advance',     target: 5 },
  { text: 'Advance to Boardwalk.',                                                   type: 'advance',     target: 39 },
  { text: 'You are elected Chairman of the Board. Pay each player $50.',            type: 'pay_each',    amount: 50 },
  { text: 'Your building loan matures. Collect $150.',                              type: 'collect',     amount: 150 },
];

// ── Community Chest Cards ─────────────────────────────────
const COMMUNITY_CHEST_CARDS = [
  { text: 'Advance to GO. Collect $200.',                                            type: 'advance',     target: 0, collect: 200 },
  { text: 'Bank error in your favor. Collect $200.',                                 type: 'collect',     amount: 200 },
  { text: "Doctor's fees. Pay $50.",                                                  type: 'pay',         amount: 50 },
  { text: 'From sale of stock you get $50.',                                          type: 'collect',     amount: 50 },
  { text: 'Get out of Jail free.',                                                    type: 'jail_free' },
  { text: 'Go to Jail. Do not pass GO.',                                              type: 'go_to_jail' },
  { text: 'Grand Opera Night. Collect $50 from every player.',                       type: 'collect_each',amount: 50 },
  { text: 'Holiday fund matures. Receive $100.',                                     type: 'collect',     amount: 100 },
  { text: 'Income tax refund. Collect $20.',                                          type: 'collect',     amount: 20 },
  { text: 'It is your birthday! Collect $10 from every player.',                    type: 'collect_each',amount: 10 },
  { text: 'Life insurance matures. Collect $100.',                                   type: 'collect',     amount: 100 },
  { text: 'Hospital fees. Pay $100.',                                                 type: 'pay',         amount: 100 },
  { text: 'School fees. Pay $150.',                                                   type: 'pay',         amount: 150 },
  { text: 'Receive $25 consultancy fee.',                                             type: 'collect',     amount: 25 },
  { text: 'You inherit $100.',                                                         type: 'collect',     amount: 100 },
  { text: 'You win second prize in a beauty contest. Collect $10.',                  type: 'collect',     amount: 10 },
];
