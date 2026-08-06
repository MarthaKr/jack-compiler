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
  }

  /**
   * Fügt einen neuen Bezeichner mit Typ und Art zur passenden Symboltabelle hinzu.
   *
   * @param name Name des Bezeichners
   * @param type Jack-Typ des Bezeichners
   * @param kind Art des Bezeichners
   */
  define(name: string, type: string, kind: Kind): void {
    // TODO
  }

  /**
   * Gibt die Anzahl der bereits definierten Bezeichner einer Art zurück.
   *
   * @param kind Art der zu zählenden Bezeichner
   * @returns Anzahl der Bezeichner dieser Art
   */
  varCount(kind: Kind): number {
    // TODO
    return 0;
  }

  /**
   * Gibt die Art eines Bezeichners zurück.
   *
   * @param name Name des gesuchten Bezeichners
   * @returns Art des Bezeichners oder `NONE`, falls er nicht definiert ist
   */
  kindOf(name: string): Kind | 'NONE' {
    // TODO
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
    return -1;
  }
}
