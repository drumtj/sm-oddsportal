function(e) {
  var t = e.filters_count;
  delete e.filters_count;
  for (var a in e) e[a] instanceof Array || (this.options[a] = e[a]);
  var n = this;
  ///
  var n1 = e.arbs;
  ///
  $.when(n.checketBetCombimations(e)).then(function(a) {
    n.updateBetCombinations(a), n.trigger("optionReady", n.options);
    var o = $.Deferred();
    n.parseResponseDate(o, e), $.when(o).then(function(e) {
      var a = e.response, o = e.result.filter(function(e) {return !e.not_valid});

      /////////////////////
      /////////////////////

      var result = [];
      if(n1){
        n1.forEach(function(nn){
          var nobj = {};
          nobj.id = nn.id;
          nobj.bets = [];
          for( var _o in nn.bets ){
            var bet = {};
            for( var _p in bets_def ){
              bet[_p] = nn.bets[_o][_p];
            }
            bet.bookmaker = {};
            for( _p in bets_bookmaker_def ){
              bet.bookmaker[_p] = nn.bets[_o].bookmaker[_p];
            }
            nobj.bets.push( bet );
          }
          result.push( nobj );
        });
      }
      console.error("postMessage", result);
      window.postMessage({arbs:result}, window.location.origin);
      /////////////////////
      /////////////////////

      for (; n.length;) {
        var i = n.first();
        n.remove(i)
      }
      n.reset(), n.add(o);
      var s = {
        isLive: n.settings.isLive,
        data: n.settings.data,
        api_url: n.settings.api_url
      };
      n.models.forEach(function(e) {
        e.setSettings({
          settings: s,
          currentUser: n.currentUser,
          arbSettings: n.arbsSettings
        })
      }), n.checkNotifications(), n.trigger("updateGroupedArbs", {
        arbs: a.event_arbs,
        bets: a.bets,
        wrongItems: a.wrong_items
      }), n.trigger("afterParse", {
        models: n.models,
        filters_count: t
      }), o = null, a = null
    })
  })
}
