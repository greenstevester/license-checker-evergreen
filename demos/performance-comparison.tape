# VHS Tape: license-checker-evergreen Performance & Savings
#
# Usage: vhs demos/performance-comparison.tape

Output demos/performance-comparison.gif

Set Shell "bash"
Set FontSize 14
Set Width 800
Set Height 450
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 0ms
Set WindowBar Colorful
Set WindowBarSize 40

# Title
Type "license-checker-evergreen: Performance & Time Savings"
Enter
Type "=================================================="
Enter
Enter
Sleep 2s

# Playwright
Type "PLAYWRIGHT (6,328 packages)"
Enter
Type "  license-checker (original):     4.50s"
Enter
Type "  license-checker-evergreen:      1.90s  <- 2.4x FASTER"
Enter
Enter
Type "  CI runs/day: ~72"
Enter
Type "  Time saved/day: 187 seconds (3+ min)"
Enter
Type "  Time saved/month: 93 minutes"
Enter
Enter
Sleep 3s

# Puppeteer
Type "PUPPETEER (8,386 packages)"
Enter
Type "  license-checker (original):     2.50s"
Enter
Type "  license-checker-evergreen:      0.39s  <- 6.4x FASTER"
Enter
Enter
Type "  CI runs/day: ~9"
Enter
Type "  Time saved/day: 19 seconds"
Enter
Type "  Time saved/month: 9.5 minutes"
Enter
Enter
Sleep 3s

# Why faster
Type "WHY IT'S FASTER"
Enter
Type "  - Parallel file reading (50 concurrent operations)"
Enter
Type "  - Single-pass directory walking"
Enter
Type "  - Batched I/O operations"
Enter
Enter
Sleep 3s

# Migration
Type "MIGRATION (30 seconds)"
Enter
Type "  npm uninstall license-checker"
Enter
Type "  npm install license-checker-evergreen"
Enter
Enter
Type "Same CLI flags. Same output formats. Drop-in replacement."
Enter
Sleep 4s
