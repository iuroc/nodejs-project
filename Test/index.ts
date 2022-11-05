import * as express from 'express'
import * as net from 'net'
const app = express()
app.get('/', (req, res) => {
    res.send('你好')
})
const server = app.listen(8000, () => {
    let host = (<net.AddressInfo>server.address()).address
    let port = (<net.AddressInfo>server.address()).port
    console.log(host, port)
})