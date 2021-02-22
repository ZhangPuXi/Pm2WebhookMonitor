# PM2 Webhook Monitor

This is a pm2 module which monitors application processes and sends log messages of specified events, exceptions and errors.

At the first, I want to monitor my application and I want a program which can notify me on WeChat when my application crashes. But, for some reason, I have to implement this by a private webhook url. So this module is only works for me. If you want to use a public webhook url (e.g. WeChat webhook) or your own private url, you can fork this module and implement your own `notify` function in `index.js`. It's very easy.

## Usage

You should install this module first:

```sh

pm2 install pm2-webhook-monitor

```

To get this module work, you need to tell it your webhook url:

```sh

pm2 set pm2-webhook-monitor:webhookUrl < https://www.webhook.com/notify.action >

```

And for my case, I use phone numbers to specify the people who will receive the notification. It could be set like this:

```sh

pm2 set pm2-webhook-monitor:phone "13000000000,13000000001"

```

## Configuration

Here are the all configuration items and their default value.

```json

{
  "webhookUrl"        : null,
  "log"               : false,
  "error"             : true,
  "kill"              : true,
  "exception"         : true,
  "restart"           : true,
  "reload"            : true,
  "delete"            : true,
  "stop"              : true,
  "restart overlimit" : true,
  "exit"              : false,
  "start"             : false,
  "online"            : false,
  "phone"             : null
}

```

You can config them by using:

```sh

pm2 set pm2-webhook-monitor:<key> <value>

```

## Ackownledgements

- [pm2-slack](https://github.com/mattpker/pm2-slack) : This project inspired me to create this module, thanks to every one contributes to this project, thanks for their hard-working and open source spirit.

- [sailor103](https://github.com/sailor103) : This is one of my best friends, he lets me know the `pm2-slack`, and he often plays the duck role in my rubber duck debugging. Thanks for his time and love(just love between friends, I'm not a gay, but I'm not sure if he is a gay :smirk: ).
