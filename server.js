const app = require("./app");

const PORT = process.env.PORT || 5000;

// Start server only outside Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
}
