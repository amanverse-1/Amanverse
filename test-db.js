const mongoose = require('mongoose');
const https = require('https');

const uri = "mongodb+srv://portfolio:aman123@cluster0.j3th1gi.mongodb.net/?appName=Cluster0";

// Pehle tumhara current public IP fetch karte hain
https.get('https://api.ipify.org', (resp) => {
  let ip = '';
  resp.on('data', (chunk) => { ip += chunk; });
  resp.on('end', () => {
    console.log(`\n🌐 Tumhara Current Public IP hai: ${ip}`);
    console.log("⏳ Ab MongoDB se connect karne ki koshish kar rahe hain...\n");

    mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        console.log("✅ CONNECTION SUCCESSFUL: The MongoDB URI is correct and database is accessible!");
        console.log("👉 Iska matlab ye IP (" + ip + ") tumhare MongoDB Atlas me ALLOWED hai.");
        process.exit(0);
      })
      .catch((err) => {
        console.error("❌ CONNECTION FAILED: The MongoDB URI is incorrect or IP is blocked.");
        console.log("👉 Iska matlab MongoDB ne is IP (" + ip + ") ko BLOCK kar diya hai. Tumhe ise Atlas me whitelist karna hoga ya 0.0.0.0/0 add karna hoga.");
        console.error(err.message);
        process.exit(1);
      });
  });
}).on("error", (err) => {
  console.log("IP fetch karne me error: " + err.message);
});
