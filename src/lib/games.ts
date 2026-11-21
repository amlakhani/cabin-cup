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
    objective: 'Move the most cotton balls into your cups in one minute.',
    howTo: [
      'Every player gets a straw and a cup. All three teams play at once.',
      'Pick up cotton balls with the straw only and drop them into a cup.',
      'When the timer hits zero, straws down.',
    ],
    rules: [
      'No hands on the cotton balls.',
      'Only balls fully inside a cup count.',
      'Same number of players and supplies for every team.',
    ],
    format: 'All teams · 60 seconds · team total',
    tiebreak: 'One player from each tied team: a 15-second playoff.',
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
    objective: 'Win the most head-to-head cup grabs across your two heats.',
    howTo: [
      'Three heats: A vs B, B vs C, C vs A. The team sitting out judges.',
      'Players pair up across the table with a cup between each pair. Eight duels per heat.',
      'The host calls body parts. Touch what you hear. On "CUP!", grab it.',
    ],
    rules: [
      'Grabbing before "cup" loses that duel.',
      'Reset hands after every call.',
      'Cups won across both heats decide the placing.',
    ],
    format: '3 heats · 8 duels each · total cups',
    tiebreak: 'Captain duel between the tied teams.',
    unit: 'cups',
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
      'The board appears on the TV. Study it together. No writing.',
      'At zero the board disappears. Teams get 60 seconds to write everything they remember.',
      'Pens down, then the board comes back for the count.',
    ],
    rules: [
      'No writing during study time.',
      'Obvious misspellings are fine.',
      'Duplicates count once. Only unique correct items score.',
    ],
    format: 'Study 30 / 45 / 60 s · write 60 s',
    tiebreak: 'The host asks where an item was, or what kind of thing it was.',
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
    objective: 'Get three in a row before the other team does.',
    howTo: [
      'Two teams play on one floor grid. The third team judges.',
      'A runner flips a cup upright, then runs to place one marker.',
      'Once all three markers are down, runners move one of their own markers instead.',
    ],
    rules: [
      'One runner per team on the grid at a time.',
      'Markers must sit fully inside a square.',
      'Each pairing plays best of three.',
    ],
    format: 'Round robin · best of 3 per pairing',
    tiebreak: 'Short timed relay between the tied teams.',
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
      'Arrange yourselves from least to most, or earliest to latest.',
      'Raise your hands when you think you are done. First correct line wins the round.',
    ],
    rules: [
      'No talking. No mouthing words.',
      'Gestures and fingers are fine.',
      'A wrong line keeps going until it is right.',
    ],
    format: 'Several rounds · most rounds won',
    tiebreak: 'Number of siblings, least to most.',
    unit: 'rounds',
  },
  {
    id: 'balloon',
    number: 6,
    title: 'Balloon Cup Relay',
    short: 'Balloon Relay',
    skills: ['Coordination', 'Breath'],
    kind: 'relay',
    objective: 'Clear every cup off your table first.',
    howTo: [
      'All three teams start together, each with the same number of cups.',
      'Blow up a balloon, then use its air to push one cup completely off the table.',
      'Tag the next teammate. The last cup down finishes your team.',
    ],
    rules: [
      'No touching cups with hands or the balloon.',
      'The cup must fall all the way off the table.',
      'One player at the table at a time.',
    ],
    format: 'All teams · race to finish',
    tiebreak: 'One player, one cup. Fastest wins.',
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
      'A match stays up and scores. A miss flips back. Either way, the next team goes.',
    ],
    rules: [
      'Only the active team calls numbers.',
      'No pointing or calling once the turn passes.',
      'Most pairs wins.',
    ],
    format: 'Teams rotate · most pairs',
    tiebreak: 'First pair found on a fresh board.',
    unit: 'pairs',
  },
  {
    id: 'chopstick',
    number: 8,
    title: 'Chopstick Kiss Transfer',
    short: 'Chopsticks',
    skills: ['Fine motor', 'Focus'],
    kind: 'totals',
    objective: 'Move the most Hershey’s Kisses into your cups in one minute.',
    howTo: [
      'Every active player gets chopsticks. All three teams play at once.',
      'Pick up one Kiss at a time and drop it in a cup.',
      'When the timer hits zero, chopsticks down.',
    ],
    rules: [
      'No hands on the candy.',
      'Dropped Kisses do not count.',
      'Only candy fully inside a cup counts.',
    ],
    format: 'All teams · 60 seconds · team total',
    tiebreak: 'Captains only: a 30-second playoff.',
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
      'Everyone else on the team acts out the prompt together.',
      'Two 60-second turns per team, with a different guesser each time.',
    ],
    rules: [
      'No words, no spelling, no pointing at the screen.',
      'Sound effects are allowed.',
      'Stuck? Pass and move on.',
    ],
    format: '2 turns per team · 60 s each',
    tiebreak: 'One extra turn for each tied team.',
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
    objective: 'Have the most cups standing on your balancer at five minutes.',
    howTo: [
      'Each team picks one balancer, arms straight out to the sides.',
      'A teammate flips a cup upright and catches a ping-pong ball in it.',
      'Then they run the cup over and set it on the balancer’s arm.',
    ],
    rules: [
      'Balancers cannot lower their arms or hold the cups.',
      'Fallen cups do not count.',
      'Cups are counted at exactly 5:00.',
    ],
    format: 'All teams · 5 minutes · cups standing',
    tiebreak: '60 seconds of overtime with the same balancer.',
    timer: 300,
    tiebreakTimer: 60,
    unit: 'cups',
  },
]

export const BOARDS = [
  { id: 'easy', label: 'Warm-up', count: 16, src: '/boards/easy.webp' },
  { id: 'medium', label: 'Tricky', count: 32, src: '/boards/medium.webp' },
  { id: 'hard', label: 'Brutal', count: 56, src: '/boards/hard.webp' },
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
