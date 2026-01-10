# Sudoku Variant Constraint Library

This repository contains JavaScript-based custom components and implementation scripts for the Constraint Maker tool on [sudokumaker.app](https://sudokumaker.app). 

## Repository Structure

* **`standard-components.js`**: A reference library containing definitions for the engine's built-in components. This file serves as documentation for parameters and prevents linting errors in local development environments.
* **`/global-constraints`**: Logic for rules that apply to the grid based on static coordinates or global conditions (e.g., anti-knight).
* **`/group-constraints`**: Logic for rules that apply dynamically to user-defined groups (e.g., German whispers).

## Usage

Each script is split into two sections:

1.  **Custom Component Section**: Logic definitions for the `validate` and `update` hooks. This code must be placed in the **Components** area of the software.
2.  **Implementation Section**: The execution code that initializes and attaches the component to the puzzle instance. This code belongs in the **Implementation** area.

## Constraint Catalog

### Global Constraints
| Component | Functionality |
| :--- | :--- |
| **KnightsSlowPath** | Validates an alternating-parity, non-decreasing path via Knight's moves. |
| **KingsSlowPath** | Validates an alternating-parity, non-decreasing path via King's moves. |

### Group Constraints
| Component | Functionality |
| :--- | :--- |
| **GermanWhispers** | Enforces a minimum difference of 5 between adjacent digits on a line. |
| **ParitySwitch** | Toggles parity requirements (Even/Odd) at diagonal line intersections. |
| **PrimeCells** | Limits valid candidates within a group to the prime set {2, 3, 5, 7}. |

For optimal performance, standard components should be used whenever possible. Custom components should be reserved for logic not supported natively.