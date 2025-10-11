# Find unknown licenses demo for license-checker-evergreen
# Shows how to identify packages with unknown or missing license information

Output demos/unknown-licenses.gif

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
Type "# Find packages with unknown licenses"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --onlyunknown --relativeModulePath"
Sleep 800ms
Enter

# Wait for output
Sleep 3s

# Hold on result
Sleep 2s
