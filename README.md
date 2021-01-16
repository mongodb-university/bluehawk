# Bluehawk

Bluehawk is a markup processor for extracting and manipulating arbitrary code.
In particular, it can:

- Extract code examples for use in documentation
- Replace "finished" code with "todo" code for a branch in a tutorial repo

## Use Cases

### Tested Code Examples

Imagine you want to paste some code from a unit test into your docs. You can
mark up the unit test source file like this with Bluehawk commands like
`:code-block-start:`, `:code-block-end:`, `:remove-start:`, and `:remove-end:`:

```swift
// SomeTest.swift

// ... more tests ...
func someTest() {
    // :code-block-start: some-example
    let person = getPerson()
    // :remove-start: // hide test boilerplate from the code block
    XCTAssert(person.name != "Keith")
    // :remove-end:
    person.doSomething {
        person.doSomethingElse()
    }
    // :code-block-end:
}
// ... more tests ...
```

Running Bluehawk with the --snippets flag on this file will produce a snippet
file called `SomeTest.codeblock.some-example.swift` that looks something like this:

```swift
let person = getPerson()
person.doSomething {
    person.doSomethingElse()
}
```

You can now import this snippet into your documentation. Now you have the
benefit of tested examples that are still easy to read in the docs. 

Bluehawk markup can go into any source file, so you don't need to rig every unit
test framework you use up to also extract code examples. Just use Bluehawk with
the unit test framework that suits your language and your project.

### Checkpointed Tutorials

Suppose you have a tutorial repo that learners can clone to follow along with
your tutorial from a certain starting point, say a "start" branch. You also want
learners to be able to check out a "final" branch so they can see the finished
project. As the tutorial developer, you would have to maintain these two state
branches, which can be tedious and error prone.

To manage this process, you can use Bluehawk to mark up your tutorial source and
indicate different states or checkpoints with the `:state-start:` and
`:state-end:` commands:

```swift
// WelcomeViewController.swift

// ... more code ...
// :code-block-start: sign-up
@objc func signUp() {
    // :state-start: final
    setLoading(true);
    app.emailPasswordAuth.registerUser(email: email!, password: password!, completion: { [weak self](error) in
        DispatchQueue.main.async {
            self!.setLoading(false);
            ...
        }
    })
    // :state-end:
    // :state-start: start
    // TODO: Use the app's emailPasswordAuth to registerUser with the email and password.
    // When registered, call signIn().
    // :state-uncomment-end:
}
// :code-block-end:
// ... more code ...
```

Running Bluehawk on this file with `--state start`  results in a copy of
`WelcomeViewController.swift` that looks something like this:

```swift
// WelcomeViewController.swift

// ... more code ...
@objc func signUp() {
    // TODO: Use the app's emailPasswordAuth to registerUser with the email and password.
    // When registered, call signIn().
}
// ... more code ...
```

Notice that you still have all of the boilerplate, but no final implementation
code. Only the "TODO" is left.

Using the `--state final` flag produces another version of
`WelcomeViewController.swift` that has the boilerplate and the final
implementation code, but no "TODO":

```swift
// WelcomeViewController.swift

// ... more code ...
@objc func signUp() {
    setLoading(true);
    app.emailPasswordAuth.registerUser(email: email!, password: password!, completion: { [weak self](error) in
        DispatchQueue.main.async {
            self!.setLoading(false);
            ...
        }
    })
}
// ... more code ...
```

You can run Bluehawk on an entire directory, and each file in the repo will be
copied or transformed to the destination. This makes it easy to copy one state
of the entire tutorial source into another repo that learners can clone.

## Background

A concept originally lifted from another internal project called "peekaboo", the
idea is that you can develop finalized code (say, a complete tutorial
application that runs), and then strip out parts that you want the learner to
figure out and code themselves. So, one code base (compiles, passes tests, etc.)
can be used to generate both a "starter" version for a learner and a "final"
version so they can check their work... or just download it and cheat.

Additionally, we needed a way to leave our code examples in compileable,
testable projects while extracting the relevant part to paste in our docs.

## Architecture

![Graphical overview of the Bluehawk architecture](./architecture.png?raw=true "Bluehawk Architecture")

Bluehawk has three major components:

- **Client:** loads files to be parsed and processed. Implements listeners that
  decide what to do with results (e.g. save to file). Can add custom commands
  and language specifications (i.e. comment syntax).
- **Parser:** finds commands in a source file and diagnoses markup errors.
- **Processor:** executes commands on a source file to produce transformed documents.


### File Language-Specific Tokens

The lexer can receive custom tokens for a given language to define comment
syntax. For example, plaintext has no comments, bash only has line comments
(#)[†](https://stackoverflow.com/questions/32126653/how-does-end-work-in-bash-to-create-a-multi-line-comment-block),
and C++ has line (//) and block (/*, */)comments. Bluehawk is comment aware so
that it can correctly strip comments (when needed) and diagnose when commands
are halfway in a block comment.

### Command Tokens

":code-block-start:", ":remove-start:", etc. are not keywords. Instead, the
lexer and parser detect [command], [command]-start, and [command]-end. It is up
to the visitor to determine whether the -start and -end command names match and
if the command name is understood by Bluehawk. This keeps the lexer and parser
simpler and allows for extensibility of Bluehawk as users could eventually
provide their own commands.

### Attribute Lists

The original Bluehawk spec document included the ability to provide a JSON
object after a block command to configure the block command's attributes. The
lexer has "modes" so after it encounters a block command, it goes into an
attribute mode, which will either accept the command identifier (i.e.
:some-command-start: this-is-the-identifier) or the attribute list JSON.

## How to run Bluehawk

First, install dependencies:

```sh
npm install
```

To build, run:

```
npm run build
```

If compilation is successful, you can run bluehawk like so:

```sh
node build/index.js -s <folder to source file or directory>
```

Which you can alias (until release):

```sh
alias bluehawk="node /path/to/bluehawk/build/index.js"
```

The `-s or --source` parameter is required.

In order to do anything useful, you can use the following flags:

- `--state <state name>`: Output the given `state name` version of files. When Bluehawk
  encounters a `state` command (see below), multiple versions of the source file
  are spawned. Each version removes any code in state commands that are **not**
  marked with the corresponding state name. This flag determines which version
  to eventually write to disk.

  When not combined with `snippets`, this retains the relative structure of the
  project.
- `--snippets`: Output snippet files only. Can be combined with `--state`.
- `-d or --destination` defines the output location.


## Command Markup

When generating code blocks from a code file, use the following markup. Note: you
use either single-line commenting or block commenting for all tags to keep the
compiler happy.

| Syntax                      | Description                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| **:snippet-start:** _id_    | Creates a new snippet file, which will be output as `<sourcefilename>.codeblock.<id>.<source file extension>` |
|                             |                                                                             |
| **:remove-start:**          | The inner content will be removed from all output.                          |
|                             |                                                                             |
| **:state-start:** _state_   | Marks this content for removal from any state file except _state_.          |
|                             |                                                                             |
| **:state-uncomment-start:** _state_  | Marks this content for removal from any state file except _state_ and also removes up to one layer of comment tokens. |

All commands that end with `-start` have a corresponding `-end` command. You use
start and end commands to delineate blocks of content. Generally, the command
operates on the content within the block.


## Running Tests

This project uses Jest to test.

To run all tests, use:

```sh
npm test
```

To run the tests and get verbose output for all unit tests, use:

```sh
npm run verbose
```

Additionally, you can get a Jest coverage report with:

```sh
npm run coverage
```

You can also run tests with breakpoints in VS Code with F5. See .vscode/launch.json.

