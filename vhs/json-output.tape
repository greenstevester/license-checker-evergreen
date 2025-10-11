# JSON output demo for license-checker-evergreen
# Shows how to export license data to JSON format

Output demos/json-output.gif

Set Shell "bash"
Set FontSize 16
Set Width 1400
Set Height 800
Set Padding 20
Set Theme "Dracula"
Set TypingSpeed 50ms
Set WindowBar "Colorful"

# Hide prompt setup
Hide
Type "PS1='$ '" Enter
Type "clear" Enter
Show

# Show the command
Type "# Export licenses to JSON file"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --json --out licenses.json"
Sleep 800ms
Enter

# Wait for command to complete
Sleep 2s

# Show the file was created
Sleep 500ms
Type "ls -lh licenses.json"
Sleep 500ms
Enter
Sleep 1s

# Preview the JSON content
Type "head -20 licenses.json"
Sleep 500ms
Enter
Sleep 3s
