# VHS Tape: license-checker vs license-checker-evergreen Performance Comparison
#
# Usage: vhs demos/performance-comparison.tape
# Output: demos/performance-comparison.gif

Output demos/performance-comparison.gif

Set Shell "bash"
Set FontSize 14
Set Width 900
Set Height 400
Set Theme "Dracula"
Set Padding 15
Set TypingSpeed 50ms
Set WindowBar Colorful
Set WindowBarSize 40

# Start in test directory
Hide
Type "cd /tmp/license-comparison/large-project"
Enter
Sleep 500ms
Show

# Title
Type "# Performance: license-checker vs license-checker-evergreen"
Enter
Type "# Project: 3,339 packages"
Enter
Enter
Sleep 1500ms

# Run evergreen
Type "echo '⚡ Running license-checker-evergreen...' && time license-checker-evergreen --json > /dev/null"
Enter
Sleep 2s

Enter
Sleep 500ms

# Run original
Type "echo '🐢 Running original license-checker...' && time license-checker --json > /dev/null"
Enter
Sleep 3s

Enter
Enter
Type "# Result: license-checker-evergreen is ~3x FASTER! 🚀"
Enter
Sleep 3s
