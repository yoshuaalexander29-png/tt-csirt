import re

with open('server.js', 'r') as f:
    content = f.read()

# Replace hardcoded PORT with process.env.PORT || 3000
content = content.replace(
    'const PORT = 3000;',
    'const PORT = process.env.PORT || 3000;'
)

with open('server.js', 'w') as f:
    f.write(content)

print("Port fixed")
