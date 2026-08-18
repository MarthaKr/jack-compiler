type Segment = 'constant' | 'argument' | 'local' | 'static' | 'this' | 'that' | 'pointer' | 'temp';
type Command = 'ADD' | 'SUB' | 'NEG' | 'EQ' | 'GT' | 'LT' | 'AND' | 'OR' | 'NOT';

import { writeFileSync } from "node:fs";

/**
 * Schreibt VM-Befehle in die Ausgabedatei des Jack-Compilers.
 */
export default class VMWriter {
  vm_code: string[];
  output_file: string;

  /**
   * Bereitet die VM-Ausgabedatei vor.
   *
   * @param output_file Pfad der VM-Ausgabedatei
   */
  constructor(output_file: string) {
    this.vm_code = [];
    this.output_file = output_file;
  }

  /** Schreibt einen push-Befehl. */
  writePush(segment: Segment, index: number): void {
    // TODO
    this.vm_code.push("push " + segment + " " + index.toString());
  }

  /** Schreibt einen pop-Befehl. */
  writePop(segment: Segment, index: number): void {
    // TODO
    this.vm_code.push("pop " + segment + " " + index.toString());
  }

  /** Schreibt einen arithmetischen VM-Befehl. */
  writeArithmetic(command: Command): void {
    // TODO
    this.vm_code.push(command.toLowerCase())
  }

  /** Schreibt ein Label. */
  writeLabel(label: string): void {
    // TODO
    this.vm_code.push("label " + label);
  }

  /** Schreibt einen unbedingten Sprung. */
  writeGoto(label: string): void {
    // TODO
    this.vm_code.push("goto " + label);
  }

  /** Schreibt einen bedingten Sprung. */
  writeIf(label: string): void {
    // TODO
    this.vm_code.push("if-goto " + label);
  }

  /** Schreibt einen Funktionsaufruf. */
  writeCall(name: string, nArgs: number): void {
    // TODO
    this.vm_code.push("call " + name + " " + nArgs.toString())
  }

  /** Schreibt den Beginn einer Funktion. */
  writeFunction(name: string, nLocals: number): void {
    // TODO
    this.vm_code.push("function " + name + " " + nLocals.toString())
  }

  /** Schreibt einen return-Befehl. */
  writeReturn(): void {
    // TODO
    this.vm_code.push("return")
  }

  /** Schließt die VM-Ausgabedatei. */
  close(): void {
    const file_content = this.vm_code.join("\n");
    writeFileSync(this.output_file, file_content);
  }
}
