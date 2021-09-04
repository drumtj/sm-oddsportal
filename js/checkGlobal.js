console.log("checkGlobal.js");
function checkGlobal(){
  if(!window.globals){
    requestIdleCallback(checkGlobal);
  }else{
    var s = window.globals.jsonpCallback;
    window.globals.jsonpCallback = function(){
      s.apply(this, arguments);
      window.postMessage("update", window.location.origin);
      // setTimeout(()=>{
      //   console.error("todo update");
      // }, 500);
    }
  }
}
requestIdleCallback(checkGlobal);
