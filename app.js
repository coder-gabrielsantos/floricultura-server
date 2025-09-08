const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Create Express instance
const app = express();

const allowedOrigins = [
    'https://santateresinha.vercel.app',
];

const corsOptions = {
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
    ],
    credentials: true,               // se for usar cookies/credenciais
    optionsSuccessStatus: 204,       // evita 3xx/4xx em preflight
    preflightContinue: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware for parsing request bodies
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/catalogs", require("./routes/catalogRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/pagamentos/webhook", require("./routes/_paymentWebhook"));

// Export app for Vercel or testing
module.exports = app;
