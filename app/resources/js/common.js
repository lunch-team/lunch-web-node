'use strict'

import _BASE_URL from "./config.js"

// 즉시 실행 함수로 url 세팅
(function (url) {
    try {
        axios.defaults.baseURL = url
    } catch (e) {
        console.log('axios is not imported')
    }
})(_BASE_URL)

function callAxios(type, url, param) {
    if (!url) {
        alert('URL not exist.')
        return false
    }
    if (!param.value) {
        param.value = {}
    }
    if (!param.resolve || typeof param.resolve !== 'function') {
        param.resolve = function (response) {
            console.log(response)
        }
    }
    if (typeof param.reject !== 'function') {
        param.reject = function (error) {
            console.log(error.response)
        }
    }
    if (!param.header) {
        param.header = {'Content-Type': `application/json`}
    }
    if (type.toUpperCase() === 'GET') {
        axios.get(url, JSON.stringify(param.value),
            {headers: param.header}
        ).then(param.resolve).catch(param.reject)
    } else if (type.toUpperCase() === 'POST') {
        axios.post(url, JSON.stringify(param.value),
            {headers: param.header}
        ).then(param.resolve).catch(param.reject)
    } else {
        alert('HTTP Method is allow "GET, POST"')
        return false
    }
}

//parameter : type, url, data
function ajaxConnect(type, url, param) {

    var connectUrl = _BASE_URL + "/menu/";
    var returnData = {};
    $.ajax({
        type: type,
        url: connectUrl + url,
        dataType: 'json',
        async: false,
        contentType: 'application/json',
        data: JSON.stringify(param),
        success: function (data, textStatus, xhr) { //통신 성공
            //console.log(data);
            //  $('#loading_container').hide();
            if (data !== undefined) {
                returnData = {"data": data};
            } else if (xhr !== undefined) {
                returnData = {"xhr": xhr.status};
            } else if (textStatus) {
                returnData = {"textStatus": textStatus};
            }
            console.log(param)
            if (typeof param.callback === 'function') {
                console.log('callback is running.')
                param.callback()
            }
        },
        error: function (e) { //실패

            console.error(e);
            returnData = {"error": e.status, "errMsg": '오류가 발생하였습니다.'};
        }
    });
    return returnData;
}

function popupHide() {
    $('.popup').remove()
    $('.popup-dimmed').remove()
}

function popup(options) {
    console.log(options)
    var $body = $('body')

    if (!$body.children('.popup-dimmed').length) {
        $body.append('<div class="popup-dimmed"/>')
    }

    if (!$body.children('#' + options.id).length) {
        $body.append('<div class="popup" id="' + options.id + '"/>')

        var $popup = $('.popup')

        if (options.title) {
            $popup.append(
                '<div class="popup-title">' + options.title + '</div>')
        }

        $popup.append('<div class="popup-content">')
        if (options.html) {
            $popup.append(
                options.html
            )
        } else {
            $popup.append(
                '<p class="popup-txt">' + options.content + '</p>'
            )
        }
        $popup.append('</div>')

        $popup.append('<div class="popup-btn-wrap"></div>')

        var $popupBtnWrap = $('.popup-btn-wrap')
        $popupBtnWrap.append(
            '<button '
            + 'type="button" '
            + 'class="popup-y-btn popup-btn popup-btn-primary" '
            + 'id="popupBtnDoneY" '
            + '>OK</button>'
        )

        if (typeof options.callback === 'function') {
            $('#popupBtnDoneY').on('click', function () {
                options.callback()
                popupHide()
            })
        } else {
            $('#popupBtnDoneY').on('click', popupHide)
        }

        if (options.type === 2 || options.type === '2') {
            $popupBtnWrap.addClass('popup-btn2')
            $popupBtnWrap.prepend(
                '<button '
                + 'type="button" '
                + 'class="popup-cls popup-btn" '
                + 'data-cls="popup-common-popup"'
                + '>Cancel</button>'
            )

            $('.popup-cls').on('click', popupHide)
        } else {
            var $btnY = $('.popup-y-btn')
            $btnY.css('width', '100%')
        }

        $popup.show()
        $('.popup-dimmed').show()
    }
}

/* ----------------------------------------------
    탭 (공통)
--------------------------------------------------- */
$(".tab_btn").click(function(){
    $(".tab_btn").removeClass("active");
    $(this).addClass("active");
    var tab_target = $(this).data("target");
    $(".tab_content").hide();
    $("#" + tab_target).show();
});

var showModal = function(btn_cnt, content){
    var temp = '';
    temp += '<div class="popup">';
    temp += '<div class="wrapper"><span class="txt">' + content + '</span></div>';
    if(btn_cnt === 1){  //알림
        temp += '<div class="popup_btn_wrap">';
        temp += '<button type="button" class="popup_cls" >확인</button>';
    }else if(btn_cnt === 2){  //컨펌
        temp += '<div class="popup_btn2_wrap">';
        temp += '<button type="button" class="popup_cls" >아니오</button>';
        temp += '<button type="submit" class="popup_cls" >예</button>';
    }
    temp += '</div></div>';
    temp += '<div class="dimmed"></div>';
    $("body").append(temp);
    $(".popup").show();
    $(".dimmed").show();
    /* 팝업 닫기 */
    $(".popup_cls").click(function(){
        $(".popup").remove();
        $(".dimmed").remove();
    });
};

// text to base64  p.s) 브라우저가 제공하는 btoa는 jsonstring을 base64로 변환하지 못해서 따로 사용함.
function toBase64(str) {
    var Base64 = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function (e) {
            var t = "";
            var n, r, i, s, o, u, a;
            var f = 0;
            e = Base64._utf8_encode(e);
            while (f < e.length) {
                n = e.charCodeAt(f++);
                r = e.charCodeAt(f++);
                i = e.charCodeAt(f++);
                s = n >> 2;
                o = (n & 3) << 4 | r >> 4;
                u = (r & 15) << 2 | i >> 6;
                a = i & 63;
                if (isNaN(r)) {
                    u = a = 64
                } else if (isNaN(i)) {
                    a = 64
                }
                t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o)
                    + this._keyStr.charAt(u) + this._keyStr.charAt(a)
            }
            return t
        },
        decode: function (e) {
            var t = "";
            var n, r, i;
            var s, o, u, a;
            var f = 0;
            e = e.replace(/[^A-Za-z0-9+/=]/g, "");
            while (f < e.length) {
                s = this._keyStr.indexOf(e.charAt(f++));
                o = this._keyStr.indexOf(e.charAt(f++));
                u = this._keyStr.indexOf(e.charAt(f++));
                a = this._keyStr.indexOf(e.charAt(f++));
                n = s << 2 | o >> 4;
                r = (o & 15) << 4 | u >> 2;
                i = (u & 3) << 6 | a;
                t = t + String.fromCharCode(n);
                if (u != 64) {
                    t = t + String.fromCharCode(r)
                }
                if (a != 64) {
                    t = t + String.fromCharCode(i)
                }
            }
            t = Base64._utf8_decode(t);
            return t
        },
        _utf8_encode: function (e) {
            e = e.replace(/rn/g, "n");
            var t = "";
            for (var n = 0; n < e.length; n++) {
                var r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r)
                } else if (r > 127 && r < 2048) {
                    t += String.fromCharCode(r >> 6 | 192);
                    t += String.fromCharCode(r & 63 | 128)
                } else {
                    t += String.fromCharCode(r >> 12 | 224);
                    t += String.fromCharCode(r >> 6 & 63 | 128);
                    t += String.fromCharCode(r & 63 | 128)
                }
            }
            return t
        },
        _utf8_decode: function (e) {
            var t = "";
            var n = 0;
            var r = c1 = c2 = 0;
            while (n < e.length) {
                r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r);
                    n++
                } else if (r > 191 && r < 224) {
                    c2 = e.charCodeAt(n + 1);
                    t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                    n += 2
                } else {
                    c2 = e.charCodeAt(n + 1);
                    c3 = e.charCodeAt(n + 2);
                    t += String.fromCharCode(
                        (r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                    n += 3
                }
            }
            return t
        }
    };
    return Base64.encode(str);
}

Date.prototype.format = function (f) {
    if (!this.valueOf()) {
        return " ";
    }
    var weekKorName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var weekKorShortName = ["일", "월", "화", "수", "목", "금", "토"];
    var weekEngName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday"];
    var weekEngShortName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var d = this;
    return f.replace(/(yyyy|yy|MM|dd|KS|KL|ES|EL|HH|hh|mm|ss|zz|a\/p)/gi,
        function ($1) {
            switch ($1) {
                case "yyyy":
                    return d.getFullYear(); // 년 (4자리)
                case "yy":
                    return (d.getFullYear() % 1000).zf(2); // 년 (2자리)
                case "MM":
                    return (d.getMonth() + 1).zf(2); // 월 (2자리)
                case "dd":
                    return d.getDate().zf(2); // 일 (2자리)
                case "KS":
                    return weekKorShortName[d.getDay()]; // 요일 (짧은 한글)
                case "KL":
                    return weekKorName[d.getDay()]; // 요일 (긴 한글)
                case "ES":
                    return weekEngShortName[d.getDay()]; // 요일 (짧은 영어)
                case "EL":
                    return weekEngName[d.getDay()]; // 요일 (긴 영어)
                case "HH":
                    return d.getHours().zf(2); // 시간 (24시간 기준, 2자리)
                case "hh":
                    return ((h = d.getHours() % 12) ? h : 12).zf(2); // 시간 (12시간 기준, 2자리)
                case "mm":
                    return d.getMinutes().zf(2); // 분 (2자리)
                case "ss":
                    return d.getSeconds().zf(2); // 초 (2자리)
                case "zz":
                    return d.getUTCMilliseconds().zf(3); // 밀리초 (3자리)                    
                case "a/p":
                    return d.getHours() < 12 ? "오전" : "오후"; // 오전/오후 구분
                default:
                    return $1;
            }
        });
};

String.prototype.string = function (len) {
    var s = '', i = 0;
    while (i++ < len) {
        s += this;
    }
    return s;
};

String.prototype.zf = function (len) {
    return "0".string(len - this.length) + this;
};

Number.prototype.zf = function (len) {
    return this.toString().zf(len);
};

export {callAxios, ajaxConnect, _BASE_URL, popup, popupHide, toBase64, showModal}
