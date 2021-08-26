(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
    	factory();
  }
}(function () {
	var miapsPage = window.miapsPage = {

		defaultUrl : location.origin + "/pages/",
		hArray : [],
		
		go : function() { // url:string, data:object
			var hInfo = {};
			hInfo.url = miapsPage.defaultUrl + arguments[0]; // url
			hInfo.prev = location.href;

			if (arguments.length > 1) { 
				if (arguments[1] instanceof Object) {
					hInfo.data = arguments[1];					
				} else {
					console.log('전달 데이터는 Object Type입니다.');
					return;
				}
			}

			if (sessionStorage.getItem('historyArray') == null || sessionStorage.getItem('historyArray') == '[]') {
				miapsPage.hArray.push(hInfo);
			} else {
				miapsPage.hArray = JSON.parse(sessionStorage.getItem('historyArray'));
				var historyLength = miapsPage.hArray.length > 0 ? miapsPage.hArray.length-1 : 0;
				var lastestUrl = miapsPage.hArray[historyLength].url;
				if(hInfo.url === lastestUrl) miapsPage.hArray.pop();
				miapsPage.hArray.push(hInfo);
			}
			sessionStorage.setItem('historyArray', JSON.stringify(miapsPage.hArray));

			if (hInfo.data != undefined) { 
				sessionStorage.setItem('goData', JSON.stringify(hInfo.data));
			} else {
				sessionStorage.setItem('goData', null);
			}
			
			sessionStorage.setItem('type', 'go');
			
			location.href = hInfo.url;
		},

		back : function() {
			miapsPage.hArray = JSON.parse(sessionStorage.getItem('historyArray'));
			var tmpInfo = miapsPage.hArray.pop();
			//console.log('url:' + tmpInfo.url);

			if (tmpInfo == null) {
				return;
			}

			if (tmpInfo.data != undefined) { 
				sessionStorage.setItem('backData', JSON.stringify(tmpInfo.data));
			} else {
				sessionStorage.setItem('backData', null);
			}
			
			sessionStorage.setItem('type', 'back');

			sessionStorage.setItem('historyArray', JSON.stringify(miapsPage.hArray));
			
			location.href = tmpInfo.prev;
		},
		
		clear : function() {
			miapsPage.hArray = [];
			sessionStorage.setItem('historyArray', JSON.stringify(miapsPage.hArray));
			sessionStorage.setItem('goData', null);
			sessionStorage.setItem('backData', null);
			sessionStorage.setItem('openPopupData', null);
			sessionStorage.setItem('closePopupData', null);
			sessionStorage.setItem('type', null);
		},

		
		
		openPopup : function() { // url:string, sendData: Object
			var url = arguments[0];

			if (arguments.length > 1) { 
				if (arguments[1] instanceof Object) {
					sessionStorage.setItem('openPopupData', JSON.stringify(arguments[1]));
				} else {
					console.log('전달 데이터는 Object Type입니다.');
					return;
				}
			}
			
			sessionStorage.setItem('type', 'opnpop');
			location.replace(miapsPage.defaultUrl + url);
		},

		closePopup : function(sendData) { // sendData : Object
			miapsPage.hArray = JSON.parse(sessionStorage.getItem('historyArray'));
			var hArrayLen = miapsPage.hArray.length;
			var tmpInfo = miapsPage.hArray[hArrayLen - 1]; // 마지막 페이지 (pop하지 않고, 그냥 값만 가져온다)

			if (tmpInfo == undefined) {
				tmpInfo = new Object();
				tmpInfo.url=miapsPage.defaultUrl + 'MA/MA050.html';
			}

			console.log('url:' + tmpInfo.url);

			if (sendData != null) {
				if (sendData instanceof Object) {
					sessionStorage.setItem('closePopupData', JSON.stringify(sendData));
				} else {
					console.log('전달 데이터는 Object Type입니다.');
					return;
				}
			}			
			
			sessionStorage.setItem('type', 'clspop');
			location.replace(tmpInfo.url);
		},

		getData : function(type) { // 'go', 'back', 'opnpop', 'clspop'
			var _item = null;
			if (type == 'go') {
				_item = sessionStorage.getItem("goData");
				if (_item != null) {
					_item = miaps.parse(sessionStorage.getItem("goData"));
				}
			} else if (type == 'back') {
				_item = sessionStorage.getItem("backData");
				if (_item != null) {
					_item = miaps.parse(sessionStorage.getItem("backData"));
				}
			} else if (type == 'opnpop') {
				_item = sessionStorage.getItem("openPopupData");
				if (_item != null) {
					_item = miaps.parse(sessionStorage.getItem("openPopupData"));
				}
			} else if (type == 'clspop') {
				_item = sessionStorage.getItem("closePopupData");
				if (_item != null) {
					_item = miaps.parse(sessionStorage.getItem("closePopupData"));
				}
			}
						 
			return  _item;
		},
		
		getType : function() { // 'go', 'back', 'opnpop', 'clspop'
			var type = sessionStorage.getItem("type");
			var _item = type === 'null' ? null : type;
			return  _item;
		},
		
		removeSstgItem : function(type) {
			if (type == 'go') {
				sessionStorage.setItem("goData", null);
			} else if (type == 'back') {
				sessionStorage.setItem("backData", null);
			} else if (type == 'opnpop') {
				sessionStorage.setItem("openPopupData", null);
			} else if (type == 'clspop') {
				sessionStorage.setItem("closePopupData", null);
			}
		}
	};
	// END miapsPage
	
	return miapsPage;
}));

// miapsPage.go(location.origin + '/miaps/samples2/pages/history/loginGeneral2.html', '');
// $("#btnBack").on("click", function() { 		miapsPage.back();  	});  



