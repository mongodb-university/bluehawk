import { Bluehawk } from "../bluehawk";

describe("bluehawk", () => {
  const bluehawk = new Bluehawk();

  it("handles lexing, parsing, visiting, and validating", () => {
    const input = `
    this is ignored
    :some-command-start:
    this is in the command
    :some-command-end:
`;
    const output = bluehawk.run(input);
    expect(output.errors.length).toBe(0);
  });

  it("contains lexing errors", () => {
    const input = `
    :some-command-start: '
    this is ignored
    :some-command-end:
    `;
    const output = bluehawk.run(input);
    expect(output.errors.length).toBe(1);
    expect(output.errors[0]).toStrictEqual({
      location: {
        column: 26,
        line: 2,
        offset: 26,
      },
      message:
        "unexpected character: ->'<- at offset: 26, skipped 1 characters.",
    });
  });

  it("contains parsing errors", () => {
    const input = `
    this is ignored
    :some-command-start:
    this is in the command
    :some-command-start:
`;
    const output = bluehawk.run(input);
    expect(output.errors.length).toBe(1);
    expect(output.errors[0]).toStrictEqual({
      location: {
        column: 25,
        line: 5,
        offset: 97,
      },
      message:
        "5:25(97) blockCommand: After Newline, expected CommandEnd but found EOF",
    });
  });

  it("contains visiting errors", () => {
    // TODO: come up with a decent visiting error
    const input = `
    this is ignored
    :some-command-start:
    this is in the command
    :some-command-end:
`;
    const output = bluehawk.run(input);
    expect(output.errors.length).toBe(0);
    expect(output.errors[0]).toStrictEqual(undefined);
  });

  it("contains validating errors", () => {
    const input = `
    this is ignored
    :code-block-start:
    this is in the command
    :code-block-end:
`;
    const output = bluehawk.run(input);
    expect(output.errors.length).toBe(1);
    expect(output.errors[0]).toStrictEqual({
      location: {
        column: 5,
        line: 3,
        offset: 25,
      },
      message: "missing ID for command: 'code-block'",
    });
  });
});