const Realm = require("realm");
const inquirer = require("inquirer");
const users = require("./users");
const schemas = require("./schemas");
const output = require("../output");

Realm.Sync.setLogLevel("error");

let realm;
async function openRealm() {
  const config = {
    schema: [schemas.TaskSchema, schemas.UserSchema, schemas.ProjectSchema],
    sync: {
      // :hide-start: openRealm
      user: users.getAuthedUser(),
      partitionValue: "myPartition",
      // :hide-end:
      // :replace-with:
      // //TODO: call getAuthedUser() and provide a string for the partition name
      // user: ... ,
      // partitionValue: ...,
      // :hide-end:
    },
  };
  realm = Realm.open(config);
}

output.intro();

async function run() {
  output.header("*** WELCOME ***");
  output.header(
    "Please log in to your Realm account or register as a new user."
  );

  let choice = await inquirer.prompt([
    {
      type: "rawlist",
      name: "start",
      message: "What do you want to do?",
      choices: ["Log in", "Register as a new user"],
    },
  ]);

  if (choice.start === "Log in") {
    users.logIn();
  } else {
    users.registerUser();
  }
}

run().catch((err) => {
  output.error(err.message);
});

async function getRealm() {
  if (realm == undefined) {
    await openRealm();
  }
  return realm;
}

async function closeRealm() {
  if (realm != undefined) {
    realm.close();
    realm = undefined;
  }
}

exports.getRealm = getRealm;
exports.closeRealm = closeRealm;
exports.run = run;