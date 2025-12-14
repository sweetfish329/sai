package sgf

import (
	"testing"
)

func TestParseRepro(t *testing.T) {
	// SGF with special chars in player name and 'ee' moves
	content := "(;GM[1]SZ[9]KM[6.5]PB[AI (手加減なし)]PW[AI (手加減なし)];B[ee];W[aa];B[ee];W[bb])"

	nodes, err := Parse(content)
	if err != nil {
		t.Fatalf("Parse error: %v", err)
	}

	gameData := ExtractGameData(nodes[0])

	if gameData.GameInfo.BlackPlayer != "AI (手加減なし)" {
		t.Errorf("Expected BlackPlayer 'AI (手加減なし)', got '%s'", gameData.GameInfo.BlackPlayer)
	}

	if len(gameData.Moves) != 4 {
		t.Fatalf("Expected 4 moves, got %d", len(gameData.Moves))
	}

	expectedMoves := []string{"ee", "aa", "ee", "bb"}
	for i, move := range gameData.Moves {
		if move.Move != expectedMoves[i] {
			t.Errorf("Move %d: expected %s, got %s", i, expectedMoves[i], move.Move)
		}
	}
}
