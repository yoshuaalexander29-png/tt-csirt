with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove isAbout boolean
content = content.replace('  const isAbout = currentPath.startsWith("#") && currentPath !== "#/advisories";\n', '')

# Find the start and end of the About li
start_idx = content.find('<li className={`govuk-service-navigation__item${isAbout')
if start_idx != -1:
    end_idx = content.find('</a>\n                </li>\n              </ul>', start_idx)
    if end_idx != -1:
        # include the </a> and </li>
        end_idx += len('</a>\n                </li>\n')
        content = content[:start_idx] + content[end_idx:]
    
with open('src/App.tsx', 'w') as f:
    f.write(content)

