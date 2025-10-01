require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');

(async () => {
  try {
    await connectDB();
    app.listen(3002, () => {
      console.log("server started at port 3002");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
