import fs from 'fs';
import path from 'path';
import JackTokenizer from './lib/jack_tokenizer.ts';

// lies Name der .jack Datei oder des Ordners von der Konsole
const input_name = process.argv[2]; // kann Ordner oder Datei sein
const input = path.parse(path.resolve(input_name));
const is_folder = fs.statSync(input_name).isDirectory();

let files_to_parse: string[] = [];
if (is_folder) {
  // Wenn es ein Ordner ist: output_file auf gleicher Ebene wie der Ordner
  const files = fs.readdirSync(input_name);
  for (const file of files) {
    if (file.endsWith('.jack')) {
      files_to_parse.push(path.join(input_name, file));
    }
  }
}
else {
  files_to_parse.push(input_name);
}

//const code_writer = new CodeWriter(output_file);

for (const file of files_to_parse) {
  const tokenizer = new JackTokenizer(file);
  const file_parsed = path.parse(file);
  const output_file = path.join(file_parsed.dir, file_parsed.name + "T-test-build.xml");
  //code_writer.setFileName(file_parsed.name);
  fs.writeFileSync(output_file, "<tokens>\n");
  while (tokenizer.hasMoreTokens()) {
    tokenizer.advance();
    let s;
    switch (tokenizer.tokenType) {
      case 'KEYWORD':
        fs.appendFileSync(output_file, "<keyword> " + tokenizer.keyWord.toLowerCase() + " </keyword>\n");
        break;
      case 'SYMBOL':
        s = tokenizer.symbol;
        switch (s) {
          case '<':
            s = "&lt;";
            break;
          case '>':
            s = "&gt;";
            break;
          case '&':
            s = "&amp;";
            break;
          default:
            break;
        }
        fs.appendFileSync(output_file, "<symbol> " + s + " </symbol>\n");
        break;
      case 'IDENTIFIER':
        fs.appendFileSync(output_file, "<identifier> " + tokenizer.identifier + " </identifier>\n");
        break;
      case 'INT_CONST':
        fs.appendFileSync(output_file, "<integerConstant> " + tokenizer.intVal + " </integerConstant>\n");
        break;
      case 'STRING_CONST':
        s = tokenizer.stringVal;
        fs.appendFileSync(output_file, "<stringConstant> " + s.substring(1, s.length - 1) + " </stringConstant>\n");
        break;
      default:
        fs.appendFileSync(output_file, "Error: Token type " + tokenizer.tokenType + " not implemented yet.");
        break;
    }
  }
  fs.appendFileSync(output_file, "</tokens>\n");
}
//code_writer.close();
