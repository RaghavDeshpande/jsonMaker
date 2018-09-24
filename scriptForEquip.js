const fs = require('fs');
const readline = require('readline');
const _ =  require('underscore');

const options = {
  flag:'r',
  encoding:null,
  fd:null,
  mode:0o666,
  autoClose: true
}
const strm = fs.createReadStream('1Equip100 (1).csv', options);
const rl = readline.createInterface({
  input: strm
});
const keywords = ["LOCATION", "EQUIP fl", "MANUFACT", "INSTL BY", "DATE", "THROUGH", "MODEL", "SERIAL#", "EQ TYPE", "WARRANTY"];

var master = {};
var currentKey = '';
var equipNumber = 0;



/*
* Function to see if the line contains keywords and extract them accordingly.
*/
function processLine(str){
  let temp = {};
  // console.log(str);
  keywords.forEach((key)=>{
    if(str.includes(key)){
      temp[key] = str.indexOf(key);
    } else {
      return;
    }
  });
  if(temp && Object.keys(temp).length){
    // console.log("temp", temp);
    extract(str, temp);

  }

  else
    return;

}
/*
* Function to make dictonary.
*/
function extract(str, obj){
  if(str.includes("LOCATION")){
    currentKey = str.substring("LOCATION:".length, str.length).trim();
    master[currentKey] =  master[currentKey] || {};
    equipNumber = 0;
  }

  var cut1 = _.invert(obj)[_.min(obj)] || '';
  if(cut1){
    delete obj[cut1];
    // console.log("after delete",obj);
  }

  var cut2 = _.invert(obj)[_.min(obj)] || '';
  if(cut1){
    let cutHere = str.indexOf(cut1) + cut1.length + 1; // +1 for the semicolon.
    var key2;
    if(cut1 == 'EQUIP fl'){
      equipNumber += 1;
      var key2 = "EQUIPMENT_" + equipNumber;
      master[currentKey][key2] = master[currentKey][key2] || {};
    }
    if(cut1 == "LOCATION"){
      var key2 = "EQUIPMENT_" + equipNumber;
      master[currentKey][key2] = master[currentKey][key2] || {};
      master[currentKey][key2][cut1] = str.substring(cutHere, str.indexOf(cut2) );
      master[currentKey][key2][cut1] = master[currentKey][key2][cut1] ? master[currentKey][key2][cut1].trim() : '';
    }
    
    if(cut2){
      master[currentKey][key2][cut1] = str.substring(cutHere, str.indexOf(cut2) );
      master[currentKey][key2][cut1] = master[currentKey][key2][cut1] ? master[currentKey][key2][cut1].trim() : '';
    } else {
      master[currentKey][key2][cut1] =  str.substring(cutHere, str.length);
      master[currentKey][key2][cut1] = master[currentKey][key2][cut1] ? master[currentKey][key2][cut1].trim() : '';
    }

  }
  if(obj && Object.keys(obj).length)
    extract(str, obj);
  else {
    // console.log(master);
    rl.resume();
  }
}


// EVENT HANDLERS.
strm.on("close",()=>{
  // console.log(master);
  fs.writeFile("output.json", JSON.stringify(master), 'utf8', function(err){
    if(err){
      console.log("An error occured while writitng to file");
      return console.log(err);
    }
    console.log("write to file done");
  })
});
rl.on('line', (input)=>{
  rl.pause();
  processLine(input.trim());
});
