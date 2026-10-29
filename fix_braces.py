with open('src/styles/homepage.css', 'r') as f:
    lines = f.readlines()

count = 0
for line_num, line in enumerate(lines):
    for char in line:
        if char == '{':
            count += 1
        elif char == '}':
            count -= 1
    if count < 0:
        count = 0
    if count == 1 and line.startswith('@media'):
        print(f"Opening media at line {line_num+1}: {line.strip()}")
    
    if count > 1:
        pass # inside a block

print("Unclosed blocks if count > 0:", count)
