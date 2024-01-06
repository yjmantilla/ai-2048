import curses
import random
import time
game_config = {
    "grid_size": 4,
    "player_type": "ai"  # Change to "ai" for AI player
}

def simulate_move_and_score(grid, move):
    temp_grid = [row[:] for row in grid]
    temp_grid = update_grid(temp_grid, move)
    score = sum(sum(max(cell, 0) for cell in row) for row in grid) - sum(sum(max(cell, 0) for cell in row) for row in temp_grid)
    return score, temp_grid

def ai_move(grid):
    moves = ['up', 'down', 'left', 'right']
    best_score = -1
    best_move = None

    for move in moves:
        score, new_grid = simulate_move_and_score(grid, move)
        if score > best_score and new_grid != grid:
            best_score = score
            best_move = move

    return best_move


def init_grid(size):
    grid = [[0 for _ in range(size)] for _ in range(size)]
    add_new_tile(grid)
    add_new_tile(grid)
    return grid

def add_new_tile(grid):
    size = len(grid)
    while True:
        r, c = random.randint(0, size - 1), random.randint(0, size - 1)
        if grid[r][c] == 0:
            grid[r][c] = 2 if random.random() < 0.9 else 4
            return

def draw_grid(stdscr, grid):
    stdscr.clear()
    for i, row in enumerate(grid):
        for j, val in enumerate(row):
            stdscr.addstr(i, j * 5, str(val).ljust(4))
    stdscr.refresh()

def compress(grid):
    # Compress the grid after shifting (remove zeros)
    new_grid = [[0 for _ in range(len(grid))] for _ in range(len(grid))]
    for i in range(len(grid)):
        pos = 0
        for j in range(len(grid)):
            if grid[i][j] != 0:
                new_grid[i][pos] = grid[i][j]
                pos += 1
    return new_grid

def merge(grid):
    # Merge the cells in grid after compressing
    for i in range(len(grid)):
        for j in range(len(grid) - 1):
            if grid[i][j] == grid[i][j + 1]:
                grid[i][j] *= 2
                grid[i][j + 1] = 0
    return grid

def reverse(grid):
    # Reverse the rows of the grid
    new_grid = []
    for i in range(len(grid)):
        new_grid.append([])
        for j in range(len(grid)):
            new_grid[i].append(grid[i][len(grid) - j - 1])
    return new_grid

def transpose(grid):
    # Transpose the grid (swap rows and columns)
    new_grid = []
    for i in range(len(grid)):
        new_grid.append([])
        for j in range(len(grid)):
            new_grid[i].append(grid[j][i])
    return new_grid

def update_grid(grid, move):
    # Handle moves
    if move == 'up':
        grid = transpose(grid)
        grid = compress(grid)
        grid = merge(grid)
        grid = compress(grid)
        grid = transpose(grid)
    elif move == 'down':
        grid = transpose(grid)
        grid = reverse(grid)
        grid = compress(grid)
        grid = merge(grid)
        grid = compress(grid)
        grid = reverse(grid)
        grid = transpose(grid)
    elif move == 'left':
        grid = compress(grid)
        grid = merge(grid)
        grid = compress(grid)
    elif move == 'right':
        grid = reverse(grid)
        grid = compress(grid)
        grid = merge(grid)
        grid = compress(grid)
        grid = reverse(grid)
    return grid

def is_game_over(grid):
    # Check for empty cell
    for row in grid:
        if 0 in row:
            return False

    # Check for possible merges horizontally and vertically
    size = len(grid)
    for i in range(size):
        for j in range(size - 1):  # Horizontal check
            if grid[i][j] == grid[i][j + 1]:
                return False
        for j in range(size - 1):  # Vertical check
            if grid[j][i] == grid[j + 1][i]:
                return False

    return True  # No empty cells and no possible merges



def main(stdscr):
    curses.curs_set(0)
    size = game_config["grid_size"]
    grid = init_grid(size)

    while True:
        draw_grid(stdscr, grid)

        if game_config["player_type"] == "human":
            key = stdscr.getch()
            if key == curses.KEY_UP:
                move = 'up'
            elif key == curses.KEY_DOWN:
                move = 'down'
            elif key == curses.KEY_LEFT:
                move = 'left'
            elif key == curses.KEY_RIGHT:
                move = 'right'
        else:  # AI Player
            move = ai_move(grid)
            time.sleep(0.010)
            if move is None:  # No valid moves for AI
                break

        grid_copy = [row[:] for row in grid]
        grid = update_grid(grid, move)

        if grid != grid_copy:
            add_new_tile(grid)

        if is_game_over(grid):
            stdscr.addstr(size + 1, 0, "Game Over!")
            stdscr.refresh()
            stdscr.getch()
            break
curses.wrapper(main)
