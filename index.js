const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { URLSearchParams } = require('url');
const CryptoJS = require('crypto-js');
const DBManager = require('./db/dbManager')

const app = express();
const db = new DBManager('./db/users.db');
const port = 1337;

app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

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

app.get('/api/data/own/home', async (req, res) => {
  const Authorization = req.headers.authorization
  let status = 200
  let json = {}

  if(await db.validateToken(Authorization)){
    json = await db.getOHD(Authorization)
  }else{
    status = 400
      json.error = "Invalid Token"
  }
  res.status(status).send(json);
});

app.post('/api/auth/telegram/refresh', async (req, res) => {
  const Authorization = req.headers.authorization
  let status = 200
  let json = {}
  if (Authorization){
    valid = await db.createTokenByRefresh(Authorization)
    if (valid){
      json = valid
    }else{
      status = 400
      json.error = "Invalid Refresh Token"
    }

  }else{
    status = 400
    json.error = "Invalid Refresh Token"
  }

  res.status(status).send(json);
});

app.post('/api/auth/telegram', async (req, res) => {
  const initData = req.body.initData;
  const initDataUnsafe = req.body.initDataUnsafe;
  let status = 200
  let json = {}
  if (verifyTelegramWebAppData(initData)){
    if (!await db.getUser(initDataUnsafe.user.id)){
      await db.createUser(initDataUnsafe.user.id,initDataUnsafe.user.first_name,initDataUnsafe.start_param)
    }
    json = await db.createToken(initDataUnsafe.user.id)
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