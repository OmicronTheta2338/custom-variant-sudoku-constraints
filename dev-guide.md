# Sudoku Engine Custom Component Guide

This is a dev guide for the [SudokuMaker.app](https://sudokumaker.app) custom constraint tool. When you open add a csutom constraint, you will be greeted with a tickbox and two code entry areas.

1.  **Tickbox:** Define if this is a Global Constraint or not.
2.  **Implementation Section:** Create instances of your component and apply them to the grid.
3.  **Custom Component Section:** Define the constraint's behavior using lifecycle hook functions.


---

## 1. How the System Works

When you define functions like `setParams`, `validate`, and `update` in the Custom Component Section, the engine automatically creates a component class using these functions. You then instantiate this class in the Implementation Section.

**The connection:**
```javascript
// Custom Component Section: You define functions
function setParams(instance, cells) { ... }
function validate(instance, puzzle) { ... }

// Implementation Section: Engine creates a class from your functions
puzzle.addConstraintComponent(new MyComponent(name, cells));
//                                ^^^^^^^^^^^
//                    Remember this to the component name
```

---

## 2. Custom Component Section

Define these functions to control your constraint's behavior. All functions are optional - only implement what you need.

### `getAffectedCells(param1, param2, ...)`

**When to use:** Only if your component's first parameter (after `name`) is NOT the cells array.

**Purpose:** Tells the engine which cells this constraint affects.

**Returns:** Array of cells

```javascript
// Example: If constructor is (name, targetSum, cells)
// then cells is the 3rd parameter, not the 1st
function getAffectedCells(targetSum, cells) {
    return cells;
}
```

**Default behavior:** If you don't define this, the engine assumes the first parameter after `name` is the cells array.

---

### `setParams(instance, param1, param2, ...)`

**When to use:** When you need to store constructor parameters for later use.

**Purpose:** Acts as a constructor and saves parameters to the instance object.

**Critical rule:** Never modify `instance` variables after this function completes

```javascript
// Example: Store a target sum and cells
function setParams(instance, targetSum, cells) {
    instance.targetSum = targetSum;
    instance.cells = cells;
}
```

**Default behavior:** If you don't define this, the engine automatically does:
```javascript
instance.cells = param1; // Assumes first parameter is cells
```

---

### `initialize(instance, puzzle)`

**When to use:** For one-time setup logic when the puzzle first loads.

**Purpose:** 
- Eliminate candidates that are always impossible (regardless of current state)
- Cache expensive calculations for use in `update`

**Returns:** `Generator<Change>` - use `yield` to make changes

**Note:** Can set instance variables, but they still cannot be mutated after `initialize` completes

```javascript
function* initialize(instance, puzzle) {
    const { cells, param1 } = instance;
    
    // Example: Always remove 1 as a candidate
    yield puzzle.removeCandidatesFromCells(
        SudokuDigitSet.from([1]), 
        cells
    );
    
    // Example: Cache visibility information (slow to compute)
    instance.uniqueDigits = param1 && puzzle.getCellsSeeEachOther(cells);
}
```

---

### `validate(instance, puzzle)`

**When to use:** When you need to check if the constraint is satisfied.

**Purpose:** Determines if the puzzle state violates your constraint.

**Returns:** `boolean`
- Return `false` **only if** the constraint definitely cannot hold
- Return `true` if the constraint holds **OR** if there's not enough information yet

**Important philosophy:** Give the benefit of the doubt! If cells aren't filled, you can't know if the constraint is broken yet.

```javascript
function validate(instance, puzzle) {
    const { cells } = instance;
    
    // Not enough info? Return true (innocent until proven guilty)
    if (!puzzle.getCellsAreFilled(cells)) {
        return true;
    }
    
    // All cells filled - check the actual constraint
    return cells.every(cell => puzzle.getValue(cell) === 1);
}
```

---

### `update(instance, puzzle)`

**When to use:** To eliminate impossible candidates (pencil marks) based on your constraint's logic.

**Purpose:** The main solver logic. Runs whenever relevant cells change.

**Returns:** `Generator<Change>` - use `yield` to make changes

```javascript
function* update(instance, puzzle) {
    const { cells } = instance;
    
    // Example: If first cell is filled, all cells must match it
    if (puzzle.hasValue(cells[0])) {
        const value = puzzle.getValue(cells[0]);
        yield puzzle.filterCandidatesInCells(
            SudokuDigitSet.from([value]), 
            cells
        );
    }
    
    // You can combine update and validate logic
    // Example: Remove component when satisfied
    if (puzzle.getValue(cells[1]) === 2) {
        yield puzzle.removeComponent(instance);
    }
    
    // Example: Detect logical impossibility
    if (puzzle.hasValue(cells[1]) && puzzle.hasValue(cells[2])) {
        if (puzzle.getValue(cells[1]) === puzzle.getValue(cells[2])) {
            yield puzzle.stop`${helpers.naming.getCellsDescription(cells.slice(1, 3))} have the same value`;
        }
    }
}
```

---

## 3. The `puzzle` API

### Reading State

| Method | Description |
| :--- | :--- |
| `puzzle.getValue(cell)` | Get the digit in the cell (if filled) |
| `puzzle.hasValue(cell)` | Returns `true` if the cell has a value |
| `puzzle.getCellsAreFilled(cells)` | Returns `true` if all cells in array are filled |
| `puzzle.getCellsSeeEachOther(cells)` | Returns `true` if cells are mutually visible (share row/column/box). **Note:** Slow to compute - cache in `initialize` if needed repeatedly |

### Making Changes (Must use `yield`)

| Method | Description |
| :--- | :--- |
| `puzzle.removeCandidatesFromCells(digitSet, cells)` | Remove specific pencil marks from cells |
| `puzzle.filterCandidatesInCells(digitSet, cells)` | Keep only specified pencil marks, remove all others |
| `puzzle.removeComponent(instance)` | Remove this constraint from the puzzle (when fully satisfied) |
| `puzzle.stop`text`` | Halt solving with an error message (when logical contradiction detected) |

### Helper: `SudokuDigitSet`

Create a set of digits for use with candidate methods:

```javascript
SudokuDigitSet.from([1, 2, 9])  // Set containing digits 1, 2, and 9
```

### Helper: `helpers.naming.getCellsDescription(cells)`

Returns a human-readable cell description:

```javascript
helpers.naming.getCellsDescription(cells)  // "R1C1, R1C2, R3C4"
```

---

## 4. Implementation Section

This code runs once to instantiate your components and apply them to the puzzle.

### Accessing User Input

When the "Global constraint" tickbox is **not** ticked, you can access the user's selected cell groups:

```javascript
input.groups  // Array of groups selected by the user
```

Each group has:
- `group.cells` - Array of cell references

### Standard Pattern

```javascript
// Apply constraint to each group the user selected
for (const group of input.groups) {
    const name = helpers.naming.getCellsDescription(group.cells);
    puzzle.addConstraintComponent(new MyComponent(name, group.cells));
}
```

### Advanced Pattern (Single Component, Multiple Groups)

```javascript
// Create one constraint that handles multiple groups
puzzle.addConstraintComponent(new SameSumComponent(
    'the equal-sum constraint',
    input.groups.map(group => ({
        name: helpers.naming.getCellsDescription(group.cells),
        cells: group.cells
    }))
));
```

---

## 5. Complete Example: German Whisper Line

**Rule:** Adjacent cells on the line must differ by at least 5.

### Custom Component Section

```javascript
function setParams(instance, cells) {
    instance.cells = cells;
}

function validate(instance, puzzle) {
    const { cells } = instance;
    
    // Check each adjacent pair
    for (let i = 0; i < cells.length - 1; i++) {
        const c1 = cells[i];
        const c2 = cells[i + 1];
        
        // Only validate if both cells are filled
        if (puzzle.hasValue(c1) && puzzle.hasValue(c2)) {
            const diff = Math.abs(puzzle.getValue(c1) - puzzle.getValue(c2));
            if (diff < 5) {
                return false;  // Constraint violated
            }
        }
    }
    return true;  // Constraint holds or not enough info
}

function* update(instance, puzzle) {
    const { cells } = instance;
    
    // For each adjacent pair, restrict candidates
    for (let i = 0; i < cells.length - 1; i++) {
        yield* restrictPair(cells[i], cells[i + 1]);
        yield* restrictPair(cells[i + 1], cells[i]);
    }
    
    function* restrictPair(source, target) {
        if (puzzle.hasValue(source)) {
            const val = puzzle.getValue(source);
            
            // Calculate banned digits: those within ±4 of val
            // Legal digits are ≥ val+5 OR ≤ val-5
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
}
```

### Implementation Section

```javascript
for (const group of input.groups) {
    const name = "Whisper_" + helpers.naming.getCellsDescription(group.cells);
    puzzle.addConstraintComponent(new WhisperComponent(name, group.cells));
}
```

---

## 6. Quick Reference

**Decision tree for which functions to implement:**

- Need to store constructor parameters? → `setParams`
- First parameter isn't cells? → `getAffectedCells`
- One-time setup or caching needed? → `initialize`
- Need to check if constraint is satisfied? → `validate`
- Need to eliminate candidates? → `update`

**Remember:**
- Always `yield` when modifying the puzzle
- Never mutate `instance` variables after initialization
- Return `true` from `validate` when uncertain
- Use `puzzle.stop` for logical contradictions