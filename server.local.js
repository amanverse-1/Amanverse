const app = require('./api/index.js');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Local dev server is running on port ${PORT}`);
});
