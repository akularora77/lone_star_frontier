# Lone Star Frontier - Style Guide (v1.0)

## 1. Visual Aesthetic: "Modern Parchment"
The goal is to blend the rugged, weathered feel of the 1870s American West with the functional clarity of a modern RPG.

### Color Palette
- **Primary Background:** `#F4EBD0` (Weathered Paper/Parchment)
- **Primary Accent:** `#8B4513` (Saddle Brown)
- **Secondary Accent:** `#D4AF37` (Dusty Gold)
- **Text (Body):** `#2F2F2F` (Charcoal / Faded Ink)
- **UI Borders:** `#5D4037` (Dark Wood / Iron)
- **Stamina Bar:** `#2E7D32` (Forest Green) -> `#C62828` (Deep Red) when low.
- **XP Bar:** `#1565C0` (Sky Blue)

### Typography
- **Headers:** Serif font (e.g., 'Playfair Display' or 'Rye'). Bold, rugged, and authoritative.
- **Body/UI:** Monospace or clean Serif (e.g., 'Roboto Mono' or 'Crimson Text'). High legibility for lore and stats.

## 2. Component Architecture
Lovable should implement these key UI sections:

### A. The Sidebar (RuneScape-Style)
- **Location:** Fixed to the Right side of the screen.
- **Top Section:** Player Stats (HP, Stamina, Mining Level, XP). Use progress bars.
- **Middle Section:** Inventory Grid (4x7 or similar). Show icons for ores, pickaxes, and badges.
- **Bottom Section:** Active Badge slot and Gold balance.

### B. The World Viewport
- **Location:** Central area.
- **Function:** Displays the current location (Boomtown districts or Mine levels).
- **Navigation:** Clear buttons or a clickable map to move between:
    - Saloon (Onboarding)
    - Mining Quarter (General Store + Mine Entrance)
    - Mine Levels (1-10)

### C. The Dialogue HUD
- **Location:** Bottom-anchored overlay.
- **Design:** Large portrait of the NPC on the left, scrolling text on the right.
- **Interactive Elements:** Prompt buttons for the player to respond or initiate trade.

## 3. Asset Placeholders (v1.0)
Since we are in a spec-driven phase, use CSS-based shapes or generic icons for:
- **Ores:** Colored circles/gems matching the tier (Copper, Iron, Silver, Gold, Mithril/Quartz).
- **Pickaxes:** Simple silhouettes.
- **Badges:** Star-shaped SVG icons.

## 4. UI Feedback & Animations
- **Mining Action:** A simple progress bar or "shaking" effect on the ore icon.
- **XP Gain:** Floating text (e.g., "+15 XP") that fades upward.
- **Stamina Toggle:** Visual toggle for "Walk" vs. "Run".
