import JackTokenizer from './jack_tokenizer.ts';
import { appendFileSync, writeFileSync } from 'node:fs';

/**
 * Parst ein Jack-Programm und schreibt seine Struktur als XML in eine Datei.
 *
 * Jede `compile...`-Methode setzt voraus, dass das zugehörige
 * Grammatikelement als Nächstes im Tokenizer folgt. Sie liest genau dieses
 * Element, setzt den Tokenizer auf das folgende Token und gibt dessen XML aus.
 *
 * Gibt einen Fehler zurück, wenn das Programm nicht richtig kompiliert
 */
export default class CompilationEngine {
  tokenizer: JackTokenizer;
  output_file: string;

  /**
   * Erstellt eine Compilation Engine.
   *
   * @param input_file Pfad der jack-Eingabedatei.
   * @param output_file Pfad der XML-Ausgabedatei.
   * @remarks Der erste Aufruf muss `compileClass()` sein.
   */
  constructor(input_file: string, output_file: string) {
    this.tokenizer = new JackTokenizer(input_file);
    this.output_file = output_file;

    writeFileSync(this.output_file, ''); // Erstelle (und leere) die Datei
    if (this.tokenizer.hasMoreTokens()) {
      this.tokenizer.advance();
    }
  }

  private write(text: string): void {
    appendFileSync(this.output_file, text);
  }

  private compileType(): void {
    if (this.tokenizer.tokenType == 'KEYWORD') {
      switch (this.tokenizer.keyWord) {
        case 'INT':
          this.write("<keyword> int </keyword>\n");
          break;
        case 'CHAR':
          this.write("<keyword> char </keyword>\n");
          break;
        case 'BOOLEAN':
          this.write("<keyword> boolean </keyword>\n");
          break;
        default:
          throw new Error("type: ungültiges Keyword.")
      }
    }
    else if (this.tokenizer.tokenType == 'IDENTIFIER') {
      this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
    }
    else {
      throw new Error("type erwartet.")
    }
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
  }

  private isType(): boolean {
    return (this.tokenizer.tokenType == 'IDENTIFIER' || (this.tokenizer.tokenType == 'KEYWORD' && ['INT', 'CHAR', 'BOOLEAN'].includes(this.tokenizer.keyWord)));
  }

  /** Kompiliert eine vollständige Klassendeklaration. */
  compileClass(): void {
    this.write("<class>\n");
    this.write("<keyword> class </keyword>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("class: Klassenname erwartet.");
    this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != '{') throw new Error("class: Klammer '{' erwartet.");
    this.write("<symbol> { </symbol>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // kompiliere classVarDec
    while (this.tokenizer.tokenType == 'KEYWORD' &&
      ['STATIC', 'FIELD'].includes(this.tokenizer.keyWord)) {
      this.compileClassVarDec();
    }
    while (this.tokenizer.tokenType == 'KEYWORD' &&
      ['CONSTRUCTOR', 'FUNCTION', 'METHOD'].includes(this.tokenizer.keyWord)) {
      this.compileSubroutine();
    }
    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != '}') throw new Error("class: Klammer '}' erwartet.");
    this.write("<symbol> } </symbol>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.write("</class>\n");
  }

  /** Kompiliert eine `static`- oder `field`-Deklaration. */
  compileClassVarDec(): void {
    this.write("<classVarDec>\n");

    if (this.tokenizer.tokenType != 'KEYWORD' || !['STATIC', 'FIELD'].includes(this.tokenizer.keyWord)) {
      throw new Error("classVarDec: static oder field erwartet.");
    }
    this.write("<keyword> " + this.tokenizer.keyWord.toLowerCase() + " </keyword>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.compileType();
    if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("classVarDec: varName erwartet.");
    this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    while (this.tokenizer.tokenType == 'SYMBOL' && this.tokenizer.symbol == ',') {
      this.write("<symbol> , </symbol>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
      if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("classVarDec: Komma zu viel.");
      this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    }

    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != ';') throw new Error("classVarDec: Semikolon fehlt.");
    this.write("<symbol> ; </symbol>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.write("</classVarDec>\n");
  }

  /** Kompiliert eine vollständige `constructor`-, `function`- oder `method`-Deklaration. */
  compileSubroutine(): void {
    // TODO: Folge der Grammatik für `subroutineDec`.

    this.write("<subroutineDec>\n");
    this.write("<keyword>" + this.tokenizer.current_token + "</keyword>\n")

    // type / void
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
    if ((!this.isType()) && (this.tokenizer.current_token != 'void')) {
      throw new Error('SubroutineDec: kein type.')
    }
    this.write("<keyword>" + this.tokenizer.current_token + "</keyword>\n")

    // subroutine Name
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance() // advance
    if (this.tokenizer.tokenType != 'IDENTIFIER') {
      throw new Error("SubroutineDec: kein subroutineName")
    }
    this.write("<stringConstant>" + this.tokenizer.current_token + "</stringConstant>\n")

    // (
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance() // advance
    if (this.tokenizer.current_token != '(') {
      throw new Error('SubroutineDec: erwartet "(".')
    }
    this.write("<symbol> ( </symbol>\n")

    // call ParameterList
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
    this.compileParameterList()

    // )
    //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
    if (this.tokenizer.current_token != ')') {
      throw new Error('SubroutineDec: erwartet ")".')
    }
    this.write("<symbol> ) </symbol>\n")

    // subroutineBody
    // {
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
    if (this.tokenizer.current_token != '{') {                     // Subroutine Body
      throw new Error('SubroutineDec: erwartet "{".')
    }
    this.write("<subroutineBody>\n<symbol> { </symbol>\n")

    // call varDec
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
    while (this.tokenizer.current_token == 'var') {
      this.compileVarDec()
      //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance  ?
    }

    // statements
    this.compileStatements()                                      // statements

    // }
    //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance 
    if (this.tokenizer.current_token != '}') {                     // 
      throw new Error('SubroutineDec: erwartet "}".')
    }
    this.write("<symbol> } </symbol>\n</subroutineBody>\n</subroutineDec>\n")        // Ende subroutineBody, Ende subroutineDec                // }


    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
  }

  /** Kompiliert eine möglicherweise leere Parameterliste. */
  compileParameterList(): void {
    // TODO: Implementiere die möglicherweise leere, komma-getrennte Liste.
    // zeigt am Anfang hinter die erste Klammer, danach auf letzte Klammer
    this.write("<parameterList>\n")
    if (this.tokenizer.tokenType === "KEYWORD") {
      // mindestens ein Parameter

      // Datentyp
      if (!this.isType() && this.tokenizer.current_token != "void") throw new Error("parameterList: Datentyp fehlt");
      this.write("<keyword> " + this.tokenizer.current_token + " </keyword>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

      // Parameterbezeichnung
      if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("parameterList: Parametername fehlt");
      this.write("<identifier> " + this.tokenizer.identifier + "</identifier>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

      // weitere Parameter
      while (this.tokenizer.tokenType === 'SYMBOL' && this.tokenizer.symbol == ',') { // Komma
        this.write("<symbol> , </symbol>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        else break; // sonst Gefahr einer Endlosschleife

        // Datentyp
        if (!this.isType() && this.tokenizer.current_token != "void") throw new Error("parameterList: Datentyp fehlt");
        this.write("<keyword> " + this.tokenizer.current_token + " </keyword>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

        // Parameterbezeichnung
        if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("parameterList: Parametername fehlt");
        this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
      }

    }
    //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.write("</parameterList>\n")
  }

  /** Kompiliert eine lokale `var`-Deklaration. */
  compileVarDec(): void {
    // TODO: Folge der Grammatik für `varDec`.        // muss advance!!

    // 'var'
    this.write("<keyWord> var </keyword>\n")

    // type
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    if (!this.isType()) {
      throw new Error('VarDec: kein type.')
    }
    this.write("<keyword>" + this.tokenizer.current_token + "</keyword>\n")

    // varName
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.tokenType != 'STRING_CONSTANT') {
      this.write("<identifier>" + this.tokenizer.current_token + "</identifier>\n")
    }

    // mehr varName
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    while (this.tokenizer.current_token == ',') {
      this.write("<symbol> , </symbol>\n")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
      if (this.tokenizer.tokenType != 'STRING_CONSTANT') {
        this.write("<identifier>" + this.tokenizer.current_token + "</identifier>\n")
      }
    }

    // ;
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.current_token == ';') {
      this.write("<symbol> ; </symbol>\n")
    }
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
  }


  /** Kompiliert eine Folge von Statements ohne die umschliessenden geschweiften Klammern. */
  compileStatements(): void {
    // TODO: Wähle anhand des Keywords die passende compileXxx-Methode.
    while (this.tokenizer.tokenType === 'KEYWORD') {
      switch (this.tokenizer.keyWord) {
        case "DO": {
          this.compileDo();
        }
        case "LET": {
          this.compileLet();
        }
        case "WHILE": {
          this.compileWhile();
        }
        case "RETURN": {
          this.compileReturn();
        }
        case "IF": {
          this.compileIf();
        }
      }
    }
  }

  /** Kompiliert ein `do`-Statement. */
  compileDo(): void {
    this.write("<doStatement>\n")
    this.write("<keyword> do </keyword>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // subroutineCall
    if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("doStatement: Indentifier erwartet")
    this.write("<identifier> " + this.tokenizer.identifier + " </identifier>")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    if (this.tokenizer.tokenType === 'SYMBOL' && this.tokenizer.symbol === '.') {
      this.write("<symbol> . </symbol>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
      if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("doStatement: nach Punkt wird Identifier erwartet")
      this.write("<identifier> " + this.tokenizer.identifier + "</identifier>\n");

      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    }

    // (
    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != '(') throw new Error("doStatement: öffnende Klammer erwartet")
    this.write("<symbol> ( </symbol>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // expressionList
    this.compileExpression();

    // )
    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != ')') throw new Error("doStatement: schließende Klammer erwartet")
    this.write("<symbol> ) </symbol>\n");

    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != ';') throw new Error("doStatement: Semmikolon fehlt")

    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.write("</doStatement>")
  }

  /** Kompiliert ein `let`-Statement. */
  compileLet(): void {
    // TODO: Folge der Grammatik für `letStatement`.
    this.write("<letStatement>\n<keyword> let </keyword>\n")

    // varName
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.tokenType != 'STRING_CONSTANT') {
      throw new Error('letStatement: erwartet "varName".')
    }
    this.write("<identifier>" + this.tokenizer.current_token + "</identifier>\n")


    // expression ?
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.current_token === '[') {
      this.write("<symbol> [ </symbol>\n")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
      //call expression
      this.compileExpression()
      if (this.tokenizer.current_token === ']') {
        this.write("<symbol> ] </symbol>\n")
      }
    }

    // =
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.current_token === '=') {
      this.write("<symbol> = </symbol>\n")
    }
    else {
      throw new Error('letStatement: erwartet "=".')
    }

    // call expression
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    this.compileExpression()

    // ;
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.current_token != ';') {
      throw new Error('letStatement: erwartet ";".')
    }
    this.write("<symbol> ; <s/ymbol>\n</letStatement>\n")
  }

  /** Kompiliert ein `while`-Statement. */
  compileWhile(): void {
    // TODO: Folge der Grammatik für `whileStatement`.
    throw new Error('TODO: compileWhile implementieren.');
  }

  /** Kompiliert ein `return`-Statement. */
  compileReturn(): void {
    // TODO: Berücksichtige die optionale Expression vor dem Semikolon.
    throw new Error('TODO: compileReturn implementieren.');
  }

  /** Kompiliert ein `if`-Statement, gegebenenfalls mit `else`-Zweig. */
  compileIf(): void {
    // TODO: Folge der Grammatik für `ifStatement`, inklusive optionalem `else`.
    throw new Error('TODO: compileIf implementieren.');
  }

  /** Kompiliert einen Ausdruck. */
  compileExpression(): void {
    // TODO: Kompiliere `term (op term)*`.
    this.compileTerm();

    while (this.tokenizer.tokenType === 'SYMBOL' && ['+', '-', '*', '/', '&', '|', '<', '>', '='].includes(this.tokenizer.symbol)) {
      this.write("<symbol> " + this.tokenizer.symbol + " </symbol>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
      this.compileTerm();
    }
  }

  /**
   * Kompiliert einen Term.
   *
   * Bei einem Identifier unterscheidet ein Lookahead zwischen Variable,
   * Array-Zugriff und Subroutine-Aufruf. Nur `[`, `(` und `.` leiten die
   * beiden letztgenannten Formen ein.
   */
  compileTerm(): void {
    // TODO: Unterscheide alle Formen der Grammatikregel `term`.
    // Bei einem Identifier helfen `[`, `(` und `.` als ein Token Lookahead.
    if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("term: einzelner Identifier erwartet");
    this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
  }

  /** Kompiliert eine möglicherweise leere, durch Kommas getrennte Ausdrucksliste. */
  compileExpressionList(): void {
    if (this.tokenizer.tokenType != 'SYMBOL') {
      this.compileExpression();
      while (this.tokenizer.tokenType === 'SYMBOL' && this.tokenizer.symbol === '(') {
        this.write("<symbol> , </symbol>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        this.compileExpression();
      }
    }
  }
}
