# License compliance check demo for license-checker-evergreen
# Shows how to fail builds if restricted licenses are found

Output demos/fail-on-licenses.gif

Set Shell "bash"
Set FontSize 28
Set Width 1400
Set Height 800
Set Padding 20
Set Theme "Dracula"
Set TypingSpeed 50ms
Set WindowBar "Colorful"

# Show the command
Type "# Fail build if GPL licenses are found (CI/CD compliance)"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --failOn 'GPL;AGPL;LGPL'"
Sleep 800ms
Enter

# Wait for output
Sleep 3s

# Hold on result
Sleep 2s
