import {
  makeBlockOrLineCommand,
  NoAttributes,
  NoAttributesSchema,
} from "./Command";

import { removeMetaRange } from "./removeMetaRange";

export const EmphasizeCommand = makeBlockOrLineCommand<NoAttributes>({
  name: "emphasize",
  description: "highlight line(s) in formatted output",
  attributesSchema: NoAttributesSchema,

  process({ commandNode, parseResult }) {
    const { source } = parseResult;
    const { text } = source;

    // Strip tags
    removeMetaRange(text, commandNode);
    source.attributes["emphasize"] = commandNode.lineRange;
  },
});
