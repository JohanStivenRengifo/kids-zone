require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
