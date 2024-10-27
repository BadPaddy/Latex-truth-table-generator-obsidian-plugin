# LaTeX Truth Table Generator

This plugin enables the quick generation of truth tables for logical expressions written in LaTeX math syntax.

## How to Use

1. Select a math block written in LaTeX syntax, for example:
   ```latex
   $$((\text{True} \to \neg \neg ((q \vee (q \to (r \wedge (p \wedge \neg p)))) \to \neg \neg ((\neg \text{False}) \rightarrow p)))\vee (p \wedge (\text{True} \to q)))$$
   ```

2. Open the command line (Ctrl + P) and execute the command Generate truth table from LaTeX math.
3. A truth table for the selected math block will be generated.

### Supported Symbols
The plugin supports the following logical symbols:
    `\vee`, `\lor` — Logical OR
    `\wedge`, `\land` — Logical AND
    `{`, `}`, `(`, `)` — Grouping symbols
    `\overline`, `\neg` — Logical NOT
    `True`, `T`, `true`, `1` — Logical true values
    `False`, `F`, `false`, `0` — Logical false values
    `\to`, `\rightarrow`, `\Rightarrow` — Logical implication (if-then)
    `a`, `b`, ... — Variables from a - z