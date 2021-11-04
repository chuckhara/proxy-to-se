'use strict'

const proxy = require('express-http-proxy')
const express = require('express')
const PORT = process.env.PORT || 8080
const HOST = '0.0.0.0'
const ES_HOST = process.env.ES_HOST || 'proxy'
const ES_PORT = '9200'

const app = express();
app.use('/es', proxy((req) => {
  return `${ES_HOST}:${ES_PORT}`
}, {
  proxyReqOptDecorator: (proxyReqOps, srcReq) => {
    if(unauthorized(srcReq)) {
      return Promise.reject('UNAUTHORIZED')
    }
    if(inconsistent()) {
      return Promise.reject('INCONSISTENT')
    }
    if(srcReq.method !== 'GET' && srcReq.method !== 'HEAD') {
      return Promise.reject('METHOD_NOT_ALLOWED')
    }
    return proxyReqOps;
  },
  proxyErrorHandler: (err, res, next) => {
    switch(err) {
      case 'UNAUTHORIZED':
        res.statusCode = 401
        res.body = {msg: 'unauthorized'}
        break;
      case 'INCONSISTENT':
        res.statusCode = 200
        res.body = {msg: 'inconsistent'}
        break;
      case 'METHOD_NOT_ALLOWED':
        res.statusCode = 405
        break;
    }
    next(err)
  }
}))

function unauthorized() {
  return Math.random() < 0.3
}
function inconsistent() {
  return Math.random() < 0.3
}

app.get('/hello', (req, res) => {
  res.send({msg: 'hi'})
})

app.listen(PORT, HOST)
console.log(`server running on http://${HOST}:${PORT}`)
