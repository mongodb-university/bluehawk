import { CommandModule, Arguments, Argv } from "yargs";
import {
  withDestinationOption,
  withStateOption,
  withIdOption,
  withIgnoreOption,
  withGenerateFormattedCodeSnippetsOption,
} from "../options";
import { MainArgs } from "../cli";
import { SnipArgs, snip } from "../actions";

const commandModule: CommandModule<MainArgs & { paths: string[] }, SnipArgs> = {
  command: "snip <paths..>",
  builder: (yargs): Argv<SnipArgs> => {
    return withIgnoreOption(
      withStateOption(
        withIdOption(
          withDestinationOption(withGenerateFormattedCodeSnippetsOption(yargs))
        )
      )
    );
  },
  handler: async (args: Arguments<SnipArgs>) => {
    const errors = await snip(args);
    if (errors.length !== 0) {
      console.error(
        `Exiting with ${errors.length} error${errors.length === 1 ? "" : "s"}.`
      );
      process.exit(1);
    }
  },
  aliases: [],
  describe: "extract snippets",
};

export default commandModule;
