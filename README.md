# Coin Ticker Alarm
> Get push notification when coin price get higher/lower than user's input

## Install
```
$ npm i -g coin-ticker-alarm
```

## Prerequisite
```
# Set some variables before running
$ export COIN_TICKERS_EXCHANGE="bithumb";
$ export COIN_TICKERS_PUSHER_KEY="XXXXXXXXXXXX";
$ export COIN_TICKERS_CURRENCY="ETH,BTC";
$ export COIN_TICKERS_WHEN="low";
$ export COIN_TICKERS_PRICE="500000,10000000";
```

__Description__
- `COIN_TICKERS_EXCHANGE` should be one of `bithumb`, `coinone`, `korbit`.
- You can get the API key for `COIN_TICKERS_PUSHER_KEY` in https://www.pushbullet.com/#settings
- `COIN_TICKERS_CURRENCY` should be separated by `,`. or write just one currency. like `BTC`
- `COIN_TICKERS_WHEN` should be one of `low`, `high`.
- `COIN_TICKERS_PRICE` should be separated by `,`. it's count should be same as currencies'.

## Run
```
$ coin-ticker
```

After getting notification, It will be closed automatically.

- If you can not run, upgrade the node version
