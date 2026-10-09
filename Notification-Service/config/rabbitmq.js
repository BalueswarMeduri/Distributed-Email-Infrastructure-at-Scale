import amqp from "amqplib";

let connection = null;
let channel = null;

const QUEUE_NAME = "notification_outbox_queue";
const DLX_EXCHANGE = "email_notification_dlx";
const DLQ_QUEUE = "email_notification_dlq";

export const connectRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    // 1. Assert Dead Letter Exchange & DLQ
    await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, DLQ_QUEUE);

    // 2. Assert Main Queue with Dead Letter Arguments
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": DLX_EXCHANGE,
        "x-dead-letter-routing-key": DLQ_QUEUE
      }
    });

    console.log(`RabbitMQ Connected & Queue '${QUEUE_NAME}' Asserted successfully`);

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed. Attempting reconnect in 5s...");
      setTimeout(connectRabbitMQ, 5000);
    });

    return { connection, channel };
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error.message);
    console.log("Will retry RabbitMQ connection in 5 seconds...");
    setTimeout(connectRabbitMQ, 5000);
  }
};

export const publishEventToRabbitMQ = async (eventData) => {
  try {
    if (!channel) {
      throw new Error("RabbitMQ channel is not available");
    }

    const messageBuffer = Buffer.from(JSON.stringify(eventData));
    const published = channel.sendToQueue(QUEUE_NAME, messageBuffer, {
      persistent: true
    });

    return published;
  } catch (error) {
    console.error("Failed to publish message to RabbitMQ:", error.message);
    throw error;
  }
};

export { QUEUE_NAME };
