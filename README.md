# Projekt 10: Compiler (Teil I) – Tokenizer und Parser

## Zielsetzung

Output: `<xxx>...</xxx>`
non-terminals:

- `class`, `classVarDec`, `subroutineDec`, `parameterList`, `subroutineBody`, `varDec`
- `statements`, `whileStatement`, `ifStatement`, `returnStatement`, `letStatement`, `doStatement`
- `expression`, `term`, `expressionList`

terminals:

- lexical elements, also `keyword`, `symbol`, `integerConstant`, `stringConstant`, `identifier`

## Aufgabenstellung

Die Hauptaufgabe ist `jack_analyzer.ts`. Dazu braucht man in `lib/`:
- `jack_tokenizer.ts`: Tokenized eine `.jack` Datei
- `compilation_engine.ts`: Parsed eine tokenized Datei

### Stufe I: Tokenizer schreiben

Implementiere in `lib/jack_tokenizer.ts`:

1. `hasMoreTokens()` überspringt Leerzeichen und sagt, ob ein Token folgt.
2. `advance()` liest genau ein Token und aktualisiert `current_token`, `token_type` und `cursor`.
3. Die Getter geben die zum aktuellen Token passende Darstellung zurück.

Die Bereinigung von Kommentaren und `jack_analyzer-part_1.ts` sind schon fertig. Zum Testen:

```sh
node jack_analyzer-part_1.ts test/Square
node text_comparer.ts test/Square/MainT-test-build.xml test/Square/MainT.xml
```

### Stufe II: Parser schreiben

`compileClass()` und `compileClassVarDec()` sind vollständige Beispiele. Die Helfer `compileType()` und `isType()` darfst du benutzen.

1. Implementiere die übrigen Grammatikmethoden zunächst so, dass `test/ExpressionLessSquare` klappt.
2. Ergänze danach Expressions, Terms und Expression-Listen für `Square` und `ArrayTest`.

- im `ExpressionLessSquare` Programm ist der Hauptunterschied: alle expressions sind durch einen einzelnen identifier ersetzt (oder keywordConstant)
  - `compileExpression()` sollte also an `compileTerm()` verweisen, was zu diesem Zeitpunkt einen einzelnen identifier oder keywordConstant verarbeitet.

Für `compileTerm()`:

man braucht lookahead, um die identifier zu unterscheiden.
Ein einzelnes lookahead token reicht, entweder `[` (für array), oder `(` oder `.` (für `subroutineCall`)

- lookahead ist der Grund, warum `hasMoreTokens()` und `advance()` zwei getrennte Funktionen sind

## Testprogramme

Nutze die folgenden Programme zur schrittweisen Validierung.

`Square` und `ArrayTest` Programme

## Anleitung zur Validierung

Teste den Tokenizer:

1. Wende den Tokenizer auf die Programme `ArrayTest` und `Square` an.
2. Verwende das `text_comparer.ts` Skript, um deine Ausgabe mit der Lösung zu vergleichen.
  - das Skript ignoriert Leerzeichen (in den mitgelieferten Lösungen dienen diese nur der Orientierung)

Der vollständige Parser schreibt seine XML-Dateien in den jeweiligen `build/`-Ordner:

```sh
node jack_analyzer.ts test/ExpressionLessSquare
node text_comparer.ts test/ExpressionLessSquare/build/Main.xml test/ExpressionLessSquare/Main.xml
node jack_analyzer.ts test/Square
```

Teste den Parser

## Zusatzaufgaben

- Fehlermeldungen des compilers verfeinern. Insbesondere, Zeilenangaben machen.
