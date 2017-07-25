# remote-tunnel

> Like ngrok, but not limited to HTTP(S) traffic!

## Installation

```sh
npm install -g remote-tunnel
```

## How it works

Start the remote-tunnel (RT) server on a public server of yours somewhere:

```txt
        [example.com]
        /            \
  REST API        Socket Hub
```

The REST API runs on port 3000 (this is not configurable at the moment).
Now on a computer of yours, run the client:

```sh
$ node client.js -h example.com --local-port 22
Public port is 62713
```

This will hit the REST API, requesting that it initialize a tunnel and create a new
entry in its socket hub.  Now, `example.com:62713` tunnels to `localhost:22`!  You can
now connect to your local box via example.com:

```sh
$ ssh -p 62713 example.com
...
```

# License

ISC License (ISC)
Copyright 2017 <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
