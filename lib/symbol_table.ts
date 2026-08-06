type Kind = 'STATIC' | 'FIELD' | 'ARG' | 'VAR';

/**
 * Verwaltet die Bezeichner einer Jack-Klasse und ihrer aktuellen Subroutine.
 * Jeder Eintrag speichert Typ, Art und laufende Nummer eines Bezeichners.
 */
export default class SymbolTable {
  classTable: { [name: string]: [type: string, kind: Kind, no: number] };
  subroutineTable: { [name: string]: [type: string, kind: Kind, no: number] };

  constructor() {
    this.classTable = {};
    this.subroutineTable = {};
  }

  /**
   * Beginnt eine neue Subroutine und leert ihre lokale Symboltabelle.
   */
  startSubroutine(): void {
    // TODO
    this.subroutineTable = {};
  }

  /**
   * Fügt einen neuen Bezeichner mit Typ und Art zur passenden Symboltabelle hinzu.
   *
   * @param name Name des Bezeichners
   * @param type Jack-Typ des Bezeichners (int, string, ...)
   * @param kind Art des Bezeichners (field, static, var oder argument)
   */
  define(name: string, type: string, kind: Kind): void {
    if (kind.toLowerCase() === "field" || kind.toLowerCase() === "static") {
      // Klasse
      this.classTable[name] = [type, kind, this.varCount(kind)];
    }
    else {
      this.subroutineTable[name] = [type, kind, this.varCount(kind)];
    }
  }

  /**
   * Gibt die Anzahl der bereits definierten Bezeichner einer Art zurück.
   *
   * @param kind Art der zu zählenden Bezeichner
   * @returns Anzahl der Bezeichner dieser Art
   */
  varCount(kind: Kind): number {
    // TODO
    let cnt: number = 0;
    if (kind.toLowerCase() === "field" || kind.toLowerCase() === "static") {
      for (let el in this.classTable) {
        if (this.kindOf(el) === kind) cnt++;
      }
    }
    else {
      for (let el in this.subroutineTable) {
        if (this.kindOf(el) === kind) cnt++;
      }
    }
    return cnt;
  }

  /**
   * Gibt die Art eines Bezeichners zurück.
   *
   * @param name Name des gesuchten Bezeichners
   * @returns Art des Bezeichners oder `NONE`, falls er nicht definiert ist
   */
  kindOf(name: string): Kind | 'NONE' {
    // TODO
    if (this.subroutineTable[name] != undefined) return this.subroutineTable[name][1];
    if (this.classTable[name] != undefined) return this.classTable[name][1];
    return 'NONE';
  }

  /**
   * Gibt den Jack-Typ eines Bezeichners zurück.
   *
   * @param name Name des gesuchten Bezeichners
   * @returns Jack-Typ des Bezeichners
   */
  typeOf(name: string): string {
    // TODO
    return '';
  }

  /**
   * Gibt die laufende Nummer eines Bezeichners innerhalb seiner Art zurück.
   *
   * @param name Name des gesuchten Bezeichners
   * @returns Laufende Nummer des Bezeichners
   */
  indexOf(name: string): number {
    // TODO
    if (this.subroutineTable[name] != undefined) return this.subroutineTable[name][2];
    return this.classTable[name][2];
  }
}
