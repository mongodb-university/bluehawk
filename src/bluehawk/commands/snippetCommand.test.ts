import { Bluehawk } from "../bluehawk";
import { Document } from "../Document";
import { SnippetCommand } from "./SnippetCommand";
import { RemoveCommand } from "./RemoveCommand";

describe("snippet Command", () => {
  const bluehawk = new Bluehawk();
  bluehawk.registerCommand(SnippetCommand);
  bluehawk.registerCommand(RemoveCommand);
  bluehawk.addLanguage(["js", "swift"], {
    languageId: "javascript",
    blockComments: [[/\/\*/, /\*\//]],
    lineComments: [/\/\/ ?/],
  });

  it("performs extraction", async (done) => {
    const snippet = `describe("some stuff", () => {
  it("foos the bar", () => {
    expect(true).toBeTruthy();
  });
});`;
    const source = new Document({
      text: `const bar = "foo"

// :snippet-start: foo
${snippet}
// :snippet-end:
console.log(bar);
`,
      language: "javascript",
      path: "snippet.test.js",
    });

    const parseResult = bluehawk.parse(source);
    const files = await bluehawk.process(parseResult);
    expect(Object.keys(files)).toStrictEqual([
      "snippet.test.js",
      "snippet.test.codeblock.foo.js",
    ]);
    expect(files["snippet.test.codeblock.foo.js"].source.text.toString()).toBe(
      `${snippet}\n`
    );
    done();
  });

  it("dedents the snippet", async (done) => {
    const source = new Document({
      text: `const bar = "foo"
    // :snippet-start: foo
     abc
      def
   ghi
    // :snippet-end:
`,
      language: "javascript",
      path: "snippet.test.js",
    });

    const parseResult = bluehawk.parse(source);
    const files = await bluehawk.process(parseResult);
    expect(files["snippet.test.codeblock.foo.js"].source.text.toString()).toBe(
      `  abc
   def
ghi
`
    );
    done();
  });

  it("dedents a realistic snippet", async (done) => {
    const source = new Document({
      text: `        // :snippet-start: delete-collection
        let realm = try! Realm()
        try! realm.write {
            // Find dogs younger than 2 years old.
            let puppies = realm.objects(CrudExample_Dog.self).filter("age < 2")

            // Delete the objects in the collection from the realm.
            realm.delete(puppies);
        }
        // :snippet-end:
`,
      language: "swift",
      path: "snippet.test.swift",
    });

    const parseResult = bluehawk.parse(source);
    const files = await bluehawk.process(parseResult);
    expect(
      files[
        "snippet.test.codeblock.delete-collection.swift"
      ].source.text.toString()
    ).toBe(
      `let realm = try! Realm()
try! realm.write {
    // Find dogs younger than 2 years old.
    let puppies = realm.objects(CrudExample_Dog.self).filter("age < 2")

    // Delete the objects in the collection from the realm.
    realm.delete(puppies);
}
`
    );
    done();
  });

  it("handles empty snippets", async (done) => {
    const source = new Document({
      text: `const bar = "foo"
    // :snippet-start: foo
    // :snippet-end:
`,
      language: "javascript",
      path: "snippet.test.js",
    });

    const parseResult = bluehawk.parse(source);
    const files = await bluehawk.process(parseResult);
    expect(files["snippet.test.codeblock.foo.js"].source.text.toString()).toBe(
      ""
    );
    done();
  });

  it("handles adjusted offsets", async (done) => {
    const source = new Document({
      text: `some text
// :snippet-start: foo
// :remove-start:
hide this
// :remove-end:
// :snippet-end:
`,
      language: "javascript",
      path: "snippet.test.js",
    });

    const parseResult = bluehawk.parse(source);
    const files = await bluehawk.process(parseResult);
    expect(files["snippet.test.codeblock.foo.js"].source.text.toString()).toBe(
      ""
    );
    done();
  });

  it("supports nested snippets", async () => {
    const source = new Document({
      text: `some text
// :snippet-start: a
hello
// :snippet-start: b
world
// :snippet-end:
!
// :snippet-end:
`,
      language: "javascript",
      path: "snippet.test.js",
    });

    const parseResult = bluehawk.parse(source);
    const files = await bluehawk.process(parseResult);
    expect(files["snippet.test.codeblock.a.js"].source.text.toString()).toBe(
      `hello
world
!
`
    );
    expect(files["snippet.test.codeblock.b.js"].source.text.toString()).toBe(
      `world
`
    );

    // Ensure nested snippets don't generate, e.g., snippet.test.codeblock.a.codeblock.b.js
    expect(Object.keys(files)).toStrictEqual([
      "snippet.test.js",
      "snippet.test.codeblock.a.js",
      "snippet.test.codeblock.b.js",
    ]);
  });
});
