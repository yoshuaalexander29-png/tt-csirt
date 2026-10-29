with open('src/styles/homepage.css', 'r') as f:
    text = f.read()

count = 0
for i, char in enumerate(text):
    if char == '{':
        count += 1
    elif char == '}':
        count -= 1
    if count < 0:
        print(f"Extra closing brace at index {i}")
        count = 0

print(f"Final count (should be 0): {count}")
