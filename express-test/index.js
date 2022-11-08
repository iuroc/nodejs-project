const express = require('express')
const mysql = require('mysql')
const app = express()
app.get('/searchVideo', (req, res) => {
    let data = {
        name: '欧阳鹏',
        age: 21
    }
    let dataStr = JSON.stringify(data)
    res.set({
        'Content-Type': 'application/json'
    })

    const connection = mysql.createConnection({
        password: '12345678',
        user: 'root',
        database: 'ponconsoft'
    })
    connection.query(`SELECT title, v_pic, v_url FROM xiangjiao_caiji WHERE title LIKE '%${req.query.keyword || ''}%' LIMIT 200`, (err, results) => {
        res.send(JSON.stringify(results))
        res.end()
    })
})
const server = app.listen(8848, () => {
    let host = server.address().address
    let port = server.address().port
})