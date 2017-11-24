#! /usr/bin/env node

const Observable = require('rxjs').Observable;
const request = require('request');
const fp = require('lodash/fp');
const Big = require('big.js');
const PushBullet = require('pushbullet');
const pusherKey = process.env.COIN_TICKERS_PUSHER_KEY;
const exchange = fp.toLower(process.env.COIN_TICKERS_EXCHANGE || 'bithumnb');
const baseLine = fp.split(',')(process.env.COIN_TICKERS_PRICE);
const currency = fp.split(',')(fp.toLower(process.env.COIN_TICKERS_CURRENCY || 'btc'));
const when = fp.toLower(process.env.COIN_TICKERS_WHEN || 'low');

if (fp.isNil(pusherKey)) {
  throw { name: 'PUSHER_KEY_REQUIRED', message: 'Need PUSHER_KEY. visit https://www.pushbullet.com/#settings' };
}

if (!process.env.COIN_TICKERS_PRICE) {
  throw { name: 'PRICE_REQUIRED', message: 'Need PRICE to get alarm.' };
}

if (currency.length !== baseLine.length) {
  throw { name: 'NOT_MATCHED_CURRENCY_PRICE', message: 'PRICE\'s count should be same as CURRENCY' };
}

if (when !== 'low' && when !== 'high') {
  throw { name: 'INCORRECT_WHEN', message: 'WHEN should be one of \'low\' & \'high\'' };
}

const pusher = new PushBullet(pusherKey);

const BITHUMB = 'bithumb';
const COINONE = 'coinone';
const KORBIT = 'korbit';

const URLS = {
  [BITHUMB]: curr => `https://api.bithumb.com/public/ticker/${curr}`,
  [COINONE]: curr => `https://api.coinone.co.kr/ticker?currency=${curr}`,
  [KORBIT]: curr => `https://api.korbit.co.kr/v1/ticker/detailed?currrency_pair=${curr}_krw`,
};

const PROPERTY = {
  [BITHUMB]: 'data.closing_price',
  [COINONE]: 'last',
  [KORBIT]: 'last',
};

const fetchTickers = ({ url, currency: curr, baseLine: base }) =>
  Observable.create(observer =>
    request(url, (err, res) => {
      if (err) {
        observer.error();
      }

      const tick = fp.flow(
        fp.get('body'),
        JSON.parse
      )(res);

      observer.next(
        fp.flow(
          fp.set('currency', curr),
          fp.set('baseLine', base),
        )(tick)
      );
      observer.complete();
    })
);

const getPrice = (tick) => {
  const price = fp.get(fp.get(exchange)(PROPERTY))(tick);
  const curr = fp.get('currency')(tick);
  const baseLine = fp.get('baseLine')(tick);

  return {
    price,
    baseLine,
    currency: curr,
  };
};

const urlArr = fp.map(fp.get(fp.toLower(exchange))(URLS))(currency);
const request$ = Observable
  .interval(1000)
  .map((i) => {
    const index = (i + 1) % currency.length;

    return {
      url: urlArr[index],
      currency: currency[index],
      baseLine: baseLine[index],
    };
  })
  .switchMap(fetchTickers);

const subscription = request$
  .subscribe((tick) => {
    const result = getPrice(tick);
    const { baseLine: b, currency: c, price: p } = result;
    if (!b || !c || !p) {
      pusher.note('', 'Error occured', 'You can not receive response.', (err) => {
        if (err) {
          console.error('Error occured', err);
          throw err;
        }
      });
      throw { name: 'WRONG_RESPONSE', message: 'It throws errors.' };
    }

    if (when === 'low' && Big(p).lte(b)) {
      const title = `${fp.toUpper(c)} is LOW`;
      const contents = `${fp.toUpper(c)} is LOWER then ${b} now!. It's ${p}`;

      pusher.note('', title, contents, (err) => {
        if (err) {
          console.error('Error occured', err);
          throw err;
        }
      });
      subscription.unsubscribe();
    } else if (when === 'high' && Big(p).gte(b)) {
      const title = `${fp.toUpper(c)} is HIGH`;
      const contents = `${fp.toUpper(c)} is HIGHER then ${b} now!. It's ${p}`;

      pusher.note('', title, contents, (err) => {
        if (err) {
          console.error('Error occured', err);
          throw err;
        }
      });
      subscription.unsubscribe();
    }
  });
