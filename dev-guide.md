# Sudoku Engine Custom Component Guide

This reference manual documents the architecture and API for creating custom constraints in the Sudoku engine. The environment is split into two distinct scripting sections:

1.  **Custom Component Section:** Defines the logic, state, and lifecycle of the constraint.
2.  **Implementation Section:** Instantiates the components and applies them to the grid based on user input.

---

## 1. Custom Component Section

This section uses a prototype-based system. You define specific "hook" functions that the engine calls during the puzzle lifecycle.

### Lifecycle Hooks

#### `setParams(instance, ...args)`
* **Role:** Constructor.
* **Usage:** Saves arguments passed from the Implementation section to the `instance` object.
* **Important:** Do not mutate `instance` variables after this function returns.
* **Default:** If omitted, the engine assumes the first argument is `cells` and sets `instance.cells`.

```javascript
// Example: Storing a target sum and the relevant cells
function setParams(instance, targetSum, cells) {
    instance.targetSum = targetSum;
    instance.cells = cells;
}
```

#### `getAffectedCells(...args)`
* **Role:** Dependency Declaration.
* **Usage:** If your constructor (`setParams`) does not accept `cells` as the first argument, you must implement this to return the array of cells the engine should watch.

#### `initialize(instance, puzzle)`
* **Role:** One-time Setup.
* **Usage:** Runs **once** when the puzzle loads. Use for expensive pre-calculations (like visibility maps) or initial logic that ignores user input (e.g., handling "Given" digits).
* **Returns:** `Generator<Change>` (use `yield`).

```javascript
function* initialize(instance, puzzle) {
    // Optimization: Cache which cells see each other to speed up 'update'
    instance.visibilityMap = puzzle.getCellsSeeEachOther(instance.cells);
}
```

#### `validate(instance, puzzle)`
* **Role:** Validation / Win Condition.
* **Usage:** Determines if the constraint is satisfied.
* **Returns:** `boolean`.
    * Return `false` **only** if the constraint is definitively broken.
    * Return `true` if the constraint holds OR if the puzzle is incomplete (give the benefit of the doubt).

```javascript
function validate(instance, puzzle) {
    // If not all cells are filled, we can't fail it yet
    if (!puzzle.getCellsAreFilled(instance.cells)) return true;

    // Actual logic
    const sum = instance.cells.reduce((acc, c) => acc + puzzle.getValue(c), 0);
    return sum === instance.targetSum;
}
```

#### `update(instance, puzzle)`
* **Role:** The Solver (Candidate Elimination).
* **Usage:** The main logic loop. Runs whenever relevant cells change. Use this to remove candidates (pencil marks) based on the constraint rules.
* **Returns:** `Generator<Change>` (use `yield`).

```javascript
function* update(instance, puzzle) {
    const { cells } = instance;
    // Logic to calculate impossible candidates
    // yield puzzle.removeCandidatesFromCells(...)
}
```

---

## 2. API Reference

### The `puzzle` Object
Passed to `initialize`, `validate`, and `update`.

#### Reading State
| Method | Description |
| :--- | :--- |
| `puzzle.getValue(cell)` | Returns the number (integer) currently in the cell. |
| `puzzle.hasValue(cell)` | Returns `true` if the cell is solved/filled. |
| `puzzle.getCellsAreFilled(cells)` | Returns `true` if *all* cells in the array are filled. |
| `puzzle.getCellsSeeEachOther(cells)` | Optimization helper. Returns `true` if cells share a house (row/col/box). |

#### Modifying State (Must be Yielded)
| Method | Description |
| :--- | :--- |
| `puzzle.removeCandidatesFromCells(digitSet, cells)` | Removes specific pencil marks from cells. |
| `puzzle.filterCandidatesInCells(digitSet, cells)` | Removes all pencil marks *except* those in the set. |
| `puzzle.stop(reason)` | Halts the solver with an error message (use for logical contradictions). |
| `puzzle.removeComponent(instance)` | Removes the constraint from the engine (use when fully satisfied). |

### Helper Objects
* **`SudokuDigitSet.from([array])`**: Creates a set of digits. E.g., `SudokuDigitSet.from([1, 2, 9])`.
* **`helpers.naming.getCellsDescription(cells)`**: Returns a human-readable string (e.g., "R1C1, R1C2").

---

## 3. Implementation Section

This code runs once to apply your custom components to the grid. It usually iterates over the user's selection (`input.groups`).

**Syntax:**
```javascript
puzzle.addConstraintComponent(new ComponentName(unique_id, ...args));
```

**Standard Loop:**
```javascript
for (const group of input.groups) {
    const name = helpers.naming.getCellsDescription(group.cells);
    // Arguments here must match your setParams function signature
    puzzle.addConstraintComponent(new MyConstraint(name, group.cells));
}
```

---

## 4. Complete Example: "German Whisper" Constraint

**Rule:** Adjacent cells on the line must differ by at least 5.

### Custom Component Section Code

```javascript
/**
 * 1. Setup
 */
function setParams(instance, cells) {
    instance.cells = cells;
}

/**
 * 2. Validate
 * Checks if neighbors differ by at least 5.
 */
function validate(instance, puzzle) {
    const { cells } = instance;
    
    for (let i = 0; i < cells.length - 1; i++) {
        const c1 = cells[i];
        const c2 = cells[i + 1];
        
        if (puzzle.hasValue(c1) && puzzle.hasValue(c2)) {
            const diff = Math.abs(puzzle.getValue(c1) - puzzle.getValue(c2));
            if (diff < 5) return false;
        }
    }
    return true;
}

/**
 * 3. Update (Solver Logic)
 * If a cell is solved, eliminate neighbors that are too close in value.
 */
function* update(instance, puzzle) {
    const { cells } = instance;

    // Helper: Enforce whisper constraint between two cells
    function* restrictNeighbor(source, target) {
        if (puzzle.hasValue(source)) {
            const val = puzzle.getValue(source);
            
            // Allowable digits are those >= val+5 OR <= val-5
            // Therefore, BANNED digits are those where |val - n| < 5
            // i.e., (val - 4) to (val + 4)
            
            const banned = [];
            for (let n = 1; n <= 9; n++) {
                if (Math.abs(val - n) < 5) {
                    banned.push(n);
                }
            }
            
            if (banned.length > 0) {
                yield puzzle.removeCandidatesFromCells(
                    SudokuDigitSet.from(banned), 
                    [target]
                );
            }
        }
    }

    // Check every adjacent pair in the line
    for (let i = 0; i < cells.length - 1; i++) {
        yield* restrictNeighbor(cells[i], cells[i+1]);
        yield* restrictNeighbor(cells[i+1], cells[i]);
    }
}
```

### Implementation Section Code

```javascript
for (const group of input.groups) {
    const name = "Whisper_" + helpers.naming.getCellsDescription(group.cells);
    puzzle.addConstraintComponent(new WhisperComponent(name, group.cells));
}
```