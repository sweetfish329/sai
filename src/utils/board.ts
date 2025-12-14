import Board from '@sabaki/go-board'

export class GoBoard {
  private board: any

  constructor(size: number = 19) {
    this.board = Board.fromDimensions(size)
  }

  play(x: number, y: number, color: 'B' | 'W') {
    const sign = color === 'B' ? 1 : -1
    this.board = this.board.makeMove(sign, [x, y])
  }

  get(x: number, y: number): 'B' | 'W' | null {
    const sign = this.board.get([x, y])
    if (sign === 1) return 'B'
    if (sign === -1) return 'W'
    return null
  }

  getSize(): number {
    return this.board.width
  }
}
