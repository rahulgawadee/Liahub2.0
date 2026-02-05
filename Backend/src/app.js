const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

// Configure CORS using FRONTEND_ORIGIN (comma-separated) and ALLOW_CREDENTIALS env vars
// IMPORTANT: When deploying frontend separately (e.g., Vercel), set FRONTEND_ORIGIN to your Vercel URL
// Example: FRONTEND_ORIGIN=https://your-app.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
const corsOptions = {
	origin: allowedOrigins.length ? ((origin, cb) => {
		if (!origin) return cb(null, true) // allow server-to-server or curl
		if (allowedOrigins.includes(origin)) return cb(null, true)
		console.warn(`CORS: Blocked origin ${origin}. Allowed: ${allowedOrigins.join(', ')}`)
		return cb(new Error('CORS origin denied'))
	}) : true, // If no FRONTEND_ORIGIN set, allow all origins (NOT recommended for production)
	methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
	allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
	credentials: process.env.ALLOW_CREDENTIALS === 'true',
}
app.use(cors(corsOptions))
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// Serve static templates (Excel/Markdown) used by the frontend upload dialogs
app.use('/templates', express.static(path.join(__dirname, '..', 'public', 'templates')));

// Serve built frontend when available (for Render or static deployments)
const frontendDistPath = path.join(__dirname, "..", "..", "dist");
const frontendIndex = path.join(frontendDistPath, "index.html");
const fs = require("fs");

if (fs.existsSync(frontendDistPath)) {
	app.use(express.static(frontendDistPath));

	// specific route to serve frontend (as requested: /route)
	app.get('/route', (req, res) => {
		res.sendFile(frontendIndex);
	});

			// catch-all to support client-side routing (serve index.html for non-API routes)
			app.use((req, res, next) => {
				// only handle non-API routes
				if (req.path.startsWith('/api/')) return next();
				if (fs.existsSync(frontendIndex)) return res.sendFile(frontendIndex);
				return next();
			});
}

app.use("/api/v1", routes);

// Internal diagnostics route for SMTP connectivity. Enabled only when SMTP_TEST_TOKEN is set.
// Protect by requiring header 'x-smtp-test-token' to match the env var value.
if (process.env.SMTP_TEST_TOKEN) {
	const emailService = require("./services/emailService");
	// Register under API namespace so the frontend static catch-all doesn't shadow this route
	app.get('/api/v1/internal/test-smtp', async (req, res) => {
		const token = req.get('x-smtp-test-token');
		if (!token || token !== process.env.SMTP_TEST_TOKEN) return res.status(401).json({ ok: false, error: 'Unauthorized' });
		try {
			const transporter = emailService.getTransporter();
			if (!transporter || typeof transporter.verify !== 'function') {
				return res.json({ ok: true, message: 'MAIL_MOCK or no transporter configured (mock transport in use)' });
			}
			await transporter.verify();
			return res.json({ ok: true, message: 'SMTP verify succeeded' });
		} catch (err) {
			return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
		}
	});
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
