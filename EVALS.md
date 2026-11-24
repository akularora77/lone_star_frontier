# Lone Star Frontier - Evaluation Blueprint (v1.1)

## 1. Deterministic Component Evals
These tests ensure the core game mechanics and data integrity are functioning correctly.

- **JSON Schema Validity:** Validate that all API responses (from Lovable and Replit) strictly adhere to the defined JSON schemas.
- **Hard Price Bounds Enforcement:** Verify that the `get_store_quote` tool never returns a price outside the `[0.7 * base, 1.3 * base]` range, regardless of LLM input.
- **Inventory & Gold Integrity:** Test that `execute_trade` correctly increments/decrements player gold and inventory counts without math errors or race conditions.
- **Level Access Logic:** Ensure players cannot mine in levels for which they lack the required Mining Level or Pickaxe Tier.

## 2. Semantic LLM-as-a-Judge Evals
These tests evaluate the quality and safety of AI NPC interactions.

- **Dynamic Pricing Fairness:** 
  - **Goal:** LLM-as-a-Judge verifies that the price offered by the General Store Manager reflects the player's `rapport_score`.
  - **Metric:** Higher rapport should correlate with better prices (within guardrails).
- **Persona Consistency:** 
  - **Goal:** Ensure NPCs maintain their Wild West persona (accents, vocabulary, attitude).
  - **Metric:** Pass/Fail based on persona guidelines.
- **Zero-Hallucination Grounding (Lore Leakage):**
  - **Goal:** Townspeople must not mention features from the v2.0+ backlog (bounties, horses, monsters).
  - **Metric:** Pass if no v2.0+ keywords or concepts are present in dialogue.

## 3. Calibration & Regression Gate
- **Golden Test Set:** A curated collection of 50+ prompt/response pairs for NPC dialogue and pricing requests.
- **Pass/Fail Thresholds:**
  - Deterministic Evals: **100% Pass** required.
  - Semantic Evals (Pricing/Persona): **>= 90% Pass** required.
  - Zero-Hallucination: **100% Pass** required.
- **Promotion Rule:** No changes to prompts, models, or core game versions can be merged to `main` without passing the v1.1 Eval Suite.
