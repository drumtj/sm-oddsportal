console.log("main.js");
var HOST = "http://www.surebet.vip";
// var HOST = "http://175.196.220.135";

var isActive = true;
$(document).ready(function () {

  $("#btn").click(function () {
      if (isActive) {
          Stop();
      }
      else {
          Start();
      }
  });

  // let socket = io("http://192.168.0.4:4500", {
  //   path: '/js'
  // });
  //
  // socket.on('connection', (socket) => {
  //   console.error("socket connection");
  // });
});
function Start() {
    isActive = true;
    $("#btn").removeClass("pause").addClass("run");
}
function Stop() {
    isActive = false;
    $("#btn").removeClass("run").addClass("pause");
    sendData([]);
    // $.ajax(HOST + "/api/input_data", {
    //     dataType: "json",
    //     type: "POST",
    //     data: {
    //         data: "[]"
    //     }
    // });
}
function sendData(data){
  let str = JSON.stringify(data);
  $.ajax(HOST + "/api/input_data", {
      dataType: "json",
      type: "POST",
      beforeSend: xhr=>{
        xhr.setRequestHeader("Authorization", "betburger");
      },
      // data,
      // data: escape(JSON.stringify(data)),
      data: {data:str},
      success:response=>{},
      error:e=>console.error(e)
  });

  $.ajax("http://158.247.214.242/api/input_data", {
      dataType: "json",
      type: "POST",
      beforeSend: xhr=>{
        xhr.setRequestHeader("Authorization", "betburger");
      },
      // data,
      // data: escape(JSON.stringify(data)),
      data: {data:str},
      success:response=>{},
      error:e=>console.error(e)
  });

  // to dev
  $.ajax("http://1.235.111.130/api/input_data", {
      dataType: "json",
      type: "POST",
      beforeSend: xhr=>{
        xhr.setRequestHeader("Authorization", "betburger");
      },
      // data,
      // data: escape(JSON.stringify(data)),
      data: {data:str},
      success:response=>{},
      error:e=>console.error(e)
  });
}
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("[main.js]", message);
    console.log(message.data);
    if (!isActive)
        return;
    switch (message.event) {
        case "loadArbsData":
          sendData(message.data);
            // $.ajax(HOST + "/saveDataForBetburger.php", {
            //     dataType: "json",
            //     type: "POST",
            //     data: {
            //         data: escape(JSON.stringify(message.data))
            //     }
            // });
          break;
        case "exit":
            Stop();
            break;
        case "test":
            console.log(JSON.stringify(message.data));
            break;
    }
});
