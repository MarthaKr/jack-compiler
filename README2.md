# Projekt 11: Compiler (Teil II) – Code Generation

## Zielsetzung

Ziel ist es, den Compiler aus Projekt 10, der XML ausgibt, in einen Compiler umzuwandeln, der VM-Code schreibt.

Die Hauptaufgabe ist, `compilation_engine.ts` aus Projekt 10 Stück für Stück umzuschreiben: Jede XML-Ausgabe wird durch passenden VM-Code ersetzt. `jack_tokenizer.ts` kann unverändert aus Projekt 10 übernommen werden. Die Starter für die neuen Hilfsklassen liegen in `lib/symbol_table.ts` und `lib/vm_writer.ts`.

Die Grammatik und das Vorrücken im Tokenizer bleiben dabei gleich. Nur die Wirkung der `compile...`-Methoden ändert sich: Statt einen Parse Tree zu serialisieren, hinterlassen sie den Wert eines Terms oder einer Expression auf dem VM-Stack oder erzeugen Befehle für ein Statement.


## Aufgabenstellung

### Stufe I: SymbolTable füllen

Implementiere `SymbolTable` und passe die Compilation Engine so an, dass sie die Tabelle beim Parsen füllt.

Es gibt zwei Scopes:

- Die Klassen-Tabelle enthält `static` und `field` und bleibt für die ganze Klasse bestehen.
- Die Subroutinen-Tabelle enthält `argument` und `var`. Sie muss zu Beginn jeder Subroutine geleert werden.

Definiere alle Namen genau dort, wo sie deklariert werden: in `compileClassVarDec()`, `compileParameterList()` und `compileVarDec()`. Bei einer Suche gewinnt die Subroutinen-Tabelle über die Klassen-Tabelle.

Die vier Arten werden später direkt zu VM-Segmenten:

| Art | VM-Segment |
|---|---|
| `VAR` | `local` |
| `ARG` | `argument` |
| `STATIC` | `static` |
| `FIELD` | `this` |

Zum Überprüfen kannst du vorübergehend die Identifier-Ausgabe aus Projekt 10 um `kind`, Definition/Benutzung und Index ergänzen. Diese XML-Debug-Ausgabe gehört nicht in den fertigen VM-Compiler.

- Tipp: `compileType()` sollte jetzt den gelesenen Typ zurückgeben, statt ihn auszugeben. So kannst du ihn direkt an `symbolTable.define(name, type, kind)` übergeben.
- Tipp: Speichere den Klassennamen beim Parsen von `class`. Der Dateiname ist meist gleich, aber der Klassenname wird für Methodenaufrufe und implizite Aufrufe innerhalb derselben Klasse gebraucht.

### Stufe II: Compiler schreiben

Implementiere den Compiler in dieser Reihenfolge und teste jeden Schritt für sich:

1. `VMWriter`: Jede `write...`-Methode sammelt genau einen gültigen VM-Befehl. `close()` schreibt alle Befehle in die Ausgabedatei.
2. Einfache Terms und Expressions: Konstanten und Variablen pushen, danach die Operatoren schreiben. Für `*` und `/` brauchst du `call Math.multiply 2` bzw. `call Math.divide 2`.
3. `let`, `do` und `return`: Eine Zuweisung poppt ins passende Segment; ein `do` verwirft den Rückgabewert mit `pop temp 0`.
4. `if` und `while`: Erzeuge für jede Struktur eindeutige Labels. Vor `if-goto` muss die Bedingung mit `not` negiert werden, nicht mit `neg`.
5. Subroutinen, Methoden und Konstruktoren: Schreibe zuerst `function Klasse.name nLocals`, dann den jeweiligen Prolog.
6. Arrays und Subroutine-Aufrufe: Diese brauchen zusätzliche Stack-Operationen und sind am einfachsten, wenn die übrigen Stufen bereits laufen.

`compileExpressionList()` muss nun die Anzahl ihrer Expressions als `number` zurückgeben. `compileSubroutineCall()` verwendet diese Zahl für `writeCall(name, nArgs)`.

## Vor dem Abschluss prüfen

Diese Fälle werden erst mit den späteren Testprogrammen sichtbar und dürfen nicht offen bleiben:

- **Rückgaben:** `compileReturn()` muss für jedes `return` den Wert auf dem Stack bereithalten und sofort `writeReturn()` schreiben. Bei `return;` vorher `push constant 0` schreiben. Ein einzelnes `return` am Ende von `compileSubroutine()` genügt nicht, etwa bei Rückgaben in einem `if`.
- **Methoden:** Zu Beginn einer `method` ist das versteckte Objekt `argument 0`. Lege deshalb vor den expliziten Parametern `this` als Argument 0 an und schreibe `push argument 0`, `pop pointer 0` in den Prolog.
- **Konstruktoren:** Ein `constructor` reserviert `field`-Anzahl Wörter mit `Memory.alloc` und setzt die Basisadresse mit `pop pointer 0`. Das `return this;` im Jack-Code kompiliert dann wie jede andere Rückgabe.
- **Aufrufe:** Bei `obj.m(args)` muss der Compiler `obj` als erstes Argument pushen, den Typ von `obj` für den Namen `Typ.m` verwenden und die Argumentzahl um eins erhöhen. Bei `Klasse.f(args)` wird kein Objekt gepusht. Ein Aufruf `m(args)` innerhalb einer Methode braucht ebenfalls `this` als erstes Argument.
- **Arrays:** Für `a[i]` zuerst Basisadresse und Index pushen, `add`, dann `pop pointer 1` und `push that 0`. Bei `let a[i] = value;` muss die Zieladresse erhalten bleiben, während `value` berechnet wird, zum Beispiel über `temp 0`, `pointer 1` und `that 0`.
- **Unäre Operatoren:** Nach dem Term folgt für `-term` `neg`, für `~term` `not`.
- **Labels:** Die Labels für `if` und `while` müssen innerhalb einer Ausgabedatei eindeutig sein.

## Testreihenfolge

Kompiliere und starte die Programme schrittweise im VM-Emulator:

1. `11/Seven` prüft Funktionen, verschachtelte Expressions und einen `do`-Aufruf.
2. `11/ConvertToBin` prüft `if`, `while` und Rückgaben.
3. `11/Square` prüft Objekte, Methoden und Konstruktoren.
4. `11/ComplexArrays` prüft Array-Lesen und -Schreiben.
5. `11/Pong` prüft das Zusammenspiel mehrerer Klassen.
