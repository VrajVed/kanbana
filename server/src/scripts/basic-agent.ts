import "dotenv/config";
import { runCommand } from "../services/AgentService.js";

async function main() {
  const command = process.argv[2] ?? "List all tasks";

  console.log(`[COMMAND] ${command}\n`);

  try {
    const result = await runCommand(command);

    console.log("\n[RESULT]");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("\n[ERROR]", (err as Error).message);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err.message ?? String(err));
  process.exit(1);
});
