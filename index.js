require("dotenv").config();

const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } =
  require("mineflayer-pathfinder");

const HOST = process.env.MC_HOST;
const PORT = Number(process.env.MC_PORT || 25565);

const USERNAME = process.env.MC_USERNAME || "FriendHelper";
const PASSWORD = process.env.MC_PASSWORD || "";

const AUTH_MODE = process.env.MC_AUTH_MODE || "auto";
const OWNER = (process.env.BOT_OWNER || "").toLowerCase();

const PREFIX = process.env.PREFIX || "!";

let bot;
let movements;
let task = "idle";

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chat(message) {
  if (!bot) return;
  bot.chat(String(message).slice(0, 240));
}

function ownerOnly(username) {
  return !OWNER || username.toLowerCase() === OWNER;
}

function createBot() {

  console.log(`Connecting to ${HOST}:${PORT}`);

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: process.env.MC_VERSION || false
  });

  bot.loadPlugin(pathfinder);

  bot.once("spawn", async () => {

    console.log("Minecraft bot joined!");

    movements = new Movements(bot);

    bot.pathfinder.setMovements(movements);

    await wait(2000);

    /*
      AuthMe login/register
    */

    if (PASSWORD) {

      if (AUTH_MODE === "register") {

        bot.chat(
          `/register ${PASSWORD} ${PASSWORD}`
        );

      } else {

        bot.chat(
          `/login ${PASSWORD}`
        );

      }

    }

    await wait(3000);

    chat(
      `Hey everyone! 👋 I'm ${USERNAME}. I'm here to help! Type ${PREFIX}help`
    );
  });

  /*
    Server chat
  */

  bot.on("message", message => {

    console.log(
      "[SERVER]",
      message.toString()
    );

  });

  /*
    Player chat
  */

  bot.on("chat", async (username, message) => {

    if (username === bot.username) return;

    console.log(
      `${username}: ${message}`
    );

    const msg =
      message.toLowerCase().trim();

    /*
      Friend-like replies
    */

    if (
      ["hi", "hello", "hey", "hii"]
      .includes(msg)
    ) {

      chat(
        `Hey ${username}! 👋`
      );

      return;
    }

    if (msg.includes("how are you")) {

      chat(
        "I'm good bro 😄 Ready to help!"
      );

      return;
    }

    if (
      msg === "thanks" ||
      msg === "thank you"
    ) {

      chat(
        "Anytime bro ❤️"
      );

      return;
    }

    /*
      Bot mention
    */

    if (
      msg.includes(
        bot.username.toLowerCase()
      )
    ) {

      if (msg.includes("help")) {

        sendHelp();

      } else {

        chat(
          `Yes bro 😄 Type ${PREFIX}help`
        );

      }

      return;
    }

    /*
      Commands
    */

    if (!message.startsWith(PREFIX))
      return;

    if (!ownerOnly(username))
      return;

    const args =
      message
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const command =
      (args.shift() || "").toLowerCase();

    /*
      HELP
    */

    if (command === "help") {

      sendHelp();
      return;
    }

    /*
      COME
    */

    if (command === "come") {

      const player =
        bot.players[username];

      if (!player || !player.entity) {

        chat(
          "Bro, I can't see you right now 😅"
        );

        return;
      }

      const pos =
        player.entity.position;

      task = "coming";

      bot.pathfinder.setGoal(
        new goals.GoalNear(
          pos.x,
          pos.y,
          pos.z,
          2
        )
      );

      chat(
        `Coming bro 🚶`
      );

      return;
    }

    /*
      FOLLOW
    */

    if (command === "follow") {

      const name =
        args[0] || username;

      const player =
        bot.players[name];

      if (!player || !player.entity) {

        chat(
          `I can't see ${name} right now.`
        );

        return;
      }

      task = "following";

      bot.pathfinder.setGoal(
        new goals.GoalFollow(
          player.entity,
          2
        ),
        true
      );

      chat(
        `Okay bro, following ${name} 👣`
      );

      return;
    }

    /*
      STOP
    */

    if (command === "stop") {

      bot.pathfinder.setGoal(null);

      task = "idle";

      chat(
        "Okay bro, stopped 👍"
      );

      return;
    }

    /*
      STAY
    */

    if (command === "stay") {

      bot.pathfinder.setGoal(null);

      task = "staying";

      chat(
        "Okay, I'll stay here 😎"
      );

      return;
    }

    /*
      POSITION
    */

    if (command === "pos") {

      const p =
        bot.entity.position;

      chat(
        `My position: X ${Math.floor(p.x)} Y ${Math.floor(p.y)} Z ${Math.floor(p.z)}`
      );

      return;
    }

    /*
      STATUS
    */

    if (command === "status") {

      chat(
        `I'm online 👍 Task: ${task}`
      );

      return;
    }

    /*
      SAY
    */

    if (command === "say") {

      const text =
        args.join(" ");

      if (text) {

        bot.chat(text);

      }

      return;
    }

    /*
      GRIND
    */

    if (command === "grind") {

      const type =
        (args[0] || "").toLowerCase();

      if (
        !["wood", "stone", "food"]
        .includes(type)
      ) {

        chat(
          `Use ${PREFIX}grind wood, ${PREFIX}grind stone or ${PREFIX}grind food`
        );

        return;
      }

      chat(
        `Okay bro 👍 I'll prepare ${type} grinding support.`
      );

      return;
    }
  });

  /*
    Errors
  */

  bot.on("error", error => {

    console.log(
      "Bot error:",
      error.message
    );

  });

  /*
    Reconnect
  */

  bot.on("end", () => {

    console.log(
      "Disconnected from server."
    );

    setTimeout(
      createBot,
      Number(
        process.env.RECONNECT_DELAY || 5000
      )
    );

  });
}


/*
  HELP FUNCTION
*/

function sendHelp() {

  chat(`
Commands:
${PREFIX}help
${PREFIX}come
${PREFIX}follow <player>
${PREFIX}stop
${PREFIX}stay
${PREFIX}pos
${PREFIX}status
${PREFIX}say <message>
${PREFIX}grind wood
${PREFIX}grind stone
${PREFIX}grind food
  `.replace(/\n/g, " "));
}


/*
  Start
*/

if (!HOST) {

  console.log(
    "ERROR: MC_HOST is missing!"
  );

  process.exit(1);
}

createBot();
