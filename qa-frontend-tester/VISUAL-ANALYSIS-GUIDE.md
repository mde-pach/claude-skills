# Visual Analysis Guide

## Comprehensive Methodology for Screenshot Analysis

This guide ensures critical visual issues are never missed by providing a systematic, layered approach to screenshot analysis.

---

## 🎯 Core Principle

**Analyze what IS visible, not what SHOULD be visible.**

Never assume or speculate about:
- States not shown (error, loading, empty)
- Different viewport sizes
- Interactions not captured
- Code implementation details

---

## 📊 Progressive Analysis Levels

Analyze in this order, each level building on the previous:

### Level 1: Structural Integrity (CRITICAL)
**Goal:** Identify broken rendering and container issues

**Scan for:**

1. **Container Boundary Issues**
   - ❌ Content overflowing beyond backgrounds
   - ❌ Background boxes smaller than their content
   - ❌ Elements "escaping" from parent containers
   - ❌ Partial backgrounds that cut off mid-content
   - ✅ All content properly contained within visible boundaries

2. **Layer/Z-Index Problems**
   - ❌ Elements incorrectly overlapping (unintentional)
   - ❌ Content appearing behind backgrounds
   - ❌ Modal/dialog content behind overlay
   - ✅ Proper stacking order (backdrop → modal → content)

3. **Shape Integrity**
   - ❌ Distorted or stretched components
   - ❌ Broken borders (incomplete, misaligned)
   - ❌ Irregular spacing that breaks grid
   - ✅ Clean, complete shapes and borders

**Visual Checklist:**
- [ ] Are all text elements on solid backgrounds?
- [ ] Do all cards/modals fully contain their content?
- [ ] Are borders/backgrounds the right size for content?
- [ ] Is the stacking order correct (no accidental overlap)?
- [ ] Do rounded corners appear complete?

**Example Issues:**
- Modal content extending beyond white card background
- Text appearing outside bordered areas
- Button half-visible outside its container
- Input field with no background underneath

---

### Level 2: Layout & Alignment (HIGH PRIORITY)
**Goal:** Ensure proper spatial organization

**Scan for:**

1. **Grid & Alignment**
   - Uneven columns or rows
   - Misaligned icons with text
   - Buttons at different heights
   - Inconsistent margins between similar elements
   - Broken flex/grid layouts

2. **Spacing Consistency**
   - Random gaps (some 8px, some 12px, some 20px)
   - Cramped elements (touching or too close)
   - Excessive whitespace in unexpected places
   - Inconsistent padding within similar components

3. **Visual Grouping**
   - Related items separated
   - Unrelated items grouped together
   - Unclear content boundaries
   - Missing visual separation

**Mental Test:**
Imagine a grid overlay on the screenshot:
- Do similar elements align to the same grid lines?
- Are there invisible alignment lines that connect elements?
- Would a user see clear visual groups?

---

### Level 3: Visual Polish (MEDIUM PRIORITY)
**Goal:** Ensure professional appearance

**Scan for:**

1. **Typography**
   - Text too small (< 16px body, < 14px critical)
   - Inconsistent font sizes for similar elements
   - Poor line-height (cramped or excessive)
   - Text truncation with "..."
   - Unintentional line breaks in short text

2. **Color & Contrast**
   - Text on background contrast < 4.5:1 (WCAG AA)
   - Disabled elements indistinguishable from enabled
   - Similar colors used for different purposes
   - Missing color feedback for states

3. **Visual Hierarchy**
   - All elements same visual weight
   - Primary action not obvious
   - Poor emphasis (everything bold or nothing bold)
   - Competing focal points

**Ask:**
- Where does my eye naturally go first?
- What's the most important element?
- Are there clear primary/secondary/tertiary levels?

---

### Level 4: UX & Usability (NICE TO HAVE)
**Goal:** Identify user experience improvements

**Scan for:**

1. **Interaction Clarity**
   - Unclear clickable areas (no hover indication visible)
   - Touch targets < 44x44px
   - Buttons that don't look like buttons
   - Missing focus indicators

2. **Information Quality**
   - Technical IDs shown instead of names
   - Missing context or labels
   - Unclear error messages
   - Poor information hierarchy

3. **Guidance & Feedback**
   - No indication of required fields
   - Missing loading states (when visible)
   - Unclear next steps
   - No validation feedback (when applicable)

---

## 🔍 Systematic Scanning Method

### Step 1: Outer → Inner Scan
1. **Viewport level**: Page structure, layout, main containers
2. **Section level**: Cards, panels, modals, major components
3. **Component level**: Individual buttons, inputs, text blocks
4. **Detail level**: Icons, badges, small text

### Step 2: Top → Bottom Scan
Follow natural reading order:
1. Header/navigation
2. Main content area
3. Sidebars (if any)
4. Footer
5. Floating elements (modals, tooltips)

### Step 3: Question-Based Analysis

For each component, ask:

**Structure:**
- Is this component fully visible and contained?
- Does it look "complete" or "broken"?
- Are there any rendering artifacts?

**Layout:**
- Is it aligned with nearby elements?
- Is spacing consistent with similar components?
- Does it fit in the overall layout grid?

**Visual:**
- Can I read all text easily?
- Are colors providing clear meaning?
- Is there a clear hierarchy?

**UX:**
- Would I know how to interact with this?
- Is important information visible and clear?
- Does it feel professional and polished?

---

## 🚨 Common Visual Bug Patterns

Learn to recognize these at a glance:

### Container Issues
```
❌ BROKEN:
┌─────────┐
│ Title   │
│ Content │══ (content overflows)
│ More    │══ (outside border)
└─────────┘

✅ CORRECT:
┌─────────────┐
│ Title       │
│ Content     │
│ More        │
└─────────────┘
```

### Alignment Issues
```
❌ BROKEN:
● Text item one
  ● Text item two (indented)
● Text item three

✅ CORRECT:
● Text item one
● Text item two
● Text item three
```

### Spacing Issues
```
❌ BROKEN:
[Button1][Button2]        [Button3]
        ↑ inconsistent gaps ↑

✅ CORRECT:
[Button1]  [Button2]  [Button3]
         ↑ consistent ↑
```

---

## 📝 Reporting Format

### For Critical Issues (Level 1-2)
```markdown
### N. [Brief description]
**Current**: [What's visibly wrong]
**Expected**: [What it should look like]
**Impact**: [Why this matters - "broken rendering" / "unusable" / etc.]
```

### For UX Improvements (Level 3-4)
```markdown
### N. [Brief description]
**Current**: [What's shown]
**Improvement**: [How it could be better]
**Benefit**: [User value - "easier to read" / "clearer action" / etc.]
```

---

## 🎨 Framework-Agnostic Analysis

**Don't think about:**
- Tailwind classes or CSS properties
- React components or DOM structure
- Implementation details

**Think about:**
- Visual appearance
- User perception
- Design principles
- Common UI patterns

**Example:**
- ❌ "The flex container has incorrect justify-content"
- ✅ "The buttons are misaligned horizontally"

---

## ✅ Analysis Checklist

Before reporting issues, verify:

- [ ] I've scanned all 4 levels progressively
- [ ] I've checked from outer containers to inner content
- [ ] I've followed top-to-bottom scan order
- [ ] I've identified the most critical issues first
- [ ] I'm describing visual problems, not code problems
- [ ] I'm only reporting what's visible in THIS screenshot
- [ ] I've separated critical bugs from UX improvements

---

## 🎯 Quality Markers

**Signs of Good Analysis:**
- Critical structural issues identified immediately
- Clear Current/Expected descriptions
- Issues prioritized by severity
- Concrete, specific observations
- No speculation about hidden states

**Signs of Missed Issues:**
- Jumping to minor polish before checking structure
- Assuming containers work when they don't
- Not noticing overflow/containment problems
- Focusing on colors before layout
- Missing obvious visual breaks

---

## 💡 Tips for Accuracy

1. **Take your time** - Don't rush to Level 4 before checking Level 1
2. **Trust your eyes** - If something looks wrong, it probably is
3. **Compare to expected patterns** - Modals should look like modals, cards like cards
4. **Look for patterns** - One alignment issue suggests checking all alignments
5. **Question everything** - "Is this element properly contained?" for every element

---

**Remember:** A missed container overflow (Level 1) is worse than 10 missed color tweaks (Level 3). Always prioritize structural integrity.
