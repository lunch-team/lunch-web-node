(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
    	factory();
  }
}(function () {
	"use strict";
	var _mp = window.miapsPage = {
		defaultUrl : location.origin + "",
		hARRAY_KEY : "historyArray",
		hPOPUP_KEY : "popupArray",
		hArray : [],
		hPopup : [],
		popupId: null,
		
		hist : {
			push : function(histInfo) { // histInfo:object
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				if(_mp.hArray == null || _mp.hArray === 'undefined') {
					_mp.hArray = [];
				}
				if(histInfo.param.actiontype.toLowerCase() === 'replace') {
					_mp.hArray.pop();
					_mp.hArray.push(histInfo);
				} else {					
					_mp.hArray.push(histInfo);
				}
				_mp.storage.set(_mp.hARRAY_KEY, _mp.hArray);
			},		
			pop : function(idx) {	// idx:number or id:string
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				var tmpInfo = null;
				if (_mp.hArray.length == 1)
					return;	
				
				if (typeof idx === 'number') {
					if (idx == -1) {
						_mp.hArray.pop();
					} else {
						idx = Math.abs(idx);
						if (idx > _mp.hArray.length - 1) {
							if (_debug) console.log('index (' + idx + ') is greater than "hArray.length"');
							return null;
						}					
						for (var i=0; i<idx; i++) {
							_mp.hArray.pop();						
						}
					}
					tmpInfo = _mp.hArray[_mp.hArray.length - 1];
											
				} else if (typeof idx === 'string') {
					var tmpId = null, i, tmpPopSize = 0;
					for (i=_mp.hArray.length -1; i>=0; i--) {
						tmpId = _mp.hArray[i].param.id;
						tmpPopSize++;
						if (tmpId == idx) {
							break;
						}
					}
					if (i == -1) { // 찾는 페이지ID가 없을 경우
						if (_debug) console.log('ID (' + idx + ') is not exist in "hArray"');
						return null;
					}
					
					for (var i=0; i<tmpPopSize-1; i++) {
						_mp.hArray.pop();						
					}
					tmpInfo = _mp.hArray[_mp.hArray.length - 1];		
				}
				_mp.storage.set(_mp.hARRAY_KEY, _mp.hArray);
				return tmpInfo;
			},
			setBackParam : function(id, obj) {	// id:string, obj:object or string
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				var tmpId = null;
				for (var i=_mp.hArray.length -1; i>=0; i--) {
					tmpId = _mp.hArray[i].param.id;
					if (tmpId == id) {
						_mp.hArray[i].backparam = obj.param;
						break;
					}
				}
				_mp.storage.set(_mp.hARRAY_KEY, _mp.hArray);
			},
			setTopPage : function(id) {
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				// reverse find id 
				var tmpId = null;
				for (var i=_mp.hArray.length -1; i>=0; i--) {
					tmpId = _mp.hArray[i].param.id;
					if (tmpId == id) {
						_mp.hArray.splice(0, i); //  pos부터 i개의 항목 제거
						break;
					}
				}
				_mp.storage.set(_mp.hARRAY_KEY, _mp.hArray);
			},
			getTopInfo : function() {
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				return _mp.hArray[0];
			},
			getLastInfo : function() {
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				return _mp.hArray[_mp.hArray.length - 1];
			},
			getPageInfo : function() {
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				var tmpId = null, tmpArray = null;				
				if (typeof arguments[0] === "string") { // id
					for (var i=_mp.hArray.length -1; i>=0; i--) {
						tmpId = _mp.hArray[i].param.id;
						if (tmpId == arguments[0]) {
							tmpArray = _mp.hArray[i];
							break;
						}
					}
					return tmpArray;	 
				} else if (typeof arguments[0] === "number") { // 뒤로갈 숫자
					var backIdx = Math.abs(arguments[0]);
					return _mp.hArray[_mp.hArray.length - 1 - backIdx];					
				}
			},
			getSize : function() {
				_mp.hArray = JSON.parse(_mp.storage.get(_mp.hARRAY_KEY));
				return (_mp.hArray == null) ? 0 : _mp.hArray.length;
			}
		},
		histPopup : { // Only Use to PC
			push : function(cfgparam, popobj) { // window.open result object
				var tmpPopArray = _mp.storage.get(_mp.hPOPUP_KEY);
				if (tmpPopArray == null) {
					_mp.hPopup.splice(0, _mp.hPopup.length); //   있는 것 모두 삭제
					_mp.hPopup.push(cfgparam);
				} else {
					_mp.hPopup = JSON.parse(_mp.storage.get(_mp.hPOPUP_KEY));
					_mp.hPopup.push(cfgparam);
				}
				
				if (_mp.hPopup.length == 1) { // 첫번째 popup일 경우만 popup의 부모를 window.ori_parent에 저장한다.
					// backup opner
					popobj.ori_opener = popobj.opener;
				}
				_mp.storage.set(_mp.hPOPUP_KEY, _mp.hPopup);
			},
			pop : function() {	// idx:number or id:string
				_mp.hPopup = JSON.parse(_mp.storage.get(_mp.hPOPUP_KEY));
				var tmpInfo = _mp.hPopup.pop();
				_mp.storage.set(_mp.hPOPUP_KEY, _mp.hPopup);
				return tmpInfo;
			},			
			getPopupInfo : function(idx) {
				_mp.hPopup = JSON.parse(_mp.storage.get(_mp.hPOPUP_KEY));
				return _mp.hPopup[idx];
			},
			getSize : function() {
				_mp.hPopup = JSON.parse(_mp.storage.get(_mp.hPOPUP_KEY));
				return (_mp.hPopup == null) ? 0 : mp.hPopup.length;
			}
		},
		storage : {
			set : function(key, obj) {	// key:string, obj:object or string
				if (obj == null)
					localStorage.setItem(key, null);
				else if (typeof obj === 'object')
					localStorage.setItem(key, JSON.stringify(obj));
				else if (typeof obj === 'string')
					localStorage.setItem(key, obj);
			}, 
			get : function(name) {	// name:string
				return localStorage.getItem(name);
			},
			clear : function(name) {
				localStorage.removeItem(name);
			}
		},		
		/* 페이지 이동 */
		go : function() { // id:string, *url:string, data:object, type:string('Push','Replace'), // object
			var cfg = {
				type : "navigation",
				method : "miapsGoPage",
				param : {
					animation: true, /* native -> native에서만 사용 */
					settop : false,
					actiontype : "Push",
					data : {} 
				}
			};

			// 첫번째 인자가 object면 파라메터 전체가 object라고 판단하고 처리 한다. 2020.02.08 chlee
			if (typeof arguments[0] === "object") {
				var _obj = arguments[0];
				if (!_obj.hasOwnProperty('url')) {
					if(_debug) { console.log ('url은 필수 입력값 입니다.'); }
					return;
				}
				
				if (_obj.hasOwnProperty('id')) {
					cfg.param.id = _obj.id;
				} else {
					cfg.param.id = _obj.url.substring(_obj.url.lastIndexOf("/") + 1, _obj.url.lastIndexOf("."));
				}
				if (_obj.hasOwnProperty('url')) {
					cfg.param.url = this.defaultUrl + _obj.url;
				}
				if (_obj.hasOwnProperty('data')) {
					if (typeof _obj.data === 'object') {
						cfg.param.data = _obj.data;
					} else {
						if (_debug) console.log('전달 데이터는 Object Type입니다.');
						return;
					}
				}
				if (_obj.hasOwnProperty('type')) {
					var type = _obj.type.toLowerCase();
					if (type != "push" && type != 'replace') {
						if (_debug) console.log('Type은 "Push" 또는 "Replace" 입니다.');
						return;
					}
					cfg.param.actiontype = _obj.type;
				}
			} else {
				if (arguments.length == 4) {	// id, url, data, type
					cfg.param.id = arguments[0];
					cfg.param.url = this.defaultUrl + arguments[1]; // url
					if (typeof arguments[2] === 'object') {
						cfg.param.data = arguments[2];
					} else {
						if (_debug) console.log('전달 데이터는 Object Type입니다.');
						return;
					}				
					var type = arguments[3].toLowerCase();
					if (type != "push" && type != 'replace') {
						if (_debug) console.log('Type은 "Push" 또는 "Replace" 입니다.');
						return;
					} 
					cfg.param.actiontype = arguments[3];				
				} else if (arguments.length == 3) { // id, url, data
					cfg.param.id = arguments[0];
					cfg.param.url = this.defaultUrl + arguments[1]; // url
					if (typeof arguments[2] === 'object') {
						cfg.param.data = arguments[2];
					} else {
						if (_debug) console.log('전달 데이터는 Object Type입니다.');
						return;
					}
				} else if (arguments.length == 2) {	// id, url or url, data
					if (typeof arguments[1] === 'object') {
						cfg.param.id = arguments[0].substring(arguments[0].lastIndexOf("/") + 1, arguments[0].lastIndexOf("."));
						cfg.param.url = this.defaultUrl + arguments[0]; // url
						cfg.param.data = arguments[1];
					} else {
						cfg.param.id = arguments[0];
						cfg.param.url = this.defaultUrl + arguments[1]; // url					
					}				
				} else if (arguments.length == 1) { // url
					cfg.param.id = arguments[0].substring(arguments[0].lastIndexOf("/") + 1, arguments[0].lastIndexOf("."));
					cfg.param.url = this.defaultUrl + arguments[0]; // url
				}
			}

			if (miaps.isPC()) {
				cfg.comments ='historyArray는 PC전용 localStorage 값입니다.'
				if (cfg.param.actiontype == "Push") { // 히스토리에 추가
					this.hist.push(cfg);
				}
				location.replace(cfg.param.url);				
			} else {
				miaps.mobile(cfg, null);
			}
		},
		/* 페이지 뒤로 가기 */
		back : function() { // number: -int or id:string, data:object
			var cfg = {
				type : "navigation",
				param : {
					animation: true,
					data : {}
				}				
			};
			
			if (arguments.length == 2) {		// number or id, data
				if (typeof arguments[0] === 'string') {	// id
					cfg.param.id = arguments[0];
				} else if (typeof arguments[0] === 'number') {
					cfg.param.size = arguments[0];	
				}
				cfg.param.data = arguments[1];
			} else if (arguments.length == 1) {	// number or id or data
				if (typeof arguments[0] === 'string') {	// id
					cfg.param.id = arguments[0];
				} else if (typeof arguments[0] === 'number') {	// number
					cfg.param.size = arguments[0];	
				} else if (typeof arguments[0] === 'object') { // data
					cfg.param.size = -1;
					cfg.param.data = arguments[0];
				} else  {
					if (_debug) console.log('전달 데이터는 Number 또는 String(id) 또는 Object(data) Type입니다.');
					return;					
				}
			} else if (arguments.length == 0) {	// no parameter
				cfg.param.size = -1;
			}
			
			if (miaps.isPC()) {
				var tmpInfo;
				if (cfg.param.hasOwnProperty('id')) {
					tmpInfo = this.hist.pop(cfg.param.id);
					if (tmpInfo == null) return;
					
				} else if (cfg.param.hasOwnProperty('size')) {
					if (cfg.param.size > _mp.hist.getSize()) {
						if (_debug) console.log("전체 히스토리보다 큰 수를 입력 했습니다.");
						return;
					}
					tmpInfo = this.hist.pop(cfg.param.size);
					if (tmpInfo == null) return;	
				}
				if (cfg.param.data != null) {
					this.hist.setBackParam(tmpInfo.param.id, cfg);
				}
				location.replace(tmpInfo.param.url);			
			} else {
				// id, size에 따라 호출하는 함수를 구분한다.
				if (cfg.param.hasOwnProperty("size")) {
					cfg.method = "miapsBackPage";
				} else if (cfg.param.hasOwnProperty("id")) {
					cfg.method = "miapsBackPageToId";
				}
				miaps.mobile(cfg, function(res) {
					if (_debug) console.log(res);
					if (res.code != 200) {
						// 뒤로 가기 실패
						if (_debug) console.log("뒤로가기에 실패 했습니다.");
						return;						
					}
				});
			}
		},		
		getPageInfo : function() { // id:string, cbfunc:function (id가 없으면 현재 페이지 처리)
			var cfg = {
				type : "navigation",
				method : "miapsGetPageInfo",
				param: { id : "" }
			};
			
			if (miaps.isPC()) {
				var tmpArray, pageid = "", cbfunc;
				if (typeof arguments[0] === 'function') {
					// id가 없으면 현재페이지
					cbfunc = arguments[0];
					tmpArray = this.hist.getLastInfo();					 
				} else if (typeof arguments[0] === 'string') {
					pageid = arguments[0];
					cbfunc = arguments[1];
					tmpArray = this.hist.getPageInfo(pageid);
				}				
				cfg.code = 200;
				cfg.res = {
					param : tmpArray.param,
					backparam: (typeof tmpArray.backparam == 'undefined') ? null : tmpArray.backparam
				};
				cbfunc(JSON.stringify(cfg));
			} else { // miapsGetPageInfo
				var pageid = "", cbfunc;
				if (typeof arguments[0]  === 'function') {
					// id가 없으면 현재페이지
					cbfunc = arguments[0];										 
				} else if (typeof arguments[0] === 'string') {
					pageid = arguments[0];
					cbfunc = arguments[1];
					cfg.param.id = pageid;
				}				
				miaps.mobile(cfg, cbfunc);
			}
		},
		setTopPage : function(id, cbfunc) {	// id:string, cbfunc:function
		 	var cfg = {
		        type: "navigation",
		        method: "miapsSetTopPage",
				param: {
					id : id
				}
		    };
			if (miaps.isPC()) {
				this.hist.setTopPage(id);
				cbfunc(JSON.stringify(cfg));
			} else {				
				miaps.mobile(cfg, cbfunc);
			}
		},
		getTopPageId : function(cbfunc) { // cbfunc:function
			var cfg = {
		        type: "navigation",
		        method: "miapsGetTopPageId"				
			};
			if (miaps.isPC()) {
				cfg.code=200;
				cfg.res = {};
				cfg.res.topPageId = this.hist.getTopInfo().param.id;
				cbfunc(JSON.stringify(cfg));
			} else {				
				miaps.mobile(cfg, cbfunc);
			}			
		},
		goTopPage : function() { // nothing or data:object
			var cfg = {
		        type: "navigation",
		        method: "miapsGoTopPage",
				param: {
					data : {}
				}				
			};	
			if (arguments.length == 1) {	// data
				if (typeof arguments[0] === 'object') {
					cfg.param.data = arguments[0];
				}
			}					
			if (miaps.isPC()) {
				var topId = this.hist.getTopInfo().param.id;
				// object empty check
				if(Object.keys(cfg.param.data).length === 0 && cfg.param.data.constructor === Object) {
					miapsPage.back(topId);
				} else {
					miapsPage.back(topId, cfg.param.data);
				}				
			} else {
				miaps.mobile(cfg, function(res) {
					if (_debug) console.log(res);
					if (res.code != 200) {
						// 뒤로 가기 실패
						if (_debug) console.log("goTopPage() 실패 했습니다.");
						return;						
					}
				});
			}
		},		
		getHistoryCount : function(cbfunc) {
			var cfg = {
		        type: "navigation",
				method: "miapsGetHistoryCount"				
		    };
			if (miaps.isPC()) {
				cfg.code = 200;
				cfg.res = {};
				cfg.res.cnt = this.hist.getSize();
				cbfunc(JSON.stringify(cfg));
			} else {				
				miaps.mobile(cfg, cbfunc);
			}
		},
		/* 페이지 히스토리 삭제, Popup에서 호출 하면 안됩니다. */
		clear : function() {
			if (miaps.isPC()) {	
				// POPUP만 삭제. 페이지는 setTopPage로 처리한다.
				this.storage.clear(_mp.hPOPUP_KEY);
			}

			miapsPage.getHistoryCount(function(data) {
				var obj2 = miaps.parse(data);
				if (obj2.res.cnt == 0) { // 히스토리 수가 0일 경우
					return;
				} else {
					// 현재 페이지 ID를 구해 SetTopPage를 호출한다.
					miapsPage.getPageInfo(function(data) {
						var obj = miaps.parse(data);
						if (miaps.isIOS()) {
							if (obj.res.hasOwnProperty("param")) {
								miapsPage.setTopPage(obj.res.param.id, function() {});
							} else {
								miapsPage.setTopPage(obj.res.id, function() {});
							}
						} else if (miaps.isAndroid()) {
							miapsPage.setTopPage(obj.res.param.id, function() {});
						} else { // PC
							// Browser URL과 res.param.url이 다르면 Browser URL창에 직접 URL입력하여 표시된 화면이므로 location.href기준으로 clear한다. 
							if (obj.res.param.url != location.href) {
								_mp.storage.clear(_mp.hARRAY_KEY);
								miapsPage.initPageForPC();
							} else {
								miapsPage.setTopPage(obj.res.param.id, function() {});
							}
						}
					});	
				}
			});
		},
		createPopupId : function() {
			return new Date().getTime();
		},
		getPopupData : function(cbfunc) { // cbfunc:function
	        var cfg = {
		        type: "popup",
		        method: "miapsGetPopupInfo",
		        param: { id : "" }
		    }

			if (miaps.isPC()) {
				var popupData = miaps.parse(window.localStorage.getItem("openPopupData"));
				miapsPage.popupId = popupData.id; // 마지막 팝업ID를 자신이 저장해 놓는다.
				//delete popupData['type'];
				//delete popupData['method'];
				cfg.res = popupData;
				cbfunc(JSON.stringify(cfg));
			} else {
				miaps.mobile(cfg, cbfunc);	
			}
		},
		getPopupList : function(cbfunc) { // cbfunc:function
			var cfg = {
				type : "popup",
				method : "miapsGetPopupList"
			};
			
			if (miaps.isPC()) {
				var popupArray = _mp.storage.get(_mp.hPOPUP_KEY);
				if (popupArray == null) {
					cfg.code = -1;
					cfg.res = [];
					cbfunc(JSON.stringify(cfg));
				} else {
					_mp.hPopup = JSON.parse(popupArray);
					cfg.code = 200;				
					cfg.res = _mp.hPopup; 
					cbfunc(JSON.stringify(cfg));	
				}
			} else {
				miaps.mobile(cfg, cbfunc);
			}
		},		
		/* Open Full Popup */
		openPopup : function() { // *url:string, data:object
			var cfg = {
				type : "popup",
				method : "miapsCreatePopup",
				param : {
					id : miapsPage.createPopupId(),
					url : null,
					data : {},
					modal : true // dummy					
				}		
			};

			if (arguments[0].indexOf("http") > -1) {
				cfg.param.url = arguments[0];
				// Android, 외부 URL 경우는 enablebackbtn 실행하여 닫기버튼 이벤트를 앱에서 받아서 처리하도록 한다.
				if (miaps.isAndroid()) 
					miaps.mobile({ type : 'enablebackbtn', param: ''}, null);
			} else {
				cfg.param.url = this.defaultUrl + arguments[0];
			}

			if (arguments.length > 1) {	// url, data
				if (arguments[1] != null && typeof arguments[1] === "object") {
					cfg.param.data = arguments[1];	
				}

				if (miaps.isIOS() && arguments.length > 2) {	// url, data, closeButton
					cfg.param.closeButton = {};
					/* closeButton 
					{
						"align":"right" // default (left/right), 필수
						,"size": {		// default 30, X button image size, optional 
							"width": 30
							,"height":30
						}
						,"margin":{		// default 10, top, left/right margin, optional
							"top":10
							,"side":10
						}
						,"imagePath":"" // default X button image는 앱 내에 있는 것을 사용. 이 값을 주면 유저가 지정한 이미지를 사용 (${ResourceRoot}/image)
					}*/
					if (typeof arguments[2] === "object") {
						cfg.param.closeButton = arguments[2];	
					} else {
						cfg.param.closeButton = {align:"right"}; //default
					}
				}
			}
						
			if (miaps.isPC()) {				
				//location.replace(cfg.param.url);
				//var popobj = window.open(cfg.param.url, '_blank', '', true);				
				var popobj = window.open(cfg.param.url, cfg.param.id, '', true); // popup id를 이름으로 창을 열고 추후 이름으로 창에 접근할 수 있다.
				//window.open(cfg.param.url, '_self', '', true);
				
				// popup Array에 정보를 저장해 놓는다. (전체 닫기 할 때 사용한다)
				cfg.param.size = {width:0, height:0};	// dummy
				cfg.param.bgcolorgba = [0,0,0,0];		// dummy
				miapsPage.histPopup.push(cfg.param, popobj);
				
				// POPUP의 localStorage에 넣어 놓고, POPUP에서 getPopupDate()함수를 사용해서 데이터를 읽도록 한다.
				cfg.comments ='openPopupData는 PC전용 localStorage 값입니다.'				
				popobj.localStorage.setItem("openPopupData", JSON.stringify(cfg.param));
								
			} else {
				miaps.mobile(cfg, null);
			}
		},
		closePopup : function() { // data:object
			// save data - 부모 웹뷰에서 가져가기 위해 저장.	
			 var cfg = {
		        type: "popup",
		        method: "miapsSendToParent",
		        param: {
					data : {}
				}
		    };
			
			if (arguments.length == 1) { // data
				cfg.param.data = arguments[0];
			}
			
			if(miaps.isPC()) {
				cfg.comments ='closePopupData는 PC전용 localStorage 값입니다.'
				localStorage.setItem("closePopupData", JSON.stringify(cfg));
				
				// popup Array에서 현재popup데이터를 삭제한다.
				var tmpPopup = miapsPage.histPopup.pop();
				console.log("miapsPage.popupId:" + miapsPage.popupId);
				console.log("tmpPopup.id:" + tmpPopup.id); 
								
				if (typeof opener.miapsOnPopupReceive == 'function') {
					opener.miapsOnPopupReceive(miapsPage.popupId, JSON.stringify(cfg.param));
				}
				window.close();	
			} else {
				miaps.mobile(cfg, function(data) {
					// 저장이 성공하면 popup을 닫는다.
					var cfg2 = {
			            type: "popup",
		        		method: "miapsRemovePopup",
			            param: { id : "" }
			        };
			        miaps.mobile(cfg2, null);
				});
			}			
		},
		closePopupAll: function() { // data:object
			 // save data - 부모 웹뷰에서 가져가기 위해 저장.	
			 var cfg = {
		        type: "popup",
		        method: "miapsSendToParentPage",
		        param: {
					data : {}
				}
		    };
			
			if (arguments.length == 1) { // data
				cfg.param.data = arguments[0];
			}
			
			if(miaps.isPC()) {
				cfg.comments ='closePopupData는 PC전용 localStorage 값입니다.'
				localStorage.setItem("closePopupData", JSON.stringify(cfg));
				
				// 첫번째 저장된 popup의 부모창의 miapsOnPopupReceive를 호출 한다.
				var _tmpPopObj = miapsPage.histPopup.getPopupInfo(0);
				popObj = window.open('', _tmpPopObj.id+'');
				if (typeof popObj.ori_opener.miapsOnPopupReceive == 'function') {
					popObj.ori_opener.miapsOnPopupReceive(popObj.id, JSON.stringify(cfg.param));
				}
				
				// 전체 POPUP - 1 을 순서대로 닫는다. (마지막 POPUP 제외)
				_mp.hPopup = JSON.parse(_mp.storage.get(_mp.hPOPUP_KEY));
				var popObj, popArrayLen = _mp.hPopup.length;
				for (var i=0; i<popArrayLen-1; i++) {
					popObj = window.open('', _mp.hPopup[i].id+'');
					popObj.close();	
				}
				
				// remove popup Array
				this.storage.clear(_mp.hPOPUP_KEY);
				
				// 마지막으로 자신을 닫는다.
				window.close();	
			} else {
				miaps.mobile(cfg, function() {
					// 저장이 성공하면 모든 popup을 닫는다.
					var cfg2 = {
			            type: "popup",
		        		method: "miapsRemoveAllPopup"
			        };
			        miaps.mobile(cfg2, null);
				});
			}
		},
		initPageForPC : function() {
			if (null == JSON.parse(_mp.storage.get(_mp.hARRAY_KEY))) {			
				var lh = location.href;
				var cfg = {
					type : "navigation",
					method : "miapsGoPage",
					param : {
						animation: true, /* native -> native에서만 사용 */
						settop : true,
						actiontype : "Push",
						id : lh.substring(lh.lastIndexOf("/") + 1, lh.lastIndexOf(".")),
						url : lh									 
					},
					comments : 'historyArray는 PC전용 localStorage 값입니다.'
				};
				miapsPage.hist.push(cfg);		
			}	
		},		
		disableBackBtnCallback: function(data) {
			// Popup List가 있으면 Popup을 닫고, 없으면 페이지 이력 수를 확인 후 있으면 뒤로가기, 없으면 종료 시킨다.
			miapsPage.getPopupList(function(data) {	
				var obj = miaps.parse(data);
				if (obj.code != 200) {
					console.log('getPopupList unknown error...');
				} else {	
					if (obj.res.length == 0) {
						miapsPage.getHistoryCount(function(data) {
							var obj2 = miaps.parse(data);
							if (obj2.res.cnt == 1) { 	// 히스토리 수가 1일 경우								
								var param = {
									id: 'exit',
									title: '알 림',
									content: '종료하시겠습니까?',
									type: 2,
									callback: function() {
										miaps.mobile({									
											type: 'exit',
											param: ''
										}, null)
									}
								  }
								  modal.show(param)
							} else {
								miapsPage.back(-1);
							}					
						});
					} else {
						miapsPage.closePopup();	
					}
				}
			});	
		}		
	};	
	
	/* Android일 경우 back button이벤트를 miapsPage.back(-1)로 처리한다. 
	   disablebackbtn의 callback을 이름없는 함수를 사용하면, Popup이 열리고, 이 페이지(miapsPage)가 팝업에서 로드 될 때 새로운 callback이 등록되어, Popup을 닫고 이전 페이지가 표시된 후
	   disablebackbtn이 발생하면 Popup에서 생성되었던 callback을 찾으려고 해서 에러가 발생하므로, callback명을 고정해서 사용해야 합니다. 2020.12.09 chlee
	*/
	if (miaps.isAndroid()) {
		miaps.mobile({
				type: 'disablebackbtn',
				param: '',
				callback: 'miapsPage.disableBackBtnCallback'
			}, miapsPage.disableBackBtnCallback);
	} 

	// PC에서 miaps_page.js로드 된 시기에 localstorage의 historyArray가 비어있을 경우는 URL로 페이지를 호출 한 경우라고 가정하고, 현재 페이지를 historyArray에 넣는다.
	if (miaps.isPC()) {
		miapsPage.initPageForPC();
	}
	
	// END miapsPage
	return _mp;
}));