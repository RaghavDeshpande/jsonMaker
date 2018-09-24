const fs = require('fs');
const readline = require('readline');
const _ =  require('underscore');
const keywords = ["LOCATION", "EQUIP fl", "MANUFACT", "INSTL BY", "DATE", "THROUGH", "MODEL", "SERIAL#", "EQ TYPE", "WARRANTY"];

const options = {
  flag:'r',
  encoding:null,
  fd:null,
  mode:0o666,
  autoClose: true
};
const strm = fs.createReadStream('1Equip100 (1).csv', options);
const rl = readline.createInterface({
  input: strm
});
var jsonData = {};
var currentAddress = '';
var equipNumber = 0;



/*
* Function to see if the line contains keywords and extract them accordingly.
*/
function processLine(str){
  let temp = {};
  keywords.forEach((key)=>{
    if(str.includes(key)){
      temp[key] = str.indexOf(key);
    } else {
      return;
    }
  });
  if(temp && Object.keys(temp).length)
    extract(str, temp);
  else
    return;
}
/*
* Function to make dictonary.
*/
function extract(str, obj){
  if(str.includes("LOCATION")){
    currentAddress = str.substring("LOCATION:".length, str.length).trim();
    jsonData[currentAddress] =  jsonData[currentAddress] || {"equipments":[]};
    rl.resume();
    return;
  }

  var cut1 = _.invert(obj)[_.min(obj)] || '';
  if(cut1){
    delete obj[cut1];
    // console.log("after delete",obj);
  }

  var cut2 = _.invert(obj)[_.min(obj)] || '';

  var equip ;
  if(cut1 == 'EQUIP fl'){
    equip = {};
  } else {
    equip = jsonData[currentAddress]["equipments"].pop() || {};
  }

  if(cut1){
    let cutHere = str.indexOf(cut1) + cut1.length + 1; // +1 for the semicolon
    if(cut2){
      equip[cut1] = str.substring(cutHere, str.indexOf(cut2) );
      equip[cut1]  = equip[cut1]  ? equip[cut1].trim() : '';
    } else {
      equip[cut1]  =  str.substring(cutHere, str.length);
      equip[cut1]  = equip[cut1] ? equip[cut1].trim() : '';
    }
    jsonData[currentAddress]["equipments"].push(equip);
  }
  if(obj && Object.keys(obj).length)
    extract(str, obj);
  else {
    // console.log(jsonData);
    rl.resume();
    return;
  }
}


// EVENT HANDLERS.
strm.on("close",()=>{
  // console.log(jsonData);
  fs.writeFile("output.json", JSON.stringify(jsonData), 'utf8', function(err){
    if(err){
      return console.log('write to file failed: ',err);
    }
    console.log("write to file done");
  })
});

rl.on('line', (input)=>{
  rl.pause();
  processLine(input.trim());
});
