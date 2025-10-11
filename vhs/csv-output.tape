# CSV output demo for license-checker-evergreen
# Shows how to export license data to CSV format

Output demos/csv-output.gif

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
Type "# Export licenses to CSV format"
Sleep 500ms
Enter
Sleep 300ms

Type "license-checker-evergreen --csv --out licenses.csv"
Sleep 800ms
Enter

# Wait for command to complete
Sleep 2s

# Show the file was created
Sleep 500ms
Type "cat licenses.csv | head -10"
Sleep 500ms
Enter
Sleep 3s
