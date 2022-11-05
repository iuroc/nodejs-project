"use strict";
exports.__esModule = true;
var http = require("http");
var url = require("url");
var request = require("request");
var querystring = require("querystring");
http.createServer(function (req, res) {
    var header = {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    };
    res.writeHead(200, header);
    var urlInfo = url.parse(req.url, true);
    var pathname = urlInfo.pathname || '';
    var query = urlInfo.query;
    if (pathname == '/apee/lanzou') {
        if (!query.url) {
            res.end('请输入url参数');
        }
        else {
            var lanzou = new Lanzou(query.url, query === null || query === void 0 ? void 0 : query.password);
            lanzou.getDownloadUrl(function (downUrl) {
                res.end(downUrl);
            });
        }
    }
    else {
        res.end('请求失败');
    }
}).listen(8000);
var Lanzou = /** @class */ (function () {
    function Lanzou(url, password) {
        if (password === void 0) { password = ''; }
        this.password = '';
        this.url = url;
        this.headers = {
            'User-Agent': 'apee'
        };
        this.password = password;
    }
    /**
     * 获取 iframe URL
     * @param callback 回调函数
     */
    Lanzou.prototype.getFrameUrl = function (callback) {
        var _this = this;
        request({
            url: this.url,
            headers: this.headers,
            callback: function (error, response, body) {
                var pattern;
                if (body.search('<div class="top">') !== -1) {
                    pattern = /<iframe class="ifr2" name="\d{5,}" src="(.*?)"/;
                }
                else if (body.search('passwddiv-input') !== -1) {
                    pattern = /data : \'(.*?)\'/;
                    var re_1 = body.match(pattern);
                    if (re_1) {
                        var postParams = re_1[1] + _this.password;
                        var postParam = querystring.parse(postParams);
                        _this.getDownloadUrlStart(postParam, callback);
                    }
                    return;
                }
                else {
                    pattern = /<iframe class="n_downlink".*?src="(.*?)"/;
                }
                var re = body.match(pattern);
                if (re) {
                    var frameUrl = 'https://www.lanzouw.com' + re[1];
                    _this.getPostParam(frameUrl, callback);
                }
            }
        });
    };
    /**
     * 获取 POST 请求参数
     * @param frameUrl 获取 POST 请求参数
     * @param callback 回调函数
     */
    Lanzou.prototype.getPostParam = function (frameUrl, callback) {
        var _this = this;
        request({
            url: frameUrl,
            method: 'get',
            headers: this.headers,
            callback: function (error, response, body) {
                var postParam = { action: 'downprocess', websign: '', ves: 1 };
                postParam['signs'] = body.match(/var ajaxdata = \'(.*?)\'/)[1];
                postParam['sign'] = body.match(/var msigns = \'(.*?)\'/)[1];
                postParam['websignkey'] = body.match(/var cwebsignkeyc = \'(.*?)\'/)[1];
                _this.getDownloadUrlStart(postParam, callback);
            }
        });
    };
    /**
     * 获取下载链接
     * @param postParam POST请求参数
     * @param callback 回调函数
     */
    Lanzou.prototype.getDownloadUrlStart = function (postParam, callback) {
        request({
            url: 'https://www.lanzouw.com/ajaxm.php',
            method: 'post',
            headers: {
                'user-agent': this.headers['user-agent'],
                'referer': 'https://oyp.lanzoub.com',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: postParam,
            callback: function (error, response, body) {
                var dataJson = JSON.parse(body);
                if (dataJson['url'] == 0) {
                    callback('密码错误');
                    return;
                }
                var downUrl = dataJson['dom'] + '/file/' + dataJson['url'];
                callback(downUrl);
            }
        });
    };
    /**
     * 获取下载链接 (入口)
     * @param callback 回调函数
     */
    Lanzou.prototype.getDownloadUrl = function (callback) {
        this.getFrameUrl(callback);
    };
    return Lanzou;
}());
