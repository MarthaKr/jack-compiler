import * as fs from 'fs';

/**
 * Parsed eine einzelne .vm Datei,
 * liest VM Befehle und gibt einfachen Zugriff auf deren Bestandteile.
 * Entfernt Leerzeichen und Kommentare.
 */
export default class JackTokenizer {
  content: string;
  cursor: number = 0; // aktuelle Position im content String
  current_token?: string;
  token_type?: TokenType;
  keyword?: KeyWord;

  constructor(file_name: string) {
    // liest den Inhalt der Datei `file_name` in die Variable this.content
    this.content = fs.readFileSync(file_name, 'utf8');

    // entfernt Kommentare, die mit "/*" oder "/**" beginnen
    let x, y: number;
    x = this.content.indexOf("/*");
    try {
      while (x > -1) {
        y = this.content.indexOf("*/");
        if (y <= x + 1) throw new Error("Ungültiger Kommentar.");

        this.content = this.content.substring(0, x) + this.content.substring(y + 2);
        x = this.content.indexOf("/*");
      }
    }
    catch (error: any) {
      console.error("Fehler:", error.message);
    }

    this.content = this.content
      .replace('\t', ' ') // ersetzt Tab Zeichen durch Leerzeichen
      .split(/\r?\n/) // teilt in Zeilen auf
      .map(line => line.split('//')[0].trim()) // entfernt Kommentare die mit "//" beginnen, sowie Leerzeichen zu Beginn und Ende einer Zeile
      .filter(line => line.length > 0) // entfernt leere Zeilen
      .join(' '); // fügt den Inhalt zu einer einzelnen Zeile zusammen
  }

  /**
   * gibt es noch mehr Tokens in der Datei?
   */
  hasMoreTokens(): Boolean {
    // TODO: Überspringe Leerzeichen und prüfe, ob danach noch Inhalt folgt.
    let jetzt = this.cursor;
    let laenge : number
    laenge = this.content.length;
    while (this.content[jetzt] === ' ') {
      if ((jetzt + 1) < laenge){
        jetzt += 1;
      }
      else if ((jetzt + 1) >=  laenge) {
        return false
      }
    }
    if (this.content[jetzt] != ' ') {
      return true
    }
    return false;
  }

  /**
   * geht zum nächsten Token (aktualisiert this.cursor und this.current_token)
   * WARNING: darf nur aufgerufen werden, wenn hasMoreTokens() == true
   */
  advance() {
    // TODO: Lies ab `cursor` genau ein Token.
    // Setze `current_token`, `token_type` und `cursor` auf den neuen Stand.
    throw new Error('TODO: advance implementieren.');
  }

  /**
   * Gibt aktuellen tokenType zurück.
   * Mögliche Werte:
   * type TokenType = 'KEYWORD' | 'SYMBOL' | 'IDENTIFIER' | 'INT_CONST' | 'STRING_CONST';
   */
  get tokenType(): TokenType {
    // TODO: Gib den Typ des aktuellen Tokens zurück.
    if (this.current_token![0] === '"'){
      return 'STRING_CONST'}
    else if (['0', '1','2', '3', '4', '5', '6', '7', '8', '9'].includes(this.current_token![0])){
      return 'INT_CONST'}
    else if (['{', '}', '(', ')', '[', ']', '.', ',', ';', '+', '-', '*', '/', '&', '|', '<', '>', '=', '~'].includes(this.current_token![0])){
      return 'SYMBOL'
    }
    else if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].includes(this.current_token![0])) {
      return 'IDENTIFIER'
    }
    else if (['class', 'method', 'function', 'constructor', 'int', 'boolean'
  , 'char', 'void', 'var', 'static', 'field', 'let', 'do', 'if', 'else', 'while', 'return', 'true', 'false', 'null', 'this'].includes(this.current_token![0])) {
      return 'KEYWORD'
    }
    throw new Error('TODO: tokenType implementieren.');
  }

  /**
   * Gibt aktuelles Keyword zurück. Sollte nur aufgerufen werden,
   * wenn tokenType = 'KEYWORD'.
   */
  get keyWord(): KeyWord {
    // TODO: Gib das aktuelle Keyword zurück.
    throw new Error('TODO: keyWord implementieren.');
  }

  /**
   * Gibt aktuelles Token zurück. Sollte nur aufgerufen werden,
   * wenn tokenType = 'SYMBOL'.
   */
  get symbol(): string {
    // TODO: Gib das aktuelle Symbol zurück.
    throw new Error('TODO: symbol implementieren.');
  }

  /**
   * Gibt aktuellen Identifier zurück. Sollte nur aufgerufen werden,
   * wenn tokenType = 'IDENTIFIER'.
   */
  get identifier(): string {
    // TODO: Gib den aktuellen Identifier zurück.
    throw new Error('TODO: identifier implementieren.');
  }

  /**
   * Gibt aktuellen Integer-Wert zurück. Sollte nur aufgerufen werden,
   * wenn tokenType = 'INT_CONST'.
   */
  get intVal(): number {
    // TODO: Gib den aktuellen Integer-Wert zurück.
    throw new Error('TODO: intVal implementieren.');
  }

  /**
   * Gibt aktuellen string zurück. Sollte nur aufgerufen werden,
   * wenn tokenType = 'STRING_CONST'.
   */
  get stringVal(): string {
    // TODO: Gib den aktuellen String zurück.
    throw new Error('TODO: stringVal implementieren.');
  }
}

type TokenType = 'KEYWORD' | 'SYMBOL' | 'IDENTIFIER' | 'INT_CONST' | 'STRING_CONST';
type KeyWord = 'CLASS' | 'METHOD' | 'FUNCTION' | 'CONSTRUCTOR' | 'INT' | 'BOOLEAN'
  | 'CHAR' | 'VOID' | 'VAR' | 'STATIC' | 'FIELD' | 'LET' | 'DO' | 'IF' | 'ELSE' | 'WHILE' | 'RETURN' | 'TRUE' | 'FALSE' | 'NULL' | 'THIS';

const element_keyword = ['class', 'method', 'function', 'constructor', 'int', 'boolean'
  , 'char', 'void', 'var', 'static', 'field', 'let', 'do', 'if', 'else', 'while', 'return', 'true', 'false', 'null', 'this'];
const element_symbol = ['{', '}', '(', ')', '[', ']', '.', ',', ';', '+', '-', '*', '/', '&', '|', '<', '>', '=', '~'];
const element_number = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const element_char = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const element_identifier = ['_'].concat(element_number, element_char);
