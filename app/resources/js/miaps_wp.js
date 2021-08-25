(function (factory) {
    //Environment Detection
    if (typeof define === 'function' && define.amd) {
        define([], factory); //AMD
    } else {
        factory(); // Script tag import i.e., IIFE
  }
}(function () {
	
	// private 변수 선언
	if (!top._translations)
		top._translations = {};

	if (!top._log)
		top._log = {};

	/*
	 * miaps.mobile Promise사용 Wrapper
	 * promise_polyfill.js필수, jquery필수
	 */
	var miapsWp = window.miapsWp = {

		CONST_JSON_FOLDER : '/dlenc/resource/json/',
		CONST_SQL_FOLDER : '/dlenc/templates/query/',
		SUPPORTED_LANG_CODES: ['ko', 'en', 'zh', 'vi', 'km'],
		_language : 'ko',		
		_db : 'sqlite.log.db',
		
		createLogTable : function() {
			var checkSql = "select count(*) as cnt from sqlite_master where name='miaps_logs'";
			miapsWp.callQuery('select', miapsWp._db, checkSql)
			.then(function(data) {
				var obj = miaps.parse(data);
				console.log(miaps.beautify(obj));

				var cnt = obj.res[0].cnt;
				if (cnt != 1) {
					var file = miapsWp.CONST_SQL_FOLDER + 'create_log_table.sql';
					$.get(file, function(query) {
						miapsWp.callQuery('execute', miapsWp._db, query, function(data) {
							console.log(miaps.beautify(data));
						});
					});
				}
			});		
		},
		logCallback : function(data) {
			console.log(data);
		},
		// sqlite에 로그 기록		
		log : function(userId, serviceId, deviceId, remark) {
			var tm = Date.now();
			var query = "insert into miaps_logs (log_tm, user_id, service_id, device_id, remark) values ('" + tm + "', '" + userId + "','" + serviceId + "','" + deviceId + "','" + remark + "')";
			miaps.querySvc('execute', miapsWp._db, query, 'miapsWp.logCallback', miapsWp.logCallback);
		},

		callQuery: function() {
			var mode, target, query, callback = '';
			mode = arguments[0];
			target = arguments[1];
			query = arguments[2];
			callback = arguments[3];
			
			return new Promise(function(resolve) {
				var callbackKey = 'qcb' + (Math.random() * 1000000000 | 0);
				window[callbackKey] = function() {
					delete window[callbackKey];
					if (callback) {
						callback.apply(null, arguments);
					}
					resolve.apply(null, arguments);
				};
				miaps.querySvc(mode, target, query, window[callbackKey]);
			});
		},

		// call miaps native 
		callNative: function() {
			var type, params, callback, resTest = '';
			var args = arguments;
			type = args[0];
			params = args[1];
			
			if (typeof args[2] == 'function') {
				callback = args[2];
			} else if (typeof args[2] == 'string') {
				resTest = args[2];
				callback = args[3];
			}
			
			return new Promise(function(resolve) {
				var callbackKey = 'mcb' + (Math.random() * 1000000000 | 0);
				//miapsWp._callbacks[callbackKey] = function() {
				window[callbackKey] = function() {
					//delete miapsWp._callbacks[callbackKey];
					delete window[callbackKey];
					if (callback) {
						callback.apply(null, arguments);
					}
					resolve.apply(null, arguments);
				};
				
				var config = {
					type: type,
					param: params,
					res: resTest,
					//callback: 'miapsWp._callbacks.' + callbackKey
					callback: 'window.' + callbackKey
				};
				//miaps.mobile(config, miapsWp._callbacks[callbackKey]);
				miaps.mobile(config, window[callbackKey]);
			});
		},
		
		// call 3rd party library
		callthirdParty: function() {
			var vendorName, funcName, params, callback;
			var args = arguments;
			vendorName = args[0];
			funcName = args[1];
			params = args[2];
			callback = args[3];			
			
			return new Promise(function(resolve) {
				var callbackKey = 'tcb' + (Math.random() * 1000000000 | 0);
				//miapsWp._callbacks[callbackKey] = function() {
				window[callbackKey] = function() {
					//delete miapsWp._callbacks[callbackKey];
					delete window[callbackKey];
					if (callback) {
						callback.apply(null, arguments);
					}
					resolve.apply(null, arguments);
				};
				
				var config = {
					type: 'extlib',
					param: {
						name: vendorName,
						method: funcName,
						param: params,
						res: ''
					},
					//callback: 'miapsWp._callbacks.' + callbackKey
					callback: 'window.' + callbackKey
				};
				//miaps.mobile(config, miapsWp._callbacks[callbackKey]);
				miaps.mobile(config, window[callbackKey]);
			});
		},
		
		// call miaps connector
		callService: function() {
			var args = arguments;
			var classname = args[0];
			var method = args[1];
			var paramArr = [];
			var funcArr = [];
			var paramStr = '';
			
			for (var i=2; i < args.length; ++i) {
				if (typeof(args[i]) === 'function') {
					funcArr.push(args[i]);
				} else if (typeof(args[i]) === 'object') {
					paramArr.push(args[i]);
				} else if (typeof(args[i]) === 'string') {
					paramStr = args[i];
				}
			}
			
			if (paramArr.length > 0) {
				var params = {};
				paramArr.forEach(function(data) {
					params = Object.assign(params, data);
				});
			} else {
				var params = paramStr;
			} 
						
			var onSuccess = funcArr[0];
			var onError = funcArr[1];
			
			var promise = callConnector(classname, method, params);
			
			if (onSuccess) {
				promise = promise.then(onSuccess);
			}
			if (onError) {
				promise = promise.catch(onError);
			}
			
			return promise;
		},
		/**
		 * 사용자의 UI 언어를 구한다
		 */
		getLanguage: function() {
			return miapsWp._language;
		},

		/**
		 * 언어를 변경한다. 현재 한국어(ko), 영어(en), 일본어(ja)를 지원한다.
		 * @param {string} key 
		 */
		setLanguage: function(languageCode) {
			if (miapsWp.SUPPORTED_LANG_CODES.indexOf(languageCode) < 0)
				throw '지원되지 않는 언어 코드: ' + languageCode;
			miapsWp._language = localStorage._language = languageCode;			
		},
		/**
		 * 사용자의 언어에 맞춘 번역 데이터를 가져온다.
		 * @param {function} callback 
		 * @returns {Promise} 번역 데이터를 받을 수 있는 Promise
		 */
		getTranslations: function(callback) {
			var tr = top._translations[miapsWp._language];
			var promise;

			if (tr) {
				promise = Promise.resolve(tr);

				if (callback)
					promise = promise.then(callback);

				return promise;
			}

			if (!top._translationPromise) {
				top._translationPromise = new Promise(function(resolve) {
					var start = Date.now();
					var file = miapsWp.CONST_JSON_FOLDER + 'translations-' + miapsWp._language + '.json';
					$.get(file, function(result) {
						delete top._translationPromise;
						top._translations[miapsWp._language] = result;
						
						console.log('언어 파일 로딩', file, (Date.now() - start) + 'ms');

						resolve(result);
					});
				});
			}

			if (callback)
				top._translationPromise.then(callback);

			return top._translationPromise;
		}, 
		/**
		 * 지정한 HTML 개체 하위에서 `data-miaps-i18n` 속성이 있는 모든 요소를 번역한다.
		 * 속성 값이 단순 문자열이면 다국어 문자열 코드로 보고 요소에 텍스트를 넣는다.
		 * 
		 * 예) `data-miaps-i18n="GBT0003375"`
		 * 
		 * 요소의 텍스트가 아니라 요소의 속성을 번역하려는 경우는 "속성:코드" 형태로 지정한다.
		 *  
		 * 예) `data-miaps-i18n="title:MSG_GBM0001212"`
		 * 
		 * 여러 속성을 지정할 경우는 세미콜론(;)으로 구분한다.
		 * 
		 * 예) `data-miaps-i18n="GBT0003375; title:GBT0005864; placeholder:GBM0005865"`
		 * @param {any} selector 이 값이 없으면 페이지 전체를 대상으로 번역, 있으면 하위에 대해서만 번역
		 * @returns {Promise} 번역 데이터를 받을 수 있는 Promise
		 */
		translate: function(selector) {
			var elem = typeof selector === 'string' ? document.querySelector(selector) : selector;
			var elems = (elem || document).querySelectorAll('[data-miaps-i18n]'); // 성능을 위해 jQuery 안씀
			var re1 = /\s*;\s*/;
			var re2 = /\s*:\s*/;

			return miapsWp.getTranslations()
				.then(function(tr) {
					for (var i = 0, count = elems.length; i < count; ++i) {
						var e = elems[i];
						var arr = e.getAttribute('data-miaps-i18n').split(re1);

						for (var j = 0; j < arr.length; ++j) {
							if (arr[j]) {
								var arr2 = arr[j].split(re2);
								if (arr2.length > 1) {
									e[arr2[0]] = tr[arr2[1]];
								} else {
									e.textContent = tr[arr2[0]] || arr2[0] + ' 번역 없음';
								}
							}
						}
					}

					return tr;
				});
		}
	};
	// END miapsWp

	miapsWp._callbacks = {};

	function callConnector() {
		var classname, method, params;
		var args = arguments;
		classname = args[0];
		method = args[1];
		params = args[2];
		
		function _callConnector(classname, method, params) {
			if (window._debug) {
				console.log(classname, method, params);
			}
			
			return new Promise(function(resolve, reject) {
				miaps.miapsSvcSp(classname, method, params, '/minkSvc', 
					function(result) {
						if (typeof result === 'string') {
							try {
								result = JSON.parse(result);
							} catch(e) {
								reject({code: '9999', error: result});
								return;
							}
						}
						
						if (result.error) {
							reject(result);
						} else {
							resolve(result);
						}
					})						
			});
		}
		
		return _callConnector(classname, method, params);
	}
	
	return miapsWp;
}));




