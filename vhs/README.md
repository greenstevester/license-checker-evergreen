# VHS CLI Animations

This directory contains VHS tape files for generating animated GIF demonstrations of license-checker-evergreen CLI commands.

## What is VHS?

[VHS](https://github.com/charmbracelet/vhs) is a tool from Charm that allows you to write terminal GIFs as code. It's perfect for creating consistent, reproducible CLI demonstrations.

## Generated Animations

The following animations demonstrate key features of license-checker-evergreen:

| Animation | Description | Output File |
|-----------|-------------|-------------|
| `basic-usage.tape` | Default tree output format | `demos/basic-usage.gif` |
| `json-output.tape` | Export licenses to JSON format | `demos/json-output.gif` |
| `csv-output.tape` | Export licenses to CSV format | `demos/csv-output.gif` |
| `markdown-output.tape` | Generate Markdown documentation | `demos/markdown-output.gif` |
| `production-only.tape` | Show only production dependencies | `demos/production-only.gif` |
| `direct-deps.tape` | Show only direct dependencies | `demos/direct-deps.gif` |
| `unknown-licenses.tape` | Find packages with unknown licenses | `demos/unknown-licenses.gif` |
| `fail-on-licenses.tape` | License compliance checking for CI/CD | `demos/fail-on-licenses.gif` |

## Prerequisites

To generate or modify the animations, you need:

1. **VHS installed** (via Homebrew on macOS):
   ```bash
   brew install vhs
   ```

2. **Project built** (so the CLI is available):
   ```bash
   npm run build
   npm link
   ```

## Generating Animations

### Generate All Animations

Use the convenience script to generate all animations at once:

```bash
./vhs/generate-all.sh
```

This will:
- Create the `demos/` directory if it doesn't exist
- Generate all 8 GIF animations
- Output files to `demos/` directory

### Generate Individual Animation

To regenerate a specific animation:

```bash
vhs vhs/basic-usage.tape
```

## Modifying Animations

### Tape File Structure

Each `.tape` file consists of VHS commands that control the terminal simulation:

```tape
# Configuration
Output demos/example.gif          # Output file path
Set Shell "bash"                  # Shell to use
Set FontSize 16                   # Terminal font size (GitHub-standard)
Set Width 1400                    # Terminal width
Set Height 800                    # Terminal height
Set Theme "Dracula"               # Color theme
Set TypingSpeed 50ms              # Typing simulation speed
Set WindowBar "Colorful"          # Window decoration style

# Hide personal paths and set clean prompt
Hide
Type "PS1='$ '" Enter             # Set minimal prompt
Type "clear" Enter                # Clear screen
Show

# Commands
Type "command here"               # Simulate typing
Sleep 500ms                       # Pause
Enter                             # Press Enter key
```

### Available Themes

Common VHS themes:
- `Dracula` (current)
- `Monokai`
- `Solarized Dark`
- `GitHub Dark`
- `Nord`

### Timing Guidelines

Current timing pattern for consistency:
- Comment display: `Type` → `Sleep 500ms` → `Enter` → `Sleep 300ms`
- Command typing: `Type` → `Sleep 800ms` → `Enter`
- Command execution: `Sleep 3-4s` (depending on output length)
- Final hold: `Sleep 2s`

### Privacy Guidelines

To hide personal directory paths:
1. Use `Hide` before setting up the prompt
2. Set a minimal prompt: `Type "PS1='$ '" Enter`
3. Clear the screen: `Type "clear" Enter`
4. Use `Show` to resume recording

This ensures no personal directory information appears in the recordings.

## Style Guidelines

To maintain consistency with GitHub CLI animations:

1. **Clean and professional**: Use the Dracula theme with Colorful window bar
2. **Readable**: FontSize 16 (standard), 1400x800 dimensions
3. **Paced well**: Not too fast, not too slow (50ms typing speed)
4. **Contextual**: Show comments explaining what each command does
5. **Privacy-focused**: Use clean prompts without personal directory paths
6. **Complete**: Let commands finish and show meaningful output

## Publishing Animations

VHS includes a hosting service. To publish an animation:

```bash
vhs publish demos/basic-usage.gif
```

This will upload the GIF and provide a shareable URL.

## Tips for Creating New Animations

1. **Test locally first**: Build and link the project before recording
2. **Keep it short**: Aim for 5-10 seconds of actual content
3. **Add context**: Use comments to explain what's happening
4. **Check output**: Make sure the terminal is wide enough for output
5. **Consistent style**: Match the existing animations' look and feel

## Troubleshooting

### Command Not Found

If VHS can't find `license-checker-evergreen`:

```bash
npm run build
npm link
```

### Animation Too Fast/Slow

Adjust timing in the tape file:
- `Set TypingSpeed 50ms` - Change typing speed
- `Sleep 2s` - Add pauses between commands

### Terminal Size Issues

If output is cut off, increase dimensions:
```tape
Set Width 1600    # Wider terminal
Set Height 1000   # Taller terminal
```

## Resources

- [VHS Documentation](https://github.com/charmbracelet/vhs)
- [VHS Examples](https://github.com/charmbracelet/vhs/tree/main/examples)
- [GitHub CLI Animations](https://cli.github.com/) (inspiration)
