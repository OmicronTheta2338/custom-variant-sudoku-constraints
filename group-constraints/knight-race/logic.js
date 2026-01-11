// IMPLEMENTATION SECTION

for (const group of input.groups) {
    const name = "KnightRace_" + helpers.naming.getCellsDescription(group.cells);
    puzzle.addConstraintComponent(new KnightRaceComponent(name, group.cells));
}

// COMPONENT SECTION

// Helper: Dynamic BFS for Knight distances
function calculateDistances(size, cellCount) {
    const dists = Array(cellCount).fill(0).map(() => Array(cellCount).fill(Infinity));
    const moves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (let start = 0; start < cellCount; start++) {
        const queue = [[start, 0]];
        dists[start][start] = 0;

        let head = 0;
        while (head < queue.length) {
            const [current, d] = queue[head++];
            const r = Math.floor(current / size);
            const c = current % size;

            for (const [dr, dc] of moves) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                    const next = nr * size + nc;
                    if (dists[start][next] === Infinity) {
                        dists[start][next] = d + 1;
                        queue.push([next, d + 1]);
                    }
                }
            }
        }
    }
    return dists;
}

function setParams(instance, cells) {
    instance.cells = cells;
}

function* initialize(instance, puzzle) {
    // Dynamic Size Detection
    const size = puzzle.size;
    const cellCount = size * size;

    instance.gridSize = size;
    instance.cellCount = cellCount;

    // 1. Calculate and cache distances
    instance.distMap = calculateDistances(size, cellCount);

    // Note: We no longer remove '1' from candidates. 
    // Cells CAN be 1 (implying another 1 is 1 step away).
}

function validate(instance, puzzle) {
    const { cells, distMap, cellCount } = instance;

    for (const cell of cells) {
        if (!puzzle.hasValue(cell)) continue;

        const cellValue = puzzle.getValue(cell);

        // Find actual distance to nearest '1' (excluding self)
        let minDistance = Infinity;
        let foundOne = false;

        for (let i = 0; i < cellCount; i++) {
            // IGNORE SELF: We look for the nearest *other* 1
            if (i === cell) continue;

            if (puzzle.hasValue(i) && puzzle.getValue(i) === 1) {
                const d = distMap[cell][i];
                if (d < minDistance) minDistance = d;
                foundOne = true;
            }
        }

        // If we found other '1's, check the distance
        if (foundOne) {
            // The value must match the distance exactly.
            // If the actual closest 1 is CLOSER than our value, it's definitely broken.
            if (minDistance < cellValue) return false;
        }
    }
    return true;
}

function* update(instance, puzzle) {
    const { cells, distMap, gridSize, cellCount } = instance;

    // Identify '1' locations
    const fixedOnes = [];
    const possibleOnes = [];

    for (let i = 0; i < cellCount; i++) {
        if (puzzle.hasValue(i)) {
            if (puzzle.getValue(i) === 1) fixedOnes.push(i);
        } else if (puzzle.getCandidates(i).has(1)) {
            possibleOnes.push(i);
        }
    }

    // PART A: Restrict candidates in constrained cells
    for (const cell of cells) {
        let minTheoDist = Infinity;

        // Check fixed ones (excluding self)
        for (const idx of fixedOnes) {
            if (idx === cell) continue; // Skip self
            const d = distMap[cell][idx];
            if (d < minTheoDist) minTheoDist = d;
        }

        // Check possible ones (excluding self)
        for (const idx of possibleOnes) {
            if (idx === cell) continue; // Skip self
            const d = distMap[cell][idx];
            if (d < minTheoDist) minTheoDist = d;
        }

        // Calculate Upper Bound (closest fixed 1, excluding self)
        let maxTheoDist = Infinity;
        for (const idx of fixedOnes) {
            if (idx === cell) continue; // Skip self
            const d = distMap[cell][idx];
            if (d < maxTheoDist) maxTheoDist = d;
        }

        // Cap distances at grid size
        if (minTheoDist > gridSize) minTheoDist = gridSize;
        if (maxTheoDist > gridSize) maxTheoDist = gridSize;

        // Filter: Value must be >= minTheoDist AND <= maxTheoDist
        const allowed = [];
        for (let v = 1; v <= gridSize; v++) {
            if (v >= minTheoDist && v <= maxTheoDist) {
                allowed.push(v);
            }
        }

        if (allowed.length === 0) {
            yield puzzle.stop`Cell ${helpers.naming.getCellsDescription([cell])} cannot reach another '1' within valid distance`;
        } else {
            yield puzzle.filterCandidatesInCells(
                SudokuDigitSet.from(allowed),
                [cell]
            );
        }
    }

    // PART B: Back-propagation
    // If cell has value V, no *other* cell at distance < V can be '1'
    for (const cell of cells) {
        if (puzzle.hasValue(cell)) {
            const val = puzzle.getValue(cell);

            const tooCloseCells = [];
            for (let i = 0; i < cellCount; i++) {
                if (i === cell) continue; // Skip self

                // If 'i' is closer than 'val', it cannot be a '1'
                if (distMap[cell][i] < val) {
                    tooCloseCells.push(i);
                }
            }

            if (tooCloseCells.length > 0) {
                yield puzzle.removeCandidatesFromCells(
                    SudokuDigitSet.from([1]),
                    tooCloseCells
                );
            }
        }
    }
}