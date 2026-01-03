/**
 * STANDARD COMPONENTS REFERENCE
 * * This file acts as a reference library for the built-in components
 * provided by the Sudoku software engine. Use these stubs to understand
 * parameters or to prevent "undefined" errors in your code editor.
 */

/**
 * [LINES & PATHS]
 */

// The digits on all midPoints must be between the digits on the endPoints.
class BetweenComponent {
    constructor(name, endPoints, midPoints) { }
}

// All digits within cells must make a set of consecutive digits, but may repeat.
class ConsecutiveDigitsComponent {
    constructor(name, cells) { }
}

// All digits within cells must make a set of consecutive digits, without repeats.
class ConsecutiveDigitsSetComponent {
    constructor(name, cells) { }
}

// Digits along cells must increase or decrease by the same amount (or stay the same).
class SequenceComponent {
    constructor(name, cells) { }
}

/**
 * [ARITHMETIC & SUMS]
 */

// The digits in cells must sum to (one of) sumOrSums.
class SumComponent {
    constructor(name, sumOrSums, cells) { }
}

// The product of the digits in cells must equal to productOrProducts.
class ProductComponent {
    constructor(name, productOrProducts, cells) { }
}

// Every group of cells from groups must sum to the same value.
class SameSumComponent {
    constructor(name, groups) { }
}

// The sums of every value multiplied by weights must sum to (one of) sumOrSums.
class WeightedSumComponent {
    constructor(name, sumOrSums, cellWeightMapping) { }
}

// Digits along cells represent skyscrapers. The amount seen from the start must equal amount.
class SkyscraperComponent {
    constructor(name, amount, cells) { }
}

/**
 * [DIFFERENCES & RATIOS]
 */

// The difference between the values at cell1 and cell2 must be exactly difference.
class DifferenceComponent {
    constructor(name, difference, cell1, cell2) { }
}

// The difference between the values of cell1 and cell2 must be at most maxDifference.
class MaximumDifferenceComponent {
    constructor(name, maxDifference, cell1, cell2) { }
}

// The difference between the values of cell1 and cell2 must be at least minDifference.
class MinimumDifferenceComponent {
    constructor(name, minDifference, cell1, cell2) { }
}

// The ratio of the values of cell1 and cell2 (either way) must equal ratioOrRatios.
class RatioComponent {
    constructor(name, ratioOrRatios, cell1, cell2) { }
}

/**
 * [COMPARISONS]
 */

// The digit in lesserCell must be less than the one in greaterCell.
class GreaterThanComponent {
    constructor(name, lesserCell, greaterCell) { }
}
// Alias for GreaterThanComponent
const LessThanComponent = GreaterThanComponent;

// The digit in greaterCell must be greater than or equal to the one in lesserCell.
class GreaterThanOrEqualsComponent {
    constructor(name, lesserCell, greaterCell) { }
}

/**
 * [CELL GROUPS & UNIQUENESS]
 */

// Every digit must appear exactly once in cells.
class HouseComponent {
    constructor(name, cells) { }
}

// Every cell of cells must have a different digit from the rest.
class DifferentDigitsComponent {
    constructor(name, cells) { }
}

// Every cell of cells must have the same value.
class SameDigitComponent {
    constructor(name, cells) { }
}

/**
 * [COUNTING & INDEXING]
 */

// The digit in counterCell must equal the amount of occurrences of digit in targetCells.
class CountDigitComponent {
    constructor(name, digit, counterCell, targetCells) { }
}

// The value of indexerCell must be the (1-based) index of an appearance of valueToIndex in cells.
class IndexComponent {
    constructor(name, valueToIndex, indexerCell, cells) { }
}

// The first X digits along cells must sum to sum, where X is the value of xCell.
class XSumComponent {
    constructor(name, sum, xCell, cells) { }
}

/**
 * [NEGATION & LINKS]
 */

// The digits within cells must not sum to any of sums.
class NegativeSumComponent {
    constructor(name, sums, cells) { }
}

// If cell1 is set to value1, cell2 must not be value2 (and vice versa).
class WeakLinkComponent {
    constructor(name, cell1, value1, cell2, value2) { }
}

/**
 * [CANDIDATES]
 */

// The value of cellOrCells cannot be any of candidates.
class ForbiddenCandidatesComponent {
    constructor(name, candidates, cellOrCells) { }
}

// The value of cellOrCells must be one of candidates.
class PredefinedCandidatesComponent {
    constructor(name, candidates, cellOrCells) { }
}