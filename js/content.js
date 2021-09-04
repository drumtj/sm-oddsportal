console.log("content.js");
window.addEventListener("load", ()=>{
  console.log("load window");
  // var s = document.createElement("style");
  // s.innerHTML = `body{display:none}`;
  // document.body.appendChild(s);

  // function checkGlobal(){
  //   console.error(1);
  //   if(!window.globals){
  //     requestIdleCallback(checkGlobal);
  //   }else{
  //     console.error("!!!");
  //     var s = window.globals.jsonpCallback;
  //     window.globals.jsonpCallback = function(){
  //       s.apply(this, arguments);
  //       console.error('!');
  //       setTimeout(()=>{
  //         console.error("todo update");
  //       }, 500);
  //     }
  //   }
  // }
  // requestIdleCallback(checkGlobal);

  if(sessionStorage.getItem("fromApp")){
    let w = 600 + 275;
    let h = 700;
    window.onresize = function(e){
      window.resizeTo(w, h);
    }
    inject();
  }
})
var originUrl;
function getDateStr(){
  let s = $(".c-day>a").attr("href");
  return s?s.match(/(\d{4})(\d{2})(\d{2})/).slice(1,4).join('-'):s;
}

function refresh(){
  window.location.href = originUrl;
}

let itv_scrap;
function scrap(){
  if(!checkedGMT){
    console.error("not checking gmt");
    return;
  }
  clearTimeout(itv_scrap);
  itv_scrap = setTimeout(refresh, 1000 * 60 * 2);

  let leagues = [], c;
  let sports = window.location.href.match(/.+matches\/([^/]+)\/.*/)[1];
  let overwrite = sessionStorage.getItem("overwrite") == "true";
  sessionStorage.setItem("overwrite", false);
  let siteDateStr = getDateStr();
  let data;
  if(siteDateStr){
    data = {
      date: siteDateStr,
      leagues,
      sports,
      overwrite
    }
    $("#table-matches>.table-main>tbody").find("tr").toArray().forEach(tr=>{
      let $tr = $(tr);
      if($tr.is("[xtid]")){
        let [country, league] = $tr.find("th:nth-child(1)>a").toArray().map(a=>$(a).text().trim());
        c = [];
        let m = {
          country, league, games:c
        }
        leagues.push(m);
      }else{
        // let live = $tr.find(".live-odds-ico-prev:visible").length>0;
        let live = $tr.find(".live-score:visible").length>0;
        if($tr.find("#emptyMsg").length == 0){
          let $score = $tr.find("td.table-score");
          let score = $score.text().trim();
          let homeScore=-1, awayScore=-1;
          // let home, away;
          // if(score.length == 0 || (score.length && score.indexOf(':')>-1)){

            let settled = $tr.hasClass("deactivate");
            // let live = $score.hasClass("live-score");

            // console.error("?", score)
            let cancelMemo = "";
            if(score.indexOf(':')>-1){
              score = score.split(':').map(n=>parseInt(n));
              homeScore = score[0];
              awayScore = score[1];
            }else{
              cancelMemo = score;
            }
            let time = $tr.find("td.table-time").text().trim();
            let players = $tr.find("td.table-participant").text().trim().split(' - ');
            // home = players[0];
            // away = players[1];
            let oddsList = $tr.find("td.odds-nowrp").toArray();
            // -1은 결과처리전
            // -2는 무승부
            // 0은 home승
            // 1은 away승
            // let result = oddsList.reduce((r,td,i)=>{
            //   if($(td).hasClass("result-ok")){
            //     if(oddsList.length==3){
            //       if(i==1){
            //         return -2;
            //       }else if(i==2){
            //         return 1;
            //       }
            //       return i;
            //     }else{
            //       return i;
            //     }
            //   }
            //   return r;
            // }, -1)
            let result = oddsList.reduce((r,td,i)=>{
              if($(td).hasClass("result-ok")){
                if(oddsList.length==3){
                  if(i==1){
                    return 'x';
                  }else if(i==2){
                    return '2';
                  }
                  return '1';
                }else{
                  return i==0?'1':i==1?'2':'x';
                }
              }
              return r;
            }, "")
            // c.push({time, players, score, result, live})

            let date;
            if(!live){
              date = new Date(data.date + ((time && time.indexOf(':')>-1)?' '+time:''));
            }
            c.push({dateStr:data.date, date, time, players, homeScore, awayScore, result, live, cancelMemo});
          // }
        }
      }
    })
  }

  if(data){
    console.error(1, JSON.parse(JSON.stringify(data)));
  }
  // updateDataFilter(data, overwrite);
  // console.error(2, data);

  if(data && data.leagues.length){
    chrome.runtime.sendMessage({ event: "update", data: data });
    // $.ajax("http://localhost/api/input_oddsportal_data", {
    //     dataType: "json",
    //     type: "POST",
    //     beforeSend: xhr=>{
    //       xhr.setRequestHeader("Authorization", "tj");
    //     },
    //     // data,
    //     // data: escape(JSON.stringify(data)),
    //     data: data,
    //     success:response=>{},
    //     error:e=>console.error(e)
    // });
  }

  autoScrap();
}

function updateDataFilter(data, overwrite){
  let leagues = data.leagues;
  for(let i=0; i<leagues.length; i++){
    let league = leagues[i];
    let games = league.games;
    for(let k=0; k<games.length; k++){
      let game = games[k];
      let players = game.players;
      let result = game.result;
      let live = game.live;
      let homeScore = game.homeScore;
      let awayScore = game.awayScore;
      let settled = !live&&homeScore!=-1
      let time = game.time||"";

      let key = [data.date,time,league.league,players[0],players[1],homeScore,awayScore,live,settled].join('_').replace(/ /g,'');
      let item = localStorage.getItem(key);
      if(!overwrite && item){
        games.splice(k, 1);
        k--;
      }else{
        localStorage.setItem(key, 1);
      }
    }
    if(games.length == 0){
      leagues.splice(i, 1);
      i--;
    }
  }
}

function getDateString(d){
  return [
    d.getFullYear(),
    (d.getMonth()+1).toString().padStart(2, '0'),
    d.getDate().toString().padStart(2, '0')
  ].join('-');
}

function startRefreshTimer(){
  setInterval(()=>{
    let d = new Date();
    let s = getDateStr();
    let dateStr = getDateString(d);
    if(d.getHours() >= 0 && d.getMinutes() >= 5 && dateStr != s){
      console.error("go", originUrl);
      window.location.href = originUrl;
    }else if(d.getHours() == 23 && d.getMinutes() == 55 && dateStr == s){
      let a = originUrl + dateStr.replace(/-/g, '') + '/';
      delay(1000*60).then(()=>{
        console.error("go", a);
        sessionStorage.setItem("preloadNextMatche", 1);
        window.location.href = a;
      })
    }
  }, 1000 * 60);
}

let checkedGMT;
async function checkGMT(){
  let t = /.+GMT \+9/.test($("#user-header-timezone-expander>span").text());
  if(!t){
    $(`<div id="cover">GMT 설정중</div>`).appendTo(document.body);
    console.error("set GMT+9");
    $("#user-header-timezone-expander")[0].click();
    let $a = await findEl("a[href='/set-timezone/82/']");
    $a[0].click();
    // window.location.href = "https://www.oddsportal.com/set-timezone/82/";
    // $("a[href='/set-timezone/82/']")[0].click();
    return false;
  }
  checkedGMT = true;
  return true;
}

// function delay(n){
//   return new Promise(resolve=>setTimeout(resolve,n));
// }

let $autoScrapStatus = $('<input type="text" id="scrapStatus" style="width:245px" readOnly/>');
let $startDate = $(`<input type="date" id="startDate">`);
let $endDate = $(`<input type="date" id="endDate">`);

$startDate.on("change", ()=>{
  let sd = $startDate.val();
  let ed = $endDate.val();
  let dd = validDateCheck([sd, ed]);
  if(dd){
    if(dd[0] > dd[1]){
      $endDate.val(getDateString(dd[0]));
    }
  }
})

$endDate.on("change", ()=>{
  let sd = $startDate.val();
  let ed = $endDate.val();
  let dd = validDateCheck([sd, ed]);
  if(dd){
    if(dd[0] > dd[1]){
      $startDate.val(getDateString(dd[1]));
    }
  }
})

function validDateCheck(list){
  let dd = list.map(d=>new Date(d))
  if(dd.toString().indexOf("Invalid Date") == -1){
    return dd;
  }
  return false;
}

function startAutoScrap(startDate, endDate){
  if(!validDateCheck([startDate, endDate])){
    $autoScrapStatus.val("자동스크랩 날짜가 입력되지 않았습니다.");
    return;
  }
  sessionStorage.setItem("autoScrap", 1);
  sessionStorage.setItem("autoScrapStartDate", startDate);
  sessionStorage.setItem("autoScrapEndDate", endDate);
  sessionStorage.setItem("autoScrapCurrentDate", startDate);
  // autoScrap(true);
  // $autoScrapStatus.val(`자동스크랩 시작`);

  window.location.href = originUrl + startDate.replace(/-/g, '') + '/';
}

function stopAutoScrap(){
  sessionStorage.setItem("autoScrap", 0);
  $autoScrapStatus.val(`자동스크랩 중지됨`);
}

async function autoScrap(){
  // console.error("?", sessionStorage.getItem("autoScrap"));
  if(sessionStorage.getItem("autoScrap")=="1"){
    let sd = sessionStorage.getItem("autoScrapStartDate");
    let ed = sessionStorage.getItem("autoScrapEndDate");
    let cd = sessionStorage.getItem("autoScrapCurrentDate");
    let startDate = new Date(sd);
    let endDate = new Date(ed);
    let currentDate = new Date(cd);

    if(validDateCheck([startDate, endDate, currentDate])){
      if(currentDate >= startDate && currentDate <= endDate){
        let cs = getDateString(new Date(currentDate.getTime() + 1000*60*60*24));
        // next
        sessionStorage.setItem("autoScrapCurrentDate", cs);
        console.error(`자동스크랩`, sd, ed, cd);
        // if(!now){
        //   // $autoScrapStatus.val(`[자동스크랩 ${sd}~${ed}]5초뒤 ${cs}로 이동`);
        //   await delay(2000);
        // }
        if(sessionStorage.getItem("autoScrap")=="1"){
          window.location.href = originUrl + cd.replace(/-/g, '') + '/';
        }
      }else{
        sessionStorage.setItem("autoScrap", 0);
        $autoScrapStatus.val(`자동스크랩 완료`);
        console.error(`자동스크랩 종료`);
      }
    }
  }
}


function setupUI(){
  let $autoScrapStartBtn = $(`<button>자동스크랩 시작</button>`);
  let $autoScrapStopBtn = $(`<button>자동스크랩 정지</button>`);

  $autoScrapStartBtn.on("click", ()=>{
    startAutoScrap($startDate.val(), $endDate.val());
  })
  $autoScrapStopBtn.on("click", ()=>{
    stopAutoScrap();
  })

  $("#my-calendar")
  // .append(`<button onclick="localStorage.clear();">업데이트 내역 제거</button>`)
    .append(`<button onclick="sessionStorage.setItem('overwrite', true);">다음전송 덮어쓰기</button>`)
    .append($startDate)
    .append($endDate)
    .append($autoScrapStartBtn)
    .append($autoScrapStopBtn)
    .append($autoScrapStatus)

  if(sessionStorage.getItem("autoScrap")=="1"){
    let sd = sessionStorage.getItem("autoScrapStartDate");
    let ed = sessionStorage.getItem("autoScrapEndDate");
    let cd = sessionStorage.getItem("autoScrapCurrentDate");
    sessionStorage.setItem('overwrite', true);
    $startDate.val(sd);
    $endDate.val(ed);
    $autoScrapStatus.val(`자동스크랩중 ${cd}`);
  }
}

function inject(){
  var s = document.createElement("script");
  s.src = chrome.extension.getURL("js/checkGlobal.js");
  document.body.appendChild(s);
  var c = document.createElement("link");
  c.rel = "Stylesheet";
  c.href = chrome.extension.getURL("css/style.css");
  document.body.appendChild(c);

  originUrl = window.location.href.replace(/(.+\/matches\/[^/]+\/).*/, "$1");

  async function fn(){
    if($(".table-main").length){
      setupUI();


      await delay(500);
      if(await checkGMT()){
        startRefreshTimer();
        scrap();
        if(sessionStorage.getItem("preloadNextMatche")==1){
          sessionStorage.removeItem("preloadNextMatche");
          console.log("go origin");
          window.location.href = originUrl;
        }
      }
    }else{
      requestIdleCallback(fn);
    }
  }
  requestIdleCallback(fn);
}
window.addEventListener("message", function (e) {
    if (e.data == "update") {
      // console.error(e.data["arbs"]);
        // console.error("message", e);
        setTimeout(scrap, 500);
        // chrome.runtime.sendMessage({ event: "loadArbsData", from: "betburger", data: data });
    }
    if (e.origin == window.location.origin)
        return;
    console.log("console.log in page:", e);
});
// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//     console.log("[betburger.js]", message);
// });
//
// let eventTime = {};
// function dataConvert(arr){
//   let list = [];
//   // arr.map(({bets})=>bets)
//   // .sort((a,b)=>a.event_id-b.event_id)
//   // arr.forEach(bets=>{
//   arr.forEach(({bets})=>{
//     if(bets.length>2) return;
//     if(bets[0].bookmaker.name == bets[1].bookmaker.name) return;
//     if(bets[0].sport.name == "E-Sports") return;
//     if(bets[0].swap_teams || bets[1].swap_teams){
//       return;
//     }
//     if(bets[0].bet_value && (bets[0].bet_value.value % 1 == 0.25 || bets[0].bet_value.value % 1 == 0.75)){
//       return;
//     }
//     if(bets[1].bet_value && (bets[1].bet_value.value % 1 == 0.25 || bets[1].bet_value.value % 1 == 0.75)){
//       return;
//     }
//     // if(bets[0].team_home !== bets[1].team_home) return;
//     // if(bets[0].team_away !== bets[1].team_away) return;
//     if(bets[0].event_id !== bets[1].event_id) return;
//
//     // d.event_display_name.toCopy가 bookmaker가 배팅할 곳인데
//     // 양쪽사이트가 같은곳을 가리키는 경우가있다, 같은곳을 가리키는데 타입은 TO,TU로 나뉘어져있는상황.
//     // 똑같은 home/away에 배팅을 하면 안되는거면 TO,TU가 나뉘어져잡혔어도 골라내야할까?
//
//     let b = bets.find(b=>b.bookmaker.name == "Pinnacle");
//     // 이벤트가 0.2초 안에 사라지는 것은 가져오지 말자
//     if(eventTime[b.id] !== undefined){
//       if(Date.now() - eventTime[b.id] < 200){
//         return;
//       }else{
//         let keepTime = b.is_live==1 ? 3*60*60*1000 : 48*60*60*1000;
//         let bid = b.id;
//         setTimeout(()=>{
//           delete eventTime[bid];
//         }, keepTime)
//       }
//     }else{
//       eventTime[b.id] = Date.now();
//       return;
//     }
//
//     // b = bets.find(b=>b.bookmaker.name == "Bet365");
//     // //"1343184781|3/5|97726006|+3"
//     // let dlink = b.direct_link.split('|');
//     // b.betLink = `https://www.bet365.com/dl/sportsbookredirect?bs=${dlink[2]}-${dlink[0]}~${b.koef}&bet=1#${b.bookmaker_event_direct_link}`;
//
//     let profitP = Utils.calc.profitP(bets[0].koef, bets[1].koef, 1);
//
//     list.push(bets.map((d,i)=>{
//       let betType;
//       let homeAway = i==0 ? "home" : "away";
//       // let targetTeam = d.event_display_name.toCopy;
//       // let homeAway = targetTeam == d.home ? "home" : "away";
//       if(d.compare.title.indexOf("Handicap") > -1){
//         betType = "SPREAD";
//       }else{
//         betType = d.compare.title.split(" ")[0].toUpperCase();
//       }
//
//       let team, side;
//       // console.error("betType", betType)
//       if(betType == "TOTAL"){
//         betType = "TOTAL_POINTS";
//         side = d.compare.display_value_text.indexOf("Over") > -1 ? "OVER" : "UNDER";
//       }else if(betType == "SPREAD"){
//         team = homeAway=="home" ? "Team1" : "Team2";
//       }else{
//         //MONEYLINE, SPREAD
//         team = d.compare.display_value_text.indexOf("Team") > -1 ? d.compare.display_value_text.split(' ')[0] : undefined;
//         homeAway = team == "Team1" ? "home" : "away";
//       }
//
//       let handicap;
//       if(betType == "TOTAL_POINTS" || betType == "SPREAD"){
//         handicap = d.bet_value ? d.bet_value.value : 0;
//       }
//
//       // if(bets[0].swap_teams || bets[1].swap_teams){
//       //   console.error(d.bookmaker.name.toLowerCase(), betType, homeAway, d[homeAway], {side, team}, d.compare.display_value_text);
//       //   return;
//       // }
//
//
//
//       // console.log([d.bookmaker.name.toLowerCase(), betType, i, "home="+ d.team_home, "away="+ d.team_away, "myTeam="+ d[homeAway]], "type="+d.original_value.res);
//       // console.error("d.compare", d.compare);
//       // console.error({betType, team, side});
//       // console.error("betType", betType);
//       let pn = d.period_name_by_sport.period.charAt(0);
//       let periodNumber = pn=="1"?1:pn=="2"?2:0;
//
//       let result = {
//         id: d.id,
//         // eventId: d.bookmaker_event_id,
//         // eventDirectLink: d.bookmaker_event_direct_link,
//         // eventId: d.bookmaker_event_direct_link,
//         eventId: d.direct_link.split('|')[0].split('/')[0],
//         betburgerEventId: d.event_id,
//         directLink: d.direct_link,
//         bookmaker: d.bookmaker.name.toLowerCase(),
//         home: d.home,
//         away: d.away,
//         homeScore: d.home_score,
//         awayScore: d.away_score,
//         sports: d.sport.name,
//         odds: d.koef,
//         score: d.current_score ? d.current_score.replace("-", ":") : d.current_score,
//         corner: d.corner,
//         isLive: d.is_live,
//         leagueName: d.bookmaker_league_name,
//         eventName: d.bookmaker_event_name,
//         periodName: d.period_name_by_sport.period,
//         bookmakerDirectLink: d.bookmaker_event_direct_link,
//         periodNumber,
//         homeAway,
//         type:{
//           code: d.original_value.res,
//           set: d.period_name_by_sport_t
//         },
//         handicap: handicap,
//         betType,
//         team,
//         side,
//         profitP,
//         origin: d
//       }
//
//       if(result.bookmaker == "bet365"){
//         let dlink = d.direct_link.split('|');
//         result.betLink = `https://www.bet365.com/dl/sportsbookredirect/?bs=${dlink[2]}-${dlink[0]}~${d.koef}&bet=1#${d.bookmaker_event_direct_link}`;
//       }
//
//       return result;
//     }).filter(a=>!!a))
//   })
//   list.sort((a,b)=>{
//     return b.profitP - a.profitP;
//   })
//   return list;
// }

//
// (function() {
//   var open = window.XMLHttpRequest.prototype.open;
//   window.XMLHttpRequest.prototype.open = function() {
//     console.log( arguments );
//     return open.apply(this, [].slice.call(arguments));
//   };
//
//   var send = window.XMLHttpRequest.prototype.send;
//   window.XMLHttpRequest.prototype.send = function(data) {
//     //...what ever code you need, i.e. capture response, etc.
//     if (this.readyState == 4 && this.status >= 200 && this.status < 300) {
//        // xhrSendResponseUrl = this.responseURL;
//        // responseData = this.data;  // now you have the data, JSON or whatever, hehehe!
//        console.log("send", {url:this.responseURL, data:this.data});
//     }
//     send.apply(this, arguments); // reset/reapply original send method
//    }
// })();
