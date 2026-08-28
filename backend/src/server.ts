import './load-env';

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;
// ...

// ... (rest of code)

async function startServer() {
  try {
    // Connect to MongoDB Atlas
    await connectDB();
    
    // Only start the server if not in production (Vercel)
    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => {
          console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
          console.log(`[Server] API endpoints available at http://localhost:${PORT}/api/v1/`);
        });
    }
  } catch (error) {
    console.error('CRITICAL: Server failed to start due to DB connection issues:', error);
    process.exit(1);
  }
}

startServer();
