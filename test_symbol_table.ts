import SymbolTable from "./lib/symbol_table";

let test = new SymbolTable();
test.define("test", "int", "VAR");
test.define("test2", "int", "VAR");
test.define("test3", "int", "ARG");
console.log(test.classTable);
console.log(test.subroutineTable);