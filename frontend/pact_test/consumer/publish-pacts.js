const path = require("path");
// ОБНОВЛЕНО: Используем класс Publisher
const pact = require("@pact-foundation/pact-node");

const opts = {
  pactFilesOrDirs: [path.resolve(process.cwd(), "pacts")],
  pactBroker: process.env.PACT_BROKER_BASE_URL || "http://localhost:9292",
  consumerVersion: process.env.GIT_COMMIT || process.env.GITHUB_SHA || "1.0.0",
  tags: [process.env.GIT_BRANCH || "main"],
};

console.log("Publishing pacts to broker with options:", opts);

// ОБНОВЛЕНО: Создаем экземпляр класса Publisher и вызываем его метод publish
new pact.Publisher(opts)
  .publish(opts)
  .then(() => {
    console.log("Pacts successfully published!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to publish pacts:", error);
    process.exit(1);
  });