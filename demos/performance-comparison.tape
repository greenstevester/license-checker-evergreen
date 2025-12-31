# VHS Tape: license-checker-evergreen Performance
#
# Usage: vhs demos/performance-comparison.tape

Output demos/performance-comparison.gif

Set Shell "bash"
Set FontSize 14
Set Width 700
Set Height 300
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 50ms
Set WindowBar Colorful
Set WindowBarSize 40

Hide
Type "cd /tmp/license-comparison/large-project"
Enter
Sleep 500ms
Show

Type "time license-checker-evergreen --json > /dev/null"
Enter
Sleep 2s

Enter

Type "time license-checker --json > /dev/null"
Enter
Sleep 3s

Sleep 2s
