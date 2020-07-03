var socket = io.connect('http://localhost:4000');
const url = document.URL;
const createNewGroupBtn = document.getElementById('createNewGroupBtn');
const newGroupName = document.getElementById('newGroupName');
const newGroupPassword = document.getElementById('newGroupPassword');
const createGroupError = document.getElementById('createGroupError');
const singInGroupBtn = document.getElementById('singInGroupBtn');
const homeBtn = document.getElementById('homeBtn');
const logoutBtn = document.getElementById('logout');


outputNavBar();

createNewGroupBtn.addEventListener('click',()=>{
    var valideName = validGroupName(newGroupName.value);
    if(valideName == true){
        socket.emit('createNewGroup',{
            groupName:newGroupName.value,
            groupPassword: newGroupPassword.value,
            username:getInfo(),
            socketid:socket.id
        });
    }
})

function outputNavBar(){
    homeBtn.innerHTML =
    `<a id="homeBtn"class="nav-item nav-link active" 
    href="http://localhost:4000/workSpace/${getInfo(url)}">
    Home <span class="sr-only">(current)</span></a>
    `;

    createGroupBtn.innerHTML =
    ` <a id="createGroupBtn" class="nav-item nav-link" 
    href="http://localhost:4000/${getInfo(url)}/newGroup">
    CREATE GROUP</a>`

    singInBtn.innerHTML =
    ` <a id ="singInBtn"class="nav-item nav-link" 
    href="http://localhost:4000/${getInfo(url)}/joinGroup">
    SING IN</a>
    `

    logoutBtn.innerHTML =
    ` <button id ="logoutBtn" type="button" class="btn btn-danger">
    Log Out</button>
    `
}

socket.on('createNewGroup',data=>{
    window.location.href=`http://localhost:4000/workSpace/${data.user}/${data.groupId}`
});

socket.on('creaeteGroupError',data=>{
    createGroupError.innerHTML = data.err;
});

function validGroupName(name){
    for(var i=0;i<name.length;i++){   
       if(name[i]==' ' || 32>name[i].charCodeAt() || name[i].charCodeAt()>127 ){
           alert('Group name cannot include space');
           return false;
       }
    }
    return true;
}

function getInfo(url){
    var url = document.location.toString();
　　var arrUrl = url.split("/");
    var user = arrUrl[3];
　　return user;
};

logoutBtn.addEventListener('click',()=>{
    console.log('logout...');
    socket.emit('logout',{
        user:getInfo()
    })
    window.location.href="http://localhost:4000/login"
})