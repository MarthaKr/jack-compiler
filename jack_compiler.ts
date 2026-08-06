import fs from 'fs';
import path from 'path';
import CompilationEngine from './lib/compilation_engine.ts';

// lies Name der .jack Datei oder des Ordners von der Konsole
const input_name = process.argv[2]; // kann Ordner oder Datei sein
const is_folder = fs.statSync(input_name).isDirectory();

let files_to_parse: string[] = [];
let build_dir = "";
if (is_folder) {
  build_dir = path.join(input_name, "build");
  // Wenn es ein Ordner ist: output_file auf gleicher Ebene wie der Ordner
  const files = fs.readdirSync(input_name);
  for (const file of files) {
    if (file.endsWith('.jack')) {
      files_to_parse.push(path.join(input_name, file));
    }
  }
}
else {
  build_dir = path.join(path.parse(input_name).dir, "build");
  files_to_parse.push(input_name);
}

if (!fs.existsSync(build_dir)) fs.mkdirSync(build_dir);

for (const file of files_to_parse) {
  const file_parsed = path.parse(file);
  const output_file = path.join(build_dir, file_parsed.name + ".vm");
  const compilation_engine = new CompilationEngine(file, output_file);
  try {
    compilation_engine.compileClass();
    compilation_engine.vm_writer.close();
  }
  catch (error: any) {
    console.error("Fehler:", error.message);
  }
}
