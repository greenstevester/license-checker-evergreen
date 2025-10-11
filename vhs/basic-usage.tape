# Basic usage demo for license-checker-evergreen
# Shows the default tree output format

Output demos/basic-usage.gif

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
Type "# Scan current project for licenses"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen"
Sleep 800ms
Enter

# Wait for output to complete
Sleep 4s

# Show the output
Sleep 2s
