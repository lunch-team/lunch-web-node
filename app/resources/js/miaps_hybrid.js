/*!
 * miaps hybrid v1.0
 * Copyright 2017 thinkM, Inc. All rights reserved.
 * 
 * This software is proprietary information of thinkM, Inc.
 * You shall not disclose such Confidential Information and shall use it 
 * only in accordance with the terms of the license agreement you entered into with thinkM.
 */
(function (window, factory) {
	if (window._debug == undefined) { window._debug = true;} // true, false
	if (window._miaps_runmode == undefined) { window._miaps_runmode = 'dev'; } // dev, real
	window._svc = "MiAPS"; // MiAPS or XECURE
	window._pccmmtype = "AJAX"; // DWR or AJAX
	window._usecontext = false; // URL에 context root가 있으면 true, 없으면 false
		
	var pathConfig = {
		miapsNotifyPath: "vendor/miaps/js/",	// 개인 프로젝트별로 재정의 (miaps_notify.js path)
		miapsExtLibPath: "vendor/miaps/js/",	// 개인 프로젝트별로 재정의 (miaps_extlib.js path)
		myFileRoot: "/dlenc/"					// 개인 프로젝트별로 재정의 (hybrid local path, Ex: /hybrid/)
	}

	// 아래 if문은 프로젝트/프로젝트로 설정될 경우 코멘트 처리 합니다.
	/*if (navigator.userAgent.match(/Android|iPhone|iPod|iPad/i) && (navigator.platform.match(/Linux|null/i) || navigator.platform.match(/iPhone|iPad|iPod/i))) {
		pathConfig.myFileRoot = "/";
	}*/
	
	window._pathConfig = pathConfig;
	
	var url = location.pathname;
	/*if (window._debug) {
		console.log('pathname: ' + location.pathname); // /miaps/hybrid2/index.html , /index.html
		console.log('hostname:' + location.hostname);
		console.log('protocol:' + location.protocol);
		console.log('port:' + location.port);
		console.log('assign:' + location.assign);
		console.log('hash:' + location.hash);
		console.log('href:' + location.href);
		console.log('document.referrer:' + document.referrer);
	}*/
	var lastPathIndex = url.lastIndexOf("/", url.length);
	var rootIndex = url.indexOf(pathConfig.myFileRoot, 0);
		
	var tmpStr = url.substring(rootIndex + pathConfig.myFileRoot.length, lastPathIndex + 1); //첫번째 /는 제외
	if (tmpStr == '/') {
		tmpStr = '';
	}
	//if (window._debug) { console.log(tmpStr); }
	/* root index를 찾고, 마지막 /를 찾은 후, root부터 마지막/까지의 문자열안에 '/'수를 찾아서 그 개수만큼 '..'를 붙여준다. */
	var pathNum = tmpStr.match(/\//g);
	var resPath = "./";
	if (pathNum != null) {
		resPath = "";
		for (i = 0; i < pathNum.length; i++) {
			resPath += "../";
		}
	}
	var extlibPath = resPath + pathConfig.miapsExtLibPath + 'miaps_extlib.js';
	resPath = resPath + pathConfig.miapsNotifyPath + 'miaps_notify.js';
	
    //Environment Detection
    if (typeof define === 'function' && define.amd) {
    	//if (window._debug) { console.log('AMD-' + 'resPath:' + resPath + ', extlibPath: ' + extlibPath); }
    	//AMD
    	if(navigator.platform.match(/Win32/i) || navigator.platform.match(/Mac/i)) {
            define([resPath, extlibPath], factory);
    	} else {
    		define([resPath, null], factory);
    	}
    } else {
    	//if (window._debug) { console.log('Not AMD-' + 'resPath:' + resPath + ', extlibPath: ' + extlibPath); }
        // Script tag import i.e., IIFE
    	if(navigator.platform.match(/Win32/i) || navigator.platform.match(/Mac/i)) {
    		factory(resPath, extlibPath);	
    	} else {
    		factory(resPath, null);
    	}
    }
}(window, function (miapsnotify, miapsextlib) {
	
	var _gMiapsNotify = null;
	var _gMiapsExtlib = null;
	
	//var _gPort = window.location.port;
	
	var MiapsHybrid = {
		Version: '1.1.0',
		ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
		JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,
		resultData : null,
		timerId: null,
		defServlet: '/minkSvc',
		mh_model: '',
		mh_os: '',
		maxLogLength: 2000,	
		serverInfo : [],
		sendUrl : '',
	  	MobilePlatform : {
		    Android: function () {
		    	return navigator.userAgent.match(/Android/i);
		    },
		    BlackBerry: function () {
		        return navigator.userAgent.match(/BlackBerry/i);
		    },
		    iPhone: function () {
		        return navigator.userAgent.match(/iPhone|iPod/i);
		    },
		    iPad: function () {
		    	return navigator.userAgent.match(/iPad|Macintosh/i);
		    	//return navigator.userAgent.match(/iPad|Macintosh/i) && 'ontouchend' in document; // MiAPS Hybrid App은 Macintosh를 iPad로 바꿔서 통신함.		    	
			},
			iOS: function() {
				return navigator.userAgent.match(/iPhone|iPod|iPad/i);
			},
		    Opera: function () {
		        return navigator.userAgent.match(/Opera Mini/i);
		    },
		    Windows: function () {
		        return navigator.userAgent.match(/IEMobile/i);
		    },
		    any: function () {
		        return (MobilePlatform.Android() || MobilePlatform.BlackBerry() || MobilePlatform.iOS() || MobilePlatform.Opera() || MobilePlatform.Windows());
		    }
		},		
		NaviPlatform : {
			Windows: function() {
				return navigator.platform.match(/Win32/i);				
			},
			Mac: function() { // MacIntel
				return navigator.platform.match(/Mac/i);
				//return navigator.platform.match(/Mac/i) && !'ontouchend' in document;
			},
			Android: function() {
				return navigator.platform.match(/Linux|null/i);
			},
			iOS: function() {
				return navigator.platform.match(/iPhone|iPad|iPod/i);
			}
		},
		
		isAndroid: function() {
			return MiapsHybrid.NaviPlatform.Android();
		},
		
		isIOS: function() {
			return MiapsHybrid.NaviPlatform.iOS();
		},
		
		isPC: function() {
			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				return true;
			} else {
				return false;
			}
		},

		isWebView: function() {
			/* 2021.04.27 chlee
			 * MiAPS Hybrid WebView의 UserAgent에는 MiAPSHybrid가 포함되어 있다.
			 */
			return navigator.userAgent.match(/MiAPSHybrid/i);
		},
		
		/* 내부용 함수, 외부에서 호출하지 않습니다. */
		ajaxSvc : function(svc_name, send_data, cb_func) {
			/* 2021.06.11 chlee, $.ajax를 override할 경우도 있으므로 여기서 사용하지 않도록 한다.(override하면 무한 루프에 빠진다.)
			$.ajax({
				url: 'http://'+ location.hostname + ':' + location.port + _gContextNm + '/hybrid/' + svc_name,
				async: true,
				type: 'post',
				data: send_data,
				dataType: 'text', // xml, json, script, html
				success: function (jsXHR) {
					if (cb_func != null) {
						cb_func(jsXHR);
					}
				},
				error: function (jsXHR) {
					if (cb_func != null) {
						cb_func(jsXHR);
					}
				}
			});
			*/
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {				
				if (xhr.status === 200 || xhr.status === 201) {
					console.log(xhr.response);
					if (cb_func != null)
						cb_func(xhr.response);					
				} else {
					console.log(xhr.response);
					if (cb_func != null)
						cb_func(xhr.response);
				}
			}
			xhr.open('post', location.protocol+'//'+location.host + _gContextNm + '/hybrid/' + svc_name);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			if (typeof send_data == 'object')
                xhr.send($.param(send_data));
			else
				xhr.send(send_data);
		},
		
		/**
		 * MiAPS Player Version Check Script.<br>
		 * Local에서 개발할 때는 파라메터와 콜백함수가 사용되지만 앱에서 호출 될 때는 무시됩니다.<br>
		 * @param params platform_cd, sw_name (앱에서는 무시)
		 * @param cb_func 콜백함수명 (앱에서는 무시)
		 * <pre> 
		 * {@code
		 * * Local테스트 예(브라우저)
		 * MiapsHybrid.updateApp('platform_cd=2000012&sw_name=kr.co.miaps.mshop.dev', callbackfunction); // 브라우저 테스트
		 * * 앱
		 * MiapsHybrid.updateApp(null, null); // 기본
		 * MiapsHybrid.updateApp('/minkSvc', null) // application.json의 serverurl에 /minkSvc같은 컨텍스트가 없는 버전을 사용할 경우.
		 * }
		 * </pre>
		 */
		updateApp : function(params, cb_func) {
			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				if (window._debug) {
					console.log("call updateApp...");
				}
				if (window._pccmmtype == 'DWR') {
					miaps_hybrid.updateApp(params, cb_func);
				} else if (window._pccmmtype == 'AJAX') {
					var sendValue = {};
					if (params != null && params.indexOf('platform_cd') > -1 && params.indexOf('sw_name') > -1) {
						sendValue.values = params;
					} else {
						sendValue.values = null;
					}
					
					if (window._debug) { console.log('http://'+ location.hostname + ':' + location.port + _gContextNm + '/hybrid/updateApp.miaps'); }
					
					MiapsHybrid.ajaxSvc('updateApp.miaps', sendValue, cb_func);					
				}
			} else { // Linux armv, iP*			
				/* Android */
				if (MiapsHybrid.MobilePlatform.Android()) {
					if (params != null && params.indexOf('platform_cd') == -1 && params.indexOf('sw_name') == -1) {
						window.MiAPS.updateApp(params);
					} else {
						window.MiAPS.updateApp(MiapsHybrid.defServlet);
					}
				/* iPhone/iPad */
				} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
					var scheme = "MiapsHybrid://mode=updateApp";
					if (params != null && params.indexOf('platform_cd') == -1 && params.indexOf('sw_name') == -1) {
						scheme += "&pathname=" + encodeURIComponent(params);  
					} else {
						scheme += "&pathname=" + encodeURIComponent(MiapsHybrid.defServlet);
					}
					window.webkit.messageHandlers.miapshybrid.postMessage(scheme);					
				}
			}
		},
	
		/**
		 * MiAPS Player SetDeviceInfo Script.<br>
		 * 로그인 작업 후 miaps_user테이블에 유저 데이터가 입력되어 user_no가 발행되고 난 후 사용 합니다.<br>
		 * userid, userpw, userno, groupid를 입력받아 MiAPS통신 프로토콜에 삽입하여, 이후 모든 통신에 해당 정보를 삽입 합니다.<br>
		 * 이 후 라이선스 체크 및 SaveDeviceInfo를 실행하여 푸시정보등을 DB에 저장합니다.<br>
		 * Local테스트 시는 ${mink.home}/conf/miaps.savedeviceinfo.properties의 데이터를 사용 해 SaveDeviceInfo를 실행 합니다.
		 * 콜백함수는 Local 테스트에서만 호출 되고 앱에서는 무시 됩니다.
		 * @param userid 유저ID
		 * @param userpw 유저PASSWORD
		 * @param userno 유저NO (MiAPS발행 Sequence)
		 * @param groupid 그룹ID
		 * @param cb_func 콜백함수명 (앱에서는 무시) 또는 minkNewUserName
		 * @pathname
		 */
		setDeviceInfo : function() {
			var userid = '', userpw = '', userno = '', groupid = '', cb_func = '', pathname  = '', minkNewUserName = '';
			userid = arguments[0];
			userpw = arguments[1];
			userno = arguments[2];
			groupid = arguments[3];
			
			if (arguments[4] == null || arguments[4] == '') {
				cb_func = null;
			} else if (typeof(arguments[4]) === 'function') { // callback function			
				cb_func = arguments[4];
			} else if (arguments[4] != '' && typeof(arguments[4]) === 'string') {	// minkNewUserName
				minkNewUserName = arguments[4];
			}
			
			if (arguments.length == 6) {
				pathname = arguments[5];
			}
						
			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				if (window._debug) {
					console.log("call setDeviceInfo: userid-" + userid + ", userpw-" + userpw + ", userno-" + userno + ", groupid-" + groupid + ", minkNewUserName-" + minkNewUserName);
				}
				if (window._pccmmtype == 'DWR') {
					miaps_hybrid.setDeviceInfo(userid, userpw, userno, groupid, cb_func);
				} else if (window._pccmmtype == 'AJAX') {
					var sendValue = {
							userid : userid,
							userpw : userpw,
							userno : userno,
							groupid : groupid
						};
					if (arguments.length == 6) {
						sendValue.pathname = pathname;
					}
					
					if (cb_func == null || typeof(cb_func) === 'function') { // callback function
						MiapsHybrid.ajaxSvc('setDeviceInfo.miaps', sendValue, cb_func);
						
					} else if (minkNewUserName != '') {	// minkNewUserName
						sendValue.minkNewUserName = minkNewUserName;
						MiapsHybrid.ajaxSvc('setDeviceInfo.miaps', sendValue, null);		
					}			
				}
			} else {
				/* Android */
				if (MiapsHybrid.MobilePlatform.Android()) {
					if (pathname != null && pathname != '') {
						window.MiAPS.setDeviceInfo(pathname, encodeURIComponent(userid), encodeURIComponent(userpw), userno, encodeURIComponent(groupid), encodeURIComponent(minkNewUserName));
					} else {
						window.MiAPS.setDeviceInfo(MiapsHybrid.defServlet, encodeURIComponent(userid), encodeURIComponent(userpw), userno, encodeURIComponent(groupid), encodeURIComponent(minkNewUserName));	
					}
				/* iPhone/iPad */
				} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
					var scheme ="MiapsHybrid://mode=setDeviceInfo";
					scheme += "&userid=" + encodeURIComponent(userid)
						+ "&userpw=" + encodeURIComponent(userpw) 
						+ "&userno=" + userno 
						+ "&groupid=" + encodeURIComponent(groupid);
					if (pathname != null && pathname != '') {
						scheme += "&pathname=" + encodeURIComponent(pathname); // 패키지명.json(application.json)파일내에 serverurl에 minkSvc를 사용하지 않을 경우 pathname을 받아서 serverurl+pathname으로 호출
					} else {
						scheme += "&pathname=" + encodeURIComponent(MiapsHybrid.defServlet);
					}
					scheme += "&minkNewUserName=" + encodeURIComponent(minkNewUserName);
					
					window.webkit.messageHandlers.miapshybrid.postMessage(scheme);					
				}
			}
		},
	
		/**
		 * MiAPS 서버에 작성한 함수 호출 Script.<br>
		 * 
		 * @param classname class의 전체이름 (예: com.mink.connectors.xxxx.login.LoginMan)
		 * @param methodname 위 class에서 호출 할 method명
		 * @param target MiAPS 어드민센터 설정&gt;업무구분 설정에 정의한 업무구분
		 * @param params 호출 할 함수로 전달할 파라메터
		 * @param cb_func_nm 앱에서 호출 할 콜백함수, String
		 * @param cb_func 웹에서 호출 할 콜백함수, Object
		 * @param pathname /minkSvc이외의 사용할 서블릿명을 입력. 해당명은 web.xml에 등록되어 있어야 합니다.
		 */
		miapsSvc : function() {
			var classname = '', methodname = '', target = '', params = '', cb_func_nm = '', cb_func = '', pathname = MiapsHybrid.defServlet, headerObj = '';
			classname = arguments[0];
			methodname = arguments[1];
			target = arguments[2];
			params = arguments[3];
			cb_func_nm = arguments[4];
			cb_func = arguments[5];
			
			if (arguments.length == 7) {
				if (typeof(arguments[6] == 'string')) {
					pathname = arguments[6];
				} else if (typeof(arguments[6] == 'object')) {
					headerObj = arguments[6];
				}
			} else if (arguments.length == 8) {
				pathname = arguments[6];
				headerObj = arguments[7];
			}

			var header = '';
			if (headerObj != null && headerObj != '' && typeof(headerObj) == 'object') {
				header = MiapsHybrid.serialize(headerObj);
			}
			
			var sendParam = MiapsHybrid.serialize(params);
			MiapsHybrid.resultData = null;
			
			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				if (window._debug) {
					console.log("classname:" + classname + ", methodname:" + methodname + ", target:" + target + ", params:" + params + ", cbfunc:" + cb_func);
				}
				
				if (window._pccmmtype == 'DWR') {
					miaps_hybrid.miapsSvc(classname, methodname, target, sendParam, cb_func);
				} else if (window._pccmmtype == 'AJAX') {
					var sendValue = {
							classname : classname,
							methodname : methodname,
							target : target,
							params : sendParam,
							header : header,
							pathname : pathname
						};
					MiapsHybrid.ajaxSvc('miapsSvc.miaps', sendValue, cb_func);
				}
			} else {
				/* Use MiAPS */
				if(window._svc == 'MiAPS') {
					/* Android */
					if (MiapsHybrid.MobilePlatform.Android()) {
						
						if (MiapsHybrid.sendUrl != '') { // url을 직접 전달 할 경우 추가
							// pathname, classname, methodname, target, params, header, callback
							window.MiAPS.runMiaps(pathname, classname, methodname, target, encodeURIComponent(sendParam), encodeURIComponent(header), encodeURIComponent(cb_func_nm), encodeURIComponent(MiapsHybrid.sendUrl));
						} else {
							window.MiAPS.runMiaps(pathname, classname, methodname, target, encodeURIComponent(sendParam), encodeURIComponent(header), encodeURIComponent(cb_func_nm));
						}
					/* iPhone/iPad */
					} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
						var scheme ="MiapsHybrid://mode=runMiaps&classname=" + encodeURIComponent(classname)
								+ "&methodname=" + encodeURIComponent(methodname)
								+ "&target=" + encodeURIComponent(target)
								+ "&pathname=" + pathname
						 		+ "&params=" + encodeURIComponent(sendParam)
								+ "&cb_func=" + encodeURIComponent(cb_func_nm)
								+ "&header=" + encodeURIComponent(JSON.stringify(headerObj));
						if (MiapsHybrid.sendUrl != '') { // url을 직접 전달 할 경우 추가
							scheme += "&serverurl=" + encodeURIComponent(MiapsHybrid.sendUrl);
						}
						window.webkit.messageHandlers.miapshybrid.postMessage(scheme);
					}
				} else if (window._svc == 'XECURE') {
					/* Use Xecure */
					var configObj = {
							type: "EXTLIB",
							param: {
								name: 'XECURE',
								method: 'blockenc',
								param: {
									classname: classname,
									methodname: methodname,
									target: target,
									params: sendParam
								}
							},
							callback: cb_func_nm
						};
					var configJsonStr = JSON.stringify(configObj);
					
					/* Android */
					if (MiapsHybrid.MobilePlatform.Android()) {					
						window.MiAPS.mobile(encodeURIComponent(configJsonStr));
						
					/* iPhone/iPad */
					} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
						var scheme ="MiapsHybrid://mode=mobile&param=" + encodeURIComponent(configJsonStr);
						window.webkit.messageHandlers.miapshybrid.postMessage(scheme);					
					}				
				}
			}
		},
		miapsSvcSp: function () {
			// 2020.02.02 add header (header is object type)
			var classname = '', methodname = '', params = '', pathname = '', callback = '', iframeid = '', header = '';
			classname = arguments[0];
			methodname = arguments[1];
			params = arguments[2];
			
			if (typeof(arguments[3]) === 'function') {
				callback = arguments[3];
			} else if (typeof(arguments[3]) === 'string') {
				pathname = arguments[3];
				callback = arguments[4];
			} else { // 4번째 파라메터는 pathname또는 callback function이여야 합니다. object등 다른 타입이면 에러 입니다.
				alert("Invalid parameter");
				return;
			}
			/*
			if (arguments.length > 4) {
				if (typeof(arguments[3]) === 'function') {					
					iframeid = arguments[4];					
				} else if (typeof(arguments[3]) === 'string') {
					iframeid = arguments[5];
				}
			}*/

			if (arguments.length == 5) {
				// class, method, params, path, callback
				// class, method, params, callback, iframeid
				// class, method, params, callback, header
				if (typeof(arguments[3]) === 'function') {
					if (typeof(arguments[4]) === 'string') {				
						iframeid = arguments[4];
					} else if (typeof(arguments[4]) === 'object') {
						header = arguments[4];
					}			
				}
			} else if (arguments.length == 6) {
				// class, method, params, path, callback, iframeid
				// class, method, params, path, callback, header
				// class, method, params, callback, iframeid, header
				if (typeof(arguments[3]) === 'function') {
					iframeid = arguments[4];
					header = arguments[5];
				} else if (typeof(arguments[3]) === 'string') {
					if (typeof(arguments[5]) === 'string') {				
						iframeid = arguments[5];
					} else if (typeof(arguments[5]) === 'object') {
						header = arguments[5];
					}
				}
			} else if (arguments.length == 7) {
				iframeid = arguments[5];
				header = arguments[6];
			}

			if (header != '' && typeof(header) != 'object') {
				alert("Invalid parameter (header is object type)");
				return;
			}
			
			if (pathname == null || pathname === '') {
				pathname = MiapsHybrid.defServlet;
			}
			
			var _className = classname; // 'com.mink.connectors.{mink.profile}' + classname
			var _targetName = _className + '.' + methodname;
			//var sendParam = MiapsHybrid.serialize(params);
			
			if  (callback == null || callback == '') {
				MiapsHybrid.miapsSvc(_className, methodname, _targetName, params, '', null, pathname, header);
			} else {
				//if (window._debug) { console.log(callback.name); }
				if (callback.name == null || callback.name == '') { // 콜백명이 없으면 임시로 만든다.					
					var tmpCallbackNm = '_miapsTmpCb' + Math.random().toString(36).substring(7);
					if (window._debug) { console.log(tmpCallbackNm); }
					
					window[tmpCallbackNm] = callback;
					if (window._debug) { console.log(window[tmpCallbackNm]); }
					
					if (iframeid != null && iframeid != '') {
						var iframeCallbackNm = 'document.getElementById("' + iframeid + '").contentWindow.' + tmpCallbackNm;						
						MiapsHybrid.miapsSvc(_className, methodname, _targetName, params, iframeCallbackNm, window[tmpCallbackNm], pathname, header);
					} else {
						MiapsHybrid.miapsSvc(_className, methodname, _targetName, params, tmpCallbackNm, window[tmpCallbackNm], pathname, header);	
					}
				} else {
					window[callback.name] = callback;
					if (window._debug) { console.log(callback.name); }
					MiapsHybrid.miapsSvc(_className, methodname, _targetName, params, callback.name, window[callback.name], pathname, header);
				}
			}
		},
		// 통신 시 파라메터를 object를 사용, 2021.02.08 chlee (앱도 수정해야 해서 당장 적용은 어렵..)
		miapsSvcEx : function(obj, cb_func) { // param:object, callback:function
			if (typeof obj != 'object') {
				if (_debug) console.log('전달 파라메터는 object type이여야 합니다.');				
				return;
			}
			/* {
				class: '',			// fixed
				method : '',		// fixed
				target: ''			// optional
				path: '/minkSvc'	// optional
				ifarmeid: ''		// optional
				headers : {},		// optional
				params : {}			// optional
			}
			*/
			var classname = '', methodname = '', target = '', params = '', pathname = '', iframeid = '', header = '', tmpCallbackNm = '';
			if (cb_func != null || cb_func != '') {
				if (cb_func.name == null || cb_func.name == '') { // 콜백명이 없으면 임시로 만든다.					
					tmpCallbackNm = '_miapsTmpCb' + Math.random().toString(36).substring(7);
					if (window._debug) { console.log(tmpCallbackNm); }
					window[tmpCallbackNm] = cb_func;
					if (window._debug) { console.log(window[tmpCallbackNm]); }
					
					if (obj.hasOwnProperty('ifarmeid') && iframeid != null && iframeid != '') {
						tmpCallbackNm = 'document.getElementById("' + iframeid + '").contentWindow.' + tmpCallbackNm;
					}							
				} else {
					tmpCallbackNm = cb_func.name; 
					window[tmpCallbackNm] = cb_func;
					if (window._debug) { console.log(tmpCallbackNm); }					
				}
			}
			classname = obj.class;
			methodname =  obj.method;
			target = (obj.hasOwnProperty('target')) ? obj.target : '';
			pathname = (obj.hasOwnProperty('path')) ? path : '/minkSvc';
			
			if (MiapsHybrid.isPC()) {
				if (window._pccmmtype == 'DWR') {
					console.log('Not supported');
				} else if (window._pccmmtype == 'AJAX') {
					params = (obj.hasOwnProperty('params')) ? MiapsHybrid.serialize(obj.params) : '';
					header = (obj.hasOwnProperty('headers')) ? MiapsHybrid.serialize(obj.headers) : '';
					var sendValue = {
						classname : classname,
						methodname : methodname,
						target : target,
						params : params,
						header : header,
						pathname : pathname
					};
					MiapsHybrid.ajaxSvc('miapsSvc.miaps', sendValue, window[tmpCallbackNm]);
				}
			} else {
				if(window._svc == 'MiAPS') {
					var sendData = {
						"classname": classname
						,"methodname": methodname
						,"target": target
						,"pathname": pathname
						,"params" : (obj.hasOwnProperty('params')) ? obj.params : {}
						,"header" : (obj.hasOwnProperty('header')) ? obj.header : {}
						,"cb_func" : encodeURIComponent(tmpCallbackNm) 
					};
					if (MiapsHybrid.isAndroid()) {
						window.MiAPS.runMiaps(JSON.stringify(sendData));
					} else if (MiapsHybrid.isIOS()) {
						sendData.mode = 'runMiaps';
						window.webkit.messageHandlers.miapshybrid.postMessage(JSON.stringify(sendData));
					}
				}
			}
		},
		
		// 데이터 관련 함수
		serialize: function(data) {
			var json = null;
			if (typeof data === 'string') { // serialize string or json string
				if (data.startsWith("{")) { // json string
					json = JSON.parse(data);
				} else { // key=value& text type, key={json string}
					return data;
				}
			} else if (typeof data === 'object') { // object
				json = data;
			} else {
				if (window._debug) {
					console.log("지원하지 않는 타입 입니다.");
				}
				return "";
			}

			var returnParams = "";
							
			for (var key in json) {
				returnParams += (returnParams == "") ? key + "=" + encodeURIComponent(json[key]) : "&" + key + "=" + encodeURIComponent(json[key]);
			}

			return returnParams;
		},
		
		
		/**
		 * HTTP Client Request<br>
		 * @param config
		 * @param cb_func 콜백함수 전체
		 * @returns 콜백함수 명
		 */
		httpSvc : function(config, cb_func) {
			/* config = {
			 	url:"",
			 	header: {},
			 	param: "key=value&key=value",
			 	callback:""
			 */
			
			var sendParam = '';
			/*if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				sendParam = MiapsHybrid.serialize(config.param);
			} else {
				sendParam = config.param;
			}*/			
			if (typeof config.param == 'object') {
				sendParam = $.param(config.param);
			} else {
				sendParam = config.param;
			}
			
			var sendConfig = {
				url: config.url,
				param: sendParam
			};
			
			if (config.hasOwnProperty('header')) {
				sendConfig.header = config.header;
			}
			
			if (cb_func) { // object callback 함수는 있고 config.callback이 없으면 임시로 만든다.
				if (!config.hasOwnProperty('callback')) {
					if (window._debug) { console.log(cb_func.name); }
					
					if (cb_func.name == null || cb_func.name == '') { // 콜백명이 없으면 임시로 만든다.
						var tmpCallbackNm = '_httpTmpCb' + Math.random().toString(36).substring(7);
						if (window._debug) { console.log(tmpCallbackNm); }
						
						window[tmpCallbackNm] = cb_func;
						if (window._debug) { console.log(window[tmpCallbackNm]); }
						sendConfig.callback = tmpCallbackNm;
					
					} else {
						window[cb_func.name] = cb_func;
						if (window._debug) { console.log(window[cb_func.name]); }
						sendConfig.callback = cb_func.name;
					}
				} else {
					sendConfig.callback = config.callback;
				}
			} else {
				sendConfig.callback = '';
			}
		
			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				if (window._pccmmtype == 'DWR') {
					alert('지원하지 않습니다.'); return;	
				} else if (window._pccmmtype == 'AJAX') {
					MiapsHybrid.ajaxSvc('httpSvc.miaps', sendConfig, cb_func);					
				}
			} else {
				var configJsonStr = JSON.stringify(sendConfig);
				/* Android */
				if (MiapsHybrid.MobilePlatform.Android()) {					
					window.MiAPS.runHttp(encodeURIComponent(configJsonStr));
					
				/* iPhone/iPad */
				} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
					var scheme ="MiapsHybrid://mode=runHttp&param=" + encodeURIComponent(configJsonStr);
					window.webkit.messageHandlers.miapshybrid.postMessage(scheme);					
				}	
			}	
		},
		
		/**
		 * SCAN, DocView, Bluetooth, Address, camera등등 모바일기기 내에 접근할 때 사용하는 함수
		 * @param config App에 전달할 json type value
		 * @code{
		   {
		 	  "type" : "DOCVIEW",
		 	  "param" : {
		 	     "A":"1",
		 	     "B":"2"
		 	  },
		 	  "callback" : "callbackname"
		 	}
		  }
		 * 		  type - SCAN: 
		 *        type - DOCVIEW: server_url | doc_url | D(or F) | cachetime
		 *        type - SESSION: session time체크. 호출 후 등록한 콜백함수로 결과리턴(세센타임 끝인지, 아닌지 또는 시간)
		 *        type - GEOLOCATION: 위치정보 조회. 호출 후 등록한 콜백함수로 결과리턴
		 *        type - SECURE: 단말 지문인식 또는 비밀번호 입력 창 호출
		 * @param cb_func_nm 앱에서 호출 할 콜백함수, String
		 * @param cb_func 웹에서 호출 할 콜백함수, Object
		 */
		mobilePC: function(config, cb_func) {

			var resConfig = {
					code: '200',
					type: config.type,
					param: config.param,					
					res: ''					
				};
			
			var configType = config.type.toLowerCase();
			
			
			/*if (configType == 'docview') {
				var param = "D," + config.param + ",null,file,1-1";
				console.log(param);
				$.post("../minkSvc", {command:'documentview' , what:param}, cb_func);
			
			} else */
			if (configType == 'geolocation') {
				/* Html5 위치정보 취득 사용 */
				navigator.geolocation.getCurrentPosition(function(data) {
															resConfig.res = data.coords.latitude + ";" + data.coords.longitude;
															cb_func(JSON.stringify(resConfig));
														}, function(data) {
															resConfig.code = '500';
															resConfig.res = data.message;
															cb_func(JSON.stringify(resConfig));
														});
			} else if (configType == 'scan' || 
					configType == 'barcode' || 
					configType == 'qrcode' ||
					configType == 'appid' ||	
					configType == 'finger' ||
					configType == 'version' ||
					configType == 'deviceid' ||
					configType == 'bundleid' ||
					configType == 'istablet' ||
					configType == 'devicemodel' ||							
					configType == 'platformversion' ||
					configType == 'camera' ||
					configType == 'gallery' ||
					configType == 'capture' ||
					configType == 'isinstalled' ||
					configType == 'network' ||
					configType == 'extlib') {
				if (configType == 'extlib') {
					if(miapsextlib != null && miapsextlib !== 'undefined') {
						var extRes = null;
						if (typeof miapsextlib == 'string') {
							if (_gMiapsExtlib == null) {
								if (window._debug) {
									console.log("miapsextlib undefined - load script");
								}
								this.loadScript(miapsextlib, function() {
									_gMiapsExtlib = this;
								});
							}
							setTimeout(function() {
								try {
									extRes = _miapsextlib(resConfig.param);
									cb_func(extRes);
								} catch (e) {
									console.log('catch: _miapsextlib is not defined, retry');
									setTimeout(function() {
										if (!window._miapsextlib) {
											console.error('error: window._miapsextlib is not defined');
										} else {
											extRes = _miapsextlib(resConfig.param);
											cb_func(extRes);
										}
									}, 500);
								}
							}, 100);
						}else { /// AMD								
							extRes = miapsextlib(resConfig.param);
							cb_func(extRes);
						}
					} else {
						alert('miapsExtLib가 설정되어 있지 않습니다.');
					}
					
				} else if (configType == 'camera' || configType == 'gallery' || configType == 'capture' ||
						configType == 'isinstalled' || configType == 'loadcontact' ||
						configType == 'finger') {
					resConfig.res = config.res; // 입력된 값으로 테스트 할 수 있도록 config의 res를 res에 그대로 넣어준다.
					console.log(resConfig);
					cb_func(JSON.stringify(resConfig));
					
				} else {
					resConfig.res = config.param; // 입력된 값으로 테스트 할 수 있도록 param을 res에 그대로 넣어준다.
					cb_func(JSON.stringify(resConfig));
				}
			} else if(configType == 'language') {
				if (navigator.language) {
					resConfig.res = navigator.language;						 
				} else {
					resConfig.code = '500';
					resConfig.res = 'navigator.language를 지원하지 않는 브라우저입니다.';
				}
				
				if (window._debug) {
					console.log(resConfig);
				}
				cb_func(JSON.stringify(resConfig));
				
			} else if(configType == 'savevalue') { // 웹에서는 localstoage를 사용한다.
				var resText = "Success";
				if (typeof config.param == 'object') {
					var keys = Object.keys(config.param);
					for (var idx in keys) {
						console.log("key="+keys[idx]+ ",  data="+ config.param[keys[idx]]);
						try {
							localStorage.setItem(keys[idx], config.param[keys[idx]]);
						} catch (e) {
							if (isQuotaExceeded(e)) {
								// Storage full, maybe notify user or do some clean-up
								resConfig.code = e.code;
								resText = "Storage full, maybe notify user or do some clean-up";
								break;
							}
						}
					}
				} else if (typeof config.param == 'string') {
					localStorage.setItem("tempKey", config.param);
				}
				resConfig.res = resText; // 입력된 값으로 테스트 할 수 있도록 param을 res에 그대로 넣어준다.
				cb_func(JSON.stringify(resConfig));
			
			} else if(configType == 'loadvalue') { // 웹에서는 localstoage를 사용한다.
				var tmpRes = {};
				
				/*if (config.param.constructor == Object) { // ex) {"id":"", "pw":""}  앱에서 지원하지 않아 삭제
					var keys = Object.keys(config.param);
					console.log(keys);
					for (var idx in keys) {
						console.log("key="+keys[idx]);
						tmpRes[keys[idx]] = localStorage.getItem(keys[idx]);							
					}
				} else*/ if (config.param.constructor == Array) {
					for (var idx in config.param) {
						//console.log("key="+config.param[idx]);
						tmpRes[config.param[idx]] = localStorage.getItem(config.param[idx]);
					}
				}/* else if (typeof config.param == 'string') { // ex) ["id","pw"](복수) or id(단일)   앱에서 지원하지 않아 삭제
					var tmpParam = config.param.replace(/\"/g, "").replace(/\[/g, "").replace(/\]/g, "").trim(); 
					var keys = tmpParam.split(',');
					for(var idx in keys) {
						console.log("key="+keys[idx].trim());
						tmpRes[keys[idx].trim()] = localStorage.getItem(keys[idx].trim());
					}
				}*/
				resConfig.res = tmpRes;
				cb_func(JSON.stringify(resConfig));
				
			} else if (configType == 'clearallvalue') { // savevalue로 저장한 모든 데이터를 삭제 합니다. 2020.02.27 chlee				
				localStorage.clear();				
				resConfig.res = 'success';
				cb_func(JSON.stringify(resConfig));				
				
			} else if (configType == 'platform') {
				resConfig.res = 'unknown';
				if (MiapsHybrid.MobilePlatform.Android()) {
					resConfig.res = 'android';
				} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
					resConfig.res = 'ios';
				}
				cb_func(JSON.stringify(resConfig));
				
			} else if (configType == 'timezone') { 
				 var d = new Date();
				 var n = d.getTimezoneOffset();
				 n = (n/60) * -1;
				 var gmt = 'GMT';
				 if (n !== 0) {
				   gmt += n > 0 ? ' +' : ' ';
				   gmt += n;
				 }
				 resConfig.res = gmt;
				 cb_func(JSON.stringify(resConfig));
				    
			} else if (configType == 'settabtitle') {
				//if (typeof config.param == 'object') {
				if (config.param.constructor == Object) { // ex) {"tabid":"", "title":""}
					document.title = config.param["title"];
				}

			} else if (configType == 'filelist' ||
					configType == 'filecontents' ||
					configType == 'fileupload' ||
					configType == 'filedelete' ||
					configType == 'filedownload' ||
					configType == 'encrypt' ||
					configType == 'decrypt' ||
					configType == 'deviceip') {
				/*{
			 	  "type" : "FILELIST",
			 	  "param" : {
			 	     "path":"c:\\"
			 	  },
			 	  "callback" : "callbackname"
			 	} + pathConfig 
			 	*/
				//console.log(_pathConfig);
				config.pathconfig = _pathConfig;
				configJsonStr = JSON.stringify(config);
				//console.log(configJsonStr);
				
				if (window._pccmmtype == 'DWR') {
					miaps_hybrid.mobile(configJsonStr, cb_func);
				} else if (window._pccmmtype == 'AJAX') {
					var sendValue = {
							values : configJsonStr
						};
					MiapsHybrid.ajaxSvc('mobile.miaps', sendValue, cb_func);					
				}
				
			} else if (configType == 'toasts') {
				var toastMsg = "";
				if (config.param.constructor == Object) { 
					toastMsg = config.param["msg"];
				}
				var toast1 = new Android_Toast({content: toastMsg});
								
			} else if (configType == 'newbrowser') {
				var newUrl = "";
				if (config.param.constructor == Object) { 
					newUrl = config.param["url"];
				}
				window.open(newUrl, '_blank');
				
			} else if (configType == 'applicationinfo') {
				$.ajax({
					url: 'http://'+ location.hostname + ':' + location.port + _gContextNm + _pathConfig.myFileRoot + '/application.json',
					async: true,
					type: 'get',
					data: '',
					dataType: 'json', // xml, json, script, html
					success: function (data) {
						if (cb_func != null) {
							resConfig.res = data;
							cb_func(JSON.stringify(resConfig));
						}
					},
					error: function (jsXHR) {
						if (cb_func != null) {
							cb_func(jsXHR);
						}
					}
				});
			} else if (configType == 'callnotify') {
				MiapsHybrid.notifyCallback(config.param);

			} else {  
				var _msg = "지원하지 않는 타입입니다."
				if (cb_func != null) {
					resConfig.code = '500';
					resConfig.res = _msg;
					cb_func(JSON.stringify(resConfig));
				} else {
					if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
						console.log(_msg);
					} else {
						alert(_msg);
					}
				}
			}
		
		},
		
		mobile : function(config, cb_func) {
			MiapsHybrid.resultData = null;
			if (config == null) alert("config는 필수 입니다.");
			//if (window._debug) console.log(config);
			
			if (cb_func) { // object callback 함수는 있고 config.callback이 없으면 임시로 만든다.
				if (!config.hasOwnProperty('callback')) {
					//if (window._debug) { console.log(cb_func.name); }
					
					if (cb_func.name == null || cb_func.name == '') { // 콜백명이 없으면 임시로 만든다.
						var tmpCallbackNm = '_nativeTmpCb' + Math.random().toString(36).substring(7);
						if (window._debug) { console.log(JSON.stringify(config) + ', callback : ' + tmpCallbackNm); }
						
						window[tmpCallbackNm] = cb_func;
						//if (window._debug) { console.log(window[tmpCallbackNm]); }
						
						if (config.hasOwnProperty('iframeid') && config.iframeid != '') {
							var iframeCallbackNm = 'document.getElementById("' + config.iframeid + '").contentWindow.' + tmpCallbackNm;						
							config.callback = iframeCallbackNm;
						} else {
							config.callback = tmpCallbackNm;
						}
					} else {
						window[cb_func.name] = cb_func;
						if (window._debug) { console.log(JSON.stringify(config) + ', callback : ' + cb_func.name); }
						config.callback = cb_func.name;
					}
				}
			} else {
				if (window._debug) { console.log(JSON.stringify(config) + ', callback : none'); }
				config.callback = '';
			}
			
			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				MiapsHybrid.mobilePC(config, cb_func);
			} else {
				var configJsonStr = JSON.stringify(config);
				/* Android */
				if (MiapsHybrid.MobilePlatform.Android()) {
					window.MiAPS.mobile(encodeURIComponent(configJsonStr));
				/* iPhone/iPad */
				} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
					var scheme ="MiapsHybrid://mode=mobile&param=" + encodeURIComponent(configJsonStr);
					window.webkit.messageHandlers.miapshybrid.postMessage(scheme);
				}
			}
		},
	
		/**
		 * Remote Query Script.<br>
		 * 
		 * @param mode select (fetch) or execute
		 * @param target connectoin bean Id
		 * @param query SQL
		 * @param cb_func_nm 앱에서 호출 할 콜백함수, String
		 * @param cb_func 웹에서 호출 할 콜백함수, Object
		 */
		querySvc : function() {
			MiapsHybrid.resultData = null;

			var mode = '', target = '', query = '', cb_func_nm = '', cb_func = '';
			mode = arguments[0];
			target = arguments[1];
			query = arguments[2];
			
			if (typeof arguments[3] === 'function') {
				cb_func = arguments[3];
			} else if (typeof(arguments[3]) === 'string') {
				cb_func_nm = arguments[3];
				cb_func = arguments[4];
			} 

			if (cb_func) { // object callback 함수는 있고 config.callback이 없으면 임시로 만든다.				
				if (window._debug) { console.log(cb_func.name); }
				
				if (cb_func.name == null || cb_func.name == '') { // 콜백명이 없으면 임시로 만든다.
					var tmpCallbackNm = '_queryTmpCb' + Math.random().toString(36).substring(7);
					if (window._debug) { console.log(tmpCallbackNm); }
					
					window[tmpCallbackNm] = cb_func;
					if (window._debug) { console.log(window[tmpCallbackNm]); }
					cb_func_nm = tmpCallbackNm;
				
				} else {
					window[cb_func.name] = cb_func;
					if (window._debug) { console.log(window[cb_func.name]); }
					cb_func_nm = cb_func.name;
				}				
			}

			if (MiapsHybrid.NaviPlatform.Windows() || MiapsHybrid.NaviPlatform.Mac()) {
				if (window._debug) {
					console.log("mode:" + mode + ", target:" + target + ", query:" + query + ", cb_func_nm:" + cb_func_nm + ", cbfunc:" + cb_func);
				}

				if (window._pccmmtype == 'DWR') {
					miaps_hybrid.querySvc(mode, target, query, cb_func);
				} else if (window._pccmmtype == 'AJAX') {
					var sendValue = {
							mode : mode,
							target : target,
							query : query
						};
					
					MiapsHybrid.ajaxSvc('querySvc.miaps', sendValue, cb_func);
				}
			} else {
				/* Android */
				if (MiapsHybrid.MobilePlatform.Android()) {
					window.MiAPS.runQuery(mode, encodeURIComponent(target), encodeURIComponent(query), encodeURIComponent(cb_func_nm));
				/* iPhone/iPad */
				} else if (MiapsHybrid.MobilePlatform.iPhone() || MiapsHybrid.MobilePlatform.iPad()) {
					var scheme = "MiapsHybrid://mode=runQuery&type=" + encodeURIComponent(mode)
							+ "&target=" + encodeURIComponent(target) 
							+ "&query=" + encodeURIComponent(query)
							+ "&cb_func=" + encodeURIComponent(cb_func_nm);
					window.webkit.messageHandlers.miapshybrid.postMessage(scheme);
				}
			}
		},
		
		/**
		 * id가 null이면 화면의 가운데에 wait커서 표시<br>
		 * id가 있을 경우는 id의 bootstrap graphicon을 회전시킨다.<br>
		 * @param id : element id
		 * @param type : 'default', 'wait'
		 * @param bg : true, false 
		 */
		cursor : function(id, type, bg) {
			if (id == null) {
				if (type == null || type == 'default') {
					$("#_miaps_cursor").remove();
					this.mask('off');
					
				} else {
					if ($("#_miaps_cursor").length <= 0) {
						var _top = ($(window).height() / 2) + $(window).scrollTop();
                        var _left = ($(window).width() / 2);
						$(document.body).append("<div id='_miaps_cursor' class='icon-block' style = 'top:"+_top +"; left : "+_left +"'></div>");
					}
					
					/* class가 우선순위가 낮아서 style로 대체 
					$("#_miaps_cursor").css(
						{
							'top'	: ($(window).height() / 2) + $(window).scrollTop()
							,'left'	: ($(window).width() / 2)
						}
					);*/
										
					if (bg) {
						this.mask('on');
					}
				}
			} else {
				if (type == null || type == 'default') {
					var bkedClass = $("#hc_" + id).attr('class');
					$('#' + id).attr('class', bkedClass);
					$("#hc_" + id).remove();
					this.mask('off');
					
				} else if (type != null && type == 'wait') {
					var bkClass = $('#' + id).attr('class'); 
					var hiddenClass = "<input id='hc_"+ id +"' type='hidden' class='" + bkClass + "'/>";
					$(document.body).append(hiddenClass);
					$('#' + id).attr('class', 'glyphicon glyphicon-refresh spinning');
					if (bg) {
						this.mask('on');
					}
				}
			}		
		},	
		
		mask : function(option) { // on, off
			if (option == 'on') {
				$(document.body).append("<div id='_miaps_mask'></div>");
				
				//화면의 높이와 너비를 구한다.
		        var maskHeight = $(document).height();  
		        var maskWidth = $(window).width();  
	
		        //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다.
		        $('#_miaps_mask').css({'width':maskWidth,'height':maskHeight});  
	
		        //애니메이션 효과
		        $('#_miaps_mask').fadeIn(300);      
		        $('#_miaps_mask').fadeTo("fast",0.5);
			} else {
				$('#_miaps_mask').remove();
			}
		},
	
		loadScript : function(url, callback) {  
		    var scriptEl = document.createElement('script');
		    scriptEl.type = 'text/javascript';
		    // IE에서는 onreadystatechange를 사용
		    scriptEl.onload = function () {
		        callback();
		    };
		    scriptEl.src = url;
		    document.getElementsByTagName('head')[0].appendChild(scriptEl);
		},
		
		/**
		 * MiAPS Hybrid App에서 Push를 수신할 경우(수신메시지를 클릭할 경우) 호출 되는 callback함수.
		 * 개발자는 miaps_notify.js의 callback(data)에 코딩을 추가한다.
		 */
		notifyCallback : function(data) {
			if (window._debug) {
				/* 사용자 정의 코드 */			
				if (typeof data == 'object') {				
					console.log("notifyCallback(->miaps_hybrid.js(callback)) - " + JSON.stringify(data).replace(/,"/g, ',\n"'));
				} else if (typeof data == 'string') {				
					console.log("notifyCallback(->miaps_hybrid.js(callback)) - " + data);
				}
			}
			
			// AMD사용하지 않고 일반적인방법(miaps_hybrid.js만 import)일 경우는 호출 시 miaps_notify.js를 import하고, _gMiapsNotify에 등록하여 계속 miaps_notify.js가 import되는 것을 막는다.
			if (typeof miapsnotify == 'string') {
				if (_gMiapsNotify == null) {
					if (window._debug) {
						console.log("miapsnotify undefined - load script");
					}
					MiapsHybrid.loadScript(miapsnotify, function() {
						_gMiapsNotify = this;
					});
				}				
				setTimeout(function() {
					try {
						window._miapsnotify(data); // miaps_notify.js의 window._miapsnotify(data) 호출
					} catch (e) {
						console.log('catch: _miapsnotify is not defined, retry');
						setTimeout(function() {
							if (!window._miapsnotify) {
								console.error('error: window._miapsnotify is not defined');
							} else {
								window._miapsnotify(data);
							}
						}, 500);
					}
				}, 100);
			}else { /// AMD
				miapsnotify(data);
			}		
		},
		
		/**
		 * data값이 
		 * @param data
		 * @returns
		 */
		parse : function(data) {
			var obj;
			if (data != '' && typeof data == 'string') {
				try {
					obj = JSON.parse(data);
				} catch (e) {
					console.log(e.name + '\n' + e.message);
					// Error HTML page..
					obj = JSON.parse(JSON.stringify({res:{code:500,msg:"error..(miaps.parse오류입니다. 결과가 404 html일 확율이 큽니다.)"}})); // 원하는 형식으로 변경합니다.
				}				
			} else { // typeof object는 그대로~ 
				obj = data;
			}
			
			return obj;
		},
		beautify : function(data) {
			if (typeof data == 'object')
				return JSON.stringify(data, null, 4);
			else if (typeof data == 'string')
				return JSON.stringify(JSON.parse(data), null, 4);
		},
		/**
		 * localStorage try/catch (Storage full check)
		 */
		isQuotaExceeded :function(e) {
			var quotaExceeded = false;
			if (e) {
				if (e.code) {
					switch (e.code) {
						case 22:
							quotaExceeded = true;
							break;
						case 1014:
							// Firefox
							if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
								quotaExceeded = true;
							}
							break;
					}
				} else if (e.number === -2147024882) {
					// Internet Explorer 8
					quotaExceeded = true;
				}
			}
			return quotaExceeded;
		},
		
		sleep: function (milliseconds) {
			  var start = new Date().getTime();
			  for (var i = 0; i < 1e7; i++) {
			    if ((new Date().getTime() - start) > milliseconds){
			      break;
			    }
			  }
		},
		
		getContextPath: function() {
			if (window._usecontext == true) {
				var hostIndex = location.href.indexOf( location.host ) + location.host.length;
				return location.href.substring( hostIndex, location.href.indexOf('/', hostIndex + 1) );
			} else {
				return "";
			}
		},

		callback: function(data) {
			if (window._debug) {
				console.log("-- call miaps.callback (data) --");
				console.log(data);
			}
			
			//var skey = makeResultSessionKey();
			//window.sessionStorage.setItem(skey, data);
			
			MiapsHybrid.resultData = data;
			return data;
		
		},

		/**
		 * 동적으로 DOM 개체를 만들어 반환한다.
		 * @param {any} parent 부모 개체 또는 selector. null이면 DOM에는 아직 붙지 않아 개체가 화면에 나타나지 않게됨.
		 * @param {string} tag
		 * @param {object} attrs
		 * @param {string} text 개체 안에 넣을 텍스트
		 * @returns
		 */
		dom: function(parent, tag, attrs, text) {
			var el = document.createElement(tag);
			if (attrs)
				for (var key in attrs) {
					var val = attrs[key];
					if (typeof val === 'object') {
						var x = el[key];
						for (var k in val)
							x[k] = val[k];
					} else {
						el[key] = val;
					}
				}
			
			if (text)
				el.appendChild(document.createTextNode(text));
			
			if (typeof parent === 'string')
				parent = document.querySelector(parent);
			if (parent)
				parent.appendChild(el);
			
			return el;
		},		
		searchDebugKeyup: function () { // 검색어가 없을 경우 전체 로그 표시
			var keyword = document.getElementById('miaps-search-keyword').value.trim();
			$("#miaps-search-clear").toggle(Boolean(keyword));

			if (keyword == null || keyword.length == 0) {
				$('#_miaps_console > div').not('#miaps-debug-search-box').show();
			} else {
				$('#_miaps_console > div').not('#miaps-debug-search-box').hide();
				var temp = $("#_miaps_console > div > div > span:nth-child(2n+2):containsIN('" + keyword + "')");
				$(temp).parent().parent().show(); 
			}	
		},
		searchDebugClear: function() { // 검색어 모두 삭제
			$("#miaps-search-keyword").val('').focus();
			$(this).hide();
			$('#_miaps_console > div').not('#miaps-debug-search-box').show();
		},
		logClear: function() {	// clear all log
			$("#_miaps_console").children().not("#miaps-debug-search-box").remove();
		}	
	}//END MiapsHybrid

	$.extend($.expr[":"], { // contains 대소문자 구분없이 검색
		"containsIN": function(elem, i, match, array) {
			return (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
		}
	})

	// 개발자가 모바일 장치에서 로그를 보기 위한 콘솔 로그 대체
	if (_debug == true && (MiapsHybrid.isAndroid() || MiapsHybrid.isIOS())) {	
		var _console = top.document.querySelector('#_miaps_console')
			|| MiapsHybrid.dom(top.document.body, 'div', {
				id: '_miaps_console',
				//className: 'modal', -- 타 회사의 className과 겹치는 경우가 많아서 삭제. 및 아래쪽  z-index를 2001에서 최대값인 2147483647로 수정. 2020.12.07 chlee
				className: '',
				style: {cssText: 'position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: white; '
					+ 'z-index: 2147483647; display: none; padding: .5em; color: black; font-family: monospace;'
					+ 'word-break: break-all; overflow-y: auto; -webkit-overflow-scrolling: touch; '}
			});
		
		// Add Search Box, clear button
		var searchDiv= MiapsHybrid.dom(_console, 'div', {id: 'miaps-debug-search-box'});
		var searchInput = MiapsHybrid.dom(searchDiv, 'input', {
			type: 'text',
			id: 'miaps-search-keyword',
			placeholder: 'search keyword',
			style: { cssText: "border: 0; padding: 7px 0; border-bottom: 1px solid #337AB7; width: 92%;"}});
		searchInput.addEventListener('keyup', MiapsHybrid.searchDebugKeyup);
		var searchClear =  MiapsHybrid.dom(searchDiv, 'span', { 
			id: 'miaps-search-clear',
			style: { cssText: "position: absolute; right: 40px; top: 11px; bottom: 0; width: 18px; height: 18px; font-size: 18px; color: #ccc; background-color: #fff;"}
		}, '✕');
		searchClear.addEventListener('click', MiapsHybrid.searchDebugClear);
		$("#miaps-search-clear").toggle(Boolean($("#miaps-search-keyword").val()));
		// clear log
		var logClear =  MiapsHybrid.dom(searchDiv, 'span', { 
			id: 'miaps-search-clear',
			style: { cssText: "position: absolute; right: 10px; top: 10px; bottom: 0; width: 26px; height: 26px; line-height: 26px; font-size: 18px; font-weight: bold; color: #fff; background-color: #337AB7; border-radius:50%; display: inline-block; text-align: center; margin-right: -3px;"}
		}, 'D');
		logClear.addEventListener('click', MiapsHybrid.logClear);

		$(document).on('touchstart', function(e) {
			if (e.touches.length == 3) {
				if (_console.style.display === 'none') {
					_console.style.display = 'block';
					top.document.body.appendChild(_console); // 가장 마지막으로 이동
				} else {
					_console.style.display = 'none';   
				}
			}
		}); 
		$(_console).off('click').on('click', 'div', function() { if (this.hasAttribute('data-stack')) { alert(this.getAttribute('data-stack')); }});

		var oldLog = console.log;
		
		console.log = function() {
			var debugblock = MiapsHybrid.dom(_console, 'div', {style: {display: 'block'}});
			var item = MiapsHybrid.dom(debugblock, 'div', {style: {cssText: 'padding: .5em 0;'}});
			var stack = new Error().stack.split(/\n/);
			stack.shift(); // 첫째줄 삭제
			item.setAttribute('data-stack', 'Log\n' + stack.join('\n'));
			var ct = new Date();			
			MiapsHybrid.dom(item, 'span', {style: {cssText: 'color:#bbb; margin-right: 1em;'}}, (new Date((ct - (ct.getTimezoneOffset() * 60 * 1000))).toISOString()).slice(11));
			MiapsHybrid.dom(debugblock, 'hr', {style: {cssText: 'border-top: solid 1px #ddd; border-bottom: none'}});

			var s = '';
			for (var i = 0; i < arguments.length;) {
				var a = arguments[i++];
				if(a){
					a = ((typeof a === 'function' || typeof a === 'string') ? a
							: (a.stack && a.message ? a.message : JSON.stringify(a)))
							+ (i < arguments.length ? ', ' : '');
					//길이제한 추가
					a = (a.length > MiapsHybrid.maxLogLength) ? a.substring(0, MiapsHybrid.maxLogLength) + '...' : a;
				}				
				MiapsHybrid.dom(item, 'span', null, a);
				s += a;
			}

			if (s != '' && s.length > 0) {
				oldLog.call(console, s);
			}
		};
	}

	// window.onerror
	if (_debug == true) { //} && (MiapsHybrid.isAndroid() || MiapsHybrid.isIOS())) {
		/*
		message: error message (string). Available as event (sic!) in HTML onerror="" handler.
		source: URL of the script where the error was raised (string)
		lineno: Line number where error was raised (number)
		colno: Column number for the line where the error occurred (number)
		error: Error Object (object)
		*/
		window.onerror = function (msg, url, lineNo, columnNo, error) {
			var string = msg.toLowerCase();
			var substring = "script error";
			if (string.indexOf(substring) > -1){
				alert('Script Error: See Browser Console for Detail');
			} else {
				var message = [
					'Message: ' + msg,
					'URL: ' + url,
					'Line: ' + lineNo,
					'Column: ' + columnNo,
					'Error object: ' + String(error.stack)
				].join(' - ');

				console.log(message + " - model: " + MiapsHybrid.mh_model + " - os: " + MiapsHybrid.mh_os);
				
				// 에러 수집 동의(구현해야 함)한 유저에 한해서 에러를 서버로 전송합니다.
				/*MiapsHybrid.miapsSvc("com.mink.connectors.hybridtest.logging.ScriptErrLogCtrl"
					,"logging"
					,"script-err-log"
					,"md="+MiapsHybrid.mh_model+"&os="+MiapsHybrid.mh_os+"&err="+message, "", null);
				*/
				//alert(message);
				console.log(message);
			}
			return false;
		};		
	}

	// set server url
	for (var idx = 0; idx < MiapsHybrid.serverInfo.length; idx++) {
		var tmpObj = MiapsHybrid.serverInfo[idx];
		if (location.pathname.indexOf(tmpObj.chkPath) == 0 && tmpObj.runmode == window._miaps_runmode) { // startsWith()
			MiapsHybrid.sendUrl = tmpObj.url;
		}
	}

	// 에러 통신 시 사용할 모델명, OS버전을 미리 취득해 놓는다.
	if (MiapsHybrid.isWebView()) {
		MiapsHybrid.mobile({type:'devicemodel', param:'PC'}, function(data) {
			MiapsHybrid.mh_model =  MiapsHybrid.parse(data).res;		
		});

		MiapsHybrid.mobile({type:'platformversion', param:'Windows10'}, function(data) {
			MiapsHybrid.mh_os =  MiapsHybrid.parse(data).res;
		});		
	} else {
		MiapsHybrid.mh_model = '';
		MiapsHybrid.mh_os = '';
	}
	var _gContextNm = MiapsHybrid.getContextPath();
	window.miaps = MiapsHybrid;	// use general and Call to App.
	return MiapsHybrid;	// use AMD
}));

/*
Android-Toast
(c) 2013-2014 Jad Joubran
*/
(function() {
	"use strict";

	function Android_Toast(options) {
		var position;
		this.timeout_id = null;
		this.duration = 3000;
		this.content = '';
		this.position = 'bottom';

		if (!options || typeof options != 'object') {
			return false;
		}

		if (options.duration) {
			this.duration = parseFloat(options.duration);
		}
		if (options.content) {
			this.content = options.content;
		}
	
		if (options.position) {
			position = options.position.toLowerCase();
			if (position === 'top' || position === 'bottom') {
				this.position = position;
			} else {
				this.position = 'bottom';
			}
		}
		this.show();
	}


	Android_Toast.prototype.show = function() {
		if (!this.content) {
			return false;
		}
		clearTimeout(this.timeout_id);

		var body = document.getElementsByTagName('body')[0];

		var previous_toast = document.getElementById('android_toast_container');
		if (previous_toast) {
			body.removeChild(previous_toast);
		}

		var classes = 'android_toast_fadein';
		if (this.position === 'top') {
			classes = 'android_toast_fadein android_toast_top';
		}

		var toast_container = document.createElement('div');
		toast_container.setAttribute('id', 'android_toast_container');
		toast_container.setAttribute('class', classes);
		body.appendChild(toast_container);

		var toast = document.createElement('div');
		toast.setAttribute('id', 'android_toast');
		toast.innerHTML = this.content;
		toast_container.appendChild(toast);

		this.timeout_id = setTimeout(this.hide, this.duration);
		return true;
	};

	Android_Toast.prototype.hide = function() {
		var toast_container = document.getElementById('android_toast_container');

		if (!toast_container) {
			return false;
		}

		clearTimeout(this.timeout_id);

		toast_container.className += ' android_toast_fadeout';

		function remove_toast() {
			var toast_container = document.getElementById('android_toast_container');
			if (!toast_container) {
				return false;
			}
			toast_container.parentNode.removeChild(toast_container);
		}

		toast_container.addEventListener('webkitAnimationEnd', remove_toast);
		toast_container.addEventListener('animationEnd', remove_toast);
		toast_container.addEventListener('msAnimationEnd', remove_toast);
		toast_container.addEventListener('oAnimationEnd', remove_toast);

		return true;
	};

	//expose the Android_Toast object to Window
	window.Android_Toast = Android_Toast;	
})();
