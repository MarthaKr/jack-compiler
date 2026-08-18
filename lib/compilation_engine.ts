import JackTokenizer from './jack_tokenizer.ts';
import { appendFileSync, writeFileSync } from 'node:fs';
import VMWriter from './vm_writer.ts';
import SymbolTable from './symbol_table.ts';

type Segment = 'constant' | 'argument' | 'local' | 'static' | 'this' | 'that' | 'pointer' | 'temp';
type Kind = 'STATIC' | 'FIELD' | 'ARG' | 'VAR';

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
  vm_writer: VMWriter;
  symbol_tabel: SymbolTable;

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
    this.vm_writer = new VMWriter(output_file);
    this.symbol_tabel = new SymbolTable();

    writeFileSync(this.output_file, ''); // Erstelle (und leere) die Datei
    if (this.tokenizer.hasMoreTokens()) {
      this.tokenizer.advance();
    }
  }

  private write(text: string): void {
    appendFileSync(this.output_file, text);
  }

  private compileType(): string {
    var type: string;
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
      type = this.tokenizer.keyWord
    }
    else if (this.tokenizer.tokenType == 'IDENTIFIER') {
      this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
      type = this.tokenizer.identifier;
    }
    else {
      throw new Error("type erwartet.")
    }
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    return type;
  }

  private getSegmentFromKind(kind: Kind): Segment {
    if (kind === 'ARG') {
      return 'argument';
    }
    else if (kind === 'VAR') return 'local'
    else if (kind === 'STATIC') return 'static'
    else {
      return 'this';
    }
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
    var className = this.tokenizer.identifier;
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
      this.compileSubroutine(className);
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
  compileSubroutine(className: string): void {

    this.symbol_tabel.startSubroutine();

    this.write("<subroutineDec>\n");
    this.write("<keyword> " + this.tokenizer.current_token + " </keyword>\n")

    // type / void / identifier
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance
    if ((!this.isType()) && (this.tokenizer.current_token != 'void')) {
      throw new Error('SubroutineDec: kein type.')
    }
    if (this.tokenizer.tokenType === 'KEYWORD') this.write("<keyword> " + this.tokenizer.current_token + " </keyword>\n")
    else this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n");

    // subroutine Name
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance() // advance
    if (this.tokenizer.tokenType != 'IDENTIFIER') {
      throw new Error("SubroutineDec: kein subroutineName")
    }
    var subroutineName = this.tokenizer.current_token;
    this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n")

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
    //console.log(this.tokenizer.current_token);
    var localVarCnt = 0;
    while (this.tokenizer.current_token === 'var') {
      //console.log("compileVarDec");
      localVarCnt += this.compileVarDec()
      //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance(); // advance  ?
    }

    //console.log("generate code for function: ", className + '.' + subroutineName, localVarCnt)
    this.vm_writer.writeFunction(className + '.' + subroutineName, localVarCnt);

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
    // zeigt am Anfang hinter die erste Klammer, danach auf letzte Klammer
    this.write("<parameterList>\n")
    if (this.tokenizer.tokenType === "KEYWORD") {
      // mindestens ein Parameter

      // Datentyp
      if (!this.isType() && this.tokenizer.current_token != "void") throw new Error("parameterList: Datentyp fehlt");
      var current_type = this.tokenizer.current_token!;
      this.write("<keyword> " + current_type + " </keyword>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

      // Parameterbezeichnung
      if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("parameterList: Parametername fehlt");
      var current_var_name = this.tokenizer.identifier;
      this.write("<identifier> " + current_var_name + " </identifier>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

      this.symbol_tabel.define(current_var_name, current_type, 'ARG');

      // weitere Parameter
      while (this.tokenizer.tokenType === 'SYMBOL' && this.tokenizer.symbol == ',') { // Komma
        this.write("<symbol> , </symbol>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        else break; // sonst Gefahr einer Endlosschleife

        // Datentyp
        if (!this.isType() && this.tokenizer.current_token != "void") throw new Error("parameterList: Datentyp fehlt");
        current_type = this.tokenizer.current_token!;
        this.write("<keyword> " + this.tokenizer.current_token + " </keyword>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

        // Parameterbezeichnung
        if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("parameterList: Parametername fehlt");
        current_var_name = this.tokenizer.identifier;
        this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

        this.symbol_tabel.define(current_var_name, current_type, 'ARG');
      }

    }
    //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.write("</parameterList>\n")
  }

  /** Kompiliert eine lokale `var`-Deklaration. 
   * returns: Anzahl der lokalen Variablen in dieser Zeile
  */
  compileVarDec(): number {

    var cnt = 1;
    this.write("<varDec>\n");
    // 'var'
    this.write("<keyword> var </keyword>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // type
    var current_type = this.compileType();

    // varName
    //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.tokenType === 'IDENTIFIER') {
      this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n")
      this.symbol_tabel.define(this.tokenizer.identifier, current_type, 'VAR')
    }
    else {
      //console.log(this.tokenizer.current_token)
      throw new Error("varDec: identifier erwartet")
    }

    // mehr varName
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    while (this.tokenizer.current_token == ',') {
      this.write("<symbol> , </symbol>\n")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
      if (this.tokenizer.tokenType === 'IDENTIFIER') {
        cnt++;
        this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n")
        this.symbol_tabel.define(this.tokenizer.identifier, current_type, 'VAR')
      }
      else throw new Error("varDec: identifier nach Komma erwartet")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    }

    // ;
    //console.log(this.tokenizer.current_token);
    if (this.tokenizer.current_token == ';') {
      this.write("<symbol> ; </symbol>\n")
    }
    else throw new Error("varDec: Semikolon fehlt");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    this.write("</varDec>\n")
    return cnt;
  }


  /** Kompiliert eine Folge von Statements ohne die umschliessenden geschweiften Klammern. */
  compileStatements(): void {
    // TODO: Wähle anhand des Keywords die passende compileXxx-Methode.
    this.write("<statements>\n");
    while (this.tokenizer.tokenType === 'KEYWORD') {
      switch (this.tokenizer.keyWord) {
        case "DO": {
          this.compileDo();
          break;
        }
        case "LET": {
          this.compileLet();
          break;
        }
        case "WHILE": {
          this.compileWhile();
          break;
        }
        case "RETURN": {
          this.compileReturn();
          break;
        }
        case "IF": {
          this.compileIf();
          break;
        }
      }
    }
    this.write("</statements>\n");
  }

  /**
   * Kompiliert einen Funktionsaufruf ab den Klammern für die Argumente
   * returns: wie viele Argumente die Funktion braucht
   */
  compileSubroutineCallPart2(): number {

    // (
    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != '(') throw new Error("subroutineCall: öffnende Klammer erwartet")
    this.write("<symbol> ( </symbol>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // expressionList
    var argCnt: number = this.compileExpressionList();

    // )
    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != ')') {
      console.log(this.tokenizer.current_token!);
      throw new Error("subroutineCall: schließende Klammer erwartet")
    }
    this.write("<symbol> ) </symbol>\n");

    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    return argCnt;
  }

  /** Kompiliert ein `do`-Statement. */
  compileDo(): void {
    this.write("<doStatement>\n")
    this.write("<keyword> do </keyword>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // subroutineCall
    if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("subroutineCall: Indentifier erwartet")
    this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    while (this.tokenizer.tokenType === 'SYMBOL' && this.tokenizer.symbol === '.') {
      this.write("<symbol> . </symbol>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
      if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("subroutineCall: nach Punkt wird Identifier erwartet")
      this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");

      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    }

    this.compileSubroutineCallPart2();

    if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != ';') throw new Error("doStatement: Semmikolon fehlt")
    this.write("<symbol> ; </symbol>\n")

    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
    this.write("</doStatement>\n")
  }

  /** Kompiliert ein `let`-Statement. */
  compileLet(): void {
    this.write("<letStatement>\n<keyword> let </keyword>\n")

    // varName
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    if (this.tokenizer.tokenType != 'IDENTIFIER') {
      throw new Error('letStatement: erwartet "varName".')
    }
    this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n")


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
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    }

    // =
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
    //if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    //console.log(this.tokenizer.current_token);
    if (this.tokenizer.current_token != ';') {
      throw new Error('letStatement: erwartet ";".')
    }
    this.write("<symbol> ; </symbol>\n</letStatement>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
  }

  /** Kompiliert ein `while`-Statement. */
  compileWhile(): void {
    // TODO: Folge der Grammatik für `whileStatement`.
    this.write("<whileStatement>\n<keyword> while </keyword>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // (
    if (this.tokenizer.current_token != '(') {
      throw new Error('whileStatement: erwartet "(".')
    }
    this.write("<symbol> ( </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // call expression
    this.compileExpression()

    // )
    if (this.tokenizer.current_token != ')') {
      throw new Error('whileStatement: erwartet ")".')
    }
    this.write("<symbol> ) </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // {
    if (this.tokenizer.current_token != '{') {
      throw new Error('whileStatement: erwartet "{".')
    }
    this.write("<symbol> { </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // call statements
    this.compileStatements()

    // }
    if (this.tokenizer.current_token != '}') {
      throw new Error('whileStatement: erwartet "}".')
    }
    this.write("<symbol> } </symbol>\n</whileStatement>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
  }

  /** Kompiliert ein `return`-Statement. */
  compileReturn(): void {
    // TODO: Berücksichtige die optionale Expression vor dem Semikolon.
    if (this.tokenizer.current_token != 'return') {
      throw new Error('returnStatement: erwartet "return".')
    }
    this.write("<returnStatement>\n<keyword> return </keyword>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

    // expression
    if (this.tokenizer.current_token != ';') {
      this.compileExpression()
    }

    // ;
    if (this.tokenizer.current_token != ';') {
      throw new Error('returnStatement: erwartet ";".')
    }
    this.write("<symbol> ; </symbol>\n</returnStatement>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
  }

  /** Kompiliert ein `if`-Statement, gegebenenfalls mit `else`-Zweig. */
  compileIf(): void {
    // TODO: Folge der Grammatik für `ifStatement`, inklusive optionalem `else`.
    this.write("<ifStatement>\n<keyword> if </keyword>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // (
    if (this.tokenizer.current_token != '(') {
      throw new Error('ifStatement: erwartet "(".')
    }
    this.write("<symbol> ( </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // call expression
    this.compileExpression()

    // )
    if (this.tokenizer.current_token != ')') {
      throw new Error('ifStatement: erwartet ")".')
    }
    this.write("<symbol> ) </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // {
    if (this.tokenizer.current_token != '{') {
      throw new Error('ifStatement: erwartet "{".')
    }
    this.write("<symbol> { </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // call statements
    this.compileStatements()

    // }
    if (this.tokenizer.current_token != '}') {
      throw new Error('ifStatement: erwartet "}".')
    }
    this.write("<symbol> } </symbol>\n")
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

    // else?
    if (this.tokenizer.current_token === 'else') {
      this.write("<keyword> else </keyword>\n")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

      // {
      if (this.tokenizer.current_token != '{') {
        throw new Error('ifStatement elseBlock: erwartet "{".')
      }
      this.write("<symbol> { </symbol>\n")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance

      // call statements
      this.compileStatements()

      // }
      if (this.tokenizer.current_token != '}') {
        throw new Error('ifStateme elseBlocknt: erwartet "}".')
      }
      this.write("<symbol> } </symbol>\n")
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();         // advance
    }
    this.write("</ifStatement>\n");
  }

  /** Kompiliert einen Ausdruck. */
  compileExpression(): void {
    // TODO: Kompiliere `term (op term)*`.
    this.write("<expression>\n");
    this.compileTerm();

    while (this.tokenizer.tokenType === 'SYMBOL' && ['+', '-', '*', '/', '&', '|', '<', '>', '='].includes(this.tokenizer.symbol)) {
      this.write("<symbol> " + this.tokenizer.symbol + " </symbol>\n");
      if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
      this.compileTerm();
    }
    this.write("</expression>\n");
  }

  /**
   * Kompiliert einen Term.
   *
   * Bei einem Identifier unterscheidet ein Lookahead zwischen Variable,
   * Array-Zugriff und Subroutine-Aufruf. Nur `[`, `(` und `.` leiten die
   * beiden letztgenannten Formen ein.
   */
  compileTerm(): void {
    // Bei einem Identifier helfen `[`, `(` und `.` als ein Token Lookahead.
    /*if (this.tokenizer.tokenType != 'IDENTIFIER') throw new Error("term: einzelner Identifier erwartet");
    this.write("<identifier> " + this.tokenizer.identifier + " </identifier>\n");
    if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();*/

    this.write("<term>\n");

    switch (this.tokenizer.tokenType) {
      case ("INT_CONST"): {
        // integerConstant
        this.write("<integerConstant> " + this.tokenizer.current_token + " </integerConstant> \n");
        this.vm_writer.writePush("constant", this.tokenizer.intVal);
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        break;
      }
      case ("STRING_CONST"): {
        // stringConstant
        // #TODO: stringConstant übersetzen
        this.write("<stringConstant> " + this.tokenizer.current_token + " </stringConstant> \n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        break;
      }
      case ("KEYWORD"): {
        //console.log(this.tokenizer.keyWord);
        if (["true", "false", "null", "this"].includes(this.tokenizer.current_token)) {
          // keyword constant
          this.write("<keyword> " + this.tokenizer.current_token + " </keyword>\n");
          if (this.tokenizer.keyWord === 'true') {
            this.vm_writer.writePush("constant", -1);
          }
          else if (this.tokenizer.keyWord === 'false') {
            this.vm_writer.writePush("constant", 0);
          }
          else if (this.tokenizer.keyWord === 'this') {
            this.vm_writer.writePush("pointer", 0); // #TODO: soll this so ausgewertet werden?
          }
          // #TODO: null übersetzen
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        }
        else throw new Error("term: ungültiges Keyword")
        break;
      }
      case ("SYMBOL"): {
        // (expression) ODER unaryOp term
        if (this.tokenizer.symbol === '(') {
          this.write("<symbol> ( </symbol>\n");
          // (expression)
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
          else throw new Error("term nicht beendet");
          this.compileExpression();
          if (this.tokenizer.tokenType != 'SYMBOL' || this.tokenizer.symbol != ')') throw new Error('term: erwartet ")"')
          this.write("<symbol> ) </symbol>\n");
          this.tokenizer.advance();
        }
        else if (['~', '-'].includes(this.tokenizer.symbol)) {
          // unaryOp term
          var unaryOpSymbol = this.tokenizer.current_token;
          if (this.tokenizer.current_token === '~') {
            this.write('<symbol> ~ </symbol>\n')
          }
          else {
            this.write('<symbol> - </symbol>\n')
          }
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
          this.compileTerm();
          if (unaryOpSymbol === '~') {
            this.vm_writer.writeArithmetic("NOT");
          }
          else {
            this.vm_writer.writeArithmetic("NEG");
          }
        }
        else throw new Error("term: ungültiges Zeichen")
        break;
      }
      case ("IDENTIFIER"): {
        // subroutineCall ODER varName ODER varName[expression]
        //let varName: string[] = [this.tokenizer.current_token!];
        let varName: string = this.tokenizer.current_token!;
        this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n")
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

        /*while (this.tokenizer.current_token === '.') {
          this.write('<symbol> . </symbol>\n')
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
          if (this.tokenizer.tokenType === 'IDENTIFIER') {
            this.write("<identifier> " + this.tokenizer.current_token + " </identifier>\n")
            varName.push(this.tokenizer.current_token);
            if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
          }
          else throw new Error("term: ungültiger subroutineName oder varName")
        }*/
        // wenn . -> subroutineCall einer anderen Klasse
        if (this.tokenizer.current_token === '.') {
          // #TODO: Methoden / Funktionsaufruf übersetzen
          this.write("<symbol> . </symbol>\n");
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();

          if (this.tokenizer.tokenType === 'IDENTIFIER') {
            var subroutineName = this.tokenizer.current_token;
            this.write("<identifier> " + subroutineName + " </identifier>\n")
            if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
            var kind = this.symbol_tabel.kindOf(varName);
            var originClass = varName;
            var argCnt = 0;
            if (kind != 'NONE') {
              // Methodenaufruf --> this pushen
              argCnt++;
              this.vm_writer.writePush(this.getSegmentFromKind(kind), this.symbol_tabel.indexOf(varName));
              originClass = this.symbol_tabel.typeOf(varName);
            }
          }
          else throw new Error("term: ungültiger subroutineName oder varName")
          argCnt += this.compileSubroutineCallPart2(); // pusht alle Funktionsargumente

          console.log("Symboltabelle: ")
          console.log(this.symbol_tabel.subroutineTable);
          this.vm_writer.writeCall(originClass + '.' + subroutineName, argCnt);
        }
        // wenn [ -> expression
        else if (this.tokenizer.current_token === '[') {
          // #TODO: Arrayzugriff übersetzen
          this.write("<symbol> [ </symbol>\n")
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
          this.compileExpression()
          if (this.tokenizer.current_token != ']') throw new Error("term: erwartet ]")
          this.write("<symbol> ] </symbol>\n")
          if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        }
        // wenn ( -> subroutineCall
        else if (this.tokenizer.current_token === '(') {
          this.compileSubroutineCallPart2();
        }
        // wenn nichts -> varName (nichts mehr zu tun)
        else {
          // #TODO: Zugriff auf Variable übersetzen
        }
        break;
      }
    }
    this.write("</term>\n");
  }

  /** Kompiliert eine möglicherweise leere, durch Kommas getrennte Ausdrucksliste. */
  compileExpressionList(): number {
    var cnt: number = 0
    this.write("<expressionList>\n");
    if (this.tokenizer.current_token != ")") {
      this.compileExpression();
      cnt++;
      while (this.tokenizer.tokenType === 'SYMBOL' && this.tokenizer.symbol === ',') {
        this.write("<symbol> , </symbol>\n");
        if (this.tokenizer.hasMoreTokens()) this.tokenizer.advance();
        this.compileExpression();
        cnt++;
      }
    }
    this.write("</expressionList>\n")
    return cnt;
  }
}
