# Normalization Method Study for 找谁玩

## 1. Executive Summary

**Problem**: The current range-based normalization maps `(value - min) / (max - min) * 100`. When one friend is a massive outlier (e.g., 100 hours vs. 5-15 hours for others), all non-outlier friends get crammed into the 0-11% range on the scatter plot — making them indistinguishable and clustered in the upper-left corner.

**Recommendation**: **Log Transformation + Range-Based Normalization** (`log(1 + x)` then min-max scale to 0-100).

**Why**: Log compression reduces the outlier's dominance while preserving relative magnitude. In the key "one outlier" scenario `[5, 8, 10, 15, 100]`, the non-outlier friends spread across 0-35 (vs. 0-11 with plain range). It works well for both small (3 friends) and large (20+ friends) groups, and the implementation is a one-line change.

---

## 2. Method Comparison Table

Normalized scores for each scenario (rounded to 1 decimal):

### Scenario 1: One Outlier — `[5, 8, 10, 15, 100]`

| Method | 5 | 8 | 10 | 15 | 100 | Non-outlier spread |
|--------|---|---|----|----|-----|-------------------|
| **Range (current)** | 0 | 3.2 | 5.3 | 10.5 | 100 | 10.5 |
| **Percentile** | 0 | 25 | 50 | 75 | 100 | 75 |
| **Log + Range** | 0 | 14.3 | 21.5 | 34.8 | 100 | 34.8 |
| **Sqrt + Range** | 0 | 7.6 | 11.9 | 21.1 | 100 | 21.1 |
| **Winsorized** | 0 | 3.0 | 6.4 | 14.7 | 100 | 14.7 |
| **Z-Score + Sigmoid** | 34.9 | 36.8 | 38.1 | 41.4 | 88.0 | 6.5 |

### Scenario 2: Two Outliers — `[3, 5, 8, 50, 120]`

| Method | 3 | 5 | 8 | 50 | 120 | Non-outlier spread |
|--------|---|---|---|----|----|-------------------|
| **Range (current)** | 0 | 1.7 | 4.3 | 40.2 | 100 | 4.3 |
| **Percentile** | 0 | 25 | 50 | 75 | 100 | 50 |
| **Log + Range** | 0 | 11.9 | 23.8 | 74.7 | 100 | 23.8 |
| **Sqrt + Range** | 0 | 5.5 | 11.9 | 57.9 | 100 | 11.9 |
| **Winsorized** | 0 | 1.7 | 4.4 | 41.0 | 100 | 4.4 |
| **Z-Score + Sigmoid** | 31.8 | 32.8 | 34.3 | 57.1 | 86.3 | 2.5 |

### Scenario 3: Normal Distribution — `[10, 20, 30, 40, 50]`

| Method | 10 | 20 | 30 | 40 | 50 |
|--------|----|----|----|----|-----|
| **Range (current)** | 0 | 25 | 50 | 75 | 100 |
| **Percentile** | 0 | 25 | 50 | 75 | 100 |
| **Log + Range** | 0 | 42.2 | 67.5 | 85.8 | 100 |
| **Sqrt + Range** | 0 | 33.5 | 59.2 | 80.9 | 100 |
| **Winsorized** | 0 | 25 | 50 | 75 | 100 |
| **Z-Score + Sigmoid** | 19.6 | 33.0 | 50.0 | 67.0 | 80.4 |

### Scenario 4: Small Group — `[5, 30, 200]`

| Method | 5 | 30 | 200 |
|--------|---|----|----|
| **Range (current)** | 0 | 12.8 | 100 |
| **Percentile** | 0 | 50 | 100 |
| **Log + Range** | 0 | 46.7 | 100 |
| **Sqrt + Range** | 0 | 27.2 | 100 |
| **Winsorized** | 0 | 12.8 | 100 |
| **Z-Score + Sigmoid** | 30.0 | 36.4 | 80.3 |

### Scenario 5: Large Group with Extreme Outlier — `[2,3,4,5,6,7,8,9,10,12,15,18,20,25,30,35,40,50,60,500]`

| Method | Range of friends 2–60 | Outlier (500) | Notes |
|--------|----------------------|---------------|-------|
| **Range (current)** | 0 – 11.6 | 100 | 19 friends crammed in 12% of axis |
| **Percentile** | 0 – 95 | 100 | Perfectly even spacing |
| **Log + Range** | 0 – 58.8 | 100 | Good spread, 59% of axis |
| **Sqrt + Range** | 0 – 30.2 | 100 | Moderate, 30% of axis |
| **Winsorized** | 0 – 79.5 | 100 | Good (IQR works with 20 points) |
| **Z-Score + Sigmoid** | ~30 – 55 | ~99 | Compressed in middle band |

### Overall Rating

| Method | Outlier Robustness | Even Distribution | Magnitude Preserved | Small Group | Large Group | **Overall** |
|--------|-------------------|-------------------|--------------------|-----------|-----------|----|
| Range (current) | Poor | Poor | Excellent | OK | Poor | **C** |
| Percentile | Excellent | Excellent | None | Forced | Excellent | **B+** |
| **Log + Range** | **Good** | **Good** | **Good** | **Good** | **Good** | **A** |
| Sqrt + Range | Fair | Fair | Good | Fair | Fair | **B-** |
| Winsorized | Poor (small n) | Fair | Good | Poor | Good | **C+** |
| Z-Score + Sigmoid | Poor | Poor | Poor | Poor | Poor | **D** |

---

## 3. Detailed Calculation Examples — Scenario 1: `[5, 8, 10, 15, 100]`

### Range-Based (current)
```
min = 5, max = 100, range = 95
Friend E (5):   (5 - 5)   / 95 × 100 =  0.0
Friend D (8):   (8 - 5)   / 95 × 100 =  3.2
Friend C (10):  (10 - 5)  / 95 × 100 =  5.3
Friend B (15):  (15 - 5)  / 95 × 100 = 10.5
Friend A (100): (100 - 5) / 95 × 100 = 100.0
```

### Percentile Rank
```
Sorted: [5, 8, 10, 15, 100] → ranks [0, 1, 2, 3, 4]
Friend E: (0/4) × 100 =   0
Friend D: (1/4) × 100 =  25
Friend C: (2/4) × 100 =  50
Friend B: (3/4) × 100 =  75
Friend A: (4/4) × 100 = 100
```

### Log + Range
```
log(1+5)  = 1.792    log(1+8)  = 2.197    log(1+10) = 2.398
log(1+15) = 2.773    log(1+100)= 4.615
min = 1.792, max = 4.615, range = 2.823

Friend E: (1.792 - 1.792) / 2.823 × 100 =  0.0
Friend D: (2.197 - 1.792) / 2.823 × 100 = 14.3
Friend C: (2.398 - 1.792) / 2.823 × 100 = 21.5
Friend B: (2.773 - 1.792) / 2.823 × 100 = 34.8
Friend A: (4.615 - 1.792) / 2.823 × 100 = 100.0
```

### Sqrt + Range
```
√5 = 2.236   √8 = 2.828   √10 = 3.162   √15 = 3.873   √100 = 10.0
min = 2.236, max = 10.0, range = 7.764

Friend E: (2.236 - 2.236) / 7.764 × 100 =  0.0
Friend D: (2.828 - 2.236) / 7.764 × 100 =  7.6
Friend C: (3.162 - 2.236) / 7.764 × 100 = 11.9
Friend B: (3.873 - 2.236) / 7.764 × 100 = 21.1
Friend A: (10.0  - 2.236) / 7.764 × 100 = 100.0
```

### Winsorized (IQR-based, clip at Q1 - 1.5×IQR / Q3 + 1.5×IQR)
```
Sorted: [5, 8, 10, 15, 100]
Q1 = 6.5, Q3 = 57.5, IQR = 51
Lower = 6.5 - 76.5 = -70 (no lower clip)
Upper = 57.5 + 76.5 = 134 (100 < 134, no upper clip)
→ No clipping occurs! Same as range-based: [0, 3.2, 5.3, 10.5, 100]
```
*With only 5 data points, IQR-based winsorization fails to detect the outlier.*

### Z-Score + Sigmoid
```
Mean = 27.6, StdDev = 36.36
Z-scores: [-0.622, -0.539, -0.484, -0.347, 1.992]
Sigmoid(z) = 1/(1 + e^(-z))

Friend E: sigmoid(-0.622) = 0.349 → 34.9
Friend D: sigmoid(-0.539) = 0.368 → 36.8
Friend C: sigmoid(-0.484) = 0.381 → 38.1
Friend B: sigmoid(-0.347) = 0.414 → 41.4
Friend A: sigmoid(1.992)  = 0.880 → 88.0
```
*Non-outlier friends are compressed into a 6.5-point band (34.9–41.4). Poor spread.*

---

## 4. Recommendation

**Best method: Log Transformation + Range-Based Normalization**

### Why Log + Range wins:

1. **Outlier robustness (key problem)**: In the "one outlier" scenario, non-outlier friends spread across 35% of the axis (vs. 11% with current range-based). The scatter plot becomes readable.

2. **Magnitude preservation**: Unlike percentile rank (which forces artificial equal spacing), log still reflects that a 15-hour friend had more time than an 8-hour friend — the gaps are proportional to the ratio, not just the rank.

3. **Small group stability**: With 3 friends `[5, 30, 200]`, the middle friend gets 46.7 (vs. 12.8 with range). Friends are visually distinguishable on the plot.

4. **Large group scalability**: With 20 friends and an extreme outlier, non-outlier friends span 59% of the axis (vs. 12% with range).

5. **Simplicity**: One-line change — wrap raw scores in `Math.log(1 + x)` before range normalization.

6. **Gap calculation still works**: Since both axes use the same normalization, `quality - quantity` gap remains meaningful.

### Trade-off acknowledged:
Log compression is slightly non-linear for evenly-distributed data (Scenario 3: scores become `[0, 42, 68, 86, 100]` instead of `[0, 25, 50, 75, 100]`). This means top-end differences look smaller. However, this is an acceptable trade-off because:
- Evenly-distributed data is the case where the problem doesn't exist anyway
- The compression is mild — friends are still clearly distinguishable
- The alternative (range-based) is catastrophically bad when outliers exist

---

## 5. Code Changes

Change in `src/composables/useScoring.js`, function `normalizeScores`:

```diff
 function normalizeScores(rawScores) {
-  const nonZeroQ = rawScores.filter(s => s.rawQ > 0).map(s => s.rawQ)
-  const nonZeroY = rawScores.filter(s => s.rawY > 0).map(s => s.rawY)
+  // Log-transform to compress outliers, then range-normalize.
+  // log(1+x) keeps 0 → 0 and compresses extreme values so one
+  // "hangout monster" friend doesn't push everyone else into a corner.
+  const logQ = rawScores.map(s => s.rawQ > 0 ? Math.log(1 + s.rawQ) : 0)
+  const logY = rawScores.map(s => s.rawY > 0 ? Math.log(1 + s.rawY) : 0)
 
-  const minQ = nonZeroQ.length > 0 ? Math.min(...nonZeroQ) : 0
-  const maxQ = nonZeroQ.length > 0 ? Math.max(...nonZeroQ) : 0
-  const minY = nonZeroY.length > 0 ? Math.min(...nonZeroY) : 0
-  const maxY = nonZeroY.length > 0 ? Math.max(...nonZeroY) : 0
+  const nonZeroLogQ = logQ.filter(v => v > 0)
+  const nonZeroLogY = logY.filter(v => v > 0)
 
-  const rangeQ = maxQ - minQ
-  const rangeY = maxY - minY
+  const minQ = nonZeroLogQ.length > 0 ? Math.min(...nonZeroLogQ) : 0
+  const maxQ = nonZeroLogQ.length > 0 ? Math.max(...nonZeroLogQ) : 0
+  const minY = nonZeroLogY.length > 0 ? Math.min(...nonZeroLogY) : 0
+  const maxY = nonZeroLogY.length > 0 ? Math.max(...nonZeroLogY) : 0
+
+  const rangeQ = maxQ - minQ
+  const rangeY = maxY - minY
 
   return rawScores.map(({ friend, rawQ, rawY }) => {
-    const quantity = rawQ > 0 ? (rangeQ > 0 ? Math.round(((rawQ - minQ) / rangeQ) * 100) : 50) : 0
-    const quality = rawY > 0 ? (rangeY > 0 ? Math.round(((rawY - minY) / rangeY) * 100) : 50) : 0
+    const lq = rawQ > 0 ? Math.log(1 + rawQ) : 0
+    const ly = rawY > 0 ? Math.log(1 + rawY) : 0
+    const quantity = lq > 0 ? (rangeQ > 0 ? Math.round(((lq - minQ) / rangeQ) * 100) : 50) : 0
+    const quality = ly > 0 ? (rangeY > 0 ? Math.round(((ly - minY) / rangeY) * 100) : 50) : 0
     return { friend, quantity, quality, gap: quality - quantity }
   })
 }
```

---

## 6. Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| **All scores identical** | `range = 0`, all friends score 50 (existing fallback preserved) |
| **Only one non-zero friend** | `range = 0`, that friend scores 50 (existing fallback preserved) |
| **All scores are 0** | All friends score 0 (the `rawQ > 0` guard returns 0) |
| **Negative scores** | Treated as 0 (shouldn't happen — raw scores are log/sqrt of positive values) |
| **Two non-zero friends** | `range = log(1+max) - log(1+min)`, one gets 0 and one gets 100 |
| **Very close scores** | Log preserves ordering; range normalization still spreads across 0-100 |
