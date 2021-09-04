console.log("background.js");
var opend = false;
var panel = 0;
var width = 537 + 15 + 275;
var height = 750;

var winInfo = {
  basketball: {
    id: null,
    url: "https://www.oddsportal.com/matches/basketball/"
  },
  baseball: {
    id: null,
    url: "https://www.oddsportal.com/matches/baseball/"
  },
  hockey: {
    id: null,
    url: "https://www.oddsportal.com/matches/hockey/"
  }
}
// function _executeScript(id, opt){
//   return new Promise(resolve=>chrome.tabs.executeScript(id, opt, resolve));
// }
async function executeScript(id, list){
  for(let i=0; i<list.length; i++){
    await new Promise(resolve=>chrome.tabs.executeScript(id, opt, resolve));
    // await _executeScript(id, list[i]);
  }
}
// chrome.windows.onBoundsChanged.addListener(function(win){
//   console.error(win);
// })
function createWin(info, i=0, n=1){
  if (!info.opend) {
      info.opend = true;
      // console.error(i/n * (screen.availWidth - width));
      chrome.windows.create({
          url: info.url,
          left: parseInt(i/n * (screen.availWidth - width)),
          // left: parseInt(screen.availWidth - width),
          top: 0,
          width: width,
          height: height,
          type: "popup",
          state: "normal",
          focused: true,
          // incognito: true//시크릿

      }, function (win) {
          info.id = win.id;
          let tab = win.tabs[0];
          chrome.tabs.executeScript(tab.id, {
            code: "sessionStorage.setItem('fromApp', true);"
          });
          // executeScript(tab.id, [
          //   {file: "lib/jquery-2.1.3.min.js"},
          //   {file: "js/content.js"}
          // ]);
          // chrome.tabs.executeScript(tab.id, {
          //   file: "js/content.js"
          // });
          // chrome.tabs.insertCSS(tab.id, {
          //   file: "css/style.css"
          // });

      });
  }
  else {
      chrome.windows.update(info.id, {
          focused: true
      });
  }
}

chrome.windows.onRemoved.addListener(function (wid) {
  for(let k in winInfo){
    let info = winInfo[k];
    if(info && info.id === wid){
      info.id = null;
      info.opend = false;
    }
  }
});
chrome.browserAction.onClicked.addListener(function (tab) {
  let i=0;
  for(let k in winInfo){
    // console.error(k, winInfo[k]);
    createWin(winInfo[k], i++, 3-1);
  }
});

function update(data){
  if(data && data.leagues.length){
    $.ajax("http://localhost:8081/api/input_oddsportal_data", {
        dataType: "json",
        type: "POST",
        beforeSend: xhr=>{
          xhr.setRequestHeader("Authorization", "tj");
        },
        // data,
        // data: escape(JSON.stringify(data)),
        data: data,
        success:response=>{},
        error:e=>console.error(e)
    });
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log(message);
    switch (message.event) {
      case "update":
        update(message.data);
    }
});

// chrome.webRequest.onBeforeRequest.addListener(function (details) {
//     return {
//         redirectUrl: chrome.extension.getURL("js/arbs_custom18.js")
//     };
// }, {
//     urls: ["https://www.betburger.com/packs/js/arbs-*.js"],
//     types: ["script"]
// }, ["blocking"]);
