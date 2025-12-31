# VHS Tape: license-checker-evergreen Performance
#
# Usage: vhs demos/performance-comparison.tape

Output demos/performance-comparison.gif

Set Shell "bash"
Set FontSize 14
Set Width 750
Set Height 400
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 50ms
Set WindowBar Colorful
Set WindowBarSize 40

# Playwright comparison
Type "cd /tmp/license-comparison/playwright"
Enter
Sleep 500ms

Type "time license-checker-evergreen --json > /dev/null 2>&1"
Enter
Sleep 3s

Type "time license-checker --json > /dev/null 2>&1"
Enter
Sleep 4s

Enter
Sleep 1s

# Puppeteer comparison
Type "cd /tmp/license-comparison/puppeteer"
Enter
Sleep 500ms

Type "time license-checker-evergreen --json > /dev/null 2>&1"
Enter
Sleep 3s

Type "time license-checker --json > /dev/null 2>&1"
Enter
Sleep 4s

Sleep 2s
