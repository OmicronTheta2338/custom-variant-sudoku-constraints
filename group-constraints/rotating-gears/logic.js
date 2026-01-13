// IMPLEMENTATION SECTION

// The user input 'groups' contains all the gears.
// We pass them all into a SINGLE component instance.
// This is crucial so we can synchronize their rotations globally.

if (input.groups && input.groups.length > 0) {
    puzzle.addConstraintComponent(new RotatingGearsComponent(
        "Global_Rotating_Gears",
        input.groups // Pass all groups at once
    ));
}

// COMPONENT SECTION


// Helper to check if two cells are standard Sudoku peers (Row/Col/Box)
// We implement this locally for speed during the heavy initialization loop
function arePeers(i, j, size) {
    if (i === j) return false;

    // Row
    const row1 = Math.floor(i / size);
    const row2 = Math.floor(j / size);
    if (row1 === row2) return true;

    // Column
    const col1 = i % size;
    const col2 = j % size;
    if (col1 === col2) return true;

    // Box (Assumes standard square boxes, e.g., 3x3 for size 9)
    // Note: If using irregular/custom geometry, rely on puzzle.getCellsSeeEachOther
    // but for standard sudoku this math is much faster.
    const boxH = Math.sqrt(size);
    const boxW = size / boxH; // Should be integer for standard sudoku

    if (Number.isInteger(boxH)) {
        const b1 = Math.floor(row1 / boxH) * boxH + Math.floor(col1 / boxW);
        const b2 = Math.floor(row2 / boxH) * boxH + Math.floor(col2 / boxW);
        if (b1 === b2) return true;
    }

    return false;
}

function setParams(instance, groups) {
    instance.groups = groups;
}

function* initialize(instance, puzzle) {
    const size = puzzle.size || 9;
    const cellCount = size * size;

    // 1. Build a Lookup Table for Gear Movements
    // cellMoveMap[cellIndex] = { groupIndex, indexInGroup, N, length }
    const cellMoveMap = new Map();

    // Validate and map groups
    for (const group of instance.groups) {
        const len = group.cells.length;
        if (len % 4 !== 0) {
            console.error("Rotating Gears: Group size must be multiple of 4", group);
            continue;
        }
        const N = len / 4;

        group.cells.forEach((cell, idx) => {
            cellMoveMap.set(cell, {
                cells: group.cells,
                idx: idx,
                N: N,
                len: len
            });
        });
    }

    // Helper to find where a value currently at 'sourceCell' 
    // will be located after 'r' rotations.
    function getLocation(sourceCell, r) {
        if (!cellMoveMap.has(sourceCell)) {
            return sourceCell; // Static cell (doesn't move)
        }
        const info = cellMoveMap.get(sourceCell);
        // Calculate shift: (CurrentIndex + r * N) % TotalLength
        const newIdx = (info.idx + (r * info.N)) % info.len;
        return info.cells[newIdx];
    }

    // 2. Pre-calculate "Ghost Peers"
    // If Cell A (in rotation R) sees Cell B (in rotation R), 
    // then Source A and Source B conflict.
    const conflictMap = Array(cellCount).fill(0).map(() => new Set());

    // We check all unique pairs of cells
    for (let i = 0; i < cellCount; i++) {
        for (let j = i + 1; j < cellCount; j++) {

            // Check all 4 Rotation States
            let linked = false;
            for (let r = 0; r < 4; r++) {
                const locI = getLocation(i, r);
                const locJ = getLocation(j, r);

                // We use our fast helper. If using irregular regions, 
                // you might need: puzzle.getCellsSeeEachOther([locI, locJ])
                if (arePeers(locI, locJ, size)) {
                    linked = true;
                    break; // Found a conflict in one timeline, no need to check others
                }
            }

            if (linked) {
                conflictMap[i].add(j);
                conflictMap[j].add(i);
            }
        }
    }

    instance.conflictMap = conflictMap;
}

function* update(instance, puzzle) {
    const { conflictMap } = instance;

    // Standard Sudoku Constraint Propagation
    // For every solved cell, remove its value from all its "Ghost Peers"

    // We iterate all cells to find solved ones
    // (In a highly optimized engine we might track changes, but this is safe)
    for (let i = 0; i < conflictMap.length; i++) {
        if (puzzle.hasValue(i)) {
            const val = puzzle.getValue(i);
            const peers = conflictMap[i];

            if (peers.size > 0) {
                // Remove 'val' from all ghost peers
                yield puzzle.removeCandidatesFromCells(
                    SudokuDigitSet.from([val]),
                    Array.from(peers)
                );
            }
        }
    }

    // Validation check: ensure no two solved ghost peers have the same value
    for (let i = 0; i < conflictMap.length; i++) {
        if (puzzle.hasValue(i)) {
            const valA = puzzle.getValue(i);
            for (const peer of conflictMap[i]) {
                if (peer > i && puzzle.hasValue(peer)) { // peer > i to avoid double check
                    const valB = puzzle.getValue(peer);
                    if (valA === valB) {
                        yield puzzle.stop`Gear Logic Conflict: Cells ${helpers.naming.getCellsDescription([i, peer])} clash in one of the rotations.`;
                    }
                }
            }
        }
    }
}