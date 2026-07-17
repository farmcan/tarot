# MiaoTarot Full Deck Expansion

Date: 2026-07-16

## Scope

A standard Tarot deck has 78 cards:

- 22 Major Arcana: major life patterns and turning points;
- 56 Minor Arcana: four suits, each with Ace through Ten plus Page, Knight,
  Queen, and King.

The product now keeps `classic-major` as a focused, backward-compatible 22-card
deck and adds `doodle-full` as a standard 78-card content pack. The full pack has
complete cat copy and breed-family mappings for all 56 Minor Arcana cards; its
Minor illustrations currently use the bundled Rider-Waite references until each
custom image is promoted through the content-pack asset workflow.

## Miao Suit Grammar

| Suit | Traditional element | Miao domain | Recurring visual objects | Meme energy |
| --- | --- | --- | --- | --- |
| Wands | Fire | action, appetite, conflict, creative drive | teaser wand, scratching post, laser dot | zoomies, attack, performance |
| Cups | Water | feelings, relationships, attachment, intuition | bowls, water glasses, soft beds |贴贴, crying, comfort, social reaction |
| Swords | Air | thought, judgment, conflict, anxiety, truth | claw marks, blinds, sharp shadows | Huh Cat, Smudge, suspicious stare |
| Pentacles | Earth | money, work, body, home, routine | treats, coins, boxes, keyboards | loafing, guarding, working, collecting |

## Number Grammar

The number supplies a stable dramatic function across every suit:

| Rank | Function | Cat translation |
| --- | --- | --- |
| Ace | seed / opportunity | first sight of the dot, bowl, thought, or treat |
| Two | polarity / choice | two doors, two bowls, approach or retreat |
| Three | growth / collaboration | the group chat has become a pile of cats |
| Four | stability / pause | claiming one square and refusing to move |
| Five | disruption / lack | the bowl is empty and everybody has opinions |
| Six | recovery / exchange | help, recognition, or passage to a calmer room |
| Seven | test / strategy | too many options, defensive high ground, sneaking |
| Eight | movement / mastery / constraint | repetition, fast motion, or being stuck in a loop |
| Nine | culmination / resilience | almost there, but the nervous system has notes |
| Ten | completion / overload / legacy | the whole household, the whole burden, the full result |
| Page | curious learner / message | kitten discovers the object and reports loudly |
| Knight | pursuit / motion | commits to one energy with no moderate setting |
| Queen | internal mastery / care | controls the atmosphere without needing applause |
| King | external mastery / responsibility | sets the rules and owns the consequences |

## Rollout Boundary

1. Keep the 22-card experience available as `classic-major`.
2. Register the 56-card data contract and copy matrix in `doodle-full`.
3. Allow mixed 78-card readings with explicit standard-art fallback.
4. Replace Minor fallback images suit by suit without changing the reading,
   sharing, or history contracts.

Recommended pilot: Cups. Relationship and emotion memes are the easiest for users
to understand, and the suit can validate whether repeated mother-image families
still feel varied across fourteen cards.

## Compatibility

Major Arcana ids and `major-arcana-v1` records remain unchanged. Minor content is
additive and gets its own edition. Saved readings retain the deck edition so an
old 22-card result can always be reconstructed after the full deck launches.
