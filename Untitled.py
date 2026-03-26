def find_start(maze):
    for i in range(len(maze)):
        for j in range(len(maze[0])):
            if maze[i][j] == 'S':
                return (i, j)

def dfs(maze, row, col, visited, path):
    # Check boundaries
    if row < 0 or col < 0 or row >= len(maze) or col >= len(maze[0]):
        return False

    # Check blocked or visited
    if maze[row][col] == '1' or (row, col) in visited:
        return False

    # Add to path
    path.append((row, col))
    visited.add((row, col))

    # Check goal
    if maze[row][col] == 'G':
        return True

    # Move in 4 directions
    if (dfs(maze, row+1, col, visited, path) or
        dfs(maze, row-1, col, visited, path) or
        dfs(maze, row, col+1, visited, path) or
        dfs(maze, row, col-1, visited, path)):
        return True

    # Backtrack
    path.pop()
    return False


# Main program
maze = [
    ['S', '0', '1', '0'],
    ['1', '0', '1', '0'],
    ['0', '0', '0', '1'],
    ['1', '1', '0', 'G']
]

start = find_start(maze)

visited = set()
path = []

if dfs(maze, start[0], start[1], visited, path):
    print("Path found:")
    print(path)
else:
    print("No path exists")