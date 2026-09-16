# Game Design Analysis - Existing Games

## Overview
Analysis of existing games in the IMU-CORE platform against Game Design principles from the GameDesigner agent personality.

## Design Principles Reference
From the GameDesigner agent:
- Design from player motivation outward, not feature list inward
- Every system must answer: "What does the player feel? What decision are they making?"
- Never add complexity that doesn't add meaningful choice
- All numerical values start as hypotheses — mark them [PLACEHOLDER] until playtested
- Build tuning spreadsheets alongside design docs, not after
- Define "broken" before playtesting — know what failure looks like so you recognize it

## Core Game Design Documents Needed For Each Game:
1. Purpose - Why this mechanic exists in the game
2. Player Fantasy - What power/emotion this delivers
3. Input - [Button / trigger / timer / event]
4. Output - [State change / resource change / world change]
5. Success Condition - What "working correctly" looks like
6. Failure State - What happens when it goes wrong
7. Edge Cases
8. Tuning Levers - [List of variables that control feel/balance]
9. Dependencies - [Other systems this touches]

## Analysis of Existing Games

### 1. FlashcardGame
**Current Implementation**: Card flipping game where users see a term and tap to reveal definition, then mark as correct/incorrect

**Player Motivation Analysis**:
- What does the player feel? Satisfaction from recalling information, frustration when forgetting
- What decision are they making? Whether they know the definition before flipping

**Core Loop**:
Moment-to-moment: See term → Decide if you know it → Flip to check → Mark correct/incorrect
Session: Complete set of cards → Get XP reward → Feel accomplishment
Long-term: Build knowledge mastery over multiple sessions

**Design Gaps**:
- Limited meaningful choice (only binary correct/incorrect)
- Minimal feedback beyond correct/incorrect
- No progression within a session
- No risk/reward system

**Tuning Levers Currently**: None marked as [PLACEHOLDER]
- XP per play: 10
- XP bonus perfect: 20

### 2. QuizGame
**Current Implementation**: Multiple choice quiz with timer, 4 options per question

**Player Motivation Analysis**:
- What does the player feel? Pressure from timer, satisfaction from correct answers
- What decision they're making? Which option is correct

**Core Loop**:
Moment-to-moment: Read question → Evaluate options → Select answer → Get feedback
Session: Answer questions under time pressure → Get XP based on performance
Long-term: Improve knowledge retention and recall speed

**Design Gaps**:
- Limited to factual recall questions only
- No partial credit for near-correct answers
- No lifelines or strategic elements
- Feedback is immediate but basic

**Tuning Levers Currently**: None marked as [PLACEHOLDER]
- XP per play: 15
- XP bonus perfect: 25
- Time limit: 60 seconds

### 3. MatchGame
**Current Implementation**: Memory matching game pairing terms with definitions

**Player Motivation Analysis**:
- What does the player feel? Satisfaction from making matches, frustration from forgetting locations
- What decision they're making? Which card to flip next based on memory

**Core Loop**:
Moment-to-moment: Flip first card → Remember location → Flip second card hoping for match → Get feedback
Session: Clear all pairs → Get XP reward
Long-term: Improve visual memory and association skills

**Design Gaps**:
- Pure memory game with no knowledge application
- No way to leverage subject knowledge to improve performance
- Limited strategic depth

**Tuning Levers Currently**: None marked as [PLACEHOLDER]
- XP per play: 20
- XP bonus perfect: 30

### 4. WordSearchGame
**Current Implementation**: Find words in a letter grid by selecting adjacent letters

**Player Motivation Analysis**:
- What does the player feel? Satisfaction from pattern recognition, frustration when stuck
- What decision they're making? Which path to trace for potential words

**Core Loop**:
Moment-to-moment: Select starting letter → Extend path to form word → Check if valid → Get feedback
Session: Find all words → Get XP reward
Long-term: Improve pattern recognition and vocabulary scanning

**Design Gaps**:
- No hints when stuck
- No thematic grouping of words
- No time pressure modes for variety
- Linear progression only

**Tuning Levers Currently**: None marked as [PLACEHOLDER]
- XP per play: 25 (implied from scoring)
- Grid size: 8x8 (hardcoded)

### 5. PuzzleGame
**Current Implementation**: Drag-and-drop ordering puzzle to sequence topics correctly

**Player Motivation Analysis**:
- What does the player feel? Satisfaction from logical ordering, frustration when unsure
- What decision they're making? Which item to move and where

**Core Loop**:
Moment-to-moment: Select item → Drag to new position → Assess if order seems correct → Get feedback on submit
Session: Order all items correctly → Get XP based on accuracy
Long-term: Improve understanding of sequential relationships and hierarchies

**Design Gaps**:
- Only one puzzle type (sequencing)
- No hint system
- No partial feedback during gameplay
- Fixed number of items (6)

**Tuning Levers Currently**: None marked as [PLACEHOLDER]
- XP per play: 20 per correct item
- Number of items: 6

### 6. SpeedRoundGame
**Current Implementation**: Rapid-fire questions about units/topics with streak multiplier system

**Player Motivation Analysis**:
- What does the player feel? Excitement from speed, satisfaction from streaks, frustration from mistakes
- What decision they're making? Quick recognition of correct category

**Core Loop**:
Moment-to-moment: See topic → Identify unit → Select answer → Get immediate feedback → Continue
Session: Answer as many as possible in time limit → Get XP based on score and streak
Long-term: Improve quick recognition and categorization skills

**Design Gaps**:
- Limited to unit identification only
- Streak resets completely on any mistake
- No variety in question types
- Fixed time limit

**Tuning Levers Currently**: Some present but not marked as [PLACEHOLDER]
- Base points: 10
- Multiplier increase: +0.5 per correct (max 3.0)
- Time limit: 45 seconds

### 7. BossBattleGame
**Current Implementation**: Turn-based battle where correct answers damage boss, wrong answers heal boss

**Player Motivation Analysis**:
- What does the player feel? Empowerment when damaging boss, tension when boss heals, satisfaction from victory
- What decision they're making? Which answer is correct to defeat the boss

**Core Loop**:
Moment-to-moment: See question → Select answer → Boss HP changes based on correctness → Continue
Session: Reduce boss HP to 0 before it reaches max → Get XP based on victory
Long-term: Develop persistence and consistent knowledge application

**Design Gaps**:
- Only one boss type
- Boss mechanics are simple (just HP)
- No special abilities or phases for boss
- No player power-ups or special moves

**Tuning Levers Currently**: Some present but not marked as [PLACEHOLDER]
- Boss starting HP: 10
- Damage per correct answer: 1
- Healing per wrong answer: 1 (capped at max HP)
- XP per correct answer: 20
- XP penalty for loss: 50%

## Summary of Common Issues Across Games:
1. Lack of documented [PLACEHOLDER] values for tuning
2. Limited meaningful choices beyond basic correctness
3. Minimal progression systems within individual game sessions
4. Basic feedback systems (correct/incorrect only)
5. No documented player fantasies or core purpose statements
6. Limited variety in question/mechanic types within each game
7. No strategic depth or resource management elements
8. Missing onboarding/tutorial sequences
9. No escalating difficulty or adaptive challenge systems
10. Limited emotional engagement beyond basic satisfaction/frustration

## Recommendations for Improvement:
1. Add [PLACEHOLDER] markings to all tuning values with rationale
2. Enhance feedback systems with graduated responses
3. Add meaningful choices and strategic elements
4. Implement progression systems within game sessions
5. Document core loops, player fantasies, and purpose for each game
6. Add variety in question types and mechanics
7. Implement adaptive difficulty systems
8. Add proper onboarding experiences
9. Create tuning spreadsheets for balance
10. Define clear success/failure states with emotional impact