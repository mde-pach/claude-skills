# Visual Analysis Quick Checklist

Use this checklist when analyzing screenshots to avoid missing critical issues.

## 🚨 LEVEL 1: Structural Integrity (MUST CHECK FIRST)

**Container Boundaries:**
- [ ] All content contained within visible backgrounds/borders?
- [ ] No content overflowing outside card/modal backgrounds?
- [ ] Background boxes match content size (not shrunk)?
- [ ] All text on solid backgrounds (not floating)?

**Visual Artifacts:**
- [ ] No elements incorrectly overlapping?
- [ ] Stacking order correct (backdrop → modal → content)?
- [ ] Borders complete and properly closed?
- [ ] No distorted or stretched components?

**If ANY Level 1 issue found → Report as CRITICAL before continuing**

---

## ⚠️ LEVEL 2: Layout & Alignment

**Grid & Alignment:**
- [ ] Similar elements aligned consistently?
- [ ] Icons aligned with text?
- [ ] Buttons at same height?
- [ ] Even columns/rows in grids?

**Spacing:**
- [ ] Consistent gaps between similar elements?
- [ ] No cramped areas (elements touching)?
- [ ] Padding consistent within component types?
- [ ] Clear visual grouping of related items?

---

## 💡 LEVEL 3: Visual Polish

**Typography:**
- [ ] Body text ≥ 16px, labels ≥ 14px?
- [ ] Proper line-height (not cramped)?
- [ ] Consistent font sizes for similar elements?
- [ ] No unintentional text truncation?

**Color & Contrast:**
- [ ] Text contrast ≥ 4.5:1 (WCAG AA)?
- [ ] Clear visual hierarchy (primary/secondary)?
- [ ] Disabled states visually distinct?

---

## ✨ LEVEL 4: UX Improvements

**Interaction:**
- [ ] Touch targets ≥ 44x44px?
- [ ] Clear primary action?
- [ ] Buttons look clickable?

**Information:**
- [ ] User-friendly labels (not technical IDs)?
- [ ] Important context visible?
- [ ] Clear next steps?

---

## 📊 Scan Pattern

1. **Outer → Inner**: Viewport → Sections → Components → Details
2. **Top → Bottom**: Header → Content → Footer → Floating elements
3. **Question-Based**: "Is this complete? Aligned? Readable? Clear?"

---

## 🎯 Reporting Priority

1. **CRITICAL**: Level 1 structural issues (broken rendering)
2. **HIGH**: Level 2 layout issues (misalignment, spacing)
3. **MEDIUM**: Level 3 visual polish (typography, contrast)
4. **LOW**: Level 4 UX improvements (nice-to-have enhancements)

---

**Before reporting:** Did I check Level 1 thoroughly? Container issues are the most critical and most easily missed.
