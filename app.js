var fs = require("fs");
var P = require("pdf2json");
var p = new P();
var l = console.log;

var G = {};
var B = {};
var CARDS = [];
var kid=""; 

var stroke = [
  "",
  "Fly",
  "Back",
  "Breast",
  "Free",
]

var segment = function(str){
	str = str.trim();
	var a = str.search(/[0-9]\/[0-9]/);
	if ( a == -1 ){
		//no heat lane
		var p = str.split(/ /g);	
    var event_num = parseInt( p[0].trim(), 10);
    var spot="NA";
    var role="NA";
    var role_pos=0;
    if ( p[ p.length -1 ].search(/[0-9]/) !== -1 ){
      spot = parseInt( p.pop(), 10);
    }
    else if ( p[ p.length -1 ].search(/Back|Breast|Fly|Free/i) !== -1 ){
      role = p.pop();
      spot = stroke.indexOf( role );
    }

    var heat = p.pop();

    var event_txt = p.slice(1).join(" ").trim();
    var o = {
      is_relay: true,
      role_pos: role_pos,
      lane: "NA", 
      heat: heat,
      role:role,
      spot: spot,
      best_time: "NA",
      event_num: event_num, event_txt:event_txt
    };
    return o;
	}
	else{
    var heat_lane = str.substr(a,3);
    var heat = parseInt( heat_lane.substr(0,1), 10);
    var lane = parseInt(heat_lane.substr(-1),10);

    if ( str.search(/Relay/i) !== -1 ){ 
      var best_time = "NA";
      var is_relay=true;
      var spot = str.substr(a+3).trim();
      if ( spot.search(/Back|Breast|Fly|Free/i) !== -1 ){
        var role=spot.toString();
        spot="NA";
      }
    }
    else {
      var best_time = str.substr(a+3).trim();
      var is_relay=false;
      var role = "NA";
      var spot="NA";
    }

		var p = str.split(/ /g);	
    var txt = str.substr(0,a).trim();
    var txt_p = txt.split(/ /g);
    var event_num = parseInt( txt_p[0].trim(), 10);
    var event_txt = txt_p.slice(1).join(" ").trim();
    var o = {
      heat: heat, lane: lane, 
      best_time: best_time, 
      event_num: event_num, 
      event_txt:event_txt,
      spot:spot,
      role_pos: 0,
      role:role
    };
	}

  return o;

}

var page = function(p){
	var bkt=false;	
	var sit = false;
	var slot=false;
	var name_part="";
	var clear_kid=0;
	var txt = [];
 	p.Texts.forEach(function(t,idx){	
 		//u.json_log(t);
		var str = unescape(t.R[0].T).trim();
		txt.push(str);
	})


	txt = txt.join("_");
	//l(txt);
	var start_pos = txt.search(/GIRLS|BOYS/);
	var g_or_b = txt.substr(start_pos, 4);

	if ( g_or_b === "GIRL" ){ 
		bkt=G;
		var pos = start_pos+5;
	}
	else {
		bkt=B;
		var pos = start_pos+4;
	}

	txt = txt.substr(pos);	
	//l(txt);

	var rg = /_[A-Z][a-z_]{1,30}[_]{0,1},[_]{0,1}[ ]{0,1}[A-Z][a-z]{1,30}/g;
	var rg = /_[A-Z][a-z_ ]{1,30}[_]{0,1},[_]{0,1}[ ]{0,1}[A-Z][a-z]{1,30}/g;

	var parts = [];
	var j = 0;
	while ((myArray = rg.exec(txt)) !== null) {
	  var msg = 'Found ' + myArray[0] + ' at ' + myArray.index;
	  msg += 'Next match starts at ' + rg.lastIndex;
	  parts.push(   myArray[0] );
	  //console.log(msg);
	  j++;
  }
	//l(j);


	var rows = txt.split( rg );
	var good_rows = [];
	var last_part = "";
	parts.forEach(function(prt,idx){
		var p = prt.split(/_/g);
		var r = rows[idx+1];
    var b = p.slice(1).join("") + r;
		b =  b.replace(/_/g," ");
	//	l(b);
		good_rows.push(b);
    //l(good_rows[ good_rows.length-1 ] );
    
	});
	//l('test'); l(good_rows.length);

	//u.json_.log(good_rows);
	//process.exit();
		
	good_rows.forEach(function(r){
		var p = r.split(/#/g);
		var kid = { sex: g_or_b,  nm: p[0], events: []  };
		var rec = { sex: g_or_b,  nm: p[0] };
    l(rec.nm);
		for(var i =1; i < p.length; i++){
		  var o =  segment(p[i]);
		  var q =  segment(p[i]);
      l("\t"+p[i]);
		  kid.events.push(o);
      q.sex = g_or_b;
      q.nm = p[0];
      CARDS.push( q );
		}
    //l(q);
    //l(kid);
	});


  //u.json_log(CARDS);
  //process.exit();
}



var alpha = "__ABCDEFGHIJKLM".split("");
var onParse = function(a,b,c){
	//l(a,b,c);

	for(var i = 0; i < a.data.Pages.length; i++)
		page(a.data.Pages[i]);

  CARDS.sort(function(a,b){
    if ( a.event_num > b.event_num ) return 1; if ( a.event_num < b.event_num ) return -1;

      
    if ( isNaN(a.heat) ) var heatA = alpha.indexOf(a.heat); else var heatA = a.heat;
    if ( isNaN(b.heat) ) var heatB = alpha.indexOf(b.heat); else var heatB = b.heat;
    //if ( b.heat.search(/[A-Z]/)!==-1 ) var heatB = alpha.indexOf(b.heat); else var heatB = b.heat*1;

    if ( heatA > heatB ) return 1; if ( heatA < heatB ) return -1;
    if ( a.lane > b.lane ) return 1; if ( a.lane < b.lane ) return -1;
    if ( a.spot > b.spot ) return 1; if ( a.spot < b.spot ) return -1;
  });
  var last_num=false;
  var last_heat=false;
  var last_lane=false;
  //u.json_log(CARDS);
  CARDS.forEach(function(c){
      if ( last_num !== c.event_num ){
        l( "#" + c.event_num + " " + c.event_txt );
        last_heat = false;
      }
      if ( last_heat !== c.heat ){
        l("\tHEAT " + c.heat);
      } 

      if ( c.role===undefined) c.role=="NA";
      if ( c.spot===undefined) c.spot=="NA";
      
      if ( c.role==="NA" && c.spot==="NA" )
        l("\t\t"+ [ "LANE: " + c.lane, c.nm ].join(" ") );
      else if ( c.role==="NA" && c.spot!=="NA" )
        l("\t\t"+ [ "LANE: " + c.lane, c.nm, "SPOT:" + c.spot ].join(" ") );
      else if ( c.role!=="NA" && c.spot==="NA" )
        l("\t\t"+ [ "LANE: " + c.lane, c.nm, "ROLE:" + c.role ].join(" ") );
      else if (c.role==undefined) 
        l("\t\t"+ [ "LANE: " + c.lane, c.nm, "SPOT:" + c.spot ].join(" ") );
      else 
        l("\t\t"+ [ "LANE: " + c.lane, c.nm, "ROLE: " + c.role , "SPOT:" + c.spot ].join(" ") );
      
      last_num = c.event_num;
      last_heat= c.heat;
      last_lane = c.lane;
    
  });
};

p.on("pdfParser_dataReady",onParse);

fs.readFile("./data.pdf",function(err,pb){

	if (err){
		l("Got error");
		console.log(err);
		process.exit();
	}

	p.parseBuffer( pb );
});
