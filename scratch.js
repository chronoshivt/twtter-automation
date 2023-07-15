const { read } = require("fs");

const fs = require("fs").promises;

var readable = "./mem_read.json";
var add = ["a", "b"];

console.log("running");
(async () => {
  var existingData = await fs.readFile(readable, "utf8", (err, fileData) => {
    if (err) throw err;
  });
  var edit = JSON.parse(existingData);
  console.log(edit);
  console.log(edit.memories);

  edit.memories.push(...add);
  await fs.writeFile(readable, JSON.stringify(edit), (err) => {
    if (err) throw err;
    console.log("appended");
  });
})();
// fs.readFile(readable, "utf8", (err, fileData) => {
//   if (err) throw err;
//   let existingData = JSON.parse(fileData);
//   console.log(existingData);
//   existingData.memories.push(...add);

//   fs.writeFile(readable, JSON.stringify(existingData), (err) => {
//     if (err) throw err;
//     console.log("File appended!");
//   });
// });
