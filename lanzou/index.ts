import * as http from 'http'
import * as url from 'url'
import * as request from 'request'
import * as querystring from 'querystring'


http.createServer((req, res) => {
    let header = {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    }
    res.writeHead(200, header)
    let urlInfo = url.parse(req.url as string, true)
    let pathname = urlInfo.pathname || ''
    let query = urlInfo.query
    if (pathname == '/apee/lanzou') {
        if (!query.url) {
            res.end('请输入url参数')
        } else {
            const lanzou = new Lanzou(query.url as string, query?.password as string)
            lanzou.getDownloadUrl((downUrl: string) => {
                res.end(downUrl)
            })
        }

    } else {
        res.end('请求失败')
    }

}).listen(8000)

interface postParam {
    action: 'downprocess', websign: '', ves: 1, signs?: '', sign?: '', websignkey?: ''
}

class Lanzou {
    private url: string
    private headers: { [key: string]: string }
    private password = ''
    constructor(url: string, password: string = '') {
        this.url = url
        this.headers = {
            'User-Agent': 'apee'
        }
        this.password = password
    }


    /**
     * 获取 iframe URL
     * @param callback 回调函数
     */
    private getFrameUrl(callback: (downUrl: string) => void) {
        var _this = this
        request({
            url: this.url,
            headers: this.headers,
            callback(error, response, body: string) {
                let pattern
                if (body.search('<div class="top">') !== -1) {
                    pattern = /<iframe class="ifr2" name="\d{5,}" src="(.*?)"/
                } else if (body.search('passwddiv-input') !== -1) {
                    pattern = /data : \'(.*?)\'/
                    let re = body.match(pattern)
                    if (re) {
                        let postParams = re[1] + _this.password
                        let postParam = querystring.parse(postParams)
                        _this.getDownloadUrlStart(postParam, callback)
                    }
                    return
                } else {
                    pattern = /<iframe class="n_downlink".*?src="(.*?)"/
                }
                let re = body.match(pattern)
                if (re) {
                    let frameUrl = 'https://www.lanzouw.com' + re[1]
                    _this.getPostParam(frameUrl, callback)
                }
            }
        })
    }


    /**
     * 获取 POST 请求参数
     * @param frameUrl 获取 POST 请求参数
     * @param callback 回调函数
     */
    private getPostParam(frameUrl: string, callback: (downUrl: string) => void) {
        let _this = this
        request({
            url: frameUrl,
            method: 'get',
            headers: this.headers,
            callback: (error, response, body) => {
                let postParam: postParam = { action: 'downprocess', websign: '', ves: 1 }
                postParam['signs'] = body.match(/var ajaxdata = \'(.*?)\'/)[1]
                postParam['sign'] = body.match(/var msigns = \'(.*?)\'/)[1]
                postParam['websignkey'] = body.match(/var cwebsignkeyc = \'(.*?)\'/)[1]
                _this.getDownloadUrlStart(postParam, callback)
            }
        })
    }

    /**
     * 获取下载链接
     * @param postParam POST请求参数
     * @param callback 回调函数
     */
    private getDownloadUrlStart(postParam: postParam | querystring.ParsedUrlQuery, callback: (downUrl: string) => void) {
        request({
            url: 'https://www.lanzouw.com/ajaxm.php',
            method: 'post',
            headers: {
                'user-agent': this.headers['user-agent'],
                'referer': 'https://oyp.lanzoub.com',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: postParam,
            callback: (error, response, body) => {
                let dataJson = JSON.parse(body)
                if (dataJson['url'] == 0) {
                    callback('密码错误')
                    return
                }
                let downUrl = dataJson['dom'] + '/file/' + dataJson['url']
                callback(downUrl)
            }
        })
    }
    /**
     * 获取下载链接 (入口)
     * @param callback 回调函数
     */
    getDownloadUrl(callback: (downUrl: string) => void) {
        this.getFrameUrl(callback)
    }
}