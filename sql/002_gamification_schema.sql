-- ============================================================
-- I'MU CORE — 002: Gamification schema (XP, levels, achievements, games, streaks)
-- Extends the base academic schema with Duolingo-style gamification.
-- ============================================================

-- ------------------------------------------------------------
-- 1. User gamification profile (extends profiles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_game_profile (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name        TEXT NOT NULL DEFAULT 'Scholar',
    avatar_url          TEXT,
    xp_total            INTEGER NOT NULL DEFAULT 0,
    xp_weekly           INTEGER NOT NULL DEFAULT 0,
    level               INTEGER NOT NULL DEFAULT 1,
    level_title         TEXT NOT NULL DEFAULT 'Novice',
    streak_days         INTEGER NOT NULL DEFAULT 0,
    longest_streak      INTEGER NOT NULL DEFAULT 0,
    last_active_date    DATE,
    total_study_minutes INTEGER NOT NULL DEFAULT 0,
    games_played        INTEGER NOT NULL DEFAULT 0,
    games_won           INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_user_game_profile_updated_at ON user_game_profile;
CREATE TRIGGER update_user_game_profile_updated_at BEFORE UPDATE ON user_game_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_game_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_full_access_game_profile" ON user_game_profile;
CREATE POLICY "owner_full_access_game_profile" ON user_game_profile
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. Level definitions (1-50, each with title, icon, XP threshold)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS level_definitions (
    level_number    INTEGER PRIMARY KEY,
    title           TEXT NOT NULL,
    icon            TEXT NOT NULL DEFAULT 'star',
    xp_required     INTEGER NOT NULL,
    color           TEXT NOT NULL DEFAULT '#2ABFBF',
    description     TEXT NOT NULL DEFAULT '',
    unlock_feature  TEXT
);

INSERT INTO level_definitions (level_number, title, icon, xp_required, color, description, unlock_feature) VALUES
(1,  'Novice',        'seed',      0,     '#94A3B8', 'Your journey begins', NULL),
(2,  'Learner',       'sprout',    100,   '#22C55E', 'Growing knowledge', 'Flashcard Games'),
(3,  'Student',       'book',      300,   '#3B82F6', 'Dedicated learner', 'Quiz Games'),
(4,  'Scholar',       'graduation',600,   '#8B5CF6', 'Academic excellence', 'Matching Games'),
(5,  'Expert',        'brain',     1000,  '#F59E0B', 'Deep understanding', 'Word Games'),
(6,  'Master',        'crown',     1500,  '#EF4444', 'Commanding knowledge', 'Puzzle Games'),
(7,  'Sage',          'lightbulb', 2200,  '#06B6D4', 'Wisdom earned', 'Timed Challenges'),
(8,  'Legend',         'trophy',    3000,  '#F97316', 'Legendary status', 'Boss Battles'),
(9,  'Myth',          'dragon',    4000,  '#A855F7', 'Beyond ordinary', 'All Games Unlocked'),
(10, 'IM-U Supreme',  'crown',     5000,  '#2ABFBF', 'The ultimate scholar', 'Custom Avatar');

-- ------------------------------------------------------------
-- 3. XP transaction log (every XP gain/loss)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xp_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount          INTEGER NOT NULL,
    source          TEXT NOT NULL,
    source_id       UUID,
    description     TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_full_access_xp_transactions" ON xp_transactions;
CREATE POLICY "owner_full_access_xp_transactions" ON xp_transactions
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. Achievements / badges
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    icon            TEXT NOT NULL DEFAULT 'medal',
    category        TEXT NOT NULL DEFAULT 'general',
    xp_reward       INTEGER NOT NULL DEFAULT 50,
    requirement     JSONB NOT NULL DEFAULT '{}'::jsonb,
    tier            TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'))
);

INSERT INTO achievement_definitions (slug, title, description, icon, category, xp_reward, tier, requirement) VALUES
('first-study',      'First Steps',       'Complete your first study session',      'boot',      'study', 25,  'bronze',   '{"study_sessions": 1}'),
('study-5',          'Getting Started',    'Complete 5 study sessions',              'fire',      'study', 50,  'bronze',   '{"study_sessions": 5}'),
('study-25',         'Dedicated',          'Complete 25 study sessions',             'flame',     'study', 100, 'silver',   '{"study_sessions": 25}'),
('study-100',        'Study Master',       'Complete 100 study sessions',            'volcano',   'study', 250, 'gold',     '{"study_sessions": 100}'),
('streak-3',         'On Fire',            '3-day study streak',                     'zap',       'streak', 30,  'bronze',   '{"streak_days": 3}'),
('streak-7',         'Week Warrior',       '7-day study streak',                     'swords',    'streak', 75,  'silver',   '{"streak_days": 7}'),
('streak-30',        'Unstoppable',        '30-day study streak',                    'shield',    'streak', 200, 'gold',     '{"streak_days": 30}'),
('xp-100',           'XP Collector',       'Earn 100 XP total',                      'coins',     'xp', 50,    'bronze',   '{"xp_total": 100}'),
('xp-500',           'XP Hunter',          'Earn 500 XP total',                      'gem',       'xp', 100,   'silver',   '{"xp_total": 500}'),
('xp-2000',          'XP Legend',          'Earn 2000 XP total',                     'diamond',   'xp', 300,   'gold',     '{"xp_total": 2000}'),
('game-first',       'Player One',         'Play your first game',                   'gamepad',   'game', 25,   'bronze',   '{"games_played": 1}'),
('game-10',          'Gamer',              'Play 10 games',                          'joystick',  'game', 75,   'silver',   '{"games_played": 10}'),
('game-50',          'Game Master',        'Play 50 games',                          'trophy',    'game', 200,  'gold',     '{"games_played": 50}'),
('perfect-score',    'Perfect!',           'Get 100% on any game',                   'star',      'game', 100,  'silver',   '{"perfect_game": true}'),
('speed-demon',      'Speed Demon',        'Complete a timed game under 30 seconds', 'timer',     'game', 75,   'bronze',   '{"speed_clear": true}'),
('topic-done',       'Topic Complete',     'Finish all topics in a unit',            'check',     'study', 100,  'silver',   '{"unit_complete": true}'),
('half-syllabus',    'Halfway There',      'Complete 50% of your syllabus',          'flag',      'study', 200,  'gold',     '{"syllabus_50_pct": true}'),
('full-syllabus',    'Syllabus Champion',  'Complete 100% of your syllabus',         'crown',     'study', 500,  'platinum', '{"syllabus_100_pct": true}');

-- ------------------------------------------------------------
-- 5. User earned achievements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_full_access_user_achievements" ON user_achievements;
CREATE POLICY "owner_full_access_user_achievements" ON user_achievements
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. Game sessions (log of every game played)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_type       TEXT NOT NULL,
    subject_id      UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_ids       UUID[] NOT NULL DEFAULT '{}',
    score           INTEGER NOT NULL DEFAULT 0,
    max_score       INTEGER NOT NULL DEFAULT 100,
    xp_earned       INTEGER NOT NULL DEFAULT 0,
    time_spent_sec  INTEGER NOT NULL DEFAULT 0,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    perfect         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id, created_at DESC);
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_full_access_game_sessions" ON game_sessions;
CREATE POLICY "owner_full_access_game_sessions" ON game_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. Daily challenges (auto-generated each day)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    challenge_type  TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    xp_reward       INTEGER NOT NULL DEFAULT 50,
    target_value    INTEGER NOT NULL DEFAULT 1,
    current_value   INTEGER NOT NULL DEFAULT 0,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    claimed         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, challenge_date, challenge_type)
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_full_access_daily_challenges" ON daily_challenges;
CREATE POLICY "owner_full_access_daily_challenges" ON daily_challenges
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 8. Game type definitions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    icon            TEXT NOT NULL DEFAULT 'gamepad',
    min_level       INTEGER NOT NULL DEFAULT 1,
    xp_per_play     INTEGER NOT NULL DEFAULT 10,
    xp_bonus_perfect INTEGER NOT NULL DEFAULT 25,
    is_timed        BOOLEAN NOT NULL DEFAULT FALSE,
    time_limit_sec  INTEGER,
    color           TEXT NOT NULL DEFAULT '#2ABFBF'
);

INSERT INTO game_types (slug, title, description, icon, min_level, xp_per_play, xp_bonus_perfect, is_timed, time_limit_sec, color) VALUES
('flashcard',   'Flashcard Master',   'Flip cards to memorize key concepts',  'layers',    2, 10, 25, FALSE, NULL,  '#3B82F6'),
('quiz',        'Quick Quiz',         'Test your knowledge with MCQs',        'help-circle', 3, 15, 30, TRUE,  60,  '#8B5CF6'),
('match',       'Match Pairs',        'Connect related concepts',            'link',      4, 15, 35, TRUE,  90,  '#F59E0B'),
('wordsearch',  'Word Explorer',      'Find hidden academic terms',          'search',    5, 20, 40, TRUE, 120,  '#EF4444'),
('puzzle',      'Knowledge Puzzle',   'Arrange pieces in the right order',   'puzzle',    6, 20, 40, FALSE, NULL, '#06B6D4'),
('speedround',  'Speed Round',        'Answer as many as you can in time',   'zap',       7, 25, 50, TRUE,  45,  '#F97316'),
('bossbattle',  'Boss Battle',        'Face the ultimate challenge',         'swords',    8, 50, 100, TRUE, 180, '#A855F7');

-- ------------------------------------------------------------
-- 9. Helper: calculate level from XP
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_level(p_xp INTEGER)
RETURNS TABLE(level INTEGER, title TEXT, xp_in_level INTEGER, xp_for_next INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ld.level_number,
        ld.title,
        p_xp - ld.xp_required AS xp_in_level,
        COALESCE((SELECT MIN(ld2.xp_required) FROM level_definitions ld2 WHERE ld2.xp_required > p_xp), ld.xp_required) - ld.xp_required AS xp_for_next
    FROM level_definitions ld
    WHERE ld.xp_required <= p_xp
    ORDER BY ld.level_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 10. Helper: award XP and check level up
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source TEXT,
    p_source_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_old_level INTEGER;
    v_result JSONB;
BEGIN
    -- Get old level
    SELECT level INTO v_old_level FROM user_game_profile WHERE user_id = p_user_id;

    -- Insert XP transaction
    INSERT INTO xp_transactions (user_id, amount, source, source_id, description)
    VALUES (p_user_id, p_amount, p_source, p_source_id, p_description);

    -- Update total XP
    UPDATE user_game_profile
    SET xp_total = xp_total + p_amount,
        xp_weekly = xp_weekly + p_amount
    WHERE user_id = p_user_id
    RETURNING xp_total INTO v_new_xp;

    -- Calculate new level
    SELECT level INTO v_new_level FROM calculate_level(v_new_xp);

    -- Update level if changed
    IF v_new_level > v_old_level THEN
        UPDATE user_game_profile
        SET level = v_new_level,
            level_title = (SELECT title FROM level_definitions WHERE level_number = v_new_level)
        WHERE user_id = p_user_id;
    END IF;

    v_result := jsonb_build_object(
        'xp_earned', p_amount,
        'total_xp', v_new_xp,
        'new_level', v_new_level,
        'level_up', v_new_level > v_old_level
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
