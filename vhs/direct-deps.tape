# Direct dependencies demo for license-checker-evergreen
# Shows how to scan only direct dependencies without traversing the tree

Output demos/direct-deps.gif

Set Shell "bash"
Set FontSize 28
Set Width 1400
Set Height 800
Set Padding 20
Set Theme "Dracula"
Set TypingSpeed 50ms
Set WindowBar "Colorful"

# Show the command
Type "# Scan only direct dependencies (no sub-dependencies)"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --direct"
Sleep 800ms
Enter

# Wait for output
Sleep 3s

# Hold on result
Sleep 2s
