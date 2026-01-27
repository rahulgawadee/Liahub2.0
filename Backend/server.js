require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const logger = require("./src/utils/logger");
const { connectDB } = require("./src/config/database");
const { initSocket } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
	try {
		await connectDB();

		const server = http.createServer(app);
		
		// Set server timeout to 15 minutes for large Excel uploads
		server.timeout = 900000; // 15 minutes in milliseconds
		server.keepAliveTimeout = 900000;
		server.headersTimeout = 900000;
		
		initSocket(server);

		server.listen(PORT, () => {
			logger.info(`Server listening on port ${PORT}`);
		});

		const shutdown = async (signal) => {
			logger.info(`${signal} received, shutting down gracefully`);
			server.close(() => {
				logger.info("HTTP server closed");
			});
			process.exit(0);
		};

		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);
	} catch (error) {
		logger.error("Failed to bootstrap application", error);
		process.exit(1);
	}
};

bootstrap();
