# Production dependencies demo for license-checker-evergreen
# Shows how to scan only production dependencies

Output demos/production-only.gif

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
Type "# Scan only production dependencies (no devDependencies)"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --production"
Sleep 800ms
Enter

# Wait for output
Sleep 4s

# Hold on result
Sleep 2s
