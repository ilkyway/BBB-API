const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { URLSearchParams } = require('url');

const app = express();
const port = 1337;

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

TOKEN = "6509004539:AAH8qoo9wUuTXJ92HzzQPAtFBSglZdRgb7A"

const verifyTelegramWebAppData = (telegramInitData) => {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  const dataToCheck = [];

  initData.sort();
  initData.forEach((val, key) => {
    if (key !== 'hash') {
      dataToCheck.push(`${key}=${val}`);
    }
  });

  const secret = CryptoJS.HmacSHA256(TOKEN, 'WebAppData');
  const _hash = CryptoJS.HmacSHA256(dataToCheck.join('\n'), secret).toString(CryptoJS.enc.Hex);

  return _hash === hash;
}

app.get('/api/auth/telegram', (req, res) => {
    console.log("auth")
    const name = req.query.name;
    const age = req.query.age;
    res.status(200).send(`Name: ${name}, Age: ${age}`);
  });

app.post('/api/auth/telegram', (req, res) => {
  const initData = req.body.initData;
  const initDataUnsafe = req.body.initDataUnsafe;
  let status = 200
  let json = {}
  if (verifyTelegramWebAppData(initData)){
    //gen tokens
    //check user
    json.token = "hyi"
    json.refresh = "dildo"
  }
  else{
    status = 400
    json.error = "Invalid Init Data"
  }
  res.status(status).send(json);
});

app.listen(port, () => {
    console.log(`Brawl Box Start at ${port} port`);
  });