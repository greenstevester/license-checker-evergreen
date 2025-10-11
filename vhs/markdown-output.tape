# Markdown output demo for license-checker-evergreen
# Shows how to export license data in Markdown format

Output demos/markdown-output.gif

Set Shell "bash"
Set FontSize 15
Set Width 1400
Set Height 800
Set Padding 20
Set Theme "Dracula"
Set TypingSpeed 50ms
Set PlaybackSpeed 1.25
Set WindowBar "Colorful"

# Hide prompt setup
Hide
Type "PS1='$ '" Enter
Type "clear" Enter
Show

# Show the command
Type "# Generate Markdown documentation of licenses"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --markdown --relativeModulePath | head -30"
Sleep 800ms
Enter

# Wait for output
Sleep 4s

# Hold on result
Sleep 2s
