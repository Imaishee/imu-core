# Game Design Documents - IMU-CORE Games

Following the GameDesigner's documentation standards, each mechanic is documented with: purpose, player experience goal, inputs, outputs, edge cases, and failure states.

---

# Core Game Design Document: Flashcards

## Purpose
To facilitate active recall and spaced repetition learning of terminology and definitions through interactive flashcard mechanics.

## Player Experience Goal
The player should feel confident in their knowledge retrieval abilities and experience satisfying "aha!" moments when they correctly recall information.

## Player Fantasy
"I am a knowledge master who can quickly retrieve information from memory."

## Input
- Visual presentation of term/unit
- Tap/click to flip card
- Left button (Again) for incorrect recall
- Right button (Got it!) for correct recall

## Output
- Card flip animation showing definition
- Correct/incorrect feedback visual
- Score increment for correct answers
- XP award at session end
- Progression to next card

## Success Condition
Player correctly identifies whether they know the definition before flipping, demonstrating accurate metacognition of their knowledge state.

## Failure State
Player marks incorrect when they actually know the answer (over-confidence) or marks correct when they don't know (under-confidence), both indicating poor metacognitive awareness.

## Edge Cases
- What if user taps rapidly multiple times? → Debounce input to prevent state corruption
- What if API fails to load topics? → Show retry mechanism with local fallback
- What if user has perfect recall? → Session ends with maximum reward
- What if user has zero recall? → Session ends with minimum reward but learning opportunity

## Tuning Levers [PLACEHOLDER]
- Base XP per correct card: [PLACEHOLDER] - test if 10 feels appropriate for learning value
- Perfect session bonus: [PLACEHOLDER] - test if 20 feels appropriately motivating
- Number of cards per session: [PLACEHOLDER] - test if 10 feels right for session length
- Animation duration: [PLACEHOLDER] - test if 0.4s feels snappy but not jarring

## Dependencies
- Syllabus API for topic data
- XP system for progression
- Game header/footer UI components
- Local storage for session state (optional)

---

# Core Game Design Document: Quiz Time

## Purpose
To assess and reinforce knowledge retention through varied question formats and immediate feedback.

## Player Experience Goal
The player should feel challenged but capable, experiencing growth in their knowledge confidence with each correct answer.

## Player Fantasy
"I am a quick thinker who can apply knowledge under pressure."

## Input
- Question presentation
- Four option buttons
- Timer visualization
- Option selection via click/tap

## Output
- Visual feedback on correctness (green/red)
- Explanation of correct answer (when available)
- Score increment
- Timer decrement
- XP award at session end
- Progression to next question

## Success Condition
Player selects the correct answer demonstrating knowledge retention and application.

## Failure State
Player selects incorrect answer indicating knowledge gap or misapplication.

## Edge Cases
- What if user doesn't answer before timer ends? → Automatic incorrect with timeout feedback
- What if two options seem correct? → Design questions to have one clearly best answer
- What if user knows none of the options? → Still must choose, reinforcing guessing penalty concept
- What if question is ambiguous? → Implement reporting system for flawed questions

## Tuning Levers [PLACEHOLDER]
- Base XP per correct answer: [PLACEHOLDER] - test if 15 feels appropriate
- Perfect session bonus: [PLACEHOLDER] - test if 25 feels appropriately motivating
- Time limit: [PLACEHOLDER] - test if 60 seconds creates right pressure/skill balance
- Number of questions: [PLACEHOLDER] - test if 10 feels right for session depth
- Options per question: [PLACEHOLDER] - test if 4 is optimal for difficulty/guess rate

## Dependencies
- Syllabus API for topic data
- XP system for progression
- TimerBar component for time visualization
- Game header/footer UI components

---

# Core Game Design Document: Match Up

## Purpose
To strengthen associative memory and knowledge connections through visual matching mechanics.

## Player Experience Goal
The player should feel their memory improving and experience satisfaction from making correct connections between related concepts.

## Player Fantasy
"I have a steel-trap memory that instantly connects related information."

## Input
- Card flip via click/tap
- Visual memory of card positions and content
- Strategic decision of which card to flip next

## Output
- Card flip animation
- Match/mismatch feedback (visual and optional audio)
- Score increment for matches
- Move counter increment
- XP award at session end
- Progression when all pairs matched

## Success Condition
Player correctly identifies matching pairs demonstrating effective associative memory and visual recall.

## Failure State
Player fails to remember card positions leading to mismatches, indicating memory decay or interference.

## Edge Cases
- What if user flips same card twice? → Prevent action with visual feedback
- What if user tries to flip third card while two are flipped? → Prevent action
- What if all remaining cards are unmatched but user keeps mismatching? → Eventually probability ensures success
- What if user has exceptional visual memory? → Session completes quickly with high score

## Tuning Levers [PLACEHOLDER]
- Base XP per match: [PLACEHOLDER] - test if 20 feels appropriate
- Perfect session bonus: [PLACEHOLDER] - test if 30 feels appropriately motivating
- Number of pairs: [PLACEHOLDER] - test if 6 feels right for cognitive load/gratification
- Card flip delay before mismatch reset: [PLACEHOLDER] - test if 1s feels right for memory processing
- Grid size: [PLACEHOLDER] - test if 3x2 is optimal vs 4x3 etc.

## Dependencies
- Syllabus API for topic data
- XP system for progression
- Game header/footer UI components
- Animation system for card flips

---

# Core Game Design Document: Word Search

## Purpose
To enhance pattern recognition and vocabulary scanning abilities through engaging word-finding mechanics.

## Player Experience Goal
The player should feel increasingly adept at spotting patterns and experience flow state when words "pop out" of the grid.

## Player Fantasy
"I am a pattern recognition expert who can quickly find hidden information in chaos."

## Input
- Cell selection via click/tap
- Path extension via adjacent cell selection
- Word submission via button click
- Path deselection via re-selecting first/last cell

## Output
- Cell selection visualization
- Path highlighting
- Found word validation feedback
- Word list updates (found vs remaining)
- Score increment for found words
- XP award at session end
- Progression when all words found

## Success Condition
Player correctly identifies and selects all target words in the grid demonstrating pattern recognition and sustained attention.

## Failure State
Player fails to find words due to poor visual scanning or giving up prematurely.

## Edge Cases
- What if user selects non-adjacent cells? → Reset selection with feedback
- What if user selects same cell twice in path? → Toggle selection state
- What if word appears backwards in grid? → Accept as valid (common variant)
- What if user gets stuck? → Implement hint system after timeout
- What if words overlap in grid? → Ensure generation algorithm handles properly

## Tuning Levers [PLACEHOLDER]
- Base XP per word found: [PLACEHOLDER] - test if 25 feels appropriate
- Grid size: [PLACEHOLDER] - test if 8x8 creates right difficulty/density
- Word list size: [PLACEHOLDER] - test if 5 words feels right for session length
- Word length constraints: [PLACEHOLDER] - test if 3-8 letters feels right for detectability
- Letter distribution: [PLACEHOLDER] - test if random vs weighted frequency affects difficulty
- Hint timeout: [PLACEHOLDER] - test if 30s of inactivity feels right for offering help

## Dependencies
- Syllabus API for topic data
- XP system for progression
- Game header/footer UI components
- Grid generation algorithm
- Path validation logic

---

# Core Game Design Document: Puzzle

## Purpose
To develop understanding of sequential relationships, hierarchies, and logical ordering through interactive sequencing mechanics.

## Player Experience Goal
The player should feel their logical reasoning improving and experience satisfaction from correctly organizing information.

## Player Fantasy
"I am a logical organizer who can quickly see how concepts relate and sequence."

## Input
- Item drag initiation via click/tap and hold
- Item dragging via mouse/finger movement
- Item drop via release
- Order verification via button click

## Output
- Item movement following drag
- Position indicators (order numbers)
- Validation feedback on submit
- Correct positioning feedback (green/red)
- Score based on number of correctly ordered items
- XP award at session end
- Progression when all items correctly ordered (optional threshold)

## Success Condition
Player correctly sequences all or threshold number of items demonstrating understanding of relational logic.

## Failure State
Player fails to sequence items correctly indicating misunderstanding of conceptual relationships.

## Edge Cases
- What if user tries to drag non-draggable element? → Ignore input
- What if user drags item to same position? → No state change
- What if user rapidly drags multiple items? → Maintain last valid state
- What if conceptual sequence has multiple valid orderings? → Define canonical order or accept multiple
- What if items have ambiguous relationships? → Provide clear definitions in content

## Tuning Levers [PLACEHOLDER]
- Base XP per correct item: [PLACEHOLDER] - test if 20 feels appropriate
- Number of items: [PLACEHOLDER] - test if 6 feels right for cognitive complexity
- Partial credit threshold: [PLACEHOLDER] - test if 50% correct feels right for encouraging effort
- Drag sensitivity: [PLACEHOLDER] - test if immediate response vs slight delay feels better
- Animation duration: [PLACEHOLDER] - test if 0.3s feels natural for movement

## Dependencies
- Syllabus API for topic data
- XP system for progression
- Game header/footer UI components
- Drag-and-drop implementation (HTML5 or library)
- Sorting/reordering logic

---

# Core Game Design Document: Speed Round

## Purpose
To develop rapid knowledge access and pattern recognition under time pressure through high-tempo questioning.

## Player Experience Goal
The player should feel energized and focused, experiencing the thrill of quick thinking and the satisfaction of maintaining a streak.

## Player Fantasy
"I am a lightning-fast thinker who can instantly categorize information."

## Input
- Question presentation (topic + unit identification)
- Two option buttons for unit selection
- Timer visualization
- Streak and multiplier displays
- Option selection via click/tap

## Output
- Immediate correctness feedback
- Score increment with multiplier application
- Streak increment/reset
- Multiplier adjustment based on streak
- Timer decrement
- XP award at session end
- Progression to next question
- Session end when timer reaches zero

## Success Condition
Player maintains high accuracy and streak under time pressure demonstrating rapid knowledge access and application.

## Failure State
Player's accuracy drops significantly or streak repeatedly breaks indicating inability to maintain performance under pressure.

## Edge Cases
- What if user answers extremely quickly? → Ensure UI doesn't lag behind input
- What if user gets into a "zone" of high performance? → Allow streaks to build naturally
- What if user makes early mistake? → Provide encouragement that recovery is possible
- What if time runs out mid-question? → Count as incorrect attempt
- What if user achieves perfect session? → Award maximum possible XP

## Tuning Levers [PLACEHOLDER]
- Base points per correct answer: [PLACEHOLDER] - test if 10 feels right for pacing
- Multiplier increment: [PLACEHOLDER] - test if +0.5 feels right for reward acceleration
- Multiplier cap: [PLACEHOLDER] - test if 3.0 feels right to prevent runaway scores
- Streak reset on error: [PLACEHOLDER] - test if complete reset feels right vs gradual decay
- Time limit: [PLACEHOLDER] - test if 45 seconds creates right tension/skill balance
- Question source randomness: [PLACEHOLDER] - test if pure random vs weighted feels better

## Dependencies
- Syllabus API for topic data
- XP system for progression
- TimerBar component for time visualization
- Game header/footer UI components
- Streak and multiplier calculation logic

---

# Core Game Design Document: Boss Battle

## Purpose
To create engaging, narrative-driven knowledge application through boss fight mechanics that transform learning into an epic struggle.

## Player Experience Goal
The player should feel like a hero overcoming challenges, experiencing tension during struggle and triumph during victory.

## Player Fantasy
"I am a brave champion who defeats the forces of ignorance through knowledge and perseverance."

## Input
- Question presentation with topic identification
- Four option buttons for answer selection
- Timer for answer submission (optional)
- Visual feedback on boss/player status

## Output
- Boss HP change based on answer correctness (damage/heal)
- Visual boss reaction animations
- Player score increment
- XP award based on outcome (full for win, partial for loss)
- Boss defeat/victory animations
- Progression to next question
- Session end when boss defeated or player overwhelmed

## Success Condition
Player reduces boss HP to zero through correct answers demonstrating consistent knowledge application under pressure.

## Failure State
Boss HP reaches maximum due to incorrect answers indicating inability to maintain knowledge application.

## Edge Cases
- What if boss HP exceeds maximum due to healing? → Cap at maximum value
- What if boss HP reaches zero exactly? → Trigger victory sequence
- What if player answers very slowly? → Implement optional timeout for tension
- What if multiple bosses in sequence? → Implement boss progression with increasing difficulty
- What if player wants to flee battle? → Implement concession with reduced rewards

## Tuning Levers [PLACEHOLDER]
- Boss starting HP: [PLACEHOLDER] - test if 10 feels right for session length
- Boss max HP: [PLACEHOLDER] - test if equal to starting feels right vs allowing overheal
- Damage per correct answer: [PLACEHOLDER] - test if 1 feels right for pacing
- Healing per wrong answer: [PLACEHOLDER] - test if 1 feels right for penalty balance
- XP per correct answer: [PLACEHOLDER] - test if 20 feels right for effort/reward
- XP for loss: [PLACEHOLDER] - test if 50% of earned feels right to encourage effort
- Boss name variety: [PLACEHOLDER] - test if multiple bosses increases engagement
- Boss abilities: [PLACEHOLDER] - test if special attacks/defenses add meaningful depth

## Dependencies
- Syllabus API for topic data
- XP system for progression
- Game header/footer UI components
- Boss visualization and animation system
- Health bar implementation
- Victory/defeat sequencing logic

---