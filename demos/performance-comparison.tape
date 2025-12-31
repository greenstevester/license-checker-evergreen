# VHS Tape: license-checker-evergreen Performance & Savings
#
# Usage: vhs demos/performance-comparison.tape

Output demos/performance-comparison.gif

Set Shell "bash"
Set FontSize 14
Set Width 700
Set Height 400
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 0ms
Set WindowBar Colorful
Set WindowBarSize 40

# Title
Type "echo 'license-checker-evergreen: Time Savings'"
Enter
Sleep 500ms
Enter
Sleep 1500ms

# Playwright
Type "echo 'PLAYWRIGHT (6,328 packages) - 2.4x faster'"
Enter
Sleep 500ms
Type "echo '  Per build:  2.6 seconds saved'"
Enter
Type "echo '  Per day:    3 minutes saved (72 CI runs)'"
Enter
Type "echo '  Per week:   21 minutes saved'"
Enter
Type "echo '  Per month:  93 minutes saved'"
Enter
Enter
Sleep 2500ms

# Puppeteer
Type "echo 'PUPPETEER (8,386 packages) - 6.4x faster'"
Enter
Sleep 500ms
Type "echo '  Per build:  2.1 seconds saved'"
Enter
Type "echo '  Per day:    19 seconds saved (9 CI runs)'"
Enter
Type "echo '  Per week:   2 minutes saved'"
Enter
Type "echo '  Per month:  9.5 minutes saved'"
Enter
Enter
Sleep 2500ms

# Migration
Type "echo 'SWITCH IN 30 SECONDS'"
Enter
Sleep 500ms
Type "echo '  npm uninstall license-checker'"
Enter
Type "echo '  npm install license-checker-evergreen'"
Enter
Enter
Type "echo 'Same CLI flags. Drop-in replacement.'"
Enter
Sleep 3s
