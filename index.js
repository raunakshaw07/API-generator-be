require('dotenv').config({ path: 'config/.env' });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use('/', require('./routes'));

const port = process.env.PORT;
app.listen(port, () => console.log(`Server running on port ${port}`));