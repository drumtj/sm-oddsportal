const Utils = {};
Utils.save = function (key, data, c) {
    Utils.load(key, function (result) {
        let d = {};
        if (result) {
            if (typeof data === "object" || Array.isArray(data)) {
                for (let o in data) {
                    result[o] = data[o];
                }
                d[key] = result;
            }
            else {
                d[key] = data;
            }
            chrome.storage.local.set(d, c || function () { });
        }
        else {
            d[key] = data;
            chrome.storage.local.set(d, c || function () { });
        }
    });
};
Utils.load = function (key, c) {
    chrome.storage.local.get(key, function (result) {
        if (c) {
            c.call(null, result[key]);
        }
    });
};

Utils.calc = {
    stakeB: function (oddA, oddB, stakeA) {
        return oddA / oddB * stakeA;
    },
    investment: function (oddA, oddB, stakeA) {
        return this.stakeB(oddA, oddB, stakeA) + stakeA;
    },
    profit: function (oddA, oddB, stakeA) {
        return oddA * stakeA - this.investment(oddA, oddB, stakeA);
    },
    profitP: function (oddA, oddB, stakeA) {
        return this.profit(oddA, oddB, stakeA) / this.investment(oddA, oddB, stakeA);
    }
};

function delay(n){
	return new Promise(resolve=>setTimeout(resolve, n));
}

function findEl(selector, timeout=0){
  return new Promise(resolve=>{
    let dt = Date.now();
		let isArr = Array.isArray(selector);
    function fn(){
      // console.error("findEl", selector);
      let $r, arr;
      if(isArr){
				for(let i=0; i<selector.length; i++){
					$r = $(selector[i]);
          if($r.length){
						resolve($r);
            return;
          }
				}
      }else{
        $r = $(selector);
        if($r.length){
          resolve($r);
          return;
        }
      }

      if(timeout > 0 && Date.now() - dt > timeout){
        resolve(arr || null);
      }else{
        requestIdleCallback(fn);
      }
    }
    fn()
  })
}

function findElAll(selector, timeout=0){
  return new Promise(resolve=>{
    let dt = Date.now();

		if(!Array.isArray(selector)){
			selector = [selector];
		}

    function fn(){
      // console.error("findEl", selector);
      let $r, arr;

			let f = false;
      arr = selector.map(s=>{
        let $s = $(s);
        if($s.length){
					f = true;
          return $s;
        }else{
          return null;
        }
      })
      if(f){
        resolve(arr);
        return;
      }

      if(timeout > 0 && Date.now() - dt > timeout){
        resolve(arr || null);
      }else{
        requestIdleCallback(fn);
      }
    }
    fn()
  })
}

function pause(fn){
	return new Promise(resolve=>{
		if(typeof fn === "function"){
			fn(resolve);
		}
	})
}

function until(findFunc, timeout=0, cancelObj){
  return new Promise(resolve=>{
    let dt = Date.now();
    function fn(){
      if(findFunc()){
        resolve(true);
      }else{
        if(timeout > 0 && Date.now() - dt > timeout){
          resolve(false);
        }else{
          requestIdleCallback(fn);
        }
      }
    }
		if(typeof cancelObj === "object"){
			cancelObj.cancel = function(){
				cancelIdleCallback(fn);
			}
		}
    fn()
  })
}
