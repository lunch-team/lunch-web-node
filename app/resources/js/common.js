'use strict'

import _CONFIG from "./config.js"

function getCookie(name) {
    let value
        = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
    return value ? unescape(value[2]) : null
}

function setCookie(name, value, exp) {
    let date = new Date()
    date.setTime(date.getTime() + (exp ? exp : 1) * 60 * 60 * 24 * 1000)
    document.cookie
        = name + '='
        + value + ';expires='
        + date.toUTCString() + ';path=/'
}

function deleteCookie(name) {
    if (getCookie(name)) {
        let date = new Date();
        document.cookie = name + '= ' + '; expires=' + date.toUTCString()
            + '; path=/'
    } else {
        console.log('no cookie: ' + name)
    }
}

function clearToken() {
    if (getCookie('_accessToken')) {
        deleteCookie('_accessToken')
    }
    if (getCookie('_refreshToken')) {
        deleteCookie('_refreshToken')
    }
    localStorage.clear()
}

// 즉시 실행 함수로 url 세팅
(function (url) {
    try {
        axios.defaults.baseURL = url._BASE_URL
        window._imgurl = url._IMG_URL
        const token = getCookie('_accessToken')
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
    } catch (e) {
        console.log('axios is not imported')
    }
})(_CONFIG)

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
        axios.get(url,
            // JSON.stringify(param.value),
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
            + '>확인</button>'
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
                + '>취소</button>'
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
$(".tab_btn").click(function () {
    $(".tab_btn").removeClass("active");
    $(this).addClass("active");
    var tab_target = $(this).data("target");
    $(".tab_content").hide();
    $("#" + tab_target).show();
});


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

export {
    setCookie,
    getCookie,
    deleteCookie,
    clearToken,
    callAxios,
    popup,
    popupHide,
    // toBase64,
    // showModal
}
