package game

type StoneColor int

const (
	Empty StoneColor = iota
	Black
	White
)

type Board struct {
	Size int
	Grid [][]StoneColor
}

func NewBoard(size int) *Board {
	grid := make([][]StoneColor, size)
	for i := range grid {
		grid[i] = make([]StoneColor, size)
	}
	return &Board{Size: size, Grid: grid}
}

func (b *Board) Get(x, y int) StoneColor {
	if x < 0 || x >= b.Size || y < 0 || y >= b.Size {
		return Empty
	}
	return b.Grid[x][y]
}

func (b *Board) Play(x, y int, c StoneColor) {
	if x < 0 || x >= b.Size || y < 0 || y >= b.Size {
		return
	}

	// Place stone
	b.Grid[x][y] = c

	// Check opponent neighbors for capture
	opp := Black
	if c == Black {
		opp = White
	}

	neighbors := [][2]int{{x - 1, y}, {x + 1, y}, {x, y - 1}, {x, y + 1}}
	for _, n := range neighbors {
		nx, ny := n[0], n[1]
		if b.Get(nx, ny) == opp {
			group, liberties := b.getGroupAndLiberties(nx, ny)
			if liberties == 0 {
				b.removeGroup(group)
			}
		}
	}

	// Check self for suicide (optional, but good for correctness if input is weird)
	// Usually SGFs are valid, but suicide might remove the stone itself?
	// Standard rules: suicide is forbidden, but some rules allow it.
	// Sabaki usually enforces rules. I'll just check if self capture happens.
	// Check self for suicide
	_, liberties := b.getGroupAndLiberties(x, y)
	if liberties == 0 {
		// Capture self? Or revert?
		// For replay, we assume moves are valid. If it's suicide, we might leave it or remove it.
		// I'll leave it for now unless I want to be strict.
	}
}

func (b *Board) getGroupAndLiberties(x, y int) ([][2]int, int) {
	c := b.Get(x, y)
	if c == Empty {
		return nil, 0
	}

	group := [][2]int{}
	seen := make(map[int]bool) // key = y * size + x
	liberties := make(map[int]bool)

	queue := [][2]int{{x, y}}
	seen[y*b.Size+x] = true

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]
		group = append(group, curr)

		cx, cy := curr[0], curr[1]
		neighbors := [][2]int{{cx - 1, cy}, {cx + 1, cy}, {cx, cy - 1}, {cx, cy + 1}}

		for _, n := range neighbors {
			nx, ny := n[0], n[1]
			if nx < 0 || nx >= b.Size || ny < 0 || ny >= b.Size {
				continue
			}

			nc := b.Grid[nx][ny]
			if nc == Empty {
				liberties[ny*b.Size+nx] = true
			} else if nc == c {
				idx := ny*b.Size + nx
				if !seen[idx] {
					seen[idx] = true
					queue = append(queue, n)
				}
			}
		}
	}

	return group, len(liberties)
}

func (b *Board) removeGroup(group [][2]int) {
	for _, p := range group {
		b.Grid[p[0]][p[1]] = Empty
	}
}
