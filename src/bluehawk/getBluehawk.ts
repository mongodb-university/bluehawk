import {
  Bluehawk,
  SnippetTag,
  ReplaceTag,
  RemoveTag,
  StateTag,
  StateRemoveTag,
  UncommentTag,
  EmphasizeTag,
  tokens,
} from ".";
import {
  makeBlockTag,
  IdRequiredAttributes,
  IdRequiredAttributesSchema,
} from "./tags";

let bluehawk: Bluehawk | undefined = undefined;

/**
  Returns a standard, shared Bluehawk instance.
 */
export const getBluehawk = async (): Promise<Bluehawk> => {
  if (bluehawk === undefined) {
    const StateUncommentTag = makeBlockTag<IdRequiredAttributes>({
      name: "state-uncomment",
      description: "combines 'uncomment' and 'state'",
      shorthandArgsAttributeName: "id",
      attributesSchema: IdRequiredAttributesSchema,
      process(request) {
        UncommentTag.process(request);
        StateTag.process(request);
      },
    });

    bluehawk = new Bluehawk({
      tags: [
        RemoveTag,
        ReplaceTag,
        SnippetTag,
        StateTag,
        StateRemoveTag,
        StateUncommentTag,
        UncommentTag,
        EmphasizeTag,
      ],
    });

    // Add all supported extensions here.
    bluehawk.addLanguage(
      [
        ".c",
        ".cpp",
        ".cs",
        ".dart",
        ".go",
        ".gradle",
        ".groovy",
        ".gsh",
        ".gvy",
        ".gy",
        ".h",
        ".hpp",
        ".java",
        ".js",
        ".jsx",
        ".kt",
        ".m",
        ".mm",
        ".rs",
        ".sc",
        ".scala",
        ".swift",
        ".ts",
        ".tsx",
      ],
      {
        languageId: "C-like",
        blockComments: [[/\/\*/, /\*\//]],
        lineComments: [/\/\/ ?/],
      }
    );

    bluehawk.addLanguage([".php"], {
      languageId: "PHP",
      lineComments: [/#|\/\//],
      blockComments: [[/\/\*/, /\*\//]],
    });

    bluehawk.addLanguage([".py"], {
      languageId: "Python",
      lineComments: [/# ?/],
      stringLiterals: [
        {
          pattern: tokens.PYTHON_STRING_LITERAL_PATTERN,
          multiline: true,
        },
      ],
    });

    bluehawk.addLanguage([".rb"], {
      languageId: "Ruby",
      lineComments: [/# ?/],
    });

    bluehawk.addLanguage(["", ".txt", ".rst", ".md", ".json"], {
      languageId: "text",
    });

    bluehawk.addLanguage([".yaml", ".sh"], {
      languageId: "bashlike",
      lineComments: [/# ?/],
      // String literal specification required as it's the only way to use # as
      // not-a-comment
      stringLiterals: [
        {
          pattern: tokens.JSON_STRING_LITERAL_PATTERN,
          multiline: false,
        },
      ],
    });
  
    bluehawk.addLanguage([".xml", ".svg", ".html", ".htm", ".uxml", ".xaml"], {
      languageId: "xml",
      blockComments: [[/<!--/, /-->/]],
    });
  }

  return bluehawk;
};

/**
  Resets the bluehawk instance (for unit testing).
 */
getBluehawk.reset = (): Promise<Bluehawk> => {
  bluehawk = undefined;
  return getBluehawk();
};
