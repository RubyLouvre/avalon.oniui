mmRequset-demo
==============
mmRequset-demo is a demo for [mmRequset](https://github.com/RubyLouvre/mmRequest) relying on Node.js.

Getting Started
---------------

### Clone this repository

```
git clone https://github.com/dragonwong/mmRequest-demo.git
```

### Install dependencies

```
cd mmRequest-demo/ && npm install
```

If you are in China, try [cnpm](http://cnpmjs.org/).

### Start sever

```
node ./bin/www
```

If you installed [supervisor](https://github.com/isaacs/node-supervisor), you can also run this:

```
supervisor ./bin/www
```

Now, open your browser and you can see the page in `http://127.0.0.1:3000`. You can configure the port in `./bin/www`.
