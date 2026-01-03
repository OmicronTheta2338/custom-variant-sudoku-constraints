# Developer Guide: Custom Component Architecture

Custom components are JavaScript-based classes that interface with the Sudoku solver. They are used to implement rules not covered natively.

## 1. Lifecycle Hooks

Each component operates through a specific lifecycle. The engine calls these functions at different stages of the solving process.

| Hook | Type | Purpose |
| :--- | :--- | :--- |
| `setParams` | Setup | Initialises instance variables (e.g., target cells or values). |
| `initialize` | Generator | Runs once at start. Used for proactive candidate filtering. |
| `validate` | Boolean | Runs on every change. Returns `false` only if the rule is violated. |
| `update` | Generator | Runs on every change. Used for dynamic candidate removal. |



## 2. The `puzzle` API

The `puzzle` object is the primary interface for interacting with the grid. Common methods include:

* **`puzzle.getValue(cellId)`**: Returns the digit in the cell, or `undefined` if empty.
* **`puzzle.hasValue(cellId)`**: Returns `true` if the cell contains a digit.
* **`puzzle.filterCandidatesInCells(digitSet, cellIds)`**: Removes all digits *not* in the set from the specified cells.
* **`puzzle.removeCandidatesFromCells(digitSet, cellIds)`**: Removes specific digits from the specified cells.
* **`puzzle.stop(message)`**: Halts the solver and displays an error (used when a rule is broken).

## 3. Coordinate System

The engine uses zero-based indexing for cell identification.

* **9x9 Grid**: Index 0 (R1C1) to 80 (R9C9).
* **6x6 Grid**: Index 0 (R1C1) to 35 (R6C6).
* **4x4 Grid**: Index 0 (R1C1) to 15 (R4C4).



## 4. Boilerplate Template

Use this template to ensure the engine correctly identifies your component hooks.

```javascript
/**
 * [COMPONENT NAME]
 * Logic: [Description of the constraint]
 */

// CUSTOM COMPONENT SECTION
function setParams(instance, param1, param2) {
  instance.param1 = param1;
  instance.cells = param2;
}

function* initialize(instance, puzzle) {
  // Logic for initial board state
}

function validate(instance, puzzle) {
  // Logic to check for rule violations
  // Return false if invalid, true otherwise
  return true;
}

function* update(instance, puzzle) {
  // Logic for candidate elimination during solving
  // Use yield to pass changes to the engine
}

// IMPLEMENTATION SECTION
puzzle.addConstraintComponent(new YourComponentName("Label", param1, cells));