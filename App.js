const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
//const upload = require('express-fileupload');
const multer = require('multer');
const { resolve } = require('path');


// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
//app.use(upload());
app.set('view-engin','ejs');
app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret:'used',
  resave:false,
  saveUninitialized: true
}));

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  // fileFilter: function(req, file, cb){
  //   checkFileType(file, cb);
  // }
}).single('fliename');

//connect database
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'chat_app_DB'
  });
  db.connect((err)=>{
    if(err){
      throw err;
    }
    else{
      console.log('chat_app_DB connected...');
    }
  });

//socket
io.on('connection',socket =>{
  console.log('new socket: '+ socket.id);
  socket.on('joinRoom',({username,groupId})=>{
    userJointoGroup()
    async function userJointoGroup(){
      const user =  await userJoin(socket.id,username,groupId);
      socket.join(user.groupId);
      await updateStatus(user.username,user.groupId,'Online');
      const list = await groupUserList(user.groupId);
      // const grouphistory = await getGroupChatHistory(user.groupId);
      io.to(user.groupId).emit('groupUserList', {
        userList:JSON.stringify(list),
        user:user
      });
      io.to(user.groupId).emit('message',{
        username:user.username,
        userMessage:`${user.username} has join the chat`
      });
    }
  });

  socket.on('markedMsgPage',data=>{
   process();
   async function  process(){
     console.log('id: '+ socket.id)
    var result =await  findMarkedMessage(data.username);
    io.to(socket.id).emit('loadMarkMessage',{result:result});
    }
    
  })

  socket.on('searchMarkedMsg',data=>{
    console.log(data);
    process();
    async function process(){
      var result = await searchMarkedMessage(data.username,data.keywords);
      io.to(socket.id).emit('searchMarkedMsgResult',{result:result});
    }
  });

  socket.on('removeMarkedMsg',data=>{
    process();
    async function process(){
     var result = await removeMarkedMsg(data.id);
     io.to(socket.id).emit('removeMarkedMsg', {result:result});
    };
  });

  socket.on('getHistory',data=>{
    process();
    async function process(){
      unreadUserList = await unreadmessage(data.username);
      const grouphistory = await getGroupChatHistory(data.groupId);
      io.to(data.socketId).emit('getHistory',{
        unreadUserList:JSON.stringify(unreadUserList),
        groupChathistory:JSON.stringify(grouphistory)
      });
    }
  });

  socket.on('chatMessage',data=>{
    process();
    async function process(){

      const user = await getUserByName(data.username,data.groupId);
      await saveGroupMessage(data);
      io.to(user[0].groupid).emit('message',data);
    };
  })

  socket.on('privateChat',data=>{
    process();
    async function process(){
     const groupId ='p' + new Date().getTime();
     await updatePreviousChat(data.sender,data.receiver);
     const user =  await userJoin(socket.id,data.sender,groupId);

     const chathistory = await getChatHistory(data.sender,data.receiver);
     io.to(socket.id).emit('chatRecord',{
      chathistory:JSON.stringify(chathistory)
      });
    }
  });

  socket.on('privateMessage', data=>{
    process();
    async function process(){
      var Messagedata = await findMessage(await saveMessage(data));
      const receiver = await finduser(Messagedata[0].receiverid);
     await transferMessage(receiver,Messagedata);
    };
  });
  
  socket.on('readMessage',data=>{
    process();
    async function process(){
      await updateMessage(data);
      const user = await finduser(data.sender);
      for(var i = 0;i<user.length;i++){
        io.to(user[i].socketid).emit('updatePage',{receiver:data.receiver});
      };
    }
  });

  socket.on('workSpace',data=>{
    process()
    async function process(){
      const groupId ='ws' + new Date().getTime();
      const user =  await userJoin(socket.id,data,groupId);
      var list = await userList(data);
      io.to(socket.id).emit('workSpace',{
        user:data,
        list:list,
      });
    }
  });

  socket.on('createNewGroup', data=>{
    process();
    async function process(){
      var groupId = data.groupName.toLowerCase();
      var password = data.groupPassword;
      var user = data.username.toLowerCase();
      var addGroup = await addNewGroup(groupId,password);
      await addUseringroup(groupId,user)
      if(addGroup == true){
        io.to(data.socketid).emit('createNewGroup',{
          groupId:groupId,
          groupPassword:password,
          user:user
        })
      }else{
        io.to(data.socketid).emit('creaeteGroupError',{err:'group exist'});
       }
    };
  })

  socket.on('joinGroup',data=>{
   joinGroup();
    async function joinGroup(){
      let groupname = data.groupName.toLowerCase();
      let groupPassword = data.groupPassword;
      let username =data.username.toLowerCase();
      let result = await valideGroup(groupname, groupPassword);
      if(result != true){
        //faile valide
        io.emit('joinGroupError',{err:result});
      }else{
        await addUseringroup(groupname,username);
        io.to(data.socketid).emit('joinGroup',{
          groupname:groupname,
          grouppassword:groupPassword,
          username:username
        })
      }
    }
    })

  socket.on('logout',data=>{
    process();
    async function process(){
      await logout(data.user);
    }
  });

  socket.on('disconnect',()=>{
  process();  
  async function process(){
    const user = await getUser(socket.id);
    await userLeave(socket.id);
    //await logout(user[0].username);
    if(user.toString()!=''){
      io.to(user[0].groupid).emit('message',{
        username:user[0].username,
        userMessage:`${user[0].username} has left the chat`
      });
      updateStatus(user[0].username,user[0].groupid,'Offline');
    }
    //update userList in group chat 
  }  
  });

  socket.on('upload',data=>{
    process();
    async function process(){
      console.log(data.file);
      await uploadFile(data.user,data.file,data.groupid);
    }
  })

  socket.on('search',data=>{
    process();
    async function process(){
      var result = await search(data.keywords);
      result = await formatearchData(result);
      io.to(socket.id).emit('searchResult',{
        result:result
      })
    }
  })

  socket.on('markMessage',data=>{
    process();
    async function process(){
 
      var result;
      var msg = await findGroupMessage(data.messageid);
      var valideMarkMessage = await valideMarkMsg(data.messageid,data.user);
      if(valideMarkMessage == true){
        result = await markMessage(msg,data.user);
      }
      else{
        result = false;
      }
      io.to(data.socketid).emit('markMessage',{
        result:result
      })
    }
  })

  socket.on('getMarkedMsg', data=>{
 
  });
});

  //router
app.get('/register',(req,res)=>{
    res.render('register.ejs');
})
.post('/register', (req, res) => {
  var userName = req.body.username.toLowerCase();
  var email = req.body.email.toLowerCase();
  //checkValid(userName,email);
  // should hase password later.
  let newUser = {username:userName,email:email, password:req.body.password};
  let sql = 'INSERT INTO userinfo SET ?';
    let query = db.query(sql,newUser,(err,result)=>{
      if(err){
        //alter box here
        //popup.alter('err');
        return res.render('register.ejs');
      }     
      res.redirect('login');
    })
})
.get('/login',(req,res)=>{
  res.render('login.ejs',{
    err: null
  });
})
.post('/login', (req, res) => {
  process();
  async function process(){
    var userName = req.body.username.toLowerCase();
    var password = req.body.password;
    const uservalide = await valideUser(userName,password);
    if(uservalide == false){
      res.redirect('register');
    }
    else if(uservalide == 'password wrong'){
      res.render('login.ejs',{
        err:'password wrong'
      });
    }
    else{
      await addUserLogin(userName);
      res.redirect(`workSpace/${userName}`);
    }
  }
})
.get('/workSpace/:userId',(req,res) =>{
  process();
  async function process(){
    const valideUserLogin = await checkUserLogin(req.params.userId);
    if(valideUserLogin == true){
      var list = await userList(req.params.userId);
      return res.render('workSpace.ejs');  
    }else{
      return res.redirect('/login');
    }
  }
})
.get('/:userId/newGroup',(req,res)=>{
  process();
  async function process(){
    const check = await checkUserLogin(req.params.userId);
    if(check == true){
      res.render('newGroup.ejs');
    }
    else{
      res.redirect('/login');
    }
  }
})
.get('/:userId/joinGroup',(req,res)=>{
  process();
  async function process(){
    const check = await checkUserLogin(req.params.userId);
  if(check == true){
    res.render('joinGroup.ejs');
  }
  else{
    res.redirect('/login');
  }
  }
})
.post('/joinGroup',(req,res) =>{
  joinGroup();
  async function joinGroup(){
    let groupname = req.body.groupName;
    let groupPassword = req.body.password;
    let username = req.body.userId.toLowerCase();
    let result = await valideGroup(groupname, groupPassword);
    if(result != true){
      //faile valide
      let list =  await userList(req.body.userId);
      return res.render('workSpace.ejs',{
        userId:req.body.userId.toLowerCase(),
        userList:list,
        error:result
      });
    }else{
      //pass valide
      await addUseringroup(groupname,username);
      res.redirect(`workSpace/${username}/${groupname}`);
    }
  }
})
.post('/loginGroup',(req,res)=>{
  let username = req.body.userId;
  let groupId = req.body.groupBtn;
  res.redirect(`workSpace/${username}/${groupId}`);
})
.get('/workSpace/:userId/:groupId',(req,res)=>{
  process();
  async function process(){
    const checkuser = await checkUserLogin(req.params.userId);
    const checkGrp = await checkGroup(req.params.groupId);
    if(checkuser == true){
      if(checkGrp == true){
        res.render('groupChatRoom.ejs');
      }else{
        res.redirect(`/`);
      } 
    }
    else{
      res.redirect('/login');
    }
    // let result = await groupUserList(groupId);
  }; 
  
})
.get('/workSpace/:userId/privateChat/:receiverId',(req,res)=>{
  process();
  async function process(){
    const checkUser = await checkUserLogin(req.params.userId);
    const checkReceiver = await valideUser(req.params.receiverId);
    if(checkUser == true && checkReceiver != false){
      res.render('privateChat.ejs');
    }
    else if(checkUser != true){
      res.redirect('/login');
    }
    else{
      res.redirect('/');
    }
  }

})
.post('/upload',(req,res)=>{
    upload(req, res, (err) => {
      if(err){
       throw err
      } else {
        var file = `uploads/${req.file.filename}`
        uploadFile('uploaduser',file,'groupid')
      }
  });
})
.get('/markedMessage/:userId',(req,res)=>{
  res.render('markedMsg.ejs');
});

//function
function removeMarkedMsg(id){
  return new Promise((resolve,reject)=>{
    let sql = `DELETE FROM markedmessage WHERE id ='${id}'`
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};        
      resolve(true);
    })
})
}

function valideMarkMsg(messageid,user){
  return new Promise((resolve,reject)=>{
    console.log("id: "+ messageid + " user: "+ user);
    let sql = `SELECT * FROM markedMessage WHERE markedUser = '${user}' && messageId = '${messageid}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      if(result.toString() == ''){
        console.log('true');
        resolve(true);
      }else{
        console.log(result);
        console.log('false');
        resolve(false);
      }
    });
  });
}

function findMarkedMessage(username){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM markedmessage WHERE markedUser ='${username}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      };
      resolve(result);
    })
  });
}

function searchMarkedMessage(username,keywords){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM markedmessage WHERE markedUser = '${username}' && message like '%${keywords}%'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(result);
    });
  });
}

function search(keywords){
  return new Promise((resolve,reject)=>{
    console.log('keywords type:' + typeof(keywords));
    var temp =[];
    let sql = `SELECT * FROM groupchathistory WHERE message like '%${keywords}%'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(result);
    });
   
  });
}

function checkGroup(groupId){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM groups WHERE groupId = '${groupId}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      if(result.toString() != ''){
        resolve(true);
      }else{
        resolve(false);
      }
    });
  });
}

function addUserLogin(user){
  return new Promise((resolve,reject)=>{
    let newUser = {username:user}
    let sql = 'INSERT INTO loginuser SET ?';
    let query = db.query(sql,newUser,(err,result)=>{
      if(err){throw err};
      resolve(true);
    });
  });
};

function valideUser(user,password){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM userinfo WHERE username ='${user}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      }else{
       if(result.toString()==''){
         resolve (false);
       }
       else{
         if(result[0].password != password){
           resolve('password wrong');
         }else{
          resolve(true);
         }
       }
      }
    })
  });
}


function checkUserLogin(user){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM loginuser WHERE username ='${user.toLowerCase()}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      }else{
       if(result.toString()==''){
         console.log('false');
         resolve (false);
       }
       else{
        console.log('true');
        resolve(true);
       }
      }
    })
  });
};

//check group exist and password 
function valideGroup(groupname, password){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM groups WHERE groupId = '${groupname}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      if(result.toString() != ''){
        if(result[0].password.toString() == password){
          resolve(true);
        }else{
          resolve('wrong password...')
        }
      }else{
        resolve('group not exist...');
      }
    });
  });
}


function userList(name){
  return new Promise((resolve,reject)=>{
    var list = [];
    let sql = `SELECT * FROM useringroup WHERE username = '${name.toLowerCase()}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      };
        for(var i=0;i<result.length;i++){
          list.push(result[i].groupid);
      }
      resolve (list);
    })
  });
  
};

function addNewGroup(groupId,password){
  return new Promise((resolve, reject)=>{
    let newGroup = {groupId:groupId,password:password};
    let sql = 'INSERT INTO groups SET ?';
    let query = db.query(sql,newGroup,(err,result)=>{
      if(err){
        resolve('group exist');
      }else{
        resolve(true); 
      }   
    });
  });
};


function addUseringroup(groupId,username){
  return new Promise((resolve, reject)=>{
    let newUserInGroup = {groupid:groupId, username:username};
    let sql = `SELECT * FROM useringroup WHERE groupid = '${groupId}' && username ='${username}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){throw err};
      if(result.toString() !=''){
        console.log('you already in the group...');
        resolve(false);
      }else{
        sql = 'INSERT INTO useringroup SET ?';
        query = db.query(sql,newUserInGroup,(err,result)=>{
       if(err){
          throw(err);
        }else{
          console.log('new user add in group');
          resolve(true);
        }     
      })
      }
    });
    
  });
};

//from useringroup DB, no socket.id
function groupUserList(groupId){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM useringroup WHERE groupid='${groupId}'`;
  var list=[];
  let query = db.query(sql,(err,result) =>{
    if(err){throw err};
    for(var i =0;i<result.length;i++){
      var temp = {name:result[i].username, status:result[i].active,unread:result[i].unreadmessage}
      list.push(temp);
    };
    resolve(list);
  });
  });
};

function updateStatus(username,groupId,status){
  return new Promise ((resolve,reject)=>{
    let sql = `UPDATE useringroup SET active= '${status}' WHERE username = '${username}' && groupid = '${groupId}'`
    let query = db.query(sql,(err,result)=>{
    if(err){throw err;};
    });
    resolve();
  });
 
};

function  updatePreviousChat(sender,receiver){
  return new Promise((resolve,reject)=>{
    const id = new Date().getTime();
    let count = 0;
    let sql = `SELECT * FROM previouschat WHERE username1 = '${sender}' && username2 = '${receiver}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){
        throw err
      }
      if(result.toString() == ''){
        let newRecord = {id:id,username1:sender,username2:receiver};
        sql = `INSERT INTO previouschat SET ?`;
        query = db.query(sql,newRecord,(err,result)=>{
          if(err){
            throw(err);
          }else{
            resolve(true)
          }     
        })
      }
      else{
        resolve(false);
      }     
    });
  });
};


function getChatHistory(sender,receiver){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM chathistory WHERE 
    senderid='${receiver}' && receiverid='${sender}'
    OR
    senderid='${sender}' && receiverid ='${receiver}'`
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(result);
    });
  });
}

function saveMessage(data){
  return new Promise((resolve,reject)=>{
    let newRecord = 
    {
      senderid:data.sender,
      receiverid:data.receiver,
      message:data.message,
      time:getTime(),
      status:'no'
    };
    sql = `INSERT INTO chathistory SET ?`;
    query = db.query(sql,newRecord,(err,result)=>{
      if(err){
        throw(err);
      }   
      resolve(result.insertId);
    });
  });
};

function saveGroupMessage(data){
  return new Promise((resolve,reject)=>{
    let newRecord = 
    {
      id:data.id,
      senderid:data.username,
      receiverid:data.groupId,
      message:data.userMessage,
      time:getTime(),
    };
    let sql = `INSERT INTO groupchathistory SET ?`;
    let query = db.query(sql,newRecord,(err,result)=>{
      if(err){
        throw(err);
      }   
      resolve(true);
    });
  });
};

function getGroupChatHistory(groupId){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM groupchathistory WHERE receiverid='${groupId}'`
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(result);
    });
  });
}


function getTime(){
  var currentdate = new Date(); 
  var datetime =  currentdate.getMonth()+1 +"/"+
                  currentdate.getDate() +"/"+
                  currentdate.getFullYear() +" "+
                  currentdate.getHours() +":"+
                  currentdate.getMinutes() + ":" +
                  currentdate.getSeconds();
  return datetime;
}

function unreadmessage(user){
  return new Promise((resolve,reject)=>{
    
    let sql = `SELECT DISTINCT senderid FROM chathistory WHERE receiverid='${user}' && status ='no'`
    let query = db.query(sql,(err,result)=>{
      if(err){throw(err)}
      else{
        resolve(result);
      }
    });
  });
}

function uploadFile(uploaduser,file,groupid){
  return new Promise((resolve,reject)=>{
    let newFile = {id:Date.now(), uploaduser:uploaduser, file:file,groupid:groupid}
    let sql = 'INSERT INTO uploadfile SET ?';
    let query = db.query(sql,newFile,(err,result)=>{
      if(err){throw err};
      resolve(true);
    });
  });
}

function findGroupMessage(messageid){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM groupchathistory WHERE id = '${messageid}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(result[0]);
    });
  });
}


function markMessage(data,user){
  return new Promise((resolve,reject)=>{
    let markedMsg = {messageId:data.id,markedUser:user,senderid:data.senderid,receiverid:data.receiverid,message:data.message,msgtime:data.time,markedtime:getTime()};
    let sql = 'INSERT INTO markedmessage SET ?';
    let query = db.query(sql,markedMsg,(err,result)=>{
      if(err){resolve(false)};
      resolve(true);
    });
  });
}


function formatearchData(data){
  return new Promise((resolve,reject)=>{
    var temp = [];
    for(var i=0;i<data.length;i++){
      temp[i] = {sender:data[i].senderid,msg:data[i].message,time:data[i].time};
    }
    resolve (temp);
  });  
}

function logout(username){
  return new Promise((resolve,reject)=>{
  let sql = `DELETE FROM loginuser WHERE username ='${username}'`
  let query = db.query(sql,(err,result)=>{
  if(err){throw err};
    resolve(true);
  })
  })
};

function updateMessage(data){
  return new Promise((resolve,reject)=>{
    let sql = `UPDATE chathistory SET status = 'yes' WHERE senderid = '${data.receiver}' && receiverid = '${data.sender}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(true);
    });
  });
};

function findMessage(id){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM chathistory WHERE id = '${id}'`;
    let query = db.query(sql,(err,result)=>{
      if(err){throw err};
      resolve(result);
    });
  });
}

function transferMessage(receiver,data){
  return new Promise((resolve,reject)=>{
   
    if(receiver.length != 0){
      //receiver online
      for(var i = 0; i< receiver.length;i++){
        io.to(receiver[i].socketid).emit('newMessage',{
          message:data,
        });
      };
      resolve(true);
    }else{
      resolve(false);
      //save message then send to receiver when receiver back online.
    }
   
  });
};


// socket function 
function userJoin(socketId,username,groupId){
  return new Promise((resolve,reject)=>{
    const user = {socketId,username,groupId};
    let sql = 'INSERT INTO currentchat SET ?';
      let query = db.query(sql,user,(err,result)=>{
        if(err){throw err}; 
        resolve (user);
      })
  }) 
};

function userLeave(socketid){
  return new Promise((resolve,reject)=>{
      let sql = `DELETE FROM currentchat WHERE socketid ='${socketid}'`
      let query = db.query(sql,(err,result)=>{
        if(err){throw err};        
        resolve(true);
      })
  })
};

function getUser(socketid){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM currentchat WHERE socketid ='${socketid}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      };
      resolve(result);
    })
  })
};

function finduser(username){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM currentchat WHERE username ='${username}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      };
      resolve(result);
    })
  })
};

function getUserByName(username,groupId){
  return new Promise((resolve,reject)=>{
    let sql = `SELECT * FROM currentchat WHERE username ='${username}' && groupid ='${groupId}'`;
    let query = db.query(sql,(err,result) =>{
      if(err){
        throw error;
      };
      resolve(result);
    })
  })
};


//listen
http.listen(4000, () => {
    console.log('listening on *:4000');
});

//default router
app.use(function(req, res){
 res.render('err.ejs');
});
