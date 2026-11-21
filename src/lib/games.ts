export type GameKind =
  | 'totals'
  | 'heats'
  | 'memory-board'
  | 'tictactoe'
  | 'lineup'
  | 'relay'
  | 'match'
  | 'charades'

export interface GameDef {
  id: string
  number: number
  title: string
  short: string
  skills: [string, string]
  kind: GameKind
  objective: string
  howTo: string[]
  rules: string[]
  format: string
  tiebreak: string
  /** main timer in seconds, if the game is timed */
  timer?: number
  /** tiebreak timer in seconds, if any */
  tiebreakTimer?: number
  unit?: string
}

export const GAMES: GameDef[] = [
  {
    id: 'cotton',
    number: 1,
    title: 'Cotton Balls in a Cup',
    short: 'Cotton Balls',
    skills: ['Dexterity', 'Focus'],
    kind: 'totals',
    objective: 'Get the most cotton balls into your team’s cups in 60 seconds.',
    howTo: [
      'Everyone plays at once. Each player has a straw and a cup.',
      'Pick up cotton balls with the straw and drop them into your cup.',
      'At the buzzer, count the balls fully inside each team’s cups.',
    ],
    rules: ['Hands stay off the cotton balls.', 'Only balls fully inside a cup count.', 'Highest team total wins.'],
    format: 'Everyone at once · 60 seconds · team total',
    tiebreak: 'One player from each tied team gets 15 seconds.',
    timer: 60,
    tiebreakTimer: 15,
    unit: 'balls',
  },
  {
    id: 'hskc',
    number: 2,
    title: 'Head, Shoulders, Knees, Cup',
    short: 'Head Shoulders Cup',
    skills: ['Reaction', 'Focus'],
    kind: 'heats',
    objective: 'Win the most cup-grab duels against both other teams.',
    howTo: [
      'Two teams face off while the third team judges. Every team plays both opponents.',
      'Players pair up across a cup. With four cups, a matchup runs in two waves.',
      'The host calls body parts. Touch what you hear. Grab only on “cup.”',
    ],
    rules: ['An early grab loses the duel.', 'Hands back in place after every call.', 'Total duels won decides the placing.'],
    format: 'Three matchups · waves of duels · total duels won',
    tiebreak: 'One captain per tied team. If all three tie, each captain faces both others.',
    unit: 'duels',
  },
  {
    id: 'memorize',
    number: 3,
    title: 'Memorize the Board',
    short: 'Memorize',
    skills: ['Memory', 'Observation'],
    kind: 'memory-board',
    objective: 'Remember as many items from the board as you can.',
    howTo: [
      'The board appears on the TV. Study it together, without writing.',
      'When the board disappears, teams get 60 seconds to write everything they remember.',
      'Then the board and the full answer list come up for the count.',
    ],
    rules: ['No writing while the board is up.', 'Obvious misspellings are fine.', 'Each correct item counts once per team.'],
    format: 'Study 30 / 45 / 60 s · recall 60 s',
    tiebreak: 'The host asks tied teams about an item’s category or location.',
    timer: 60,
    unit: 'items',
  },
  {
    id: 'tictactoe',
    number: 4,
    title: 'Running Tic-Tac-Toe',
    short: 'Tic-Tac-Toe',
    skills: ['Strategy', 'Speed'],
    kind: 'tictactoe',
    objective: 'Get three in a row on the taped grid before the other team.',
    howTo: [
      'Two teams race on a taped 3×3 grid. The third team judges.',
      'A runner flips a cup upright, places a marker in an empty square, then tags the next runner.',
      'Once all three of your markers are down, runners move one of their own instead.',
    ],
    rules: ['Teams choose their own running order.', 'Three in a row wins the board.', 'Every pairing plays best of three.'],
    format: 'Round robin · best of 3 · match wins, then board difference',
    tiebreak: 'Still tied? Time a three-marker relay for the tied teams.',
    unit: 'wins',
  },
  {
    id: 'lineup',
    number: 5,
    title: 'Silent Line-Up',
    short: 'Silent Line-Up',
    skills: ['Communication', 'Logic'],
    kind: 'lineup',
    objective: 'Line up in the right order without saying a word.',
    howTo: [
      'A category appears on the TV.',
      'Line up in order using gestures only.',
      'The first team the judge confirms is correct wins the round.',
    ],
    rules: ['No talking. No mouthing words.', 'Gestures and fingers are fine.', 'Most round wins takes the game.'],
    format: 'Several rounds · most rounds won',
    tiebreak: 'Line up by number of siblings.',
    unit: 'rounds',
  },
  {
    id: 'balloon',
    number: 6,
    title: 'Balloon Cup Relay',
    short: 'Balloon Relay',
    skills: ['Coordination', 'Breath'],
    kind: 'relay',
    objective: 'Move the most cups with balloon air in 60 seconds.',
    howTo: [
      'One table, 25 cups, one team at a time. Each team gets 60 seconds.',
      'Blow up a balloon and use its air to push a cup past the finish.',
      'Tag the next teammate after each cup. Cups reset between teams.',
    ],
    rules: [
      'No touching cups with hands or the balloon.',
      'A cup counts once it fully crosses the line or falls off.',
      'Most cups wins.',
    ],
    format: 'One team at a time · 60 seconds · 25 cups',
    tiebreak: 'One player and one cup per tied team. Fastest wins.',
    timer: 60,
    unit: 'cups',
  },
  {
    id: 'match',
    number: 7,
    title: 'Match the Pictures',
    short: 'Match',
    skills: ['Memory', 'Strategy'],
    kind: 'match',
    objective: 'Find the most matching pairs on the board.',
    howTo: [
      'Numbered cards sit face-down on the TV.',
      'On your turn, call out two numbers. The host flips them.',
      'A match stays up and scores a point. A miss gets hidden again. Either way, the turn passes.',
    ],
    rules: ['Only the active team calls numbers.', 'Everyone gets a look before a miss is hidden.', 'Most pairs wins.'],
    format: 'Teams rotate · one point per pair',
    tiebreak: 'First pair found on a fresh board wins.',
    unit: 'pairs',
  },
  {
    id: 'chopstick',
    number: 8,
    title: 'Chopstick Kiss Transfer',
    short: 'Chopsticks',
    skills: ['Fine motor', 'Focus'],
    kind: 'totals',
    objective: 'Move the most Hershey’s Kisses into your team’s cup in 60 seconds.',
    howTo: [
      'Every active player gets chopsticks. All three teams play at once.',
      'Move wrapped Kisses into your team’s cup, one at a time.',
      'At the buzzer, count what’s fully inside the cup.',
    ],
    rules: ['Same number of active players on every team.', 'Dropped candy is out.', 'Only pieces fully inside the cup count.'],
    format: 'All teams · 60 seconds · team total',
    tiebreak: 'One captain per tied team gets 30 seconds.',
    timer: 60,
    tiebreakTimer: 30,
    unit: 'kisses',
  },
  {
    id: 'charades',
    number: 9,
    title: 'Reverse Charades',
    short: 'Reverse Charades',
    skills: ['Teamwork', 'Creativity'],
    kind: 'charades',
    objective: 'Get your guesser to say as many prompts as possible.',
    howTo: [
      'One guesser stands with their back to the TV.',
      'The rest of the team acts out the prompt together.',
      'Two 60-second turns per team, with a different guesser each time.',
    ],
    rules: ['No speaking, no sounds, no spelling.', 'Stuck? Pass and move on.', 'Most correct guesses wins.'],
    format: '2 turns per team · 60 s each',
    tiebreak: 'One extra turn of the same length for each tied team.',
    timer: 60,
    unit: 'correct',
  },
  {
    id: 'balance',
    number: 10,
    title: 'Cup Balance Finale',
    short: 'Cup Balance',
    skills: ['Balance', 'Teamwork'],
    kind: 'totals',
    objective: 'Have the most cups still standing on your balancer at five minutes.',
    howTo: [
      'One balancer per team holds both arms straight out.',
      'A teammate tosses a ping-pong ball, flips a cup upright and catches the ball in it.',
      'Then they place that cup on the balancer’s arm.',
    ],
    rules: [
      'Balancers cannot lower their arms or hold the cups.',
      'Fallen cups do not count.',
      'Cups standing at exactly 5:00 count.',
    ],
    format: 'All teams · 5 minutes · cups standing',
    tiebreak: '60 seconds of overtime with the same balancer.',
    timer: 300,
    tiebreakTimer: 60,
    unit: 'cups',
  },
]

const EASY_ITEMS = [
  'Soccer ball', 'Pizza slice', 'Baseball cap', 'Dog', 'Water bottle', 'Headphones', 'Banana', 'Potted plant',
  'Sunglasses', 'Backpack', 'Stack of books', 'High-top sneaker', 'Basketball', 'Ice cream cone', 'Mug',
]
const MEDIUM_ITEMS = [
  'Basketball', 'Mug', 'Dog', 'Sunglasses', 'Pizza slice', 'Backpack', 'Potted plant', 'Apple', 'Soccer ball',
  'Baseball cap', 'Notebook', 'Camera', 'Cookie', 'Water bottle', 'Cat', 'Banana', 'Tree', 'Maple leaf',
  'Football', 'Headphones', 'Seashell', 'Beach umbrella', 'Stack of books', 'Ice cream cone', 'Frying pan',
  'Clock', 'High-top sneaker', 'Globe', 'Cowboy hat', 'Binoculars', 'Sunflower', 'Car', 'Tent', 'Airplane',
]
const HARD_ITEMS = [
  'Soccer ball', 'Blue mug', 'Dog', 'Apple', 'Sunglasses', 'Backpack', 'Pizza slice', 'White headphones',
  'Potted plant', 'Baseball cap', 'Cookie', 'Basketball', 'Watermelon slice', 'Laptop', 'Camera', 'Water bottle',
  'Burger', 'Football', 'Cat', 'White sneakers', 'Globe', 'Banana', 'Game controller', 'Striped towel',
  'Straw sun hat', 'Pine tree', 'Popcorn', 'Tent', 'Golf ball', 'Guitar', 'Binoculars', 'Red car', 'Sunflower',
  'Butterfly', 'Suitcase', 'Sports bottle', 'Spiral notebook', 'Eyeglasses', 'Hiking boots', 'Bowl of cereal',
  'Denim jacket', 'Smartphone', 'Tree', 'Frying pan', 'Volleyball', 'Croissant', 'Baseball', 'Goldfish',
  'Monstera leaf', 'Keys', 'Carrot', 'Alarm clock', 'Wooden chair', 'Umbrella', 'Surfboard', 'Lighthouse',
  'Seagull', 'Red book', 'Pinecone', 'Canoe', 'Toilet paper roll', 'Green mug', 'Maple leaf',
]

export const BOARDS = [
  { id: 'easy', label: 'Warm-up', count: 15, src: '/boards/easy.webp', items: EASY_ITEMS },
  { id: 'medium', label: 'Tricky', count: 34, src: '/boards/medium.webp', items: MEDIUM_ITEMS },
  { id: 'hard', label: 'Brutal', count: 63, src: '/boards/hard.webp', items: HARD_ITEMS },
] as const

export const DEFAULT_LINEUP_CATEGORIES = [
  'Birthday month (January → December)',
  'Height (shortest → tallest)',
  'Last digit of your phone number (0 → 9)',
  'Shoe size (smallest → largest)',
  'First name, alphabetical (A → Z)',
  'Age (youngest → oldest)',
  'How far you traveled to get here (closest → farthest)',
]

export const DEFAULT_CHARADES_PROMPTS = [
  'Brushing your teeth',
  'Riding a roller coaster',
  'Making rotis',
  'Taking a selfie',
  'Walking a stubborn dog',
  'Washing a car',
  'Playing cricket',
  'Changing a diaper',
  'Doing garba',
  'Flying a kite',
  'Getting stuck in traffic',
  'Opening a gift you hate',
  'Building a snowman',
  'Swimming',
  'A cat waking up',
  'Popcorn popping',
  'A T-rex trying to clap',
  'Ordering at a drive-thru',
  'Fishing',
  'Grandma on a video call',
  'Lifting heavy weights',
  'Being a statue',
  'A penguin waddling',
  'Driving in the rain',
  'Playing the drums',
  'Eating spicy food',
  'Running late for a flight',
  'Mopping the floor',
  'A superhero landing',
  'Hiking up a mountain',
  'Putting on a tight jacket',
  'Watching a scary movie',
  'Baking a cake',
  'Climbing a ladder',
  'Being a robot',
  'Juggling',
  'Walking on ice',
  'Rowing a boat',
  'A monkey eating a banana',
  'Taking a group photo',
]
