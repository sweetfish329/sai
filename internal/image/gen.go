package image

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image/color"
	"strconv"

	"github.com/fogleman/gg"
	"github.com/sweetfish329/sai/internal/game"
	"github.com/sweetfish329/sai/internal/sgf"
)

// SgfCoordToNum converts "aa" -> 0, etc.
func SgfCoordToNum(c byte) int {
	if c >= 'a' && c <= 'z' {
		return int(c - 'a')
	}
	return -1
}

func GenerateBoardImage(sgfContent string, moveNumber int) (string, error) {
	roots, err := sgf.Parse(sgfContent)
	if err != nil {
		return "", err
	}
	if len(roots) == 0 {
		return "", fmt.Errorf("no game found")
	}
	root := roots[0]

	szStr := root.Get("SZ")
	size := 19
	if szStr != "" {
		if s, err := strconv.Atoi(szStr); err == nil {
			size = s
		}
	}

	board := game.NewBoard(size)

	// Setup AB/AW
	// AB/AW usually contains list of points.
	// parser returns []string.
	// Each string could be "aa" or "ab" etc.
	if ab, ok := root.Properties["AB"]; ok {
		for _, coords := range ab {
			// coords might be "aa", "ab"...
			// Actually my parser returns values as string inside list.
			// property AB[aa][ab] -> Properties["AB"] = ["aa", "ab"]
			if len(coords) >= 2 {
				x := SgfCoordToNum(coords[0])
				y := SgfCoordToNum(coords[1])
				board.Play(x, y, game.Black)
			}
		}
	}
	if aw, ok := root.Properties["AW"]; ok {
		for _, coords := range aw {
			if len(coords) >= 2 {
				x := SgfCoordToNum(coords[0])
				y := SgfCoordToNum(coords[1])
				board.Play(x, y, game.White)
			}
		}
	}

	// Extract all moves
	type manualMove struct {
		x, y  int
		color game.StoneColor
	}
	var moves []manualMove

	// Standard SGF: Moves are in children nodes recursively.
	// Sequence: Root -> Node1 -> Node2 ...
	curr := root
	for len(curr.Children) > 0 {
		curr = curr.Children[0]
		if b := curr.Get("B"); b != "" {
			if len(b) >= 2 {
				moves = append(moves, manualMove{SgfCoordToNum(b[0]), SgfCoordToNum(b[1]), game.Black})
			}
		} else if w := curr.Get("W"); w != "" {
			if len(w) >= 2 {
				moves = append(moves, manualMove{SgfCoordToNum(w[0]), SgfCoordToNum(w[1]), game.White})
			}
		}
	}

	limit := len(moves)
	if moveNumber >= 0 && moveNumber < limit {
		limit = moveNumber
	}

	for i := 0; i < limit; i++ {
		board.Play(moves[i].x, moves[i].y, moves[i].color)
	}

	// Draw
	cellSize := 40.0
	padding := 40.0
	imageSize := float64(size)*cellSize + padding*2

	dc := gg.NewContext(int(imageSize), int(imageSize))
	// Wood color
	dc.SetColor(color.RGBA{0xdc, 0xb3, 0x5c, 0xff})
	dc.Clear()

	// Grid
	dc.SetColor(color.Black)
	dc.SetLineWidth(1)
	for i := 0; i < size; i++ {
		pos := padding + float64(i)*cellSize
		// Horizontal
		dc.DrawLine(padding, pos, padding+float64(size-1)*cellSize, pos)
		// Vertical
		dc.DrawLine(pos, padding, pos, padding+float64(size-1)*cellSize)
	}
	dc.Stroke()

	// Handle Star points usually? (Optional)

	// Stones
	radius := cellSize/2 - 2
	for x := 0; x < size; x++ {
		for y := 0; y < size; y++ {
			st := board.Get(x, y)
			if st != game.Empty {
				if st == game.Black {
					dc.SetColor(color.Black)
				} else {
					dc.SetColor(color.White)
				}
				cx := padding + float64(x)*cellSize
				cy := padding + float64(y)*cellSize
				dc.DrawCircle(cx, cy, radius)
				dc.Fill()
			}
		}
	}

	var buf bytes.Buffer
	if err := dc.EncodePNG(&buf); err != nil {
		return "", err
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
