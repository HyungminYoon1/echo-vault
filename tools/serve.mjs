import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
const root = await realpath(resolve("dist"));
const port=Number(process.argv[2]??0);
if(!Number.isInteger(port)||port<0||port>65535)throw new RangeError("Invalid port");
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
const server=http.createServer(async(req,res)=>{
  try{
    if(!["GET","HEAD"].includes(req.method)){res.writeHead(405,{Allow:"GET, HEAD"}).end();return;}
    const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    let target=resolve(root,"."+pathname);
    if(target!==root&&!target.startsWith(root+sep)){res.writeHead(403).end();return;}
    if((await stat(target)).isDirectory())target=resolve(target,"index.html");
    target=await realpath(target);
    if(!target.startsWith(root+sep)){res.writeHead(403).end();return;}
    const body=await readFile(target);
    res.writeHead(200,{"Content-Type":types[extname(target)]??"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}).end(req.method==="HEAD"?undefined:body);
  }catch{res.writeHead(404).end("Not found");}
});
server.listen(port,"127.0.0.1",()=>console.log("Local: http://127.0.0.1:"+server.address().port+"/"));
