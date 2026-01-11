# Sudoku Variant Constraint Library

This repository contains JavaScript-based custom components and implementation scripts for the Constraint Maker tool on [sudokumaker.app](https://sudokumaker.app). 

## Repository Structure
```
├───dev-guide.md                        # Documentation for writing custom components
├───standard-components.js              # Reference library for built-in components
├───global-constraints/                 # Constraints that apply to the entire grid
└───group-constraints/                  # Constraints that apply to user-defined groups
    └───constraint-name/                
        └───logic.js                    # Implementation script
        └───data.json                   # Import file
```