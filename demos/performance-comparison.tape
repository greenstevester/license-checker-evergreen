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
Type "license-checker-evergreen: Time Savings"
Enter
Type "========================================"
Enter
Enter
Sleep 2s

# Playwright
Type "PLAYWRIGHT (6,328 packages) - 2.4x faster"
Enter
Type "  Per build:  2.6 seconds saved"
Enter
Type "  Per day:    3 minutes saved (72 CI runs)"
Enter
Type "  Per week:   21 minutes saved"
Enter
Type "  Per month:  93 minutes saved"
Enter
Enter
Sleep 3s

# Puppeteer
Type "PUPPETEER (8,386 packages) - 6.4x faster"
Enter
Type "  Per build:  2.1 seconds saved"
Enter
Type "  Per day:    19 seconds saved (9 CI runs)"
Enter
Type "  Per week:   2 minutes saved"
Enter
Type "  Per month:  9.5 minutes saved"
Enter
Enter
Sleep 3s

# Migration
Type "SWITCH IN 30 SECONDS"
Enter
Type "  npm uninstall license-checker"
Enter
Type "  npm install license-checker-evergreen"
Enter
Enter
Type "Same CLI flags. Drop-in replacement."
Enter
Sleep 4s
