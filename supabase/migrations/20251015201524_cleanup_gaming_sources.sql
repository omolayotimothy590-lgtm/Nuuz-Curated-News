/*
  # Emergency Gaming Category Cleanup

  1. Purpose
    - Remove all non-gaming sources from gaming category
    - Keep only whitelisted gaming sources

  2. Whitelisted Gaming Sources
    - Kotaku, Nintendo Life, Polygon, Rock Paper Shotgun
    - VG247, GameSpot, IGN, PC Gamer, Eurogamer
    - Destructoid, GamesRadar, Game Informer, GameRant
    - Xbox News, Reddit Gaming

  3. Action
    - Delete articles in gaming category from non-whitelisted sources
    - This prevents NY Times, sports sites, etc. from appearing in Gaming
*/

-- Delete all non-gaming sources from gaming category
DELETE FROM articles
WHERE category = 'gaming'
AND LOWER(source) NOT SIMILAR TO '%(kotaku|nintendo life|polygon|rock paper shotgun|vg247|gamespot|ign|pc gamer|eurogamer|destructoid|gamesradar|game informer|gamerant|xbox news|reddit gaming)%';

-- Verify cleanup by checking remaining sources
-- Run manually to verify: SELECT source, COUNT(*) FROM articles WHERE category = 'gaming' GROUP BY source;
